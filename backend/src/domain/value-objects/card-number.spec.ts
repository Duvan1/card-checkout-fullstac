import { CardNumber } from './card-number';

describe('CardNumber', () => {
  describe('create', () => {
    it('debería crear un CardNumber válido con Luhn correcto (Visa)', () => {
      const card = CardNumber.create('4242424242424242');
      expect(card.brand).toBe('visa');
      expect(card.lastFour).toBe('4242');
      expect(card.masked).toBe('**** **** **** 4242');
    });

    it('debería detectar MasterCard', () => {
      const card = CardNumber.create('5555555555554444');
      expect(card.brand).toBe('mastercard');
      expect(card.lastFour).toBe('4444');
    });

    it('debería aceptar número con espacios', () => {
      const card = CardNumber.create('4242 4242 4242 4242');
      expect(card.lastFour).toBe('4242');
    });

    it('debería devolver unknown para marca no reconocida', () => {
      const card = CardNumber.create('6011111111111117');
      expect(card.brand).toBe('unknown');
    });

    it('debería rechazar número que no pasa Luhn', () => {
      expect(() => CardNumber.create('4242424242424243')).toThrow('Luhn check failed');
    });

    it('debería rechazar letras', () => {
      expect(() => CardNumber.create('abcdabcdabcdabcd')).toThrow('only digits');
    });

    it('debería rechazar número muy corto', () => {
      expect(() => CardNumber.create('4242')).toThrow('between 13 and 19');
    });

    it('debería rechazar número muy largo', () => {
      expect(() => CardNumber.create('42424242424242424242')).toThrow('between 13 and 19');
    });
  });

  describe('toString / toJSON', () => {
    it('nunca debe exponer el número completo', () => {
      const card = CardNumber.create('4242424242424242');
      expect(card.toString()).toBe('**** **** **** 4242');
      expect(card.toJSON()).toBe('**** **** **** 4242');
      expect(card.toString()).not.toContain('4242424242424242');
    });
  });

  describe('equals', () => {
    it('debería comparar dos tarjetas iguales', () => {
      const a = CardNumber.create('4242424242424242');
      const b = CardNumber.create('4242 4242 4242 4242');
      expect(a.equals(b)).toBe(true);
    });

    it('debería detectar tarjetas diferentes', () => {
      const a = CardNumber.create('4242424242424242');
      const b = CardNumber.create('5555555555554444');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('máscara de 15 dígitos (Amex)', () => {
    it('debería enmascarar correctamente números de 15 dígitos', () => {
      const card = CardNumber.create('378282246310005');
      expect(card.masked).toBe('**** **** ***0 005');
      expect(card.lastFour).toBe('0005');
    });
  });
});
