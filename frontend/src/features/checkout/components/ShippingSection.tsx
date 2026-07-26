import { useFormContext } from 'react-hook-form';
import type { CheckoutForm } from '../checkoutSchema';

export function ShippingSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckoutForm>();

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-outline-variant">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-primary bg-primary-container/30 p-2 rounded-lg text-lg">📦</span>
        <h2 className="text-2xl font-semibold text-on-surface">Dirección de Envío</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre Completo" error={errors.fullName?.message}>
          <input {...register('fullName')} placeholder="Ej. Juan Pérez" />
        </Field>
        <Field label="Correo Electrónico" error={errors.email?.message}>
          <input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
        </Field>
        <Field className="md:col-span-2" label="Dirección" error={errors.address?.message}>
          <input {...register('address')} placeholder="Calle Falsa 123, Depto 4B" />
        </Field>
        <Field label="Ciudad" error={errors.city?.message}>
          <input {...register('city')} placeholder="Bogotá" />
        </Field>
        <Field label="Teléfono" error={errors.phone?.message}>
          <input {...register('phone')} type="tel" placeholder="+57 300 123 4567" />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-on-surface-variant mb-1">{label}</label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}
