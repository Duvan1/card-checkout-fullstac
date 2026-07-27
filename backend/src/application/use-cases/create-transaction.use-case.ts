import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCT_REPOSITORY,
} from '../../domain/repositories/product-repository.port';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import {
  TRANSACTION_REPOSITORY,
  type CreateTransactionData,
} from '../../domain/repositories/transaction-repository.port';
import type { TransactionRepository } from '../../domain/repositories/transaction-repository.port';
import type { Transaction } from '../../domain/entities/transaction';
import { Result, ok, err } from '../common/result';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(`Insufficient stock: ${requested} requested, ${available} available`);
    this.name = 'InsufficientStockError';
  }
}

export interface CreateTransactionDto {
  productId: string;
  quantity: number;
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

const BASE_FEE = 2500;
const DELIVERY_FEE = 15000;

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(
    dto: CreateTransactionDto,
  ): Promise<Result<Transaction, ValidationError | InsufficientStockError | Error>> {
    try {
      if (dto.quantity <= 0) {
        return err(new ValidationError('Quantity must be positive'));
      }

      const product = await this.productRepository.findById(dto.productId);
      if (!product) {
        return err(new ValidationError('Product not found'));
      }

      const data: CreateTransactionData = {
        id: crypto.randomUUID(),
        quantity: dto.quantity,
        productId: dto.productId,
        productPrice: product.price.amount * dto.quantity,
        baseFee: BASE_FEE,
        deliveryFee: DELIVERY_FEE,
        cardMasked: dto.cardMasked,
        customer: dto.customer,
        delivery: dto.delivery,
      };

      const transaction = await this.transactionRepository.create(data);

      return ok(transaction);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error('Failed to create transaction', { cause: error }),
      );
    }
  }
}
