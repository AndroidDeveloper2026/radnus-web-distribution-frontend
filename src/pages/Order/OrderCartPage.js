import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/features/products/productSlice';
// ❌ No need to fetch invoices for stock calculation
// import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import { useTheme } from '../../context/ThemeContext';
import './OrderCartPage.css';

import { Search, X, Package, ShoppingCart } from 'lucide-react';

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

const ProductRow = ({ item, onUpdateQty, price }) => {
  const stock = item.currentStock || 0;

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
            <span className="product-price">₹{price.toLocaleString('en-IN')}</span>
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
          <span className="qty-value">{item.qty}</span>
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
  // ❌ No invoices selector needed
  // const invoices = useSelector(state => state.invoice.data);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [priceType, setPriceType] = useState('retailerPrice');
  const hasInitialized = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // ✅ Only fetch products – invoices are NOT needed for stock
        if (!products?.length) {
          await dispatch(fetchProducts());
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dispatch, products]);

  // ✅ No soldMap – we trust product.moq as the current stock

  useEffect(() => {
    if (!products?.length) return;
    if (hasInitialized.current) return;

    // ✅ Directly use product.moq as current stock (backend already reduced it)
    const newCart = products.map(p => {
      const currentStock = Math.max(0, Number(p.moq) || 0);
      return {
        id: p._id,
        name: p.name ?? 'Unnamed',
        sku: p.sku ?? '-',
        retailerPrice: Number(p.retailerPrice) || 0,
        distributorPrice: Number(p.distributorPrice) || 0,
        walkinPrice: Number(p.walkinPrice) || 0,
        mrp: Number(p.mrp) || 0,
        qty: 0,
        moq: currentStock,      // store current stock for reference (optional)
        currentStock: currentStock,
        image: p.image ?? null,
      };
    });
    setCart(newCart);
    hasInitialized.current = true;
  }, [products]); // ✅ No invoices dependency

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
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, []);

  const filteredCart = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cart;
    return cart.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)
    );
  }, [cart, searchQuery]);

  const cartItems = useMemo(() => cart.filter(item => item.qty > 0), [cart]);

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const totalAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item[priceType] || 0) * item.qty, 0),
    [cartItems, priceType]
  );

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }
    const orderedItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item[priceType] || 0,
    }));
    navigate('/order-success', {
      state: {
        cartItems: orderedItems,
        grandTotal: totalAmount,
        paymentMode: 'cash',
        date: new Date().toISOString(),
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
        <div className="loading-state">Loading products...</div>
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
          {searchQuery && (
            <div className="result-count">
              {filteredCart.length} result{filteredCart.length !== 1 ? 's' : ''} found
            </div>
          )}
          <PriceTypeSelector priceType={priceType} onSelectPriceType={setPriceType} />
        </div>

        <div className="product-grid">
          {filteredCart.map(product => (
            <ProductRow
              key={product.id}
              item={product}
              onUpdateQty={updateQty}
              price={product[priceType] || 0}
            />
          ))}
        </div>

        {filteredCart.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>No products match "{searchQuery}"</p>
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
            cartItems.map(item => (
              <div className="summary-item" key={item.id}>
                <div className="summary-item-name">{item.name}</div>
                <div className="summary-item-right">
                  <span className="summary-item-qty">×{item.qty}</span>
                  <span className="summary-item-price">
                    ₹{((item[priceType] || 0) * item.qty).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
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