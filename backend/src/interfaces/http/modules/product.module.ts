import { Module } from '@nestjs/common';
import { ProductController } from '../controllers/product.controller';
import { GetProductsUseCase } from '../../../application/use-cases/get-products.use-case';
import { PRODUCT_REPOSITORY } from '../../../domain/repositories/product-repository.port';
import { ProductPrismaRepository } from '../../../infrastructure/persistence/repositories/product-prisma.repository';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Module({
  controllers: [ProductController],
  providers: [
    PrismaService,
    GetProductsUseCase,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductPrismaRepository,
    },
  ],
})
export class ProductModule {}
