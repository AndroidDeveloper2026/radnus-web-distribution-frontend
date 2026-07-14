import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/features/products/productSlice';
import { useTheme } from '../../context/ThemeContext';
import './OrderCartPage.css';

import { Search, X, Package, ShoppingCart, Filter, Edit3, Save, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ------------------ Helper functions ------------------
const getNum = (obj, key, fallback = 0) => {
  if (obj?.[key] !== undefined && obj?.[key] !== null) {
    const val = Number(obj[key]);
    if (!isNaN(val)) return val;
  }
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) {
    const val = Number(obj[spacedKey]);
    if (!isNaN(val)) return val;
  }
  return fallback;
};

const getStr = (obj, key, fallback = '') => {
  if (obj?.[key] !== undefined && obj?.[key] !== null) return String(obj[key]).trim();
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) return String(obj[spacedKey]).trim();
  return fallback;
};

const getId = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  return obj._id || obj.id;
};
// -------------------------------------------------------

const PriceTypeSelector = ({ priceType, onSelectPriceType }) => {
  const options = [
    { label: 'Retailer', value: 'retailerPrice' },
    { label: 'Distributor', value: 'distributorPrice' },
    { label: 'Walk‑in', value: 'walkinPrice' },
    { label: 'MRP', value: 'mrp' },
  ];
  return (
    <div className="price-selector-row">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`price-option ${priceType === opt.value ? 'active' : ''}`}
          onClick={() => onSelectPriceType(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const ProductRow = ({ 
  item, 
  onUpdateQty, 
  onQtyInputChange, 
  price, 
  onPriceChange,
  isEditingPrice,
  onTogglePriceEdit,
  onSavePriceEdit
}) => {
  const stock = item.currentStock || 0;
  const [localQty, setLocalQty] = useState(item.qty.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState(price.toString());
  const inputRef = useRef(null);

  // Sync local value when item.qty changes externally
  useEffect(() => {
    if (!isEditing) {
      setLocalQty(item.qty.toString());
    }
  }, [item.qty, isEditing]);

  // Sync local price when price changes externally
  useEffect(() => {
    if (!isEditingPrice) {
      setLocalPrice(price.toString());
    }
  }, [price, isEditingPrice]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQty(value);
    
    // Allow empty string for typing
    if (value === '') {
      onQtyInputChange(item.id, 0);
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(numValue, stock));
      onQtyInputChange(item.id, clampedValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Ensure valid number on blur
    let numValue = parseInt(localQty, 10);
    if (isNaN(numValue)) {
      numValue = 0;
    }
    const clampedValue = Math.max(0, Math.min(numValue, stock));
    onQtyInputChange(item.id, clampedValue);
    setLocalQty(clampedValue.toString());
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  // Price editing handlers
  const handlePriceInputChange = (e) => {
    let value = e.target.value;
    // Allow only numbers and decimal
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    setLocalPrice(value);
  };

  const handlePriceBlur = () => {
    let numValue = parseFloat(localPrice);
    if (isNaN(numValue) || numValue < 0) {
      numValue = 0;
    }
    setLocalPrice(numValue.toString());
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Save price on Enter
      const numValue = parseFloat(localPrice);
      if (!isNaN(numValue) && numValue >= 0) {
        onSavePriceEdit(item.id, numValue);
      }
    }
  };

  const handleSavePrice = () => {
    const numValue = parseFloat(localPrice);
    if (!isNaN(numValue) && numValue >= 0) {
      onSavePriceEdit(item.id, numValue);
    } else {
      // Reset to original if invalid
      setLocalPrice(price.toString());
      onTogglePriceEdit(item.id);
    }
  };

  const handleCancelPriceEdit = () => {
    setLocalPrice(price.toString());
    onTogglePriceEdit(item.id);
  };

  return (
    <div className="product-card">
      <div className="product-row">
        <div className="product-image-placeholder">
          {item.image ? (
            <img src={item.image} alt={item.name} className="product-image" />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>

        <div className="product-info">
          <div className="product-name">{item.name}</div>
          <div className="product-meta">SKU: {item.sku}</div>
          <div className="product-meta">Stock: {stock} units</div>
          <div className="product-price-row">
            {isEditingPrice ? (
              <div className="price-edit-container">
                <span className="price-edit-label">₹</span>
                <input
                  type="text"
                  className="price-edit-input"
                  value={localPrice}
                  onChange={handlePriceInputChange}
                  onBlur={handlePriceBlur}
                  onKeyDown={handlePriceKeyDown}
                  autoFocus
                  placeholder="Enter price"
                />
                <button 
                  className="price-edit-save-btn" 
                  onClick={handleSavePrice}
                  title="Save price"
                >
                  <Save size={14} />
                </button>
                <button 
                  className="price-edit-cancel-btn" 
                  onClick={handleCancelPriceEdit}
                  title="Cancel"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="product-price">₹{price.toLocaleString('en-IN')}</span>
                <button 
                  className="price-edit-toggle-btn"
                  onClick={() => onTogglePriceEdit(item.id)}
                  title="Edit price"
                >
                  <Edit3 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="stepper">
          <button
            className="qty-btn"
            onClick={() => onUpdateQty(item.id, 'dec')}
            disabled={item.qty === 0}
          >
            −
          </button>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="qty-input"
            value={localQty}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <button
            className="qty-btn"
            onClick={() => onUpdateQty(item.id, 'inc')}
            disabled={item.qty >= stock}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderCartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const products = useSelector(state => state.products.list);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [priceType, setPriceType] = useState('retailerPrice');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const hasInitialized = useRef(false);

  // Extract unique categories from products
  const categories = useMemo(() => {
    if (!products.length) return [];
    const cats = new Set();
    products.forEach(product => {
      const category = getStr(product, 'category');
      if (category) cats.add(category);
    });
    return Array.from(cats).sort();
  }, [products]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchProducts());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Compute available stock directly from product moq
  const stockDataMap = useMemo(() => {
    if (!products.length) return new Map();

    const stockMap = new Map();
    products.forEach(product => {
      const id = getId(product._id);
      const moq = getNum(product, 'moq', 0);
      const category = getStr(product, 'category');

      stockMap.set(id, {
        id,
        name: getStr(product, 'name'),
        sku: getStr(product, 'sku'),
        category: category,
        retailerPrice: getNum(product, 'retailerPrice'),
        distributorPrice: getNum(product, 'distributorPrice'),
        walkinPrice: getNum(product, 'walkinPrice'),
        mrp: getNum(product, 'mrp'),
        image: product.image ?? null,
        availableStock: moq,
      });
    });

    return stockMap;
  }, [products]);

  // Build cart from stockDataMap (only once) - preserving product order as received from API
  useEffect(() => {
    if (!stockDataMap.size) return;
    if (hasInitialized.current) return;

    const newCart = Array.from(stockDataMap.values()).map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      retailerPrice: item.retailerPrice,
      distributorPrice: item.distributorPrice,
      walkinPrice: item.walkinPrice,
      mrp: item.mrp,
      image: item.image,
      currentStock: item.availableStock,
      qty: 0,
      // Custom prices for each price type (initialized with default values)
      customPrices: {
        retailerPrice: item.retailerPrice,
        distributorPrice: item.distributorPrice,
        walkinPrice: item.walkinPrice,
        mrp: item.mrp,
      },
      // Track if price has been custom modified
      priceModified: {
        retailerPrice: false,
        distributorPrice: false,
        walkinPrice: false,
        mrp: false,
      },
      addedToCartAt: null
    }));
    setCart(newCart);
    hasInitialized.current = true;
  }, [stockDataMap]);

  const updateQty = useCallback((id, type) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const oldItem = prev[index];
      let newQty = oldItem.qty;
      if (type === 'inc') newQty++;
      if (type === 'dec') newQty--;
      newQty = Math.max(0, Math.min(newQty, oldItem.currentStock));
      if (newQty === oldItem.qty) return prev;
      const newItem = { ...oldItem, qty: newQty };
      
      // If we're adding an item (quantity goes from 0 to >0), record the timestamp
      if (oldItem.qty === 0 && newQty > 0) {
        newItem.addedToCartAt = Date.now();
      }
      // If we're removing an item (quantity goes from >0 to 0), clear the timestamp
      if (oldItem.qty > 0 && newQty === 0) {
        newItem.addedToCartAt = null;
      }
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, []);

  const updateQtyDirect = useCallback((id, newQty) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const oldItem = prev[index];
      const clampedQty = Math.max(0, Math.min(newQty, oldItem.currentStock));
      if (clampedQty === oldItem.qty) return prev;
      const newItem = { ...oldItem, qty: clampedQty };
      
      // If we're adding an item (quantity goes from 0 to >0), record the timestamp
      if (oldItem.qty === 0 && clampedQty > 0) {
        newItem.addedToCartAt = Date.now();
      }
      // If we're removing an item (quantity goes from >0 to 0), clear the timestamp
      if (oldItem.qty > 0 && clampedQty === 0) {
        newItem.addedToCartAt = null;
      }
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, []);

  // Toggle price edit mode for a specific product
  const togglePriceEdit = useCallback((id) => {
    setEditingPriceId(prev => prev === id ? null : id);
  }, []);

  // Save custom price for a product
  const saveCustomPrice = useCallback((id, newPrice) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const item = prev[index];
      const updatedItem = {
        ...item,
        customPrices: {
          ...item.customPrices,
          [priceType]: newPrice
        },
        priceModified: {
          ...item.priceModified,
          [priceType]: true
        }
      };
      
      const newCart = [...prev];
      newCart[index] = updatedItem;
      return newCart;
    });
    setEditingPriceId(null);
  }, [priceType]);

  // Get current price for a product (custom if modified, otherwise default)
  const getCurrentPrice = useCallback((item) => {
    // Check if custom price exists for this price type
    if (item.customPrices && item.customPrices[priceType] !== undefined && item.priceModified?.[priceType]) {
      return item.customPrices[priceType];
    }
    // Otherwise return the default price
    return item[priceType] || 0;
  }, [priceType]);

  // Filter and sort: selected items first (by addition order), then by name for non-selected
  const filteredAndSortedCart = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    let filtered = cart;
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Sort: selected items (qty > 0) by when they were added (oldest first), then unselected by name
    return [...filtered].sort((a, b) => {
      // Both selected - sort by addition time (oldest first)
      if (a.qty > 0 && b.qty > 0) {
        const timeA = a.addedToCartAt || 0;
        const timeB = b.addedToCartAt || 0;
        return timeA - timeB;
      }
      // Selected items come before unselected
      if (a.qty > 0 && b.qty === 0) return -1;
      if (a.qty === 0 && b.qty > 0) return 1;
      // Both unselected - sort by name
      return a.name.localeCompare(b.name);
    });
  }, [cart, searchQuery, selectedCategory]);

  // Get items with quantity > 0, maintaining the order they were added
  const cartItems = useMemo(() => {
    // Filter items with quantity > 0 and sort by when they were added (oldest first)
    const selected = cart.filter(item => item.qty > 0);
    return [...selected].sort((a, b) => {
      const timeA = a.addedToCartAt || 0;
      const timeB = b.addedToCartAt || 0;
      return timeA - timeB;
    });
  }, [cart]);

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const totalAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (getCurrentPrice(item) || 0) * item.qty, 0),
    [cartItems, getCurrentPrice]
  );

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }
    
    // IMPORTANT: cartItems is already sorted by addition time (oldest first)
    // This preserves the order in which items were added to the cart
    const orderedItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: getCurrentPrice(item) || 0,
      originalPrice: item[priceType] || 0,
      priceModified: item.priceModified?.[priceType] || false,
    }));
    
    // Log for debugging
    console.log('Order items with custom prices:', orderedItems);
    
    navigate('/order-success', {
      state: {
        cartItems: orderedItems,
        grandTotal: totalAmount,
        paymentMode: 'cash',
        date: new Date().toISOString(),
        priceType: priceType,
      }
    });
  };

  const clearCategoryFilter = () => {
    setSelectedCategory('');
  };

  if (isLoading) {
    return (
      <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
        <LoadingSpinner message="Loading products..." />
      </div>
    );
  }

  return (
    <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
      {/* Left: Product List */}
      <div className="cart-main">
        <div className="cart-header">
          <h1>
            My Cart
            <span className="cart-count-badge">({totalItems})</span>
          </h1>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="category-filter-section">
              <div className="filter-wrapper">
                <Filter size={16} className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {selectedCategory && (
                  <button onClick={clearCategoryFilter} className="filter-clear">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {searchQuery && (
            <div className="result-count">
              {filteredAndSortedCart.length} result{filteredAndSortedCart.length !== 1 ? 's' : ''} found
            </div>
          )}
          
          <PriceTypeSelector priceType={priceType} onSelectPriceType={setPriceType} />
        </div>

        <div className="product-grid">
          {filteredAndSortedCart.map(product => (
            <ProductRow
              key={product.id}
              item={product}
              onUpdateQty={updateQty}
              onQtyInputChange={updateQtyDirect}
              price={getCurrentPrice(product)}
              onPriceChange={saveCustomPrice}
              isEditingPrice={editingPriceId === product.id}
              onTogglePriceEdit={togglePriceEdit}
              onSavePriceEdit={saveCustomPrice}
            />
          ))}
        </div>

        {filteredAndSortedCart.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>
              {selectedCategory 
                ? `No products found in "${selectedCategory}" category${searchQuery ? ` matching "${searchQuery}"` : ''}`
                : searchQuery 
                  ? `No products match "${searchQuery}"`
                  : 'No products available'}
            </p>
          </div>
        )}
      </div>

      {/* Right: Order Summary Panel */}
      <div className="order-summary-panel">
        <div className="summary-header">
          <ShoppingCart size={20} />
          <span>Order Summary</span>
        </div>

        <div className="summary-scrollable">
          {cartItems.length === 0 ? (
            <div className="summary-empty">No items added yet</div>
          ) : (
            cartItems.map((item, idx) => {
              const currentPrice = getCurrentPrice(item);
              const originalPrice = item[priceType] || 0;
              const isPriceModified = item.priceModified?.[priceType] || false;
              const isPriceReduced = isPriceModified && currentPrice < originalPrice;
              const isPriceIncreased = isPriceModified && currentPrice > originalPrice;
              
              return (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-name">
                    <span className="item-order-number">{idx + 1}.</span> {item.name}
                    {isPriceModified && (
                      <span className={`price-badge ${isPriceReduced ? 'price-reduced' : 'price-increased'}`}>
                        {isPriceReduced ? '⬇' : '⬆'}
                      </span>
                    )}
                  </div>
                  <div className="summary-item-right">
                    <span className="summary-item-qty">×{item.qty}</span>
                    <span className="summary-item-price">
                      ₹{((currentPrice || 0) * item.qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="summary-divider" />

        <div className="summary-row subtotal">
          <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="summary-divider" />

        <div className="summary-row grand-total">
          <span>Total</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <button
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={cartItems.length === 0}
        >
          PLACE ORDER
        </button>
      </div>
    </div>
  );
};

export default OrderCartPage;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchProducts } from '../../services/features/products/productSlice';
// import { useTheme } from '../../context/ThemeContext';
// import './OrderCartPage.css';

// import { Search, X, Package, ShoppingCart, Filter } from 'lucide-react';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';

// // ------------------ Helper functions ------------------
// const getNum = (obj, key, fallback = 0) => {
//   if (obj?.[key] !== undefined && obj?.[key] !== null) {
//     const val = Number(obj[key]);
//     if (!isNaN(val)) return val;
//   }
//   const spacedKey = key + ' ';
//   if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) {
//     const val = Number(obj[spacedKey]);
//     if (!isNaN(val)) return val;
//   }
//   return fallback;
// };

// const getStr = (obj, key, fallback = '') => {
//   if (obj?.[key] !== undefined && obj?.[key] !== null) return String(obj[key]).trim();
//   const spacedKey = key + ' ';
//   if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) return String(obj[spacedKey]).trim();
//   return fallback;
// };

// const getId = (obj) => {
//   if (!obj) return '';
//   if (typeof obj === 'string') return obj;
//   if (obj.$oid) return obj.$oid;
//   return obj._id || obj.id;
// };
// // -------------------------------------------------------

// const PriceTypeSelector = ({ priceType, onSelectPriceType }) => {
//   const options = [
//     { label: 'Retailer', value: 'retailerPrice' },
//     { label: 'Distributor', value: 'distributorPrice' },
//     { label: 'Walk‑in', value: 'walkinPrice' },
//     { label: 'MRP', value: 'mrp' },
//   ];
//   return (
//     <div className="price-selector-row">
//       {options.map(opt => (
//         <button
//           key={opt.value}
//           className={`price-option ${priceType === opt.value ? 'active' : ''}`}
//           onClick={() => onSelectPriceType(opt.value)}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// };

// const ProductRow = ({ item, onUpdateQty, onQtyInputChange, price }) => {
//   const stock = item.currentStock || 0;
//   const [localQty, setLocalQty] = useState(item.qty.toString());
//   const [isEditing, setIsEditing] = useState(false);
//   const inputRef = useRef(null);

//   // Sync local value when item.qty changes externally
//   useEffect(() => {
//     if (!isEditing) {
//       setLocalQty(item.qty.toString());
//     }
//   }, [item.qty, isEditing]);

//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     setLocalQty(value);
    
//     // Allow empty string for typing
//     if (value === '') {
//       onQtyInputChange(item.id, 0);
//       return;
//     }
    
//     const numValue = parseInt(value, 10);
//     if (!isNaN(numValue)) {
//       const clampedValue = Math.max(0, Math.min(numValue, stock));
//       onQtyInputChange(item.id, clampedValue);
//     }
//   };

//   const handleBlur = () => {
//     setIsEditing(false);
//     // Ensure valid number on blur
//     let numValue = parseInt(localQty, 10);
//     if (isNaN(numValue)) {
//       numValue = 0;
//     }
//     const clampedValue = Math.max(0, Math.min(numValue, stock));
//     onQtyInputChange(item.id, clampedValue);
//     setLocalQty(clampedValue.toString());
//   };

//   const handleFocus = () => {
//     setIsEditing(true);
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       inputRef.current?.blur();
//     }
//   };

//   return (
//     <div className="product-card">
//       <div className="product-row">
//         <div className="product-image-placeholder">
//           {item.image ? (
//             <img src={item.image} alt={item.name} className="product-image" />
//           ) : (
//             <div className="no-image">No Image</div>
//           )}
//         </div>

//         <div className="product-info">
//           <div className="product-name">{item.name}</div>
//           <div className="product-meta">SKU: {item.sku}</div>
//           <div className="product-meta">Stock: {stock} units</div>
//           <div className="product-price-row">
//             <span className="product-price">₹{price.toLocaleString('en-IN')}</span>
//           </div>
//         </div>

//         <div className="stepper">
//           <button
//             className="qty-btn"
//             onClick={() => onUpdateQty(item.id, 'dec')}
//             disabled={item.qty === 0}
//           >
//             −
//           </button>
//           <input
//             ref={inputRef}
//             type="text"
//             inputMode="numeric"
//             pattern="[0-9]*"
//             className="qty-input"
//             value={localQty}
//             onChange={handleInputChange}
//             onFocus={handleFocus}
//             onBlur={handleBlur}
//             onKeyDown={handleKeyDown}
//           />
//           <button
//             className="qty-btn"
//             onClick={() => onUpdateQty(item.id, 'inc')}
//             disabled={item.qty >= stock}
//           >
//             +
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const OrderCartPage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';

//   const products = useSelector(state => state.products.list);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [cart, setCart] = useState([]);
//   const [priceType, setPriceType] = useState('retailerPrice');
//   const hasInitialized = useRef(false);

//   // Extract unique categories from products
//   const categories = useMemo(() => {
//     if (!products.length) return [];
//     const cats = new Set();
//     products.forEach(product => {
//       const category = getStr(product, 'category');
//       if (category) cats.add(category);
//     });
//     return Array.from(cats).sort();
//   }, [products]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         await dispatch(fetchProducts());
//       } catch (error) {
//         console.error('Failed to load data:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadData();
//   }, [dispatch]);

//   // Compute available stock directly from product moq
//   const stockDataMap = useMemo(() => {
//     if (!products.length) return new Map();

//     const stockMap = new Map();
//     products.forEach(product => {
//       const id = getId(product._id);
//       const moq = getNum(product, 'moq', 0);
//       const category = getStr(product, 'category');

//       stockMap.set(id, {
//         id,
//         name: getStr(product, 'name'),
//         sku: getStr(product, 'sku'),
//         category: category,
//         retailerPrice: getNum(product, 'retailerPrice'),
//         distributorPrice: getNum(product, 'distributorPrice'),
//         walkinPrice: getNum(product, 'walkinPrice'),
//         mrp: getNum(product, 'mrp'),
//         image: product.image ?? null,
//         availableStock: moq,
//       });
//     });

//     return stockMap;
//   }, [products]);

//   // Build cart from stockDataMap (only once) - preserving product order as received from API
//   useEffect(() => {
//     if (!stockDataMap.size) return;
//     if (hasInitialized.current) return;

//     const newCart = Array.from(stockDataMap.values()).map(item => ({
//       id: item.id,
//       name: item.name,
//       sku: item.sku,
//       category: item.category,
//       retailerPrice: item.retailerPrice,
//       distributorPrice: item.distributorPrice,
//       walkinPrice: item.walkinPrice,
//       mrp: item.mrp,
//       image: item.image,
//       currentStock: item.availableStock,
//       qty: 0,
//       // Add timestamp to track when item was added to cart (for ordering)
//       addedToCartAt: null
//     }));
//     setCart(newCart);
//     hasInitialized.current = true;
//   }, [stockDataMap]);

//   const updateQty = useCallback((id, type) => {
//     setCart(prev => {
//       const index = prev.findIndex(item => item.id === id);
//       if (index === -1) return prev;
//       const oldItem = prev[index];
//       let newQty = oldItem.qty;
//       if (type === 'inc') newQty++;
//       if (type === 'dec') newQty--;
//       newQty = Math.max(0, Math.min(newQty, oldItem.currentStock));
//       if (newQty === oldItem.qty) return prev;
//       const newItem = { ...oldItem, qty: newQty };
      
//       // If we're adding an item (quantity goes from 0 to >0), record the timestamp
//       if (oldItem.qty === 0 && newQty > 0) {
//         newItem.addedToCartAt = Date.now();
//       }
//       // If we're removing an item (quantity goes from >0 to 0), clear the timestamp
//       if (oldItem.qty > 0 && newQty === 0) {
//         newItem.addedToCartAt = null;
//       }
      
//       const newCart = [...prev];
//       newCart[index] = newItem;
//       return newCart;
//     });
//   }, []);

//   const updateQtyDirect = useCallback((id, newQty) => {
//     setCart(prev => {
//       const index = prev.findIndex(item => item.id === id);
//       if (index === -1) return prev;
//       const oldItem = prev[index];
//       const clampedQty = Math.max(0, Math.min(newQty, oldItem.currentStock));
//       if (clampedQty === oldItem.qty) return prev;
//       const newItem = { ...oldItem, qty: clampedQty };
      
//       // If we're adding an item (quantity goes from 0 to >0), record the timestamp
//       if (oldItem.qty === 0 && clampedQty > 0) {
//         newItem.addedToCartAt = Date.now();
//       }
//       // If we're removing an item (quantity goes from >0 to 0), clear the timestamp
//       if (oldItem.qty > 0 && clampedQty === 0) {
//         newItem.addedToCartAt = null;
//       }
      
//       const newCart = [...prev];
//       newCart[index] = newItem;
//       return newCart;
//     });
//   }, []);

//   // Filter and sort: selected items first (by addition order), then by name for non-selected
//   const filteredAndSortedCart = useMemo(() => {
//     const query = searchQuery.trim().toLowerCase();
    
//     let filtered = cart;
    
//     // Apply search filter
//     if (query) {
//       filtered = filtered.filter(item =>
//         item.name.toLowerCase().includes(query) ||
//         item.sku.toLowerCase().includes(query)
//       );
//     }
    
//     // Apply category filter
//     if (selectedCategory) {
//       filtered = filtered.filter(item => item.category === selectedCategory);
//     }
    
//     // Sort: selected items (qty > 0) by when they were added (oldest first), then unselected by name
//     return [...filtered].sort((a, b) => {
//       // Both selected - sort by addition time (oldest first)
//       if (a.qty > 0 && b.qty > 0) {
//         const timeA = a.addedToCartAt || 0;
//         const timeB = b.addedToCartAt || 0;
//         return timeA - timeB;
//       }
//       // Selected items come before unselected
//       if (a.qty > 0 && b.qty === 0) return -1;
//       if (a.qty === 0 && b.qty > 0) return 1;
//       // Both unselected - sort by name
//       return a.name.localeCompare(b.name);
//     });
//   }, [cart, searchQuery, selectedCategory]);

//   // Get items with quantity > 0, maintaining the order they were added
//   const cartItems = useMemo(() => {
//     // Filter items with quantity > 0 and sort by when they were added (oldest first)
//     const selected = cart.filter(item => item.qty > 0);
//     return [...selected].sort((a, b) => {
//       const timeA = a.addedToCartAt || 0;
//       const timeB = b.addedToCartAt || 0;
//       return timeA - timeB;
//     });
//   }, [cart]);

//   const totalItems = useMemo(() =>
//     cartItems.reduce((sum, item) => sum + item.qty, 0),
//     [cartItems]
//   );

//   const totalAmount = useMemo(() =>
//     cartItems.reduce((sum, item) => sum + (item[priceType] || 0) * item.qty, 0),
//     [cartItems, priceType]
//   );

//   const handlePlaceOrder = () => {
//     if (cartItems.length === 0) {
//       alert('Please add at least one item to your order.');
//       return;
//     }
    
//     // IMPORTANT: cartItems is already sorted by addition time (oldest first)
//     // This preserves the order in which items were added to the cart
//     const orderedItems = cartItems.map(item => ({
//       id: item.id,
//       name: item.name,
//       qty: item.qty,
//       price: item[priceType] || 0,
//     }));
    
//     // Log for debugging (optional - remove in production)
//     console.log('Order items in sequence (by addition order):', orderedItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.qty})`));
    
//     navigate('/order-success', {
//       state: {
//         cartItems: orderedItems, // This maintains the order items were added
//         grandTotal: totalAmount,
//         paymentMode: 'cash',
//         date: new Date().toISOString(),
//       }
//     });
//   };

//   const clearCategoryFilter = () => {
//     setSelectedCategory('');
//   };

//   if (isLoading) {
//     return (
//       <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
//         <LoadingSpinner message="Loading products..." />
//       </div>
//     );
//   }

//   return (
//     <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
//       {/* Left: Product List */}
//       <div className="cart-main">
//         <div className="cart-header">
//           <h1>
//             My Cart
//             <span className="cart-count-badge">({totalItems})</span>
//           </h1>
//         </div>

//         <div className="search-section">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search by name or SKU…"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="search-input"
//             />
//             {searchQuery && (
//               <button onClick={() => setSearchQuery('')} className="search-clear">
//                 <X size={16} />
//               </button>
//             )}
//           </div>
          
//           {/* Category Filter */}
//           {categories.length > 0 && (
//             <div className="category-filter-section">
//               <div className="filter-wrapper">
//                 <Filter size={16} className="filter-icon" />
//                 <select
//                   value={selectedCategory}
//                   onChange={(e) => setSelectedCategory(e.target.value)}
//                   className="category-select"
//                 >
//                   <option value="">All Categories</option>
//                   {categories.map(cat => (
//                     <option key={cat} value={cat}>{cat}</option>
//                   ))}
//                 </select>
//                 {selectedCategory && (
//                   <button onClick={clearCategoryFilter} className="filter-clear">
//                     <X size={14} />
//                   </button>
//                 )}
//               </div>
//             </div>
//           )}
          
//           {searchQuery && (
//             <div className="result-count">
//               {filteredAndSortedCart.length} result{filteredAndSortedCart.length !== 1 ? 's' : ''} found
//             </div>
//           )}
          
//           <PriceTypeSelector priceType={priceType} onSelectPriceType={setPriceType} />
//         </div>

//         <div className="product-grid">
//           {filteredAndSortedCart.map(product => (
//             <ProductRow
//               key={product.id}
//               item={product}
//               onUpdateQty={updateQty}
//               onQtyInputChange={updateQtyDirect}
//               price={product[priceType] || 0}
//             />
//           ))}
//         </div>

//         {filteredAndSortedCart.length === 0 && (
//           <div className="empty-state">
//             <Package size={48} />
//             <p>
//               {selectedCategory 
//                 ? `No products found in "${selectedCategory}" category${searchQuery ? ` matching "${searchQuery}"` : ''}`
//                 : searchQuery 
//                   ? `No products match "${searchQuery}"`
//                   : 'No products available'}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Right: Order Summary Panel */}
//       <div className="order-summary-panel">
//         <div className="summary-header">
//           <ShoppingCart size={20} />
//           <span>Order Summary</span>
//         </div>

//         <div className="summary-scrollable">
//           {cartItems.length === 0 ? (
//             <div className="summary-empty">No items added yet</div>
//           ) : (
//             cartItems.map((item, idx) => (
//               <div className="summary-item" key={item.id}>
//                 <div className="summary-item-name">
//                   <span className="item-order-number">{idx + 1}.</span> {item.name}
//                 </div>
//                 <div className="summary-item-right">
//                   <span className="summary-item-qty">×{item.qty}</span>
//                   <span className="summary-item-price">
//                     ₹{((item[priceType] || 0) * item.qty).toLocaleString('en-IN')}
//                   </span>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         <div className="summary-divider" />

//         <div className="summary-row subtotal">
//           <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
//           <span>₹{totalAmount.toLocaleString('en-IN')}</span>
//         </div>

//         <div className="summary-divider" />

//         <div className="summary-row grand-total">
//           <span>Total</span>
//           <span>₹{totalAmount.toLocaleString('en-IN')}</span>
//         </div>

//         <button
//           className="place-order-btn"
//           onClick={handlePlaceOrder}
//           disabled={cartItems.length === 0}
//         >
//           PLACE ORDER
//         </button>
//       </div>
//     </div>
//   );
// };

// export default OrderCartPage;
