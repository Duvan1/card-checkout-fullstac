import { ProcessPaymentUseCase, PaymentValidationError } from './process-payment.use-case';
import type { TransactionRepository } from '../../domain/repositories/transaction-repository.port';
import type { PaymentGatewayPort } from '../../domain/repositories/payment-gateway.port';
import { PaymentGatewayError } from '../../domain/repositories/payment-gateway.port';
import type { Transaction } from '../../domain/entities/transaction';

function mockTx(status: string): Transaction {
  return {
    id: 'tx-test-1234-abcd',
    status: {
      value: status,
      isPending: status === 'PENDING',
      toString: () => status,
      canTransitionTo: () => true,
    },
    totalAmount: { amount: 19000, currency: 'COP' },
    quantity: 1,
    productPrice: { amount: 1500, currency: 'COP' },
    baseFee: { amount: 2500, currency: 'COP' },
    deliveryFee: { amount: 15000, currency: 'COP' },
    cardMasked: null,
    productId: 'prod-1',
    createdAt: new Date(),
  } as unknown as Transaction;
}

const validDto = {
  transactionId: 'tx-test-1234-abcd',
  cardNumber: '4242424242424242',
  cardCvc: '123',
  cardExpiryMonth: '12',
  cardExpiryYear: '28',
  cardHolder: 'JUAN PEREZ',
  installments: 1,
};

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let transactionRepo: jest.Mocked<TransactionRepository>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET = 'test_secret';

    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    paymentGateway = {
      getAcceptanceTokens: jest.fn(),
      tokenizeCard: jest.fn(),
      processPayment: jest.fn(),
    };

    useCase = new ProcessPaymentUseCase(transactionRepo, paymentGateway);
  });

  afterEach(() => {
    delete process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET;
  });

  describe('camino feliz', () => {
    it('debería procesar pago aprobado y actualizar transacción', async () => {
      transactionRepo.findById.mockResolvedValue(mockTx('PENDING'));
      paymentGateway.getAcceptanceTokens.mockResolvedValue({
        ok: true,
        value: { acceptanceToken: 'at-123', acceptPersonalAuth: 'pa-456' },
      });
      paymentGateway.tokenizeCard.mockResolvedValue({
        ok: true,
        value: { token: 'tok-789', brand: 'VISA', lastFour: '4242' },
      });
      paymentGateway.processPayment.mockResolvedValue({
        ok: true,
        value: { transactionId: 'gw-123', status: 'APPROVED', brand: 'VISA', lastFour: '4242' },
      });
      transactionRepo.updateStatus.mockResolvedValue(mockTx('APPROVED'));

      const result = await useCase.execute(validDto);

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.status.toString()).toBe('APPROVED');

      expect(paymentGateway.getAcceptanceTokens).toHaveBeenCalledTimes(1);
      expect(paymentGateway.tokenizeCard).toHaveBeenCalledWith(
        expect.objectContaining({ number: '4242424242424242' }),
      );
      expect(transactionRepo.updateStatus).toHaveBeenCalledWith('tx-test-1234-abcd', 'APPROVED');
    });
  });

  describe('errores', () => {
    it('debería fallar si la transacción no existe', async () => {
      transactionRepo.findById.mockResolvedValue(null);
      const result = await useCase.execute(validDto);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(PaymentValidationError);
        expect(result.error.message).toContain('not found');
      }
    });

    it('debería fallar si la transacción no está en PENDING', async () => {
      transactionRepo.findById.mockResolvedValue(mockTx('APPROVED'));
      const result = await useCase.execute(validDto);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(PaymentValidationError);
        expect(result.error.message).toContain('APPROVED');
      }
    });

    it('debería fallar si falla obtener tokens de aceptación', async () => {
      transactionRepo.findById.mockResolvedValue(mockTx('PENDING'));
      paymentGateway.getAcceptanceTokens.mockResolvedValue({
        ok: false,
        error: new PaymentGatewayError('Auth failed', 'AUTH_ERROR', 401),
      });
      const result = await useCase.execute(validDto);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(PaymentGatewayError);
    });

    it('debería fallar si falla tokenizar tarjeta', async () => {
      transactionRepo.findById.mockResolvedValue(mockTx('PENDING'));
      paymentGateway.getAcceptanceTokens.mockResolvedValue({
        ok: true, value: { acceptanceToken: 'at', acceptPersonalAuth: 'pa' },
      });
      paymentGateway.tokenizeCard.mockResolvedValue({
        ok: false,
        error: new PaymentGatewayError('Invalid card', 'TOKENIZATION_ERROR', 422),
      });
      const result = await useCase.execute(validDto);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBeInstanceOf(PaymentGatewayError);
    });

    it('debería propagar error del gateway al procesar pago', async () => {
      transactionRepo.findById.mockResolvedValue(mockTx('PENDING'));
      paymentGateway.getAcceptanceTokens.mockResolvedValue({
        ok: true, value: { acceptanceToken: 'at', acceptPersonalAuth: 'pa' },
      });
      paymentGateway.tokenizeCard.mockResolvedValue({
        ok: true, value: { token: 'tok', brand: 'VISA', lastFour: '4242' },
      });
      paymentGateway.processPayment.mockResolvedValue({
        ok: false,
        error: new PaymentGatewayError('Fondos insuficientes', 'DECLINED', 422),
      });
      const result = await useCase.execute(validDto);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(PaymentGatewayError);
        expect(result.error.message).toContain('Fondos insuficientes');
      }
    });
  });
});
