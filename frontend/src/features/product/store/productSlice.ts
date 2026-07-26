import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService, type ProductDto, type ProductFilters } from '../api/productService';

interface FilterState {
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface ProductState {
  products: ProductDto[];
  selectedProduct: ProductDto | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  filters: FilterState;
}

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  status: 'idle',
  error: null,
  filters: {
    search: '',
    sortBy: '',
    sortOrder: 'desc',
  },
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (filters: ProductFilters | undefined) => {
    return productService.getProducts(filters);
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
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
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
        state.error = action.error.message ?? 'Error al obtener productos';
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
        state.error = action.error.message ?? 'Error al obtener producto';
      });
  },
});

export const { clearSelectedProduct, setFilter, clearFilters } = productSlice.actions;
export const productReducer = productSlice.reducer;
