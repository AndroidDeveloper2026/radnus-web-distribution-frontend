// src/services/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';
import {
  setTokens,
  clearTokens,
  getAccessToken,
  setUserData,
  getUserData,
  clearUserData,
} from '../../AuthStorage/authStorage';

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/login', data);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUserData(res.data.user);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/register', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/verify-otp', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/forgot-password', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/reset-password', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Reset failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  clearTokens();
  clearUserData();
  return true;
});

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return rejectWithValue('No token found');
      const userData = getUserData();
      if (!userData) return rejectWithValue('No user data found');
      return { user: userData, accessToken };
    } catch (err) {
      clearTokens();
      clearUserData();
      return rejectWithValue(err.message || 'Auth check failed');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    isCheckingAuth: true,
    registerSuccess: false,
    otpSent: false,
  },
  reducers: {
    logout: (state) => {
      state.user  = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading        = false;
        state.token          = action.payload.accessToken;
        state.user           = action.payload.user;
        state.isCheckingAuth = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading        = false;
        state.error          = action.payload;
        state.isCheckingAuth = false;
      })
      // REGISTER
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading         = false;
        state.registerSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })
      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user           = null;
        state.token          = null;
        state.isCheckingAuth = false;
      })
      // CHECK AUTH
      .addCase(checkAuth.pending, (state) => { state.isCheckingAuth = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.user           = action.payload.user;
        state.token          = action.payload.accessToken;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isCheckingAuth = false;
        state.user           = null;
        state.token          = null;
      });
  },
});

export const { logout, clearError, clearRegisterSuccess } = authSlice.actions;
export default authSlice.reducer;
