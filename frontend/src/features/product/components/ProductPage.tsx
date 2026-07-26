import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { fetchProducts, fetchProductById } from '../store/productSlice';

function ProductCard({
  name,
  description,
  price,
  currency,
  stock,
  onPay,
}: {
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  onPay: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{name}</h2>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-blue-600">
          {currency} {price.toLocaleString()}
        </span>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            stock > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {stock > 0 ? `${stock} disponibles` : 'Agotado'}
        </span>
      </div>

      <button
        onClick={onPay}
        disabled={stock === 0}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg
                   hover:bg-blue-700 transition-colors
                   disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Pay with credit card
      </button>
    </div>
  );
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products, selectedProduct, status, error } = useAppSelector(
    (state) => state.product,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    } else {
      dispatch(fetchProducts());
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

        {id && selectedProduct ? (
          <ProductCard
            name={selectedProduct.name}
            description={selectedProduct.description}
            price={selectedProduct.price}
            currency={selectedProduct.currency}
            stock={selectedProduct.stock}
            onPay={() => navigate('/checkout')}
          />
        ) : !id && products.length > 0 ? (
          <div className="flex flex-col gap-4">
            {products.map((product: typeof products[number]) => (
              <ProductCard
                key={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                currency={product.currency}
                stock={product.stock}
                onPay={() => navigate('/checkout')}
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
