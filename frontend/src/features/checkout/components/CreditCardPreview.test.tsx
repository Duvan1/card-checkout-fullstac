import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { CreditCardPreview } from './CreditCardPreview';

describe('CreditCardPreview', () => {
  it('debería mostrar número enmascarado por defecto', () => {
    render(
      <CreditCardPreview cardNumber="" cardHolder="" cardExpiry="" brand={null} />,
    );
    expect(screen.getByText('**** **** **** ****')).toBeInTheDocument();
  });

  it('debería mostrar titular por defecto', () => {
    render(
      <CreditCardPreview cardNumber="" cardHolder="" cardExpiry="" brand={null} />,
    );
    expect(screen.getByText('NOMBRE DEL TITULAR')).toBeInTheDocument();
  });

  it('debería mostrar número enmascarado con datos reales', () => {
    render(
      <CreditCardPreview
        cardNumber="4242424242424242"
        cardHolder="JUAN PÉREZ"
        cardExpiry="12/26"
        brand="visa"
      />,
    );
    expect(screen.getByText('**** **** **** 4242')).toBeInTheDocument();
  });

  it('debería mostrar nombre del titular', () => {
    render(
      <CreditCardPreview
        cardNumber="4242424242424242"
        cardHolder="JUAN PÉREZ"
        cardExpiry="12/26"
        brand="visa"
      />,
    );
    expect(screen.getByText('JUAN PÉREZ')).toBeInTheDocument();
  });

  it('debería mostrar fecha de expiración', () => {
    render(
      <CreditCardPreview
        cardNumber=""
        cardHolder=""
        cardExpiry="12/26"
        brand={null}
      />,
    );
    expect(screen.getByText('12/26')).toBeInTheDocument();
  });

  it('debería mostrar marca VISA', () => {
    render(
      <CreditCardPreview cardNumber="" cardHolder="" cardExpiry="" brand="visa" />,
    );
    expect(screen.getByText('VISA')).toBeInTheDocument();
  });

  it('debería mostrar marca MC para MasterCard', () => {
    render(
      <CreditCardPreview cardNumber="" cardHolder="" cardExpiry="" brand="mastercard" />,
    );
    expect(screen.getByText('MC')).toBeInTheDocument();
  });

  it('no debería mostrar marca cuando es unknown', () => {
    render(
      <CreditCardPreview cardNumber="" cardHolder="" cardExpiry="" brand={null} />,
    );
    expect(screen.queryByText('VISA')).not.toBeInTheDocument();
    expect(screen.queryByText('MC')).not.toBeInTheDocument();
  });
});
