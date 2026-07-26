import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    search: '',
    sortBy: '',
    sortOrder: 'desc' as const,
    onSearchChange: jest.fn(),
    onSortByChange: jest.fn(),
    onSortOrderChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar el input de búsqueda', () => {
    render(<FilterBar {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('Buscar productos...'),
    ).toBeInTheDocument();
  });

  it('debería llamar onSearchChange al escribir', () => {
    render(<FilterBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(input, { target: { value: 'chaqueta' } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('chaqueta');
  });

  it('debería llamar onSortByChange al seleccionar', () => {
    render(<FilterBar {...defaultProps} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'price' } });
    expect(defaultProps.onSortByChange).toHaveBeenCalledWith('price');
  });

  it('debería deshabilitar el toggle si no hay sortBy', () => {
    render(<FilterBar {...defaultProps} sortBy="" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toBeDisabled();
  });

  it('debería alternar orden al hacer clic en el toggle', () => {
    render(<FilterBar {...defaultProps} sortBy="price" sortOrder="asc" />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(defaultProps.onSortOrderChange).toHaveBeenCalledWith('desc');
  });
});
