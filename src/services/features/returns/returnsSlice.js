import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

// ─── Sales Returns ───────────────────────────────────────────────

export const fetchSalesReturns = createAsyncThunk(
  'returns/fetchSalesReturns',
  async ({ billerName = '' } = {}, { rejectWithValue }) => {
    try {
      let url = `/api/sales-returns`;
      if (billerName && billerName.trim() !== '') {
        url += `?billerName=${encodeURIComponent(billerName)}`;
      }
      const res = await API.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch sales returns');
    }
  }
);

export const createSalesReturn = createAsyncThunk(
  'returns/createSalesReturn',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await API.post(`/api/sales-returns`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to create sales return');
    }
  }
);

export const deleteSalesReturn = createAsyncThunk(
  'returns/deleteSalesReturn',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/api/sales-returns/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to delete sales return');
    }
  }
);

// ─── Purchase Returns ─────────────────────────────────────────────

export const fetchPurchaseReturns = createAsyncThunk(
  'returns/fetchPurchaseReturns',
  async ({ billerName = '' } = {}, { rejectWithValue }) => {
    try {
      let url = `/api/purchase-returns`;
      if (billerName && billerName.trim() !== '') {
        url += `?billerName=${encodeURIComponent(billerName)}`;
      }
      const res = await API.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchase returns');
    }
  }
);

export const createPurchaseReturn = createAsyncThunk(
  'returns/createPurchaseReturn',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await API.post(`/api/purchase-returns`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to create purchase return');
    }
  }
);

export const deletePurchaseReturn = createAsyncThunk(
  'returns/deletePurchaseReturn',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/api/purchase-returns/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to delete purchase return');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────

const returnsSlice = createSlice({
  name: 'returns',
  initialState: {
    salesReturns: [],
    purchaseReturns: [],
    salesLoading: false,
    purchaseLoading: false,
    salesError: null,
    purchaseError: null,
    submitting: false,
    submitError: null,
  },
  reducers: {
    clearReturnsErrors: (state) => {
      state.salesError = null;
      state.purchaseError = null;
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    // Sales Returns
    builder
      .addCase(fetchSalesReturns.pending, (state) => {
        state.salesLoading = true;
        state.salesError = null;
      })
      .addCase(fetchSalesReturns.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.salesReturns = action.payload;
      })
      .addCase(fetchSalesReturns.rejected, (state, action) => {
        state.salesLoading = false;
        state.salesError = action.payload;
      })
      .addCase(createSalesReturn.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createSalesReturn.fulfilled, (state, action) => {
        state.submitting = false;
        state.salesReturns.unshift(action.payload);
      })
      .addCase(createSalesReturn.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })
      .addCase(deleteSalesReturn.fulfilled, (state, action) => {
        state.salesReturns = state.salesReturns.filter((r) => r._id !== action.payload);
      })

    // Purchase Returns
      .addCase(fetchPurchaseReturns.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(fetchPurchaseReturns.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseReturns = action.payload;
      })
      .addCase(fetchPurchaseReturns.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload;
      })
      .addCase(createPurchaseReturn.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createPurchaseReturn.fulfilled, (state, action) => {
        state.submitting = false;
        state.purchaseReturns.unshift(action.payload);
      })
      .addCase(createPurchaseReturn.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })
      .addCase(deletePurchaseReturn.fulfilled, (state, action) => {
        state.purchaseReturns = state.purchaseReturns.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearReturnsErrors } = returnsSlice.actions;
export default returnsSlice.reducer;
