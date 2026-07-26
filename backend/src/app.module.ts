import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './interfaces/http/modules/product.module';
import { TransactionModule } from './interfaces/http/modules/transaction.module';

@Module({
  imports: [ProductModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
