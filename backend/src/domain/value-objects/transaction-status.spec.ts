import { TransactionStatusValue } from './transaction-status';

describe('TransactionStatusValue', () => {
  describe('create', () => {
    it('debería crear PENDING', () => {
      const status = TransactionStatusValue.create('PENDING');
      expect(status.value).toBe('PENDING');
    });

    it('debería rechazar estado inválido', () => {
      expect(() => TransactionStatusValue.create('INVALID')).toThrow('Invalid transaction status');
    });
  });

  describe('pending', () => {
    it('debería crear estado PENDING', () => {
      const status = TransactionStatusValue.pending();
      expect(status.isPending).toBe(true);
    });
  });

  describe('canTransitionTo', () => {
    it('PENDING puede transicionar a APPROVED', () => {
      expect(TransactionStatusValue.pending().canTransitionTo('APPROVED')).toBe(true);
    });

    it('PENDING puede transicionar a DECLINED', () => {
      expect(TransactionStatusValue.pending().canTransitionTo('DECLINED')).toBe(true);
    });

    it('APPROVED no puede transicionar a DECLINED', () => {
      expect(TransactionStatusValue.create('APPROVED').canTransitionTo('DECLINED')).toBe(false);
    });

    it('APPROVED puede transicionar a VOIDED', () => {
      expect(TransactionStatusValue.create('APPROVED').canTransitionTo('VOIDED')).toBe(true);
    });

    it('DECLINED no puede transicionar', () => {
      expect(TransactionStatusValue.create('DECLINED').canTransitionTo('APPROVED')).toBe(false);
    });
  });

  describe('toString', () => {
    it('debería retornar el valor', () => {
      expect(TransactionStatusValue.pending().toString()).toBe('PENDING');
    });
  });
});
