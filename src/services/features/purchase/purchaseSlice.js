
// services/features/purchase/purchaseSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

// ─── Purchase Entries ─────────────────────────────────────────────────────────

export const fetchPurchases = createAsyncThunk(
  'purchases/fetch',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, v);
      });
      const qs = params.toString();
      const res = await API.get(`/api/purchases${qs ? `?${qs}` : ''}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchases');
    }
  }
);

export const fetchPurchaseById = createAsyncThunk(
  'purchases/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await API.get(`/api/purchases/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchase');
    }
  }
);

export const createPurchase = createAsyncThunk(
  'purchases/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await API.post('/api/purchases', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to save purchase entry');
    }
  }
);

export const updatePurchase = createAsyncThunk(
  'purchases/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await API.put(`/api/purchases/${id}`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to update purchase');
    }
  }
);

// ─── Reports ──────────────────────────────────────────────────────────────────

export const fetchStockAging = createAsyncThunk(
  'purchases/stockAging',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/purchases/stock-aging');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch stock aging report');
    }
  }
);

export const fetchNonMovingStock = createAsyncThunk(
  'purchases/nonMovingStock',
  async (days = 60, { rejectWithValue }) => {
    try {
      const res = await API.get(`/api/purchases/non-moving-stock?days=${days}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch non-moving stock report');
    }
  }
);

export const fetchPriceHistory = createAsyncThunk(
  'purchases/priceHistory',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/api/purchases/price-history/${productId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch price history');
    }
  }
);

export const fetchProductPriceHistory = createAsyncThunk(
  'purchases/productPriceHistory',
  async (productId, { rejectWithValue }) => {
    try {
      if (!productId || productId.length !== 24) {
        return rejectWithValue('Invalid product ID format - must be 24 character hex string');
      }
      
      const res = await API.get(`/api/purchases/product-price-history/${productId}`);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.msg;
      const detail = apiMsg || (status ? `Request failed with status ${status}` : err.message) || 'Unknown error';
      return rejectWithValue(detail);
    }
  }
);

// ─── Product Batches for OrderCartPage ──────────────────────────────────────

export const fetchProductBatches = createAsyncThunk(
  'purchases/fetchProductBatches',
  async (productIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(productIds) ? productIds : [productIds];
      if (ids.length === 0) return {};

      const res = await API.post('/api/purchases/product-batches', { productIds: ids });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch product batches');
    }
  }
);

export const fetchBatchAvailability = createAsyncThunk(
  'purchases/fetchBatchAvailability',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/api/purchases/product-batches/${productId}/availability`);
      return { productId, batches: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch batch availability');
    }
  }
);

// ─── Data Explorer - Fetch Stock Batches ─────────────────────────────────────

export const fetchStockBatches = createAsyncThunk(
  'purchases/fetchStockBatches',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      const filterKeys = [
        'search', 'product', 'batchNo', 'purchaseEntry', 'supplier',
        'rackNo', 'expiryStatus', 'inwardDateFrom', 'inwardDateTo',
        'paymentStatus', 'paymentType'
      ];
      
      filterKeys.forEach(key => {
        if (params[key] && params[key] !== 'all' && params[key] !== '') {
          queryParams.set(key, params[key]);
        }
      });
      
      if (params.page) queryParams.set('page', params.page);
      if (params.limit) queryParams.set('limit', params.limit);
      if (params.sortKey) queryParams.set('sortKey', params.sortKey);
      if (params.sortDirection) queryParams.set('sortDirection', params.sortDirection);
      
      const qs = queryParams.toString();
      const url = `/api/purchases/stock-batches${qs ? `?${qs}` : ''}`;
      
      const res = await API.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch stock batches');
    }
  }
);

// ─── Data Explorer - Export Stock Batches ───────────────────────────────────

export const exportStockBatches = createAsyncThunk(
  'purchases/exportStockBatches',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      const filterKeys = [
        'search', 'product', 'batchNo', 'purchaseEntry', 'supplier',
        'rackNo', 'expiryStatus', 'inwardDateFrom', 'inwardDateTo',
        'paymentStatus', 'paymentType'
      ];
      
      filterKeys.forEach(key => {
        if (params[key] && params[key] !== 'all' && params[key] !== '') {
          queryParams.set(key, params[key]);
        }
      });
      
      if (params.sortKey) queryParams.set('sortKey', params.sortKey);
      if (params.sortDirection) queryParams.set('sortDirection', params.sortDirection);
      
      const qs = queryParams.toString();
      const res = await API.get(`/api/purchases/stock-batches/export${qs ? `?${qs}` : ''}`, {
        responseType: 'blob'
      });
      
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to export stock batches');
    }
  }
);

// ─── Data Explorer - Get Filter Options ─────────────────────────────────────

export const fetchFilterOptions = createAsyncThunk(
  'purchases/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await API.get('/api/purchases/filter-options');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch filter options');
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const purchaseSlice = createSlice({
  name: 'purchases',
  initialState: {
    // ─── Purchase Entries ────────────────────────────────────────────────
    list: [],
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
    current: null,

    // ─── Reports ──────────────────────────────────────────────────────────
    stockAging: { '0-30': [], '31-60': [], '61-90': [], '91-180': [], '180+': [] },
    stockAgingLoading: false,
    nonMovingStock: [],
    nonMovingLoading: false,

    // ─── Price History ───────────────────────────────────────────────────
    priceHistory: [],
    priceHistoryLoading: false,
    productPriceHistory: null,
    productPriceHistoryLoading: false,
    productPriceHistoryError: null,

    // ─── Product Batches ─────────────────────────────────────────────────
    productBatches: {},
    productBatchesLoading: false,
    productBatchesError: null,
    batchAvailability: {},
    batchAvailabilityLoading: false,

    // ─── Data Explorer ──────────────────────────────────────────────────
    stockBatches: [],
    stockBatchesLoading: false,
    stockBatchesError: null,
    stockBatchesTotal: 0,
    stockBatchesPage: 1,
    stockBatchesTotalPages: 1,
    stockBatchesLimit: 50,
    
    filterOptions: {
      products: [],
      batches: [],
      purchaseEntries: [],
      racks: [],
      suppliers: [],
      paymentStatuses: ['paid', 'unpaid', 'partial'],
      paymentTypes: ['Cash', 'Credit', 'Bank Transfer', 'UPI', 'Cheque'],
    },
    filterOptionsLoading: false,
    filterOptionsError: null,

    exporting: false,
    exportError: null,
  },
  
  reducers: {
    clearPurchaseErrors: (state) => {
      state.error = null;
      state.submitError = null;
    },
    clearCurrentPurchase: (state) => {
      state.current = null;
    },
    clearPriceHistory: (state) => {
      state.priceHistory = [];
    },
    clearProductPriceHistory: (state) => {
      state.productPriceHistory = null;
      state.productPriceHistoryError = null;
    },
    clearProductBatches: (state) => {
      state.productBatches = {};
      state.productBatchesError = null;
    },
    clearBatchAvailability: (state) => {
      state.batchAvailability = {};
    },
    clearStockBatches: (state) => {
      state.stockBatches = [];
      state.stockBatchesTotal = 0;
      state.stockBatchesError = null;
    },
    setStockBatchesPage: (state, action) => {
      state.stockBatchesPage = action.payload;
    },
    setStockBatchesLimit: (state, action) => {
      state.stockBatchesLimit = action.payload;
    },
    clearFilterOptions: (state) => {
      state.filterOptions = {
        products: [],
        batches: [],
        purchaseEntries: [],
        racks: [],
        suppliers: [],
        paymentStatuses: ['paid', 'unpaid', 'partial'],
        paymentTypes: ['Cash', 'Credit', 'Bank Transfer', 'UPI', 'Cheque'],
      };
    },
    clearExportError: (state) => {
      state.exportError = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // ─── Fetch Purchases ──────────────────────────────────────────────
      .addCase(fetchPurchases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ─── Fetch Purchase By ID ────────────────────────────────────────
      .addCase(fetchPurchaseById.fulfilled, (state, action) => {
        state.current = action.payload;
      })

      // ─── Create Purchase ─────────────────────────────────────────────
      .addCase(createPurchase.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createPurchase.fulfilled, (state, action) => {
        state.submitting = false;
        state.list.unshift(action.payload);
      })
      .addCase(createPurchase.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      // ─── Update Purchase ─────────────────────────────────────────────
      .addCase(updatePurchase.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.current?._id === action.payload._id) state.current = action.payload;
      })

      // ─── Stock Aging ─────────────────────────────────────────────────
      .addCase(fetchStockAging.pending, (state) => {
        state.stockAgingLoading = true;
      })
      .addCase(fetchStockAging.fulfilled, (state, action) => {
        state.stockAgingLoading = false;
        state.stockAging = action.payload;
      })
      .addCase(fetchStockAging.rejected, (state) => {
        state.stockAgingLoading = false;
      })

      // ─── Non-Moving Stock ────────────────────────────────────────────
      .addCase(fetchNonMovingStock.pending, (state) => {
        state.nonMovingLoading = true;
      })
      .addCase(fetchNonMovingStock.fulfilled, (state, action) => {
        state.nonMovingLoading = false;
        state.nonMovingStock = action.payload;
      })
      .addCase(fetchNonMovingStock.rejected, (state) => {
        state.nonMovingLoading = false;
      })

      // ─── Price History ───────────────────────────────────────────────
      .addCase(fetchPriceHistory.pending, (state) => {
        state.priceHistoryLoading = true;
      })
      .addCase(fetchPriceHistory.fulfilled, (state, action) => {
        state.priceHistoryLoading = false;
        state.priceHistory = action.payload;
      })
      .addCase(fetchPriceHistory.rejected, (state) => {
        state.priceHistoryLoading = false;
      })

      // ─── Product Price History ──────────────────────────────────────
      .addCase(fetchProductPriceHistory.pending, (state) => {
        state.productPriceHistoryLoading = true;
        state.productPriceHistoryError = null;
      })
      .addCase(fetchProductPriceHistory.fulfilled, (state, action) => {
        state.productPriceHistoryLoading = false;
        state.productPriceHistory = action.payload;
      })
      .addCase(fetchProductPriceHistory.rejected, (state, action) => {
        state.productPriceHistoryLoading = false;
        state.productPriceHistoryError = action.payload;
      })

      // ─── Product Batches ─────────────────────────────────────────────
      .addCase(fetchProductBatches.pending, (state) => {
        state.productBatchesLoading = true;
        state.productBatchesError = null;
      })
      .addCase(fetchProductBatches.fulfilled, (state, action) => {
        state.productBatchesLoading = false;
        state.productBatches = { ...state.productBatches, ...action.payload };
      })
      .addCase(fetchProductBatches.rejected, (state, action) => {
        state.productBatchesLoading = false;
        state.productBatchesError = action.payload;
      })

      // ─── Batch Availability ──────────────────────────────────────────
      .addCase(fetchBatchAvailability.pending, (state) => {
        state.batchAvailabilityLoading = true;
      })
      .addCase(fetchBatchAvailability.fulfilled, (state, action) => {
        state.batchAvailabilityLoading = false;
        state.batchAvailability[action.payload.productId] = action.payload.batches;
      })
      .addCase(fetchBatchAvailability.rejected, (state) => {
        state.batchAvailabilityLoading = false;
      })

      // ─── Data Explorer - Fetch Stock Batches ──────────────────────────
      .addCase(fetchStockBatches.pending, (state) => {
        state.stockBatchesLoading = true;
        state.stockBatchesError = null;
      })
      .addCase(fetchStockBatches.fulfilled, (state, action) => {
        state.stockBatchesLoading = false;
        state.stockBatches = action.payload.data || [];
        state.stockBatchesTotal = action.payload.total || 0;
        state.stockBatchesPage = action.payload.page || 1;
        state.stockBatchesTotalPages = action.payload.totalPages || 1;
        state.stockBatchesLimit = action.payload.limit || 50;
      })
      .addCase(fetchStockBatches.rejected, (state, action) => {
        state.stockBatchesLoading = false;
        state.stockBatchesError = action.payload || 'Failed to fetch stock batches';
        state.stockBatches = [];
        state.stockBatchesTotal = 0;
      })

      // ─── Data Explorer - Export ───────────────────────────────────────
      .addCase(exportStockBatches.pending, (state) => {
        state.exporting = true;
        state.exportError = null;
      })
      .addCase(exportStockBatches.fulfilled, (state) => {
        state.exporting = false;
      })
      .addCase(exportStockBatches.rejected, (state, action) => {
        state.exporting = false;
        state.exportError = action.payload || 'Failed to export stock batches';
      })

      // ─── Data Explorer - Filter Options ───────────────────────────────
      .addCase(fetchFilterOptions.pending, (state) => {
        state.filterOptionsLoading = true;
        state.filterOptionsError = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptions = {
          products: action.payload.products || [],
          batches: action.payload.batches || [],
          purchaseEntries: action.payload.purchaseEntries || [],
          racks: action.payload.racks || [],
          suppliers: action.payload.suppliers || [],
          paymentStatuses: action.payload.paymentStatuses || ['paid', 'unpaid', 'partial'],
          paymentTypes: action.payload.paymentTypes || ['Cash', 'Credit', 'Bank Transfer', 'UPI', 'Cheque'],
        };
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.filterOptionsLoading = false;
        state.filterOptionsError = action.payload || 'Failed to fetch filter options';
      });
  },
});

// ─── Exports ───────────────────────────────────────────────────────────────────

export const {
  clearPurchaseErrors,
  clearCurrentPurchase,
  clearPriceHistory,
  clearProductPriceHistory,
  clearProductBatches,
  clearBatchAvailability,
  clearStockBatches,
  setStockBatchesPage,
  setStockBatchesLimit,
  clearFilterOptions,
  clearExportError,
} = purchaseSlice.actions;

export default purchaseSlice.reducer;

//-------------- 13.08.2026 ---------------------------------
// // services/features/purchase/purchaseSlice.js

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// // ─── Purchase Entries ─────────────────────────────────────────────────────────

// export const fetchPurchases = createAsyncThunk(
//   'purchases/fetch',
//   async (filters = {}, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       Object.entries(filters).forEach(([k, v]) => {
//         if (v !== undefined && v !== null && v !== '') params.set(k, v);
//       });
//       const qs = params.toString();
//       const res = await API.get(`/api/purchases${qs ? `?${qs}` : ''}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchases');
//     }
//   }
// );

// export const fetchPurchaseById = createAsyncThunk(
//   'purchases/fetchOne',
//   async (id, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/${id}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch purchase');
//     }
//   }
// );

// export const createPurchase = createAsyncThunk(
//   'purchases/create',
//   async (payload, { rejectWithValue }) => {
//     try {
//       const res = await API.post('/api/purchases', payload);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to save purchase entry');
//     }
//   }
// );

// export const updatePurchase = createAsyncThunk(
//   'purchases/update',
//   async ({ id, payload }, { rejectWithValue }) => {
//     try {
//       const res = await API.put(`/api/purchases/${id}`, payload);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to update purchase');
//     }
//   }
// );

// // ─── Reports ──────────────────────────────────────────────────────────────────

// export const fetchStockAging = createAsyncThunk(
//   'purchases/stockAging',
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await API.get('/api/purchases/stock-aging');
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch stock aging report');
//     }
//   }
// );

// export const fetchNonMovingStock = createAsyncThunk(
//   'purchases/nonMovingStock',
//   async (days = 60, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/non-moving-stock?days=${days}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch non-moving stock report');
//     }
//   }
// );

// export const fetchPriceHistory = createAsyncThunk(
//   'purchases/priceHistory',
//   async (productId, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/price-history/${productId}`);
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch price history');
//     }
//   }
// );

// export const fetchProductPriceHistory = createAsyncThunk(
//   'purchases/productPriceHistory',
//   async (productId, { rejectWithValue }) => {
//     try {
//       if (!productId || productId.length !== 24) {
//         return rejectWithValue('Invalid product ID format - must be 24 character hex string');
//       }
      
//       const res = await API.get(`/api/purchases/product-price-history/${productId}`);
//       return res.data;
//     } catch (err) {
//       const status = err.response?.status;
//       const apiMsg = err.response?.data?.msg;
//       const detail = apiMsg || (status ? `Request failed with status ${status}` : err.message) || 'Unknown error';
//       return rejectWithValue(detail);
//     }
//   }
// );

// // ─── Product Batches for OrderCartPage ──────────────────────────────────────

// export const fetchProductBatches = createAsyncThunk(
//   'purchases/fetchProductBatches',
//   async (productIds, { rejectWithValue }) => {
//     try {
//       const ids = Array.isArray(productIds) ? productIds : [productIds];
//       if (ids.length === 0) return {};

//       const res = await API.post('/api/purchases/product-batches', { productIds: ids });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch product batches');
//     }
//   }
// );

// // ✅ NEW: Fetch available batch quantities for a product (FIXED)
// export const fetchBatchAvailability = createAsyncThunk(
//   'purchases/fetchBatchAvailability',
//   async (productId, { rejectWithValue }) => {
//     try {
//       const res = await API.get(`/api/purchases/product-batches/${productId}/availability`);
//       return { productId, batches: res.data };
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to fetch batch availability');
//     }
//   }
// );

// // ─── Slice ─────────────────────────────────────────────────────────────────────

// const purchaseSlice = createSlice({
//   name: 'purchases',
//   initialState: {
//     list: [],
//     loading: false,
//     error: null,
//     submitting: false,
//     submitError: null,
//     current: null,
//     stockAging: { '0-30': [], '31-60': [], '61-90': [], '91-180': [], '180+': [] },
//     stockAgingLoading: false,
//     nonMovingStock: [],
//     nonMovingLoading: false,
//     priceHistory: [],
//     priceHistoryLoading: false,
//     productPriceHistory: null,
//     productPriceHistoryLoading: false,
//     productPriceHistoryError: null,
//     productBatches: {},
//     productBatchesLoading: false,
//     productBatchesError: null,
//     batchAvailability: {},
//     batchAvailabilityLoading: false,
//   },
//   reducers: {
//     clearPurchaseErrors: (state) => {
//       state.error = null;
//       state.submitError = null;
//     },
//     clearCurrentPurchase: (state) => {
//       state.current = null;
//     },
//     clearPriceHistory: (state) => {
//       state.priceHistory = [];
//     },
//     clearProductPriceHistory: (state) => {
//       state.productPriceHistory = null;
//       state.productPriceHistoryError = null;
//     },
//     clearProductBatches: (state) => {
//       state.productBatches = {};
//       state.productBatchesError = null;
//     },
//     clearBatchAvailability: (state) => {
//       state.batchAvailability = {};
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // ─── Fetch Purchases ──────────────────────────────────────────────
//       .addCase(fetchPurchases.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchPurchases.fulfilled, (state, action) => {
//         state.loading = false;
//         state.list = action.payload;
//       })
//       .addCase(fetchPurchases.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // ─── Fetch Purchase By ID ────────────────────────────────────────
//       .addCase(fetchPurchaseById.fulfilled, (state, action) => {
//         state.current = action.payload;
//       })

//       // ─── Create Purchase ─────────────────────────────────────────────
//       .addCase(createPurchase.pending, (state) => {
//         state.submitting = true;
//         state.submitError = null;
//       })
//       .addCase(createPurchase.fulfilled, (state, action) => {
//         state.submitting = false;
//         state.list.unshift(action.payload);
//       })
//       .addCase(createPurchase.rejected, (state, action) => {
//         state.submitting = false;
//         state.submitError = action.payload;
//       })

//       // ─── Update Purchase ─────────────────────────────────────────────
//       .addCase(updatePurchase.fulfilled, (state, action) => {
//         const idx = state.list.findIndex((p) => p._id === action.payload._id);
//         if (idx !== -1) state.list[idx] = action.payload;
//         if (state.current?._id === action.payload._id) state.current = action.payload;
//       })

//       // ─── Stock Aging ─────────────────────────────────────────────────
//       .addCase(fetchStockAging.pending, (state) => {
//         state.stockAgingLoading = true;
//       })
//       .addCase(fetchStockAging.fulfilled, (state, action) => {
//         state.stockAgingLoading = false;
//         state.stockAging = action.payload;
//       })
//       .addCase(fetchStockAging.rejected, (state) => {
//         state.stockAgingLoading = false;
//       })

//       // ─── Non-Moving Stock ────────────────────────────────────────────
//       .addCase(fetchNonMovingStock.pending, (state) => {
//         state.nonMovingLoading = true;
//       })
//       .addCase(fetchNonMovingStock.fulfilled, (state, action) => {
//         state.nonMovingLoading = false;
//         state.nonMovingStock = action.payload;
//       })
//       .addCase(fetchNonMovingStock.rejected, (state) => {
//         state.nonMovingLoading = false;
//       })

//       // ─── Price History ───────────────────────────────────────────────
//       .addCase(fetchPriceHistory.pending, (state) => {
//         state.priceHistoryLoading = true;
//       })
//       .addCase(fetchPriceHistory.fulfilled, (state, action) => {
//         state.priceHistoryLoading = false;
//         state.priceHistory = action.payload;
//       })
//       .addCase(fetchPriceHistory.rejected, (state) => {
//         state.priceHistoryLoading = false;
//       })

//       // ─── Product Price History ──────────────────────────────────────
//       .addCase(fetchProductPriceHistory.pending, (state) => {
//         state.productPriceHistoryLoading = true;
//         state.productPriceHistoryError = null;
//       })
//       .addCase(fetchProductPriceHistory.fulfilled, (state, action) => {
//         state.productPriceHistoryLoading = false;
//         state.productPriceHistory = action.payload;
//       })
//       .addCase(fetchProductPriceHistory.rejected, (state, action) => {
//         state.productPriceHistoryLoading = false;
//         state.productPriceHistoryError = action.payload;
//       })

//       // ─── Product Batches ─────────────────────────────────────────────
//       .addCase(fetchProductBatches.pending, (state) => {
//         state.productBatchesLoading = true;
//         state.productBatchesError = null;
//       })
//       .addCase(fetchProductBatches.fulfilled, (state, action) => {
//         state.productBatchesLoading = false;
//         state.productBatches = { ...state.productBatches, ...action.payload };
//       })
//       .addCase(fetchProductBatches.rejected, (state, action) => {
//         state.productBatchesLoading = false;
//         state.productBatchesError = action.payload;
//       })

//       // ─── Batch Availability ──────────────────────────────────────────
//       .addCase(fetchBatchAvailability.pending, (state) => {
//         state.batchAvailabilityLoading = true;
//       })
//       .addCase(fetchBatchAvailability.fulfilled, (state, action) => {
//         state.batchAvailabilityLoading = false;
//         state.batchAvailability[action.payload.productId] = action.payload.batches;
//       })
//       .addCase(fetchBatchAvailability.rejected, (state) => {
//         state.batchAvailabilityLoading = false;
//       });
//   },
// });

// // ─── Exports ───────────────────────────────────────────────────────────────────

// export const {
//   clearPurchaseErrors,
//   clearCurrentPurchase,
//   clearPriceHistory,
//   clearProductPriceHistory,
//   clearProductBatches,
//   clearBatchAvailability,
// } = purchaseSlice.actions;

// export default purchaseSlice.reducer;

