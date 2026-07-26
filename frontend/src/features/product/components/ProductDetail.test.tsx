import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetail } from './ProductDetail';
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

function renderDetail(id = 'prod-1') {
  const store = configureStore({
    reducer: { product: productReducer },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/product/${id}`]}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('ProductDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    jest.mocked(productService.getProductById).mockReturnValue(
      new Promise(() => {}),
    );
    renderDetail();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render product detail on success', async () => {
    const product = makeProduct({ id: 'prod-99', name: 'Single Product', stock: 5 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderDetail('prod-99');

    expect(await screen.findByText('Single Product')).toBeInTheDocument();
    expect(screen.getByText('COP 50,000')).toBeInTheDocument();
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
  });

  it('should show pay button on detail view', async () => {
    const product = makeProduct({ id: '1', stock: 5 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderDetail();

    expect(await screen.findByRole('button', {
      name: 'Pay with credit card',
    })).toBeInTheDocument();
  });

  it('should disable pay button when stock is zero', async () => {
    const product = makeProduct({ id: '1', stock: 0 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderDetail();

    const button = await screen.findByRole('button', {
      name: 'Pay with credit card',
    });
    expect(button).toBeDisabled();
  });

  it('should show back button to product list', async () => {
    const product = makeProduct();
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderDetail();

    expect(await screen.findByText('← Back to products')).toBeInTheDocument();
  });

  it('should navigate to checkout on pay button click', async () => {
    const product = makeProduct({ id: '1', stock: 5 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);

    renderDetail();

    const button = await screen.findByRole('button', {
      name: 'Pay with credit card',
    });
    await userEvent.click(button);
  });

  it('should show "Product not found" when product does not exist', async () => {
    jest.mocked(productService.getProductById).mockRejectedValue(
      new Error('Not found'),
    );

    renderDetail('nonexistent');

    expect(await screen.findByText('Error')).toBeInTheDocument();
  });
});
