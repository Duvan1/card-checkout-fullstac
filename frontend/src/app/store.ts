import { configureStore } from '@reduxjs/toolkit';
import { productReducer } from '../features/product/store/productSlice';
import { checkoutReducer } from '../features/checkout/store/checkoutSlice';

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
