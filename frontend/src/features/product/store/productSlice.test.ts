import '@testing-library/jest-dom';
import { configureStore } from '@reduxjs/toolkit';
import {
  productReducer,
  fetchProducts,
  fetchProductById,
  clearSelectedProduct,
} from './productSlice';
import { productService } from '../api/productService';
import type { ProductDto } from '../api/productService';

jest.mock('../api/productService', () => ({
  productService: {
    getProducts: jest.fn(),
    getProductById: jest.fn(),
  },
}));

function makeProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 'prod-1',
    name: 'Test Product',
    description: 'A test product',
    price: 50000,
    currency: 'COP',
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createStore() {
  return configureStore({
    reducer: { product: productReducer },
  });
}

describe('productSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    it('should clear selected product', () => {
      const store = createStore();
      store.dispatch(fetchProductById.fulfilled(makeProduct(), '', 'prod-1'));

      expect(store.getState().product.selectedProduct).not.toBeNull();

      store.dispatch(clearSelectedProduct());

      expect(store.getState().product.selectedProduct).toBeNull();
    });
  });

  describe('fetchProducts thunk', () => {
    it('should set status to loading then succeeded with products', async () => {
      const products = [makeProduct({ id: '1' }), makeProduct({ id: '2' })];
      jest.mocked(productService.getProducts).mockResolvedValue(products);

      const store = createStore();
      await store.dispatch(fetchProducts());

      const state = store.getState().product;
      expect(state.status).toBe('succeeded');
      expect(state.products).toHaveLength(2);
      expect(state.products[0].id).toBe('1');
    });

    it('should set status to failed on API error', async () => {
      jest.mocked(productService.getProducts).mockRejectedValue(
        new Error('Network error'),
      );

      const store = createStore();
      await store.dispatch(fetchProducts());

      const state = store.getState().product;
      expect(state.status).toBe('failed');
      expect(state.error).toContain('Network error');
    });
  });

  describe('fetchProductById thunk', () => {
    it('should set selectedProduct on success', async () => {
      const product = makeProduct({ id: 'prod-99', name: 'Specific Product' });
      jest.mocked(productService.getProductById).mockResolvedValue(product);

      const store = createStore();
      await store.dispatch(fetchProductById('prod-99'));

      const state = store.getState().product;
      expect(state.status).toBe('succeeded');
      expect(state.selectedProduct?.name).toBe('Specific Product');
    });

    it('should set status to failed when product not found', async () => {
      jest.mocked(productService.getProductById).mockRejectedValue(
        new Error('Not found'),
      );

      const store = createStore();
      await store.dispatch(fetchProductById('nonexistent'));

      const state = store.getState().product;
      expect(state.status).toBe('failed');
      expect(state.error).toContain('Not found');
    });
  });
});
