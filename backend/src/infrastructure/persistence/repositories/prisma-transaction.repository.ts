import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TransactionRepository,
  type CreateTransactionData,
} from '../../../domain/repositories/transaction-repository.port';
import { Transaction } from '../../../domain/entities/transaction';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTransactionData): Promise<Transaction> {
    const row = await this.prisma.transaction.create({
      data: {
        id: data.id,
        status: 'PENDING',
        quantity: data.quantity,
        productPrice: data.productPrice,
        baseFee: data.baseFee,
        deliveryFee: data.deliveryFee,
        totalAmount: data.productPrice + data.baseFee + data.deliveryFee,
        cardMasked: data.cardMasked,
        productId: data.productId,
        customer: {
          create: {
            fullName: data.customer.fullName,
            email: data.customer.email,
            phone: data.customer.phone,
          },
        },
        delivery: {
          create: {
            address: data.delivery.address,
            city: data.delivery.city,
          },
        },
      },
      include: { customer: true, delivery: true },
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({
      where: { id },
      include: { customer: true, delivery: true },
    });

    if (!row) return null;
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: string): Promise<Transaction> {
    const row = await this.prisma.transaction.update({
      where: { id },
      data: { status },
      include: { customer: true, delivery: true },
    });

    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    status: string;
    quantity: number;
    productPrice: number;
    baseFee: number;
    deliveryFee: number;
    totalAmount: number;
    cardMasked: string | null;
    productId: string;
    createdAt: Date;
  }): Transaction {
    const productPrice = Money.create(row.productPrice);
    const baseFee = Money.create(row.baseFee);
    const deliveryFee = Money.create(row.deliveryFee);

    const transaction = Transaction.create({
      id: row.id,
      quantity: row.quantity,
      productPrice,
      baseFee,
      deliveryFee,
      productId: row.productId,
      cardMasked: row.cardMasked ?? undefined,
      createdAt: row.createdAt,
    });

    return transaction;
  }
}
