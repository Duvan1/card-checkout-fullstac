import { Product } from './product';
import { Money } from '../value-objects/money';

describe('Product', () => {
  const validParams = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: Money.create(50000),
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a product with valid params', () => {
      const product = Product.create(validParams);
      expect(product.id).toBe('prod-1');
      expect(product.name).toBe('Test Product');
      expect(product.price.amount).toBe(50000);
      expect(product.stock).toBe(10);
    });

    it('should throw if id is empty', () => {
      expect(() => Product.create({ ...validParams, id: '' })).toThrow(
        'id is required',
      );
    });

    it('should throw if id is whitespace only', () => {
      expect(() => Product.create({ ...validParams, id: '   ' })).toThrow(
        'id is required',
      );
    });

    it('should throw if name is empty', () => {
      expect(() => Product.create({ ...validParams, name: '' })).toThrow(
        'name is required',
      );
    });

    it('should throw if price is missing', () => {
      expect(() =>
        Product.create({ ...validParams, price: null as unknown as Money }),
      ).toThrow('price is required');
    });

    it('should throw if stock is negative', () => {
      expect(() => Product.create({ ...validParams, stock: -5 })).toThrow(
        'stock cannot be negative',
      );
    });

    it('should trim name whitespace', () => {
      const product = Product.create({ ...validParams, name: '  Trimmed  ' });
      expect(product.name).toBe('Trimmed');
    });

    it('should allow empty description', () => {
      const product = Product.create({
        ...validParams,
        description: undefined as unknown as string,
      });
      expect(product.description).toBe('');
    });

    it('should allow zero stock', () => {
      const product = Product.create({ ...validParams, stock: 0 });
      expect(product.stock).toBe(0);
    });
  });

  describe('hasAvailableStock', () => {
    it('should return true when stock is sufficient', () => {
      const product = Product.create({ ...validParams, stock: 10 });
      expect(product.hasAvailableStock(5)).toBe(true);
    });

    it('should return true when stock equals quantity', () => {
      const product = Product.create({ ...validParams, stock: 5 });
      expect(product.hasAvailableStock(5)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      const product = Product.create({ ...validParams, stock: 3 });
      expect(product.hasAvailableStock(5)).toBe(false);
    });

    it('should return false when quantity is zero', () => {
      const product = Product.create({ ...validParams, stock: 10 });
      expect(product.hasAvailableStock(0)).toBe(false);
    });

    it('should return false when quantity is negative', () => {
      const product = Product.create({ ...validParams, stock: 10 });
      expect(product.hasAvailableStock(-1)).toBe(false);
    });

    it('should return true when stock is exactly one and quantity is one', () => {
      const product = Product.create({ ...validParams, stock: 1 });
      expect(product.hasAvailableStock(1)).toBe(true);
    });
  });
});
