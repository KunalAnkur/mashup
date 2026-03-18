import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product, ProductState } from "@/types/storeTypes";

const initialState: ProductState = {
  items: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    setProductLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProductError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false;
      }
    },
    clearProducts: (state) => {
      state.items = [];
      state.error = null;
      state.loading = false;
    },
  },
});

export const { setProducts, setProductLoading, setProductError, clearProducts } =
  productSlice.actions;

export default productSlice;
