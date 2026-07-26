import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product-repository.port';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import type { Product } from '../../domain/entities/product';
import { Result, ok, err } from '../common/result';

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`);
    this.name = 'NotFoundError';
  }
}

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<Result<Product, NotFoundError | Error>> {
    try {
      const product = await this.productRepository.findById(id);

      if (!product) {
        return err(new NotFoundError('Product', id));
      }

      return ok(product);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error('Failed to fetch product'),
      );
    }
  }
}
