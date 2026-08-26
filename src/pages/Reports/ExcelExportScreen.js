// src/pages/Reports/ExcelExportScreen.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import {
  Download,
  FileText,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  X,
  CheckCircle,
  Eye,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  Search
} from 'lucide-react';
import {
  exportInvoicesToExcel,
  exportInvoiceItemsToExcel,
  exportSalesReturnsToExcel,
  exportSalesReturnItemsToExcel,
  exportPurchaseReturnsToExcel,
  exportProductsToExcel,
  exportCustomersToExcel
} from '../../utils/excelExport';
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import { fetchSalesReturns, fetchPurchaseReturns } from '../../services/features/returns/returnsSlice';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchAllCustomers } from '../../services/features/customers/customerSlice.js';
import API from '../../services/API/api';
import DataTableModal from '../Reports/DataTableModal';
import './ExcelExportScreen.css';

// ============================================
// CONSTANTS
// ============================================

const REPORT_OPTIONS = [
  {
    id: 'invoices',
    title: 'Invoices',
    icon: FileText,
    color: '#3b82f6',
    description: 'Customer info and payment modes',
    types: [
      { id: 'summary', name: 'Summary', description: 'Basic invoice information' },
      { id: 'detailed', name: 'Detailed', description: 'Item-wise breakdown' }
    ]
  },
  {
    id: 'salesReturns',
    title: 'Sales Returns',
    icon: TrendingUp,
    color: '#ef4444',
    description: 'Return records with customer details',
    types: [
      { id: 'summary', name: 'Summary', description: 'Basic return information' },
      { id: 'detailed', name: 'Detailed', description: 'Item-wise breakdown' }
    ]
  },
  {
    id: 'purchaseReturns',
    title: 'Purchase Returns',
    icon: ShoppingCart,
    color: '#f59e0b',
    description: 'Return records with supplier details',
    types: [
      { id: 'summary', name: 'Summary', description: 'Purchase return information' }
    ]
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    color: '#10b981',
    description: 'Catalog with pricing and inventory',
    types: [
      { id: 'summary', name: 'Export', description: 'Complete product list' }
    ]
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Users,
    color: '#8b5cf6',
    description: 'Customer database with contacts',
    types: [
      { id: 'summary', name: 'Export', description: 'Complete customer list' }
    ]
  }
];

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const sortDataByDate = (data, reportId) => {
  if (!data || data.length === 0) return data;

  const getDateField = (item) => {
    switch (reportId) {
      case 'invoices':
        return item.invoiceDate || item.createdAt;
      case 'salesReturns':
      case 'purchaseReturns':
        return item.createdAt;
      case 'products':
      case 'customers':
        return item.createdAt;
      default:
        return item.createdAt || item.invoiceDate;
    }
  };

  return [...data].sort((a, b) => {
    const dateA = new Date(getDateField(a));
    const dateB = new Date(getDateField(b));

    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA - dateB;
  });
};

const getDateRangeFromPeriod = (period) => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
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
      break;
    case 'thisWeek':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'lastWeek': {
      const lw = new Date(now);
      lw.setDate(now.getDate() - 7);
      start.setDate(lw.getDate() - lw.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
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

// ============================================
// MAIN COMPONENT
// ============================================

const ExcelExportScreen = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useSelector((state) => state.auth);

  // Data
  const [invoices, setInvoices] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState({
    invoices: false,
    salesReturns: false,
    purchaseReturns: false,
    products: false,
    customers: false
  });

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
  const [periodFilter, setPeriodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [uniqueSalespersons, setUniqueSalespersons] = useState([]);
  const [uniqueOrderTypes, setUniqueOrderTypes] = useState([]);

  // UI
  const [exporting, setExporting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedModal, setSelectedModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openExportMenu, setOpenExportMenu] = useState(null);
  const exportMenuRef = useRef(null);

  // ============================================
  // DATA FETCHING - FIXED
  // ============================================

  const fetchAllData = useCallback(async () => {
    const billerName = user?.role === 'Radnus' ? user?.name : '';

    // Fetch Invoices
    setLoading(prev => ({ ...prev, invoices: true }));
    try {
      const result = await dispatch(fetchInvoices({ filter: 'all', billerName })).unwrap();
      setInvoices(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }

    // Fetch Sales Returns
    setLoading(prev => ({ ...prev, salesReturns: true }));
    try {
      const result = await dispatch(fetchSalesReturns({ billerName })).unwrap();
      setSalesReturns(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching sales returns:', error);
      setSalesReturns([]);
    } finally {
      setLoading(prev => ({ ...prev, salesReturns: false }));
    }

    // Fetch Purchase Returns
    setLoading(prev => ({ ...prev, purchaseReturns: true }));
    try {
      const result = await dispatch(fetchPurchaseReturns({ billerName })).unwrap();
      setPurchaseReturns(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching purchase returns:', error);
      setPurchaseReturns([]);
    } finally {
      setLoading(prev => ({ ...prev, purchaseReturns: false }));
    }

    // Fetch Products
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const result = await dispatch(fetchProducts()).unwrap();
      setProducts(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }

    // ✅ FIXED: Fetch Customers with proper error handling and response structure
    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const result = await dispatch(fetchAllCustomers()).unwrap();
      console.log('📊 Customer API Response:', result);
      
      // Handle different response structures
      let customerData = [];
      if (Array.isArray(result)) {
        customerData = result;
      } else if (result?.customers && Array.isArray(result.customers)) {
        customerData = result.customers;
      } else if (result?.data && Array.isArray(result.data)) {
        customerData = result.data;
      } else {
        customerData = [];
      }
      
      setCustomers(customerData);
      console.log(`✅ Loaded ${customerData.length} customers successfully`);
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      console.error('Error details:', error.response?.data || error.message);
      setCustomers([]);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  }, [dispatch, user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Extract unique salespersons
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const salespersons = [...new Set(invoices
        .map(inv => inv.salesperson)
        .filter(sp => sp && sp.trim() !== '')
      )].sort();
      setUniqueSalespersons(salespersons);
    }
  }, [invoices]);

  // Extract unique order types
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const orderTypes = [...new Set(invoices
        .map(inv => inv.orderType)
        .filter(ot => ot && ot.trim() !== '')
      )].sort();
      setUniqueOrderTypes(orderTypes);
    }
  }, [invoices]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!openExportMenu) return;
    const handleClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setOpenExportMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openExportMenu]);

  // ============================================
  // FILTERING LOGIC
  // ============================================

  const filterDataByDate = useCallback((data) => {
    if (!Array.isArray(data)) return [];

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
      const itemDate = new Date(item?.invoiceDate || item?.createdAt);
      if (isNaN(itemDate)) return true;
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
    });
  }, [periodFilter, dateRange]);

  const filterDataBySalesperson = useCallback((data) => {
    if (!salespersonFilter || salespersonFilter === '') return data;
    return data.filter(item => item.salesperson === salespersonFilter);
  }, [salespersonFilter]);

  const filterDataByOrderType = useCallback((data) => {
    if (!orderTypeFilter || orderTypeFilter === '') return data;
    return data.filter(item => item.orderType === orderTypeFilter);
  }, [orderTypeFilter]);

  const applyAllFilters = useCallback((data, reportType) => {
    let filtered = data;

    if (reportType !== 'products' && reportType !== 'customers') {
      filtered = filterDataByDate(filtered);
    }

    filtered = filterDataBySalesperson(filtered);
    filtered = filterDataByOrderType(filtered);

    if (reportType === 'invoices' && searchTerm) {
      filtered = filtered.filter(inv =>
        inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.salesperson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.orderType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [filterDataByDate, filterDataBySalesperson, filterDataByOrderType, searchTerm]);

  // ============================================
  // MEMOIZED DATA
  // ============================================

  const filteredInvoices = useMemo(
    () => applyAllFilters([...invoices], 'invoices'),
    [invoices, applyAllFilters]
  );

  const filteredSalesReturns = useMemo(
    () => applyAllFilters([...salesReturns], 'salesReturns'),
    [salesReturns, applyAllFilters]
  );

  const filteredPurchaseReturns = useMemo(
    () => applyAllFilters([...purchaseReturns], 'purchaseReturns'),
    [purchaseReturns, applyAllFilters]
  );

  const filteredProducts = useMemo(
    () => applyAllFilters([...products], 'products'),
    [products, applyAllFilters]
  );

  const filteredCustomers = useMemo(
    () => applyAllFilters([...customers], 'customers'),
    [customers, applyAllFilters]
  );

  const totalRecords = useMemo(
    () => filteredInvoices.length + filteredSalesReturns.length +
      filteredPurchaseReturns.length + filteredProducts.length + filteredCustomers.length,
    [filteredInvoices, filteredSalesReturns, filteredPurchaseReturns, filteredProducts, filteredCustomers]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (periodFilter !== 'all') count += 1;
    if (salespersonFilter) count += 1;
    if (orderTypeFilter) count += 1;
    return count;
  }, [periodFilter, salespersonFilter, orderTypeFilter]);

  // ============================================
  // DATA ACCESS FUNCTIONS
  // ============================================

  const getRawData = useCallback((reportId) => {
    switch (reportId) {
      case 'invoices': return invoices;
      case 'salesReturns': return salesReturns;
      case 'purchaseReturns': return purchaseReturns;
      case 'products': return products;
      case 'customers': return customers;
      default: return [];
    }
  }, [invoices, salesReturns, purchaseReturns, products, customers]);

  const getDataCount = useCallback((reportId) => {
    switch (reportId) {
      case 'invoices': return filteredInvoices.length;
      case 'salesReturns': return filteredSalesReturns.length;
      case 'purchaseReturns': return filteredPurchaseReturns.length;
      case 'products': return filteredProducts.length;
      case 'customers': return filteredCustomers.length;
      default: return 0;
    }
  }, [filteredInvoices, filteredSalesReturns, filteredPurchaseReturns, filteredProducts, filteredCustomers]);

  const getLoadingState = useCallback((reportId) => {
    return loading[reportId] || false;
  }, [loading]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleViewData = useCallback((reportId) => {
    const raw = getRawData(reportId);
    const data = applyAllFilters([...raw], reportId);
    const sortedData = sortDataByDate(data, reportId);
    const report = REPORT_OPTIONS.find(r => r.id === reportId);
    const filterText = [];
    if (salespersonFilter) filterText.push(`Salesperson: ${salespersonFilter}`);
    if (orderTypeFilter) filterText.push(`Order Type: ${orderTypeFilter}`);
    setModalData(sortedData);
    setModalTitle(`${report?.title} Data ${filterText.length ? `- ${filterText.join(', ')}` : ''}`);
    setSelectedModal(reportId);
    setCurrentPage(1);
  }, [getRawData, applyAllFilters, salespersonFilter, orderTypeFilter]);

  const handleExport = useCallback(async (reportId, type) => {
    setOpenExportMenu(null);
    setExporting(`${reportId}-${type}`);
    setSuccessMessage('');

    try {
      const raw = getRawData(reportId);
      let filtered = applyAllFilters([...raw], reportId);
      const sortedData = sortDataByDate(filtered, reportId);

      const filterSuffix = [];
      if (salespersonFilter) filterSuffix.push(salespersonFilter);
      if (orderTypeFilter) filterSuffix.push(orderTypeFilter);
      const suffix = filterSuffix.length ? `_${filterSuffix.join('_')}` : '';

      switch (reportId) {
        case 'invoices':
          if (type === 'summary') {
            exportInvoicesToExcel(sortedData, `Invoices_Summary${suffix}`);
          } else {
            exportInvoiceItemsToExcel(sortedData, `Invoices_Detailed${suffix}`);
          }
          break;
        case 'salesReturns':
          if (type === 'summary') {
            exportSalesReturnsToExcel(sortedData, `Sales_Returns_Summary${suffix}`);
          } else {
            exportSalesReturnItemsToExcel(sortedData, `Sales_Returns_Detailed${suffix}`);
          }
          break;
        case 'purchaseReturns':
          exportPurchaseReturnsToExcel(sortedData, `Purchase_Returns_Report${suffix}`);
          break;
        case 'products':
          exportProductsToExcel(sortedData, `Products_Report`);
          break;
        case 'customers':
          exportCustomersToExcel(sortedData, `Customers_Report`);
          break;
        default:
          break;
      }

      const title = REPORT_OPTIONS.find(r => r.id === reportId)?.title;
      setSuccessMessage(`${title} exported successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  }, [getRawData, applyAllFilters, salespersonFilter, orderTypeFilter]);

  const handlePeriodChange = useCallback((e) => {
    const period = e.target.value;
    setPeriodFilter(period);
    if (period !== 'custom') {
      setDateRange({ fromDate: '', toDate: '' });
    }
  }, []);

  const resetFilter = useCallback(() => {
    setPeriodFilter('all');
    setDateRange({ fromDate: '', toDate: '' });
    setSearchTerm('');
    setSalespersonFilter('');
    setOrderTypeFilter('');
  }, []);

  const handleViewDetails = useCallback((item) => {
    console.log('View details:', item);
    alert('View details functionality can be implemented here');
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`excel-export-container ${isDark ? 'dark' : ''}`}>

      {successMessage && (
        <div className="toast-notification">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="main-content">

        {/* Header */}
        <div className="header-section">
          <div>
            <h1 className="page-title">Export Center</h1>
            <p className="page-subtitle">Download your data as Excel files</p>
          </div>
          <div className="total-stats-card">
            <span className="total-stats-value">{totalRecords.toLocaleString()}</span>
            <span className="total-stats-label">records</span>
          </div>
        </div>

        {/* Toolbar: search + filters toggle */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search invoices by customer, number, salesperson…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="icon-btn" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`filters-toggle ${filtersOpen ? 'open' : ''} ${activeFilterCount ? 'has-active' : ''}`}
            onClick={() => setFiltersOpen(prev => !prev)}
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filters-count">{activeFilterCount}</span>}
            <ChevronDown size={14} className={`chevron ${filtersOpen ? 'rotated' : ''}`} />
          </button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="filters-panel">
            <div className="filter-field">
              <label>Period</label>
              <select value={periodFilter} onChange={handlePeriodChange}>
                {PERIOD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {periodFilter === 'custom' && (
              <div className="filter-field date-field-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                />
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.toDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
            )}

            {uniqueSalespersons.length > 0 && (
              <div className="filter-field">
                <label>Salesperson</label>
                <select value={salespersonFilter} onChange={(e) => setSalespersonFilter(e.target.value)}>
                  <option value="">All salespersons</option>
                  {uniqueSalespersons.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>
            )}

            {uniqueOrderTypes.length > 0 && (
              <div className="filter-field">
                <label>Order type</label>
                <select value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}>
                  <option value="">All types</option>
                  {uniqueOrderTypes.map(ot => (
                    <option key={ot} value={ot}>{ot}</option>
                  ))}
                </select>
              </div>
            )}

            {(activeFilterCount > 0 || searchTerm) && (
              <button className="reset-btn" onClick={resetFilter}>
                <X size={13} />
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips (visible even when panel is collapsed) */}
        {(salespersonFilter || orderTypeFilter || (periodFilter !== 'all' && periodFilter !== 'custom') ||
          (periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate)) || searchTerm) && (
          <div className="active-filters">
            {searchTerm && (
              <span className="chip">
                “{searchTerm}”
                <button onClick={() => setSearchTerm('')}><X size={11} /></button>
              </span>
            )}
            {periodFilter !== 'all' && periodFilter !== 'custom' && (
              <span className="chip">
                {PERIOD_OPTIONS.find(p => p.value === periodFilter)?.label}
                <button onClick={() => setPeriodFilter('all')}><X size={11} /></button>
              </span>
            )}
            {periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate) && (
              <span className="chip">
                {dateRange.fromDate || 'Start'} → {dateRange.toDate || 'End'}
                <button onClick={() => { setPeriodFilter('all'); setDateRange({ fromDate: '', toDate: '' }); }}>
                  <X size={11} />
                </button>
              </span>
            )}
            {salespersonFilter && (
              <span className="chip">
                {salespersonFilter}
                <button onClick={() => setSalespersonFilter('')}><X size={11} /></button>
              </span>
            )}
            {orderTypeFilter && (
              <span className="chip">
                {orderTypeFilter}
                <button onClick={() => setOrderTypeFilter('')}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Export Cards Grid */}
        <div className="cards-grid">
          {REPORT_OPTIONS.map((report) => {
            const Icon = report.icon;
            const isLoading = getLoadingState(report.id);
            const dataCount = getDataCount(report.id);
            const isEmpty = !isLoading && dataCount === 0;
            const hasMultipleTypes = report.types.length > 1;
            const isMenuOpen = openExportMenu === report.id;

            const showFilterBadge = (report.id === 'invoices' || report.id === 'salesReturns') &&
              (salespersonFilter || orderTypeFilter);

            return (
              <div key={report.id} className="export-card" style={{ '--accent': report.color }}>
                <div className="card-top">
                  <span className="card-icon"><Icon size={18} /></span>
                  <div className="card-info">
                    <h3 className="card-title">{report.title}</h3>
                    <p className="card-description">{report.description}</p>
                  </div>
                  <span className="card-count" title="Records matching current filters">
                    {isLoading ? '…' : dataCount.toLocaleString()}
                  </span>
                </div>

                {showFilterBadge && (
                  <div className="card-filter-note">Filtered by {[salespersonFilter, orderTypeFilter].filter(Boolean).join(', ')}</div>
                )}

                {isEmpty ? (
                  <div className="card-empty">
                    <AlertCircle size={13} />
                    <span>No data for current filters</span>
                  </div>
                ) : (
                  <div className="card-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => handleViewData(report.id)}
                      disabled={isLoading}
                    >
                      <Eye size={14} />
                      View
                    </button>

                    {hasMultipleTypes ? (
                      <div className="export-dropdown" ref={isMenuOpen ? exportMenuRef : null}>
                        <button
                          className="btn-primary"
                          onClick={() => setOpenExportMenu(isMenuOpen ? null : report.id)}
                          disabled={!!exporting || isLoading}
                        >
                          <Download size={14} className={exporting?.startsWith(report.id) ? 'spin' : ''} />
                          Export
                          <ChevronDown size={13} className={`chevron ${isMenuOpen ? 'rotated' : ''}`} />
                        </button>
                        {isMenuOpen && (
                          <div className="dropdown-menu">
                            {report.types.map(type => (
                              <button
                                key={type.id}
                                className="dropdown-item"
                                onClick={() => handleExport(report.id, type.id)}
                              >
                                <span className="dropdown-item-name">{type.name}</span>
                                <span className="dropdown-item-desc">{type.description}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => handleExport(report.id, report.types[0].id)}
                        disabled={!!exporting || isLoading}
                      >
                        <Download size={14} className={exporting === `${report.id}-${report.types[0].id}` ? 'spin' : ''} />
                        Export
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <DataTableModal
        isOpen={selectedModal !== null}
        onClose={() => setSelectedModal(null)}
        title={modalTitle}
        data={modalData}
        reportType={selectedModal}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onExport={() => selectedModal && handleExport(selectedModal, 'summary')}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

export default ExcelExportScreen;

//------------ 26.08.2026 ------------------------------
// // src/pages/Reports/ExcelExportScreen.js
// import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useTheme } from '../../context/ThemeContext';
// import {
//   Download,
//   FileText,
//   Package,
//   Users,
//   ShoppingCart,
//   TrendingUp,
//   X,
//   CheckCircle,
//   Eye,
//   AlertCircle,
//   SlidersHorizontal,
//   ChevronDown,
//   Search
// } from 'lucide-react';
// import {
//   exportInvoicesToExcel,
//   exportInvoiceItemsToExcel,
//   exportSalesReturnsToExcel,
//   exportSalesReturnItemsToExcel,
//   exportPurchaseReturnsToExcel,
//   exportProductsToExcel,
//   exportCustomersToExcel
// } from '../../utils/excelExport';
// import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
// import { fetchSalesReturns, fetchPurchaseReturns } from '../../services/features/returns/returnsSlice';
// import { fetchProducts } from '../../services/features/products/productSlice';
// import API from '../../services/API/api';
// import DataTableModal from '../Reports/DataTableModal';
// import './ExcelExportScreen.css';

// // ============================================
// // CONSTANTS
// // ============================================

// const REPORT_OPTIONS = [
//   {
//     id: 'invoices',
//     title: 'Invoices',
//     icon: FileText,
//     color: '#3b82f6',
//     description: 'Customer info and payment modes',
//     types: [
//       { id: 'summary', name: 'Summary', description: 'Basic invoice information' },
//       { id: 'detailed', name: 'Detailed', description: 'Item-wise breakdown' }
//     ]
//   },
//   {
//     id: 'salesReturns',
//     title: 'Sales Returns',
//     icon: TrendingUp,
//     color: '#ef4444',
//     description: 'Return records with customer details',
//     types: [
//       { id: 'summary', name: 'Summary', description: 'Basic return information' },
//       { id: 'detailed', name: 'Detailed', description: 'Item-wise breakdown' }
//     ]
//   },
//   {
//     id: 'purchaseReturns',
//     title: 'Purchase Returns',
//     icon: ShoppingCart,
//     color: '#f59e0b',
//     description: 'Return records with supplier details',
//     types: [
//       { id: 'summary', name: 'Summary', description: 'Purchase return information' }
//     ]
//   },
//   {
//     id: 'products',
//     title: 'Products',
//     icon: Package,
//     color: '#10b981',
//     description: 'Catalog with pricing and inventory',
//     types: [
//       { id: 'summary', name: 'Export', description: 'Complete product list' }
//     ]
//   },
//   {
//     id: 'customers',
//     title: 'Customers',
//     icon: Users,
//     color: '#8b5cf6',
//     description: 'Customer database with contacts',
//     types: [
//       { id: 'summary', name: 'Export', description: 'Complete customer list' }
//     ]
//   }
// ];

// const PERIOD_OPTIONS = [
//   { value: 'all', label: 'All time' },
//   { value: 'today', label: 'Today' },
//   { value: 'yesterday', label: 'Yesterday' },
//   { value: 'last7days', label: 'Last 7 days' },
//   { value: 'thisWeek', label: 'This week' },
//   { value: 'lastWeek', label: 'Last week' },
//   { value: 'thisMonth', label: 'This month' },
//   { value: 'lastMonth', label: 'Last month' },
//   { value: 'custom', label: 'Custom range' },
// ];

// // ============================================
// // HELPER FUNCTIONS
// // ============================================

// const sortDataByDate = (data, reportId) => {
//   if (!data || data.length === 0) return data;

//   const getDateField = (item) => {
//     switch (reportId) {
//       case 'invoices':
//         return item.invoiceDate || item.createdAt;
//       case 'salesReturns':
//       case 'purchaseReturns':
//         return item.createdAt;
//       case 'products':
//       case 'customers':
//         return item.createdAt;
//       default:
//         return item.createdAt || item.invoiceDate;
//     }
//   };

//   return [...data].sort((a, b) => {
//     const dateA = new Date(getDateField(a));
//     const dateB = new Date(getDateField(b));

//     if (isNaN(dateA.getTime())) return 1;
//     if (isNaN(dateB.getTime())) return -1;

//     return dateA - dateB;
//   });
// };

// const getDateRangeFromPeriod = (period) => {
//   const now = new Date();
//   const start = new Date();
//   const end = new Date();

//   switch (period) {
//     case 'today':
//       start.setHours(0, 0, 0, 0);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'yesterday':
//       start.setDate(now.getDate() - 1);
//       start.setHours(0, 0, 0, 0);
//       end.setDate(now.getDate() - 1);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'last7days':
//       start.setDate(now.getDate() - 7);
//       start.setHours(0, 0, 0, 0);
//       break;
//     case 'thisWeek':
//       start.setDate(now.getDate() - now.getDay());
//       start.setHours(0, 0, 0, 0);
//       end.setDate(start.getDate() + 6);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'lastWeek': {
//       const lw = new Date(now);
//       lw.setDate(now.getDate() - 7);
//       start.setDate(lw.getDate() - lw.getDay());
//       start.setHours(0, 0, 0, 0);
//       end.setDate(start.getDate() + 6);
//       end.setHours(23, 59, 59, 999);
//       break;
//     }
//     case 'thisMonth':
//       start.setDate(1);
//       start.setHours(0, 0, 0, 0);
//       end.setMonth(now.getMonth() + 1, 0);
//       end.setHours(23, 59, 59, 999);
//       break;
//     case 'lastMonth':
//       start.setMonth(now.getMonth() - 1, 1);
//       start.setHours(0, 0, 0, 0);
//       end.setMonth(now.getMonth(), 0);
//       end.setHours(23, 59, 59, 999);
//       break;
//     default:
//       return null;
//   }
//   return { fromDate: start, toDate: end };
// };

// // ============================================
// // MAIN COMPONENT
// // ============================================

// const ExcelExportScreen = () => {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';
//   const { user } = useSelector((state) => state.auth);

//   // Data
//   const [invoices, setInvoices] = useState([]);
//   const [salesReturns, setSalesReturns] = useState([]);
//   const [purchaseReturns, setPurchaseReturns] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   const [loading, setLoading] = useState({
//     invoices: false,
//     salesReturns: false,
//     purchaseReturns: false,
//     products: false,
//     customers: false
//   });

//   // Filters
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
//   const [periodFilter, setPeriodFilter] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [salespersonFilter, setSalespersonFilter] = useState('');
//   const [orderTypeFilter, setOrderTypeFilter] = useState('');
//   const [uniqueSalespersons, setUniqueSalespersons] = useState([]);
//   const [uniqueOrderTypes, setUniqueOrderTypes] = useState([]);

//   // UI
//   const [exporting, setExporting] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [selectedModal, setSelectedModal] = useState(null);
//   const [modalData, setModalData] = useState([]);
//   const [modalTitle, setModalTitle] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [openExportMenu, setOpenExportMenu] = useState(null);
//   const exportMenuRef = useRef(null);

//   // ============================================
//   // DATA FETCHING
//   // ============================================

//   const fetchAllData = useCallback(async () => {
//     const billerName = user?.role === 'Radnus' ? user?.name : '';

//     setLoading(prev => ({ ...prev, invoices: true }));
//     try {
//       const result = await dispatch(fetchInvoices({ filter: 'all', billerName })).unwrap();
//       setInvoices(Array.isArray(result?.data) ? result.data : []);
//     } catch (error) {
//       console.error('Error fetching invoices:', error);
//       setInvoices([]);
//     } finally {
//       setLoading(prev => ({ ...prev, invoices: false }));
//     }

//     setLoading(prev => ({ ...prev, salesReturns: true }));
//     try {
//       const result = await dispatch(fetchSalesReturns({ billerName })).unwrap();
//       setSalesReturns(Array.isArray(result) ? result : []);
//     } catch (error) {
//       console.error('Error fetching sales returns:', error);
//       setSalesReturns([]);
//     } finally {
//       setLoading(prev => ({ ...prev, salesReturns: false }));
//     }

//     setLoading(prev => ({ ...prev, purchaseReturns: true }));
//     try {
//       const result = await dispatch(fetchPurchaseReturns({ billerName })).unwrap();
//       setPurchaseReturns(Array.isArray(result) ? result : []);
//     } catch (error) {
//       console.error('Error fetching purchase returns:', error);
//       setPurchaseReturns([]);
//     } finally {
//       setLoading(prev => ({ ...prev, purchaseReturns: false }));
//     }

//     setLoading(prev => ({ ...prev, products: true }));
//     try {
//       const result = await dispatch(fetchProducts()).unwrap();
//       setProducts(Array.isArray(result) ? result : []);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setProducts([]);
//     } finally {
//       setLoading(prev => ({ ...prev, products: false }));
//     }

//     setLoading(prev => ({ ...prev, customers: true }));
//     try {
//       const response = await API.get('/api/customers');
//       setCustomers(Array.isArray(response?.data) ? response.data : []);
//     } catch (error) {
//       console.error('Error fetching customers:', error);
//       setCustomers([]);
//     } finally {
//       setLoading(prev => ({ ...prev, customers: false }));
//     }
//   }, [dispatch, user]);

//   useEffect(() => {
//     fetchAllData();
//   }, [fetchAllData]);

//   // Extract unique salespersons
//   useEffect(() => {
//     if (invoices && invoices.length > 0) {
//       const salespersons = [...new Set(invoices
//         .map(inv => inv.salesperson)
//         .filter(sp => sp && sp.trim() !== '')
//       )].sort();
//       setUniqueSalespersons(salespersons);
//     }
//   }, [invoices]);

//   // Extract unique order types
//   useEffect(() => {
//     if (invoices && invoices.length > 0) {
//       const orderTypes = [...new Set(invoices
//         .map(inv => inv.orderType)
//         .filter(ot => ot && ot.trim() !== '')
//       )].sort();
//       setUniqueOrderTypes(orderTypes);
//     }
//   }, [invoices]);

//   // Close export dropdown on outside click
//   useEffect(() => {
//     if (!openExportMenu) return;
//     const handleClick = (e) => {
//       if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
//         setOpenExportMenu(null);
//       }
//     };
//     document.addEventListener('mousedown', handleClick);
//     return () => document.removeEventListener('mousedown', handleClick);
//   }, [openExportMenu]);

//   // ============================================
//   // FILTERING LOGIC
//   // ============================================

//   const filterDataByDate = useCallback((data) => {
//     if (!Array.isArray(data)) return [];

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
//       const itemDate = new Date(item?.invoiceDate || item?.createdAt);
//       if (isNaN(itemDate)) return true;
//       if (fromDate && itemDate < fromDate) return false;
//       if (toDate && itemDate > toDate) return false;
//       return true;
//     });
//   }, [periodFilter, dateRange]);

//   const filterDataBySalesperson = useCallback((data) => {
//     if (!salespersonFilter || salespersonFilter === '') return data;
//     return data.filter(item => item.salesperson === salespersonFilter);
//   }, [salespersonFilter]);

//   const filterDataByOrderType = useCallback((data) => {
//     if (!orderTypeFilter || orderTypeFilter === '') return data;
//     return data.filter(item => item.orderType === orderTypeFilter);
//   }, [orderTypeFilter]);

//   const applyAllFilters = useCallback((data, reportType) => {
//     let filtered = data;

//     if (reportType !== 'products' && reportType !== 'customers') {
//       filtered = filterDataByDate(filtered);
//     }

//     filtered = filterDataBySalesperson(filtered);
//     filtered = filterDataByOrderType(filtered);

//     if (reportType === 'invoices' && searchTerm) {
//       filtered = filtered.filter(inv =>
//         inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         inv.salesperson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         inv.orderType?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     return filtered;
//   }, [filterDataByDate, filterDataBySalesperson, filterDataByOrderType, searchTerm]);

//   // ============================================
//   // MEMOIZED DATA
//   // ============================================

//   const filteredInvoices = useMemo(
//     () => applyAllFilters([...invoices], 'invoices'),
//     [invoices, applyAllFilters]
//   );

//   const filteredSalesReturns = useMemo(
//     () => applyAllFilters([...salesReturns], 'salesReturns'),
//     [salesReturns, applyAllFilters]
//   );

//   const filteredPurchaseReturns = useMemo(
//     () => applyAllFilters([...purchaseReturns], 'purchaseReturns'),
//     [purchaseReturns, applyAllFilters]
//   );

//   const totalRecords = useMemo(
//     () => filteredInvoices.length + filteredSalesReturns.length +
//       filteredPurchaseReturns.length + products.length + customers.length,
//     [filteredInvoices, filteredSalesReturns, filteredPurchaseReturns, products, customers]
//   );

//   const activeFilterCount = useMemo(() => {
//     let count = 0;
//     if (periodFilter !== 'all') count += 1;
//     if (salespersonFilter) count += 1;
//     if (orderTypeFilter) count += 1;
//     return count;
//   }, [periodFilter, salespersonFilter, orderTypeFilter]);

//   // ============================================
//   // DATA ACCESS FUNCTIONS
//   // ============================================

//   const getRawData = useCallback((reportId) => {
//     switch (reportId) {
//       case 'invoices': return invoices;
//       case 'salesReturns': return salesReturns;
//       case 'purchaseReturns': return purchaseReturns;
//       case 'products': return products;
//       case 'customers': return customers;
//       default: return [];
//     }
//   }, [invoices, salesReturns, purchaseReturns, products, customers]);

//   const getDataCount = useCallback((reportId) => {
//     const raw = getRawData(reportId);
//     const filtered = applyAllFilters([...raw], reportId);
//     return filtered.length;
//   }, [getRawData, applyAllFilters]);

//   const getLoadingState = useCallback((reportId) => {
//     return loading[reportId] || false;
//   }, [loading]);

//   // ============================================
//   // HANDLERS
//   // ============================================

//   const handleViewData = useCallback((reportId) => {
//     const raw = getRawData(reportId);
//     const data = applyAllFilters([...raw], reportId);
//     const sortedData = sortDataByDate(data, reportId);
//     const report = REPORT_OPTIONS.find(r => r.id === reportId);
//     const filterText = [];
//     if (salespersonFilter) filterText.push(`Salesperson: ${salespersonFilter}`);
//     if (orderTypeFilter) filterText.push(`Order Type: ${orderTypeFilter}`);
//     setModalData(sortedData);
//     setModalTitle(`${report?.title} Data ${filterText.length ? `- ${filterText.join(', ')}` : ''}`);
//     setSelectedModal(reportId);
//     setCurrentPage(1);
//   }, [getRawData, applyAllFilters, salespersonFilter, orderTypeFilter]);

//   const handleExport = useCallback(async (reportId, type) => {
//     setOpenExportMenu(null);
//     setExporting(`${reportId}-${type}`);
//     setSuccessMessage('');

//     try {
//       const raw = getRawData(reportId);
//       let filtered = applyAllFilters([...raw], reportId);
//       const sortedData = sortDataByDate(filtered, reportId);

//       const filterSuffix = [];
//       if (salespersonFilter) filterSuffix.push(salespersonFilter);
//       if (orderTypeFilter) filterSuffix.push(orderTypeFilter);
//       const suffix = filterSuffix.length ? `_${filterSuffix.join('_')}` : '';

//       switch (reportId) {
//         case 'invoices':
//           if (type === 'summary') {
//             exportInvoicesToExcel(sortedData, `Invoices_Summary${suffix}`);
//           } else {
//             exportInvoiceItemsToExcel(sortedData, `Invoices_Detailed${suffix}`);
//           }
//           break;
//         case 'salesReturns':
//           if (type === 'summary') {
//             exportSalesReturnsToExcel(sortedData, `Sales_Returns_Summary${suffix}`);
//           } else {
//             exportSalesReturnItemsToExcel(sortedData, `Sales_Returns_Detailed${suffix}`);
//           }
//           break;
//         case 'purchaseReturns':
//           exportPurchaseReturnsToExcel(sortedData, `Purchase_Returns_Report${suffix}`);
//           break;
//         case 'products':
//           exportProductsToExcel(sortedData, `Products_Report`);
//           break;
//         case 'customers':
//           exportCustomersToExcel(sortedData, `Customers_Report`);
//           break;
//         default:
//           break;
//       }

//       const title = REPORT_OPTIONS.find(r => r.id === reportId)?.title;
//       setSuccessMessage(`${title} exported successfully!`);
//       setTimeout(() => setSuccessMessage(''), 3000);
//     } catch (error) {
//       console.error('Export error:', error);
//       alert('Failed to export data. Please try again.');
//     } finally {
//       setExporting(null);
//     }
//   }, [getRawData, applyAllFilters, salespersonFilter, orderTypeFilter]);

//   const handlePeriodChange = useCallback((e) => {
//     const period = e.target.value;
//     setPeriodFilter(period);
//     if (period !== 'custom') {
//       setDateRange({ fromDate: '', toDate: '' });
//     }
//   }, []);

//   const resetFilter = useCallback(() => {
//     setPeriodFilter('all');
//     setDateRange({ fromDate: '', toDate: '' });
//     setSearchTerm('');
//     setSalespersonFilter('');
//     setOrderTypeFilter('');
//   }, []);

//   const handleViewDetails = useCallback((item) => {
//     console.log('View details:', item);
//     alert('View details functionality can be implemented here');
//   }, []);

//   // ============================================
//   // RENDER
//   // ============================================

//   return (
//     <div className={`excel-export-container ${isDark ? 'dark' : ''}`}>

//       {successMessage && (
//         <div className="toast-notification">
//           <CheckCircle size={16} />
//           <span>{successMessage}</span>
//         </div>
//       )}

//       <div className="main-content">

//         {/* Header */}
//         <div className="header-section">
//           <div>
//             <h1 className="page-title">Export Center</h1>
//             <p className="page-subtitle">Download your data as Excel files</p>
//           </div>
//           <div className="total-stats-card">
//             <span className="total-stats-value">{totalRecords.toLocaleString()}</span>
//             <span className="total-stats-label">records</span>
//           </div>
//         </div>

//         {/* Toolbar: search + filters toggle */}
//         <div className="toolbar">
//           <div className="search-wrapper">
//             <Search size={16} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search invoices by customer, number, salesperson…"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             {searchTerm && (
//               <button onClick={() => setSearchTerm('')} className="icon-btn" aria-label="Clear search">
//                 <X size={14} />
//               </button>
//             )}
//           </div>

//           <button
//             className={`filters-toggle ${filtersOpen ? 'open' : ''} ${activeFilterCount ? 'has-active' : ''}`}
//             onClick={() => setFiltersOpen(prev => !prev)}
//           >
//             <SlidersHorizontal size={15} />
//             <span>Filters</span>
//             {activeFilterCount > 0 && <span className="filters-count">{activeFilterCount}</span>}
//             <ChevronDown size={14} className={`chevron ${filtersOpen ? 'rotated' : ''}`} />
//           </button>
//         </div>

//         {/* Filters panel */}
//         {filtersOpen && (
//           <div className="filters-panel">
//             <div className="filter-field">
//               <label>Period</label>
//               <select value={periodFilter} onChange={handlePeriodChange}>
//                 {PERIOD_OPTIONS.map(opt => (
//                   <option key={opt.value} value={opt.value}>{opt.label}</option>
//                 ))}
//               </select>
//             </div>

//             {periodFilter === 'custom' && (
//               <div className="filter-field date-field-group">
//                 <label>From</label>
//                 <input
//                   type="date"
//                   value={dateRange.fromDate}
//                   onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
//                 />
//                 <label>To</label>
//                 <input
//                   type="date"
//                   value={dateRange.toDate}
//                   onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
//                 />
//               </div>
//             )}

//             {uniqueSalespersons.length > 0 && (
//               <div className="filter-field">
//                 <label>Salesperson</label>
//                 <select value={salespersonFilter} onChange={(e) => setSalespersonFilter(e.target.value)}>
//                   <option value="">All salespersons</option>
//                   {uniqueSalespersons.map(sp => (
//                     <option key={sp} value={sp}>{sp}</option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {uniqueOrderTypes.length > 0 && (
//               <div className="filter-field">
//                 <label>Order type</label>
//                 <select value={orderTypeFilter} onChange={(e) => setOrderTypeFilter(e.target.value)}>
//                   <option value="">All types</option>
//                   {uniqueOrderTypes.map(ot => (
//                     <option key={ot} value={ot}>{ot}</option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {(activeFilterCount > 0 || searchTerm) && (
//               <button className="reset-btn" onClick={resetFilter}>
//                 <X size={13} />
//                 Reset filters
//               </button>
//             )}
//           </div>
//         )}

//         {/* Active filter chips (visible even when panel is collapsed) */}
//         {(salespersonFilter || orderTypeFilter || (periodFilter !== 'all' && periodFilter !== 'custom') ||
//           (periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate)) || searchTerm) && (
//           <div className="active-filters">
//             {searchTerm && (
//               <span className="chip">
//                 “{searchTerm}”
//                 <button onClick={() => setSearchTerm('')}><X size={11} /></button>
//               </span>
//             )}
//             {periodFilter !== 'all' && periodFilter !== 'custom' && (
//               <span className="chip">
//                 {PERIOD_OPTIONS.find(p => p.value === periodFilter)?.label}
//                 <button onClick={() => setPeriodFilter('all')}><X size={11} /></button>
//               </span>
//             )}
//             {periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate) && (
//               <span className="chip">
//                 {dateRange.fromDate || 'Start'} → {dateRange.toDate || 'End'}
//                 <button onClick={() => { setPeriodFilter('all'); setDateRange({ fromDate: '', toDate: '' }); }}>
//                   <X size={11} />
//                 </button>
//               </span>
//             )}
//             {salespersonFilter && (
//               <span className="chip">
//                 {salespersonFilter}
//                 <button onClick={() => setSalespersonFilter('')}><X size={11} /></button>
//               </span>
//             )}
//             {orderTypeFilter && (
//               <span className="chip">
//                 {orderTypeFilter}
//                 <button onClick={() => setOrderTypeFilter('')}><X size={11} /></button>
//               </span>
//             )}
//           </div>
//         )}

//         {/* Export Cards Grid */}
//         <div className="cards-grid">
//           {REPORT_OPTIONS.map((report) => {
//             const Icon = report.icon;
//             const isLoading = getLoadingState(report.id);
//             const dataCount = getDataCount(report.id);
//             const isEmpty = !isLoading && dataCount === 0;
//             const hasMultipleTypes = report.types.length > 1;
//             const isMenuOpen = openExportMenu === report.id;

//             const showFilterBadge = (report.id === 'invoices' || report.id === 'salesReturns') &&
//               (salespersonFilter || orderTypeFilter);

//             return (
//               <div key={report.id} className="export-card" style={{ '--accent': report.color }}>
//                 <div className="card-top">
//                   <span className="card-icon"><Icon size={18} /></span>
//                   <div className="card-info">
//                     <h3 className="card-title">{report.title}</h3>
//                     <p className="card-description">{report.description}</p>
//                   </div>
//                   <span className="card-count" title="Records matching current filters">
//                     {isLoading ? '…' : dataCount.toLocaleString()}
//                   </span>
//                 </div>

//                 {showFilterBadge && (
//                   <div className="card-filter-note">Filtered by {[salespersonFilter, orderTypeFilter].filter(Boolean).join(', ')}</div>
//                 )}

//                 {isEmpty ? (
//                   <div className="card-empty">
//                     <AlertCircle size={13} />
//                     <span>No data for current filters</span>
//                   </div>
//                 ) : (
//                   <div className="card-actions">
//                     <button
//                       className="btn-ghost"
//                       onClick={() => handleViewData(report.id)}
//                       disabled={isLoading}
//                     >
//                       <Eye size={14} />
//                       View
//                     </button>

//                     {hasMultipleTypes ? (
//                       <div className="export-dropdown" ref={isMenuOpen ? exportMenuRef : null}>
//                         <button
//                           className="btn-primary"
//                           onClick={() => setOpenExportMenu(isMenuOpen ? null : report.id)}
//                           disabled={!!exporting || isLoading}
//                         >
//                           <Download size={14} className={exporting?.startsWith(report.id) ? 'spin' : ''} />
//                           Export
//                           <ChevronDown size={13} className={`chevron ${isMenuOpen ? 'rotated' : ''}`} />
//                         </button>
//                         {isMenuOpen && (
//                           <div className="dropdown-menu">
//                             {report.types.map(type => (
//                               <button
//                                 key={type.id}
//                                 className="dropdown-item"
//                                 onClick={() => handleExport(report.id, type.id)}
//                               >
//                                 <span className="dropdown-item-name">{type.name}</span>
//                                 <span className="dropdown-item-desc">{type.description}</span>
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     ) : (
//                       <button
//                         className="btn-primary"
//                         onClick={() => handleExport(report.id, report.types[0].id)}
//                         disabled={!!exporting || isLoading}
//                       >
//                         <Download size={14} className={exporting === `${report.id}-${report.types[0].id}` ? 'spin' : ''} />
//                         Export
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Modal */}
//       <DataTableModal
//         isOpen={selectedModal !== null}
//         onClose={() => setSelectedModal(null)}
//         title={modalTitle}
//         data={modalData}
//         reportType={selectedModal}
//         currentPage={currentPage}
//         itemsPerPage={itemsPerPage}
//         onPageChange={setCurrentPage}
//         onExport={() => selectedModal && handleExport(selectedModal, 'summary')}
//         onViewDetails={handleViewDetails}
//       />
//     </div>
//   );
// };

// export default ExcelExportScreen;
