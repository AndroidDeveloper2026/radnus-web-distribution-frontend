// // src/pages/Invoices/InvoiceViewPage.js
// import React, { useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useTheme } from '../../context/ThemeContext';
// import './InvoiceViewPage.css';

// import { Download, FileText, MapPin, Phone, CreditCard, Calendar, ArrowLeft } from 'lucide-react';

// const InvoiceViewPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';
//   const invoice = location.state?.invoice;
//   const [downloading, setDownloading] = useState(false);

//   if (!invoice) {
//     return <div className={`invoice-view ${isDark ? 'dark' : ''}`}>No invoice data</div>;
//   }

//   const {
//     invoiceNumber,
//     createdAt,
//     customerName,
//     customerPhone,
//     customerAddress,
//     customerCity,
//     customerState,
//     customerType,
//     shopName,
//     sameAsBuyer,
//     shippingAddress,
//     items = [],
//     totalAmount,
//     paymentMode,
//     subtotal: storeSubtotal,
//     discount = 0,
//     courierCharge = 0,
//     billerName,
//     salesperson,
//     referenceNo,
//   } = invoice;

//   const subtotal = storeSubtotal || items.reduce((sum, i) => sum + i.qty * i.price, 0);
//   const grandTotal = totalAmount;

//   // Generate print HTML (same as RN but for web)
//   const generateInvoiceHTML = () => {
//     const buyerDisplay = customerType === 'shop' && shopName ? `${shopName} (${customerName})` : customerName;
//     const buyerLine1 = `${buyerDisplay} - ${customerPhone}`;
//     const buyerLine2 = customerAddress || '';
//     const buyerLine3 = [customerCity, customerState].filter(Boolean).join(' - ');

//     let shipName = buyerDisplay;
//     let shipPhone = customerPhone;
//     let shipAddress = customerAddress;
//     let shipCity = customerCity;
//     let shipState = customerState;
//     if (!sameAsBuyer && shippingAddress) {
//       shipName = shippingAddress.name || buyerDisplay;
//       shipPhone = shippingAddress.phone || customerPhone;
//       shipAddress = shippingAddress.address || '';
//       shipCity = shippingAddress.city || '';
//       shipState = shippingAddress.state || '';
//     }
//     const shipLine1 = `${shipName} - ${shipPhone}`;
//     const shipLine2 = shipAddress || '';
//     const shipLine3 = [shipCity, shipState].filter(Boolean).join(' - ');

//     let itemsRows = '';
//     items.forEach((item, idx) => {
//       const amount = item.qty * item.price;
//       itemsRows += `
//         <tr>
//           <td style="text-align:center;padding:6px;border:1px solid #000">${idx+1}</td>
//           <td style="padding:6px;border:1px solid #000">${item.name}</td>
//           <td style="text-align:center;padding:6px;border:1px solid #000">-</td>
//           <td style="text-align:center;padding:6px;border:1px solid #000">${item.qty} NOS</td>
//           <td style="text-align:right;padding:6px;border:1px solid #000">₹${item.price}</td>
//           <td style="text-align:center;padding:6px;border:1px solid #000">NOS</td>
//           <td style="text-align:right;padding:6px;border:1px solid #000">₹${amount}.00</td>
//         </tr>`;
//     });

//     const discountRow = discount > 0 ? `
//       <tr>
//         <td style="border:1px solid #000;padding:6px"></td>
//         <td style="border:1px solid #000;padding:6px">DISCOUNT</td>
//         <td style="border:1px solid #000;padding:6px"></td>
//         <td style="border:1px solid #000;padding:6px"></td>
//         <td style="border:1px solid #000;padding:6px"></td>
//         <td style="border:1px solid #000;padding:6px"></td>
//         <td style="border:1px solid #000;padding:6px;text-align:right">₹${discount}.00</td>
//       </tr>` : '';

//     const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

//     const amountInWords = (num) => {
//       const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//       const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//       if (num === 0) return 'Zero';
//       if (num < 20) return ones[num];
//       if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' ' + ones[num%10] : '');
//       if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + amountInWords(num%100) : '');
//       if (num < 100000) return amountInWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + amountInWords(num%1000) : '');
//       return amountInWords(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + amountInWords(num%100000) : '');
//     };
//     const grandTotalWords = `INR ${amountInWords(grandTotal)} Only`;

//     const refDate = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '';
//     const refDisplay = referenceNo ? `${referenceNo} dt. ${refDate}` : '';

//     return `
//       <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 15px; }
//           .outer-border { border: 2px solid #000; }
//           .header-section { border-bottom: 1px solid #000; padding: 8px; text-align: center; }
//           .company-name { font-size: 16px; font-weight: bold; margin: 0; }
//           .company-address { font-size: 10px; margin: 2px 0; }
//           .two-col { display: flex; border-bottom: 1px solid #000; }
//           .col-left { width: 50%; padding: 8px; border-right: 1px solid #000; }
//           .col-right { width: 50%; padding: 8px; }
//           .section-title { font-weight: bold; font-size: 10px; margin-bottom: 4px; }
//           table { width: 100%; border-collapse: collapse; font-size: 10px; }
//           th { background: #f0f0f0; font-weight: bold; padding: 6px; border: 1px solid #000; text-align: center; }
//           .amount-words { padding: 6px 8px; border-bottom: 1px solid #000; font-size: 10px; }
//           .declaration { padding: 6px 8px; font-size: 9px; border-bottom: 1px solid #000; }
//           .signature-section { display: flex; }
//           .sig-left { width: 60%; padding: 8px; border-right: 1px solid #000; font-size: 9px; }
//           .sig-right { width: 40%; padding: 8px; text-align: right; font-size: 10px; }
//           .sig-line { margin-top: 40px; border-top: 1px solid #000; font-size: 9px; text-align: center; }
//           .footer { text-align: center; padding: 4px; font-size: 9px; border-top: 1px solid #000; }
//         </style>
//       </head>
//       <body>
//       <div class="outer-border">
//         <div class="header-section">
//           <p class="company-name">RADNUS COMMUNICATION</p>
//           <p class="company-address">No.242/44, MG Road, Sinnaya Plaza, Near Fish Market</p>
//           <p class="company-address">Puducherry - 605001</p>
//           <p class="company-address">State Name: Puducherry, Code: 34</p>
//           <p class="company-address">E-Mail: sundar12134@gmail.com</p>
//           <p class="company-address"><b>GST: 34AAHFR8679B</b></p>
//         </div>
//         <div style="text-align:center;font-weight:bold;font-size:13px;padding:6px;border-bottom:1px solid #000;">INVOICE</div>
//         <div class="two-col">
//           <div class="col-left">
//             <div class="section-title">Consignee (Ship to)</div>
//             <p style="margin:2px 0">${shipLine1}</p>
//             ${shipLine2 ? `<p style="margin:2px 0">${shipLine2}</p>` : ''}
//             ${shipLine3 ? `<p style="margin:2px 0">${shipLine3}</p>` : ''}
//             <div class="section-title" style="margin-top:10px">Buyer (Bill to)</div>
//             <p style="margin:2px 0">${buyerLine1}</p>
//             ${buyerLine2 ? `<p style="margin:2px 0">${buyerLine2}</p>` : ''}
//             ${buyerLine3 ? `<p style="margin:2px 0">${buyerLine3}</p>` : ''}
//           </div>
//           <div class="col-right">
//             <table>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Invoice No.</b></td><td style="border:1px solid #000;padding:4px">${invoiceNumber}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Dated</b></td><td style="border:1px solid #000;padding:4px">${new Date(createdAt).toDateString()}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Delivery Note</b></td><td style="border:1px solid #000;padding:4px"></td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Mode/Terms of Payment</b></td><td style="border:1px solid #000;padding:4px">${paymentMode?.toUpperCase()}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Salesperson</b></td><td style="border:1px solid #000;padding:4px">${salesperson || ''}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Reference No. &amp; Date</b></td><td style="border:1px solid #000;padding:4px">${refDisplay}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Buyer's Order No.</b></td><td style="border:1px solid #000;padding:4px"></td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Dispatched through</b></td><td style="border:1px solid #000;padding:4px"></td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Destination</b></td><td style="border:1px solid #000;padding:4px">${buyerLine3}</td></tr>
//               <tr><td style="border:1px solid #000;padding:4px"><b>Terms of Delivery</b></td><td style="border:1px solid #000;padding:4px"></td></tr>
//             </table>
//           </div>
//         </div>
//         <table>
//           <thead><tr><th>Sl No.</th><th>Description of Goods and Services</th><th>HSN/SAC</th><th>Quantity</th><th>Rate</th><th>Per</th><th>Amount</th></tr></thead>
//           <tbody>${itemsRows}${discountRow}
//           <tr><td></td><td>COURIER CHARGE</td><td></td><td></td><td></td><td></td><td style="text-align:right">₹${courierCharge}.00</td></tr>
//           <tr><td></td><td><b>Total</b></td><td></td><td style="text-align:center"><b>${totalQty} NOS</b></td><td></td><td></td><td style="text-align:right"><b>₹${grandTotal}.00</b></td></tr>
//           </tbody>
//         </table>
//         <div class="amount-words"><b>Amount Chargeable (in words)</b><br/><b>${grandTotalWords}</b></div>
//         <div class="declaration"><b>Declaration</b><br/>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
//         <div class="signature-section">
//           <div class="sig-left">E. &amp; O.E</div>
//           <div class="sig-right"><b>for RADNUS COMMUNICATION</b><div class="sig-line">Authorised Signatory</div></div>
//         </div>
//         <div class="footer">This is a Computer Generated Invoice</div>
//       </div>
//       </body>
//       </html>`;
//   };

//   const handleDownload = () => {
//     setDownloading(true);
//     const printWindow = window.open('', '_blank');
//     printWindow.document.write(generateInvoiceHTML());
//     printWindow.document.close();
//     printWindow.print();
//     setDownloading(false);
//   };

//   return (
//     <div className={`invoice-view ${isDark ? 'dark' : ''}`}>
//       <div className="view-header">
//         <button className="back-btn" onClick={() => navigate(-1)}>
//           <ArrowLeft size={18} /> Back
//         </button>
//         <h1>Invoice Details</h1>
//       </div>

//       <div className="invoice-details">
//         {/* Meta */}
//         <div className="detail-card">
//           <div className="detail-row">
//             <span className="label">Invoice No.</span>
//             <span>{invoiceNumber}</span>
//           </div>
//           <div className="detail-row">
//             <span className="label">Date</span>
//             <span>{new Date(createdAt).toDateString()}</span>
//           </div>
//           <div className="detail-row">
//             <span className="label">Biller</span>
//             <span>{billerName}</span>
//           </div>
//           {salesperson && (
//             <div className="detail-row">
//               <span className="label">Salesperson</span>
//               <span>{salesperson}</span>
//             </div>
//           )}
//         </div>

//         {/* Customer */}
//         <div className="detail-card">
//           <h3>Customer</h3>
//           <div className="detail-row">
//             <Phone size={14} /> <span>{customerName} – {customerPhone}</span>
//           </div>
//           <div className="detail-row">
//             <MapPin size={14} /> <span>{[customerAddress, customerCity, customerState].filter(Boolean).join(', ') || '—'}</span>
//           </div>
//           <div className="detail-row">
//             <CreditCard size={14} /> <span>Payment: {paymentMode?.toUpperCase()}</span>
//           </div>
//         </div>

//         {/* Items */}
//         <div className="detail-card">
//           <h3>Items ({items.length})</h3>
//           <table className="items-table">
//             <thead>
//               <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
//             </thead>
//             <tbody>
//               {items.map((item, idx) => (
//                 <tr key={idx}>
//                   <td>{item.name}</td>
//                   <td>{item.qty}</td>
//                   <td>₹{item.price}</td>
//                   <td>₹{item.qty * item.price}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* Summary */}
//         <div className="detail-card summary">
//           <div className="summary-row">
//             <span>Subtotal</span><span>₹{subtotal}</span>
//           </div>
//           {discount > 0 && (
//             <div className="summary-row">
//               <span>Discount</span><span>- ₹{discount}</span>
//             </div>
//           )}
//           <div className="summary-row">
//             <span>Courier Charge</span><span>₹{courierCharge}</span>
//           </div>
//           <div className="summary-row total">
//             <span>Grand Total</span><span>₹{grandTotal}</span>
//           </div>
//         </div>

//         <button className="download-btn" onClick={handleDownload} disabled={downloading}>
//           <Download size={18} /> {downloading ? 'Preparing...' : 'Download PDF'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default InvoiceViewPage;

//---------------------------------------

// src/pages/Invoices/InvoiceViewPage.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './InvoiceViewPage.css';

import { Download, ArrowLeft, Phone, MapPin, CreditCard } from 'lucide-react';

const InvoiceViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const invoice = location.state?.invoice;
  const [downloading, setDownloading] = useState(false);

  if (!invoice) {
    return <div className={`invoice-view ${isDark ? 'dark' : ''}`}>No invoice data found.</div>;
  }

  // ---- Destructure invoice fields ----
  const {
    invoiceNumber,
    createdAt,
    customerName,
    customerPhone,
    customerAddress,
    customerCity,
    customerState,
    customerType,
    shopName,
    sameAsBuyer,
    shippingAddress,
    items = [],
    totalAmount,
    paymentMode,
    subtotal: storeSubtotal,
    discount = 0,
    courierCharge = 0,
    billerName,
    salesperson = '',
    referenceNo = '',
  } = invoice;

  const subtotal = storeSubtotal || items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const grandTotal = totalAmount;

  // ──────────────────────────────────────────────
  // Generate the EXACT same HTML used for printing
  // that matches your approved invoice format.
  // ──────────────────────────────────────────────
  const generateInvoiceHTML = () => {
    // Helper: amount to words
    const amountInWords = (num) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + amountInWords(num % 100) : '');
      if (num < 100000) return amountInWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + amountInWords(num % 1000) : '');
      return amountInWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + amountInWords(num % 100000) : '');
    };
    const grandTotalWords = `INR ${amountInWords(grandTotal)} Only`;

    // Buyer / Ship details
    const buyerDisplay = customerType === 'shop' && shopName ? `${shopName} (${customerName})` : customerName;
    const buyerLine1 = `${buyerDisplay} - ${customerPhone}`;
    const buyerLine2 = customerAddress || '';
    const buyerLine3 = [customerCity, customerState].filter(Boolean).join(' - ');

    let shipName = buyerDisplay;
    let shipPhone = customerPhone;
    let shipAddress = customerAddress;
    let shipCity = customerCity;
    let shipState = customerState;
    if (!sameAsBuyer && shippingAddress) {
      shipName = shippingAddress.name || buyerDisplay;
      shipPhone = shippingAddress.phone || customerPhone;
      shipAddress = shippingAddress.address || '';
      shipCity = shippingAddress.city || '';
      shipState = shippingAddress.state || '';
    }
    const shipLine1 = `${shipName} - ${shipPhone}`;
    const shipLine2 = shipAddress || '';
    const shipLine3 = [shipCity, shipState].filter(Boolean).join(' - ');

    // Reference date
    const refDate = createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const refDisplay = referenceNo ? `${referenceNo} dt. ${refDate}` : '';

    // Items rows
    let itemsRows = '';
    items.forEach((item, idx) => {
      const amount = item.qty * item.price;
      itemsRows += `
        <tr>
          <td style="text-align:center;padding:6px;border:1px solid #000">${idx + 1}</td>
          <td style="padding:6px;border:1px solid #000">${item.name}</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">-</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">${item.qty} NOS</td>
          <td style="text-align:right;padding:6px;border:1px solid #000">₹${item.price}</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">NOS</td>
          <td style="text-align:right;padding:6px;border:1px solid #000">₹${amount}.00</td>
        </tr>`;
    });

    const discountRow = discount > 0 ? `
      <tr>
        <td style="border:1px solid #000;padding:6px"></td>
        <td style="border:1px solid #000;padding:6px">DISCOUNT</td>
        <td style="border:1px solid #000;padding:6px"></td>
        <td style="border:1px solid #000;padding:6px"></td>
        <td style="border:1px solid #000;padding:6px"></td>
        <td style="border:1px solid #000;padding:6px"></td>
        <td style="border:1px solid #000;padding:6px;text-align:right">₹${discount}.00</td>
      </tr>` : '';

    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

    // ─── The exact same HTML as the approved InvoicePage print window ───
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <base href="about:blank">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
          @page { margin: 10mm; size: A4 portrait; }

          .invoice-outer {
            background: #fff;
            color: #000;
            padding: 1rem;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          p { margin: 2px 0; }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.5rem 0;
            font-size: 0.75rem;
          }

          /* Light‑gray header with black text – matches your reference */
          .items-table th {
            border: 1px solid #000;
            padding: 0.45rem 0.4rem;
            background: #f0f0f0 !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 0.72rem;
            letter-spacing: 0.6px;
            text-align: left;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .items-table td {
            border: 1px solid #000;
            padding: 0.35rem 0.4rem;
            background: #ffffff;
            color: #000000;
            -webkit-text-fill-color: #000000;
            vertical-align: middle;
          }

          .items-table tbody tr:nth-child(even) td {
            background: #f5f5f5 !important;
          }

          .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.75rem;
          }

          .meta-table td {
            border: 1px solid #000;
            padding: 0.25rem 0.35rem;
            background: #ffffff;
            color: #000000;
            -webkit-text-fill-color: #000000;
          }

          /* Ultimate override – guarantee black text everywhere */
          * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            background-color: transparent !important;
          }
          body {
            background-color: #ffffff !important;
          }
          .invoice-outer {
            background-color: #ffffff !important;
            border: 1px solid #000 !important;
          }
          .items-table th {
            background: #f0f0f0 !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          .items-table td {
            background: #ffffff !important;
          }
          .items-table tbody tr:nth-child(even) td {
            background: #f5f5f5 !important;
          }

          /* Page‑break for long invoices */
          .items-table tr {
            page-break-inside: avoid;
          }
          .items-table thead {
            display: table-header-group;
          }
        </style>
      </head>
      <body>
        <div class="invoice-outer">
          <!-- Company Header -->
          <div style="text-align:center; border-bottom:1px solid #000; padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.1rem;">RADNUS COMMUNICATION</h2>
            <p style="font-size:0.75rem;">No.242/44, MG Road, Sinnaya Plaza, Near Fish Market</p>
            <p style="font-size:0.75rem;">Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 605001</p>
            <p style="font-size:0.75rem;">E-Mail: sundar12134@gmail.com</p>
            <p style="font-weight:700; font-size:0.8rem;">GST: 34AAHFR8679B</p>
          </div>

          <!-- Invoice Title -->
          <div style="text-align:center; font-size:1rem; font-weight:bold; padding:0.5rem; border-bottom:1px solid #000;">INVOICE</div>

          <!-- Two columns: Consignee + Meta -->
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:50%; padding:0.5rem; border-right:1px solid #000;">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;">Consignee (Ship to)</div>
              <p style="font-size:0.78rem;">${shipLine1}</p>
              ${shipLine2 ? `<p style="font-size:0.78rem;">${shipLine2}</p>` : ''}
              ${shipLine3 ? `<p style="font-size:0.78rem;">${shipLine3}</p>` : ''}
              <div style="font-weight:700; font-size:0.95rem; margin:10px 0 4px;">Buyer (Bill to)</div>
              <p style="font-size:0.78rem;">${buyerLine1}</p>
              ${buyerLine2 ? `<p style="font-size:0.78rem;">${buyerLine2}</p>` : ''}
              ${buyerLine3 ? `<p style="font-size:0.78rem;">${buyerLine3}</p>` : ''}
            </div>
            <div style="width:50%; padding:0.5rem;">
              <table class="meta-table" style="width:100%; border-collapse:collapse; font-size:0.75rem;">
                <tr><td style="font-weight:600; white-space:nowrap;">Invoice No.</td><td>${invoiceNumber}</td></tr>
                <tr><td style="font-weight:600;">Dated</td><td>${new Date(createdAt).toDateString()}</td></tr>
                <tr><td style="font-weight:600;">Delivery Note</td><td></td></tr>
                <tr><td style="font-weight:600;">Mode/Terms of Payment</td><td>${paymentMode?.toUpperCase()}</td></tr>
                <tr><td style="font-weight:600;">Salesperson</td><td>${salesperson}</td></tr>
                <tr><td style="font-weight:600;">Reference No. &amp; Date</td><td>${refDisplay}</td></tr>
                <tr><td style="font-weight:600;">Buyer's Order No.</td><td></td></tr>
                <tr><td style="font-weight:600;">Dispatched through</td><td></td></tr>
                <tr><td style="font-weight:600;">Destination</td><td>${buyerLine3}</td></tr>
                <tr><td style="font-weight:600;">Terms of Delivery</td><td></td></tr>
              </table>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table" style="width:100%; border-collapse:collapse; margin:0.5rem 0;">
            <thead>
              <tr>
                <th>SL NO.</th><th>DESCRIPTION</th><th>HSN</th><th>QTY</th><th>RATE</th><th>PER</th><th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              ${discountRow}
              <tr>
                <td></td><td>COURIER CHARGE</td><td></td><td></td><td></td><td></td><td style="text-align:right">₹${courierCharge}.00</td>
              </tr>
              <tr>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;">Total</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:center">${totalQty} NOS</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:right">₹${grandTotal}.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount in Words -->
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Amount Chargeable (in words)</strong><br/>
            <span>${grandTotalWords}</span>
          </div>

          <!-- Declaration -->
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Declaration</strong><br/>
            <span style="font-size:0.78rem;">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</span>
          </div>

          <!-- Signature -->
          <div style="display:flex; padding:0.5rem; border-bottom:1px solid #000;">
            <div style="width:60%;">E. &amp; O.E</div>
            <div style="width:40%; text-align:right;">
              <strong>for RADNUS COMMUNICATION</strong>
              <div style="margin-top:2rem; border-top:1px solid #000; width:100%;"></div>
              <span>Authorised Signatory</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center; padding:0.5rem; font-size:0.7rem;">
            This is a Computer Generated Invoice
          </div>
        </div>
      </body>
      </html>`;
  };

  // ─── Download / Print handler ───
  const handleDownload = () => {
    setDownloading(true);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML());
    printWindow.document.close();
    printWindow.onload = () => printWindow.print(); // ensure it prints after the page is loaded
    setDownloading(false);
  };

  // ─── Page Render ───
  return (
    <div className={`invoice-view ${isDark ? 'dark' : ''}`}>
      <div className="view-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>Invoice Details</h1>
      </div>

      <div className="invoice-details">
        {/* Meta */}
        <div className="detail-card">
          <div className="detail-row">
            <span className="label">Invoice No.</span>
            <span>{invoiceNumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date</span>
            <span>{new Date(createdAt).toDateString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Biller</span>
            <span>{billerName}</span>
          </div>
          {salesperson && (
            <div className="detail-row">
              <span className="label">Salesperson</span>
              <span>{salesperson}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="detail-card">
          <h3>Customer</h3>
          <div className="detail-row">
            <Phone size={14} /> <span>{customerName} – {customerPhone}</span>
          </div>
          <div className="detail-row">
            <MapPin size={14} /> <span>{[customerAddress, customerCity, customerState].filter(Boolean).join(', ') || '—'}</span>
          </div>
          <div className="detail-row">
            <CreditCard size={14} /> <span>Payment: {paymentMode?.toUpperCase()}</span>
          </div>
        </div>

        {/* Items */}
        <div className="detail-card">
          <h3>Items ({items.length})</h3>
          <table className="items-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.qty * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="detail-card summary">
          <div className="summary-row">
            <span>Subtotal</span><span>₹{subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>Discount</span><span>- ₹{discount}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Courier Charge</span><span>₹{courierCharge}</span>
          </div>
          <div className="summary-row total">
            <span>Grand Total</span><span>₹{grandTotal}</span>
          </div>
        </div>

        <button className="download-btn" onClick={handleDownload} disabled={downloading}>
          <Download size={18} /> {downloading ? 'Preparing...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default InvoiceViewPage;