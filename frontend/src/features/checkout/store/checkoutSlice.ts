import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initialCheckoutState, type CheckoutState } from './checkoutTypes';
import type { CardBrand } from '../../../shared/utils/binDetect';

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: initialCheckoutState,
  reducers: {
    updateField: (state, action: PayloadAction<Partial<CheckoutState>>) => {
      return { ...state, ...action.payload };
    },
    setCardBrand: (state, action: PayloadAction<CardBrand>) => {
      state.cardBrand = action.payload;
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    resetCheckout: () => initialCheckoutState,
  },
});

export const { updateField, setCardBrand, setStep, resetCheckout } =
  checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;
