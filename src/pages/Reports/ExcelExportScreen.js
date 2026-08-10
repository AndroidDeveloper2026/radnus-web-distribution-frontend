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
  // DATA FETCHING
  // ============================================

  const fetchAllData = useCallback(async () => {
    const billerName = user?.role === 'Radnus' ? user?.name : '';

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

    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const response = await API.get('/api/customers');
      setCustomers(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const totalRecords = useMemo(
    () => filteredInvoices.length + filteredSalesReturns.length +
      filteredPurchaseReturns.length + products.length + customers.length,
    [filteredInvoices, filteredSalesReturns, filteredPurchaseReturns, products, customers]
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
    const raw = getRawData(reportId);
    const filtered = applyAllFilters([...raw], reportId);
    return filtered.length;
  }, [getRawData, applyAllFilters]);

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

//---------------- 7.8.2026 --------------------

// // src/pages/Reports/ExcelExportScreen.js
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useTheme } from '../../context/ThemeContext';
// import { 
//   Download, 
//   FileText, 
//   Package, 
//   Users, 
//   ShoppingCart,
//   TrendingUp,
//   Calendar,
//   X,
//   CheckCircle,
//   Eye,
//   AlertCircle,
//   Filter,
//   CalendarDays,
//   Sun,
//   ChevronLeft,
//   CalendarRange,
//   BarChart3,
//   Clock,
//   Search,
//   UserCheck,
//   Tag
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
//     bgLight: '#eff6ff',
//     description: 'Invoice details with customer info and payment modes',
//     types: [
//       { id: 'summary', name: 'Summary Report', description: 'Basic invoice information' },
//       { id: 'detailed', name: 'Detailed Report', description: 'Invoice with item-wise details' }
//     ]
//   },
//   {
//     id: 'salesReturns',
//     title: 'Sales Returns',
//     icon: TrendingUp,
//     color: '#ef4444',
//     bgLight: '#fef2f2',
//     description: 'Sales return records with customer details',
//     types: [
//       { id: 'summary', name: 'Summary Report', description: 'Basic return information' },
//       { id: 'detailed', name: 'Detailed Report', description: 'Returns with item-wise details' }
//     ]
//   },
//   {
//     id: 'purchaseReturns',
//     title: 'Purchase Returns',
//     icon: ShoppingCart,
//     color: '#f59e0b',
//     bgLight: '#fffbeb',
//     description: 'Purchase return records with supplier details',
//     types: [
//       { id: 'summary', name: 'Summary Report', description: 'Basic purchase return information' }
//     ]
//   },
//   {
//     id: 'products',
//     title: 'Products',
//     icon: Package,
//     color: '#10b981',
//     bgLight: '#ecfdf5',
//     description: 'Product catalog with pricing and inventory',
//     types: [
//       { id: 'summary', name: 'Products Report', description: 'Complete product list' }
//     ]
//   },
//   {
//     id: 'customers',
//     title: 'Customers',
//     icon: Users,
//     color: '#8b5cf6',
//     bgLight: '#f5f3ff',
//     description: 'Customer database with contact details',
//     types: [
//       { id: 'summary', name: 'Customers Report', description: 'Complete customer list' }
//     ]
//   }
// ];

// const PERIOD_OPTIONS = [
//   { value: 'all', label: 'All Time', icon: CalendarDays },
//   { value: 'today', label: 'Today', icon: Sun },
//   { value: 'yesterday', label: 'Yesterday', icon: ChevronLeft },
//   { value: 'last7days', label: 'Last 7 Days', icon: CalendarRange },
//   { value: 'thisWeek', label: 'This Week', icon: BarChart3 },
//   { value: 'lastWeek', label: 'Last Week', icon: Clock },
//   { value: 'thisMonth', label: 'This Month', icon: Calendar },
//   { value: 'lastMonth', label: 'Last Month', icon: CalendarDays },
//   { value: 'custom', label: 'Custom Range', icon: Filter },
// ];

// // ============================================
// // HELPER FUNCTIONS
// // ============================================

// const sortDataByDate = (data, reportId) => {
//   if (!data || data.length === 0) return data;
  
//   const getDateField = (item) => {
//     switch(reportId) {
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

//   switch(period) {
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
//     case 'lastWeek':
//       const lw = new Date(now);
//       lw.setDate(now.getDate() - 7);
//       start.setDate(lw.getDate() - lw.getDay());
//       start.setHours(0, 0, 0, 0);
//       end.setDate(start.getDate() + 6);
//       end.setHours(23, 59, 59, 999);
//       break;
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
  
//   // State
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
  
//   const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
//   const [periodFilter, setPeriodFilter] = useState('all');
//   const [showDateFilter, setShowDateFilter] = useState(false);
//   const [exporting, setExporting] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [selectedModal, setSelectedModal] = useState(null);
//   const [modalData, setModalData] = useState([]);
//   const [modalTitle, setModalTitle] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [salespersonFilter, setSalespersonFilter] = useState('');
//   const [orderTypeFilter, setOrderTypeFilter] = useState('');
//   const [uniqueSalespersons, setUniqueSalespersons] = useState([]);
//   const [uniqueOrderTypes, setUniqueOrderTypes] = useState([]);

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

//   // ============================================
//   // DATA ACCESS FUNCTIONS
//   // ============================================

//   const getRawData = useCallback((reportId) => {
//     switch(reportId) {
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

//       switch(reportId) {
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

//   const handlePeriodChange = useCallback((period) => {
//     setPeriodFilter(period);
//     if (period !== 'custom') {
//       setDateRange({ fromDate: '', toDate: '' });
//       setShowDateFilter(false);
//     } else {
//       setShowDateFilter(true);
//     }
//   }, []);

//   const resetFilter = useCallback(() => {
//     setPeriodFilter('all');
//     setDateRange({ fromDate: '', toDate: '' });
//     setShowDateFilter(false);
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
//             <p className="page-subtitle">Export your data to Excel format with just a few clicks</p>
//           </div>
//           <div className="total-stats-card">
//             <div className="total-stats-value">{totalRecords.toLocaleString()}</div>
//             <div className="total-stats-label">Filtered Records</div>
//           </div>
//         </div>

//         {/* Search and Filter Bar */}
//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search invoices by customer name, invoice number, salesperson, or order type..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             {searchTerm && (
//               <button onClick={() => setSearchTerm('')} className="search-clear">
//                 <X size={16} />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Salesperson Filter */}
//         {uniqueSalespersons.length > 0 && (
//           <div className="salesperson-filter-container">
//             <div className="salesperson-filter-header">
//               <UserCheck size={16} />
//               <span>Filter by Salesperson</span>
//             </div>
//             <div className="salesperson-buttons">
//               <button
//                 className={`salesperson-btn ${salespersonFilter === '' ? 'active' : ''}`}
//                 onClick={() => setSalespersonFilter('')}
//               >
//                 All Salespersons
//               </button>
//               {uniqueSalespersons.map(sp => (
//                 <button
//                   key={sp}
//                   className={`salesperson-btn ${salespersonFilter === sp ? 'active' : ''}`}
//                   onClick={() => setSalespersonFilter(sp)}
//                 >
//                   {sp}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Order Type Filter - RED THEMED */}
//         {uniqueOrderTypes.length > 0 && (
//           <div className="order-type-filter-container">
//             <div className="order-type-filter-header">
//               <Tag size={16} />
//               <span>Filter by Order Type</span>
//             </div>
//             <div className="order-type-buttons">
//               <button
//                 className={`order-type-btn ${orderTypeFilter === '' ? 'active' : ''}`}
//                 onClick={() => setOrderTypeFilter('')}
//               >
//                 All Types
//               </button>
//               {uniqueOrderTypes.map(ot => {
//                 const isActive = orderTypeFilter === ot;
//                 const isOEM = ot === 'OEM';
//                 const isTools = ot === 'TOOLS';
                
//                 return (
//                   <button
//                     key={ot}
//                     className={`
//                       order-type-btn 
//                       ${isActive ? 'active' : ''}
//                       ${isActive && isOEM ? 'oem-active' : ''}
//                       ${isActive && isTools ? 'tools-active' : ''}
//                     `}
//                     onClick={() => setOrderTypeFilter(ot)}
//                   >
//                     {ot}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* Filter Bar */}
//         <div className="filter-container">
//           <div className="filter-header">
//             <div className="filter-title">
//               <Filter size={16} />
//               <span>Date Filter</span>
//             </div>
//             {(periodFilter !== 'all' || salespersonFilter || searchTerm || orderTypeFilter) && (
//               <button className="clear-filter-btn" onClick={resetFilter}>
//                 <X size={13} />
//                 Clear all filters
//               </button>
//             )}
//           </div>
          
//           <div className="filter-body">
//             <div className="filter-group">
//               <label className="filter-label">Time Period</label>
//               <div className="period-buttons">
//                 {PERIOD_OPTIONS.map(option => {
//                   const IconComponent = option.icon;
//                   const isActive = periodFilter === option.value;
//                   return (
//                     <button
//                       key={option.value}
//                       className={`period-btn ${isActive ? 'active' : ''}`}
//                       onClick={() => handlePeriodChange(option.value)}
//                     >
//                       <IconComponent size={14} />
//                       <span>{option.label}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {showDateFilter && (
//               <div className="date-range">
//                 <div className="date-input">
//                   <label className="date-label">From Date</label>
//                   <input
//                     type="date"
//                     className="date-field"
//                     value={dateRange.fromDate}
//                     onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
//                   />
//                 </div>
//                 <div className="date-input">
//                   <label className="date-label">To Date</label>
//                   <input
//                     type="date"
//                     className="date-field"
//                     value={dateRange.toDate}
//                     onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Active Filters Display */}
//         {(salespersonFilter || searchTerm || periodFilter !== 'all' || orderTypeFilter) && (
//           <div className="active-filters">
//             <span className="active-filters-label">Active Filters:</span>
//             {salespersonFilter && (
//               <span className="active-filter-tag">
//                 Salesperson: {salespersonFilter}
//                 <button onClick={() => setSalespersonFilter('')}><X size={12} /></button>
//               </span>
//             )}
//             {orderTypeFilter && (
//               <span className={`active-filter-tag order-type-tag ${orderTypeFilter === 'OEM' ? 'oem-tag' : ''}`}>
//                 Order Type: {orderTypeFilter}
//                 <button onClick={() => setOrderTypeFilter('')}><X size={12} /></button>
//               </span>
//             )}
//             {searchTerm && (
//               <span className="active-filter-tag">
//                 Search: {searchTerm}
//                 <button onClick={() => setSearchTerm('')}><X size={12} /></button>
//               </span>
//             )}
//             {periodFilter !== 'all' && periodFilter !== 'custom' && (
//               <span className="active-filter-tag">
//                 Period: {PERIOD_OPTIONS.find(p => p.value === periodFilter)?.label}
//                 <button onClick={() => setPeriodFilter('all')}><X size={12} /></button>
//               </span>
//             )}
//             {periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate) && (
//               <span className="active-filter-tag">
//                 Custom: {dateRange.fromDate || 'Start'} - {dateRange.toDate || 'End'}
//                 <button onClick={() => {
//                   setPeriodFilter('all');
//                   setDateRange({ fromDate: '', toDate: '' });
//                   setShowDateFilter(false);
//                 }}><X size={12} /></button>
//               </span>
//             )}
//           </div>
//         )}

//         {/* Stats Overview */}
//         <div className="stats-grid">
//           {[
//             { label: 'Invoices', value: filteredInvoices.length, color: '#3b82f6' },
//             { label: 'Sales Returns', value: filteredSalesReturns.length, color: '#ef4444' },
//             { label: 'Purchase Returns', value: filteredPurchaseReturns.length, color: '#f59e0b' },
//             { label: 'Products', value: products.length, color: '#10b981' },
//             { label: 'Customers', value: customers.length, color: '#8b5cf6' }
//           ].map(stat => (
//             <div key={stat.label} className="stat-card">
//               <div className="stat-card-header">
//                 <span className="stat-card-label">{stat.label}</span>
//                 <span className="stat-card-dot" style={{ background: stat.color }}></span>
//               </div>
//               <div className="stat-card-value">{stat.value.toLocaleString()}</div>
//             </div>
//           ))}
//         </div>

//         {/* Export Cards Grid */}
//         <div className="cards-grid">
//           {REPORT_OPTIONS.map((report, idx) => {
//             const Icon = report.icon;
//             const isLoading = getLoadingState(report.id);
//             const dataCount = getDataCount(report.id);
//             const isEmpty = !isLoading && dataCount === 0;

//             const showFilterIndicator = (report.id === 'invoices' || report.id === 'salesReturns') && 
//               (salespersonFilter || orderTypeFilter);

//             return (
//               <div key={report.id} className="export-card" style={{ animationDelay: `${idx * 0.05}s` }}>
//                 <div className="card-header">
//                   <div className="card-icon" style={{ background: report.bgLight, color: report.color }}>
//                     <Icon size={22} />
//                   </div>
//                   <div className="card-info">
//                     <h3 className="card-title">
//                       {report.title}
//                       {showFilterIndicator && (
//                         <span className="filter-badge" style={{ background: report.color }}>
//                           {salespersonFilter || orderTypeFilter}
//                         </span>
//                       )}
//                     </h3>
//                     <p className="card-description">{report.description}</p>
//                   </div>
//                 </div>

//                 <div className="card-stats">
//                   <div className="stats-row">
//                     <span className="stats-label">Available Records</span>
//                     <span className="stats-number" style={{ color: report.color }}>
//                       {isLoading ? '...' : dataCount.toLocaleString()}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="card-actions">
//                   <button
//                     className="view-data-btn"
//                     style={{ borderColor: report.color, color: report.color }}
//                     onClick={() => handleViewData(report.id)}
//                     disabled={isLoading || isEmpty}
//                   >
//                     <Eye size={15} />
//                     View Data
//                   </button>

//                   <div className="export-buttons">
//                     {report.types.map((type) => {
//                       const isExp = exporting === `${report.id}-${type.id}`;
//                       return (
//                         <button
//                           key={type.id}
//                           className={`export-btn ${isExp ? 'exporting' : ''}`}
//                           style={{ borderColor: report.color, color: report.color }}
//                           onClick={() => handleExport(report.id, type.id)}
//                           disabled={!!exporting || isLoading || isEmpty}
//                         >
//                           <Download size={14} className={isExp ? 'spin' : ''} />
//                           <div className="export-btn-text">
//                             <div className="export-btn-name">{type.name}</div>
//                             <div className="export-btn-desc">{type.description}</div>
//                           </div>
//                         </button>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 {isEmpty && (
//                   <div className="card-empty">
//                     <AlertCircle size={14} />
//                     <span>No data available with current filters</span>
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