import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './interfaces/http/modules/product.module';
import { TransactionModule } from './interfaces/http/modules/transaction.module';
import { PaymentWebhookController } from './interfaces/http/webhooks/payment-webhook.controller';
import { PRODUCT_REPOSITORY } from './domain/repositories/product-repository.port';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction-repository.port';
import { ProductPrismaRepository } from './infrastructure/persistence/repositories/product-prisma.repository';
import { PrismaTransactionRepository } from './infrastructure/persistence/repositories/prisma-transaction.repository';
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';

@Module({
  imports: [ProductModule, TransactionModule],
  controllers: [AppController, PaymentWebhookController],
  providers: [
    AppService,
    PrismaService,
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
export class AppModule {}
