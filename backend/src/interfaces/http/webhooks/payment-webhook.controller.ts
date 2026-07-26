import { createHash } from 'crypto';
import { Controller, Post, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Request } from 'express';
import type { TransactionRepository } from '../../../domain/repositories/transaction-repository.port';
import { TRANSACTION_REPOSITORY } from '../../../domain/repositories/transaction-repository.port';
import type { TransactionStatus } from '../../../domain/value-objects/transaction-status';
import type { ProductRepository } from '../../../domain/repositories/product-repository.port';
import { PRODUCT_REPOSITORY } from '../../../domain/repositories/product-repository.port';

@Controller('webhooks')
export class PaymentWebhookController {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepo: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  @Post('payment-events')
  @HttpCode(HttpStatus.OK)
  async handleEvent(
    @Req() req: Request,
    @Headers('x-event-checksum') headerChecksum: string,
  ) {
    const body = req.body;
    const secret = process.env.PAYMENT_GATEWAY_EVENTS_SECRET ?? '';

    const isValid = this.verifySignature(body, headerChecksum, secret);
    if (!isValid) {
      return { received: false };
    }

    const event = body.event as string;
    if (event !== 'transaction.updated') {
      return { received: true };
    }

    const txData = body.data?.transaction;
    if (!txData) {
      return { received: true };
    }

    const gatewayTxId = txData.id as string;
    const status = txData.status as string;

    if (!['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
      return { received: true };
    }

    const tx = await this.transactionRepo.findByGatewayReference(gatewayTxId);
    if (!tx) {
      return { received: true };
    }

    if (!tx.status.isPending) {
      return { received: true };
    }

    await this.transactionRepo.updateStatus(tx.id, status as TransactionStatus);

    if (status === 'APPROVED') {
      try {
        await this.productRepo.decrementStock(tx.productId, tx.quantity);
      } catch {}
    }

    return { received: true };
  }

  private verifySignature(
    body: Record<string, unknown>,
    headerChecksum: string,
    secret: string,
  ): boolean {
    if (!secret || !headerChecksum) return false;

    try {
      const properties = (body.signature as any)?.properties as string[];
      const timestamp = body.timestamp as number;

      if (!properties || !timestamp) return false;

      const values = properties.map((prop: string) => {
        const parts = prop.split('.');
        let value: any = body.data;
        for (const part of parts) {
          value = value?.[part];
        }
        return String(value ?? '');
      });

      const concatenated = values.join('') + timestamp + secret;
      const computed = createHash('sha256').update(concatenated).digest('hex');

      return computed.toUpperCase() === headerChecksum.toUpperCase();
    } catch {
      return false;
    }
  }
}
