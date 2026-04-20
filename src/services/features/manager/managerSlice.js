// src/services/features/manager/managerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const getManagers = createAsyncThunk('manager/getAll', async (_, { rejectWithValue }) => {
  try { const res = await API.get('/api/managers'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const addManager = createAsyncThunk('manager/add', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/managers', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteManager = createAsyncThunk('manager/delete', async (id) => {
  await API.delete(`/api/managers/${id}`);
  return id;
});

const managerSlice = createSlice({
  name: 'manager',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getManagers.pending,   (state) => { state.loading = true; })
      .addCase(getManagers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(getManagers.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addManager.fulfilled,  (state, action) => { state.list.unshift(action.payload); })
      .addCase(deleteManager.fulfilled, (state, action) => {
        state.list = state.list.filter(m => m._id !== action.payload);
      });
  },
});

export default managerSlice.reducer;
