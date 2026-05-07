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
import customerReducer from '../services/features/customers/customerSlice';
import invoiceReducer from '../services/features/invoice/invoiceSlice';
import activityReducer from '../services/features/activity/activitySlice';
import feedbackReducer from '../services/features/retailer/feedbackSlice';
import profileReducer from '../services/features/profile/profileSlice';
import returnsReducer from '../services/features/returns/returnsSlice';

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
    customer: customerReducer,
    invoice: invoiceReducer,
    activity: activityReducer,
    feedback: feedbackReducer,
    profile: profileReducer,
    returns: returnsReducer,
  },
});
