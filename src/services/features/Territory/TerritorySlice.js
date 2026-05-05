// // src/services/features/Territory/TerritorySlice.js
// // API returns: { "StateName": { "DistrictName": [{ _id, taluk, beats, assignedTo, active }] } }
// // Exactly mirrors mobile TerritorySlice

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// export const fetchTerritory = createAsyncThunk(
//   'territory/fetch',
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await API.get('/api/territory');
//       // API returns nested object: { StateName: { DistrictName: [taluks] } }
//       const raw = res.data?.data !== undefined ? res.data.data : res.data;
//       return raw || {};
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const addTerritory = createAsyncThunk(
//   'territory/add',
//   async (data, { dispatch, rejectWithValue }) => {
//     try {
//       const res = await API.post('/api/territory', data);
//       dispatch(fetchTerritory());
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const updateTerritory = createAsyncThunk(
//   'territory/update',
//   async ({ id, data }, { dispatch, rejectWithValue }) => {
//     try {
//       const res = await API.put(`/api/territory/${id}`, data);
//       dispatch(fetchTerritory());
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Delete state — same as mobile deleteState
// export const deleteState = createAsyncThunk(
//   'territory/deleteState',
//   async (stateName, { dispatch, rejectWithValue }) => {
//     try {
//       await API.delete('/api/territory/state', { data: { state: stateName } });
//       dispatch(fetchTerritory());
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Delete district — same as mobile deleteDistrict
// export const deleteDistrict = createAsyncThunk(
//   'territory/deleteDistrict',
//   async ({ state, district }, { dispatch, rejectWithValue }) => {
//     try {
//       await API.delete('/api/territory/district', { data: { state, district } });
//       dispatch(fetchTerritory());
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Delete taluk by _id — same as mobile deleteTaluk
// export const deleteTaluk = createAsyncThunk(
//   'territory/deleteTaluk',
//   async (id, { dispatch, rejectWithValue }) => {
//     try {
//       await API.delete(`/api/territory/taluk/${id}`);
//       dispatch(fetchTerritory());
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Assign FSE to taluk
// export const assignTaluk = createAsyncThunk(
//   'territory/assign',
//   async ({ id, assignedTo }, { dispatch, rejectWithValue }) => {
//     try {
//       await API.patch(`/api/territory/taluk/${id}/assign`, { assignedTo });
//       dispatch(fetchTerritory());
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Add beat to taluk
// export const addBeat = createAsyncThunk(
//   'territory/addBeat',
//   async ({ id, beat }, { dispatch, rejectWithValue }) => {
//     try {
//       await API.patch(`/api/territory/taluk/${id}/beat`, { beat });
//       dispatch(fetchTerritory());
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// const territorySlice = createSlice({
//   name: 'territory',
//   initialState: {
//     data:    {},   // { StateName: { DistrictName: [taluks] } } — mirrors mobile
//     loading: false,
//     error:   null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTerritory.pending,   (state) => { state.loading = true; state.error = null; })
//       .addCase(fetchTerritory.fulfilled, (state, action) => {
//         state.loading = false;
//         state.data    = action.payload || {};
//       })
//       .addCase(fetchTerritory.rejected,  (state, action) => {
//         state.loading = false;
//         state.error   = action.payload;
//         state.data    = {};
//       })
//       .addCase(addTerritory.pending,    (state) => { state.loading = true; })
//       .addCase(addTerritory.fulfilled,  (state) => { state.loading = false; })
//       .addCase(addTerritory.rejected,   (state) => { state.loading = false; })
//       .addCase(updateTerritory.pending,  (state) => { state.loading = true; })
//       .addCase(updateTerritory.fulfilled,(state) => { state.loading = false; })
//       .addCase(updateTerritory.rejected, (state) => { state.loading = false; });
//   },
// });

// export default territorySlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchTerritory = createAsyncThunk(
  'territory/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/territory');
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      return raw || {};
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addTerritory = createAsyncThunk(
  'territory/add',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const res = await API.post('/api/territory', data);
      dispatch(fetchTerritory());
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateTerritory = createAsyncThunk(
  'territory/update',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const res = await API.put(`/api/territory/${id}`, data);
      dispatch(fetchTerritory());
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteState = createAsyncThunk(
  'territory/deleteState',
  async (stateName, { dispatch, rejectWithValue }) => {
    try {
      await API.delete('/api/territory/state', { data: { state: stateName } });
      dispatch(fetchTerritory());
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteDistrict = createAsyncThunk(
  'territory/deleteDistrict',
  async ({ state, district }, { dispatch, rejectWithValue }) => {
    try {
      await API.delete('/api/territory/district', { data: { state, district } });
      dispatch(fetchTerritory());
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTaluk = createAsyncThunk(
  'territory/deleteTaluk',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await API.delete(`/api/territory/taluk/${id}`);
      dispatch(fetchTerritory());
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const territorySlice = createSlice({
  name: 'territory',
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerritory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTerritory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload || {};
      })
      .addCase(fetchTerritory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = {};
      })
      .addCase(addTerritory.pending, (state) => { state.loading = true; })
      .addCase(addTerritory.fulfilled, (state) => { state.loading = false; })
      .addCase(addTerritory.rejected, (state) => { state.loading = false; })
      .addCase(updateTerritory.pending, (state) => { state.loading = true; })
      .addCase(updateTerritory.fulfilled, (state) => { state.loading = false; })
      .addCase(updateTerritory.rejected, (state) => { state.loading = false; });
  },
});

export default territorySlice.reducer;