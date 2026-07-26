import {
  GetProductByIdUseCase,
  NotFoundError,
} from './get-product-by-id.use-case';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import { Product } from '../../domain/entities/product';
import { Money } from '../../domain/value-objects/money';

function makeProduct(id = 'prod-1'): Product {
  return Product.create({
    id,
    name: 'Test Product',
    description: 'A product for testing',
    price: Money.create(50000),
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    productRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    useCase = new GetProductByIdUseCase(productRepository);
  });

  it('should return ok with product when found', async () => {
    const product = makeProduct('prod-1');
    productRepository.findById.mockResolvedValue(product);

    const result = await useCase.execute('prod-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('prod-1');
      expect(result.value.name).toBe('Test Product');
      expect(result.value.price.currency).toBe('COP');
    }
  });

  it('should return err with NotFoundError when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('nonexistent');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error.message).toContain('not found');
    }
  });

  it('should return err when repository throws', async () => {
    productRepository.findById.mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute('prod-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('DB error');
    }
  });
});
