
// // src/services/features/billing/billingSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// // ─── Async Thunks ──────────────────────────────────────────────────────

// /**
//  * Fetch batch queue for a specific product
//  * GET /api/batches/queue/:productId
//  */
// export const fetchBatchQueue = createAsyncThunk(
//   'billing/fetchBatchQueue',
//   async (productId, { rejectWithValue }) => {
//     try {
//       if (!productId) {
//         return rejectWithValue('Product ID is required');
//       }
      
//       console.log(`📦 Fetching batches for product: ${productId}`);
      
//       // Real backend route (routes/invoiceRoutes.js): GET /api/invoices/batch-queue/:productId
//       // Response shape: { queue: [{ batchId, batchNo, inwardDate, purchasePrice, quantityAvailable, status, ... }] }
//       const response = await API.get(`/api/invoices/batch-queue/${productId}`);
      
//       const batches = Array.isArray(response.data?.queue) ? response.data.queue : [];
      
//       console.log(`✅ Fetched ${batches.length} batches for product ${productId}`);
      
//       // Sort batches oldest-first (FIFO). Server already sorts by inwardDate/createdAt,
//       // but we re-sort defensively since the UI's FIFO recommendation depends on it.
//       const sortedBatches = [...batches].sort((a, b) => 
//         new Date(a.inwardDate) - new Date(b.inwardDate)
//       );
      
//       return {
//         productId,
//         batches: sortedBatches,
//         timestamp: Date.now()
//       };
//     } catch (error) {
//       console.error('❌ fetchBatchQueue error:', error);
      
//       if (error.response) {
//         const status = error.response.status;
//         const message = error.response.data?.message || error.response.data?.msg || 'Failed to fetch batch queue';
        
//         if (status === 404) {
//           // Return empty array for 404 - product has no batches yet
//           return {
//             productId,
//             batches: [],
//             timestamp: Date.now()
//           };
//         }
        
//         return rejectWithValue(message);
//       } else if (error.request) {
//         return rejectWithValue('Network error - Please check your connection');
//       } else {
//         return rejectWithValue(error.message || 'Failed to fetch batch queue');
//       }
//     }
//   }
// );

// // ─── Slice ────────────────────────────────────────────────────────────

// const initialState = {
//   queueByProduct: {},
//   loading: false,
//   fetchingBatches: {},
//   error: null,
//   errors: {},
//   lastFetched: {},
//   CACHE_DURATION: 30000 // 30 seconds cache
// };

// const billingSlice = createSlice({
//   name: 'billing',
//   initialState,
//   reducers: {
//     clearAllBatchData: (state) => {
//       state.queueByProduct = {};
//       state.fetchingBatches = {};
//       state.errors = {};
//       state.lastFetched = {};
//       state.error = null;
//     },
    
//     clearProductBatches: (state, action) => {
//       const productId = action.payload;
//       if (productId) {
//         delete state.queueByProduct[productId];
//         delete state.fetchingBatches[productId];
//         delete state.errors[productId];
//         delete state.lastFetched[productId];
//       }
//     },
    
//     clearProductError: (state, action) => {
//       const productId = action.payload;
//       if (productId) {
//         delete state.errors[productId];
//       } else {
//         state.error = null;
//       }
//     },
    
//     invalidateCache: (state, action) => {
//       const productId = action.payload;
//       if (productId) {
//         delete state.lastFetched[productId];
//       }
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // ─── fetchBatchQueue ─────────────────────────────────────────────
//       .addCase(fetchBatchQueue.pending, (state, action) => {
//         const productId = action.meta.arg;
//         state.fetchingBatches[productId] = true;
//         delete state.errors[productId];
//         state.loading = true;
//         console.log(`⏳ Loading batches for product: ${productId}`);
//       })
//       .addCase(fetchBatchQueue.fulfilled, (state, action) => {
//         const { productId, batches, timestamp } = action.payload;
//         state.queueByProduct[productId] = batches || [];
//         state.lastFetched[productId] = timestamp || Date.now();
//         state.fetchingBatches[productId] = false;
//         state.loading = false;
//         delete state.errors[productId];
//         console.log(`✅ Batches loaded for product: ${productId} (${batches.length} batches)`);
//       })
//       .addCase(fetchBatchQueue.rejected, (state, action) => {
//         const productId = action.meta.arg;
//         state.fetchingBatches[productId] = false;
//         state.loading = false;
//         state.errors[productId] = action.payload || 'Failed to fetch batches';
//         // Set empty array so UI doesn't keep loading
//         if (!state.queueByProduct[productId]) {
//           state.queueByProduct[productId] = [];
//         }
//         console.error(`❌ Failed to load batches for product: ${productId}`, action.payload);
//       });
//   }
// });

// // ─── Selectors ──────────────────────────────────────────────────────

// export const selectBatchQueue = (state, productId) => {
//   return state.billing.queueByProduct[productId] || [];
// };

// export const selectBatchLoading = (state, productId) => {
//   return state.billing.fetchingBatches[productId] || false;
// };

// export const selectBatchError = (state, productId) => {
//   return state.billing.errors[productId] || null;
// };

// export const selectNeedsRefresh = (state, productId) => {
//   const lastFetched = state.billing.lastFetched[productId];
//   if (!lastFetched) return true;
//   return Date.now() - lastFetched > state.billing.CACHE_DURATION;
// };

// export const {
//   clearAllBatchData,
//   clearProductBatches,
//   clearProductError,
//   invalidateCache
// } = billingSlice.actions;

// export default billingSlice.reducer;

// //================================================================
// // import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// // import API from '../../API/api';

// // // GET /api/invoices/batch-queue/:productId
// // // Returns the FIFO-ordered batch queue for one product (oldest first),
// // // each with a "active" | "waiting" | "finished" status already computed
// // // server-side (see fifoAllocationService.getBatchQueue).
// // export const fetchBatchQueue = createAsyncThunk(
// //   'billing/fetchBatchQueue',
// //   async (productId, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/invoices/batch-queue/${productId}`);
// //       return { productId, queue: res.data.queue };
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.message || 'Failed to load batch queue');
// //     }
// //   }
// // );

// // const billingSlice = createSlice({
// //   name: 'billing',
// //   initialState: {
// //     // productId -> batch[] (FIFO order, oldest first)
// //     queueByProduct: {},
// //     loadingProductId: null,
// //     error: null,
// //   },
// //   reducers: {
// //     clearBatchQueue(state, action) {
// //       delete state.queueByProduct[action.payload];
// //     },
// //   },
// //   extraReducers: (builder) => {
// //     builder
// //       .addCase(fetchBatchQueue.pending, (state, action) => {
// //         state.loadingProductId = action.meta.arg;
// //         state.error = null;
// //       })
// //       .addCase(fetchBatchQueue.fulfilled, (state, action) => {
// //         state.loadingProductId = null;
// //         state.queueByProduct[action.payload.productId] = action.payload.queue;
// //       })
// //       .addCase(fetchBatchQueue.rejected, (state, action) => {
// //         state.loadingProductId = null;
// //         state.error = action.payload;
// //       });
// //   },
// // });

// // export const { clearBatchQueue } = billingSlice.actions;
// // export default billingSlice.reducer;

// //=++++++++++++++++++++++++++++++++++++

// // import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// // import API from '../../API/api';

// // // GET /api/invoices/batch-queue/:productId
// // // Returns the FIFO-ordered batch queue for one product (oldest first),
// // // each with a "active" | "waiting" | "finished" status already computed
// // // server-side (see fifoAllocationService.getBatchQueue).
// // export const fetchBatchQueue = createAsyncThunk(
// //   'billing/fetchBatchQueue',
// //   async (productId, { rejectWithValue }) => {
// //     try {
// //       const res = await API.get(`/api/invoices/batch-queue/${productId}`);
// //       return { productId, queue: res.data.queue };
// //     } catch (err) {
// //       return rejectWithValue(err.response?.data?.message || 'Failed to load batch queue');
// //     }
// //   }
// // );

// // const billingSlice = createSlice({
// //   name: 'billing',
// //   initialState: {
// //     // productId -> batch[] (FIFO order, oldest first)
// //     queueByProduct: {},
// //     loadingProductId: null,
// //     error: null,
// //   },
// //   reducers: {
// //     clearBatchQueue(state, action) {
// //       delete state.queueByProduct[action.payload];
// //     },
// //   },
// //   extraReducers: (builder) => {
// //     builder
// //       .addCase(fetchBatchQueue.pending, (state, action) => {
// //         state.loadingProductId = action.meta.arg;
// //         state.error = null;
// //       })
// //       .addCase(fetchBatchQueue.fulfilled, (state, action) => {
// //         state.loadingProductId = null;
// //         state.queueByProduct[action.payload.productId] = action.payload.queue;
// //       })
// //       .addCase(fetchBatchQueue.rejected, (state, action) => {
// //         state.loadingProductId = null;
// //         state.error = action.payload;
// //       });
// //   },
// // });

// // export const { clearBatchQueue } = billingSlice.actions;
// // export default billingSlice.reducer;
