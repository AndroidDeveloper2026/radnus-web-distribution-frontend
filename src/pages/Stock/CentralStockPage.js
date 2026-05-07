// src/pages/Stock/CentralStockPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import { useTheme } from '../../context/ThemeContext';
import './CentralStockPage.css';

import {
  Package,
  TrendingUp,
  TrendingDown,
  Boxes,
  BarChart3,
  Calendar,
  Clock,
  CalendarDays,
  RefreshCw,
  Loader,
} from 'lucide-react';

// Helper functions (unchanged)
const formatValue = (num) => {
  const value = Number(num);
  if (isNaN(value) || value === undefined) return '₹0';
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(2)}`;
};

const parseDate = (dateValue) => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return !isNaN(parsed) ? parsed : new Date();
  }
  if (typeof dateValue === 'object' && dateValue.$date) {
    const parsed = new Date(dateValue.$date);
    return !isNaN(parsed) ? parsed : new Date();
  }
  return new Date();
};

const getNum = (obj, key, fallback = 0) => {
  if (obj?.[key] !== undefined && obj[key] !== null) {
    const val = Number(obj[key]);
    if (!isNaN(val)) return val;
  }
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj[spacedKey] !== null) {
    const val = Number(obj[spacedKey]);
    if (!isNaN(val)) return val;
  }
  return fallback;
};

const getStr = (obj, key, fallback = '') => {
  if (obj?.[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj[spacedKey] !== null) return String(obj[spacedKey]).trim();
  return fallback;
};

const getId = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  return obj._id || obj.id;
};

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const isThisWeek = (date) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
};

const isThisMonth = (date) => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const filterByTimeRange = (data, timeFilter) => {
  if (timeFilter === 'all') return data;
  const now = new Date();
  return data.filter(item => {
    const itemDate = item._createdAt;
    if (!itemDate || isNaN(itemDate.getTime())) return false;
    if (timeFilter === 'day') return isSameDay(itemDate, now);
    if (timeFilter === 'week') return isThisWeek(itemDate);
    if (timeFilter === 'month') return isThisMonth(itemDate);
    return true;
  });
};

const STATUS_STYLE = {
  IN_STOCK: { bg: '#E8F5E9', text: '#2E7D32' },
  LOW_STOCK: { bg: '#FFF3E0', text: '#E65100' },
  OUT_OF_STOCK: { bg: '#FFEBEE', text: '#C62828' },
};

const getStockStatus = (currentStock, moq) => {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock < (moq || 0)) return 'LOW_STOCK';
  return 'IN_STOCK';
};

const CentralStockPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState('OVERVIEW');
  const [timeFilter, setTimeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { list: products = [], loading: productsLoading } = useSelector(state => state.products) || {};
  const { data: invoices = [], loading: invoicesLoading } = useSelector(state => state.invoice) || {};

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchProducts()),
      dispatch(fetchInvoices({ filter: 'all' })),
    ]);
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ✅ FIX: Use moq as current stock – no subtraction of invoices
  const stockMap = useMemo(() => {
    if (!products.length) return {};

    const stock = {};
    products.forEach(product => {
      const pid = getId(product._id);
      stock[pid] = {
        ...product,
        currentStock: Math.max(0, getNum(product, 'moq', 0)), // moq is the live stock
        totalOutward: 0, // not used anymore but kept for consistency
        walkinPrice: getNum(product, 'walkinPrice'),
        moq: getNum(product, 'moq'),
        name: getStr(product, 'name'),
        sku: getStr(product, 'sku'),
        rackNo: getStr(product, 'rackNo'),
        batchNo: getStr(product, 'batchNo'),
      };
    });

    // No subtraction of invoice items – backend already reduced moq
    return stock;
  }, [products]); // ✅ No invoices dependency

  // Overview data (product list with current stock)
  const overviewData = useMemo(() => {
    return Object.values(stockMap).map(item => ({
      id: getId(item._id),
      name: item.name,
      sku: item.sku,
      qty: item.currentStock,
      walkinPrice: item.walkinPrice,
      moq: item.moq,
      rackNo: item.rackNo,
      batchNo: item.batchNo,
    }));
  }, [stockMap]);

  // Inward transactions – unchanged (product creation events)
  const inwardData = useMemo(() => {
    if (!products.length) return [];
    return products
      .map(product => {
        const createdAt = parseDate(product.createdAt);
        const qty = getNum(product, 'moq'); // initial stock added
        const price = getNum(product, 'walkinPrice');
        return {
          id: `inward_${getId(product._id)}`,
          type: 'INWARD',
          name: getStr(product, 'name'),
          sku: getStr(product, 'sku'),
          qty,
          price,
          date: createdAt.toLocaleDateString(),
          time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Product added to stock',
          totalValue: qty * price,
          _createdAt: createdAt,
        };
      })
      .sort((a, b) => b._createdAt - a._createdAt);
  }, [products]);

  // Outward transactions – unchanged (invoice events)
  const outwardData = useMemo(() => {
    if (!invoices.length) return [];
    const outward = [];
    invoices.forEach(invoice => {
      const invDate = parseDate(invoice.createdAt);
      (invoice.items || []).forEach(item => {
        outward.push({
          id: `outward_${getId(invoice._id)}_${getId(item.productId)}`,
          type: 'OUTWARD',
          name: getStr(item, 'name', 'N/A'),
          sku: getStr(item, 'sku', 'N/A'),
          qty: getNum(item, 'qty'),
          price: getNum(item, 'price'),
          date: invDate.toLocaleDateString(),
          time: invDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          invoiceNumber: getStr(invoice, 'invoiceNumber', 'N/A'),
          paymentMode: getStr(invoice, 'paymentMode', 'N/A'),
          note: `Invoice: ${getStr(invoice, 'invoiceNumber', 'N/A')} | Payment: ${getStr(invoice, 'paymentMode', 'N/A')}`,
          totalValue: getNum(item, 'qty') * getNum(item, 'price'),
          _createdAt: invDate,
        });
      });
    });
    return outward.sort((a, b) => b._createdAt - a._createdAt);
  }, [invoices]);

  const filteredInward = useMemo(() => filterByTimeRange(inwardData, timeFilter), [inwardData, timeFilter]);
  const filteredOutward = useMemo(() => filterByTimeRange(outwardData, timeFilter), [outwardData, timeFilter]);

  const totalValue = useMemo(() => {
    return overviewData.reduce((sum, item) => {
      const val = (item.qty || 0) * (item.walkinPrice || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [overviewData]);

  const summaryStats = useMemo(
    () => ({
      totalProducts: overviewData.length,
      totalUnits: overviewData.reduce((s, i) => s + (i.qty || 0), 0),
      totalSold: outwardData.reduce((s, i) => s + (i.qty || 0), 0),
      totalAdded: inwardData.reduce((s, i) => s + (i.qty || 0), 0),
    }),
    [overviewData, outwardData, inwardData]
  );

  const loading = productsLoading || invoicesLoading;

  if (loading) {
    return (
      <div className={`central-stock-page ${isDark ? 'dark' : ''}`}>
        <div className="stock-loading">
          <Loader className="spin" size={40} />
          <p>Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`central-stock-page ${isDark ? 'dark' : ''}`}>
      <div className="stock-header">
        <h1>Central Stock</h1>
        <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        {['OVERVIEW', 'INWARD', 'OUTWARD'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t);
              setTimeFilter('all');
            }}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Time filter (only for history tabs) */}
      {(tab === 'INWARD' || tab === 'OUTWARD') && (
        <div className="time-filters">
          {[
            { key: 'all', label: 'All', icon: Calendar },
            { key: 'day', label: 'Day', icon: Clock },
            { key: 'week', label: 'Week', icon: CalendarDays },
            { key: 'month', label: 'Month', icon: Calendar },
          ].map(filter => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.key}
                className={`time-filter-btn ${timeFilter === filter.key ? 'active' : ''}`}
                onClick={() => setTimeFilter(filter.key)}
              >
                <Icon size={14} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'OVERVIEW' && (
        <>
          <div className="total-card">
            <div className="total-value">{formatValue(totalValue)}</div>
            <div className="total-label">Total Stock Value (Walkin Price)</div>
            <div className="summary-row">
              <div className="summary-item">
                <Boxes size={16} />
                <span>Products</span>
                <strong>{summaryStats.totalProducts}</strong>
              </div>
              <div className="summary-item">
                <BarChart3 size={16} />
                <span>Units</span>
                <strong>{summaryStats.totalUnits}</strong>
              </div>
              <div className="summary-item">
                <TrendingDown size={16} />
                <span>Sold</span>
                <strong>{summaryStats.totalSold}</strong>
              </div>
              <div className="summary-item">
                <TrendingUp size={16} />
                <span>Added</span>
                <strong>{summaryStats.totalAdded}</strong>
              </div>
            </div>
          </div>

          <div className="stock-grid">
            {overviewData.map(product => {
              const status = getStockStatus(product.qty, product.moq);
              const statusStyle = STATUS_STYLE[status];
              return (
                <div key={product.id} className="stock-card">
                  <div className="card-header-row">
                    <div className="icon-circle">
                      <Package size={20} color="#D32F2F" />
                    </div>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-sku">SKU: {product.sku}</div>
                      {product.rackNo && <div className="product-sku">Rack: {product.rackNo}</div>}
                    </div>
                    <div className="status-badge" style={{ backgroundColor: statusStyle.bg }}>
                      <span style={{ color: statusStyle.text }}>{status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="card-details">
                    <div className="detail-row">
                      <span>Current Stock:</span>
                      <strong>{product.qty} units</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total Stock Value:</span>
                      <strong>{formatValue((product.qty || 0) * (product.walkinPrice || 0))}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Price/Unit:</span>
                      <strong>{formatValue(product.walkinPrice)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {overviewData.length === 0 && <div className="empty-state">No products found</div>}
        </>
      )}

      {/* Inward Tab */}
      {tab === 'INWARD' && (
        <div className="history-list">
          {filteredInward.map(item => (
            <div key={item.id} className="history-card">
              <div className="history-header">
                <TrendingUp size={20} color="#2E7D32" />
                <div className="history-info">
                  <div className="history-name">{item.name}</div>
                  <div className="history-meta">
                    Stock Added • {item.date} at {item.time}
                  </div>
                  <div className="history-note">{item.note}</div>
                </div>
                <div className="history-stats">
                  <div className="history-qty inward">+{item.qty} units</div>
                  <div className="history-price">{formatValue(item.price)}/unit</div>
                  <div className="history-total">Total: {formatValue(item.totalValue)}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredInward.length === 0 && (
            <div className="empty-state">
              <p>{timeFilter === 'all' ? 'No inward records yet' : `No records for ${timeFilter}`}</p>
              <small>
                {timeFilter === 'all'
                  ? 'When you add new products, they will appear here'
                  : 'Try changing the time filter to see more records'}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Outward Tab */}
      {tab === 'OUTWARD' && (
        <div className="history-list">
          {filteredOutward.map(item => (
            <div key={item.id} className="history-card">
              <div className="history-header">
                <TrendingDown size={20} color="#D32F2F" />
                <div className="history-info">
                  <div className="history-name">{item.name}</div>
                  <div className="history-meta">
                    Stock Removed • {item.date} at {item.time}
                  </div>
                  <div className="history-note">{item.note}</div>
                  {item.invoiceNumber && item.invoiceNumber !== 'N/A' && (
                    <div className="history-meta">Invoice: {item.invoiceNumber}</div>
                  )}
                  {item.paymentMode && item.paymentMode !== 'N/A' && (
                    <div className="history-meta">Payment: {item.paymentMode}</div>
                  )}
                </div>
                <div className="history-stats">
                  <div className="history-qty outward">-{item.qty} units</div>
                  <div className="history-price">{formatValue(item.price)}/unit</div>
                  <div className="history-total">Total: {formatValue(item.totalValue)}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredOutward.length === 0 && (
            <div className="empty-state">
              <p>{timeFilter === 'all' ? 'No outward records yet' : `No records for ${timeFilter}`}</p>
              <small>
                {timeFilter === 'all'
                  ? 'When you create invoices and sell products, they will appear here'
                  : 'Try changing the time filter to see more records'}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CentralStockPage;