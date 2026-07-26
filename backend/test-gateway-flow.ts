import { createHash } from 'crypto';
import 'dotenv/config';

const BASE = process.env.PAYMENT_GATEWAY_API_URL!;
const PUB_KEY = process.env.PAYMENT_GATEWAY_PUBLIC_KEY!;
const PRIV_KEY = process.env.PAYMENT_GATEWAY_PRIVATE_KEY!;
const INT_SECRET = process.env.PAYMENT_GATEWAY_INTEGRITY_SECRET!;

interface CardTokenResponse {
  data: { id: string; brand: string; last_four: string };
}

interface AcceptanceResponse {
  data: {
    presigned_acceptance: { acceptance_token: string };
    presigned_personal_data_auth: { acceptance_token: string };
  };
}

interface TxResponse {
  data: { id: string; status: string; payment_method: { extra: { brand: string } } };
}

async function fetchJson<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body.error)}`);
  return body as T;
}

async function main() {
  console.log('=== 1. Obtener tokens de aceptacion ===');
  const acceptance = await fetchJson<AcceptanceResponse>(`${BASE}/merchants/${PUB_KEY}`);
  const at = acceptance.data.presigned_acceptance.acceptance_token;
  const pat = acceptance.data.presigned_personal_data_auth.acceptance_token;
  console.log(`Acceptance token: ${at.substring(0, 30)}...`);
  console.log(`Personal auth:    ${pat.substring(0, 30)}...`);

  console.log('\n=== 2. Tokenizar tarjeta (Visa 4242) ===');
  const card = await fetchJson<CardTokenResponse>(`${BASE}/tokens/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PUB_KEY}` },
    body: JSON.stringify({
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '28',
      card_holder: 'JUAN PEREZ',
    }),
  });
  console.log(`Token:  ${card.data.id}`);
  console.log(`Brand:  ${card.data.brand}`);
  console.log(`Last 4: ${card.data.last_four}`);

  console.log('\n=== 3. Crear transaccion en sandbox ===');
  const ref = `TEST-${Date.now()}`;
  const amount = 150000;
  const sigStr = `${ref}${amount}COP${INT_SECRET}`;
  const sig = createHash('sha256').update(sigStr).digest('hex');

  const tx = await fetchJson<TxResponse>(`${BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PRIV_KEY}` },
    body: JSON.stringify({
      acceptance_token: at,
      accept_personal_auth: pat,
      amount_in_cents: amount,
      currency: 'COP',
      customer_email: 'test@test.com',
      reference: ref,
      signature: sig,
      payment_method: { type: 'CARD', token: card.data.id, installments: 1 },
    }),
  });
  console.log(`Gateway ID: ${tx.data.id}`);
  console.log(`Status:     ${tx.data.status}`);
  console.log(`Brand:      ${tx.data.payment_method.extra.brand}`);

  if (tx.data.status === 'PENDING') {
    console.log('\n=== 4. Polling estado ===');
    await new Promise((r) => setTimeout(r, 2000));
    const status = await fetchJson<any>(`${BASE}/transactions/${tx.data.id}`, {
      headers: { Authorization: `Bearer ${PUB_KEY}` },
    });
    console.log(`Status final: ${status.data.status}`);
  }

  console.log('\n=== FLUJO COMPLETO EXITOSO ===');
}

main().catch((e) => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
