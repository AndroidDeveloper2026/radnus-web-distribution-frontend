// src/services/features/auth/registerSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../../API/api';

export const registerUser = createAsyncThunk(
  'register/registerUser',
  async (values, { rejectWithValue }) => {
    try {
      // Web: no FCM token needed — omit it
      const response = await API.post('/api/auth/register', values);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data ||
        'Registration failed'
      );
    }
  }
);

const registerSlice = createSlice({
  name: 'register',
  initialState: {
    loading: false,
    user:    null,
    error:   null,
  },
  extraReducers: builder => {
    builder
      .addCase(registerUser.pending, state => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export default registerSlice.reducer;
