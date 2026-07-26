import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  transactionService,
  type TransactionDto,
  type CreateTransactionPayload,
  type PayTransactionPayload,
  type PayTransactionResult,
} from '../api/transactionService';

interface TransactionState {
  transaction: TransactionDto | null;
  paymentResult: PayTransactionResult | null;
  paymentStatus: 'idle' | 'processing' | 'approved' | 'declined' | 'failed';
  error: string | null;
}

const initialState: TransactionState = {
  transaction: null,
  paymentResult: null,
  paymentStatus: 'idle',
  error: null,
};

export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (payload: CreateTransactionPayload) => transactionService.create(payload),
);

export const processPayment = createAsyncThunk(
  'transaction/pay',
  async ({ id, payload }: { id: string; payload: PayTransactionPayload }) =>
    transactionService.pay(id, payload),
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    resetTransaction: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTransaction.pending, (state) => {
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transaction = action.payload;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.error = action.error.message ?? 'Error al crear transacción';
      })
      .addCase(processPayment.pending, (state) => {
        state.paymentStatus = 'processing';
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentResult = action.payload;
        state.paymentStatus = action.payload.status === 'APPROVED' ? 'approved' : 'declined';
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentStatus = 'failed';
        state.error = action.error.message ?? 'Error al procesar pago';
      });
  },
});

export const { resetTransaction } = transactionSlice.actions;
export const transactionReducer = transactionSlice.reducer;
