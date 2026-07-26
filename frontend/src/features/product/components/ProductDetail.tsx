import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { fetchProductById } from '../store/productSlice';
import { ProductCard } from './ProductCard';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct, status, error } = useAppSelector(
    (state) => state.product,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

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
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1"
        >
          ← Back to products
        </button>

        {selectedProduct ? (
          <ProductCard
            id={selectedProduct.id}
            name={selectedProduct.name}
            description={selectedProduct.description}
            price={selectedProduct.price}
            currency={selectedProduct.currency}
            stock={selectedProduct.stock}
            showPayButton
            onPay={() => navigate('/checkout')}
          />
        ) : (
          <p className="text-gray-500">Product not found.</p>
        )}
      </div>
    </main>
  );
}
