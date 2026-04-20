// src/services/features/Territory/TerritorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchTerritory = createAsyncThunk('territory/fetch', async () => {
  const res = await API.get('/api/territory');
  return res.data;
});

export const addTerritory = createAsyncThunk('territory/add', async (data, { dispatch }) => {
  const res = await API.post('/api/territory', data);
  dispatch(fetchTerritory());
  return res.data;
});

export const updateTerritory = createAsyncThunk('territory/update', async ({ id, data }, { dispatch }) => {
  const res = await API.put(`/api/territory/${id}`, data);
  dispatch(fetchTerritory());
  return res.data;
});

export const deleteTerritory = createAsyncThunk('territory/deleteState', async (stateName, { dispatch }) => {
  await API.delete('/api/territory/state', { data: { state: stateName } });
  dispatch(fetchTerritory());
});

export const deleteDistrict = createAsyncThunk('territory/deleteDistrict', async ({ state, district }, { dispatch }) => {
  await API.delete('/api/territory/district', { data: { state, district } });
  dispatch(fetchTerritory());
});

export const deleteTaluk = createAsyncThunk('territory/deleteTaluk', async (id, { dispatch }) => {
  await API.delete(`/api/territory/taluk/${id}`);
  dispatch(fetchTerritory());
});

const territorySlice = createSlice({
  name: 'territory',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerritory.pending,   (state) => { state.loading = true; })
      .addCase(fetchTerritory.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchTerritory.rejected,  (state, action) => { state.loading = false; state.error = action.error.message; });
  },
});

export default territorySlice.reducer;
