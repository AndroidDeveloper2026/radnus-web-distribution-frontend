import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchInvoices = createAsyncThunk(
  'invoice/fetchInvoices',
  async ({ filter = 'all', billerName = '' }, { rejectWithValue }) => {
    try {
      let url = `/api/invoices?filter=${filter}`;
      if (billerName && billerName.trim() !== "") {
        url += `&billerName=${encodeURIComponent(billerName)}`;
      }
      const res = await API.get(url);
      return { filter, data: res.data };
    } catch (err) {
      console.error("fetchInvoices error:", err);
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch invoices');
    }
  }
);

export const fetchInvoiceCounts = createAsyncThunk(
  'invoice/fetchInvoiceCounts',
  async (billerName = '', { rejectWithValue }) => {
    try {
      const filters = ['all', 'today', 'week', 'month'];
      const results = await Promise.all(
        filters.map(async (f) => {
          let url = `/api/invoices?filter=${f}`;
          if (billerName && billerName.trim() !== "") {
            url += `&billerName=${encodeURIComponent(billerName)}`;
          }
          const res = await API.get(url);
          return res.data.length;
        })
      );
      return {
        all: results[0],
        today: results[1],
        week: results[2],
        month: results[3],
      };
    } catch (err) {
      console.error("fetchInvoiceCounts error:", err);
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch counts');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    data: [],
    counts: { all: 0, today: 0, week: 0, month: 0 },
    loading: false,
    error: null,
  },
  reducers: {
    clearInvoices: (state) => {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInvoiceCounts.fulfilled, (state, action) => {
        state.counts = action.payload;
      });
  },
});

export const { clearInvoices } = invoiceSlice.actions;
export default invoiceSlice.reducer;