import { Test, TestingModule } from '@nestjs/testing';
import { ProductPrismaRepository } from './product-prisma.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '../../../domain/entities/product';
import { Money } from '../../../domain/value-objects/money';

describe('ProductPrismaRepository', () => {
  let repo: ProductPrismaRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockRow = {
    id: 'prod-1',
    name: 'Test',
    description: 'Desc',
    price: 50000,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPrismaRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = module.get<ProductPrismaRepository>(ProductPrismaRepository);
  });

  describe('findAll', () => {
    it('debería retornar productos mapeados a dominio', async () => {
      prisma.product.findMany.mockResolvedValue([mockRow]);

      const result = await repo.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Product);
      expect(result[0].name).toBe('Test');
      expect(result[0].price.amount).toBe(50000);
    });

    it('debería aplicar filtro de búsqueda', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findAll({ search: 'chaqueta' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'chaqueta', mode: 'insensitive' } },
              { description: { contains: 'chaqueta', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('debería aplicar filtro de precio mínimo', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findAll({ minPrice: 50000 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 50000 },
          }),
        }),
      );
    });

    it('debería aplicar ordenamiento', async () => {
      prisma.product.findMany.mockResolvedValue([mockRow]);

      await repo.findAll({ sortBy: 'price', sortOrder: 'asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('debería retornar producto si existe', async () => {
      prisma.product.findUnique.mockResolvedValue(mockRow);

      const result = await repo.findById('prod-1');

      expect(result).toBeInstanceOf(Product);
      expect(result?.id).toBe('prod-1');
    });

    it('debería retornar null si no existe', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('decrementStock', () => {
    it('debería decrementar stock atómicamente', async () => {
      const updatedRow = { ...mockRow, stock: 8 };
      prisma.product.update.mockResolvedValue(updatedRow);

      const result = await repo.decrementStock('prod-1', 2);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(result.stock).toBe(8);
    });
  });
});
