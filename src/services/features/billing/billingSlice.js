// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// // GET /api/invoices/batch-queue/:productId
// // Returns the FIFO-ordered batch queue for one product (oldest first),
// // each with a "active" | "waiting" | "finished" status already computed
// // server-side (see fifoAllocationService.getBatchQueue).
// export const fetchBatchQueue = createAsyncThunk(
//   'billing/fetchBatchQueue',
//   async (productId, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/invoices/batch-queue/${productId}`);
//       return { productId, queue: res.data.queue };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Failed to load batch queue');
//     }
//   }
// );

// const billingSlice = createSlice({
//   name: 'billing',
//   initialState: {
//     // productId -> batch[] (FIFO order, oldest first)
//     queueByProduct: {},
//     loadingProductId: null,
//     error: null,
//   },
//   reducers: {
//     clearBatchQueue(state, action) {
//       delete state.queueByProduct[action.payload];
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchBatchQueue.pending, (state, action) => {
//         state.loadingProductId = action.meta.arg;
//         state.error = null;
//       })
//       .addCase(fetchBatchQueue.fulfilled, (state, action) => {
//         state.loadingProductId = null;
//         state.queueByProduct[action.payload.productId] = action.payload.queue;
//       })
//       .addCase(fetchBatchQueue.rejected, (state, action) => {
//         state.loadingProductId = null;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearBatchQueue } = billingSlice.actions;
// export default billingSlice.reducer;
