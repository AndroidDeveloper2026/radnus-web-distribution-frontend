// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer         from '../services/features/auth/authSlice';
import adminReducer        from '../services/features/auth/adminAuthSlice';
import registerReducer     from '../services/features/auth/registerSlice';
import otpReducer          from '../services/features/auth/otpSlice';
import productReducer      from '../services/features/products/productSlice';
import retailerReducer     from '../services/features/retailer/retailerSlice';
import distributorReducer  from '../services/features/distributor/distributorSlice';
import territoryReducer    from '../services/features/Territory/TerritorySlice';
import managerReducer      from '../services/features/manager/managerSlice';
import executiveReducer    from '../services/features/executive/executiveSlice';
import fseReducer          from '../services/features/fse/fseSlice';

export const store = configureStore({
  reducer: {
    auth:         authReducer,
    adminAuth:    adminReducer,
    register:     registerReducer,
    otp:          otpReducer,
    products:     productReducer,
    retailer:     retailerReducer,
    distributors: distributorReducer,
    territory:    territoryReducer,
    manager:      managerReducer,
    executive:    executiveReducer,
    fse:          fseReducer,
  },
});
