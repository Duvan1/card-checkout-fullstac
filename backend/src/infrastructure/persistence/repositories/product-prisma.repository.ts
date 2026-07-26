import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProductRepository,
  type ProductFilters,
} from '../../../domain/repositories/product-repository.port';
import { Product } from '../../../domain/entities/product';
import { Money } from '../../../domain/value-objects/money';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductPrismaRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortBy = filters?.sortBy ?? 'createdAt';
    const sortOrder = filters?.sortOrder ?? 'desc';

    orderBy[sortBy] = sortOrder;

    const rows = await this.prisma.product.findMany({
      where,
      orderBy,
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
