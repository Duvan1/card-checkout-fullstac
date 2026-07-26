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

export const transactionService = {
  create: (payload: CreateTransactionPayload) =>
    apiClient.post<TransactionDto>('/transactions', payload).then((r) => r.data),
};
