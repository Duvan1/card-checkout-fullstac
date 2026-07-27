import { Transaction } from '../entities/transaction';
import type { TransactionStatus } from '../value-objects/transaction-status';

export interface TransactionRepository {
  create(data: CreateTransactionData): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  updateStatus(id: string, status: TransactionStatus): Promise<Transaction>;
  findByGatewayReference(ref: string): Promise<Transaction | null>;
  saveGatewayReference(id: string, ref: string): Promise<void>;
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
