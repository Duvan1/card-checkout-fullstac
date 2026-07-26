import { Product } from '../entities/product';

export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  decrementStock(id: string, quantity: number): Promise<Product>;
}

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
