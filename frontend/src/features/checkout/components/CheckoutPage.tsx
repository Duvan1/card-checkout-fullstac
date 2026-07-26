import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { updateField, setCardBrand } from '../store/checkoutSlice';
import { CreditCardPreview } from './CreditCardPreview';
import { luhnCheck, formatCardNumber } from '../../../shared/utils/luhn';
import { detectBrand } from '../../../shared/utils/binDetect';

const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  phone: z.string().min(7, 'Teléfono requerido'),
  cardNumber: z
    .string()
    .min(1, 'Número de tarjeta requerido')
    .refine((v) => luhnCheck(v), 'Número de tarjeta inválido'),
  cardHolder: z.string().min(3, 'Nombre del titular requerido'),
  cardExpiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato MM/YY'),
  cardCvv: z
    .string()
    .min(3, 'CVV inválido')
    .max(4, 'CVV inválido'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const saved = useAppSelector((state) => state.checkout);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: saved.fullName || '',
      email: saved.email || '',
      address: saved.address || '',
      city: saved.city || '',
      phone: saved.phone || '',
      cardNumber: '',
      cardHolder: saved.cardHolder || '',
      cardExpiry: saved.cardExpiry || '',
      cardCvv: '',
    },
  });

  const cardNumber = watch('cardNumber');
  const cardHolder = watch('cardHolder');
  const cardExpiry = watch('cardExpiry');

  useEffect(() => {
    if (cardNumber) {
      const brand = detectBrand(cardNumber);
      dispatch(setCardBrand(brand));
    }
  }, [cardNumber, dispatch]);

  const onSubmit = (data: CheckoutForm) => {
    const brand = detectBrand(data.cardNumber);
    dispatch(
      updateField({
        fullName: data.fullName,
        email: data.email,
        address: data.address,
        city: data.city,
        phone: data.phone,
        cardHolder: data.cardHolder,
        cardExpiry: data.cardExpiry,
        cardBrand: brand,
      }),
    );
    navigate('/');
  };

  const handleCardNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (v: string) => void,
  ) => {
    const formatted = formatCardNumber(e.target.value);
    onChange(formatted.replace(/\s+/g, ''));
    setValue('cardNumber', formatted.replace(/\s+/g, ''));
  };

  const brand = watch('cardNumber')
    ? detectBrand(watch('cardNumber'))
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
      {/* Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
              ✓
            </div>
            <span className="text-xs font-medium text-primary">Carrito</span>
          </div>
          <div className="flex-grow h-1 bg-primary mx-2 mb-6 rounded-full opacity-30" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold ring-4 ring-primary/20 shadow-md">
              2
            </div>
            <span className="text-xs font-bold text-primary">Detalles</span>
          </div>
          <div className="flex-grow h-1 bg-surface-variant mx-2 mb-6 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-xs font-medium text-on-surface-variant">
              Resumen
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Shipping Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-primary bg-primary-container/30 p-2 rounded-lg text-lg">
              📦
            </span>
            <h2 className="text-2xl font-semibold text-on-surface">
              Dirección de Envío
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Nombre Completo
              </label>
              <input
                {...register('fullName')}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                  focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              {errors.fullName && (
                <p className="text-error text-xs mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Correo Electrónico
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="juan@ejemplo.com"
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                  focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              {errors.email && (
                <p className="text-error text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Dirección
              </label>
              <input
                {...register('address')}
                placeholder="Calle Falsa 123, Depto 4B"
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                  focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              {errors.address && (
                <p className="text-error text-xs mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Ciudad
              </label>
              <input
                {...register('city')}
                placeholder="Bogotá"
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                  focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              {errors.city && (
                <p className="text-error text-xs mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                Teléfono
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+57 300 123 4567"
                className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                  focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              {errors.phone && (
                <p className="text-error text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4">
          <CreditCardPreview
            cardNumber={cardNumber}
            cardHolder={cardHolder}
            cardExpiry={cardExpiry}
            brand={brand}
          />

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-primary bg-primary-container/30 p-2 rounded-lg text-lg">
                💳
              </span>
              <h2 className="text-2xl font-semibold text-on-surface">
                Detalles de Pago
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-on-surface-variant mb-1 flex items-center justify-between">
                  Número de Tarjeta
                  {brand && (
                    <span className="text-primary font-bold italic">
                      {brand === 'visa' ? 'VISA' : 'MC'}
                    </span>
                  )}
                </label>
                <Controller
                  name="cardNumber"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className="relative">
                      <input
                        value={formatCardNumber(value)}
                        onChange={(e) => handleCardNumberChange(e, onChange)}
                        placeholder="**** **** **** ****"
                        maxLength={19}
                        className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 pr-12
                          focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                />
                {errors.cardNumber && (
                  <p className="text-error text-xs mt-1">
                    {errors.cardNumber.message}
                  </p>
                )}
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
                {errors.cardHolder && (
                  <p className="text-error text-xs mt-1">
                    {errors.cardHolder.message}
                  </p>
                )}
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
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setValue('cardExpiry', value);
                  }}
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                    focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                {errors.cardExpiry && (
                  <p className="text-error text-xs mt-1">
                    {errors.cardExpiry.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">
                  CVV
                </label>
                <input
                  {...register('cardCvv')}
                  type="password"
                  placeholder="***"
                  maxLength={4}
                  className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3
                    focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
                {errors.cardCvv && (
                  <p className="text-error text-xs mt-1">
                    {errors.cardCvv.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-on-surface-variant py-3 mt-4 bg-surface-container rounded-xl">
              <span className="text-secondary text-sm">🔒</span>
              <span className="text-xs font-medium">
                Transacción encriptada de 256-bit
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            className="w-full py-4 bg-primary text-white font-bold text-lg rounded-2xl shadow-lg
              hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Continuar al Resumen
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 text-on-surface-variant text-sm font-medium hover:text-primary transition-colors"
          >
            Regresar al Catálogo
          </button>
        </div>
      </form>
    </div>
  );
}
