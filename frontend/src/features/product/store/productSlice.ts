import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService, type ProductDto } from '../api/productService';

interface ProductState {
  products: ProductDto[];
  selectedProduct: ProductDto | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  status: 'idle',
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async () => {
    return productService.getProducts();
  },
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (id: string) => {
    return productService.getProductById(id);
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch products';
      })
      .addCase(fetchProductById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch product';
      });
  },
});

export const { clearSelectedProduct } = productSlice.actions;
export const productReducer = productSlice.reducer;
