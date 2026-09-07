import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../API/api";

// ─── Fetch all salespersons ──────────────────────────────────────────
export const fetchSalespersons = createAsyncThunk(
  "salesperson/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get("/api/salespersons");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || "Failed to fetch salespersons");
    }
  }
);

// ─── Add new salesperson ─────────────────────────────────────────────
export const addSalesperson = createAsyncThunk(
  "salesperson/add",
  async (name, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/salespersons", { name });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || "Failed to add salesperson");
    }
  }
);

// ─── Delete salesperson ──────────────────────────────────────────────
export const deleteSalesperson = createAsyncThunk(
  "salesperson/delete",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/api/salespersons/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || "Failed to delete salesperson");
    }
  }
);

// ─── Update salesperson ──────────────────────────────────────────────
export const updateSalesperson = createAsyncThunk(
  "salesperson/update",
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/api/salespersons/${id}`, { name });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || "Failed to update salesperson");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────
const salespersonSlice = createSlice({
  name: "salesperson",
  initialState: {
    list: [],
    loading: false,
    error: null,
    adding: false,
    addError: null,
  },
  reducers: {
    clearSalespersonErrors: (state) => {
      state.error = null;
      state.addError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSalespersons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalespersons.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSalespersons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add
      .addCase(addSalesperson.pending, (state) => {
        state.adding = true;
        state.addError = null;
      })
      .addCase(addSalesperson.fulfilled, (state, action) => {
        state.adding = false;
        state.list.push(action.payload);
      })
      .addCase(addSalesperson.rejected, (state, action) => {
        state.adding = false;
        state.addError = action.payload;
      })
      
      // Delete
      .addCase(deleteSalesperson.fulfilled, (state, action) => {
        state.list = state.list.filter((sp) => sp.id !== action.payload);
      })
      
      // Update
      .addCase(updateSalesperson.fulfilled, (state, action) => {
        const idx = state.list.findIndex((sp) => sp.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      });
  },
});

export const { clearSalespersonErrors } = salespersonSlice.actions;
export default salespersonSlice.reducer;