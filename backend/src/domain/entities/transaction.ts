import { Money } from '../value-objects/money';
import { TransactionStatusValue } from '../value-objects/transaction-status';

export class Transaction {
  private constructor(
    readonly id: string,
    readonly status: TransactionStatusValue,
    readonly quantity: number,
    readonly productPrice: Money,
    readonly baseFee: Money,
    readonly deliveryFee: Money,
    readonly totalAmount: Money,
    readonly cardMasked: string | null,
    readonly gatewayReference: string | null,
    readonly productId: string,
    readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    quantity: number;
    productPrice: Money;
    baseFee: Money;
    deliveryFee: Money;
    productId: string;
    cardMasked?: string;
    createdAt?: Date;
  }): Transaction {
    if (params.quantity <= 0) throw new Error('Quantity must be positive');
    if (!params.productId) throw new Error('Product ID is required');

    const total = params.productPrice
      .add(params.baseFee)
      .add(params.deliveryFee);

    return new Transaction(
      params.id,
      TransactionStatusValue.pending(),
      params.quantity,
      params.productPrice,
      params.baseFee,
      params.deliveryFee,
      total,
      params.cardMasked ?? null,
      null,
      params.productId,
      params.createdAt ?? new Date(),
    );
  }

  static reconstitute(params: {
    id: string;
    status: string;
    quantity: number;
    productPrice: Money;
    baseFee: Money;
    deliveryFee: Money;
    productId: string;
    cardMasked?: string | null;
    gatewayReference?: string | null;
    createdAt?: Date;
  }): Transaction {
    const total = params.productPrice.add(params.baseFee).add(params.deliveryFee);
    return new Transaction(
      params.id,
      TransactionStatusValue.create(params.status),
      params.quantity,
      params.productPrice,
      params.baseFee,
      params.deliveryFee,
      total,
      params.cardMasked ?? null,
      params.gatewayReference ?? null,
      params.productId,
      params.createdAt ?? new Date(),
    );
  }
}
