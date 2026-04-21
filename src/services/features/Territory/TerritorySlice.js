// // src/services/features/Territory/TerritorySlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// export const fetchTerritory = createAsyncThunk('territory/fetch', async () => {
//   const res = await API.get('/api/territory');
//   return res.data;
// });

// export const addTerritory = createAsyncThunk('territory/add', async (data, { dispatch }) => {
//   const res = await API.post('/api/territory', data);
//   dispatch(fetchTerritory());
//   return res.data;
// });

// export const updateTerritory = createAsyncThunk('territory/update', async ({ id, data }, { dispatch }) => {
//   const res = await API.put(`/api/territory/${id}`, data);
//   dispatch(fetchTerritory());
//   return res.data;
// });

// export const deleteTerritory = createAsyncThunk('territory/deleteState', async (stateName, { dispatch }) => {
//   await API.delete('/api/territory/state', { data: { state: stateName } });
//   dispatch(fetchTerritory());
// });

// export const deleteDistrict = createAsyncThunk('territory/deleteDistrict', async ({ state, district }, { dispatch }) => {
//   await API.delete('/api/territory/district', { data: { state, district } });
//   dispatch(fetchTerritory());
// });

// export const deleteTaluk = createAsyncThunk('territory/deleteTaluk', async (id, { dispatch }) => {
//   await API.delete(`/api/territory/taluk/${id}`);
//   dispatch(fetchTerritory());
// });

// const territorySlice = createSlice({
//   name: 'territory',
//   initialState: { list: [], loading: false, error: null },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTerritory.pending,   (state) => { state.loading = true; })
//       .addCase(fetchTerritory.fulfilled, (state, action) => { state.loading = false; state.list = action.payload?.data; })
//       .addCase(fetchTerritory.rejected,  (state, action) => { state.loading = false; state.error = action.error.message; });
//   },
// });

// export default territorySlice.reducer;


// -----------------------

// src/services/features/Territory/TerritorySlice.js
// Mirrors mobile TerritorySlice — API returns { "StateName": { "DistrictName": ["taluk1","taluk2"] } }

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

/* ─── Helper: convert API response to flat array the UI can render ───────────
   Input  (what backend returns, same as mobile):
     { "Tamil Nadu": { "Chennai": ["Ambattur","Egmore"], "Coimbatore": [...] }, ... }

   Output (what TerritoryPage needs):
     [
       {
         _id: "Tamil Nadu",
         state: "Tamil Nadu",
         districts: [
           { name: "Chennai",     taluks: [{ _id: "Ambattur", name: "Ambattur" }, ...] },
           { name: "Coimbatore",  taluks: [...] },
         ]
       },
       ...
     ]
──────────────────────────────────────────────────────────────────────────── */
const normalizeTerritory = (raw) => {
  if (!raw) return [];

  // Already an array with { state, districts } shape — return as-is
  if (Array.isArray(raw) && raw.length > 0 && raw[0]?.state !== undefined) {
    return raw;
  }

  // Flat array of { state, district, taluk } rows
  if (Array.isArray(raw) && raw.length > 0 && raw[0]?.district !== undefined) {
    const map = new Map();
    for (const row of raw) {
      const { state, district, taluk, _id } = row;
      if (!state || !district) continue;
      if (!map.has(state)) map.set(state, new Map());
      const dm = map.get(state);
      if (!dm.has(district)) dm.set(district, []);
      if (taluk) dm.get(district).push({ _id: _id || taluk, name: taluk });
    }
    return Array.from(map.entries()).map(([state, dm]) => ({
      _id: state, state,
      districts: Array.from(dm.entries()).map(([name, taluks]) => ({ name, taluks })),
    }));
  }

  // Nested object { "State": { "District": ["taluk1", ...] } }  ← mobile format
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw).map(([state, distObj]) => ({
      _id: state,
      state,
      districts: Object.entries(distObj || {}).map(([distName, taluks]) => ({
        name: distName,
        taluks: Array.isArray(taluks)
          ? taluks.map(t => (typeof t === 'string' ? { _id: t, name: t } : t))
          : [],
      })),
    }));
  }

  return [];
};

/* ─── Thunks ─────────────────────────────────────────────────────────────────── */
export const fetchTerritory = createAsyncThunk(
  'territory/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/territory');
      // Handle { data: ... } wrapper or direct payload
      const raw = res.data?.data !== undefined ? res.data.data : res.data;
      return normalizeTerritory(raw);
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

export const deleteTerritory = createAsyncThunk(
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

/* ─── Slice ──────────────────────────────────────────────────────────────────── */
const territorySlice = createSlice({
  name: 'territory',
  initialState: {
    list:    [],
    loading: false,
    error:   null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerritory.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchTerritory.fulfilled, (state, action) => {
        state.loading = false;
        state.list    = action.payload || [];
      })
      .addCase(fetchTerritory.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        state.list    = [];
      })
      .addCase(addTerritory.pending,   (state) => { state.loading = true; })
      .addCase(addTerritory.fulfilled, (state) => { state.loading = false; })
      .addCase(addTerritory.rejected,  (state) => { state.loading = false; })
      .addCase(updateTerritory.pending,   (state) => { state.loading = true; })
      .addCase(updateTerritory.fulfilled, (state) => { state.loading = false; })
      .addCase(updateTerritory.rejected,  (state) => { state.loading = false; });
  },
});

export default territorySlice.reducer;