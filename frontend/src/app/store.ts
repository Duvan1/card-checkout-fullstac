import { configureStore } from '@reduxjs/toolkit';
import { productReducer } from '../features/product/store/productSlice';
import { checkoutReducer } from '../features/checkout/store/checkoutSlice';
import { transactionReducer } from '../features/transaction/store/transactionSlice';

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
