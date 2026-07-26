import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CreateTransactionUseCase,
  ValidationError,
  InsufficientStockError,
} from '../../../application/use-cases/create-transaction.use-case';
import {
  ProcessPaymentUseCase,
  PaymentValidationError,
} from '../../../application/use-cases/process-payment.use-case';
import { PaymentGatewayError } from '../../../domain/repositories/payment-gateway.port';
import { TRANSACTION_REPOSITORY } from '../../../domain/repositories/transaction-repository.port';
import type { TransactionRepository } from '../../../domain/repositories/transaction-repository.port';
import { Inject } from '@nestjs/common';
import { SyncTransactionUseCase } from '../../../application/use-cases/sync-transaction.use-case';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
    private readonly syncTransactionUseCase: SyncTransactionUseCase,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
  ) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const result = await this.createTransactionUseCase.execute({
      productId: body.productId as string,
      quantity: body.quantity as number,
      cardMasked: body.cardMasked as string | undefined,
      customer: body.customer as { fullName: string; email: string; phone: string },
      delivery: body.delivery as { address: string; city: string },
    });

    if (!result.ok) {
      if (result.error instanceof ValidationError) {
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof InsufficientStockError) {
        throw new BadRequestException(result.error.message);
      }
      throw new InternalServerErrorException(result.error.message);
    }

    return {
      id: result.value.id,
      status: result.value.status.toString(),
      quantity: result.value.quantity,
      totalAmount: result.value.totalAmount.amount,
      currency: result.value.totalAmount.currency,
      baseFee: result.value.baseFee.amount,
      deliveryFee: result.value.deliveryFee.amount,
      productPrice: result.value.productPrice.amount,
      cardMasked: result.value.cardMasked,
      createdAt: result.value.createdAt,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    let tx = await this.transactionRepo.findById(id);
    if (!tx) throw new NotFoundException('Transaction not found');

    tx = await this.syncTransactionUseCase.execute(tx);

    return {
      id: tx.id,
      status: tx.status.toString(),
      quantity: tx.quantity,
      totalAmount: tx.totalAmount.amount,
      currency: tx.totalAmount.currency,
      baseFee: tx.baseFee.amount,
      deliveryFee: tx.deliveryFee.amount,
      productPrice: tx.productPrice.amount,
      cardMasked: tx.cardMasked,
      gatewayReference: tx.gatewayReference,
      createdAt: tx.createdAt,
    };
  }

  @Post(':id/pay')
  async pay(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const result = await this.processPaymentUseCase.execute({
      transactionId: id,
      cardNumber: body.cardNumber as string,
      cardCvc: body.cardCvc as string,
      cardExpiryMonth: body.cardExpiryMonth as string,
      cardExpiryYear: body.cardExpiryYear as string,
      cardHolder: body.cardHolder as string,
      installments: (body.installments as number) ?? 1,
      customerEmail: (body.customerEmail as string) ?? (body.email as string) ?? '',
    });

    if (!result.ok) {
      if (result.error instanceof PaymentValidationError) {
        if (result.error.message.includes('not found')) {
          throw new NotFoundException(result.error.message);
        }
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof PaymentGatewayError) {
        throw new UnprocessableEntityException(result.error.message);
      }
      throw new InternalServerErrorException(result.error.message);
    }

    return {
      id: result.value.id,
      status: result.value.status.toString(),
      totalAmount: result.value.totalAmount.amount,
      currency: result.value.totalAmount.currency,
    };
  }
}
