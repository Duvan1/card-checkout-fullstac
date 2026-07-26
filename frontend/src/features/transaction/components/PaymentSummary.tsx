import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { Backdrop } from '../../../shared/components/Backdrop';
import { createTransaction } from '../store/transactionSlice';
import { maskCardNumber } from '../../../shared/utils/luhn';

export function PaymentSummary() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);
  const product = useAppSelector((state) => state.product.selectedProduct);
  const tx = useAppSelector((state) => state.transaction);

  const quantity = checkout.quantity || 1;
  const baseFee = 2500;
  const deliveryFee = 15000;
  const subtotal = (product?.price ?? 0) * quantity;
  const total = subtotal + baseFee + deliveryFee;

  const handlePay = async () => {
    if (!product) return;

    await dispatch(
      createTransaction({
        productId: product.id,
        quantity,
        cardMasked: checkout.cardNumber ? maskCardNumber(checkout.cardNumber) : undefined,
        customer: {
          fullName: checkout.fullName,
          email: checkout.email,
          phone: checkout.phone,
        },
        delivery: {
          address: checkout.address,
          city: checkout.city,
        },
      }),
    ).unwrap();

    navigate('/result');
  };

  const loading = !!tx.transaction || tx.error !== null;

  return (
    <Backdrop open>
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h1 className="text-xl font-semibold text-on-surface">Resumen de tu compra</h1>
        <button
          onClick={() => navigate('/checkout')}
          className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-colors active:scale-95"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Row label="Subtotal" amount={subtotal} currency={product?.currency ?? 'COP'} />
          <Row label="Fee de servicio" amount={baseFee} currency={product?.currency ?? 'COP'} />
          <Row label="Envío nacional" amount={deliveryFee} currency={product?.currency ?? 'COP'} />
          <div className="pt-4 border-t border-dashed border-outline-variant flex justify-between items-center">
            <span className="text-lg font-bold text-on-surface">TOTAL</span>
            <span className="text-lg font-extrabold text-primary">{product?.currency ?? 'COP'} {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
            <span className="text-primary text-lg">📦</span>
            <div>
              <p className="text-sm font-semibold text-on-surface">Envío Express</p>
              <p className="text-sm text-on-surface-variant">
                {checkout.address}, {checkout.city}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
            <span className="text-secondary text-lg">💳</span>
            <div>
              <p className="text-sm font-semibold text-on-surface">Método de pago</p>
              <p className="text-sm text-on-surface-variant">
                {checkout.cardBrand === 'visa' ? 'Visa' : checkout.cardBrand === 'mastercard' ? 'MasterCard' : 'Tarjeta'} terminada en {checkout.cardNumber ? checkout.cardNumber.slice(-4) : '****'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-surface-container-lowest flex flex-col gap-3">
        {tx.error && (
          <div className="bg-error/10 text-error text-sm font-semibold p-3 rounded-lg text-center">
            {tx.error}
          </div>
        )}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-sm
            hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando transaccion...' : `🔒 Pagar ${product?.currency ?? 'COP'} ${total.toLocaleString()}`}
        </button>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full py-3 bg-surface border border-outline-variant text-primary font-semibold rounded-xl
            hover:bg-surface-container-low active:scale-95 transition-all"
        >
          Volver / Editar datos
        </button>
      </div>
    </Backdrop>
  );
}

function Row({ label, amount, currency }: { label: string; amount: number; currency: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm text-on-surface">{currency} {amount.toLocaleString()}</span>
    </div>
  );
}
