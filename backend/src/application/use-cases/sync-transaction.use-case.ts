import { Inject, Injectable } from '@nestjs/common';
import type { PaymentGatewayPort } from '../../domain/repositories/payment-gateway.port';
import { PAYMENT_GATEWAY_PORT } from '../../domain/repositories/payment-gateway.port';
import type { TransactionRepository } from '../../domain/repositories/transaction-repository.port';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction-repository.port';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product-repository.port';
import type { TransactionStatus } from '../../domain/value-objects/transaction-status';
import type { Transaction } from '../../domain/entities/transaction';

@Injectable()
export class SyncTransactionUseCase {
  constructor(
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly gateway: PaymentGatewayPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(tx: Transaction): Promise<Transaction> {
    if (!tx.gatewayReference || !tx.status.isPending) return tx;

    const result = await this.gateway.getTransactionStatus(tx.gatewayReference);
    if (!result.ok) return tx;

    const status = result.value;
    if (!['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(status)) return tx;

    await this.transactionRepo.updateStatus(tx.id, status as TransactionStatus);

    if (status === 'APPROVED') {
      try { await this.productRepo.decrementStock(tx.productId, tx.quantity); } catch {}
    }

    return (await this.transactionRepo.findById(tx.id))!;
  }
}
