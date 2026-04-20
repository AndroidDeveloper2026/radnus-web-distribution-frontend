// src/services/features/retailer/retailerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchRetailers = createAsyncThunk('retailer/fetch', async () => {
  const res = await API.get('/api/retailers');
  return res.data;
});

export const addRetailer = createAsyncThunk('retailer/add', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/retailers', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateRetailer = createAsyncThunk('retailer/update', async ({ id, data }) => {
  const res = await API.put(`/api/retailers/${id}`, data);
  return res.data;
});

export const updateRetailerStatus = createAsyncThunk('retailer/status', async ({ id, status }) => {
  const res = await API.patch(`/api/retailers/${id}/status`, { status });
  return res.data;
});

const retailerSlice = createSlice({
  name: 'retailer',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRetailers.pending,         (state) => { state.loading = true; })
      .addCase(fetchRetailers.fulfilled,        (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchRetailers.rejected,         (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(addRetailer.fulfilled,           (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateRetailer.fulfilled,        (state, action) => {
        const idx = state.list.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(updateRetailerStatus.fulfilled,  (state, action) => {
        const idx = state.list.findIndex((r) => r._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default retailerSlice.reducer;
