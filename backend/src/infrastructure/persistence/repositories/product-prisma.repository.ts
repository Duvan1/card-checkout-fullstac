import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from '../../../domain/repositories/product-repository.port';
import { Product } from '../../../domain/entities/product';
import { Money } from '../../../domain/value-objects/money';

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async decrementStock(id: string, quantity: number): Promise<Product> {
    const row = await this.prisma.product.update({
      where: {
        id,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
      },
    });

    return this.toDomain(row);
  }
  private toDomain(row: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    const money = Money.create(row.price);

    return Product.create({
      id: row.id,
      name: row.name,
      description: row.description,
      price: money,
      stock: row.stock,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
