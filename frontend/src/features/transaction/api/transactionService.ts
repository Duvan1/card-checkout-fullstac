import { apiClient } from '../../../shared/api/client';

export interface CreateTransactionPayload {
  productId: string;
  quantity: number;
  cardMasked?: string;
  customer: { fullName: string; email: string; phone: string };
  delivery: { address: string; city: string };
}

export interface TransactionDto {
  id: string;
  status: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  baseFee: number;
  deliveryFee: number;
  productPrice: number;
  cardMasked: string | null;
  createdAt: string;
}

export interface PayTransactionPayload {
  cardNumber: string;
  cardCvc: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardHolder: string;
  installments: number;
  customerEmail: string;
}

export interface PayTransactionResult {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
}

export const transactionService = {
  create: (payload: CreateTransactionPayload) =>
    apiClient.post<TransactionDto>('/transactions', payload).then((r) => r.data),

  pay: (id: string, payload: PayTransactionPayload) =>
    apiClient.post<PayTransactionResult>(`/transactions/${id}/pay`, payload).then((r) => r.data),
};
