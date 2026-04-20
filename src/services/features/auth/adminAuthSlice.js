// src/services/features/auth/adminAuthSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';
import { setTokens, clearTokens, getAccessToken, setUserData, getUserData, clearUserData } from '../../AuthStorage/authStorage';

export const adminLogin = createAsyncThunk(
  'adminAuth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/auth/admin', data);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUserData({ ...res.data.admin, role: 'Admin' });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Admin login failed');
    }
  }
);

export const adminLogout = createAsyncThunk('adminAuth/logout', async () => {
  clearTokens();
  clearUserData();
  return true;
});

export const checkAdminAuth = createAsyncThunk(
  'adminAuth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken();
      if (!token) return rejectWithValue('No token');
      const user = getUserData();
      if (!user || user.role !== 'Admin') return rejectWithValue('Not admin');
      return { admin: user, accessToken: token };
    } catch {
      return rejectWithValue('Admin auth check failed');
    }
  }
);

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    admin: null,
    token: null,
    loading: false,
    error: null,
    isCheckingAuth: true,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(adminLogin.fulfilled,  (state, action) => {
        state.loading        = false;
        state.admin          = action.payload.admin;
        state.token          = action.payload.accessToken;
        state.isCheckingAuth = false;
      })
      .addCase(adminLogin.rejected,   (state, action) => {
        state.loading        = false;
        state.error          = action.payload;
        state.isCheckingAuth = false;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        state.admin          = null;
        state.token          = null;
        state.isCheckingAuth = false;
      })
      .addCase(checkAdminAuth.pending,    (state) => { state.isCheckingAuth = true; })
      .addCase(checkAdminAuth.fulfilled,  (state, action) => {
        state.isCheckingAuth = false;
        state.admin          = action.payload.admin;
        state.token          = action.payload.accessToken;
      })
      .addCase(checkAdminAuth.rejected,   (state) => {
        state.isCheckingAuth = false;
      });
  },
});

export const { clearError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
