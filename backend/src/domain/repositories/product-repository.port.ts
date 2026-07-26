import { Product } from '../entities/product';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  decrementStock(id: string, quantity: number): Promise<Product>;
}

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
