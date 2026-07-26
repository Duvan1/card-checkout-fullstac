export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export class CardNumber {
  private readonly _value: string;

  private constructor(
    value: string,
    readonly brand: CardBrand,
    readonly masked: string,
    readonly lastFour: string,
  ) {
    this._value = value;
  }

  static create(raw: string): CardNumber {
    const sanitized = raw.replace(/\s+/g, '');

    if (!/^\d+$/.test(sanitized)) {
      throw new Error('Card number must contain only digits');
    }

    if (sanitized.length < 13 || sanitized.length > 19) {
      throw new Error('Card number must be between 13 and 19 digits');
    }

    if (!luhnCheck(sanitized)) {
      throw new Error('Invalid card number: Luhn check failed');
    }

    const brand = detectBrand(sanitized);

    return new CardNumber(
      sanitized,
      brand,
      maskNumber(sanitized),
      sanitized.slice(-4),
    );
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this.masked;
  }

  toJSON(): string {
    return this.masked;
  }

  equals(other: CardNumber): boolean {
    return this._value === other._value;
  }
}

/**
 * Luhn checksum validation.
 * @see frontend/src/shared/utils/luhn.ts — keep in sync
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let alternate = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let n = parseInt(cardNumber[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Detecta marca por prefijo BIN.
 * @see frontend/src/shared/utils/binDetect.ts — keep in sync
 */
function detectBrand(cardNumber: string): CardBrand {
  if (/^4/.test(cardNumber)) return 'visa';
  if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
  return 'unknown';
}

function maskNumber(cardNumber: string): string {
  const lastFour = cardNumber.slice(-4);
  const maskedLength = cardNumber.length - 4;
  const stars = '*'.repeat(maskedLength);
  const masked = (stars + lastFour).replace(/(.{4})/g, '$1 ').trim();
  return masked;
}
