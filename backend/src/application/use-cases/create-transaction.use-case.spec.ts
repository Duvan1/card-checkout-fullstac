import { CreateTransactionUseCase, ValidationError } from './create-transaction.use-case';
import type { ProductRepository } from '../../domain/repositories/product-repository.port';
import type { TransactionRepository } from '../../domain/repositories/transaction-repository.port';
import { Product } from '../../domain/entities/product';
import { Transaction } from '../../domain/entities/transaction';
import { Money } from '../../domain/value-objects/money';

function makeProduct(overrides: Partial<{ id: string; stock: number; price: number }> = {}) {
  return Product.create({
    id: overrides.id ?? 'prod-1',
    name: 'Test',
    description: 'Desc',
    price: Money.create(overrides.price ?? 50000),
    stock: overrides.stock ?? 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeTransaction(params: {
  quantity: number;
  productPrice: number;
  baseFee: number;
  deliveryFee: number;
}) {
  return Transaction.create({
    id: 'tx-1',
    quantity: params.quantity,
    productPrice: Money.create(params.productPrice),
    baseFee: Money.create(params.baseFee),
    deliveryFee: Money.create(params.deliveryFee),
    productId: 'prod-1',
  });
}

const validDto = {
  productId: 'prod-1',
  quantity: 2,
  cardMasked: '**** **** **** 4242',
  customer: { fullName: 'Juan', email: 'juan@test.com', phone: '3001234567' },
  delivery: { address: 'Calle 123', city: 'Bogotá' },
};

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let productRepo: jest.Mocked<ProductRepository>;
  let transactionRepo: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };
    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new CreateTransactionUseCase(productRepo, transactionRepo);
  });

  it('debería crear transacción PENDING con desglose correcto', async () => {
    productRepo.findById.mockResolvedValue(makeProduct({ stock: 10, price: 50000 }));
    const tx = makeTransaction({ quantity: 2, productPrice: 100000, baseFee: 2500, deliveryFee: 15000 });
    transactionRepo.create.mockResolvedValue(tx);

    const result = await useCase.execute(validDto);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status.toString()).toBe('PENDING');
      expect(result.value.totalAmount.amount).toBe(117500); // 100000 + 2500 + 15000
      expect(result.value.baseFee.amount).toBe(2500);
      expect(result.value.deliveryFee.amount).toBe(15000);
    }
  });

  it('debería fallar si quantity <= 0', async () => {
    const result = await useCase.execute({ ...validDto, quantity: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError);
  });

  it('debería fallar si producto no existe', async () => {
    productRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute(validDto);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(ValidationError);
  });

    it('debería propagar error del repositorio', async () => {
    productRepo.findById.mockResolvedValue(makeProduct({ stock: 10 }));
    transactionRepo.create.mockRejectedValue(new Error('DB error'));
    const result = await useCase.execute(validDto);
    expect(result.ok).toBe(false);
  });
});
