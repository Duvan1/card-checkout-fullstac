import type { CardBrand } from '../../../shared/utils/binDetect';

export interface CheckoutState {
  productId: string;
  quantity: number;
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  cardBrand: CardBrand | null;
  email: string;
  fullName: string;
  address: string;
  city: string;
  phone: string;
  currentStep: number;
}

export const initialCheckoutState: CheckoutState = {
  productId: '',
  quantity: 1,
  cardNumber: '',
  cardHolder: '',
  cardExpiry: '',
  cardCvv: '',
  cardBrand: null,
  email: '',
  fullName: '',
  address: '',
  city: '',
  phone: '',
  currentStep: 2,
};
