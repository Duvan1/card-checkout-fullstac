import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const base = {
  id: 'p1',
  name: 'Test',
  description: 'Desc',
  price: 50000,
  currency: 'COP',
  stock: 10,
  imageUrl: 'https://img.com/test.png',
};

const payLabel = /Pagar con tarjeta de crédito/;

describe('ProductCard', () => {
  it('shows name and price', () => {
    render(<ProductCard {...base} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('COP 50,000')).toBeInTheDocument();
  });

  it('shows available stock', () => {
    render(<ProductCard {...base} stock={5} />);
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
  });

  it('shows sold out when stock is 0', () => {
    render(<ProductCard {...base} stock={0} />);
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  it('renders image', () => {
    render(<ProductCard {...base} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', base.imageUrl);
  });

  it('calls onClick when clicked', () => {
    const fn = jest.fn();
    render(<ProductCard {...base} onClick={fn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('shows description', () => {
    render(<ProductCard {...base} />);
    expect(screen.getByText('Desc')).toBeInTheDocument();
  });

  it('shows pay button when showPayButton', () => {
    render(<ProductCard {...base} showPayButton />);
    expect(screen.getByRole('button', { name: payLabel })).toBeInTheDocument();
  });

  it('disables pay button when no stock', () => {
    render(<ProductCard {...base} showPayButton stock={0} />);
    expect(screen.getByRole('button', { name: payLabel })).toBeDisabled();
  });

  it('calls onPay when pay button clicked', () => {
    const fn = jest.fn();
    render(<ProductCard {...base} showPayButton onPay={fn} />);
    fireEvent.click(screen.getByRole('button', { name: payLabel }));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
