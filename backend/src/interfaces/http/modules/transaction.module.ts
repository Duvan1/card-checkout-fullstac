import { Module } from '@nestjs/common';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionUseCase } from '../../../application/use-cases/create-transaction.use-case';
import { ProcessPaymentUseCase } from '../../../application/use-cases/process-payment.use-case';
import { SyncTransactionUseCase } from '../../../application/use-cases/sync-transaction.use-case';
import { PRODUCT_REPOSITORY } from '../../../domain/repositories/product-repository.port';
import { TRANSACTION_REPOSITORY } from '../../../domain/repositories/transaction-repository.port';
import { PAYMENT_GATEWAY_PORT } from '../../../domain/repositories/payment-gateway.port';
import { ProductPrismaRepository } from '../../../infrastructure/persistence/repositories/product-prisma.repository';
import { PrismaTransactionRepository } from '../../../infrastructure/persistence/repositories/prisma-transaction.repository';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { PaymentGatewayAdapter } from '../../../infrastructure/payment-gateway/payment-gateway.adapter';

@Module({
  controllers: [TransactionController],
  providers: [
    PrismaService,
    CreateTransactionUseCase,
    ProcessPaymentUseCase,
    SyncTransactionUseCase,
    PaymentGatewayAdapter,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductPrismaRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: PaymentGatewayAdapter,
    },
  ],
})
export class TransactionModule {}
