// src/pages/StockMovement/StockMovement.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CalendarDays,
  RefreshCw,
  Loader,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  FileText,
  Users,
  UserCheck,
  CreditCard,
  Tag,
  Box,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './StockMovement.css';

const formatValue = (num) => {
  const value = Number(num);
  if (isNaN(value) || value === undefined) return '₹0';
  return `₹${value.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
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

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const getNum = (obj, key, fallback = 0) => {
  if (obj?.[key] !== undefined && obj[key] !== null) {
    const val = Number(obj[key]);
    if (!isNaN(val)) return val;
  }
  return fallback;
};

const getStr = (obj, key, fallback = '') => {
  if (obj?.[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
  return fallback;
};

const getId = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  return obj._id || obj.id;
};

const StockMovement = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('INWARD');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');

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

  // ============================================
  // INWARD DATA - Sorted OLDEST FIRST
  // ============================================
  const inwardData = useMemo(() => {
    if (!products.length) return [];
    return products
      .map(product => {
        const createdAt = parseDate(product.createdAt);
        const qty = getNum(product, 'moq', 0);
        const price = getNum(product, 'walkinPrice', 0);
        return {
          id: `inward_${getId(product._id)}`,
          type: 'INWARD',
          name: getStr(product, 'name'),
          sku: getStr(product, 'sku'),
          qty,
          price,
          date: createdAt,
          dateStr: formatDate(createdAt),
          time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Product added to stock',
          totalValue: qty * price,
          category: getStr(product, 'category'),
          rackNo: getStr(product, 'rackNo'),
          batchNo: getStr(product, 'batchNo'),
        };
      })
      // 🔥 OLDEST FIRST (ascending)
      .sort((a, b) => a.date - b.date);
  }, [products]);

  // ============================================
  // OUTWARD DATA - Sorted OLDEST FIRST
  // ============================================
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
          date: invDate,
          dateStr: formatDate(invDate),
          time: invDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          invoiceNumber: getStr(invoice, 'invoiceNumber', 'N/A'),
          customerName: getStr(invoice, 'customerName', 'N/A'),
          paymentMode: getStr(invoice, 'paymentMode', 'N/A'),
          salesperson: getStr(invoice, 'salesperson', 'N/A'),
          note: `Invoice: ${getStr(invoice, 'invoiceNumber', 'N/A')}`,
          totalValue: getNum(item, 'qty') * getNum(item, 'price'),
        });
      });
    });
    // 🔥 OLDEST FIRST (ascending)
    return outward.sort((a, b) => a.date - b.date);
  }, [invoices]);

  // Date filtering logic
  const getDateRangeFromPeriod = (period) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch(period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return null;
    }
    return { fromDate: start, toDate: end };
  };

  const filterByDateRange = (data) => {
    let fromDate = null;
    let toDate = null;

    if (periodFilter === 'custom') {
      fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : null;
      toDate = dateRange.toDate ? new Date(dateRange.toDate) : null;
      if (toDate) toDate.setHours(23, 59, 59, 999);
    } else if (periodFilter !== 'all') {
      const range = getDateRangeFromPeriod(periodFilter);
      if (range) {
        fromDate = range.fromDate;
        toDate = range.toDate;
      }
    }

    if (!fromDate && !toDate) return data;

    return data.filter(item => {
      const itemDate = new Date(item.date);
      if (isNaN(itemDate)) return true;
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  };

  const filterBySearch = (data) => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.name?.toLowerCase().includes(term) ||
      item.sku?.toLowerCase().includes(term) ||
      (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(term)) ||
      (item.customerName && item.customerName.toLowerCase().includes(term)) ||
      (item.salesperson && item.salesperson.toLowerCase().includes(term))
    );
  };

  const filterByDateGroup = (data, selectedDateStr) => {
    if (!selectedDateStr) return data;
    return data.filter(item => item.dateStr === selectedDateStr);
  };

  const filteredInward = useMemo(() => {
    let data = [...inwardData];
    data = filterByDateRange(data);
    data = filterBySearch(data);
    if (selectedDate) {
      data = filterByDateGroup(data, selectedDate);
    }
    return data;
  }, [inwardData, periodFilter, dateRange, searchTerm, selectedDate]);

  const filteredOutward = useMemo(() => {
    let data = [...outwardData];
    data = filterByDateRange(data);
    data = filterBySearch(data);
    if (selectedDate) {
      data = filterByDateGroup(data, selectedDate);
    }
    return data;
  }, [outwardData, periodFilter, dateRange, searchTerm, selectedDate]);

  // Group data by date for day-wise view (preserves order within groups)
  const groupedInward = useMemo(() => {
    const groups = {};
    filteredInward.forEach(item => {
      if (!groups[item.dateStr]) {
        groups[item.dateStr] = {
          date: item.dateStr,
          items: [],
          totalQty: 0,
          totalValue: 0
        };
      }
      groups[item.dateStr].items.push(item);
      groups[item.dateStr].totalQty += item.qty;
      groups[item.dateStr].totalValue += item.totalValue;
    });
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredInward]);

  const groupedOutward = useMemo(() => {
    const groups = {};
    filteredOutward.forEach(item => {
      if (!groups[item.dateStr]) {
        groups[item.dateStr] = {
          date: item.dateStr,
          items: [],
          totalQty: 0,
          totalValue: 0
        };
      }
      groups[item.dateStr].items.push(item);
      groups[item.dateStr].totalQty += item.qty;
      groups[item.dateStr].totalValue += item.totalValue;
    });
    return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredOutward]);

  const currentData = activeTab === 'INWARD' ? groupedInward : groupedOutward;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalQty = currentData.reduce((sum, group) => sum + group.totalQty, 0);
  const totalValue = currentData.reduce((sum, group) => sum + group.totalValue, 0);

  const getUniqueDates = () => {
    const dates = new Set();
    [...inwardData, ...outwardData].forEach(item => {
      dates.add(item.dateStr);
    });
    return Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(selectedDate === date ? null : date);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setPeriodFilter('all');
    setDateRange({ fromDate: '', toDate: '' });
    setShowDateFilter(false);
    setSearchTerm('');
    setSelectedDate(null);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = [];
    
    if (activeTab === 'INWARD') {
      groupedInward.forEach(group => {
        group.items.forEach(item => {
          exportData.push({
            'Date': item.dateStr,
            'Time': item.time,
            'Type': 'INWARD',
            'Product Name': item.name,
            'SKU': item.sku,
            'Quantity': item.qty,
            'Price/Unit': item.price,
            'Total Value': item.totalValue,
            'Category': item.category || '-',
            'Rack No': item.rackNo || '-',
            'Batch No': item.batchNo || '-',
            'Note': item.note
          });
        });
      });
    } else {
      groupedOutward.forEach(group => {
        group.items.forEach(item => {
          exportData.push({
            'Date': item.dateStr,
            'Time': item.time,
            'Type': 'OUTWARD',
            'Product Name': item.name,
            'SKU': item.sku,
            'Quantity': item.qty,
            'Price/Unit': item.price,
            'Total Value': item.totalValue,
            'Invoice Number': item.invoiceNumber,
            'Customer Name': item.customerName,
            'Salesperson': item.salesperson,
            'Payment Mode': item.paymentMode,
            'Note': item.note
          });
        });
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab}_Movement`);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Stock_Movement_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const loading = productsLoading || invoicesLoading;

  const periodOptions = [
    { value: 'all', label: 'All', icon: CalendarDays },
    { value: 'today', label: 'Today', icon: Calendar },
    { value: 'yesterday', label: 'Yesterday', icon: Calendar },
    { value: 'last7days', label: 'Last 7 Days', icon: CalendarDays },
    { value: 'thisWeek', label: 'This Week', icon: Calendar },
    { value: 'thisMonth', label: 'This Month', icon: Calendar },
    { value: 'lastMonth', label: 'Last Month', icon: Calendar },
    { value: 'custom', label: 'Custom', icon: Filter },
  ];

  if (loading) {
    return (
      <div className={`stock-movement-page ${isDark ? 'dark' : ''}`}>
        <div className="stock-movement-loading">
          <Loader className="spin" size={40} />
          <p>Loading stock movement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`stock-movement-page ${isDark ? 'dark' : ''}`}>
      <div className="stock-movement-container">
        {/* Header */}
        <div className="stock-movement-header">
          <div>
            <h1>Stock Movement</h1>
            <p>Track inward and outward stock movements day by day (oldest first)</p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="movement-tabs">
          <button
            className={`tab-btn ${activeTab === 'INWARD' ? 'active' : ''}`}
            onClick={() => { setActiveTab('INWARD'); setSelectedDate(null); setCurrentPage(1); }}
          >
            <TrendingUp size={16} />
            <span>Inward (Stock Added)</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'OUTWARD' ? 'active' : ''}`}
            onClick={() => { setActiveTab('OUTWARD'); setSelectedDate(null); setCurrentPage(1); }}
          >
            <TrendingDown size={16} />
            <span>Outward (Stock Sold)</span>
          </button>
        </div>

        {/* Search */}
        <div className="movement-search">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder={`Search by product name, SKU${activeTab === 'OUTWARD' ? ', invoice number, customer name, or salesperson' : ''}...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="filters-row">
          <div className="filter-group">
            <span className="filter-label"><Filter size={14} /> Date:</span>
            <div className="filter-options">
              {periodOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    className={`filter-option ${periodFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setPeriodFilter(option.value);
                      if (option.value === 'custom') {
                        setShowDateFilter(true);
                      } else {
                        setShowDateFilter(false);
                        setDateRange({ fromDate: '', toDate: '' });
                      }
                      setCurrentPage(1);
                    }}
                  >
                    <Icon size={12} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {(periodFilter !== 'all' || dateRange.fromDate || dateRange.toDate || searchTerm || selectedDate) && (
            <button className="clear-all-btn" onClick={resetFilters}>
              <X size={14} /> Clear All
            </button>
          )}
        </div>

        {/* Custom Date Range */}
        {showDateFilter && (
          <div className="custom-date-range">
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              placeholder="From Date"
            />
            <span>→</span>
            <input
              type="date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              placeholder="To Date"
            />
          </div>
        )}

        {/* Date Quick Select - sorted oldest first */}
        {getUniqueDates().length > 0 && (
          <div className="date-quick-select">
            <span className="quick-label">Quick Date:</span>
            <div className="date-chips">
              {getUniqueDates().slice(0, 8).map(date => (
                <button
                  key={date}
                  className={`date-chip ${selectedDate === date ? 'active' : ''}`}
                  onClick={() => handleDateSelect(date)}
                >
                  {date}
                </button>
              ))}
              {selectedDate && (
                <button className="clear-date-chip" onClick={() => setSelectedDate(null)}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="movement-summary">
          <div className="summary-card">
            <div className="summary-icon">
              {activeTab === 'INWARD' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div className="summary-content">
              <div className="summary-label">Total {activeTab === 'INWARD' ? 'Added' : 'Sold'}</div>
              <div className="summary-value">{totalQty.toLocaleString()} units</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <DollarSign size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Value</div>
              <div className="summary-value">{formatValue(totalValue)}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <Calendar size={20} />
            </div>
            <div className="summary-content">
              <div className="summary-label">Transaction Days</div>
              <div className="summary-value">{currentData.length} days</div>
            </div>
          </div>
        </div>

        {/* Movement List */}
        <div className="movement-list-container">
          {paginatedData.length > 0 ? (
            paginatedData.map(group => (
              <div key={group.date} className="movement-group">
                <div className="group-header">
                  <div className="group-date">
                    <Calendar size={16} />
                    <span>{group.date}</span>
                  </div>
                  <div className="group-stats">
                    <span className="group-qty">
                      <Box size={12} /> {group.totalQty} units
                    </span>
                    <span className="group-value">
                      <DollarSign size={12} /> {formatValue(group.totalValue)}
                    </span>
                  </div>
                </div>
                <div className="group-items">
                  {group.items.map((item, idx) => (
                    <div key={`${item.id}_${idx}`} className="movement-item">
                      <div className="item-icon">
                        {activeTab === 'INWARD' ? (
                          <div className="icon-inward">
                            <TrendingUp size={16} />
                          </div>
                        ) : (
                          <div className="icon-outward">
                            <TrendingDown size={16} />
                          </div>
                        )}
                      </div>
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                        <div className="item-info">
                          <span className="item-sku"><Tag size={10} /> {item.sku}</span>
                          {item.invoiceNumber && item.invoiceNumber !== 'N/A' && (
                            <span className="item-invoice"><FileText size={10} /> {item.invoiceNumber}</span>
                          )}
                          {item.customerName && item.customerName !== 'N/A' && (
                            <span className="item-customer"><Users size={10} /> {item.customerName}</span>
                          )}
                          {item.salesperson && item.salesperson !== 'N/A' && (
                            <span className="item-salesperson"><UserCheck size={10} /> {item.salesperson}</span>
                          )}
                          <span className="item-time"><Clock size={10} /> {item.time}</span>
                        </div>
                      </div>
                      <div className="item-quantity">
                        <div className={`qty-value ${activeTab === 'INWARD' ? 'positive' : 'negative'}`}>
                          {activeTab === 'INWARD' ? '+' : '-'}{item.qty}
                        </div>
                        <div className="item-price">{formatValue(item.price)}</div>
                        <div className="item-total">{formatValue(item.totalValue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Package size={48} strokeWidth={1.5} />
              <p>No {activeTab.toLowerCase()} records found</p>
              <small>
                {searchTerm || selectedDate || periodFilter !== 'all'
                  ? 'Try changing your filters to see more results'
                  : `When you ${activeTab === 'INWARD' ? 'add new products' : 'create invoices and sell products'}, they will appear here`}
              </small>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="movement-pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Export */}
        {currentData.length > 0 && (
          <div className="export-section">
            <button className="export-excel-btn" onClick={exportToExcel}>
              <Download size={16} />
              Export to Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockMovement;

//++++++++++++++++++++++++++++++++++++++++++++++
// // src/pages/StockMovement/StockMovement.js
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useTheme } from '../../context/ThemeContext';
// import { fetchProducts } from '../../services/features/products/productSlice';
// import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
// import {
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   Clock,
//   CalendarDays,
//   RefreshCw,
//   Loader,
//   Package,
//   Search,
//   ChevronLeft,
//   ChevronRight,
//   Download,
//   Filter,
//   X,
//   FileText,
//   Users,
//   UserCheck,
//   CreditCard,
//   Tag,
//   Box,
//   DollarSign
// } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import './StockMovement.css';

// const formatValue = (num) => {
//   const value = Number(num);
//   if (isNaN(value) || value === undefined) return '₹0';
//   return `₹${value.toLocaleString('en-IN', { 
//     minimumFractionDigits: 2, 
//     maximumFractionDigits: 2 
//   })}`;
// };

// const parseDate = (dateValue) => {
//   if (!dateValue) return new Date();
//   if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
//   if (typeof dateValue === 'string') {
//     const parsed = new Date(dateValue);
//     return !isNaN(parsed) ? parsed : new Date();
//   }
//   if (typeof dateValue === 'object' && dateValue.$date) {
//     const parsed = new Date(dateValue.$date);
//     return !isNaN(parsed) ? parsed : new Date();
//   }
//   return new Date();
// };

// const formatDate = (date) => {
//   const d = new Date(date);
//   return d.toLocaleDateString('en-IN', { 
//     day: '2-digit', 
//     month: 'short', 
//     year: 'numeric' 
//   });
// };

// const getNum = (obj, key, fallback = 0) => {
//   if (obj?.[key] !== undefined && obj[key] !== null) {
//     const val = Number(obj[key]);
//     if (!isNaN(val)) return val;
//   }
//   return fallback;
// };

// const getStr = (obj, key, fallback = '') => {
//   if (obj?.[key] !== undefined && obj[key] !== null) return String(obj[key]).trim();
//   return fallback;
// };

// const getId = (obj) => {
//   if (!obj) return '';
//   if (typeof obj === 'string') return obj;
//   if (obj.$oid) return obj.$oid;
//   return obj._id || obj.id;
// };

// const StockMovement = () => {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';

//   const [activeTab, setActiveTab] = useState('INWARD');
//   const [refreshing, setRefreshing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
//   const [showDateFilter, setShowDateFilter] = useState(false);
//   const [periodFilter, setPeriodFilter] = useState('all');

//   const { list: products = [], loading: productsLoading } = useSelector(state => state.products) || {};
//   const { data: invoices = [], loading: invoicesLoading } = useSelector(state => state.invoice) || {};

//   const loadData = useCallback(async () => {
//     await Promise.all([
//       dispatch(fetchProducts()),
//       dispatch(fetchInvoices({ filter: 'all' })),
//     ]);
//   }, [dispatch]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   };

//   // Prepare inward data from products
//   const inwardData = useMemo(() => {
//     if (!products.length) return [];
//     return products
//       .map(product => {
//         const createdAt = parseDate(product.createdAt);
//         const qty = getNum(product, 'moq', 0);
//         const price = getNum(product, 'walkinPrice', 0);
//         return {
//           id: `inward_${getId(product._id)}`,
//           type: 'INWARD',
//           name: getStr(product, 'name'),
//           sku: getStr(product, 'sku'),
//           qty,
//           price,
//           date: createdAt,
//           dateStr: formatDate(createdAt),
//           time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//           note: 'Product added to stock',
//           totalValue: qty * price,
//           category: getStr(product, 'category'),
//           rackNo: getStr(product, 'rackNo'),
//           batchNo: getStr(product, 'batchNo'),
//         };
//       })
//       .sort((a, b) => b.date - a.date);
//   }, [products]);

//   // Prepare outward data from invoices
//   const outwardData = useMemo(() => {
//     if (!invoices.length) return [];
//     const outward = [];
//     invoices.forEach(invoice => {
//       const invDate = parseDate(invoice.createdAt);
//       (invoice.items || []).forEach(item => {
//         outward.push({
//           id: `outward_${getId(invoice._id)}_${getId(item.productId)}`,
//           type: 'OUTWARD',
//           name: getStr(item, 'name', 'N/A'),
//           sku: getStr(item, 'sku', 'N/A'),
//           qty: getNum(item, 'qty'),
//           price: getNum(item, 'price'),
//           date: invDate,
//           dateStr: formatDate(invDate),
//           time: invDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//           invoiceNumber: getStr(invoice, 'invoiceNumber', 'N/A'),
//           customerName: getStr(invoice, 'customerName', 'N/A'),
//           paymentMode: getStr(invoice, 'paymentMode', 'N/A'),
//           salesperson: getStr(invoice, 'salesperson', 'N/A'),
//           note: `Invoice: ${getStr(invoice, 'invoiceNumber', 'N/A')}`,
//           totalValue: getNum(item, 'qty') * getNum(item, 'price'),
//         });
//       });
//     });
//     return outward.sort((a, b) => b.date - a.date);
//   }, [invoices]);

//   // Date filtering logic
//   const getDateRangeFromPeriod = (period) => {
//     const now = new Date();
//     const start = new Date();
//     const end = new Date();

//     switch(period) {
//       case 'today':
//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'yesterday':
//         start.setDate(now.getDate() - 1);
//         start.setHours(0, 0, 0, 0);
//         end.setDate(now.getDate() - 1);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'last7days':
//         start.setDate(now.getDate() - 7);
//         start.setHours(0, 0, 0, 0);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'thisWeek':
//         start.setDate(now.getDate() - now.getDay());
//         start.setHours(0, 0, 0, 0);
//         end.setDate(start.getDate() + 6);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'thisMonth':
//         start.setDate(1);
//         start.setHours(0, 0, 0, 0);
//         end.setMonth(now.getMonth() + 1, 0);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'lastMonth':
//         start.setMonth(now.getMonth() - 1, 1);
//         start.setHours(0, 0, 0, 0);
//         end.setMonth(now.getMonth(), 0);
//         end.setHours(23, 59, 59, 999);
//         break;
//       default:
//         return null;
//     }
//     return { fromDate: start, toDate: end };
//   };

//   const filterByDateRange = (data) => {
//     let fromDate = null;
//     let toDate = null;

//     if (periodFilter === 'custom') {
//       fromDate = dateRange.fromDate ? new Date(dateRange.fromDate) : null;
//       toDate = dateRange.toDate ? new Date(dateRange.toDate) : null;
//       if (toDate) toDate.setHours(23, 59, 59, 999);
//     } else if (periodFilter !== 'all') {
//       const range = getDateRangeFromPeriod(periodFilter);
//       if (range) {
//         fromDate = range.fromDate;
//         toDate = range.toDate;
//       }
//     }

//     if (!fromDate && !toDate) return data;

//     return data.filter(item => {
//       const itemDate = new Date(item.date);
//       if (isNaN(itemDate)) return true;
//       if (fromDate && itemDate < fromDate) return false;
//       if (toDate && itemDate > toDate) return false;
//       return true;
//     });
//   };

//   const filterBySearch = (data) => {
//     if (!searchTerm) return data;
//     const term = searchTerm.toLowerCase();
//     return data.filter(item => 
//       item.name?.toLowerCase().includes(term) ||
//       item.sku?.toLowerCase().includes(term) ||
//       (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(term)) ||
//       (item.customerName && item.customerName.toLowerCase().includes(term)) ||
//       (item.salesperson && item.salesperson.toLowerCase().includes(term))
//     );
//   };

//   const filterByDateGroup = (data, selectedDateStr) => {
//     if (!selectedDateStr) return data;
//     return data.filter(item => item.dateStr === selectedDateStr);
//   };

//   const filteredInward = useMemo(() => {
//     let data = [...inwardData];
//     data = filterByDateRange(data);
//     data = filterBySearch(data);
//     if (selectedDate) {
//       data = filterByDateGroup(data, selectedDate);
//     }
//     return data;
//   }, [inwardData, periodFilter, dateRange, searchTerm, selectedDate]);

//   const filteredOutward = useMemo(() => {
//     let data = [...outwardData];
//     data = filterByDateRange(data);
//     data = filterBySearch(data);
//     if (selectedDate) {
//       data = filterByDateGroup(data, selectedDate);
//     }
//     return data;
//   }, [outwardData, periodFilter, dateRange, searchTerm, selectedDate]);

//   // Group data by date for day-wise view
//   const groupedInward = useMemo(() => {
//     const groups = {};
//     filteredInward.forEach(item => {
//       if (!groups[item.dateStr]) {
//         groups[item.dateStr] = {
//           date: item.dateStr,
//           items: [],
//           totalQty: 0,
//           totalValue: 0
//         };
//       }
//       groups[item.dateStr].items.push(item);
//       groups[item.dateStr].totalQty += item.qty;
//       groups[item.dateStr].totalValue += item.totalValue;
//     });
//     return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
//   }, [filteredInward]);

//   const groupedOutward = useMemo(() => {
//     const groups = {};
//     filteredOutward.forEach(item => {
//       if (!groups[item.dateStr]) {
//         groups[item.dateStr] = {
//           date: item.dateStr,
//           items: [],
//           totalQty: 0,
//           totalValue: 0
//         };
//       }
//       groups[item.dateStr].items.push(item);
//       groups[item.dateStr].totalQty += item.qty;
//       groups[item.dateStr].totalValue += item.totalValue;
//     });
//     return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
//   }, [filteredOutward]);

//   const currentData = activeTab === 'INWARD' ? groupedInward : groupedOutward;
//   const totalPages = Math.ceil(currentData.length / itemsPerPage);
//   const paginatedData = currentData.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const totalQty = currentData.reduce((sum, group) => sum + group.totalQty, 0);
//   const totalValue = currentData.reduce((sum, group) => sum + group.totalValue, 0);

//   const getUniqueDates = () => {
//     const dates = new Set();
//     [...inwardData, ...outwardData].forEach(item => {
//       dates.add(item.dateStr);
//     });
//     return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
//   };

//   const handleDateSelect = (date) => {
//     setSelectedDate(selectedDate === date ? null : date);
//     setCurrentPage(1);
//   };

//   const resetFilters = () => {
//     setPeriodFilter('all');
//     setDateRange({ fromDate: '', toDate: '' });
//     setShowDateFilter(false);
//     setSearchTerm('');
//     setSelectedDate(null);
//     setCurrentPage(1);
//   };

//   const exportToExcel = () => {
//     const exportData = [];
    
//     if (activeTab === 'INWARD') {
//       groupedInward.forEach(group => {
//         group.items.forEach(item => {
//           exportData.push({
//             'Date': item.dateStr,
//             'Time': item.time,
//             'Type': 'INWARD',
//             'Product Name': item.name,
//             'SKU': item.sku,
//             'Quantity': item.qty,
//             'Price/Unit': item.price,
//             'Total Value': item.totalValue,
//             'Category': item.category || '-',
//             'Rack No': item.rackNo || '-',
//             'Batch No': item.batchNo || '-',
//             'Note': item.note
//           });
//         });
//       });
//     } else {
//       groupedOutward.forEach(group => {
//         group.items.forEach(item => {
//           exportData.push({
//             'Date': item.dateStr,
//             'Time': item.time,
//             'Type': 'OUTWARD',
//             'Product Name': item.name,
//             'SKU': item.sku,
//             'Quantity': item.qty,
//             'Price/Unit': item.price,
//             'Total Value': item.totalValue,
//             'Invoice Number': item.invoiceNumber,
//             'Customer Name': item.customerName,
//             'Salesperson': item.salesperson,
//             'Payment Mode': item.paymentMode,
//             'Note': item.note
//           });
//         });
//       });
//     }

//     const worksheet = XLSX.utils.json_to_sheet(exportData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab}_Movement`);
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//     saveAs(blob, `Stock_Movement_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   const loading = productsLoading || invoicesLoading;

//   const periodOptions = [
//     { value: 'all', label: 'All', icon: CalendarDays },
//     { value: 'today', label: 'Today', icon: Calendar },
//     { value: 'yesterday', label: 'Yesterday', icon: Calendar },
//     { value: 'last7days', label: 'Last 7 Days', icon: CalendarDays },
//     { value: 'thisWeek', label: 'This Week', icon: Calendar },
//     { value: 'thisMonth', label: 'This Month', icon: Calendar },
//     { value: 'lastMonth', label: 'Last Month', icon: Calendar },
//     { value: 'custom', label: 'Custom', icon: Filter },
//   ];

//   if (loading) {
//     return (
//       <div className={`stock-movement-page ${isDark ? 'dark' : ''}`}>
//         <div className="stock-movement-loading">
//           <Loader className="spin" size={40} />
//           <p>Loading stock movement data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`stock-movement-page ${isDark ? 'dark' : ''}`}>
//       <div className="stock-movement-container">
//         {/* Header */}
//         <div className="stock-movement-header">
//           <div>
//             <h1>Stock Movement</h1>
//             <p>Track inward and outward stock movements day by day</p>
//           </div>
//           <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
//             <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
//             {refreshing ? 'Refreshing...' : 'Refresh'}
//           </button>
//         </div>

//         {/* Tabs */}
//         <div className="movement-tabs">
//           <button
//             className={`tab-btn ${activeTab === 'INWARD' ? 'active' : ''}`}
//             onClick={() => { setActiveTab('INWARD'); setSelectedDate(null); setCurrentPage(1); }}
//           >
//             <TrendingUp size={16} />
//             <span>Inward (Stock Added)</span>
//           </button>
//           <button
//             className={`tab-btn ${activeTab === 'OUTWARD' ? 'active' : ''}`}
//             onClick={() => { setActiveTab('OUTWARD'); setSelectedDate(null); setCurrentPage(1); }}
//           >
//             <TrendingDown size={16} />
//             <span>Outward (Stock Sold)</span>
//           </button>
//         </div>

//         {/* Search */}
//         <div className="movement-search">
//           <div className="search-wrapper">
//             <Search size={18} />
//             <input
//               type="text"
//               placeholder={`Search by product name, SKU${activeTab === 'OUTWARD' ? ', invoice number, customer name, or salesperson' : ''}...`}
//               value={searchTerm}
//               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
//             />
//             {searchTerm && (
//               <button className="search-clear" onClick={() => setSearchTerm('')}>
//                 <X size={16} />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Filters Row */}
//         <div className="filters-row">
//           <div className="filter-group">
//             <span className="filter-label"><Filter size={14} /> Date:</span>
//             <div className="filter-options">
//               {periodOptions.map(option => {
//                 const Icon = option.icon;
//                 return (
//                   <button
//                     key={option.value}
//                     className={`filter-option ${periodFilter === option.value ? 'active' : ''}`}
//                     onClick={() => {
//                       setPeriodFilter(option.value);
//                       if (option.value === 'custom') {
//                         setShowDateFilter(true);
//                       } else {
//                         setShowDateFilter(false);
//                         setDateRange({ fromDate: '', toDate: '' });
//                       }
//                       setCurrentPage(1);
//                     }}
//                   >
//                     <Icon size={12} />
//                     <span>{option.label}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
          
//           {(periodFilter !== 'all' || dateRange.fromDate || dateRange.toDate || searchTerm || selectedDate) && (
//             <button className="clear-all-btn" onClick={resetFilters}>
//               <X size={14} /> Clear All
//             </button>
//           )}
//         </div>

//         {/* Custom Date Range */}
//         {showDateFilter && (
//           <div className="custom-date-range">
//             <input
//               type="date"
//               value={dateRange.fromDate}
//               onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
//               placeholder="From Date"
//             />
//             <span>→</span>
//             <input
//               type="date"
//               value={dateRange.toDate}
//               onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
//               placeholder="To Date"
//             />
//           </div>
//         )}

//         {/* Date Quick Select */}
//         {getUniqueDates().length > 0 && (
//           <div className="date-quick-select">
//             <span className="quick-label">Quick Date:</span>
//             <div className="date-chips">
//               {getUniqueDates().slice(0, 8).map(date => (
//                 <button
//                   key={date}
//                   className={`date-chip ${selectedDate === date ? 'active' : ''}`}
//                   onClick={() => handleDateSelect(date)}
//                 >
//                   {date}
//                 </button>
//               ))}
//               {selectedDate && (
//                 <button className="clear-date-chip" onClick={() => setSelectedDate(null)}>
//                   <X size={12} /> Clear
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Summary Stats */}
//         <div className="movement-summary">
//           <div className="summary-card">
//             <div className="summary-icon">
//               {activeTab === 'INWARD' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
//             </div>
//             <div className="summary-content">
//               <div className="summary-label">Total {activeTab === 'INWARD' ? 'Added' : 'Sold'}</div>
//               <div className="summary-value">{totalQty.toLocaleString()} units</div>
//             </div>
//           </div>
//           <div className="summary-card">
//             <div className="summary-icon">
//               <DollarSign size={20} />
//             </div>
//             <div className="summary-content">
//               <div className="summary-label">Total Value</div>
//               <div className="summary-value">{formatValue(totalValue)}</div>
//             </div>
//           </div>
//           <div className="summary-card">
//             <div className="summary-icon">
//               <Calendar size={20} />
//             </div>
//             <div className="summary-content">
//               <div className="summary-label">Transaction Days</div>
//               <div className="summary-value">{currentData.length} days</div>
//             </div>
//           </div>
//         </div>

//         {/* Movement List */}
//         <div className="movement-list-container">
//           {paginatedData.length > 0 ? (
//             paginatedData.map(group => (
//               <div key={group.date} className="movement-group">
//                 <div className="group-header">
//                   <div className="group-date">
//                     <Calendar size={16} />
//                     <span>{group.date}</span>
//                   </div>
//                   <div className="group-stats">
//                     <span className="group-qty">
//                       <Box size={12} /> {group.totalQty} units
//                     </span>
//                     <span className="group-value">
//                       <DollarSign size={12} /> {formatValue(group.totalValue)}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="group-items">
//                   {group.items.map((item, idx) => (
//                     <div key={`${item.id}_${idx}`} className="movement-item">
//                       <div className="item-icon">
//                         {activeTab === 'INWARD' ? (
//                           <div className="icon-inward">
//                             <TrendingUp size={16} />
//                           </div>
//                         ) : (
//                           <div className="icon-outward">
//                             <TrendingDown size={16} />
//                           </div>
//                         )}
//                       </div>
//                       <div className="item-details">
//                         <div className="item-name">{item.name}</div>
//                         <div className="item-info">
//                           <span className="item-sku"><Tag size={10} /> {item.sku}</span>
//                           {item.invoiceNumber && item.invoiceNumber !== 'N/A' && (
//                             <span className="item-invoice"><FileText size={10} /> {item.invoiceNumber}</span>
//                           )}
//                           {item.customerName && item.customerName !== 'N/A' && (
//                             <span className="item-customer"><Users size={10} /> {item.customerName}</span>
//                           )}
//                           {item.salesperson && item.salesperson !== 'N/A' && (
//                             <span className="item-salesperson"><UserCheck size={10} /> {item.salesperson}</span>
//                           )}
//                           <span className="item-time"><Clock size={10} /> {item.time}</span>
//                         </div>
//                       </div>
//                       <div className="item-quantity">
//                         <div className={`qty-value ${activeTab === 'INWARD' ? 'positive' : 'negative'}`}>
//                           {activeTab === 'INWARD' ? '+' : '-'}{item.qty}
//                         </div>
//                         <div className="item-price">{formatValue(item.price)}</div>
//                         <div className="item-total">{formatValue(item.totalValue)}</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="empty-state">
//               <Package size={48} strokeWidth={1.5} />
//               <p>No {activeTab.toLowerCase()} records found</p>
//               <small>
//                 {searchTerm || selectedDate || periodFilter !== 'all'
//                   ? 'Try changing your filters to see more results'
//                   : `When you ${activeTab === 'INWARD' ? 'add new products' : 'create invoices and sell products'}, they will appear here`}
//               </small>
//             </div>
//           )}
//         </div>

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="movement-pagination">
//             <button
//               className="page-btn"
//               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//               disabled={currentPage === 1}
//             >
//               <ChevronLeft size={14} /> Previous
//             </button>
//             <span className="page-info">Page {currentPage} of {totalPages}</span>
//             <button
//               className="page-btn"
//               onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//               disabled={currentPage === totalPages}
//             >
//               Next <ChevronRight size={14} />
//             </button>
//           </div>
//         )}

//         {/* Export */}
//         {currentData.length > 0 && (
//           <div className="export-section">
//             <button className="export-excel-btn" onClick={exportToExcel}>
//               <Download size={16} />
//               Export to Excel
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StockMovement;