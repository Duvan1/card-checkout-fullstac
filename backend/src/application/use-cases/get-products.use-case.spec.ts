import { GetProductsUseCase } from './get-products.use-case';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import { Product } from '../../domain/entities/product';
import { Money } from '../../domain/value-objects/money';

function makeProduct(
  overrides: Partial<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }> = {},
): Product {
  return Product.create({
    id: overrides.id ?? 'prod-1',
    name: overrides.name ?? 'Test Product',
    description: 'A product for testing',
    price: Money.create(overrides.price ?? 50000),
    stock: overrides.stock ?? 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    productRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };

    useCase = new GetProductsUseCase(productRepository);
  });

  it('should return ok with products on success', async () => {
    const products = [
      makeProduct({ id: '1', name: 'Product A', price: 100000 }),
      makeProduct({ id: '2', name: 'Product B', price: 200000 }),
    ];

    productRepository.findAll.mockResolvedValue(products);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe('Product A');
      expect(result.value[0].price.currency).toBe('COP');
      expect(result.value[1].name).toBe('Product B');
    }
  });

  it('should return ok with empty array when no products exist', async () => {
    productRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });

  it('should return err when repository throws', async () => {
    productRepository.findAll.mockRejectedValue(
      new Error('DB connection error'),
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('DB connection error');
    }
  });

  it('should wrap non-Error throws in a generic error', async () => {
    productRepository.findAll.mockRejectedValue('unknown failure');

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Failed to fetch products');
    }
  });
});
