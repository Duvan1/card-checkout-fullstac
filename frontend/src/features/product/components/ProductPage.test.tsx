import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductPage } from './ProductPage';
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

function renderWithProviders(initialRoute = '/') {
  const store = configureStore({
    reducer: { product: productReducer },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<ProductPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('ProductPage', () => {
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

  it('should disable pay button when stock is zero', async () => {
    const products = [makeProduct({ id: '1', stock: 0 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    const button = await screen.findByRole('button', {
      name: 'Pay with credit card',
    });
    expect(button).toBeDisabled();
  });

  it('should show "Agotado" badge when stock is zero', async () => {
    const products = [makeProduct({ id: '1', stock: 0 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    expect(await screen.findByText('Agotado')).toBeInTheDocument();
  });

  it('should enable pay button when stock is available', async () => {
    const products = [makeProduct({ id: '1', stock: 10 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    const button = await screen.findByRole('button', {
      name: 'Pay with credit card',
    });
    expect(button).toBeEnabled();
  });

  it('should show error message on API failure', async () => {
    jest.mocked(productService.getProducts).mockRejectedValue(
      new Error('Connection refused'),
    );

    renderWithProviders();

    expect(await screen.findByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('should show "No products found" when list is empty', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([]);

    renderWithProviders();

    expect(await screen.findByText('No products found.')).toBeInTheDocument();
  });

  it('should fetch single product when id param is present', async () => {
    const product = makeProduct({ id: 'prod-99', name: 'Single Product' });
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderWithProviders('/product/prod-99');

    expect(await screen.findByText('Single Product')).toBeInTheDocument();
  });

  it('should navigate to /checkout on pay button click', async () => {
    const products = [makeProduct({ id: '1', stock: 5 })];
    jest.mocked(productService.getProducts).mockResolvedValue(products);

    renderWithProviders();

    const button = await screen.findByRole('button', {
      name: 'Pay with credit card',
    });

    await userEvent.click(button);
  });
});
