// src/pages/Invoices/InvoiceListPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import { useTheme } from '../../context/ThemeContext';
import './InvoiceListPage.css';

import {
  Calendar,
  User,
  Hash,
  CreditCard,
  RefreshCw,
  Search,
  X,
  Loader,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Award,
  Wallet,
  Building2,
} from 'lucide-react';

// Helper: date filters
const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isThisWeek = (date) => {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return date >= weekStart;
};

const isThisMonth = (date) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return date >= monthStart;
};

// Helper: format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Memoized Invoice Card
const InvoiceCard = React.memo(({ invoice, onClick, searchTerm }) => {
  const highlightMatch = (text) => {
    if (!searchTerm || !text) return text;
    const searchLower = searchTerm.toLowerCase().trim();
    const textLower = text.toLowerCase();
    if (!textLower.includes(searchLower)) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchLower 
        ? <mark key={i} className="highlight-match">{part}</mark> 
        : part
    );
  };

  const date = new Date(invoice.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const getPaymentInfo = (mode) => {
    const modes = {
      'cash': { icon: Wallet, color: '#2E7D32', bg: '#E8F5E9' },
      'card': { icon: CreditCard, color: '#1565C0', bg: '#E3F2FD' },
      'upi': { icon: CreditCard, color: '#6A1B9A', bg: '#F3E5F5' },
      'bank transfer': { icon: Building2, color: '#E65100', bg: '#FFF3E0' },
      'credit': { icon: CreditCard, color: '#C62828', bg: '#FFEBEE' },
    };
    const result = modes[mode?.toLowerCase()] || { icon: Wallet, color: '#37474F', bg: '#ECEFF1' };
    return result;
  };

  const paymentInfo = getPaymentInfo(invoice.paymentMode);
  const PaymentIcon = paymentInfo.icon;

  return (
    <div className="invoice-card" onClick={() => onClick(invoice)}>
      <div className="card-header-top">
        <div className="card-header-left">
          <span className="invoice-number-badge">
            <Hash size={14} />
            {highlightMatch(invoice.invoiceNumber)}
          </span>
          <span className="invoice-date">
            <Calendar size={14} />
            {formattedDate}
          </span>
        </div>
        <span className="invoice-amount">
          {formatCurrency(invoice.totalAmount)}
        </span>
      </div>

      <div className="card-body">
        <div className="customer-info">
          <div className="customer-avatar">
            <User size={20} />
          </div>
          <div className="customer-details">
            <div className="customer-name">
              {highlightMatch(invoice.customerName)}
            </div>
            {invoice.shopName && (
              <div className="shop-name">
                {highlightMatch(invoice.shopName)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="payment-badge" style={{ 
          backgroundColor: paymentInfo.bg,
          color: paymentInfo.color 
        }}>
          <PaymentIcon size={14} />
          <span>{invoice.paymentMode?.toUpperCase() || 'N/A'}</span>
        </div>
        <div className="biller-info">
          <span className="biller-label">By</span>
          <span className="biller-name">{highlightMatch(invoice.billerName)}</span>
        </div>
      </div>
    </div>
  );
});

const InvoiceListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { user } = useSelector((state) => state.auth || { user: null });
  const billerName = user?.name || user?.fullName || '';
  const isAdmin = user?.role === 'Admin';

  const { data: invoices = [], loading, error } = useSelector((state) => state.invoice);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    dispatch(fetchInvoices({ filter: 'all', billerName: isAdmin ? '' : billerName }));
  }, [dispatch, isAdmin, billerName]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchInvoices({ filter: 'all', billerName: isAdmin ? '' : billerName }));
    setRefreshing(false);
  }, [dispatch, isAdmin, billerName]);

  // Filter by date
  const filteredByDate = useMemo(() => {
    if (tab === 'all') return invoices;
    return invoices.filter(inv => {
      const date = new Date(inv.createdAt);
      if (tab === 'today') return isToday(date);
      if (tab === 'week') return isThisWeek(date);
      if (tab === 'month') return isThisMonth(date);
      return true;
    });
  }, [invoices, tab]);

  // Apply search and sort - Create a copy before sorting
  const filteredData = useMemo(() => {
    let result = filteredByDate.slice();
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((inv) => {
        const searchableFields = [
          inv.billerName,
          inv.customerName,
          inv.shopName,
          inv.invoiceNumber,
          inv.paymentMode,
          inv.salesperson,
          inv.referenceNo,
          inv.customerPhone,
          inv.customerCity,
          inv.customerState,
          String(inv.totalAmount),
          inv.customerAddress,
          inv.shippingAddress?.name,
          inv.shippingAddress?.city,
          inv.shippingAddress?.state,
          inv.shippingAddress?.phone,
          inv.orderType,
        ];
        
        return searchableFields.some(field => 
          field?.toLowerCase().includes(q)
        );
      });
    }
    
    // Apply sorting on the copy
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'amount') {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'customer') {
      result.sort((a, b) => (a.customerName || '').localeCompare(b.customerName || ''));
    }
    
    return result;
  }, [filteredByDate, search, sortBy]);

  // Counts per tab
  const counts = useMemo(() => {
    const all = invoices.length;
    const today = invoices.filter(i => isToday(new Date(i.createdAt))).length;
    const week = invoices.filter(i => isThisWeek(new Date(i.createdAt))).length;
    const month = invoices.filter(i => isThisMonth(new Date(i.createdAt))).length;
    return { all, today, week, month };
  }, [invoices]);

  const handleInvoiceClick = (invoice) => {
    navigate(`/invoices/${invoice._id}`, { state: { invoice } });
  };

  const clearSearch = () => {
    setSearch('');
  };

  const getTabIcon = (tabName) => {
    const icons = {
      'all': <TrendingUp size={16} />,
      'today': <Clock size={16} />,
      'week': <Calendar size={16} />,
      'month': <Award size={16} />
    };
    return icons[tabName] || null;
  };

  if (error && invoices.length === 0) {
    return (
      <div className={`invoice-page ${isDark ? 'dark' : ''}`}>
        <div className="error-state">
          <RefreshCw size={48} />
          <h3>Error loading invoices</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-retry">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`invoice-page ${isDark ? 'dark' : ''}`}>
      <div className="page-header">
        <div className="header-left">
          <h1>Invoice History</h1>
          <span className="invoice-count">{invoices.length} total</span>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={18} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="search-filters-section">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer, invoice, amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button onClick={clearSearch} className="search-clear">
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="sort-wrapper">
          <ArrowUpDown size={18} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="customer">Sort by Customer</option>
          </select>
        </div>
      </div>

      {search && (
        <div className="search-results-info">
          Found <strong>{filteredData.length}</strong> {filteredData.length === 1 ? 'invoice' : 'invoices'} matching "<strong>{search}</strong>"
        </div>
      )}

      <div className="invoice-tabs">
        {['all', 'today', 'week', 'month'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {getTabIcon(t)}
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            <span className="tab-badge">{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading && invoices.length === 0 ? (
        <div className="loading-state">
          <Loader className="spin" size={40} />
          <p>Loading invoices...</p>
        </div>
      ) : (
        <>
          {filteredData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No invoices found</h3>
              <p>
                {search 
                  ? `No results found for "${search}"` 
                  : 'No invoices available'}
              </p>
              {search && (
                <button onClick={clearSearch} className="btn-clear-search">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="invoice-grid">
              {filteredData.map(inv => (
                <InvoiceCard 
                  key={inv._id} 
                  invoice={inv} 
                  onClick={handleInvoiceClick}
                  searchTerm={search}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoiceListPage;