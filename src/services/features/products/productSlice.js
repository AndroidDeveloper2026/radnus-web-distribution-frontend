// src/services/features/products/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const res = await API.get('/api/products');
  return res.data;
});

export const addProduct = createAsyncThunk('products/add', async (formData) => {
  const res = await API.post('/api/products/add', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }) => {
  const res = await API.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
});

export const deleteProduct = createAsyncThunk('products/delete', async (id) => {
  await API.delete(`/api/products/${id}`);
  return id;
});

export const reduceStock = createAsyncThunk('products/reduceStock', async (items, { rejectWithValue }) => {
  try {
    const payload = items.map((item) => ({ productId: item.id, qty: item.qty }));
    const res = await API.post('/api/products/reduce-stock', { items: payload });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Stock update failed');
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchProducts.rejected,  (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(addProduct.fulfilled,    (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload);
      });
  },
});

export default productSlice.reducer;
