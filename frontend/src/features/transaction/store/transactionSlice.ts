import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionService, type TransactionDto, type CreateTransactionPayload } from '../api/transactionService';

interface TransactionState {
  transaction: TransactionDto | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TransactionState = {
  transaction: null,
  status: 'idle',
  error: null,
};

export const createTransaction = createAsyncThunk(
  'transaction/create',
  async (payload: CreateTransactionPayload) => {
    return transactionService.create(payload);
  },
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
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.transaction = action.payload;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Error al crear transacción';
      });
  },
});

export const { resetTransaction } = transactionSlice.actions;
export const transactionReducer = transactionSlice.reducer;
