import { apiClient } from '../../../shared/api/client';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  getProducts: () =>
    apiClient.get<ProductDto[]>('/api/products').then((res) => res.data),

  getProductById: (id: string) =>
    apiClient.get<ProductDto>(`/api/products/${id}`).then((res) => res.data),
};
