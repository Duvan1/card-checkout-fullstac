import {
  Controller,
  Get,
  NotFoundException,
  InternalServerErrorException,
  Param,
  Query,
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
  async findAll(
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const result = await this.getProductsUseCase.execute({
      search,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      sortBy: isValidSortBy(sortBy) ? sortBy : undefined,
      sortOrder: isValidSortOrder(sortOrder) ? sortOrder : undefined,
    });

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

function isValidSortBy(value?: string): value is 'price' | 'name' | 'stock' {
  return value === 'price' || value === 'name' || value === 'stock';
}

function isValidSortOrder(value?: string): value is 'asc' | 'desc' {
  return value === 'asc' || value === 'desc';
}
