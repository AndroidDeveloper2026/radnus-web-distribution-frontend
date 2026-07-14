// src/utils/excelExport.js
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helper function to format date consistently
const formatDateExcel = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
};

// Helper function to preserve number formatting
const formatNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ============================================
// EXPORT INVOICES TO EXCEL - SUMMARY
// ============================================
export const exportInvoicesToExcel = (invoices, filename = 'Invoices_Report') => {
  if (!invoices || invoices.length === 0) {
    alert('No invoice data to export');
    return;
  }

  const exportData = invoices.map((invoice, index) => ({
    'S.No': index + 1,
    'Invoice Date': invoice.invoiceDate ? formatDateExcel(invoice.invoiceDate) : formatDateExcel(invoice.createdAt),
    'Invoice Number': invoice.invoiceNumber || '',
    'Salesperson': invoice.salesperson || '',
    'Reference No': invoice.referenceNo || '',
    'Order Type': invoice.orderType || '', // ✅ ADDED
    'Biller Name': invoice.billerName || '',
    'Customer Name': invoice.customerName || '',
    'Customer Type': invoice.customerType === 'shop' ? 'Shop' : 'Customer',
    'Shop Name': invoice.shopName || '',
    'Phone Number': invoice.customerPhone || '',
    'Address': invoice.customerAddress || '',
    'Payment Mode': invoice.paymentMode || '',
    'Subtotal': formatNumber(invoice.subtotal),
    'Discount': formatNumber(invoice.discount),
    'Courier Charge': formatNumber(invoice.courierCharge),
    'Total Amount': formatNumber(invoice.totalAmount),
    'Status': invoice.status || 'completed',
    'Created At': formatDateExcel(invoice.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 6 },   // S.No
    { wch: 18 },  // Invoice Date
    { wch: 20 },  // Invoice Number
    { wch: 25 },  // Salesperson
    { wch: 18 },  // Reference No
    { wch: 12 },  // Order Type ✅ ADDED
    { wch: 20 },  // Biller Name
    { wch: 35 },  // Customer Name
    { wch: 15 },  // Customer Type
    { wch: 25 },  // Shop Name
    { wch: 15 },  // Phone Number
    { wch: 30 },  // Address
    { wch: 15 },  // Payment Mode
    { wch: 12 },  // Subtotal
    { wch: 12 },  // Discount
    { wch: 15 },  // Courier Charge
    { wch: 15 },  // Total Amount
    { wch: 12 },  // Status
    { wch: 20 },  // Created At
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT INVOICE ITEMS DETAIL
// ============================================
export const exportInvoiceItemsToExcel = (invoices, filename = 'Invoice_Items_Detail') => {
  if (!invoices || invoices.length === 0) {
    alert('No invoice data to export');
    return;
  }

  const exportData = [];
  
  invoices.forEach((invoice) => {
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item, idx) => {
        exportData.push({
          'Invoice Number': invoice.invoiceNumber || '',
          'Invoice Date': invoice.invoiceDate ? formatDateExcel(invoice.invoiceDate) : formatDateExcel(invoice.createdAt),
          'Salesperson': invoice.salesperson || '',
          'Reference No': invoice.referenceNo || '',
          'Order Type': invoice.orderType || '', // ✅ ADDED
          'Customer Name': invoice.customerName || '',
          'Customer Phone': invoice.customerPhone || '',
          'Customer Type': invoice.customerType === 'shop' ? 'Shop' : 'Customer',
          'Shop Name': invoice.shopName || '',
          'S.No': idx + 1,
          'Product Name': item.name || '',
          'Quantity': formatNumber(item.qty),
          'Price': formatNumber(item.price),
          'Amount': formatNumber(item.qty * item.price),
          'Payment Mode': invoice.paymentMode || '',
          'Invoice Total': formatNumber(invoice.totalAmount),
        });
      });
    } else {
      // For invoices with no items
      exportData.push({
        'Invoice Number': invoice.invoiceNumber || '',
        'Invoice Date': invoice.invoiceDate ? formatDateExcel(invoice.invoiceDate) : formatDateExcel(invoice.createdAt),
        'Salesperson': invoice.salesperson || '',
        'Reference No': invoice.referenceNo || '',
        'Order Type': invoice.orderType || '', // ✅ ADDED
        'Customer Name': invoice.customerName || '',
        'Customer Phone': invoice.customerPhone || '',
        'Customer Type': invoice.customerType === 'shop' ? 'Shop' : 'Customer',
        'Shop Name': invoice.shopName || '',
        'S.No': '',
        'Product Name': 'No items',
        'Quantity': '',
        'Price': '',
        'Amount': '',
        'Payment Mode': invoice.paymentMode || '',
        'Invoice Total': formatNumber(invoice.totalAmount),
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 20 },  // Invoice Number
    { wch: 18 },  // Invoice Date
    { wch: 25 },  // Salesperson
    { wch: 18 },  // Reference No
    { wch: 12 },  // Order Type ✅ ADDED
    { wch: 35 },  // Customer Name
    { wch: 15 },  // Customer Phone
    { wch: 15 },  // Customer Type
    { wch: 25 },  // Shop Name
    { wch: 6 },   // S.No
    { wch: 40 },  // Product Name
    { wch: 10 },  // Quantity
    { wch: 12 },  // Price
    { wch: 15 },  // Amount
    { wch: 15 },  // Payment Mode
    { wch: 15 },  // Invoice Total
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT SALES RETURNS - SUMMARY
// ============================================
export const exportSalesReturnsToExcel = (returns, filename = 'Sales_Returns_Report') => {
  if (!returns || returns.length === 0) {
    alert('No sales return data to export');
    return;
  }

  const exportData = returns.map((ret, index) => ({
    'S.No': index + 1,
    'Return Number': ret.returnNumber || '',
    'Return Date': formatDateExcel(ret.createdAt),
    'Salesperson': ret.salesperson || '',
    'Customer Name': ret.customerName || '',
    'Reference Invoice': ret.referenceInvoice || '',
    'Total Amount': formatNumber(ret.totalAmount),
    'Reason': ret.reason || '',
    'Status': ret.status || 'pending',
    'Biller Name': ret.billerName || '',
    'Items Count': ret.items?.length || 0,
    'Created At': formatDateExcel(ret.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
    { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 20 },
    { wch: 10 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Returns');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT SALES RETURN ITEMS DETAIL
// ============================================
export const exportSalesReturnItemsToExcel = (returns, filename = 'Sales_Return_Items') => {
  if (!returns || returns.length === 0) {
    alert('No sales return data to export');
    return;
  }

  const exportData = [];
  
  returns.forEach((ret) => {
    if (ret.items && ret.items.length > 0) {
      ret.items.forEach((item, idx) => {
        exportData.push({
          'Return Number': ret.returnNumber || '',
          'Return Date': formatDateExcel(ret.createdAt),
          'Salesperson': ret.salesperson || '',
          'Customer Name': ret.customerName || '',
          'Reference Invoice': ret.referenceInvoice || '',
          'S.No': idx + 1,
          'Product Name': item.name || '',
          'Quantity': formatNumber(item.qty),
          'Price': formatNumber(item.price),
          'Amount': formatNumber(item.qty * item.price),
          'Reason': ret.reason || '',
          'Status': ret.status || '',
          'Return Total': formatNumber(ret.totalAmount),
        });
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
    { wch: 6 }, { wch: 35 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
    { wch: 40 }, { wch: 12 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Return Items');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT PURCHASE RETURNS
// ============================================
export const exportPurchaseReturnsToExcel = (returns, filename = 'Purchase_Returns_Report') => {
  if (!returns || returns.length === 0) {
    alert('No purchase return data to export');
    return;
  }

  const exportData = returns.map((ret, index) => ({
    'S.No': index + 1,
    'Return Number': ret.returnNumber || '',
    'Return Date': formatDateExcel(ret.createdAt),
    'Supplier Name': ret.supplierName || '',
    'Reference PO': ret.referencePO || '',
    'Total Amount': formatNumber(ret.totalAmount),
    'Reason': ret.reason || '',
    'Status': ret.status || 'pending',
    'Biller Name': ret.billerName || '',
    'Items Count': ret.items?.length || 0,
    'Created At': formatDateExcel(ret.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
    { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Returns');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT PRODUCTS
// ============================================
export const exportProductsToExcel = (products, filename = 'Products_Report') => {
  if (!products || products.length === 0) {
    alert('No product data to export');
    return;
  }

  const exportData = products.map((product, index) => ({
    'S.No': index + 1,
    'Product Name': product.name || '',
    'SKU': product.sku || '',
    'Category': product.category || '',
    'MRP': formatNumber(product.mrp),
    'Distributor Price': formatNumber(product.distributorPrice),
    'Retailer Price': formatNumber(product.retailerPrice),
    'Walk-in Price': formatNumber(product.walkinPrice),
    'Item Cost': formatNumber(product.itemCost),
    'GST (%)': formatNumber(product.gst),
    'MOQ': formatNumber(product.moq),
    'Batch No': product.batchNo || '',
    'Rack No': product.rackNo || '',
    'Vendor Name': product.vendorName || '',
    'Status': product.status || 'Active',
    'Created At': formatDateExcel(product.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
    { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT CUSTOMERS
// ============================================
export const exportCustomersToExcel = (customers, filename = 'Customers_Report') => {
  if (!customers || customers.length === 0) {
    alert('No customer data to export');
    return;
  }

  const exportData = customers.map((customer, index) => ({
    'S.No': index + 1,
    'Name': customer.name || '',
    'Phone': customer.phone || '',
    'Type': customer.type === 'shop' ? 'Shop' : 'Customer',
    'Shop Name': customer.shopName || '',
    'Address': customer.address || '',
    'City': customer.city || '',
    'State': customer.state || '',
    'Created At': formatDateExcel(customer.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  const colWidths = [
    { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
    { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ============================================
// EXPORT PRODUCT PRICE HISTORY
// ============================================
export const exportProductPriceHistoryToExcel = (history, filename = 'Product_Price_History') => {
  if (!history || history.length === 0) {
    alert('No price history data to export');
    return;
  }

  const exportData = history.map((row, index) => ({
    'S.No': index + 1,
    'Purchase Date': formatDateExcel(row.purchaseDate || row.invoiceDate),
    'Invoice No': row.invoiceNumber || '',
    'Supplier': row.supplierName || '',
    'Batch No': row.batchNo || '',
    'Qty': formatNumber(row.quantity),
    'Purchase Price': formatNumber(row.purchasePrice),
    'Item Cost': formatNumber(row.itemCost),
    'Distributor Price': formatNumber(row.distributorPrice),
    'Retail Price': formatNumber(row.retailerPrice),
    'Walk-in Price': formatNumber(row.walkinPrice),
    'MRP': formatNumber(row.mrp),
    'GST %': formatNumber(row.gst),
    'Rack No': row.rackNo || '',
    'Remarks': row.remarks || '',
    'Created By': row.createdBy || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const colWidths = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
    { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 14 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Price History');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// // src/utils/excelExport.js
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// // Helper function to format date consistently
// const formatDateExcel = (date) => {
//   if (!date) return '';
//   try {
//     const d = new Date(date);
//     if (isNaN(d.getTime())) return date;
//     return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   } catch {
//     return date;
//   }
// };

// // Helper function to preserve number formatting
// const formatNumber = (value) => {
//   if (value === null || value === undefined) return 0;
//   const num = Number(value);
//   return isNaN(num) ? 0 : num;
// };

// // Export Invoices to Excel
// export const exportInvoicesToExcel = (invoices, filename = 'Invoices_Report') => {
//   if (!invoices || invoices.length === 0) {
//     alert('No invoice data to export');
//     return;
//   }

//   const exportData = invoices.map((invoice, index) => ({
//     'S.No': index + 1,
//     'Invoice Date': invoice.invoiceDate ? formatDateExcel(invoice.invoiceDate) : formatDateExcel(invoice.createdAt),
//     'Invoice Number': invoice.invoiceNumber || '',
//     'Salesperson': invoice.salesperson || '',
//     'Reference No': invoice.referenceNo || '',
//     'Biller Name': invoice.billerName || '',
//     'Customer Name': invoice.customerName || '',
//     'Customer Type': invoice.customerType === 'shop' ? 'Shop' : 'Customer',
//     'Shop Name': invoice.shopName || '',
//     'Phone Number': invoice.customerPhone || '',
//     'Address': invoice.customerAddress || '',
//     'Payment Mode': invoice.paymentMode || '',
//     'Subtotal': formatNumber(invoice.subtotal),
//     'Discount': formatNumber(invoice.discount),
//     'Courier Charge': formatNumber(invoice.courierCharge),
//     'Total Amount': formatNumber(invoice.totalAmount),
//     'Status': invoice.status || 'completed',
//     'Created At': formatDateExcel(invoice.createdAt),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 6 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
//     { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
//     { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
//     { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Invoice Items Detail
// export const exportInvoiceItemsToExcel = (invoices, filename = 'Invoice_Items_Detail') => {
//   if (!invoices || invoices.length === 0) {
//     alert('No invoice data to export');
//     return;
//   }

//   const exportData = [];
  
//   invoices.forEach((invoice) => {
//     if (invoice.items && invoice.items.length > 0) {
//       invoice.items.forEach((item, idx) => {
//         exportData.push({
//           'Invoice Number': invoice.invoiceNumber || '',
//           'Invoice Date': invoice.invoiceDate ? formatDateExcel(invoice.invoiceDate) : formatDateExcel(invoice.createdAt),
//           'Salesperson': invoice.salesperson || '',
//           'Customer Name': invoice.customerName || '',
//           'Customer Phone': invoice.customerPhone || '',
//           'Customer Type': invoice.customerType === 'shop' ? 'Shop' : 'Customer',
//           'Shop Name': invoice.shopName || '',
//           'S.No': idx + 1,
//           'Product Name': item.name || '',
//           'Quantity': formatNumber(item.qty),
//           'Price': formatNumber(item.price),
//           'Amount': formatNumber(item.qty * item.price),
//           'Payment Mode': invoice.paymentMode || '',
//           'Reference No': invoice.referenceNo || '',
//           'Invoice Total': formatNumber(invoice.totalAmount),
//         });
//       });
//     }
//   });

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 },
//     { wch: 12 }, { wch: 20 }, { wch: 6 }, { wch: 35 }, { wch: 8 },
//     { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Sales Returns to Excel
// export const exportSalesReturnsToExcel = (returns, filename = 'Sales_Returns_Report') => {
//   if (!returns || returns.length === 0) {
//     alert('No sales return data to export');
//     return;
//   }

//   const exportData = returns.map((ret, index) => ({
//     'S.No': index + 1,
//     'Return Number': ret.returnNumber || '',
//     'Return Date': formatDateExcel(ret.createdAt),
//     'Salesperson': ret.salesperson || '',
//     'Customer Name': ret.customerName || '',
//     'Reference Invoice': ret.referenceInvoice || '',
//     'Total Amount': formatNumber(ret.totalAmount),
//     'Reason': ret.reason || '',
//     'Status': ret.status || 'pending',
//     'Biller Name': ret.billerName || '',
//     'Items Count': ret.items?.length || 0,
//     'Created At': formatDateExcel(ret.createdAt),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
//     { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 20 },
//     { wch: 10 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Returns');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Sales Return Items Detail
// export const exportSalesReturnItemsToExcel = (returns, filename = 'Sales_Return_Items') => {
//   if (!returns || returns.length === 0) {
//     alert('No sales return data to export');
//     return;
//   }

//   const exportData = [];
  
//   returns.forEach((ret) => {
//     if (ret.items && ret.items.length > 0) {
//       ret.items.forEach((item, idx) => {
//         exportData.push({
//           'Return Number': ret.returnNumber || '',
//           'Return Date': formatDateExcel(ret.createdAt),
//           'Salesperson': ret.salesperson || '',
//           'Customer Name': ret.customerName || '',
//           'Reference Invoice': ret.referenceInvoice || '',
//           'S.No': idx + 1,
//           'Product Name': item.name || '',
//           'Quantity': formatNumber(item.qty),
//           'Price': formatNumber(item.price),
//           'Amount': formatNumber(item.qty * item.price),
//           'Reason': ret.reason || '',
//           'Status': ret.status || '',
//           'Return Total': formatNumber(ret.totalAmount),
//         });
//       });
//     }
//   });

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
//     { wch: 6 }, { wch: 35 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
//     { wch: 40 }, { wch: 12 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Return Items');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Purchase Returns to Excel
// export const exportPurchaseReturnsToExcel = (returns, filename = 'Purchase_Returns_Report') => {
//   if (!returns || returns.length === 0) {
//     alert('No purchase return data to export');
//     return;
//   }

//   const exportData = returns.map((ret, index) => ({
//     'S.No': index + 1,
//     'Return Number': ret.returnNumber || '',
//     'Return Date': formatDateExcel(ret.createdAt),
//     'Supplier Name': ret.supplierName || '',
//     'Reference PO': ret.referencePO || '',
//     'Total Amount': formatNumber(ret.totalAmount),
//     'Reason': ret.reason || '',
//     'Status': ret.status || 'pending',
//     'Biller Name': ret.billerName || '',
//     'Items Count': ret.items?.length || 0,
//     'Created At': formatDateExcel(ret.createdAt),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
//     { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Returns');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Products to Excel
// export const exportProductsToExcel = (products, filename = 'Products_Report') => {
//   if (!products || products.length === 0) {
//     alert('No product data to export');
//     return;
//   }

//   const exportData = products.map((product, index) => ({
//     'S.No': index + 1,
//     'Product Name': product.name || '',
//     'SKU': product.sku || '',
//     'Category': product.category || '',
//     'MRP': formatNumber(product.mrp),
//     'Distributor Price': formatNumber(product.distributorPrice),
//     'Retailer Price': formatNumber(product.retailerPrice),
//     'Walk-in Price': formatNumber(product.walkinPrice),
//     'Item Cost': formatNumber(product.itemCost),
//     'GST (%)': formatNumber(product.gst),
//     'MOQ': formatNumber(product.moq),
//     'Batch No': product.batchNo || '',
//     'Rack No': product.rackNo || '',
//     'Vendor Name': product.vendorName || '',
//     'Status': product.status || 'Active',
//     'Created At': formatDateExcel(product.createdAt),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
//     { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
//     { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Customers to Excel
// export const exportCustomersToExcel = (customers, filename = 'Customers_Report') => {
//   if (!customers || customers.length === 0) {
//     alert('No customer data to export');
//     return;
//   }

//   const exportData = customers.map((customer, index) => ({
//     'S.No': index + 1,
//     'Name': customer.name || '',
//     'Phone': customer.phone || '',
//     'Type': customer.type === 'shop' ? 'Shop' : 'Customer',
//     'Shop Name': customer.shopName || '',
//     'Address': customer.address || '',
//     'City': customer.city || '',
//     'State': customer.state || '',
//     'Created At': formatDateExcel(customer.createdAt),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);
  
//   const colWidths = [
//     { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
//     { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  
//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

// // Export Product Price History to Excel
// export const exportProductPriceHistoryToExcel = (history, filename = 'Product_Price_History') => {
//   if (!history || history.length === 0) {
//     alert('No price history data to export');
//     return;
//   }

//   const exportData = history.map((row, index) => ({
//     'S.No': index + 1,
//     'Purchase Date': formatDateExcel(row.purchaseDate || row.invoiceDate),
//     'Invoice No': row.invoiceNumber || '',
//     'Supplier': row.supplierName || '',
//     'Batch No': row.batchNo || '',
//     'Qty': formatNumber(row.quantity),
//     'Purchase Price': formatNumber(row.purchasePrice),
//     'Item Cost': formatNumber(row.itemCost),
//     'Distributor Price': formatNumber(row.distributorPrice),
//     'Retail Price': formatNumber(row.retailerPrice),
//     'Walk-in Price': formatNumber(row.walkinPrice),
//     'MRP': formatNumber(row.mrp),
//     'GST %': formatNumber(row.gst),
//     'Rack No': row.rackNo || '',
//     'Remarks': row.remarks || '',
//     'Created By': row.createdBy || '',
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);

//   const colWidths = [
//     { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 16 },
//     { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
//     { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 14 }
//   ];
//   worksheet['!cols'] = colWidths;

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Price History');

//   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//   saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
// };

