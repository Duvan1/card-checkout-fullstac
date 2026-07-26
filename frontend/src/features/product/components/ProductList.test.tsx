import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductList } from './ProductList';
import { productReducer } from '../store/productSlice';
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
    description: 'A great product',
    price: 50000,
    currency: 'COP',
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderWithProviders() {
  const store = configureStore({
    reducer: { product: productReducer },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<ProductList />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('ProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    jest.mocked(productService.getProducts).mockReturnValue(
      new Promise(() => {}),
    );
    renderWithProviders();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render product list on success', async () => {
    const products = [
      makeProduct({ id: '1', name: 'Product A', price: 100000, stock: 5 }),
      makeProduct({ id: '2', name: 'Product B', price: 200000, stock: 3 }),
    ];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    expect(await screen.findByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('COP 100,000')).toBeInTheDocument();
  });

  it('should show stock count on each product', async () => {
    const products = [makeProduct({ id: '1', stock: 5 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    expect(await screen.findByText('5 disponibles')).toBeInTheDocument();
  });

  it('should show "Agotado" badge when stock is zero', async () => {
    const products = [makeProduct({ id: '1', stock: 0 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    expect(await screen.findByText('Agotado')).toBeInTheDocument();
  });

  it('should NOT show pay button on list cards', async () => {
    const products = [makeProduct({ id: '1', name: 'ProductList', stock: 5 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    await screen.findByText('ProductList');
    expect(
      screen.queryByRole('button', { name: 'Pay with credit card' }),
    ).not.toBeInTheDocument();
  });

  it('should show error message on API failure', async () => {
    jest.mocked(productService.getProducts).mockRejectedValue(
      new Error('Connection refused'),
    );
    renderWithProviders();
    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('should show "No products found" when list is empty', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([]);
    renderWithProviders();
    expect(await screen.findByText('No products found.')).toBeInTheDocument();
  });
});
