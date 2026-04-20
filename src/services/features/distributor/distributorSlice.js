// src/services/features/distributor/distributorSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchDistributors = createAsyncThunk('distributors/fetch', async (_, { rejectWithValue }) => {
  try { const res = await API.get('/api/distributors'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Fetch failed'); }
});

export const addDistributor = createAsyncThunk('distributors/add', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/distributors', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Add failed'); }
});

export const updateDistributor = createAsyncThunk('distributors/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await API.put(`/api/distributors/${id}`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Update failed'); }
});

export const deleteDistributor = createAsyncThunk('distributors/delete', async (id) => {
  await API.delete(`/api/distributors/${id}`);
  return id;
});

const distributorSlice = createSlice({
  name: 'distributors',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDistributors.pending,   (state) => { state.loading = true; })
      .addCase(fetchDistributors.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchDistributors.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addDistributor.fulfilled,    (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateDistributor.fulfilled, (state, action) => {
        const idx = state.list.findIndex(d => d._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteDistributor.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d._id !== action.payload);
      });
  },
});

export default distributorSlice.reducer;
