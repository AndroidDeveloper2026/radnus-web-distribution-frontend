// src/services/features/fse/fseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchFSE = createAsyncThunk('fse/fetchAll', async (_, { rejectWithValue }) => {
  try { const res = await API.get('/api/fse'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const addFSE = createAsyncThunk('fse/add', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/fse', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const updateFSEStatus = createAsyncThunk('fse/updateStatus', async ({ id, status }) => {
  const res = await API.patch(`/api/fse/${id}/status`, { status });
  return res.data;
});

const fseSlice = createSlice({
  name: 'fse',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFSE.pending,   (state) => { state.loading = true; })
      .addCase(fetchFSE.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchFSE.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addFSE.fulfilled,   (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateFSEStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex(f => f._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default fseSlice.reducer;
