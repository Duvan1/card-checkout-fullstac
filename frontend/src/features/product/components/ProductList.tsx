import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { fetchProducts, setFilter } from '../store/productSlice';
import { ProductCard } from './ProductCard';
import { FilterBar } from './FilterBar';

export function ProductList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products, status, error, filters } = useAppSelector(
    (state) => state.product,
  );

  const debouncedSearch = useDebounce(filters.search, 350);

  const prevRef = useRef({ search: '', sortBy: '', sortOrder: '' });

  const loadProducts = useCallback(() => {
    const active: Record<string, string | number | undefined> = {};
    if (debouncedSearch) active.search = debouncedSearch;
    if (filters.sortBy) active.sortBy = filters.sortBy;
    if (filters.sortBy) active.sortOrder = filters.sortOrder || 'desc';
    dispatch(fetchProducts(Object.keys(active).length > 0 ? active : undefined));
  }, [dispatch, debouncedSearch, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    const current = { search: debouncedSearch, sortBy: filters.sortBy, sortOrder: filters.sortOrder };
    const prev = prevRef.current;
    if (
      current.search !== prev.search ||
      current.sortBy !== prev.sortBy ||
      current.sortOrder !== prev.sortOrder
    ) {
      loadProducts();
      prevRef.current = current;
    }
  }, [loadProducts, debouncedSearch, filters.sortBy, filters.sortOrder]);

  const updateFilter = (key: string, value: string) => {
    dispatch(setFilter({ [key]: value || '' }));
  };

  if (status === 'loading' && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-on-surface-variant text-lg">Cargando...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-error text-lg font-semibold">Error</p>
          <p className="text-on-surface-variant mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-8 sm:py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-on-surface tracking-tight">
          Catálogo de Productos
        </h1>
        <p className="text-on-surface-variant text-lg mt-2">
          Selecciona un producto para ver los detalles y continuar con el pago.
        </p>
      </div>

      <div className="mb-8">
        <FilterBar
          search={filters.search}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSearchChange={(v) => updateFilter('search', v)}
          onSortByChange={(v) => updateFilter('sortBy', v)}
          onSortOrderChange={(v) => updateFilter('sortOrder', v)}
        />
      </div>

      {products.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {products.map((product, index) => (
            <div key={product.id} className="break-inside-avoid">
              <ProductCard
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                currency={product.currency}
                stock={product.stock}
                imageIndex={index}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-on-surface-variant text-lg">
            No se encontraron productos con esos filtros.
          </p>
        </div>
      )}
    </div>
  );
}
