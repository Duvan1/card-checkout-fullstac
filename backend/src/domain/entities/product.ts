import { Money } from '../value-objects/money';

export class Product {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
    readonly price: Money,
    readonly stock: number,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    name: string;
    description: string;
    price: Money;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    if (!params.id || params.id.trim().length === 0) {
      throw new Error('Product id is required');
    }

    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!params.price) {
      throw new Error('Product price is required');
    }

    if (params.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }

    return new Product(
      params.id,
      params.name.trim(),
      params.description?.trim() ?? '',
      params.price,
      params.stock,
      params.createdAt,
      params.updatedAt,
    );
  }

  hasAvailableStock(quantity: number): boolean {
    if (quantity <= 0) {
      return false;
    }
    return this.stock >= quantity;
  }
}
