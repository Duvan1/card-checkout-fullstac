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

export interface ProductFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const productService = {
  getProducts: (filters?: ProductFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    const query = params.toString();
    return apiClient
      .get<ProductDto[]>(`/products${query ? `?${query}` : ''}`)
      .then((res) => res.data);
  },

  getProductById: (id: string) =>
    apiClient.get<ProductDto>(`/products/${id}`).then((res) => res.data),
};
