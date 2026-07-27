import { Injectable } from '@nestjs/common';
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
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor() {
    this.baseUrl = process.env.PAYMENT_GATEWAY_API_URL ?? '';
    this.publicKey = process.env.PAYMENT_GATEWAY_PUBLIC_KEY ?? '';
    this.privateKey = process.env.PAYMENT_GATEWAY_PRIVATE_KEY ?? '';

    console.error('[Gateway] Init', {
      baseUrl: this.baseUrl ? 'SET' : 'MISSING',
      publicKey: this.publicKey ? 'SET' : 'MISSING',
      privateKey: this.privateKey ? 'SET' : 'MISSING',
    });
  }

  async getAcceptanceTokens(): Promise<
    { ok: true; value: AcceptanceTokens } | { ok: false; error: PaymentGatewayError }
  > {
    const url = `${this.baseUrl}/merchants/${this.publicKey}`;
    console.error('[Gateway] getAcceptanceTokens REQUEST', { url });
    try {
      const res = await fetch(url);
      console.error('[Gateway] getAcceptanceTokens RESPONSE', { status: res.status, ok: res.ok });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error('[Gateway] getAcceptanceTokens ERROR BODY', JSON.stringify(body));
        return {
          ok: false,
          error: new PaymentGatewayError('Failed to get acceptance tokens', 'ACCEPTANCE_TOKEN_ERROR', res.status),
        };
      }

      const body = await res.json();
      console.error('[Gateway] getAcceptanceTokens OK');
      return {
        ok: true,
        value: {
          acceptanceToken: body.data.presigned_acceptance.acceptance_token,
          acceptPersonalAuth: body.data.presigned_personal_data_auth.acceptance_token,
        },
      };
    } catch (err) {
      console.error('[Gateway] getAcceptanceTokens CATCH', {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
      });
      return {
        ok: false,
        error: new PaymentGatewayError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR', 0),
      };
    }
  }

  async tokenizeCard(
    input: CardTokenInput,
  ): Promise<{ ok: true; value: CardTokenResult } | { ok: false; error: PaymentGatewayError }> {
    const body = {
      number: input.number.replace(/\d(?=\d{4})/g, '*'),
      cvc: '***',
      exp_month: input.expMonth,
      exp_year: input.expYear,
      card_holder: input.cardHolder,
    };
    console.error('[Gateway] tokenizeCard REQUEST', JSON.stringify(body));

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

      console.error('[Gateway] tokenizeCard RESPONSE', { status: res.status, ok: res.ok });

      const resBody = await res.json();

      if (!res.ok) {
        console.error('[Gateway] tokenizeCard ERROR BODY', JSON.stringify(resBody));
        const reason = resBody.error?.reason ?? resBody.error?.type ?? 'Tokenization failed';
        return {
          ok: false,
          error: new PaymentGatewayError(reason, 'TOKENIZATION_ERROR', res.status),
        };
      }

      console.error('[Gateway] tokenizeCard OK', { token: resBody.data?.id });
      return {
        ok: true,
        value: {
          token: resBody.data.id,
          brand: resBody.data.brand ?? 'UNKNOWN',
          lastFour: resBody.data.last_four ?? '****',
        },
      };
    } catch (err) {
      console.error('[Gateway] tokenizeCard CATCH', {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
      });
      return {
        ok: false,
        error: new PaymentGatewayError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR', 0),
      };
    }
  }

  async processPayment(
    input: PaymentInput,
  ): Promise<{ ok: true; value: PaymentGatewayResult } | { ok: false; error: PaymentGatewayError }> {
    console.error('[Gateway] processPayment REQUEST', {
      amount: input.amountInCents,
      ref: input.reference,
      email: input.customerEmail,
      hasToken: !!input.cardToken,
    });

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

      console.error('[Gateway] processPayment RESPONSE', { status: res.status, ok: res.ok });

      const resBody = await res.json();

      if (!res.ok) {
        console.error('[Gateway] processPayment ERROR BODY', JSON.stringify(resBody));
        const reason = resBody.error?.reason ?? resBody.error?.type ?? 'Unknown error';
        return {
          ok: false,
          error: new PaymentGatewayError(reason, resBody.error?.type ?? 'PAYMENT_ERROR', res.status),
        };
      }

      const data = resBody.data;
      console.error('[Gateway] processPayment OK', { gwId: data.id, status: data.status });
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
      console.error('[Gateway] processPayment CATCH', {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
      });
      return {
        ok: false,
        error: new PaymentGatewayError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR', 0),
      };
    }
  }

  async getTransactionStatus(
    gatewayTransactionId: string,
  ): Promise<{ ok: true; value: string } | { ok: false; error: PaymentGatewayError }> {
    try {
      const res = await fetch(`${this.baseUrl}/transactions/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${this.publicKey}` },
      });
      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: new PaymentGatewayError('Status check failed', 'STATUS_ERROR', res.status) };
      }
      return { ok: true, value: body.data.status as string };
    } catch (err) {
      return {
        ok: false,
        error: new PaymentGatewayError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR', 0),
      };
    }
  }
}
