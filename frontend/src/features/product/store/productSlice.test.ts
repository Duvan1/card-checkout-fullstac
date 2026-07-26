import '@testing-library/jest-dom';
import { configureStore } from '@reduxjs/toolkit';
import {
  productReducer,
  fetchProducts,
  fetchProductById,
  clearSelectedProduct,
  setFilter,
  clearFilters,
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

    it('should update a single filter', () => {
      const store = createStore();
      store.dispatch(setFilter({ search: 'chaqueta' }));
      expect(store.getState().product.filters.search).toBe('chaqueta');
    });

    it('should merge multiple filter updates', () => {
      const store = createStore();
      store.dispatch(setFilter({ search: 'zapato' }));
      store.dispatch(setFilter({ sortBy: 'price' }));
      expect(store.getState().product.filters.search).toBe('zapato');
      expect(store.getState().product.filters.sortBy).toBe('price');
    });

    it('should clear all filters', () => {
      const store = createStore();
      store.dispatch(setFilter({ search: 'algo', sortBy: 'price' }));
      store.dispatch(clearFilters());
      expect(store.getState().product.filters.search).toBe('');
      expect(store.getState().product.filters.sortBy).toBe('');
    });
  });

  describe('fetchProducts thunk', () => {
    it('should fetch products without filters', async () => {
      const products = [makeProduct({ id: '1' })];
      jest.mocked(productService.getProducts).mockResolvedValue(products);

      const store = createStore();
      await store.dispatch(fetchProducts(undefined));

      expect(store.getState().product.status).toBe('succeeded');
      expect(store.getState().product.products).toHaveLength(1);
    });

    it('should fetch products with search filter', async () => {
      const products = [makeProduct({ id: '1', name: 'Chaqueta' })];
      jest.mocked(productService.getProducts).mockResolvedValue(products);

      const store = createStore();
      await store.dispatch(fetchProducts({ search: 'chaqueta' }));

      expect(productService.getProducts).toHaveBeenCalledWith({
        search: 'chaqueta',
      });
      expect(store.getState().product.products[0].name).toBe('Chaqueta');
    });

    it('should set status to failed on API error', async () => {
      jest.mocked(productService.getProducts).mockRejectedValue(
        new Error('Network error'),
      );
      const store = createStore();
      await store.dispatch(fetchProducts(undefined));
      expect(store.getState().product.status).toBe('failed');
    });
  });

  describe('fetchProductById thunk', () => {
    it('should set selectedProduct on success', async () => {
      const product = makeProduct({ id: 'prod-99', name: 'Specific Product' });
      jest.mocked(productService.getProductById).mockResolvedValue(product);
      const store = createStore();
      await store.dispatch(fetchProductById('prod-99'));
      expect(store.getState().product.selectedProduct?.name).toBe('Specific Product');
    });
  });
});
