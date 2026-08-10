import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchSuppliers = createAsyncThunk(
  'suppliers/fetch',
  async ({ search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await API.get(`/api/suppliers${qs ? `?${qs}` : ''}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch suppliers');
    }
  }
);

export const addSupplier = createAsyncThunk(
  'suppliers/add',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/suppliers', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to add supplier');
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'suppliers/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/api/suppliers/${id}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to update supplier');
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'suppliers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/api/suppliers/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to delete supplier');
    }
  }
);

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState: { list: [], loading: false, error: null, submitting: false, submitError: null },
  reducers: {
    clearSupplierErrors: (state) => {
      state.error = null;
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSuppliers.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchSuppliers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addSupplier.pending, (state) => { state.submitting = true; state.submitError = null; })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.submitting = false;
        state.list.unshift({ ...action.payload, purchaseCount: 0, outstandingBalance: 0 });
      })
      .addCase(addSupplier.rejected, (state, action) => { state.submitting = false; state.submitError = action.payload; })

      .addCase(updateSupplier.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], ...action.payload };
      })

      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s._id !== action.payload);
      });
  },
});

export const { clearSupplierErrors } = supplierSlice.actions;
export default supplierSlice.reducer;
