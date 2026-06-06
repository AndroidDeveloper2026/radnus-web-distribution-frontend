// // src/pages/Reports/DataTableModal.js
// import React from 'react';
// import ReactDOM from 'react-dom';
// import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
// import './DataTableModal.css';

// const DataTableModal = ({
//   isOpen,
//   onClose,
//   title,
//   data,
//   reportType,
//   currentPage,
//   itemsPerPage,
//   onPageChange,
//   onExport
// }) => {
//   if (!isOpen) return null;

//   const safeData = Array.isArray(data) ? data : [];
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = safeData.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(safeData.length / itemsPerPage);

//   const getColumns = () => {
//     switch (reportType) {
//       case 'invoices':
//         return [
//           { key: 'invoiceNumber', label: 'Invoice No' },
//           { key: 'invoiceDate',   label: 'Date' },
//           { key: 'customerName',  label: 'Customer' },
//           { key: 'customerPhone', label: 'Phone' },
//           { key: 'totalAmount',   label: 'Amount (₹)' },
//           { key: 'paymentMode',   label: 'Payment' },
//           { key: 'status',        label: 'Status' },
//         ];
//       case 'salesReturns':
//         return [
//           { key: 'returnNumber',      label: 'Return No' },
//           { key: 'createdAt',         label: 'Date' },
//           { key: 'customerName',      label: 'Customer' },
//           { key: 'referenceInvoice',  label: 'Ref. Invoice' },
//           { key: 'totalAmount',       label: 'Amount (₹)' },
//           { key: 'status',            label: 'Status' },
//         ];
//       case 'purchaseReturns':
//         return [
//           { key: 'returnNumber', label: 'Return No' },
//           { key: 'createdAt',    label: 'Date' },
//           { key: 'supplierName', label: 'Supplier' },
//           { key: 'referencePO',  label: 'Ref. PO' },
//           { key: 'totalAmount',  label: 'Amount (₹)' },
//           { key: 'status',       label: 'Status' },
//         ];
//       case 'products':
//         return [
//           { key: 'name',          label: 'Product Name' },
//           { key: 'sku',           label: 'SKU' },
//           { key: 'category',      label: 'Category' },
//           { key: 'mrp',           label: 'MRP (₹)' },
//           { key: 'retailerPrice', label: 'Retail Price (₹)' },
//           { key: 'status',        label: 'Status' },
//         ];
//       case 'customers':
//         return [
//           { key: 'name',     label: 'Name' },
//           { key: 'phone',    label: 'Phone' },
//           { key: 'type',     label: 'Type' },
//           { key: 'shopName', label: 'Shop Name' },
//           { key: 'city',     label: 'City' },
//           { key: 'state',    label: 'State' },
//         ];
//       default:
//         return [];
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return '—';
//     const d = new Date(date);
//     return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   };

//   const formatValue = (item, key) => {
//     const value = item[key];
//     if (key === 'createdAt' || key === 'invoiceDate') return formatDate(value);
//     if (key === 'totalAmount' || key === 'mrp' || key === 'retailerPrice') {
//       return typeof value === 'number' ? `₹${value.toFixed(2)}` : (value || '—');
//     }
//     return value ?? '—';
//   };

//   const columns = getColumns();

//   return ReactDOM.createPortal(
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-container" onClick={(e) => e.stopPropagation()}>

//         {/* Header */}
//         <div className="modal-header">
//           <h2>{title}</h2>
//           <div className="modal-actions">
//             <button className="modal-export-btn" onClick={onExport}>
//               <Download size={16} />
//               Export to Excel
//             </button>
//             <button className="modal-close-btn" onClick={onClose} title="Close">
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="modal-content">
//           <div className="table-wrapper">
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   {columns.map(col => <th key={col.key}>{col.label}</th>)}
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentItems.length > 0 ? (
//                   currentItems.map((item, idx) => (
//                     <tr key={idx}>
//                       <td className="serial-col">{indexOfFirstItem + idx + 1}</td>
//                       {columns.map(col => (
//                         <td key={col.key} title={formatValue(item, col.key)}>
//                           {formatValue(item, col.key)}
//                         </td>
//                       ))}
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={columns.length + 1} className="no-data">
//                       No data available
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="pagination">
//               <button
//                 className="pagination-btn"
//                 onClick={() => onPageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 <ChevronLeft size={15} /> Previous
//               </button>
//               <span className="pagination-info">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 className="pagination-btn"
//                 onClick={() => onPageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//               >
//                 Next <ChevronRight size={15} />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="modal-footer">
//           <span className="total-records">
//             Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, safeData.length)} of {safeData.length} records
//           </span>
//         </div>

//       </div>
//     </div>,
//     document.body
//   );
// };

// export default DataTableModal;

//++++++++++++++++++++++++++++++++++++

import React from 'react';
import ReactDOM from 'react-dom';
import { X, Download, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import './DataTableModal.css';

const DataTableModal = ({
  isOpen, onClose, title, data, reportType,
  currentPage, itemsPerPage, onPageChange, onExport
}) => {
  if (!isOpen) return null;

  const safeData = Array.isArray(data) ? data : [];
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages   = Math.ceil(safeData.length / itemsPerPage);
  const showingFrom  = safeData.length === 0 ? 0 : indexOfFirstItem + 1;
  const showingTo    = Math.min(indexOfLastItem, safeData.length);

  const getColumns = () => {
    switch (reportType) {
      case 'invoices':
        return [
          { key: 'invoiceNumber', label: 'Invoice No' },
          { key: 'invoiceDate',   label: 'Date' },
          { key: 'customerName',  label: 'Customer' },
          { key: 'customerPhone', label: 'Phone' },
          { key: 'totalAmount',   label: 'Amount' },
          { key: 'status',        label: 'Status' },
          { key: '_actions',      label: 'Actions' },
        ];
      case 'salesReturns':
        return [
          { key: 'returnNumber',     label: 'Return No' },
          { key: 'createdAt',        label: 'Date' },
          { key: 'customerName',     label: 'Customer' },
          { key: 'referenceInvoice', label: 'Ref. Invoice' },
          { key: 'totalAmount',      label: 'Amount' },
          { key: 'status',           label: 'Status' },
          { key: '_actions',         label: 'Actions' },
        ];
      case 'purchaseReturns':
        return [
          { key: 'returnNumber', label: 'Return No' },
          { key: 'createdAt',    label: 'Date' },
          { key: 'supplierName', label: 'Supplier' },
          { key: 'referencePO',  label: 'Ref. PO' },
          { key: 'totalAmount',  label: 'Amount' },
          { key: 'status',       label: 'Status' },
          { key: '_actions',     label: 'Actions' },
        ];
      case 'products':
        return [
          { key: 'name',          label: 'Product Name' },
          { key: 'sku',           label: 'SKU' },
          { key: 'category',      label: 'Category' },
          { key: 'mrp',           label: 'MRP' },
          { key: 'retailerPrice', label: 'Retail Price' },
          { key: 'status',        label: 'Status' },
          { key: '_actions',      label: 'Actions' },
        ];
      case 'customers':
        return [
          { key: 'name',     label: 'Name' },
          { key: 'phone',    label: 'Phone' },
          { key: 'type',     label: 'Type' },
          { key: 'shopName', label: 'Shop Name' },
          { key: 'city',     label: 'City' },
          { key: 'state',    label: 'State' },
          { key: '_actions', label: 'Actions' },
        ];
      default: return [];
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getBadgeClass = (status) => {
    if (!status) return 'dtm-default';
    const s = status.toLowerCase();
    if (s === 'paid') return 'dtm-paid';
    if (s === 'pending') return 'dtm-pending';
    if (s === 'overdue') return 'dtm-overdue';
    return 'dtm-default';
  };

  const renderCell = (item, key) => {
    if (key === '_actions') {
      return (
        <button className="dtm-dots" title="Actions">
          <MoreVertical size={16} />
        </button>
      );
    }
    if (key === 'status') {
      const val = item[key];
      return val ? <span className={`dtm-badge ${getBadgeClass(val)}`}>{val}</span> : '—';
    }
    const value = item[key];
    if (key === 'createdAt' || key === 'invoiceDate') return formatDate(value);
    if (['totalAmount','mrp','retailerPrice'].includes(key)) {
      return typeof value === 'number' ? `₹${value.toFixed(2)}` : (value || '—');
    }
    return value ?? '—';
  };

  const columns = getColumns();

  return ReactDOM.createPortal(
    <div className="dtm-overlay" onClick={onClose}>
      <div className="dtm-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="dtm-header">
          <h2>{title}</h2>
          <div className="dtm-actions">
            <button className="dtm-export-btn" onClick={onExport}>
              <Download size={16} /> Export to Excel
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
                  <th>#</th>
                  {columns.map(col => <th key={col.key}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{indexOfFirstItem + idx + 1}</td>
                      {columns.map(col => (
                        <td key={col.key}>{renderCell(item, col.key)}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="dtm-no-data">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="dtm-footer">
          <div className="dtm-pagination">
            <button className="dtm-page-btn"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}>
              <ChevronLeft size={15} /> Previous
            </button>
            <span className="dtm-page-info">Page {currentPage} of {totalPages || 1}</span>
            <button className="dtm-page-btn"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}>
              Next <ChevronRight size={15} />
            </button>
          </div>
          <span className="dtm-showing">
            Showing {showingFrom} - {showingTo} of {safeData.length} records
          </span>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default DataTableModal;