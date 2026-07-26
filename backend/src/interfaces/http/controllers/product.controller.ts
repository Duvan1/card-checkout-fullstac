import {
  Controller,
  Get,
  NotFoundException,
  InternalServerErrorException,
  Param,
  Query,
} from '@nestjs/common';
import { GetProductsUseCase } from '../../../application/use-cases/get-products.use-case';
import {
  GetProductByIdUseCase,
  NotFoundError,
} from '../../../application/use-cases/get-product-by-id.use-case';

const VALID_SORT_BY = new Set(['price', 'name', 'stock']);
const VALID_SORT_ORDER = new Set(['asc', 'desc']);

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
      sortBy: sortBy && VALID_SORT_BY.has(sortBy) ? (sortBy as 'price' | 'name' | 'stock') : undefined,
      sortOrder: sortOrder && VALID_SORT_ORDER.has(sortOrder) ? (sortOrder as 'asc' | 'desc') : undefined,
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
      if (result.error instanceof NotFoundError) {
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
