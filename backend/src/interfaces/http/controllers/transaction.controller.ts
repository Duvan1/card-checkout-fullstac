import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateTransactionUseCase,
  ValidationError,
  InsufficientStockError,
} from '../../../application/use-cases/create-transaction.use-case';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
  ) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const result = await this.createTransactionUseCase.execute({
      productId: body.productId as string,
      quantity: body.quantity as number,
      cardMasked: body.cardMasked as string | undefined,
      customer: body.customer as { fullName: string; email: string; phone: string },
      delivery: body.delivery as { address: string; city: string },
    });

    if (!result.ok) {
      if (result.error instanceof ValidationError) {
        throw new BadRequestException(result.error.message);
      }
      if (result.error instanceof InsufficientStockError) {
        throw new BadRequestException(result.error.message);
      }
      throw new InternalServerErrorException(result.error.message);
    }

    return {
      id: result.value.id,
      status: result.value.status.toString(),
      quantity: result.value.quantity,
      totalAmount: result.value.totalAmount.amount,
      currency: result.value.totalAmount.currency,
      baseFee: result.value.baseFee.amount,
      deliveryFee: result.value.deliveryFee.amount,
      productPrice: result.value.productPrice.amount,
      cardMasked: result.value.cardMasked,
      createdAt: result.value.createdAt,
    };
  }
}
