import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { PaymentGatewayPort } from '../../domain/repositories/payment-gateway.port';
import {
  PaymentGatewayError,
  PAYMENT_GATEWAY_PORT,
} from '../../domain/repositories/payment-gateway.port';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction-repository.port';
import type { TransactionRepository } from '../../domain/repositories/transaction-repository.port';
import {
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product-repository.port';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import type { Transaction } from '../../domain/entities/transaction';
import type { TransactionStatus } from '../../domain/value-objects/transaction-status';
import { Result, ok, err } from '../common/result';

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentValidationError';
  }
}

export interface ProcessPaymentDto {
  transactionId: string;
  cardNumber: string;
  cardCvc: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolder: string;
  installments: number;
  customerEmail: string;
}

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(
    dto: ProcessPaymentDto,
  ): Promise<Result<Transaction, PaymentValidationError | PaymentGatewayError | Error>> {
    try {
      const transaction = await this.transactionRepository.findById(dto.transactionId);
      if (!transaction) {
        return err(new PaymentValidationError('Transaction not found'));
      }

      if (!transaction.status.isPending) {
        return err(
          new PaymentValidationError(
            `Transaction is in ${transaction.status.toString()} state, expected PENDING`,
          ),
        );
      }

      const tokensResult = await this.paymentGateway.getAcceptanceTokens();
      if (!tokensResult.ok) {
        await this.transactionRepository.updateStatus(transaction.id, 'ERROR');
        return tokensResult;
      }

      const cardResult = await this.paymentGateway.tokenizeCard({
        number: dto.cardNumber,
        cvc: dto.cardCvc,
        expMonth: dto.cardExpiryMonth,
        expYear: dto.cardExpiryYear,
        cardHolder: dto.cardHolder,
      });
      if (!cardResult.ok) {
        await this.transactionRepository.updateStatus(transaction.id, 'ERROR');
        return cardResult;
      }

      const reference = `TX-${transaction.id.substring(0, 8)}`;
      const amountInCents = Math.round(transaction.totalAmount.amount * 100);

      const integritySecret = process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET ?? '';
      const signatureString = `${reference}${amountInCents}COP${integritySecret}`;
      const signature = createHash('sha256').update(signatureString).digest('hex');

      const paymentResult = await this.paymentGateway.processPayment({
        amountInCents,
        currency: 'COP',
        customerEmail: dto.customerEmail,
        reference,
        cardToken: cardResult.value.token,
        installments: dto.installments,
        acceptanceToken: tokensResult.value.acceptanceToken,
        acceptPersonalAuth: tokensResult.value.acceptPersonalAuth,
        signature,
      });

      if (!paymentResult.ok) {
        await this.transactionRepository.updateStatus(transaction.id, 'DECLINED');
        return paymentResult;
      }

      await this.transactionRepository.saveGatewayReference(
        transaction.id,
        paymentResult.value.transactionId,
      );

      return ok(transaction);
    } catch (error) {
      try {
        await this.transactionRepository.updateStatus(dto.transactionId, 'ERROR');
      } catch {}
      return err(
        error instanceof Error
          ? error
          : new Error('Failed to process payment', { cause: error }),
      );
    }
  }
}
