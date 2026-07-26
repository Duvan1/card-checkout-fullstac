export interface CheckoutState {
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  cardBrand: 'visa' | 'mastercard' | 'unknown' | null;
  email: string;
  fullName: string;
  address: string;
  city: string;
  phone: string;
  currentStep: number;
}

export const initialCheckoutState: CheckoutState = {
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
