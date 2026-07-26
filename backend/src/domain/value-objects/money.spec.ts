import { Money } from './money';

describe('Money', () => {
  describe('create', () => {
    it('should create a Money with default COP currency', () => {
      const money = Money.create(1000);
      expect(money.amount).toBe(1000);
      expect(money.currency).toBe('COP');
    });

    it('should create a Money with custom currency', () => {
      const money = Money.create(500, 'USD');
      expect(money.amount).toBe(500);
      expect(money.currency).toBe('USD');
    });

    it('should uppercase currency code', () => {
      const money = Money.create(100, 'cop');
      expect(money.currency).toBe('COP');
    });

    it('should throw if amount is negative', () => {
      expect(() => Money.create(-1)).toThrow('Money amount cannot be negative');
    });

    it('should throw if currency is empty', () => {
      expect(() => Money.create(100, '')).toThrow('Currency cannot be empty');
    });

    it('should throw if currency is whitespace only', () => {
      expect(() => Money.create(100, '   ')).toThrow('Currency cannot be empty');
    });

    it('should accept zero amount', () => {
      const money = Money.create(0);
      expect(money.amount).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two money values with same currency', () => {
      const a = Money.create(1000);
      const b = Money.create(500);
      const result = a.add(b);
      expect(result.amount).toBe(1500);
      expect(result.currency).toBe('COP');
    });

    it('should throw if currencies differ', () => {
      const a = Money.create(1000, 'COP');
      const b = Money.create(500, 'USD');
      expect(() => a.add(b)).toThrow('different currencies');
    });
  });

  describe('subtract', () => {
    it('should subtract two money values', () => {
      const a = Money.create(1000);
      const b = Money.create(300);
      const result = a.subtract(b);
      expect(result.amount).toBe(700);
    });

    it('should throw if result would be negative', () => {
      const a = Money.create(100);
      const b = Money.create(300);
      expect(() => a.subtract(b)).toThrow('negative amount');
    });

    it('should throw if currencies differ', () => {
      const a = Money.create(1000, 'COP');
      const b = Money.create(500, 'USD');
      expect(() => a.subtract(b)).toThrow('different currencies');
    });
  });

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = Money.create(100);
      const result = money.multiply(3);
      expect(result.amount).toBe(300);
    });

    it('should throw if factor is negative', () => {
      const money = Money.create(100);
      expect(() => money.multiply(-1)).toThrow('negative factor');
    });

    it('should return zero when multiplying by zero', () => {
      const money = Money.create(100);
      const result = money.multiply(0);
      expect(result.amount).toBe(0);
    });
  });

  describe('comparisons', () => {
    it('should return true when a is greater than b', () => {
      const a = Money.create(1000);
      const b = Money.create(500);
      expect(a.isGreaterThan(b)).toBe(true);
    });

    it('should return false when a is not greater', () => {
      const a = Money.create(500);
      const b = Money.create(1000);
      expect(a.isGreaterThan(b)).toBe(false);
    });

    it('should throw if currencies differ on isGreaterThan', () => {
      const a = Money.create(1000, 'COP');
      const b = Money.create(500, 'USD');
      expect(() => a.isGreaterThan(b)).toThrow('different currencies');
    });

    it('should return true when amount is zero', () => {
      expect(Money.create(0).isZero()).toBe(true);
    });

    it('should return false when amount is not zero', () => {
      expect(Money.create(100).isZero()).toBe(false);
    });

    it('should return true for equal money', () => {
      const a = Money.create(100, 'COP');
      const b = Money.create(100, 'COP');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = Money.create(100, 'COP');
      const b = Money.create(200, 'COP');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const a = Money.create(100, 'COP');
      const b = Money.create(100, 'USD');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not mutate original money on add', () => {
      const a = Money.create(1000);
      a.add(Money.create(500));
      expect(a.amount).toBe(1000);
    });

    it('should not mutate original money on multiply', () => {
      const a = Money.create(100);
      a.multiply(3);
      expect(a.amount).toBe(100);
    });
  });
});
