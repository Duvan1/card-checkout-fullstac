import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { processPayment, resetTransaction, fetchTransactionStatus } from '../store/transactionSlice';
import { fetchProductById } from '../../product/store/productSlice';

export function TransactionResult() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);
  const product = useAppSelector((state) => state.product.selectedProduct);
  const { transaction, paymentStatus } = useAppSelector((state) => state.transaction);

  useEffect(() => {
    if (transaction && checkout.cardNumber && paymentStatus === 'idle') {
      dispatch(
        processPayment({
          id: transaction.id,
          payload: {
            cardNumber: checkout.cardNumber,
            cardCvc: checkout.cardCvv,
            cardExpiryMonth: checkout.cardExpiry.replace('/', '').substring(0, 2),
            cardExpiryYear: checkout.cardExpiry.replace('/', '').substring(2, 4),
            cardHolder: checkout.cardHolder.toUpperCase(),
            installments: 1,
            customerEmail: checkout.email,
          },
        }),
      );
    }
  }, []);

  useEffect(() => {
    if (paymentStatus === 'approved' && checkout.productId && !product) {
      dispatch(fetchProductById(checkout.productId));
    }
  }, [paymentStatus, checkout.productId]);

  useEffect(() => {
    if (!transaction || paymentStatus !== 'pending') return;
    const interval = setInterval(() => {
      dispatch(fetchTransactionStatus(transaction.id));
    }, 3000);
    return () => clearInterval(interval);
  }, [transaction!.id, paymentStatus]);

  if (!transaction) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
          <span className="text-on-surface-variant text-4xl">?</span>
        </div>
        <h1 className="text-xl font-semibold text-on-surface">Sin transaccion activa</h1>
        <p className="text-on-surface-variant text-sm">No hay una compra en curso.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary text-on-primary py-3 px-8 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
        >
          Ir al catalogo
        </button>
      </div>
    );
  }
  const total = transaction!.totalAmount;
  const currency = transaction!.currency;

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 gap-12">
      {['idle', 'processing', 'pending'].includes(paymentStatus) && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-outline-variant rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-surface-container-highest border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-primary text-4xl">⟳</span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-on-surface mb-2">
            Procesando tu pago...
          </h1>
          <p className="text-on-surface-variant max-w-sm">
            Estamos validando tu transaccion. Por favor no cierres esta ventana.
          </p>
        </div>
      )}

      {paymentStatus === 'approved' && (
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm max-w-lg w-full overflow-hidden">
          <div className="p-8 text-center bg-secondary/5 border-b border-outline-variant">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-secondary text-5xl">✓</span>
            </div>
            <h1 className="text-3xl font-semibold text-on-surface mb-1">Pago Exitoso</h1>
            <p className="text-sm font-semibold text-secondary uppercase tracking-widest">
              Transaccion Confirmada
            </p>
          </div>

          <div className="p-6 space-y-4">
            <Section title="Detalle del Producto">
              <Row label="Producto" value={product?.name ?? checkout.productId} />
              <Row label="Cantidad" value={String(transaction!.quantity ?? 1)} />
            </Section>

            <Section title="Resumen de Pago">
              <Row label="Subtotal" value={`${currency} ${((transaction!.productPrice ?? 0)).toLocaleString()}`} />
              <Row label="Fee de servicio" value={`${currency} ${((transaction!.baseFee ?? 0)).toLocaleString()}`} />
              <Row label="Envio" value={`${currency} ${((transaction!.deliveryFee ?? 0)).toLocaleString()}`} />
              <div className="pt-2 border-t border-outline-variant flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface">TOTAL</span>
                <span className="text-lg font-extrabold text-primary">{currency} {total.toLocaleString()}</span>
              </div>
            </Section>

            <Section title="Metodo de Pago">
              <Row label="Tarjeta" value={`${checkout.cardBrand === 'visa' ? 'Visa' : checkout.cardBrand === 'mastercard' ? 'MasterCard' : 'Tarjeta'} **** ${checkout.cardNumber.slice(-4)}`} />
              <Row label="Titular" value={checkout.cardHolder} />
            </Section>

            <Section title="Envio">
              <Row label="Direccion" value={checkout.address} />
              <Row label="Ciudad" value={checkout.city} />
              <Row label="Destinatario" value={checkout.fullName} />
            </Section>
          </div>

          <div className="p-6 bg-surface-container-lowest border-t border-outline-variant flex flex-col gap-3">
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-surface border border-outline-variant text-primary font-semibold rounded-lg
                hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir ticket
            </button>
            <button
              onClick={() => { dispatch(resetTransaction()); navigate('/'); }}
              className="bg-primary text-on-primary py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
            >
              Volver al catalogo
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'declined' && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-error/20 rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center mb-8">
            <span className="text-error text-5xl">✕</span>
          </div>
          <h1 className="text-3xl font-semibold text-on-surface mb-1">Pago Rechazado</h1>
          <div className="inline-flex items-center gap-1 px-4 py-1 bg-error/10 text-error rounded-full text-sm font-semibold mb-8">
            ⚠ Transaccion declinada
          </div>
          <p className="text-on-surface-variant max-w-md mb-10">
            Lo sentimos, tu transaccion no pudo ser completada. Por favor intenta con otro metodo de pago.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={() => { dispatch(resetTransaction()); navigate('/checkout'); }}
              className="flex-1 bg-surface text-primary border border-outline-variant py-3 rounded-lg font-semibold hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Cambiar tarjeta
            </button>
            <button
              onClick={() => { dispatch(resetTransaction()); navigate('/'); }}
              className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
            >
              Volver al catalogo
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-error/20 rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-8">
            <span className="text-error text-5xl">!</span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface mb-4">Error al procesar</h1>
          <p className="text-on-surface-variant mb-8 max-w-xs">
            No se pudo procesar el pago. Verifica los datos de la tarjeta e intenta nuevamente.
          </p>
          <button
            onClick={() => { dispatch(resetTransaction()); navigate('/checkout'); }}
            className="bg-primary text-on-primary py-3 px-8 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-primary text-lg' : 'font-medium text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5 bg-surface-container-low p-3 rounded-lg">{children}</div>
    </div>
  );
}
