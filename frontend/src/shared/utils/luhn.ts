/**
 * Luhn checksum validation.
 * @see backend/src/domain/value-objects/card-number.ts — keep in sync
 */
export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s+/g, '');
  if (!/^\d+$/.test(digits)) return false;
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s+/g, '');
  if (digits.length < 4) return digits;
  const lastFour = digits.slice(-4);
  const stars = '*'.repeat(Math.max(0, digits.length - 4));
  return (stars + lastFour)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\s+/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
