import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';

const storage = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    return Promise.resolve(value);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};
import { productReducer } from '../features/product/store/productSlice';
import { checkoutReducer } from '../features/checkout/store/checkoutSlice';
import { transactionReducer } from '../features/transaction/store/transactionSlice';

const cardDataTransform = createTransform(
  (inboundState: any) => {
    const { cardNumber, cardCvv, ...rest } = inboundState;
    return rest;
  },
  (outboundState) => outboundState,
  { whitelist: ['checkout'] },
);

const rootReducer = combineReducers({
  product: productReducer,
  checkout: checkoutReducer,
  transaction: transactionReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['checkout', 'transaction'],
  transforms: [cardDataTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer as any);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
