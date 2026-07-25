// // services/features/purchase/purchaseSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// // ─── Purchase Entries ────────────────────────────────────────────

// export const fetchPurchases = createAsyncThunk(
//   'purchases/fetch',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       Object.entries(filters).forEach(([k, v]) => {
//         if (v !== undefined && v !== null && v !== '') params.set(k, v);
//       });
//       const qs = params.toString();
//       const res = await API.get(`/api/purchases${qs ? `?${qs}` : ''}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchases');
//     }
//   }
// );

// export const fetchPurchaseById = createAsyncThunk(
//   'purchases/fetchOne',
//   async (id, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/${id}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchase');
//     }
//   }
// );

// export const createPurchase = createAsyncThunk(
//   'purchases/create',
//   async (payload, { rejectWithValue }) => {
//     try {
//       const res = await API.post('/api/purchases', payload);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to save purchase entry');
//     }
//   }
// );

// export const updatePurchase = createAsyncThunk(
//   'purchases/update',
//   async ({ id, payload }, { rejectWithValue }) => {
//     try {
//       const res = await API.put(`/api/purchases/${id}`, payload);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to update purchase');
//     }
//   }
// );

// // ─── Reports ──────────────────────────────────────────────────────

// export const fetchStockAging = createAsyncThunk(
//   'purchases/stockAging',
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await API.get('/api/purchases/stock-aging');
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch stock aging report');
//     }
//   }
// );

// export const fetchNonMovingStock = createAsyncThunk(
//   'purchases/nonMovingStock',
//   async (days = 60, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/non-moving-stock?days=${days}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch non-moving stock report');
//     }
//   }
// );

// export const fetchPriceHistory = createAsyncThunk(
//   'purchases/priceHistory',
//   async (productId, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/price-history/${productId}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch price history');
//     }
//   }
// );

// // ─── Product Price History ────────────────────────────────────────

// export const fetchProductPriceHistory = createAsyncThunk(
//   'purchases/productPriceHistory',
//   async (productId, { rejectWithValue }) => {
//     try {
//       // Validate that productId is a valid ObjectId
//       if (!productId || productId.length !== 24) {
//         return rejectWithValue('Invalid product ID format - must be 24 character hex string');
//       }
      
//       const res = await API.get(`/api/purchases/product-price-history/${productId}`);
//       return res.data;
//     } catch (err) {
//       const status = err.response?.status;
//       const apiMsg = err.response?.data?.msg;
//       const detail = apiMsg || (status ? `Request failed with status ${status}` : err.message) || 'Unknown error';
//       return rejectWithValue(detail);
//     }
//   }
// );

// // ─── Slice ─────────────────────────────────────────────────────────

// const purchaseSlice = createSlice({
//   name: 'purchases',
//   initialState: {
//     list: [],
//     loading: false,
//     error: null,
//     submitting: false,
//     submitError: null,
//     current: null,
//     stockAging: { '0-30': [], '31-60': [], '61-90': [], '91-180': [], '180+': [] },
//     stockAgingLoading: false,
//     nonMovingStock: [],
//     nonMovingLoading: false,
//     priceHistory: [],
//     priceHistoryLoading: false,
//     productPriceHistory: null,
//     productPriceHistoryLoading: false,
//     productPriceHistoryError: null,
//   },
//   reducers: {
//     clearPurchaseErrors: (state) => {
//       state.error = null;
//       state.submitError = null;
//     },
//     clearCurrentPurchase: (state) => {
//       state.current = null;
//     },
//     clearPriceHistory: (state) => {
//       state.priceHistory = [];
//     },
//     clearProductPriceHistory: (state) => {
//       state.productPriceHistory = null;
//       state.productPriceHistoryError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // ─── Fetch Purchases ──────────────────────────────────────────
//       .addCase(fetchPurchases.pending, (state) => { 
//         state.loading = true; 
//         state.error = null; 
//       })
//       .addCase(fetchPurchases.fulfilled, (state, action) => { 
//         state.loading = false; 
//         state.list = action.payload; 
//       })
//       .addCase(fetchPurchases.rejected, (state, action) => { 
//         state.loading = false; 
//         state.error = action.payload; 
//       })

//       // ─── Fetch Purchase By ID ────────────────────────────────────
//       .addCase(fetchPurchaseById.fulfilled, (state, action) => { 
//         state.current = action.payload; 
//       })

//       // ─── Create Purchase ─────────────────────────────────────────
//       .addCase(createPurchase.pending, (state) => { 
//         state.submitting = true; 
//         state.submitError = null; 
//       })
//       .addCase(createPurchase.fulfilled, (state, action) => {
//         state.submitting = false;
//         state.list.unshift(action.payload);
//       })
//       .addCase(createPurchase.rejected, (state, action) => { 
//         state.submitting = false; 
//         state.submitError = action.payload; 
//       })

//       // ─── Update Purchase ─────────────────────────────────────────
//       .addCase(updatePurchase.fulfilled, (state, action) => {
//         const idx = state.list.findIndex((p) => p._id === action.payload._id);
//         if (idx !== -1) state.list[idx] = action.payload;
//         if (state.current?._id === action.payload._id) state.current = action.payload;
//       })

//       // ─── Stock Aging ─────────────────────────────────────────────
//       .addCase(fetchStockAging.pending, (state) => { 
//         state.stockAgingLoading = true; 
//       })
//       .addCase(fetchStockAging.fulfilled, (state, action) => { 
//         state.stockAgingLoading = false; 
//         state.stockAging = action.payload; 
//       })
//       .addCase(fetchStockAging.rejected, (state) => { 
//         state.stockAgingLoading = false; 
//       })

//       // ─── Non-Moving Stock ────────────────────────────────────────
//       .addCase(fetchNonMovingStock.pending, (state) => { 
//         state.nonMovingLoading = true; 
//       })
//       .addCase(fetchNonMovingStock.fulfilled, (state, action) => { 
//         state.nonMovingLoading = false; 
//         state.nonMovingStock = action.payload; 
//       })
//       .addCase(fetchNonMovingStock.rejected, (state) => { 
//         state.nonMovingLoading = false; 
//       })

//       // ─── Price History ───────────────────────────────────────────
//       .addCase(fetchPriceHistory.pending, (state) => { 
//         state.priceHistoryLoading = true; 
//       })
//       .addCase(fetchPriceHistory.fulfilled, (state, action) => { 
//         state.priceHistoryLoading = false; 
//         state.priceHistory = action.payload; 
//       })
//       .addCase(fetchPriceHistory.rejected, (state) => { 
//         state.priceHistoryLoading = false; 
//       })

//       // ─── Product Price History ──────────────────────────────────
//       .addCase(fetchProductPriceHistory.pending, (state) => { 
//         state.productPriceHistoryLoading = true; 
//         state.productPriceHistoryError = null; 
//       })
//       .addCase(fetchProductPriceHistory.fulfilled, (state, action) => { 
//         state.productPriceHistoryLoading = false; 
//         state.productPriceHistory = action.payload; 
//       })
//       .addCase(fetchProductPriceHistory.rejected, (state, action) => { 
//         state.productPriceHistoryLoading = false; 
//         state.productPriceHistoryError = action.payload; 
//       });
//   },
// });

// export const { 
//   clearPurchaseErrors, 
//   clearCurrentPurchase, 
//   clearPriceHistory,
//   clearProductPriceHistory 
// } = purchaseSlice.actions;

// export default purchaseSlice.reducer;

// // import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// // import API from '../../API/api';

// // // ─── Purchase Entries ────────────────────────────────────────────

// // export const fetchPurchases = createAsyncThunk(
// //   'purchases/fetch',
// //   async (filters = {}, { rejectWithValue }) => {
// //     try {
// //       const params = new URLSearchParams();
// //       Object.entries(filters).forEach(([k, v]) => {
// //         if (v !== undefined && v !== null && v !== '') params.set(k, v);
// //       });
// //       const qs = params.toString();
// //       const res = await API.get(`/api/purchases${qs ? `?${qs}` : ''}`);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchases');
// //     }
// //   }
// // );

// // export const fetchPurchaseById = createAsyncThunk(
// //   'purchases/fetchOne',
// //   async (id, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/purchases/${id}`);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchase');
// //     }
// //   }
// // );

// // export const createPurchase = createAsyncThunk(
// //   'purchases/create',
// //   async (payload, { rejectWithValue }) => {
// //     try {
// //       const res = await API.post('/api/purchases', payload);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to save purchase entry');
// //     }
// //   }
// // );

// // export const updatePurchase = createAsyncThunk(
// //   'purchases/update',
// //   async ({ id, payload }, { rejectWithValue }) => {
// //     try {
// //       const res = await API.put(`/api/purchases/${id}`, payload);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to update purchase');
// //     }
// //   }
// // );

// // // ─── Reports ──────────────────────────────────────────────────────

// // export const fetchStockAging = createAsyncThunk(
// //   'purchases/stockAging',
// //   async (_, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get('/api/purchases/stock-aging');
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch stock aging report');
// //     }
// //   }
// // );

// // export const fetchNonMovingStock = createAsyncThunk(
// //   'purchases/nonMovingStock',
// //   async (days = 60, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/purchases/non-moving-stock?days=${days}`);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch non-moving stock report');
// //     }
// //   }
// // );

// // export const fetchPriceHistory = createAsyncThunk(
// //   'purchases/priceHistory',
// //   async (productId, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/purchases/price-history/${productId}`);
// //       return res.data;
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch price history');
// //     }
// //   }
// // );

// // // Rich per-product price history: product info + summary stats + full
// // // purchase history for that product. Backing the Product Price History screen.
// // export const fetchProductPriceHistory = createAsyncThunk(
// //   'purchases/productPriceHistory',
// //   async (productId, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/purchases/product-price-history/${productId}`);
// //       return res.data;
// //     } catch (err) {
// //       // Surface the most specific thing we know: a JSON {msg} from the API,
// //       // otherwise the HTTP status text, otherwise the raw network error —
// //       // "Failed to fetch product price history" alone hides whether this is
// //       // a 404 (route/product not found), 500 (server error), or the request
// //       // never reaching the backend at all (network/CORS).
// //       const status = err.response?.status;
// //       const apiMsg = err.response?.data?.msg;
// //       const detail = apiMsg || (status ? `Request failed with status ${status}` : err.message) || 'Unknown error';
// //       return rejectWithValue(detail);
// //     }
// //   }
// // );

// // const purchaseSlice = createSlice({
// //   name: 'purchases',
// //   initialState: {
// //     list: [],
// //     loading: false,
// //     error: null,
// //     submitting: false,
// //     submitError: null,
// //     current: null,
// //     stockAging: { '0-30': [], '31-60': [], '61-90': [], '91-180': [], '180+': [] },
// //     stockAgingLoading: false,
// //     nonMovingStock: [],
// //     nonMovingLoading: false,
// //     priceHistory: [],
// //     priceHistoryLoading: false,
// //     productPriceHistory: null,
// //     productPriceHistoryLoading: false,
// //     productPriceHistoryError: null,
// //   },
// //   reducers: {
// //     clearPurchaseErrors: (state) => {
// //       state.error = null;
// //       state.submitError = null;
// //     },
// //     clearCurrentPurchase: (state) => {
// //       state.current = null;
// //     },
// //     clearPriceHistory: (state) => {
// //       state.priceHistory = [];
// //     },
// //     clearProductPriceHistory: (state) => {
// //       state.productPriceHistory = null;
// //       state.productPriceHistoryError = null;
// //     },
// //   },
// //   extraReducers: (builder) => {
// //     builder
// //       .addCase(fetchPurchases.pending, (state) => { state.loading = true; state.error = null; })
// //       .addCase(fetchPurchases.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
// //       .addCase(fetchPurchases.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

// //       .addCase(fetchPurchaseById.fulfilled, (state, action) => { state.current = action.payload; })

// //       .addCase(createPurchase.pending, (state) => { state.submitting = true; state.submitError = null; })
// //       .addCase(createPurchase.fulfilled, (state, action) => {
// //         state.submitting = false;
// //         state.list.unshift(action.payload);
// //       })
// //       .addCase(createPurchase.rejected, (state, action) => { state.submitting = false; state.submitError = action.payload; })

// //       .addCase(updatePurchase.fulfilled, (state, action) => {
// //         const idx = state.list.findIndex((p) => p._id === action.payload._id);
// //         if (idx !== -1) state.list[idx] = action.payload;
// //         if (state.current?._id === action.payload._id) state.current = action.payload;
// //       })

// //       .addCase(fetchStockAging.pending, (state) => { state.stockAgingLoading = true; })
// //       .addCase(fetchStockAging.fulfilled, (state, action) => { state.stockAgingLoading = false; state.stockAging = action.payload; })
// //       .addCase(fetchStockAging.rejected, (state) => { state.stockAgingLoading = false; })

// //       .addCase(fetchNonMovingStock.pending, (state) => { state.nonMovingLoading = true; })
// //       .addCase(fetchNonMovingStock.fulfilled, (state, action) => { state.nonMovingLoading = false; state.nonMovingStock = action.payload; })
// //       .addCase(fetchNonMovingStock.rejected, (state) => { state.nonMovingLoading = false; })

// //       .addCase(fetchPriceHistory.pending, (state) => { state.priceHistoryLoading = true; })
// //       .addCase(fetchPriceHistory.fulfilled, (state, action) => { state.priceHistoryLoading = false; state.priceHistory = action.payload; })
// //       .addCase(fetchPriceHistory.rejected, (state) => { state.priceHistoryLoading = false; })

// //       .addCase(fetchProductPriceHistory.pending, (state) => { state.productPriceHistoryLoading = true; state.productPriceHistoryError = null; })
// //       .addCase(fetchProductPriceHistory.fulfilled, (state, action) => { state.productPriceHistoryLoading = false; state.productPriceHistory = action.payload; })
// //       .addCase(fetchProductPriceHistory.rejected, (state, action) => { state.productPriceHistoryLoading = false; state.productPriceHistoryError = action.payload; });
// //   },
// // });

// // export const { clearPurchaseErrors, clearCurrentPurchase, clearPriceHistory, clearProductPriceHistory } = purchaseSlice.actions;
// // export default purchaseSlice.reducer;
