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
    name: 'Producto de Prueba',
    description: 'Un gran producto',
    price: 50000,
    currency: 'COP',
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderWithProviders() {
  const store = configureStore({ reducer: { product: productReducer } });
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

  it('debería mostrar estado de carga inicialmente', () => {
    jest.mocked(productService.getProducts).mockReturnValue(new Promise(() => {}));
    renderWithProviders();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debería renderizar la lista de productos', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([
      makeProduct({ id: '1', name: 'Producto A', price: 100000, stock: 5 }),
      makeProduct({ id: '2', name: 'Producto B', price: 200000, stock: 3 }),
    ]);
    renderWithProviders();
    expect(await screen.findByText('Producto A')).toBeInTheDocument();
    expect(screen.getByText('Producto B')).toBeInTheDocument();
  });

  it('debería mostrar "Agotado" cuando no hay stock', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([
      makeProduct({ id: '1', stock: 0 }),
    ]);
    renderWithProviders();
    expect(await screen.findByText('Agotado')).toBeInTheDocument();
  });

  it('NO debería mostrar botón de pago en la lista', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([
      makeProduct({ id: '1', name: 'ListaProducto', stock: 5 }),
    ]);
    renderWithProviders();
    await screen.findByText('ListaProducto');
    expect(
      screen.queryByRole('button', { name: 'Pagar con tarjeta de crédito' }),
    ).not.toBeInTheDocument();
  });

  it('debería mostrar error si la API falla', async () => {
    jest.mocked(productService.getProducts).mockRejectedValue(new Error('Fallo'));
    renderWithProviders();
    expect(await screen.findByText('Error')).toBeInTheDocument();
  });

  it('debería mostrar mensaje cuando no hay productos', async () => {
    jest.mocked(productService.getProducts).mockResolvedValue([]);
    renderWithProviders();
    expect(
      await screen.findByText('No se encontraron productos con esos filtros.'),
    ).toBeInTheDocument();
  });
});
