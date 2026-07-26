import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../shared/hooks';
import { updateField, setCardBrand } from '../store/checkoutSlice';
import { detectBrand } from '../../../shared/utils/binDetect';
import { CheckoutStepper } from '../../../shared/components/CheckoutStepper';
import { ShippingSection } from './ShippingSection';
import { PaymentSection } from './PaymentSection';
import { checkoutSchema, type CheckoutForm } from '../checkoutSchema';

const STEPS = [{ label: 'Carrito' }, { label: 'Detalles' }, { label: 'Resumen' }];

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const saved = useAppSelector((state) => state.checkout);

  const methods = useForm<CheckoutForm>({
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

  const cardNumber = methods.watch('cardNumber');

  useEffect(() => {
    if (cardNumber) dispatch(setCardBrand(detectBrand(cardNumber)));
  }, [cardNumber, dispatch]);

  const onSubmit = (data: CheckoutForm) => {
    dispatch(
      updateField({
        fullName: data.fullName,
        email: data.email,
        address: data.address,
        city: data.city,
        phone: data.phone,
        cardHolder: data.cardHolder,
        cardExpiry: data.cardExpiry,
        cardBrand: detectBrand(data.cardNumber),
      }),
    );
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
      <CheckoutStepper steps={STEPS} currentStep={2} />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <ShippingSection />
          <PaymentSection onCardNumberChange={() => {}} />

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
      </FormProvider>
    </div>
  );
}
