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
  processPayment(
    input: PaymentInput,
  ): Promise<{ ok: true; value: PaymentGatewayResult } | { ok: false; error: PaymentGatewayError }>;
}
