import { Transaction } from '../entities/transaction';

export interface TransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  updateStatus(id: string, status: string): Promise<Transaction>;
}

export interface CreateTransactionData {
  id: string;
  quantity: number;
  productId: string;
  productPrice: number;
  baseFee: number;
  deliveryFee: number;
  cardMasked?: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
  };
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
