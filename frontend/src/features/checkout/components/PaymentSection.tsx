import { Controller, useFormContext } from 'react-hook-form';
import { CreditCardPreview } from './CreditCardPreview';
import { detectBrand } from '../../../shared/utils/binDetect';
import { formatCardNumber } from '../../../shared/utils/luhn';
import type { CheckoutForm } from '../checkoutSchema';

interface Props {
  onCardNumberChange: (value: string) => void;
}

export function PaymentSection({ onCardNumberChange }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CheckoutForm>();

  const cardNumber = watch('cardNumber');
  const cardHolder = watch('cardHolder');
  const cardExpiry = watch('cardExpiry');
  const brand = cardNumber ? detectBrand(cardNumber) : null;

  const handleCardNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (v: string) => void,
  ) => {
    const raw = e.target.value.replace(/\s+/g, '');
    const formatted = formatCardNumber(raw);
    onChange(raw);
    setValue('cardNumber', raw);
    onCardNumberChange(formatted);
  };

  return (
    <div className="space-y-4">
      <CreditCardPreview
        cardNumber={cardNumber}
        cardHolder={cardHolder}
        cardExpiry={cardExpiry}
        brand={brand}
      />

      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-primary bg-primary-container/30 p-2 rounded-lg text-lg">💳</span>
          <h2 className="text-2xl font-semibold text-on-surface">Detalles de Pago</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-on-surface-variant mb-1 flex items-center justify-between">
              Número de Tarjeta
              {brand === 'visa' && <span className="text-primary font-bold italic">VISA</span>}
              {brand === 'mastercard' && <span className="text-primary font-bold italic">MC</span>}
            </label>
            <Controller
              name="cardNumber"
              control={control}
              render={({ field: { onChange, value } }) => (
                <input
                  value={formatCardNumber(value)}
                  onChange={(e) => handleCardNumberChange(e, onChange)}
                  placeholder="**** **** **** ****"
                  maxLength={19}
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                    focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              )}
            />
            {errors.cardNumber && <p className="text-error text-xs mt-1">{errors.cardNumber.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">
              Nombre en la Tarjeta
            </label>
            <input
              {...register('cardHolder')}
              placeholder="Ej. JUAN PÉREZ"
              className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 uppercase
                focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            {errors.cardHolder && <p className="text-error text-xs mt-1">{errors.cardHolder.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">
              Vencimiento (MM/YY)
            </label>
            <input
              {...register('cardExpiry')}
              placeholder="MM/YY"
              maxLength={5}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                setValue('cardExpiry', value);
              }}
              className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            {errors.cardExpiry && <p className="text-error text-xs mt-1">{errors.cardExpiry.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface-variant mb-1">CVV</label>
            <input
              {...register('cardCvv')}
              type="text"
              autoComplete="cc-csc"
              inputMode="numeric"
              placeholder="***"
              maxLength={4}
              className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            {errors.cardCvv && <p className="text-error text-xs mt-1">{errors.cardCvv.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-on-surface-variant py-3 mt-4 bg-surface-container rounded-xl">
          <span className="text-secondary text-sm">🔒</span>
          <span className="text-xs font-medium">Transacción encriptada de 256-bit</span>
        </div>
      </div>
    </div>
  );
}
