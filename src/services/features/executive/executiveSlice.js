// src/services/features/executive/executiveSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const getExecutives = createAsyncThunk('executive/getAll', async (_, { rejectWithValue }) => {
  try { const res = await API.get('/api/executives'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data); }
});

export const addExecutive = createAsyncThunk('executive/add', async (data, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/executives', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) { return rejectWithValue(err.response?.data); }
});

export const deleteExecutive = createAsyncThunk('executive/delete', async (id) => {
  await API.delete(`/api/executives/${id}`);
  return id;
});

const executiveSlice = createSlice({
  name: 'executive',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getExecutives.pending,   (state) => { state.loading = true; })
      .addCase(getExecutives.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(getExecutives.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addExecutive.fulfilled,  (state, action) => { state.list.unshift(action.payload); })
      .addCase(deleteExecutive.fulfilled, (state, action) => {
        state.list = state.list.filter(e => e._id !== action.payload);
      });
  },
});

export default executiveSlice.reducer;
