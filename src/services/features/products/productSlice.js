// src/services/features/products/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../API/api';

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const res = await API.get('/api/products');
  return res.data;
});

export const addProduct = createAsyncThunk('products/add', async (formData) => {
  const res = await API.post('/api/products/add', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }) => {
  const res = await API.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
});

export const deleteProduct = createAsyncThunk('products/delete', async (id) => {
  await API.delete(`/api/products/${id}`);
  return id;
});

export const reduceStock = createAsyncThunk('products/reduceStock', async (items, { rejectWithValue }) => {
  try {
    const payload = items.map((item) => ({ productId: item.id, qty: item.qty }));
    const res = await API.post('/api/products/reduce-stock', { items: payload });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Stock update failed');
  }
});

export const updateProductStock = createAsyncThunk(
  'products/updateStock',
  async (stockUpdates, { rejectWithValue }) => {
    try {
      const updatePromises = stockUpdates.map(({ id, quantity }) =>
        API.patch(`/api/products/${id}/stock`, { 
          quantity: -Math.abs(quantity)
        })
      );
      
      const results = await Promise.all(updatePromises);
      
      return results.map((res, index) => ({
        id: stockUpdates[index].id,
        quantity: stockUpdates[index].quantity,
        newStock: res.data.newStock
      }));
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to update stock');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: { 
    list: [], 
    loading: false, 
    error: null,
    stockUpdating: false,
    stockUpdateError: null,
  },
  reducers: {
    // ✅ Optimistic stock update - immediate UI feedback
    optimisticUpdateStock: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.list.find(p => p._id === productId || p.id === productId);
      if (product) {
        product.moq = Math.max(0, (product.moq || 0) - quantity);
      }
    },
    resetStockUpdateState: (state) => {
      state.stockUpdating = false;
      state.stockUpdateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => { 
        state.loading = false; 
        state.list = action.payload; 
      })
      .addCase(fetchProducts.rejected,  (state, action) => { 
        state.loading = false; 
        state.error = action.error.message; 
      })
      .addCase(addProduct.fulfilled,    (state, action) => { 
        state.list.unshift(action.payload); 
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload);
      })
      .addCase(updateProductStock.pending, (state) => {
        state.stockUpdating = true;
        state.stockUpdateError = null;
      })
      .addCase(updateProductStock.fulfilled, (state, action) => {
        state.stockUpdating = false;
        const updates = action.payload;
        
        updates.forEach(({ id, quantity, newStock }) => {
          const product = state.list.find(p => p._id === id || p.id === id);
          if (product) {
            if (newStock !== undefined) {
              product.moq = Math.max(0, newStock);
            } else {
              product.moq = Math.max(0, (product.moq || 0) - quantity);
            }
          }
        });
      })
      .addCase(updateProductStock.rejected, (state, action) => {
        state.stockUpdating = false;
        state.stockUpdateError = action.payload || 'Failed to update stock';
      });
  },
});

export const {
  optimisticUpdateStock,
  resetStockUpdateState,
} = productSlice.actions;

export default productSlice.reducer;

//--------- 11.08.26 --------------
// // src/services/features/products/productSlice.js
// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import API from '../../API/api';

// export const fetchProducts = createAsyncThunk('products/fetch', async () => {
//   const res = await API.get('/api/products');
//   return res.data;
// });

// export const addProduct = createAsyncThunk('products/add', async (formData) => {
//   const res = await API.post('/api/products/add', formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
//   return res.data;
// });

// export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }) => {
//   const res = await API.put(`/api/products/${id}`, formData, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//   });
//   return res.data;
// });

// export const deleteProduct = createAsyncThunk('products/delete', async (id) => {
//   await API.delete(`/api/products/${id}`);
//   return id;
// });

// export const reduceStock = createAsyncThunk('products/reduceStock', async (items, { rejectWithValue }) => {
//   try {
//     const payload = items.map((item) => ({ productId: item.id, qty: item.qty }));
//     const res = await API.post('/api/products/reduce-stock', { items: payload });
//     return res.data;
//   } catch (err) {
//     return rejectWithValue(err.response?.data?.error || 'Stock update failed');
//   }
// });

// // ============================================================
// // NEW: Update product stock after order placement
// // ============================================================
// export const updateProductStock = createAsyncThunk(
//   'products/updateStock',
//   async (stockUpdates, { rejectWithValue }) => {
//     try {
//       // stockUpdates format: [{ id: 'productId', quantity: 5 }]
//       const updatePromises = stockUpdates.map(({ id, quantity }) =>
//         API.patch(`/api/products/${id}/stock`, { 
//           quantity: -Math.abs(quantity) // Negative to reduce stock
//         })
//       );
      
//       const results = await Promise.all(updatePromises);
      
//       return results.map((res, index) => ({
//         id: stockUpdates[index].id,
//         quantity: stockUpdates[index].quantity,
//         newStock: res.data.newStock
//       }));
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.msg || 'Failed to update stock');
//     }
//   }
// );

// const productSlice = createSlice({
//   name: 'products',
//   initialState: { 
//     list: [], 
//     loading: false, 
//     error: null,
//     stockUpdating: false,
//     stockUpdateError: null,
//   },
//   reducers: {
//     optimisticUpdateStock: (state, action) => {
//       const { productId, quantity } = action.payload;
//       const product = state.list.find(p => p._id === productId || p.id === productId);
//       if (product) {
//         product.moq = Math.max(0, (product.moq || 0) - quantity);
//       }
//     },
//     resetStockUpdateState: (state) => {
//       state.stockUpdating = false;
//       state.stockUpdateError = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchProducts.pending,   (state) => { state.loading = true; })
//       .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
//       .addCase(fetchProducts.rejected,  (state, action) => { state.loading = false; state.error = action.error.message; })
//       .addCase(addProduct.fulfilled,    (state, action) => { state.list.unshift(action.payload); })
//       .addCase(updateProduct.fulfilled, (state, action) => {
//         const idx = state.list.findIndex((p) => p._id === action.payload._id);
//         if (idx !== -1) state.list[idx] = action.payload;
//       })
//       .addCase(deleteProduct.fulfilled, (state, action) => {
//         state.list = state.list.filter((p) => p._id !== action.payload);
//       })
//       // NEW: Update Product Stock
//       .addCase(updateProductStock.pending, (state) => {
//         state.stockUpdating = true;
//         state.stockUpdateError = null;
//       })
//       .addCase(updateProductStock.fulfilled, (state, action) => {
//         state.stockUpdating = false;
//         const updates = action.payload;
        
//         updates.forEach(({ id, quantity, newStock }) => {
//           const product = state.list.find(p => p._id === id || p.id === id);
//           if (product) {
//             if (newStock !== undefined) {
//               product.moq = Math.max(0, newStock);
//             } else {
//               product.moq = Math.max(0, (product.moq || 0) - quantity);
//             }
//           }
//         });
//       })
//       .addCase(updateProductStock.rejected, (state, action) => {
//         state.stockUpdating = false;
//         state.stockUpdateError = action.payload || 'Failed to update stock';
//       });
//   },
// });

// export const {
//   optimisticUpdateStock,
//   resetStockUpdateState,
// } = productSlice.actions;

// export default productSlice.reducer;

// //----------- old working code --------------------
// // // src/services/features/products/productSlice.js
// // import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// // import API from '../../API/api';

// // export const fetchProducts = createAsyncThunk('products/fetch', async () => {
// //   const res = await API.get('/api/products');
// //   return res.data;
// // });

// // export const addProduct = createAsyncThunk('products/add', async (formData) => {
// //   const res = await API.post('/api/products/add', formData, {
// //     headers: { 'Content-Type': 'multipart/form-data' },
// //   });
// //   return res.data;
// // });

// // export const updateProduct = createAsyncThunk('products/update', async ({ id, formData }) => {
// //   const res = await API.put(`/api/products/${id}`, formData, {
// //     headers: { 'Content-Type': 'multipart/form-data' },
// //   });
// //   return res.data;
// // });

// // export const deleteProduct = createAsyncThunk('products/delete', async (id) => {
// //   await API.delete(`/api/products/${id}`);
// //   return id;
// // });

// // export const reduceStock = createAsyncThunk('products/reduceStock', async (items, { rejectWithValue }) => {
// //   try {
// //     const payload = items.map((item) => ({ productId: item.id, qty: item.qty }));
// //     const res = await API.post('/api/products/reduce-stock', { items: payload });
// //     return res.data;
// //   } catch (err) {
// //     return rejectWithValue(err.response?.data?.error || 'Stock update failed');
// //   }
// // });

// // const productSlice = createSlice({
// //   name: 'products',
// //   initialState: { list: [], loading: false, error: null },
// //   reducers: {},
// //   extraReducers: (builder) => {
// //     builder
// //       .addCase(fetchProducts.pending,   (state) => { state.loading = true; })
// //       .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
// //       .addCase(fetchProducts.rejected,  (state, action) => { state.loading = false; state.error = action.error.message; })
// //       .addCase(addProduct.fulfilled,    (state, action) => { state.list.unshift(action.payload); })
// //       .addCase(updateProduct.fulfilled, (state, action) => {
// //         const idx = state.list.findIndex((p) => p._id === action.payload._id);
// //         if (idx !== -1) state.list[idx] = action.payload;
// //       })
// //       .addCase(deleteProduct.fulfilled, (state, action) => {
// //         state.list = state.list.filter((p) => p._id !== action.payload);
// //       });
// //   },
// // });

// // export default productSlice.reducer;
