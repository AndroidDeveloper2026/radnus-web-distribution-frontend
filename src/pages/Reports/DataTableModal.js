// src/pages/Reports/DataTableModal.js
import React from 'react';
import ReactDOM from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight, MoreVertical, Eye, FileText, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import './DataTableModal.css';

// ============================================
// HELPER: Sort data by date (oldest first)
// ============================================
const sortDataByDate = (data, reportType) => {
  if (!data || data.length === 0) return data;
  
  const getDateField = (item) => {
    switch(reportType) {
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
    return dateA - dateB;  // Oldest first
  });
};

const DataTableModal = ({
  isOpen, onClose, title, data, reportType,
  currentPage, itemsPerPage, onPageChange, onExport, onViewDetails
}) => {
  if (!isOpen) return null;

  // Sort data - oldest first
  const sortedData = sortDataByDate(data, reportType);
  
  const safeData = Array.isArray(sortedData) ? sortedData : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeData.length / itemsPerPage);
  const showingFrom = safeData.length === 0 ? 0 : indexOfFirstItem + 1;
  const showingTo = Math.min(indexOfLastItem, safeData.length);

  // Calculate summary stats
  const totalAmount = safeData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const paidAmount = safeData.filter(item => item.status?.toLowerCase() === 'paid' || item.status?.toLowerCase() === 'completed')
    .reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const pendingAmount = safeData.filter(item => item.status?.toLowerCase() === 'pending')
    .reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const overdueAmount = safeData.filter(item => item.status?.toLowerCase() === 'overdue')
    .reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

  const getColumns = () => {
    switch (reportType) {
      case 'invoices':
        return [
          { key: 'sno', label: 'S.No', width: '60px' },
          { key: 'invoiceDate', label: 'Invoice Date', width: '105px' },
          { key: 'invoiceNumber', label: 'Invoice Number', width: '130px' },
          { key: 'salesperson', label: 'Salesperson', width: '130px' },
          { key: 'referenceNo', label: 'Reference No', width: '110px' },
          { key: 'billerName', label: 'Biller Name', width: '140px' },
          { key: 'customerName', label: 'Customer Name', width: '150px' },
          { key: 'customerType', label: 'Customer Type', width: '110px' },
          { key: 'shopName', label: 'Shop Name', width: '140px' },
          { key: 'phoneNumber', label: 'Phone Number', width: '120px' },
          { key: 'address', label: 'Address', width: '180px' },
          { key: 'paymentMode', label: 'Payment Mode', width: '120px' },
          { key: 'subtotal', label: 'Subtotal', width: '100px' },
          { key: 'discount', label: 'Discount', width: '95px' },
          { key: 'courierCharge', label: 'Courier Charge', width: '110px' },
          { key: 'totalAmount', label: 'Total Amount', width: '115px' },
          { key: 'status', label: 'Status', width: '95px' },
          { key: 'createdAt', label: 'Created At', width: '110px' },
          { key: '_actions', label: 'Actions', width: '80px' },
        ];
      case 'salesReturns':
        return [
          { key: 'sno', label: 'S.No', width: '60px' },
          { key: 'returnNumber', label: 'Return Number', width: '150px' },
          { key: 'createdAt', label: 'Return Date', width: '110px' },
          { key: 'salesperson', label: 'Salesperson', width: '130px' },
          { key: 'customerName', label: 'Customer Name', width: '150px' },
          { key: 'referenceInvoice', label: 'Reference Invoice', width: '140px' },
          { key: 'totalAmount', label: 'Total Amount', width: '115px' },
          { key: 'reason', label: 'Reason', width: '200px' },
          { key: 'status', label: 'Status', width: '95px' },
          { key: '_actions', label: 'Actions', width: '80px' },
        ];
      case 'purchaseReturns':
        return [
          { key: 'sno', label: 'S.No', width: '60px' },
          { key: 'returnNumber', label: 'Return Number', width: '150px' },
          { key: 'createdAt', label: 'Return Date', width: '110px' },
          { key: 'supplierName', label: 'Supplier Name', width: '150px' },
          { key: 'referencePO', label: 'Reference PO', width: '140px' },
          { key: 'totalAmount', label: 'Total Amount', width: '115px' },
          { key: 'reason', label: 'Reason', width: '200px' },
          { key: 'status', label: 'Status', width: '95px' },
          { key: '_actions', label: 'Actions', width: '80px' },
        ];
      case 'products':
        return [
          { key: 'sno', label: 'S.No', width: '60px' },
          { key: 'name', label: 'Product Name', width: '200px' },
          { key: 'sku', label: 'SKU', width: '120px' },
          { key: 'category', label: 'Category', width: '120px' },
          { key: 'mrp', label: 'MRP', width: '100px' },
          { key: 'distributorPrice', label: 'Distributor Price', width: '130px' },
          { key: 'retailerPrice', label: 'Retailer Price', width: '115px' },
          { key: 'walkinPrice', label: 'Walk-in Price', width: '110px' },
          { key: 'itemCost', label: 'Item Cost', width: '100px' },
          { key: 'gst', label: 'GST (%)', width: '80px' },
          { key: 'moq', label: 'MOQ', width: '80px' },
          { key: 'batchNo', label: 'Batch No', width: '110px' },
          { key: 'rackNo', label: 'Rack No', width: '95px' },
          { key: 'vendorName', label: 'Vendor Name', width: '140px' },
          { key: 'status', label: 'Status', width: '95px' },
          { key: 'createdAt', label: 'Created At', width: '110px' },
          { key: '_actions', label: 'Actions', width: '80px' },
        ];
      case 'customers':
        return [
          { key: 'sno', label: 'S.No', width: '60px' },
          { key: 'name', label: 'Name', width: '150px' },
          { key: 'phone', label: 'Phone', width: '120px' },
          { key: 'type', label: 'Type', width: '95px' },
          { key: 'shopName', label: 'Shop Name', width: '150px' },
          { key: 'address', label: 'Address', width: '200px' },
          { key: 'city', label: 'City', width: '100px' },
          { key: 'state', label: 'State', width: '100px' },
          { key: 'createdAt', label: 'Created At', width: '110px' },
          { key: '_actions', label: 'Actions', width: '80px' },
        ];
      default:
        return [];
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0.00';
    const num = Number(value);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBadgeClass = (status) => {
    if (!status) return 'dtm-default';
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'paid') return 'dtm-paid';
    if (s === 'pending') return 'dtm-pending';
    if (s === 'overdue') return 'dtm-overdue';
    if (s === 'active') return 'dtm-active';
    if (s === 'inactive') return 'dtm-inactive';
    return 'dtm-default';
  };

  const getStatusLabel = (status) => {
    if (!status) return '—';
    const s = status.toLowerCase();
    if (s === 'completed') return 'Completed';
    if (s === 'paid') return 'Paid';
    if (s === 'pending') return 'Pending';
    if (s === 'overdue') return 'Overdue';
    if (s === 'active') return 'Active';
    if (s === 'inactive') return 'Inactive';
    return status;
  };

  const getCustomerTypeLabel = (type) => {
    if (!type) return '—';
    return type === 'shop' ? 'Shop' : 'Customer';
  };

  const renderCell = (item, key, index) => {
    if (key === '_actions') {
      return (
        <div className="dtm-action-buttons">
          <button 
            className="dtm-view-btn" 
            title="View Details"
            onClick={() => onViewDetails && onViewDetails(item)}
          >
            <Eye size={14} />
          </button>
          <button className="dtm-dots" title="More Actions">
            <MoreVertical size={14} />
          </button>
        </div>
      );
    }
    
    if (key === 'sno') {
      return index + 1;
    }
    
    if (key === 'status') {
      const val = item[key];
      return val ? (
        <span className={`dtm-badge ${getBadgeClass(val)}`}>
          {getStatusLabel(val)}
        </span>
      ) : '—';
    }
    
    if (key === 'customerType') {
      return getCustomerTypeLabel(item[key]);
    }
    
    if (key === 'createdAt' || key === 'invoiceDate') {
      return formatDate(item[key]);
    }
    
    if (['totalAmount', 'subtotal', 'discount', 'courierCharge', 'mrp', 
         'distributorPrice', 'retailerPrice', 'walkinPrice', 'itemCost'].includes(key)) {
      return formatCurrency(item[key]);
    }
    
    if (key === 'gst' || key === 'moq') {
      const val = item[key];
      return val ? `${val}` : '—';
    }
    
    const value = item[key];
    return value !== null && value !== undefined ? String(value) : '—';
  };

  const columns = getColumns();

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return ReactDOM.createPortal(
    <div className="dtm-overlay" onClick={onClose}>
      <div className="dtm-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dtm-header">
          <div className="dtm-header-content">
            <h2>{title}</h2>
            <p className="dtm-subtitle">Detailed report with all entries (oldest first)</p>
          </div>
          <div className="dtm-actions">
            <button className="dtm-export-btn" onClick={onExport}>
              <Download size={16} /> Export Excel
            </button>
            <button className="dtm-close-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dtm-body">
          <div className="dtm-table-wrap">
            <table className="dtm-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} style={{ minWidth: col.width, width: col.width }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, idx) => (
                    <tr key={idx}>
                      {columns.map(col => (
                        <td key={col.key} title={renderCell(item, col.key, indexOfFirstItem + idx)}>
                          {renderCell(item, col.key, indexOfFirstItem + idx)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="dtm-no-data">
                      <div className="dtm-no-data-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 6h18M9 6v12M15 6v12M5 6h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" />
                        </svg>
                        <p>No data available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="dtm-footer">
          <div className="dtm-pagination-info">
            Showing {showingFrom} to {showingTo} of {safeData.length} entries
          </div>
          <div className="dtm-pagination">
            <div className="dtm-per-page">
              <span>{itemsPerPage} / page</span>
              <ChevronLeft size={14} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <div className="dtm-page-numbers">
              <button
                className="dtm-page-btn dtm-nav-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={15} />
              </button>
              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={idx} className="dtm-page-ellipsis">...</span>
                ) : (
                  <button
                    key={idx}
                    className={`dtm-page-btn ${page === currentPage ? 'dtm-active' : ''}`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              <button
                className="dtm-page-btn dtm-nav-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="dtm-summary">
          <div className="dtm-summary-card">
            <div className="dtm-summary-icon dtm-icon-total">
              <FileText size={20} />
            </div>
            <div className="dtm-summary-content">
              <span className="dtm-summary-label">Total Invoices</span>
              <span className="dtm-summary-value dtm-value-total">{safeData.length.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="dtm-summary-card">
            <div className="dtm-summary-icon dtm-icon-amount">
              <DollarSign size={20} />
            </div>
            <div className="dtm-summary-content">
              <span className="dtm-summary-label">Total Amount</span>
              <span className="dtm-summary-value dtm-value-amount">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="dtm-summary-card">
            <div className="dtm-summary-icon dtm-icon-paid">
              <CheckCircle size={20} />
            </div>
            <div className="dtm-summary-content">
              <span className="dtm-summary-label">Paid Amount</span>
              <span className="dtm-summary-value dtm-value-paid">{formatCurrency(paidAmount)}</span>
            </div>
          </div>
          <div className="dtm-summary-card">
            <div className="dtm-summary-icon dtm-icon-pending">
              <Clock size={20} />
            </div>
            <div className="dtm-summary-content">
              <span className="dtm-summary-label">Pending Amount</span>
              <span className="dtm-summary-value dtm-value-pending">{formatCurrency(pendingAmount)}</span>
            </div>
          </div>
          <div className="dtm-summary-card">
            <div className="dtm-summary-icon dtm-icon-overdue">
              <AlertTriangle size={20} />
            </div>
            <div className="dtm-summary-content">
              <span className="dtm-summary-label">Overdue Amount</span>
              <span className="dtm-summary-value dtm-value-overdue">{formatCurrency(overdueAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DataTableModal;

// //++++++++++++++++++++++++++++++++++++++

// // src/pages/Reports/DataTableModal.js
// import React from 'react';
// import ReactDOM from 'react-dom';
// import { X, Download, ChevronLeft, ChevronRight, MoreVertical, Eye, FileText, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
// import './DataTableModal.css';

// const DataTableModal = ({
//   isOpen, onClose, title, data, reportType,
//   currentPage, itemsPerPage, onPageChange, onExport, onViewDetails
// }) => {
//   if (!isOpen) return null;

//   const safeData = Array.isArray(data) ? data : [];
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = safeData.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(safeData.length / itemsPerPage);
//   const showingFrom = safeData.length === 0 ? 0 : indexOfFirstItem + 1;
//   const showingTo = Math.min(indexOfLastItem, safeData.length);

//   // Calculate summary stats
//   const totalAmount = safeData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
//   const paidAmount = safeData.filter(item => item.status?.toLowerCase() === 'paid').reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
//   const pendingAmount = safeData.filter(item => item.status?.toLowerCase() === 'pending').reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
//   const overdueAmount = safeData.filter(item => item.status?.toLowerCase() === 'overdue').reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

//   const getColumns = () => {
//     switch (reportType) {
//       case 'invoices':
//         return [
//           { key: 'sno', label: 'S.No', width: '60px' },
//           { key: 'invoiceDate', label: 'Invoice Date', width: '105px' },
//           { key: 'invoiceNumber', label: 'Invoice Number', width: '130px' },
//           { key: 'salesperson', label: 'Salesperson', width: '130px' },
//           { key: 'referenceNo', label: 'Reference No', width: '110px' },
//           { key: 'billerName', label: 'Biller Name', width: '140px' },
//           { key: 'customerName', label: 'Customer Name', width: '150px' },
//           { key: 'customerType', label: 'Customer Type', width: '110px' },
//           { key: 'shopName', label: 'Shop Name', width: '140px' },
//           { key: 'phoneNumber', label: 'Phone Number', width: '120px' },
//           { key: 'address', label: 'Address', width: '180px' },
//           { key: 'paymentMode', label: 'Payment Mode', width: '120px' },
//           { key: 'subtotal', label: 'Subtotal', width: '100px' },
//           { key: 'discount', label: 'Discount', width: '95px' },
//           { key: 'courierCharge', label: 'Courier Charge', width: '110px' },
//           { key: 'totalAmount', label: 'Total Amount', width: '115px' },
//           { key: 'status', label: 'Status', width: '95px' },
//           { key: 'createdAt', label: 'Created At', width: '110px' },
//           { key: '_actions', label: 'Actions', width: '80px' },
//         ];
//       case 'salesReturns':
//         return [
//           { key: 'sno', label: 'S.No', width: '60px' },
//           { key: 'returnNumber', label: 'Return Number', width: '150px' },
//           { key: 'createdAt', label: 'Return Date', width: '110px' },
//           { key: 'salesperson', label: 'Salesperson', width: '130px' },
//           { key: 'customerName', label: 'Customer Name', width: '150px' },
//           { key: 'referenceInvoice', label: 'Reference Invoice', width: '140px' },
//           { key: 'totalAmount', label: 'Total Amount', width: '115px' },
//           { key: 'reason', label: 'Reason', width: '200px' },
//           { key: 'status', label: 'Status', width: '95px' },
//           { key: '_actions', label: 'Actions', width: '80px' },
//         ];
//       case 'purchaseReturns':
//         return [
//           { key: 'sno', label: 'S.No', width: '60px' },
//           { key: 'returnNumber', label: 'Return Number', width: '150px' },
//           { key: 'createdAt', label: 'Return Date', width: '110px' },
//           { key: 'supplierName', label: 'Supplier Name', width: '150px' },
//           { key: 'referencePO', label: 'Reference PO', width: '140px' },
//           { key: 'totalAmount', label: 'Total Amount', width: '115px' },
//           { key: 'reason', label: 'Reason', width: '200px' },
//           { key: 'status', label: 'Status', width: '95px' },
//           { key: '_actions', label: 'Actions', width: '80px' },
//         ];
//       case 'products':
//         return [
//           { key: 'sno', label: 'S.No', width: '60px' },
//           { key: 'name', label: 'Product Name', width: '200px' },
//           { key: 'sku', label: 'SKU', width: '120px' },
//           { key: 'category', label: 'Category', width: '120px' },
//           { key: 'mrp', label: 'MRP', width: '100px' },
//           { key: 'distributorPrice', label: 'Distributor Price', width: '130px' },
//           { key: 'retailerPrice', label: 'Retailer Price', width: '115px' },
//           { key: 'walkinPrice', label: 'Walk-in Price', width: '110px' },
//           { key: 'itemCost', label: 'Item Cost', width: '100px' },
//           { key: 'gst', label: 'GST (%)', width: '80px' },
//           { key: 'moq', label: 'MOQ', width: '80px' },
//           { key: 'batchNo', label: 'Batch No', width: '110px' },
//           { key: 'rackNo', label: 'Rack No', width: '95px' },
//           { key: 'vendorName', label: 'Vendor Name', width: '140px' },
//           { key: 'status', label: 'Status', width: '95px' },
//           { key: 'createdAt', label: 'Created At', width: '110px' },
//           { key: '_actions', label: 'Actions', width: '80px' },
//         ];
//       case 'customers':
//         return [
//           { key: 'sno', label: 'S.No', width: '60px' },
//           { key: 'name', label: 'Name', width: '150px' },
//           { key: 'phone', label: 'Phone', width: '120px' },
//           { key: 'type', label: 'Type', width: '95px' },
//           { key: 'shopName', label: 'Shop Name', width: '150px' },
//           { key: 'address', label: 'Address', width: '200px' },
//           { key: 'city', label: 'City', width: '100px' },
//           { key: 'state', label: 'State', width: '100px' },
//           { key: 'createdAt', label: 'Created At', width: '110px' },
//           { key: '_actions', label: 'Actions', width: '80px' },
//         ];
//       default:
//         return [];
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return '—';
//     const d = new Date(date);
//     if (isNaN(d.getTime())) return '—';
//     return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
//   };

//   const formatCurrency = (value) => {
//     if (value === null || value === undefined) return '₹0.00';
//     const num = Number(value);
//     if (isNaN(num)) return '₹0.00';
//     return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//   };

//   const getBadgeClass = (status) => {
//     if (!status) return 'dtm-default';
//     const s = status.toLowerCase();
//     if (s === 'completed' || s === 'paid') return 'dtm-paid';
//     if (s === 'pending') return 'dtm-pending';
//     if (s === 'overdue') return 'dtm-overdue';
//     if (s === 'active') return 'dtm-active';
//     if (s === 'inactive') return 'dtm-inactive';
//     return 'dtm-default';
//   };

//   const getStatusLabel = (status) => {
//     if (!status) return '—';
//     const s = status.toLowerCase();
//     if (s === 'completed') return 'Completed';
//     if (s === 'paid') return 'Paid';
//     if (s === 'pending') return 'Pending';
//     if (s === 'overdue') return 'Overdue';
//     if (s === 'active') return 'Active';
//     if (s === 'inactive') return 'Inactive';
//     return status;
//   };

//   const getCustomerTypeLabel = (type) => {
//     if (!type) return '—';
//     return type === 'shop' ? 'Shop' : 'Customer';
//   };

//   const renderCell = (item, key, index) => {
//     if (key === '_actions') {
//       return (
//         <div className="dtm-action-buttons">
//           <button 
//             className="dtm-view-btn" 
//             title="View Details"
//             onClick={() => onViewDetails && onViewDetails(item)}
//           >
//             <Eye size={14} />
//           </button>
//           <button className="dtm-dots" title="More Actions">
//             <MoreVertical size={14} />
//           </button>
//         </div>
//       );
//     }
    
//     if (key === 'sno') {
//       return index + 1;
//     }
    
//     if (key === 'status') {
//       const val = item[key];
//       return val ? (
//         <span className={`dtm-badge ${getBadgeClass(val)}`}>
//           {getStatusLabel(val)}
//         </span>
//       ) : '—';
//     }
    
//     if (key === 'customerType') {
//       return getCustomerTypeLabel(item[key]);
//     }
    
//     if (key === 'createdAt' || key === 'invoiceDate') {
//       return formatDate(item[key]);
//     }
    
//     if (['totalAmount', 'subtotal', 'discount', 'courierCharge', 'mrp', 
//          'distributorPrice', 'retailerPrice', 'walkinPrice', 'itemCost'].includes(key)) {
//       return formatCurrency(item[key]);
//     }
    
//     if (key === 'gst' || key === 'moq') {
//       const val = item[key];
//       return val ? `${val}` : '—';
//     }
    
//     const value = item[key];
//     return value !== null && value !== undefined ? String(value) : '—';
//   };

//   const columns = getColumns();

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;
//     let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
//     let end = Math.min(totalPages, start + maxVisible - 1);
    
//     if (end - start < maxVisible - 1) {
//       start = Math.max(1, end - maxVisible + 1);
//     }
    
//     if (start > 1) {
//       pages.push(1);
//       if (start > 2) pages.push('...');
//     }
    
//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }
    
//     if (end < totalPages) {
//       if (end < totalPages - 1) pages.push('...');
//       pages.push(totalPages);
//     }
    
//     return pages;
//   };

//   return ReactDOM.createPortal(
//     <div className="dtm-overlay" onClick={onClose}>
//       <div className="dtm-container" onClick={(e) => e.stopPropagation()}>
//         {/* Header */}
//         <div className="dtm-header">
//           <div className="dtm-header-content">
//             <h2>{title}</h2>
//             <p className="dtm-subtitle">Detailed report with all entries</p>
//           </div>
//           <div className="dtm-actions">
//             <button className="dtm-export-btn" onClick={onExport}>
//               <Download size={16} /> Export Excel
//             </button>
//             <button className="dtm-close-btn" onClick={onClose} title="Close">
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="dtm-body">
//           <div className="dtm-table-wrap">
//             <table className="dtm-table">
//               <thead>
//                 <tr>
//                   {columns.map(col => (
//                     <th key={col.key} style={{ minWidth: col.width, width: col.width }}>
//                       {col.label}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentItems.length > 0 ? (
//                   currentItems.map((item, idx) => (
//                     <tr key={idx}>
//                       {columns.map(col => (
//                         <td key={col.key} title={renderCell(item, col.key, indexOfFirstItem + idx)}>
//                           {renderCell(item, col.key, indexOfFirstItem + idx)}
//                         </td>
//                       ))}
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={columns.length} className="dtm-no-data">
//                       <div className="dtm-no-data-content">
//                         <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
//                           <path d="M3 6h18M9 6v12M15 6v12M5 6h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z" />
//                         </svg>
//                         <p>No data available</p>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="dtm-footer">
//           <div className="dtm-pagination-info">
//             Showing {showingFrom} to {showingTo} of {safeData.length} entries
//           </div>
//           <div className="dtm-pagination">
//             <div className="dtm-per-page">
//               <span>{itemsPerPage} / page</span>
//               <ChevronLeft size={14} style={{ transform: 'rotate(90deg)' }} />
//             </div>
//             <div className="dtm-page-numbers">
//               <button
//                 className="dtm-page-btn dtm-nav-btn"
//                 onClick={() => onPageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronLeft size={15} />
//               </button>
//               {getPageNumbers().map((page, idx) => (
//                 page === '...' ? (
//                   <span key={idx} className="dtm-page-ellipsis">...</span>
//                 ) : (
//                   <button
//                     key={idx}
//                     className={`dtm-page-btn ${page === currentPage ? 'dtm-active' : ''}`}
//                     onClick={() => onPageChange(page)}
//                   >
//                     {page}
//                   </button>
//                 )
//               ))}
//               <button
//                 className="dtm-page-btn dtm-nav-btn"
//                 onClick={() => onPageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages || totalPages === 0}
//               >
//                 <ChevronRight size={15} />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Summary Cards */}
//         <div className="dtm-summary">
//           <div className="dtm-summary-card">
//             <div className="dtm-summary-icon dtm-icon-total">
//               <FileText size={20} />
//             </div>
//             <div className="dtm-summary-content">
//               <span className="dtm-summary-label">Total Invoices</span>
//               <span className="dtm-summary-value dtm-value-total">{safeData.length.toLocaleString('en-IN')}</span>
//             </div>
//           </div>
//           <div className="dtm-summary-card">
//             <div className="dtm-summary-icon dtm-icon-amount">
//               <DollarSign size={20} />
//             </div>
//             <div className="dtm-summary-content">
//               <span className="dtm-summary-label">Total Amount</span>
//               <span className="dtm-summary-value dtm-value-amount">{formatCurrency(totalAmount)}</span>
//             </div>
//           </div>
//           <div className="dtm-summary-card">
//             <div className="dtm-summary-icon dtm-icon-paid">
//               <CheckCircle size={20} />
//             </div>
//             <div className="dtm-summary-content">
//               <span className="dtm-summary-label">Paid Amount</span>
//               <span className="dtm-summary-value dtm-value-paid">{formatCurrency(paidAmount)}</span>
//             </div>
//           </div>
//           <div className="dtm-summary-card">
//             <div className="dtm-summary-icon dtm-icon-pending">
//               <Clock size={20} />
//             </div>
//             <div className="dtm-summary-content">
//               <span className="dtm-summary-label">Pending Amount</span>
//               <span className="dtm-summary-value dtm-value-pending">{formatCurrency(pendingAmount)}</span>
//             </div>
//           </div>
//           <div className="dtm-summary-card">
//             <div className="dtm-summary-icon dtm-icon-overdue">
//               <AlertTriangle size={20} />
//             </div>
//             <div className="dtm-summary-content">
//               <span className="dtm-summary-label">Overdue Amount</span>
//               <span className="dtm-summary-value dtm-value-overdue">{formatCurrency(overdueAmount)}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// };

// export default DataTableModal;