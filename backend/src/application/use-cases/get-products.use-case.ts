import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product-repository.port';
import type {
  ProductRepository,
  ProductFilters,
} from '../../domain/repositories/product-repository.port';
import type { Product } from '../../domain/entities/product';
import { Result, ok, err } from '../common/result';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(filters?: ProductFilters): Promise<Result<Product[], Error>> {
    try {
      const products = await this.productRepository.findAll(filters);
      return ok(products);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error('Failed to fetch products', { cause: error }),
      );
    }
  }
}
