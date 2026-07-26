import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { processPayment } from '../store/transactionSlice';

export function TransactionResult() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((state) => state.checkout);
  const { transaction, paymentStatus, error } = useAppSelector((state) => state.transaction);

  useEffect(() => {
    if (transaction && checkout.cardNumber && paymentStatus === 'idle') {
      dispatch(
        processPayment({
          id: transaction.id,
          payload: {
            cardNumber: checkout.cardNumber,
            cardCvc: checkout.cardCvv,
            cardExpiryMonth: checkout.cardExpiry.replace('/', '').substring(0, 2),
            cardExpiryYear: '20' + checkout.cardExpiry.replace('/', '').substring(2, 4),
            cardHolder: checkout.cardHolder,
            installments: 1,
          },
        }),
      );
    }
  }, []);

  const total = transaction?.totalAmount ?? 0;
  const currency = transaction?.currency ?? 'COP';

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-16 gap-12">
      {['idle', 'processing'].includes(paymentStatus) && (
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
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-outline-variant rounded-xl shadow-sm text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-8 shadow-sm">
            <span className="text-secondary text-5xl">✓</span>
          </div>
          <h1 className="text-3xl font-semibold text-on-surface mb-1">¡Pago Exitoso!</h1>
          <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-8">
            Transaccion Confirmada
          </p>
          <div className="w-full space-y-3 text-left bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 mb-8">
            <Row label="ID de Transaccion" value={transaction?.id ?? ''} />
            <Row label="Monto Total" value={`${currency} ${total.toLocaleString()}`} bold />
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
          >
            Volver al catalogo
          </button>
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
              onClick={() => navigate('/checkout')}
              className="flex-1 bg-surface text-primary border border-outline-variant py-3 rounded-lg font-semibold hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Cambiar tarjeta
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
            >
              Volver al catalogo
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="flex flex-col items-center justify-center p-12 bg-surface border border-error/20 rounded-xl shadow-sm text-center max-w-md w-full">
          <h1 className="text-3xl font-semibold text-on-surface mb-4">Error</h1>
          <p className="text-on-surface-variant mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-on-primary py-3 px-8 rounded-lg font-semibold"
          >
            Volver al catalogo
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
      <span className={`text-sm ${bold ? 'font-bold text-primary text-lg' : 'font-bold text-on-surface'}`}>
        {value}
      </span>
    </div>
  );
}
