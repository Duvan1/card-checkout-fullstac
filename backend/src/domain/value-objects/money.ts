export class Money {
  readonly currency: string;

  private readonly _amount: number;

  private constructor(amount: number, currency: string) {
    this._amount = amount;
    this.currency = currency;
  }

  static create(amount: number, currency = 'COP'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }

    return new Money(amount, currency.trim().toUpperCase());
  }

  get amount(): number {
    return this._amount;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._amount + other._amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error('Money subtraction would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply money by negative factor');
    }
    return new Money(this._amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._amount > other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on Money with different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
