import { z } from 'zod';
import { luhnCheck } from '../../shared/utils/luhn';

export const checkoutSchema = z.object({
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

export type CheckoutForm = z.infer<typeof checkoutSchema>;
