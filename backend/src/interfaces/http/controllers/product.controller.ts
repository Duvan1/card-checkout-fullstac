import {
  Controller,
  Get,
  NotFoundException,
  InternalServerErrorException,
  Param,
} from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from '../../../application/use-cases/get-product-by-id.use-case';

@Controller('products')
export class ProductController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  async findAll() {
    const result = await this.getProductsUseCase.execute();

    if (!result.ok) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((product) => this.toDto(product));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.getProductByIdUseCase.execute(id);

    if (!result.ok) {
      if (result.error.constructor.name === 'NotFoundError') {
        throw new NotFoundException(result.error.message);
      }
      throw new InternalServerErrorException(result.error.message);
    }

    return this.toDto(result.value);
  }

  private toDto(product: {
    id: string;
    name: string;
    description: string;
    price: { amount: number; currency: string };
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.amount,
      currency: product.price.currency,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
