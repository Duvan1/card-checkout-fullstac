import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/get-products.use-case';

@Controller('products')
export class ProductController {
  constructor(private readonly getProductsUseCase: GetProductsUseCase) {}

  @Get()
  async findAll() {
    const result = await this.getProductsUseCase.execute();

    if (!result.ok) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      currency: product.price.currency,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  }
}
