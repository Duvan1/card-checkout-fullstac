import { Module } from '@nestjs/common';
import { TransactionController } from '../controllers/transaction.controller';
import { CreateTransactionUseCase } from '../../../application/use-cases/create-transaction.use-case';
import { PRODUCT_REPOSITORY } from '../../../domain/repositories/product-repository.port';
import { TRANSACTION_REPOSITORY } from '../../../domain/repositories/transaction-repository.port';
import { ProductPrismaRepository } from '../../../infrastructure/persistence/repositories/product-prisma.repository';
import { PrismaTransactionRepository } from '../../../infrastructure/persistence/repositories/prisma-transaction.repository';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Module({
  controllers: [TransactionController],
  providers: [
    PrismaService,
    CreateTransactionUseCase,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductPrismaRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
  ],
})
export class TransactionModule {}
