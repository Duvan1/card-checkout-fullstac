export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  PENDING: ['APPROVED', 'DECLINED', 'ERROR', 'VOIDED'],
  APPROVED: ['VOIDED'],
  DECLINED: [],
  ERROR: [],
  VOIDED: [],
};

export class TransactionStatusValue {
  private constructor(readonly value: TransactionStatus) {}

  static create(status: string): TransactionStatusValue {
    if (!isValidStatus(status)) {
      throw new Error(`Invalid transaction status: ${status}`);
    }
    return new TransactionStatusValue(status as TransactionStatus);
  }

  static pending(): TransactionStatusValue {
    return new TransactionStatusValue('PENDING');
  }

  canTransitionTo(next: TransactionStatus): boolean {
    return VALID_TRANSITIONS[this.value]?.includes(next) ?? false;
  }

  get isPending(): boolean {
    return this.value === 'PENDING';
  }

  toString(): string {
    return this.value;
  }
}

function isValidStatus(value: string): value is TransactionStatus {
  return ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'].includes(value);
}
