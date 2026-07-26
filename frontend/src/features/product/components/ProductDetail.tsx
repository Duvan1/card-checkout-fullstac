import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { fetchProductById } from '../store/productSlice';

function Stepper() {
  return (
    <div className="flex items-center justify-center mb-12">
      <div className="flex items-center w-full max-w-md">
        <div className="flex flex-col items-center relative">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold ring-4 ring-primary/20">
            1
          </div>
          <span className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-primary">
            Producto
          </span>
        </div>
        <div className="flex-1 h-1 bg-surface-variant mx-2 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-primary" />
        </div>
        <div className="flex flex-col items-center relative">
          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
            2
          </div>
          <span className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-on-surface-variant">
            Pago
          </span>
        </div>
        <div className="flex-1 h-1 bg-surface-variant mx-2 rounded-full" />
        <div className="flex flex-col items-center relative">
          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
            3
          </div>
          <span className="absolute -bottom-8 whitespace-nowrap text-xs font-medium text-on-surface-variant">
            Confirmado
          </span>
        </div>
      </div>
    </div>
  );
}

function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-on-surface-variant tracking-wide uppercase">
        Seleccionar Cantidad
      </label>
      <div className="flex items-center gap-4 bg-surface-container p-1 rounded-full w-fit border border-outline-variant">
        <button
          onClick={() => onChange(value - 1)}
          disabled={value <= 1}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-primary shadow-sm
            hover:bg-primary hover:text-white transition-all active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </button>
        <span className="text-2xl font-semibold w-8 text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-primary shadow-sm
            hover:bg-primary hover:text-white transition-all active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
          </svg>
        </button>
      </div>
      <p className="text-on-surface-variant text-sm italic">
        Límite por compra: {max} unidades
      </p>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct, status, error } = useAppSelector((state) => state.product);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    setQuantity(1);
  }, [id]);

  if (status === 'loading') {
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

  if (!selectedProduct) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-on-surface-variant">Producto no encontrado.</p>
      </div>
    );
  }

  const maxQty = Math.min(selectedProduct.stock, 3);
  const stockLow = selectedProduct.stock > 0 && selectedProduct.stock <= 3;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
      <button
        onClick={() => navigate('/')}
        className="text-on-surface-variant hover:text-on-surface text-sm font-medium
          flex items-center gap-1 mb-8 transition-colors duration-150"
      >
        ← Volver al catálogo
      </button>

      <Stepper />

      {/* Bento Detail Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-2xl p-6 border border-outline-variant shadow-sm">
        {/* Image Section */}
        <div className="md:col-span-7 relative group">
          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container">
            <img
              src={`https://dummyimage.com/800x1000/4f46e5/f5f2ff.png&text=${encodeURIComponent(selectedProduct.name.substring(0, 25))}`}
              alt={selectedProduct.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          {stockLow && (
            <div className="absolute top-4 left-4">
              <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¡Solo quedan {selectedProduct.stock}!
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">
                {selectedProduct.name}
              </h1>
              <p className="text-on-surface-variant text-lg mt-1">
                {selectedProduct.description}
              </p>
            </div>

            {/* Price Box */}
            <div className="bg-surface-container-low p-5 rounded-xl border border-primary/10">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest block mb-1">
                Precio Total
              </span>
              <div className="text-3xl font-bold text-on-surface tabular-nums">
                {selectedProduct.currency} {(selectedProduct.price * quantity).toLocaleString()}
              </div>
              {quantity > 1 && (
                <p className="text-on-surface-variant text-sm mt-1">
                  {selectedProduct.currency} {selectedProduct.price.toLocaleString()} x {quantity} unidad{quantity > 1 ? 'es' : ''}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <QuantitySelector
              value={quantity}
              max={maxQty}
              onChange={setQuantity}
            />
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <button
              onClick={() => navigate('/checkout')}
              disabled={selectedProduct.stock === 0}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg
                hover:shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95
                flex items-center justify-center gap-2
                disabled:bg-surface-container-high disabled:text-outline disabled:cursor-not-allowed disabled:shadow-none"
            >
              Proceder al Pago
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <div className="flex items-center justify-center gap-3 text-on-surface-variant text-xs font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pago Seguro
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Envío Gratis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-surface-container-high p-5 rounded-xl border border-outline-variant">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-on-surface mb-1">Calidad Premium</h3>
          <p className="text-on-surface-variant text-sm">Productos seleccionados con los más altos estándares de calidad.</p>
        </div>
        <div className="bg-surface-container-high p-5 rounded-xl border border-outline-variant">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-on-surface mb-1">Envío Rápido</h3>
          <p className="text-on-surface-variant text-sm">Entrega garantizada en 2-5 días hábiles a cualquier parte del país.</p>
        </div>
        <div className="bg-surface-container-high p-5 rounded-xl border border-outline-variant">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-on-surface mb-1">Devolución Gratis</h3>
          <p className="text-on-surface-variant text-sm">30 días para devoluciones sin costo. Tu satisfacción garantizada.</p>
        </div>
      </div>
    </div>
  );
}
