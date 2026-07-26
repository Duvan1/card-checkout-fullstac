import { Injectable, Logger } from '@nestjs/common';
import {
  type PaymentGatewayPort,
  type PaymentInput,
  type PaymentGatewayResult,
  type AcceptanceTokens,
  type CardTokenInput,
  type CardTokenResult,
  PaymentGatewayError,
} from '../../domain/repositories/payment-gateway.port';

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

  async getAcceptanceTokens(): Promise<
    { ok: true; value: AcceptanceTokens } | { ok: false; error: PaymentGatewayError }
  > {
    try {
      const res = await fetch(`${this.baseUrl}/merchants/${this.publicKey}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          ok: false,
          error: new PaymentGatewayError(
            'Failed to get acceptance tokens',
            'ACCEPTANCE_TOKEN_ERROR',
            res.status,
          ),
        };
      }

      const body = await res.json();
      return {
        ok: true,
        value: {
          acceptanceToken: body.data.presigned_acceptance.acceptance_token,
          acceptPersonalAuth: body.data.presigned_personal_data_auth.acceptance_token,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: new PaymentGatewayError(
          err instanceof Error ? err.message : 'Network error',
          'NETWORK_ERROR',
          0,
        ),
      };
    }
  }

  async tokenizeCard(
    input: CardTokenInput,
  ): Promise<{ ok: true; value: CardTokenResult } | { ok: false; error: PaymentGatewayError }> {
    try {
      const res = await fetch(`${this.baseUrl}/tokens/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.publicKey}`,
        },
        body: JSON.stringify({
          number: input.number,
          cvc: input.cvc,
          exp_month: input.expMonth,
          exp_year: input.expYear,
          card_holder: input.cardHolder,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const reason = body.error?.reason ?? body.error?.type ?? 'Tokenization failed';
        return {
          ok: false,
          error: new PaymentGatewayError(reason, 'TOKENIZATION_ERROR', res.status),
        };
      }

      const body = await res.json();

      return {
        ok: true,
        value: {
          token: body.data.id,
          brand: body.data.brand ?? 'UNKNOWN',
          lastFour: body.data.last_four ?? '****',
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: new PaymentGatewayError(
          err instanceof Error ? err.message : 'Network error',
          'NETWORK_ERROR',
          0,
        ),
      };
    }
  }

  async processPayment(
    input: PaymentInput,
  ): Promise<{ ok: true; value: PaymentGatewayResult } | { ok: false; error: PaymentGatewayError }> {
    try {
      const res = await fetch(`${this.baseUrl}/transactions`, {
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

      const body = await res.json();

      if (!res.ok) {
        const reason = body.error?.reason ?? body.error?.type ?? 'Unknown error';
        return {
          ok: false,
          error: new PaymentGatewayError(reason, body.error?.type ?? 'PAYMENT_ERROR', res.status),
        };
      }

      const data = body.data;

      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: data.status,
          brand: data.payment_method?.extra?.brand ?? 'UNKNOWN',
          lastFour: data.payment_method?.extra?.last_four ?? '****',
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: new PaymentGatewayError(
          err instanceof Error ? err.message : 'Network error',
          'NETWORK_ERROR',
          0,
        ),
      };
    }
  }
}
