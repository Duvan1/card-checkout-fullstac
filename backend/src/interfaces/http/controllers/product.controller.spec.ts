import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { GetProductsUseCase } from '../../../application/use-cases/get-products.use-case';
import { GetProductByIdUseCase, NotFoundError } from '../../../application/use-cases/get-product-by-id.use-case';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Product } from '../../../domain/entities/product';
import { Money } from '../../../domain/value-objects/money';
import { ok, err } from '../../../application/common/result';

function makeProduct(overrides: Partial<{ id: string; name: string; price: number; stock: number }> = {}): Product {
  return Product.create({
    id: overrides.id ?? 'prod-1',
    name: overrides.name ?? 'Test Product',
    description: 'A test product',
    price: Money.create(overrides.price ?? 50000),
    stock: overrides.stock ?? 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ProductController', () => {
  let controller: ProductController;
  let getProductsUseCase: jest.Mocked<GetProductsUseCase>;
  let getProductByIdUseCase: jest.Mocked<GetProductByIdUseCase>;

  beforeEach(async () => {
    getProductsUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetProductsUseCase>;
    getProductByIdUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetProductByIdUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        { provide: GetProductsUseCase, useValue: getProductsUseCase },
        { provide: GetProductByIdUseCase, useValue: getProductByIdUseCase },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  describe('findAll', () => {
    it('should return product DTOs on success', async () => {
      const products = [
        makeProduct({ id: '1', name: 'Product A', price: 100000 }),
        makeProduct({ id: '2', name: 'Product B', price: 200000 }),
      ];
      getProductsUseCase.execute.mockResolvedValue(ok(products));

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].price).toBe(100000);
      expect(result[0].currency).toBe('COP');
    });

    it('should throw InternalServerErrorException on error', async () => {
      getProductsUseCase.execute.mockResolvedValue(err(new Error('DB down')));

      await expect(controller.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should return a single product DTO on success', async () => {
      const product = makeProduct({ id: 'prod-99', name: 'Single' });
      getProductByIdUseCase.execute.mockResolvedValue(ok(product));

      const result = await controller.findById('prod-99');

      expect(result.id).toBe('prod-99');
      expect(result.name).toBe('Single');
    });

    it('should throw NotFoundException when product not found', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(
        err(new NotFoundError('Product', 'nonexistent')),
      );

      await expect(controller.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on generic error', async () => {
      getProductByIdUseCase.execute.mockResolvedValue(err(new Error('DB error')));

      await expect(controller.findById('prod-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
