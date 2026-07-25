// // PurchaseHistoryPage.jsx

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { ClipboardList, Printer, Eye, Pencil } from 'lucide-react';
// import { fetchSuppliers } from '../../services/features/purchase/supplierSlice';
// import { fetchPurchases, updatePurchase } from '../../services/features/purchase/purchaseSlice';
// import {
//   SectionHeader, Button, Badge, DataTable, Modal, Input, Select, toast,
// } from '../../components/ui/UI';
// import radnusLogo from '../../assets/logo/radnus-logo.png';

// const STATUS_OPTIONS = [
//   { value: '', label: 'All Statuses' },
//   { value: 'paid', label: 'Paid' },
//   { value: 'partial', label: 'Partial' },
//   { value: 'unpaid', label: 'Unpaid' },
// ];

// const statusVariant = (status) => (status === 'paid' ? 'active' : status === 'partial' ? 'pending' : 'inactive');

// // View Modal Component
// const ViewModal = ({ open, onClose, purchase }) => {
//   if (!purchase) return null;
//   return (
//     <Modal open={open} onClose={onClose} title={`Purchase ${purchase.purchaseNumber}`} size="lg"
//       footer={<Button variant="primary" onClick={onClose}>Close</Button>}
//     >
//       <div className="form-row">
//         <div><div className="field-label" style={{ marginBottom: 4 }}>Supplier</div><div>{purchase.supplier?.name || '—'}</div></div>
//         <div><div className="field-label" style={{ marginBottom: 4 }}>Invoice No</div><div>{purchase.invoiceNumber}</div></div>
//       </div>
//       <div className="form-row" style={{ marginTop: 14 }}>
//         <div><div className="field-label" style={{ marginBottom: 4 }}>Invoice Date</div><div>{new Date(purchase.invoiceDate).toLocaleDateString()}</div></div>
//         <div><div className="field-label" style={{ marginBottom: 4 }}>Payment Type</div><div>{purchase.paymentType}</div></div>
//       </div>
//       <div className="divider" />
//       <table className="dtable" style={{ width: '100%' }}>
//         <thead>
//           <tr>
//             <th style={{ textAlign: 'left', padding: '6px 8px' }}>Product</th>
//             <th style={{ textAlign: 'left', padding: '6px 8px' }}>Batch</th>
//             <th style={{ textAlign: 'right', padding: '6px 8px' }}>Qty</th>
//             <th style={{ textAlign: 'right', padding: '6px 8px' }}>Price</th>
//             <th style={{ textAlign: 'right', padding: '6px 8px' }}>Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           {purchase.products?.map((p, i) => (
//             <tr key={i}>
//               <td style={{ padding: '6px 8px' }}>{p.name}</td>
//               <td style={{ padding: '6px 8px' }}>{p.batchNo}</td>
//               <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.quantity}</td>
//               <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{p.purchasePrice.toFixed(2)}</td>
//               <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{p.total.toFixed(2)}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <div className="divider" />
//       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24 }}>
//         <div style={{ textAlign: 'right' }}>
//           <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grand Total</div>
//           <div style={{ fontSize: 18, fontWeight: 700 }}>₹{purchase.grandTotal.toFixed(2)}</div>
//         </div>
//         <div style={{ textAlign: 'right' }}>
//           <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due</div>
//           <div style={{ fontSize: 18, fontWeight: 700, color: purchase.dueAmount > 0 ? 'var(--red)' : 'inherit' }}>
//             ₹{purchase.dueAmount.toFixed(2)}
//           </div>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// // Edit Modal Component
// const EditModal = ({ open, onClose, purchase, onSave }) => {
//   const [paymentType, setPaymentType] = useState('Credit');
//   const [remarks, setRemarks] = useState('');
//   const [paidAmount, setPaidAmount] = useState('0');
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (purchase) {
//       setPaymentType(purchase.paymentType || 'Credit');
//       setRemarks(purchase.remarks || '');
//       setPaidAmount(String(purchase.paidAmount || 0));
//     }
//   }, [purchase]);

//   if (!purchase) return null;

//   const handleSave = async () => {
//     setSaving(true);
//     try {
//       await onSave(purchase._id, { paymentType, remarks, paidAmount: Number(paidAmount) || 0 });
//       onClose();
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Modal open={open} onClose={onClose} title={`Edit ${purchase.purchaseNumber}`} size="md"
//       footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button></>}
//     >
//       <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
//         Line items and stock quantities can't be edited after saving. Only payment details can be updated here.
//       </p>
//       <Select
//         label="Payment Type"
//         options={['Credit', 'Cash', 'UPI', 'Bank Transfer', 'Cheque'].map((v) => ({ value: v, label: v }))}
//         value={paymentType}
//         onChange={(e) => setPaymentType(e.target.value)}
//       />
//       <div style={{ marginTop: 14 }}>
//         <Input label="Paid Amount" type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
//       </div>
//       <div style={{ marginTop: 14 }}>
//         <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
//       </div>
//     </Modal>
//   );
// };

// // Print Function - Matches the reference invoice layout exactly with ALL fields
// const printPurchase = (purchase) => {
//   const win = window.open('', '_blank');

//   // Company details (the entity issuing/printing the invoice)
//   const COMPANY = {
//     name: 'RADNUS COMMUNICATION',
//     addressLine1: 'No.242/244, MG ROAD, SINNAYA PLAZA',
//     addressLine2: 'NEAR FISH MARKET',
//     addressLine3: 'PUDUCHERRY - 605001',
//     stateLine: 'State Name : Puducherry, Code : 34',
//     email: 'sundar12134@gmail.com',
//   };

//   // Format date like "18-Jul-26"
//   const fmtDate = (v) => {
//     if (!v) return '—';
//     const d = new Date(v);
//     if (isNaN(d.getTime())) return '—';
//     return d.toLocaleDateString('en-GB', { 
//       day: '2-digit', 
//       month: 'short', 
//       year: '2-digit' 
//     }).replace(/ /g, '-');
//   };

//   // Format money
//   const fmtMoney = (v) => Number(v || 0).toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });

//   // Number to words
//   const amountInWords = (num) => {
//     if (num === 0) return 'Zero';
//     const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
//       'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
//       'Eighteen', 'Nineteen'];
//     const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//     if (num < 20) return ones[num];
//     if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
//     if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + amountInWords(num % 100) : '');
//     if (num < 100000) return amountInWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + amountInWords(num % 1000) : '');
//     if (num < 10000000) return amountInWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + amountInWords(num % 100000) : '');
//     return amountInWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + amountInWords(num % 10000000) : '');
//   };

//   const grandTotal = Number(purchase.grandTotal || 0);
//   const totalQty = purchase.products?.reduce((s, i) => s + Number(i.quantity || 0), 0) || 0;
//   const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;
//   const invoiceNumber = purchase.invoiceNumber || purchase.purchaseNumber || '—';
//   const invoiceDate = purchase.invoiceDate || purchase.createdAt;

//   const supplierAddressLines = (purchase.supplier?.address || '').split(/\r?\n|,\s*/).filter(Boolean);

//   // Get logo URL
//   const logoUrl = radnusLogo;

//   // Build product rows with alternating colors
//   let rows = '';
//   if (purchase.products && purchase.products.length > 0) {
//     purchase.products.forEach((p, idx) => {
//       const isEven = idx % 2 === 0;
//       const bgColor = isEven ? '#ffffff' : '#f5f5f5';
//       rows += `
//         <tr>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: center; vertical-align: middle; font-size: 0.75rem;">${idx + 1}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; vertical-align: middle; font-size: 0.75rem;">${p.name || '—'}${p.sku ? ` (${p.sku})` : ''}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: center; vertical-align: middle; font-size: 0.75rem;">${p.quantity || 0} ${p.unit || 'nos'}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: right; vertical-align: middle; font-size: 0.75rem;">${fmtMoney(p.purchasePrice)}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: center; vertical-align: middle; font-size: 0.75rem;">${p.unit || 'nos'}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: right; vertical-align: middle; font-size: 0.75rem;">${p.discPercent || ''}</td>
//           <td style="border: 1px solid #000; padding: 0.3rem 0.35rem; background: ${bgColor}; text-align: right; vertical-align: middle; font-size: 0.75rem;">${fmtMoney(p.total || (p.quantity * p.purchasePrice))}</td>
//         </tr>
//       `;
//     });
//   }

//   win.document.write(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <title>Invoice - ${invoiceNumber}</title>
//         <style>
//           * { margin: 0; padding: 0; box-sizing: border-box; }
//           body {
//             font-family: Arial, sans-serif;
//             background: #fff;
//             color: #000;
//             padding: 20px;
//           }
//           @page { margin: 10mm; size: A4 portrait; }

//           .invoice-outer {
//             background: #fff;
//             color: #000;
//             border: 2px solid #000;
//             max-width: 210mm;
//             margin: 0 auto;
//             padding: 1rem;
//           }

//           /* Header with Logo and Title - EXACTLY LIKE REFERENCE */
//           .header-row {
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             padding: 0.5rem 1rem;
//             border-bottom: 2px solid #000;
//             background: #ffffff;
//           }
//           .logo-box {
//             display: flex;
//             flex-direction: column;
//             align-items: center;
//             min-width: 130px;
//           }
//           .logo-box img {
//             height: 50px;
//             width: auto;
//             max-width: 130px;
//             object-fit: contain;
//             display: block;
//           }
//           .invoice-title {
//             font-size: 1.4rem;
//             font-weight: bold;
//             letter-spacing: 3px;
//             text-align: center;
//             flex: 1;
//             color: #000;
//           }
//           .spacer {
//             min-width: 130px;
//           }

//           /* Company Info + Meta Table */
//           .info-row {
//             display: flex;
//             border-bottom: 1px solid #000;
//             background: #ffffff;
//           }
//           .company-details {
//             width: 50%;
//             padding: 0.5rem;
//             border-right: 1px solid #000;
//           }
//           .company-details .name {
//             font-weight: 700;
//             font-size: 0.9rem;
//             margin-bottom: 2px;
//             color: #000;
//           }
//           .company-details .detail {
//             font-size: 0.75rem;
//             line-height: 1.4;
//             color: #000;
//           }
//           .meta-table-wrapper {
//             width: 50%;
//             padding: 0.5rem;
//           }
//           .meta-table {
//             width: 100%;
//             border-collapse: collapse;
//             font-size: 0.75rem;
//           }
//           .meta-table td {
//             border: 1px solid #000;
//             padding: 0.25rem 0.35rem;
//             background: #ffffff;
//             color: #000;
//           }
//           .meta-table .label {
//             font-weight: 600;
//             white-space: nowrap;
//             color: #000;
//           }

//           /* Consignee + Supplier */
//           .party-row {
//             display: flex;
//             border-bottom: 1px solid #000;
//             background: #ffffff;
//           }
//           .party-col {
//             width: 50%;
//             padding: 0.5rem;
//           }
//           .party-col.left {
//             border-right: 1px solid #000;
//           }
//           .party-col .title {
//             font-weight: 700;
//             font-size: 0.95rem;
//             margin-bottom: 4px;
//             color: #000;
//           }
//           .party-col .name {
//             font-weight: 600;
//             font-size: 0.78rem;
//             color: #000;
//           }
//           .party-col .detail {
//             font-size: 0.78rem;
//             line-height: 1.4;
//             color: #000;
//           }

//           /* Items Table */
//           .items-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin: 0.5rem 0;
//           }
//           .items-table th {
//             border: 1px solid #000;
//             padding: 0.45rem 0.4rem;
//             background: #f0f0f0;
//             color: #000;
//             font-weight: 800;
//             text-transform: uppercase;
//             font-size: 0.72rem;
//             letter-spacing: 0.6px;
//             text-align: left;
//           }
//           .items-table td {
//             border: 1px solid #000;
//             padding: 0.3rem 0.35rem;
//             vertical-align: middle;
//             font-size: 0.75rem;
//             color: #000;
//           }
//           .items-table .total-row td {
//             background: #e8e8e8;
//             font-weight: 700;
//             border-top: 2px solid #000;
//             color: #000;
//           }

//           /* Amount in Words */
//           .words-row {
//             display: flex;
//             justify-content: space-between;
//             padding: 0.5rem;
//             border-bottom: 1px solid #000;
//             background: #ffffff;
//           }
//           .words-row strong {
//             color: #000;
//           }
//           .words-row span {
//             color: #000;
//           }
//           .words-row .eoe {
//             font-style: italic;
//             align-self: flex-start;
//             color: #000;
//           }

//           /* Declaration */
//           .declaration-row {
//             padding: 0.5rem;
//             border-bottom: 1px solid #000;
//             background: #ffffff;
//           }
//           .declaration-row .title {
//             font-weight: 700;
//             color: #000;
//             margin-bottom: 3px;
//           }
//           .declaration-row .text {
//             font-size: 0.78rem;
//             color: #000;
//           }

//           /* GSTIN + Signature */
//           .sign-row {
//             display: flex;
//             padding: 0.5rem;
//             border-bottom: 1px solid #000;
//             background: #ffffff;
//           }
//           .sign-row .left {
//             width: 60%;
//             font-size: 0.78rem;
//             color: #000;
//           }
//           .sign-row .right {
//             width: 40%;
//             text-align: right;
//             color: #000;
//           }
//           .sign-row .right strong {
//             color: #000;
//           }
//           .sign-row .right .sign-line {
//             margin-top: 2rem;
//             border-top: 1px solid #000;
//           }
//           .sign-row .right span {
//             color: #000;
//           }

//           /* Footer */
//           .footer {
//             text-align: center;
//             padding: 0.5rem;
//             font-size: 0.7rem;
//             background: #ffffff;
//             color: #000;
//           }

//           @media print {
//             body { padding: 10px; }
//             .items-table th { background: #f0f0f0 !important; }
//             .items-table .total-row td { background: #e8e8e8 !important; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="invoice-outer">

//           <!-- Header with Logo -->
//           <div class="header-row">
//             <div class="logo-box">
//               <img src="${logoUrl}" alt="RADNUS" />
//             </div>
//             <div class="invoice-title">INVOICE</div>
//             <div class="spacer"></div>
//           </div>

//           <!-- Company Info + Meta Table (matches reference: only 4 fields) -->
//           <div class="info-row">
//             <div class="company-details">
//               <div class="name">${COMPANY.name}</div>
//               <div class="detail">${COMPANY.addressLine1}</div>
//               <div class="detail">${COMPANY.addressLine2}</div>
//               <div class="detail">${COMPANY.addressLine3}</div>
//               <div class="detail">${COMPANY.stateLine}</div>
//               <div class="detail">E-Mail : ${COMPANY.email}</div>
//             </div>
//             <div class="meta-table-wrapper">
//               <table class="meta-table">
//                 <tbody>
//                   <tr>
//                     <td class="label">Invoice No.</td>
//                     <td>${invoiceNumber}</td>
//                   </tr>
//                   <tr>
//                     <td class="label">Dated</td>
//                     <td>${fmtDate(invoiceDate)}</td>
//                   </tr>
//                   <tr>
//                     <td class="label">Supplier Invoice No. &amp; Date.</td>
//                     <td>${purchase.supplierInvoiceNumber ? purchase.supplierInvoiceNumber + (purchase.supplierInvoiceDate ? ' dt. ' + fmtDate(purchase.supplierInvoiceDate) : '') : '—'}</td>
//                   </tr>
//                   <tr>
//                     <td class="label">Other References</td>
//                     <td>${purchase.otherReferences || '—'}</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <!-- Consignee + Supplier -->
//           <div class="party-row">
//             <div class="party-col left">
//               <div class="title">Consignee (Ship to)</div>
//               <div class="name">${COMPANY.name}</div>
//               <div class="detail">${COMPANY.addressLine1}</div>
//               <div class="detail">${COMPANY.addressLine2}</div>
//               <div class="detail">${COMPANY.addressLine3}</div>
//               <div class="detail">${COMPANY.stateLine}</div>
//             </div>
//             <div class="party-col">
//               <div class="title">Supplier (Bill from)</div>
//               <div class="name">${purchase.supplier?.name || '—'}</div>
//               ${supplierAddressLines.map((line) => `<div class="detail">${line}</div>`).join('')}
//               ${purchase.supplier?.gstNo ? `<div class="detail">GSTIN : ${purchase.supplier.gstNo}</div>` : ''}
//               ${purchase.supplier?.mobile ? `<div class="detail">Mobile : ${purchase.supplier.mobile}</div>` : ''}
//             </div>
//           </div>

//           <!-- Items Table -->
//           <table class="items-table">
//             <thead>
//               <tr>
//                 <th style="width: 50px;">SI No.</th>
//                 <th style="text-align:left;">Description of Goods</th>
//                 <th style="width: 80px; text-align:center;">Quantity</th>
//                 <th style="width: 80px; text-align:right;">Rate</th>
//                 <th style="width: 60px; text-align:center;">per</th>
//                 <th style="width: 70px; text-align:right;">Disc. %</th>
//                 <th style="width: 100px; text-align:right;">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${rows}
//               <tr class="total-row">
//                 <td></td>
//                 <td>Total</td>
//                 <td style="text-align:center;">${totalQty} nos</td>
//                 <td></td>
//                 <td></td>
//                 <td></td>
//                 <td style="text-align:right;">₹ ${fmtMoney(grandTotal)}</td>
//               </tr>
//             </tbody>
//           </table>

//           <!-- Amount in Words -->
//           <div class="words-row">
//             <div>
//               <strong>Amount Chargeable (in words)</strong><br />
//               <span>${grandTotalWords}</span>
//             </div>
//             <div class="eoe">E. &amp; O.E</div>
//           </div>

//           <!-- Declaration -->
//           <div class="declaration-row">
//             <div class="title">Declaration</div>
//             <div class="text">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
//           </div>

//           <!-- GSTIN + Signature -->
//           <div class="sign-row">
//             <div class="left">
//               Company's GSTIN/UIN : ${purchase.gstin || purchase.supplier?.gstNo || '—'}
//             </div>
//             <div class="right">
//               <strong>for ${COMPANY.name}</strong>
//               <div class="sign-line"></div>
//               <span>Authorised Signatory</span>
//             </div>
//           </div>

//           <!-- Footer -->
//           <div class="footer">This is a Computer Generated Invoice</div>
//         </div>
//       </body>
//     </html>
//   `);

//   win.document.close();
//   win.focus();

//   setTimeout(() => {
//     win.print();
//   }, 500);
// };

// // Main Purchase History Page Component
// const PurchaseHistoryPage = () => {
//   const dispatch = useDispatch();
//   const { list: purchases, loading } = useSelector((s) => s.purchases);
//   const { list: suppliers } = useSelector((s) => s.suppliers);

//   const [search, setSearch] = useState('');
//   const [supplierFilter, setSupplierFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [viewTarget, setViewTarget] = useState(null);
//   const [editTarget, setEditTarget] = useState(null);

//   useEffect(() => {
//     dispatch(fetchSuppliers());
//   }, [dispatch]);

//   useEffect(() => {
//     dispatch(fetchPurchases({ supplier: supplierFilter, paymentStatus: statusFilter, search }));
//   }, [dispatch, supplierFilter, statusFilter]);

//   useEffect(() => {
//     const t = setTimeout(() => {
//       dispatch(fetchPurchases({ supplier: supplierFilter, paymentStatus: statusFilter, search }));
//     }, 350);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line
//   }, [search]);

//   const handleUpdate = async (id, payload) => {
//     try {
//       await dispatch(updatePurchase({ id, payload })).unwrap();
//       toast.success('Purchase updated');
//     } catch (err) {
//       toast.error(err || 'Failed to update purchase');
//     }
//   };

//   const supplierOptions = [{ value: '', label: 'All Suppliers' }, ...suppliers.map((s) => ({ value: s._id, label: s.name }))];

//   const columns = [
//     { key: 'purchaseNumber', label: 'Purchase No' },
//     { key: 'supplier', label: 'Supplier', render: (v) => v?.name || '—' },
//     { key: 'invoiceNumber', label: 'Invoice' },
//     { key: 'products', label: 'Items', render: (v) => v?.length || 0 },
//     { key: 'grandTotal', label: 'Grand Total', render: (v) => `₹${Number(v).toFixed(2)}` },
//     {
//       key: 'paymentStatus', label: 'Status',
//       render: (v) => <Badge variant={statusVariant(v)}>{(v || 'unpaid').toUpperCase()}</Badge>,
//     },
//     { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
//     {
//       key: '_id', label: 'Actions',
//       render: (_, row) => (
//         <div className="td-actions">
//           <Button variant="outline" size="xs" icon={<Eye size={13} />} onClick={() => setViewTarget(row)}>View</Button>
//           <Button variant="outline" size="xs" icon={<Pencil size={13} />} onClick={() => setEditTarget(row)}>Edit</Button>
//           <Button variant="ghost" size="xs" icon={<Printer size={13} />} onClick={() => printPurchase(row)}>Print</Button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div>
//       <SectionHeader title="Purchase History" count={purchases.length} />
//       <div className="form-row-3" style={{ marginBottom: 14 }}>
//         <Select label="Supplier" options={supplierOptions} value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} />
//         <Select label="Payment Status" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
//         <Input label="Search" placeholder="Purchase no, invoice, supplier…" value={search} onChange={(e) => setSearch(e.target.value)} />
//       </div>
//       <DataTable
//         columns={columns}
//         data={purchases}
//         loading={loading}
//         emptyIcon={<ClipboardList size={36} />}
//         emptyText="No purchase entries found"
//       />
//       <ViewModal open={!!viewTarget} onClose={() => setViewTarget(null)} purchase={viewTarget} />
//       <EditModal open={!!editTarget} onClose={() => setEditTarget(null)} purchase={editTarget} onSave={handleUpdate} />
//     </div>
//   );
// };

// export default PurchaseHistoryPage;

