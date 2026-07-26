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
    name: 'Chaqueta de Cueros',
    description: 'Elegancia y durabilidad en una sola pieza.',
    price: 150000,
    currency: 'COP',
    stock: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderDetail(id = 'prod-1') {
  const store = configureStore({ reducer: { product: productReducer } });
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

  it('debería mostrar estado de carga inicialmente', () => {
    jest.mocked(productService.getProductById).mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('debería renderizar el detalle del producto', async () => {
    const product = makeProduct({ name: 'Chaqueta Premium', stock: 10 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    expect(await screen.findByText('Chaqueta Premium')).toBeInTheDocument();
    expect(screen.getByText('Proceder al Pago')).toBeInTheDocument();
  });

  it('debería mostrar el precio formateado', async () => {
    const product = makeProduct({ price: 150000 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    expect(await screen.findByText(/COP 150,000/)).toBeInTheDocument();
  });

  it('debería mostrar precio total con cantidad > 1', async () => {
    const product = makeProduct({ price: 150000, stock: 5 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    await screen.findByText('Chaqueta de Cueros');

    const buttons = screen.getAllByRole('button');
    const addBtn = buttons.find((b) =>
      b.querySelector('[d="M12 5v14m7-7H5"]'),
    )!;
    await userEvent.click(addBtn);

    expect(screen.getByText(/COP 300,000/)).toBeInTheDocument();
  });

  it('debería mostrar badge de stock bajo', async () => {
    const product = makeProduct({ stock: 3 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    expect(await screen.findByText(/Solo quedan 3!/)).toBeInTheDocument();
  });

  it('debería deshabilitar botón si no hay stock', async () => {
    const product = makeProduct({ stock: 0 });
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    const btn = await screen.findByRole('button', {
      name: /Proceder al Pago/,
    });
    expect(btn).toBeDisabled();
  });

  it('debería mostrar stepper de progreso', async () => {
    const product = makeProduct();
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    expect(await screen.findByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
  });

  it('debería mostrar sección de features', async () => {
    const product = makeProduct();
    jest.mocked(productService.getProductById).mockResolvedValue(product);
    renderDetail();

    expect(await screen.findByText('Calidad Premium')).toBeInTheDocument();
    expect(screen.getByText('Envío Rápido')).toBeInTheDocument();
    expect(screen.getByText('Devolución Gratis')).toBeInTheDocument();
  });
});
