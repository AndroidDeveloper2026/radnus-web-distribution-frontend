// src/pages/Reports/ExcelExportScreen.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { 
  Download, 
  FileText, 
  Package, 
  Users, 
  ShoppingCart,
  TrendingUp,
  Calendar,
  X,
  CheckCircle,
  Eye,
  AlertCircle,
  Filter,
  CalendarDays,
  Sun,
  ChevronLeft,
  CalendarRange,
  BarChart3,
  Clock,
  Search,
  UserCheck
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
// HELPER: Sort data by date (oldest first)
// ============================================
const sortDataByDate = (data, reportId) => {
  if (!data || data.length === 0) return data;
  
  const getDateField = (item) => {
    switch(reportId) {
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
    
    // Handle invalid dates
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    // Ascending: oldest first
    return dateA - dateB;
  });
};

const ExcelExportScreen = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useSelector((state) => state.auth);
  
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
  
  const [dateRange, setDateRange] = useState({ fromDate: '', toDate: '' });
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedModal, setSelectedModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [uniqueSalespersons, setUniqueSalespersons] = useState([]);

  const reportOptions = [
    {
      id: 'invoices',
      title: 'Invoices',
      icon: FileText,
      color: '#3b82f6',
      bgLight: '#eff6ff',
      description: 'Invoice details with customer info and payment modes',
      types: [
        { id: 'summary', name: 'Summary Report', description: 'Basic invoice information' },
        { id: 'detailed', name: 'Detailed Report', description: 'Invoice with item-wise details' }
      ]
    },
    {
      id: 'salesReturns',
      title: 'Sales Returns',
      icon: TrendingUp,
      color: '#ef4444',
      bgLight: '#fef2f2',
      description: 'Sales return records with customer details',
      types: [
        { id: 'summary', name: 'Summary Report', description: 'Basic return information' },
        { id: 'detailed', name: 'Detailed Report', description: 'Returns with item-wise details' }
      ]
    },
    {
      id: 'purchaseReturns',
      title: 'Purchase Returns',
      icon: ShoppingCart,
      color: '#f59e0b',
      bgLight: '#fffbeb',
      description: 'Purchase return records with supplier details',
      types: [
        { id: 'summary', name: 'Summary Report', description: 'Basic purchase return information' }
      ]
    },
    {
      id: 'products',
      title: 'Products',
      icon: Package,
      color: '#10b981',
      bgLight: '#ecfdf5',
      description: 'Product catalog with pricing and inventory',
      types: [
        { id: 'summary', name: 'Products Report', description: 'Complete product list' }
      ]
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      color: '#8b5cf6',
      bgLight: '#f5f3ff',
      description: 'Customer database with contact details',
      types: [
        { id: 'summary', name: 'Customers Report', description: 'Complete customer list' }
      ]
    }
  ];

  const periodOptions = [
    { value: 'all', label: 'All Time', icon: CalendarDays },
    { value: 'today', label: 'Today', icon: Sun },
    { value: 'yesterday', label: 'Yesterday', icon: ChevronLeft },
    { value: 'last7days', label: 'Last 7 Days', icon: CalendarRange },
    { value: 'thisWeek', label: 'This Week', icon: BarChart3 },
    { value: 'lastWeek', label: 'Last Week', icon: Clock },
    { value: 'thisMonth', label: 'This Month', icon: Calendar },
    { value: 'lastMonth', label: 'Last Month', icon: CalendarDays },
    { value: 'custom', label: 'Custom Range', icon: Filter },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  // Extract unique salespersons when invoices data changes
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      const salespersons = [...new Set(invoices
        .map(inv => inv.salesperson)
        .filter(sp => sp && sp.trim() !== '')
      )].sort();
      setUniqueSalespersons(salespersons);
    }
  }, [invoices]);

  const fetchAllData = async () => {
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
  };

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
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        const lw = new Date(now);
        lw.setDate(now.getDate() - 7);
        start.setDate(lw.getDate() - lw.getDay());
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

  const filterDataByDate = (data) => {
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
  };

  // Apply salesperson filter to data
  const filterDataBySalesperson = (data, reportType) => {
    if (!salespersonFilter || salespersonFilter === '') return data;
    
    if (reportType === 'invoices') {
      return data.filter(item => item.salesperson === salespersonFilter);
    }
    
    if (reportType === 'salesReturns') {
      return data.filter(item => item.salesperson === salespersonFilter);
    }
    
    return data;
  };

  const applyAllFilters = (data, reportType) => {
    let filtered = data;
    
    if (reportType !== 'products' && reportType !== 'customers') {
      filtered = filterDataByDate(filtered);
    }
    
    filtered = filterDataBySalesperson(filtered, reportType);
    
    if (reportType === 'invoices' && searchTerm) {
      filtered = filtered.filter(inv => 
        inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.salesperson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getRawData = (reportId) => {
    switch(reportId) {
      case 'invoices': return invoices;
      case 'salesReturns': return salesReturns;
      case 'purchaseReturns': return purchaseReturns;
      case 'products': return products;
      case 'customers': return customers;
      default: return [];
    }
  };

  const getDataCount = (reportId) => {
    const raw = getRawData(reportId);
    const filtered = applyAllFilters([...raw], reportId);
    return filtered.length;
  };

  const getLoadingState = (reportId) => {
    return loading[reportId] || false;
  };

  // ============================================
  // VIEW DATA - with sorting applied
  // ============================================
  const handleViewData = (reportId) => {
    const raw = getRawData(reportId);
    const data = applyAllFilters([...raw], reportId);
    // Sort data - oldest first
    const sortedData = sortDataByDate(data, reportId);
    const report = reportOptions.find(r => r.id === reportId);
    setModalData(sortedData);
    setModalTitle(`${report?.title} Data ${salespersonFilter ? `- ${salespersonFilter}` : ''}`);
    setSelectedModal(reportId);
    setCurrentPage(1);
  };

  // ============================================
  // EXPORT - with sorting applied
  // ============================================
  const handleExport = async (reportId, type) => {
    setExporting(`${reportId}-${type}`);
    setSuccessMessage('');
    
    try {
      const raw = getRawData(reportId);
      let filtered = applyAllFilters([...raw], reportId);
      // Sort data - oldest first
      const sortedData = sortDataByDate(filtered, reportId);

      switch(reportId) {
        case 'invoices':
          if (type === 'summary') {
            exportInvoicesToExcel(sortedData, `Invoices_Summary${salespersonFilter ? `_${salespersonFilter}` : ''}`);
          } else {
            exportInvoiceItemsToExcel(sortedData, `Invoices_Detailed${salespersonFilter ? `_${salespersonFilter}` : ''}`);
          }
          break;
        case 'salesReturns':
          if (type === 'summary') {
            exportSalesReturnsToExcel(sortedData, `Sales_Returns_Summary${salespersonFilter ? `_${salespersonFilter}` : ''}`);
          } else {
            exportSalesReturnItemsToExcel(sortedData, `Sales_Returns_Detailed${salespersonFilter ? `_${salespersonFilter}` : ''}`);
          }
          break;
        case 'purchaseReturns':
          exportPurchaseReturnsToExcel(sortedData, `Purchase_Returns_Report`);
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
      
      const title = reportOptions.find(r => r.id === reportId)?.title;
      setSuccessMessage(`${title} exported successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handlePeriodChange = (period) => {
    setPeriodFilter(period);
    if (period !== 'custom') {
      setDateRange({ fromDate: '', toDate: '' });
      setShowDateFilter(false);
    } else {
      setShowDateFilter(true);
    }
  };

  const resetFilter = () => {
    setPeriodFilter('all');
    setDateRange({ fromDate: '', toDate: '' });
    setShowDateFilter(false);
    setSearchTerm('');
    setSalespersonFilter('');
  };

  // Get filtered invoices for stats display
  const filteredInvoices = applyAllFilters([...invoices], 'invoices');
  const filteredSalesReturns = applyAllFilters([...salesReturns], 'salesReturns');
  const filteredPurchaseReturns = applyAllFilters([...purchaseReturns], 'purchaseReturns');

  const totalRecords = filteredInvoices.length + filteredSalesReturns.length + 
    filteredPurchaseReturns.length + products.length + customers.length;

  const handleViewDetails = (item) => {
    console.log('View details:', item);
    alert('View details functionality can be implemented here');
  };

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
            <p className="page-subtitle">Export your data to Excel format with just a few clicks</p>
          </div>
          <div className="total-stats-card">
            <div className="total-stats-value">{totalRecords.toLocaleString()}</div>
            <div className="total-stats-label">Filtered Records</div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="search-container">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search invoices by customer name, invoice number, or salesperson..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="search-clear">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Salesperson Filter */}
        {uniqueSalespersons.length > 0 && (
          <div className="salesperson-filter-container">
            <div className="salesperson-filter-header">
              <UserCheck size={16} />
              <span>Filter by Salesperson</span>
            </div>
            <div className="salesperson-buttons">
              <button
                className={`salesperson-btn ${salespersonFilter === '' ? 'active' : ''}`}
                onClick={() => setSalespersonFilter('')}
              >
                All Salespersons
              </button>
              {uniqueSalespersons.map(sp => (
                <button
                  key={sp}
                  className={`salesperson-btn ${salespersonFilter === sp ? 'active' : ''}`}
                  onClick={() => setSalespersonFilter(sp)}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="filter-container">
          <div className="filter-header">
            <div className="filter-title">
              <Filter size={16} />
              <span>Date Filter</span>
            </div>
            {(periodFilter !== 'all' || salespersonFilter || searchTerm) && (
              <button className="clear-filter-btn" onClick={resetFilter}>
                <X size={13} />
                Clear all filters
              </button>
            )}
          </div>
          
          <div className="filter-body">
            <div className="filter-group">
              <label className="filter-label">Time Period</label>
              <div className="period-buttons">
                {periodOptions.map(option => {
                  const IconComponent = option.icon;
                  const isActive = periodFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      className={`period-btn ${isActive ? 'active' : ''}`}
                      onClick={() => handlePeriodChange(option.value)}
                    >
                      <IconComponent size={14} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {showDateFilter && (
              <div className="date-range">
                <div className="date-input">
                  <label className="date-label">From Date</label>
                  <input
                    type="date"
                    className="date-field"
                    value={dateRange.fromDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
                <div className="date-input">
                  <label className="date-label">To Date</label>
                  <input
                    type="date"
                    className="date-field"
                    value={dateRange.toDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(salespersonFilter || searchTerm || periodFilter !== 'all') && (
          <div className="active-filters">
            <span className="active-filters-label">Active Filters:</span>
            {salespersonFilter && (
              <span className="active-filter-tag">
                Salesperson: {salespersonFilter}
                <button onClick={() => setSalespersonFilter('')}><X size={12} /></button>
              </span>
            )}
            {searchTerm && (
              <span className="active-filter-tag">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')}><X size={12} /></button>
              </span>
            )}
            {periodFilter !== 'all' && periodFilter !== 'custom' && (
              <span className="active-filter-tag">
                Period: {periodOptions.find(p => p.value === periodFilter)?.label}
                <button onClick={() => setPeriodFilter('all')}><X size={12} /></button>
              </span>
            )}
            {periodFilter === 'custom' && (dateRange.fromDate || dateRange.toDate) && (
              <span className="active-filter-tag">
                Custom: {dateRange.fromDate || 'Start'} - {dateRange.toDate || 'End'}
                <button onClick={() => {
                  setPeriodFilter('all');
                  setDateRange({ fromDate: '', toDate: '' });
                  setShowDateFilter(false);
                }}><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        {/* Stats Overview */}
        <div className="stats-grid">
          {[
            { label: 'Invoices', value: filteredInvoices.length, color: '#3b82f6' },
            { label: 'Sales Returns', value: filteredSalesReturns.length, color: '#ef4444' },
            { label: 'Purchase Returns', value: filteredPurchaseReturns.length, color: '#f59e0b' },
            { label: 'Products', value: products.length, color: '#10b981' },
            { label: 'Customers', value: customers.length, color: '#8b5cf6' }
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">{stat.label}</span>
                <span className="stat-card-dot" style={{ background: stat.color }}></span>
              </div>
              <div className="stat-card-value">{stat.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Export Cards Grid */}
        <div className="cards-grid">
          {reportOptions.map((report, idx) => {
            const Icon = report.icon;
            const isLoading = getLoadingState(report.id);
            const dataCount = getDataCount(report.id);
            const isEmpty = !isLoading && dataCount === 0;

            const showFilterIndicator = (report.id === 'invoices' || report.id === 'salesReturns') && salespersonFilter;

            return (
              <div key={report.id} className="export-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="card-header">
                  <div className="card-icon" style={{ background: report.bgLight, color: report.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">
                      {report.title}
                      {showFilterIndicator && (
                        <span className="filter-badge" style={{ background: report.color }}>
                          {salespersonFilter}
                        </span>
                      )}
                    </h3>
                    <p className="card-description">{report.description}</p>
                  </div>
                </div>

                <div className="card-stats">
                  <div className="stats-row">
                    <span className="stats-label">Available Records</span>
                    <span className="stats-number" style={{ color: report.color }}>
                      {isLoading ? '...' : dataCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="view-data-btn"
                    style={{ borderColor: report.color, color: report.color }}
                    onClick={() => handleViewData(report.id)}
                    disabled={isLoading || isEmpty}
                  >
                    <Eye size={15} />
                    View Data
                  </button>

                  <div className="export-buttons">
                    {report.types.map((type) => {
                      const isExp = exporting === `${report.id}-${type.id}`;
                      return (
                        <button
                          key={type.id}
                          className={`export-btn ${isExp ? 'exporting' : ''}`}
                          style={{ borderColor: report.color, color: report.color }}
                          onClick={() => handleExport(report.id, type.id)}
                          disabled={!!exporting || isLoading || isEmpty}
                        >
                          <Download size={14} className={isExp ? 'spin' : ''} />
                          <div className="export-btn-text">
                            <div className="export-btn-name">{type.name}</div>
                            <div className="export-btn-desc">{type.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isEmpty && (
                  <div className="card-empty">
                    <AlertCircle size={14} />
                    <span>No data available with current filters</span>
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

// //--------------------------------------

// // src/pages/Reports/ExcelExportScreen.js
// import React, { useState, useEffect } from 'react';
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
//   UserCheck
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

// const ExcelExportScreen = () => {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';
//   const { user } = useSelector((state) => state.auth);
  
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
//   const [uniqueSalespersons, setUniqueSalespersons] = useState([]);

//   const reportOptions = [
//     {
//       id: 'invoices',
//       title: 'Invoices',
//       icon: FileText,
//       color: '#3b82f6',
//       bgLight: '#eff6ff',
//       description: 'Invoice details with customer info and payment modes',
//       types: [
//         { id: 'summary', name: 'Summary Report', description: 'Basic invoice information' },
//         { id: 'detailed', name: 'Detailed Report', description: 'Invoice with item-wise details' }
//       ]
//     },
//     {
//       id: 'salesReturns',
//       title: 'Sales Returns',
//       icon: TrendingUp,
//       color: '#ef4444',
//       bgLight: '#fef2f2',
//       description: 'Sales return records with customer details',
//       types: [
//         { id: 'summary', name: 'Summary Report', description: 'Basic return information' },
//         { id: 'detailed', name: 'Detailed Report', description: 'Returns with item-wise details' }
//       ]
//     },
//     {
//       id: 'purchaseReturns',
//       title: 'Purchase Returns',
//       icon: ShoppingCart,
//       color: '#f59e0b',
//       bgLight: '#fffbeb',
//       description: 'Purchase return records with supplier details',
//       types: [
//         { id: 'summary', name: 'Summary Report', description: 'Basic purchase return information' }
//       ]
//     },
//     {
//       id: 'products',
//       title: 'Products',
//       icon: Package,
//       color: '#10b981',
//       bgLight: '#ecfdf5',
//       description: 'Product catalog with pricing and inventory',
//       types: [
//         { id: 'summary', name: 'Products Report', description: 'Complete product list' }
//       ]
//     },
//     {
//       id: 'customers',
//       title: 'Customers',
//       icon: Users,
//       color: '#8b5cf6',
//       bgLight: '#f5f3ff',
//       description: 'Customer database with contact details',
//       types: [
//         { id: 'summary', name: 'Customers Report', description: 'Complete customer list' }
//       ]
//     }
//   ];

//   const periodOptions = [
//     { value: 'all', label: 'All Time', icon: CalendarDays },
//     { value: 'today', label: 'Today', icon: Sun },
//     { value: 'yesterday', label: 'Yesterday', icon: ChevronLeft },
//     { value: 'last7days', label: 'Last 7 Days', icon: CalendarRange },
//     { value: 'thisWeek', label: 'This Week', icon: BarChart3 },
//     { value: 'lastWeek', label: 'Last Week', icon: Clock },
//     { value: 'thisMonth', label: 'This Month', icon: Calendar },
//     { value: 'lastMonth', label: 'Last Month', icon: CalendarDays },
//     { value: 'custom', label: 'Custom Range', icon: Filter },
//   ];

//   useEffect(() => {
//     fetchAllData();
//   }, []);

//   // Extract unique salespersons when invoices data changes
//   useEffect(() => {
//     if (invoices && invoices.length > 0) {
//       const salespersons = [...new Set(invoices
//         .map(inv => inv.salesperson)
//         .filter(sp => sp && sp.trim() !== '')
//       )].sort();
//       setUniqueSalespersons(salespersons);
//     }
//   }, [invoices]);

//   const fetchAllData = async () => {
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
//   };

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
//         break;
//       case 'thisWeek':
//         start.setDate(now.getDate() - now.getDay());
//         start.setHours(0, 0, 0, 0);
//         end.setDate(start.getDate() + 6);
//         end.setHours(23, 59, 59, 999);
//         break;
//       case 'lastWeek':
//         const lw = new Date(now);
//         lw.setDate(now.getDate() - 7);
//         start.setDate(lw.getDate() - lw.getDay());
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

//   const filterDataByDate = (data) => {
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
//   };

//   // Apply salesperson filter to data
//   const filterDataBySalesperson = (data, reportType) => {
//     if (!salespersonFilter || salespersonFilter === '') return data;
    
//     if (reportType === 'invoices') {
//       return data.filter(item => item.salesperson === salespersonFilter);
//     }
    
//     if (reportType === 'salesReturns') {
//       return data.filter(item => item.salesperson === salespersonFilter);
//     }
    
//     return data;
//   };

//   const applyAllFilters = (data, reportType) => {
//     let filtered = data;
    
//     if (reportType !== 'products' && reportType !== 'customers') {
//       filtered = filterDataByDate(filtered);
//     }
    
//     filtered = filterDataBySalesperson(filtered, reportType);
    
//     if (reportType === 'invoices' && searchTerm) {
//       filtered = filtered.filter(inv => 
//         inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         inv.salesperson?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
    
//     return filtered;
//   };

//   const getRawData = (reportId) => {
//     switch(reportId) {
//       case 'invoices': return invoices;
//       case 'salesReturns': return salesReturns;
//       case 'purchaseReturns': return purchaseReturns;
//       case 'products': return products;
//       case 'customers': return customers;
//       default: return [];
//     }
//   };

//   const getDataCount = (reportId) => {
//     const raw = getRawData(reportId);
//     const filtered = applyAllFilters([...raw], reportId);
//     return filtered.length;
//   };

//   const getLoadingState = (reportId) => {
//     return loading[reportId] || false;
//   };

//   const handleViewData = (reportId) => {
//     const raw = getRawData(reportId);
//     const data = applyAllFilters([...raw], reportId);
//     const report = reportOptions.find(r => r.id === reportId);
//     setModalData(data);
//     setModalTitle(`${report?.title} Data ${salespersonFilter ? `- ${salespersonFilter}` : ''}`);
//     setSelectedModal(reportId);
//     setCurrentPage(1);
//   };

//   const handleExport = async (reportId, type) => {
//     setExporting(`${reportId}-${type}`);
//     setSuccessMessage('');
    
//     try {
//       const raw = getRawData(reportId);
//       const filtered = applyAllFilters([...raw], reportId);

//       switch(reportId) {
//         case 'invoices':
//           if (type === 'summary') {
//             exportInvoicesToExcel(filtered, `Invoices_Summary${salespersonFilter ? `_${salespersonFilter}` : ''}`);
//           } else {
//             exportInvoiceItemsToExcel(filtered, `Invoices_Detailed${salespersonFilter ? `_${salespersonFilter}` : ''}`);
//           }
//           break;
//         case 'salesReturns':
//           if (type === 'summary') {
//             exportSalesReturnsToExcel(filtered, `Sales_Returns_Summary${salespersonFilter ? `_${salespersonFilter}` : ''}`);
//           } else {
//             exportSalesReturnItemsToExcel(filtered, `Sales_Returns_Detailed${salespersonFilter ? `_${salespersonFilter}` : ''}`);
//           }
//           break;
//         case 'purchaseReturns':
//           exportPurchaseReturnsToExcel(filtered, `Purchase_Returns_Report`);
//           break;
//         case 'products':
//           exportProductsToExcel(filtered, `Products_Report`);
//           break;
//         case 'customers':
//           exportCustomersToExcel(filtered, `Customers_Report`);
//           break;
//         default:
//           break;
//       }
      
//       const title = reportOptions.find(r => r.id === reportId)?.title;
//       setSuccessMessage(`${title} exported successfully!`);
//       setTimeout(() => setSuccessMessage(''), 3000);
//     } catch (error) {
//       console.error('Export error:', error);
//       alert('Failed to export data. Please try again.');
//     } finally {
//       setExporting(null);
//     }
//   };

//   const handlePeriodChange = (period) => {
//     setPeriodFilter(period);
//     if (period !== 'custom') {
//       setDateRange({ fromDate: '', toDate: '' });
//       setShowDateFilter(false);
//     } else {
//       setShowDateFilter(true);
//     }
//   };

//   const resetFilter = () => {
//     setPeriodFilter('all');
//     setDateRange({ fromDate: '', toDate: '' });
//     setShowDateFilter(false);
//     setSearchTerm('');
//     setSalespersonFilter('');
//   };

//   // Get filtered invoices for stats display
//   const filteredInvoices = applyAllFilters([...invoices], 'invoices');
//   const filteredSalesReturns = applyAllFilters([...salesReturns], 'salesReturns');
//   const filteredPurchaseReturns = applyAllFilters([...purchaseReturns], 'purchaseReturns');

//   const totalRecords = filteredInvoices.length + filteredSalesReturns.length + 
//     filteredPurchaseReturns.length + products.length + customers.length;

//   const handleViewDetails = (item) => {
//     console.log('View details:', item);
//     // You can add navigation or open a details modal here
//     alert('View details functionality can be implemented here');
//   };

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
//               placeholder="Search invoices by customer name, invoice number, or salesperson..."
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

//         {/* Filter Bar */}
//         <div className="filter-container">
//           <div className="filter-header">
//             <div className="filter-title">
//               <Filter size={16} />
//               <span>Date Filter</span>
//             </div>
//             {(periodFilter !== 'all' || salespersonFilter || searchTerm) && (
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
//                 {periodOptions.map(option => {
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
//         {(salespersonFilter || searchTerm || periodFilter !== 'all') && (
//           <div className="active-filters">
//             <span className="active-filters-label">Active Filters:</span>
//             {salespersonFilter && (
//               <span className="active-filter-tag">
//                 Salesperson: {salespersonFilter}
//                 <button onClick={() => setSalespersonFilter('')}><X size={12} /></button>
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
//                 Period: {periodOptions.find(p => p.value === periodFilter)?.label}
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
//           {reportOptions.map((report, idx) => {
//             const Icon = report.icon;
//             const isLoading = getLoadingState(report.id);
//             const dataCount = getDataCount(report.id);
//             const isEmpty = !isLoading && dataCount === 0;

//             const showFilterIndicator = (report.id === 'invoices' || report.id === 'salesReturns') && salespersonFilter;

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
//                           {salespersonFilter}
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