// src/services/features/approvals/approvalSlice.js
//
// Hierarchical approval dashboard — talks to the existing backend
// approval routes (routes/approvalRoutes.js -> /api/approvals/*).
// This is purely additive: it does not touch the existing auth/register
// slices or any other feature slice.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

// GET /api/approvals/pending — pending requests for roles the logged-in
// user is allowed to approve (scoped server-side by role/hierarchy).
export const fetchPendingApprovals = createAsyncThunk(
  'approvals/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/approvals/pending');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load pending approvals');
    }
  }
);

// GET /api/approvals/processed?status=approved|rejected — history tab
export const fetchProcessedApprovals = createAsyncThunk(
  'approvals/fetchProcessed',
  async (status, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/approvals/processed', { params: status ? { status } : {} });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load processed approvals');
    }
  }
);

// POST /api/approvals/approve/:userId
export const approveRegistration = createAsyncThunk(
  'approvals/approve',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await API.post(`/api/approvals/approve/${userId}`);
      return { userId, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Approval failed');
    }
  }
);

// POST /api/approvals/reject/:userId  { reason }
export const rejectRegistration = createAsyncThunk(
  'approvals/reject',
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const res = await API.post(`/api/approvals/reject/${userId}`, { reason });
      return { userId, ...res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Rejection failed');
    }
  }
);

const approvalSlice = createSlice({
  name: 'approvals',
  initialState: {
    pending: [],
    processed: [],
    loading: false,
    processedLoading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearApprovalError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // PENDING
      .addCase(fetchPendingApprovals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => { state.loading = false; state.pending = action.payload; })
      .addCase(fetchPendingApprovals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // PROCESSED
      .addCase(fetchProcessedApprovals.pending, (state) => { state.processedLoading = true; })
      .addCase(fetchProcessedApprovals.fulfilled, (state, action) => { state.processedLoading = false; state.processed = action.payload; })
      .addCase(fetchProcessedApprovals.rejected, (state, action) => { state.processedLoading = false; state.error = action.payload; })
      // APPROVE
      .addCase(approveRegistration.pending, (state) => { state.actionLoading = true; })
      .addCase(approveRegistration.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.pending = state.pending.filter((u) => u._id !== action.payload.userId);
      })
      .addCase(approveRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })
      // REJECT
      .addCase(rejectRegistration.pending, (state) => { state.actionLoading = true; })
      .addCase(rejectRegistration.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.pending = state.pending.filter((u) => u._id !== action.payload.userId);
      })
      .addCase(rejectRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
  },
});

export const { clearApprovalError } = approvalSlice.actions;
export default approvalSlice.reducer;

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // src/services/features/approvals/approvalSlice.js
// //
// // Hierarchical approval dashboard — talks to the existing backend
// // approval routes (routes/approvalRoutes.js -> /api/approvals/*).
// // This is purely additive: it does not touch the existing auth/register
// // slices or any other feature slice.
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// // GET /api/approvals/pending — pending requests for roles the logged-in
// // user is allowed to approve (scoped server-side by role/hierarchy).
// export const fetchPendingApprovals = createAsyncThunk(
//   'approvals/fetchPending',
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await API.get('/api/approvals/pending');
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Failed to load pending approvals');
//     }
//   }
// );

// // GET /api/approvals/processed?status=approved|rejected — history tab
// export const fetchProcessedApprovals = createAsyncThunk(
//   'approvals/fetchProcessed',
//   async (status, { rejectWithValue }) => {
//     try {
//       const res = await API.get('/api/approvals/processed', { params: status ? { status } : {} });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Failed to load processed approvals');
//     }
//   }
// );

// // POST /api/approvals/approve/:userId
// export const approveRegistration = createAsyncThunk(
//   'approvals/approve',
//   async (userId, { rejectWithValue }) => {
//     try {
//       const res = await API.post(`/api/approvals/approve/${userId}`);
//       return { userId, ...res.data };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Approval failed');
//     }
//   }
// );

// // POST /api/approvals/reject/:userId  { reason }
// export const rejectRegistration = createAsyncThunk(
//   'approvals/reject',
//   async ({ userId, reason }, { rejectWithValue }) => {
//     try {
//       const res = await API.post(`/api/approvals/reject/${userId}`, { reason });
//       return { userId, ...res.data };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Rejection failed');
//     }
//   }
// );

// const approvalSlice = createSlice({
//   name: 'approvals',
//   initialState: {
//     pending: [],
//     processed: [],
//     loading: false,
//     processedLoading: false,
//     actionLoading: false,
//     error: null,
//   },
//   reducers: {
//     clearApprovalError: (state) => { state.error = null; },
//   },
//   extraReducers: (builder) => {
//     builder
//       // PENDING
//       .addCase(fetchPendingApprovals.pending, (state) => { state.loading = true; state.error = null; })
//       .addCase(fetchPendingApprovals.fulfilled, (state, action) => { state.loading = false; state.pending = action.payload; })
//       .addCase(fetchPendingApprovals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
//       // PROCESSED
//       .addCase(fetchProcessedApprovals.pending, (state) => { state.processedLoading = true; })
//       .addCase(fetchProcessedApprovals.fulfilled, (state, action) => { state.processedLoading = false; state.processed = action.payload; })
//       .addCase(fetchProcessedApprovals.rejected, (state, action) => { state.processedLoading = false; state.error = action.payload; })
//       // APPROVE
//       .addCase(approveRegistration.pending, (state) => { state.actionLoading = true; })
//       .addCase(approveRegistration.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.pending = state.pending.filter((u) => u._id !== action.payload.userId);
//       })
//       .addCase(approveRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; })
//       // REJECT
//       .addCase(rejectRegistration.pending, (state) => { state.actionLoading = true; })
//       .addCase(rejectRegistration.fulfilled, (state, action) => {
//         state.actionLoading = false;
//         state.pending = state.pending.filter((u) => u._id !== action.payload.userId);
//       })
//       .addCase(rejectRegistration.rejected, (state, action) => { state.actionLoading = false; state.error = action.payload; });
//   },
// });

// export const { clearApprovalError } = approvalSlice.actions;
// export default approvalSlice.reducer;
