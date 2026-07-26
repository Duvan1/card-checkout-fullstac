import { Injectable, Logger } from '@nestjs/common';
import {
  type PaymentGatewayPort,
  type PaymentInput,
  type PaymentGatewayResult,
  PaymentGatewayError,
} from '../../domain/repositories/payment-gateway.port';

interface GatewayApiResponse {
  data: {
    id: string;
    status: string;
    payment_method: {
      type: string;
      extra: {
        brand: string;
        last_four: string;
      };
    };
  };
}

interface GatewayApiError {
  error: {
    type: string;
    reason?: string;
    messages?: Record<string, string[]>;
  };
}

@Injectable()
export class PaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewayAdapter.name);

  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    this.baseUrl = process.env.PAYMENT_GATEWAY_API_URL ?? '';
    this.publicKey = process.env.PAYMENT_GATEWAY_PUBLIC_KEY ?? '';
    this.privateKey = process.env.PAYMENT_GATEWAY_PRIVATE_KEY ?? '';

    if (!this.baseUrl || !this.publicKey || !this.privateKey) {
      this.logger.warn('Payment gateway credentials not fully configured');
    }
  }

  async processPayment(
    input: PaymentInput,
  ): Promise<{ ok: true; value: PaymentGatewayResult } | { ok: false; error: PaymentGatewayError }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.privateKey}`,
        },
        body: JSON.stringify({
          acceptance_token: input.acceptanceToken,
          accept_personal_auth: input.acceptPersonalAuth,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          customer_email: input.customerEmail,
          reference: input.reference,
          signature: input.signature,
          payment_method: {
            type: 'CARD',
            token: input.cardToken,
            installments: input.installments,
          },
        }),
      });

      const body = (await response.json()) as GatewayApiResponse | GatewayApiError;

      if (!response.ok) {
        const error = body as GatewayApiError;
        const reason = error.error.reason ?? error.error.type ?? 'Unknown error';
        return {
          ok: false,
          error: new PaymentGatewayError(reason, error.error.type, response.status),
        };
      }

      const data = (body as GatewayApiResponse).data;

      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: data.status,
          brand: data.payment_method.extra?.brand ?? 'UNKNOWN',
          lastFour: data.payment_method.extra?.last_four ?? '****',
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      return {
        ok: false,
        error: new PaymentGatewayError(message, 'NETWORK_ERROR', 0),
      };
    }
  }
}
