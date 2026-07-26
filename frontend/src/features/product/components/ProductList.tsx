import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { fetchProducts } from '../store/productSlice';
import { ProductCard } from './ProductCard';

export function ProductList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products, status, error } = useAppSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">Error</p>
          <p className="text-gray-500 mt-1">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

        {products.length > 0 ? (
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                currency={product.currency}
                stock={product.stock}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No products found.</p>
        )}
      </div>
    </main>
  );
}
