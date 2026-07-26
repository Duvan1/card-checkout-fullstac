export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

export interface CardTokenInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface CardTokenResult {
  token: string;
  brand: string;
  lastFour: string;
}

export interface AcceptanceTokens {
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface PaymentInput {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  cardToken: string;
  installments: number;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  signature: string;
}

export interface PaymentGatewayResult {
  transactionId: string;
  status: string;
  brand: string;
  lastFour: string;
}

export interface PaymentGatewayPort {
  getAcceptanceTokens(): Promise<
    { ok: true; value: AcceptanceTokens } | { ok: false; error: PaymentGatewayError }
  >;
  tokenizeCard(
    input: CardTokenInput,
  ): Promise<
    { ok: true; value: CardTokenResult } | { ok: false; error: PaymentGatewayError }
  >;
  processPayment(
    input: PaymentInput,
  ): Promise<{ ok: true; value: PaymentGatewayResult } | { ok: false; error: PaymentGatewayError }>;
}

export const PAYMENT_GATEWAY_PORT = 'PAYMENT_GATEWAY_PORT';
