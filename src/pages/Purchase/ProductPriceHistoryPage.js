// import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, useParams } from 'react-router-dom';
// import {
//   ArrowLeft, Wallet, TrendingDown, TrendingUp, CalendarDays, ShoppingCart,
//   Filter, RotateCcw, FileSpreadsheet, Printer, History, MoreVertical, Eye,
//   Package, Tag, Box, Layers, Search, ChevronDown, SlidersHorizontal
// } from 'lucide-react';
// import { fetchProducts } from '../../services/features/products/productSlice';
// import { fetchSuppliers } from '../../services/features/purchase/supplierSlice';
// import { fetchProductPriceHistory, clearProductPriceHistory } from '../../services/features/purchase/purchaseSlice';
// import {
//   SectionHeader, Card, StatCard, Input, Select, Button, DataTable, Modal, toast,
// } from '../../components/ui/UI';
// import { exportProductPriceHistoryToExcel } from '../../utils/excelExport';

// const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : `₹${Number(v).toFixed(2)}`);
// const fmtDate = (v) => {
//   if (!v) return '—';
//   const d = new Date(v);
//   return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
// };

// /* ─── Product List View (default screen — shows ALL products) ──────────────────
//    Instead of forcing the user to search before seeing anything, this lists every
//    product up front. A compact search box sits top-right to narrow the list down. */
// const ProductListView = ({ products, loading, onBack, onSelect }) => {
//   const [search, setSearch] = useState('');

//   const filtered = useMemo(() => {
//     const list = products || [];
//     if (!search.trim()) return list;
//     const q = search.toLowerCase();
//     return list.filter(
//       (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
//     );
//   }, [search, products]);

//   const rows = filtered.map((p, i) => ({ ...p, __no: i + 1 }));

//   const columns = [
//     { key: '__no', label: 'No.', width: 50 },
//     {
//       key: 'name',
//       label: 'Product Name',
//       render: (v, row) => (
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//           <div style={{
//             width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card-hover)',
//             border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
//             justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
//           }}>
//             {row.image ? (
//               <img src={row.image} alt={v} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//             ) : (
//               <Package size={15} style={{ color: 'var(--text-muted)' }} />
//             )}
//           </div>
//           <span style={{ fontWeight: 600 }}>{v}</span>
//         </div>
//       ),
//     },
//     { key: 'sku', label: 'SKU', render: (v) => v || '—' },
//     { key: 'category', label: 'Category', render: (v) => v || '—' },
//     { key: 'unit', label: 'Unit', render: (v) => v || 'Pcs' },
//     {
//       key: '__actions',
//       label: '',
//       width: 150,
//       render: (_, row) => (
//         <Button variant="secondary" size="sm" icon={<History size={13} />} onClick={() => onSelect(row._id)}>
//           View History
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <div className="pph-container">
//       <PageHeaderBar onBack={onBack} />
//       <SectionHeader
//         title="Product Price History"
//         count={rows.length}
//         action={
//           <div style={{ maxWidth: 240, width: '100%' }}>
//             <Input
//               placeholder="Search by name or SKU..."
//               icon={<Search size={14} />}
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               autoComplete="off"
//             />
//           </div>
//         }
//       />
//       <Card className="card-pad" style={{ padding: 0, overflow: 'hidden' }}>
//         <DataTable
//           columns={columns}
//           data={rows}
//           loading={loading}
//           emptyIcon={<Package size={36} />}
//           emptyText={search.trim() ? 'No products found' : 'No products available'}
//           keyField="_id"
//         />
//       </Card>
//     </div>
//   );
// };

// /* ─── Row actions (kebab menu → view details) ───────────────────────────────── */
// const RowActions = ({ row, onView }) => {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
//     document.addEventListener('mousedown', onClickOutside);
//     return () => document.removeEventListener('mousedown', onClickOutside);
//   }, []);

//   return (
//     <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
//       <button
//         type="button"
//         onClick={() => setOpen((o) => !o)}
//         style={{
//           background: open ? 'var(--bg-card-hover)' : 'none', border: 'none', cursor: 'pointer',
//           padding: 6, borderRadius: 8, color: 'var(--text-muted)', display: 'flex',
//         }}
//       >
//         <MoreVertical size={16} />
//       </button>
//       {open && (
//         <div
//           style={{
//             position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 15, minWidth: 150,
//             background: 'var(--bg-modal)', border: '1px solid var(--border)',
//             borderRadius: 10, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.18)', overflow: 'hidden',
//           }}
//         >
//           <button
//             type="button"
//             onClick={() => { setOpen(false); onView(row); }}
//             style={{
//               display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
//               background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
//               color: 'var(--text-primary)', textAlign: 'left',
//             }}
//             onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
//             onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//           >
//             <Eye size={14} /> View Details
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ─── Detail modal for a single purchase row ────────────────────────────────── */
// const DetailModal = ({ row, onClose }) => {
//   if (!row) return null;
//   const field = (label, value) => (
//     <div>
//       <div className="field-label" style={{ marginBottom: 5, fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
//       <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value ?? '—'}</div>
//     </div>
//   );
//   return (
//     <Modal open={!!row} onClose={onClose} title={`Purchase ${row.purchaseNumber || ''}`} size="md"
//       footer={<Button variant="primary" onClick={onClose}>Close</Button>}
//     >
//       <div className="form-row-3">
//         {field('Purchase Date', fmtDate(row.purchaseDate || row.invoiceDate))}
//         {field('Invoice No', row.invoiceNumber)}
//         {field('Supplier', row.supplierName)}
//       </div>
//       <div className="form-row-3" style={{ marginTop: 16 }}>
//         {field('Qty', row.quantity)}
//         {field('Batch No', row.batchNo)}
//         {field('Rack No', row.rackNo || '—')}
//       </div>
//       <div className="divider" style={{ margin: '16px 0' }} />
//       <div className="form-row-3">
//         {field('Purchase Price', fmt(row.purchasePrice))}
//         {field('Item Cost', fmt(row.itemCost))}
//         {field('Distributor Price', fmt(row.distributorPrice))}
//       </div>
//       <div className="form-row-3" style={{ marginTop: 16 }}>
//         {field('Retail Price', fmt(row.retailerPrice))}
//         {field('Walk-in Price', fmt(row.walkinPrice))}
//         {field('MRP', fmt(row.mrp))}
//       </div>
//       <div className="divider" style={{ margin: '16px 0' }} />
//       <div className="form-row-3">
//         {field('GST %', `${row.gst || 0}%`)}
//         {field('Payment Type', row.paymentType)}
//         {field('Created By', row.createdBy || '—')}
//       </div>
//       {row.remarks && (
//         <div style={{ marginTop: 16 }}>
//           {field('Remarks', row.remarks)}
//         </div>
//       )}
//     </Modal>
//   );
// };

// const printHistory = (product, rows) => {
//   const win = window.open('', '_blank');
//   if (!win) return;

//   let trs = '';
//   rows.forEach((r, i) => {
//     trs += `
//       <tr>
//         <td>${i + 1}</td>
//         <td>${fmtDate(r.purchaseDate || r.invoiceDate)}</td>
//         <td>${r.invoiceNumber || ''}</td>
//         <td>${r.supplierName || ''}</td>
//         <td>${r.batchNo || ''}</td>
//         <td style="text-align:right">${r.quantity ?? ''}</td>
//         <td style="text-align:right">${fmt(r.purchasePrice)}</td>
//         <td style="text-align:right">${fmt(r.itemCost)}</td>
//         <td style="text-align:right">${fmt(r.distributorPrice)}</td>
//         <td style="text-align:right">${fmt(r.retailerPrice)}</td>
//         <td style="text-align:right">${fmt(r.walkinPrice)}</td>
//         <td style="text-align:right">${fmt(r.mrp)}</td>
//         <td style="text-align:right">${r.gst || 0}%</td>
//       </tr>
//     `;
//   });

//   win.document.write(`
//     <html>
//       <head>
//         <title>Price History — ${product?.name || ''}</title>
//         <style>
//           body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1f2430;}
//           h2{color:#111;margin-bottom:4px;}
//           table{width:100%;border-collapse:collapse;margin-top:18px;}
//           th,td{border:1px solid #e2e4e9;padding:8px 10px;font-size:11.5px;}
//           th{background:#f7f8fa;text-align:left;font-weight:700;color:#444;}
//           tr:nth-child(even) td{background:#fafbfc;}
//           .header-info{margin-bottom:4px;color:#666;font-size:13px;}
//         </style>
//       </head>
//       <body>
//         <h2>Product Price History</h2>
//         <p class="header-info">Product: <strong>${product?.name || ''}</strong> &nbsp;|&nbsp; SKU: ${product?.sku || ''} &nbsp;|&nbsp; Category: ${product?.category || ''}</p>
//         <table>
//           <thead>
//             <tr>
//               <th>No</th><th>Date</th><th>Invoice</th><th>Supplier</th><th>Batch</th><th>Qty</th>
//               <th>Purchase Price</th><th>Item Cost</th><th>Distributor</th><th>Retail</th><th>Walk-in</th><th>MRP</th><th>GST%</th>
//             </tr>
//           </thead>
//           <tbody>${trs}</tbody>
//         </table>
//       </body>
//     </html>
//   `);
//   win.document.close();
//   win.focus();
//   win.print();
// };

// /* ─── Small presentational helpers ──────────────────────────────────────────── */
// const MetaPill = ({ icon, children }) => (
//   <span
//     style={{
//       display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5,
//       color: 'var(--text-secondary)', background: 'var(--bg-page, var(--bg-card-hover))',
//       border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 999,
//       fontWeight: 500,
//     }}
//   >
//     {icon} {children}
//   </span>
// );

// const PriceTile = ({ label, value, color }) => (
//   <div
//     style={{
//       flex: '1 1 150px', minWidth: 140, padding: '12px 14px', borderRadius: 12,
//       background: `color-mix(in srgb, var(--${color}) 8%, transparent)`,
//       border: `1px solid color-mix(in srgb, var(--${color}) 22%, var(--border-subtle))`,
//     }}
//   >
//     <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
//       {label}
//     </div>
//     <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
//   </div>
// );

// const PageHeaderBar = ({ onBack, right }) => (
//   <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
//     <button
//       type="button"
//       onClick={onBack}
//       className="pph-back-btn"
//       style={{
//         display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600,
//         color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer',
//         padding: '6px 4px',
//       }}
//     >
//       <ArrowLeft size={16} /> Back to Purchase Entry
//     </button>
//     {right}
//   </div>
// );

// const ProductPriceHistoryPage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { productId } = useParams();

//   const { list: suppliers } = useSelector((s) => s.suppliers);
//   const { list: products, loading: productsLoading } = useSelector((s) => s.products);
//   const {
//     productPriceHistory,
//     productPriceHistoryLoading,
//     productPriceHistoryError
//   } = useSelector((s) => s.purchases);

//   const [detailRow, setDetailRow] = useState(null);
//   const [selectedProductId, setSelectedProductId] = useState(productId || null);
//   const [filtersOpen, setFiltersOpen] = useState(true);

//   const emptyFilters = { supplier: '', fromDate: '', toDate: '', invoiceNumber: '', batchNo: '', priceFrom: '', priceTo: '', gst: '' };
//   const [draft, setDraft] = useState(emptyFilters);
//   const [applied, setApplied] = useState(emptyFilters);

//   // Load suppliers and products on mount
//   useEffect(() => {
//     dispatch(fetchSuppliers());
//     dispatch(fetchProducts());
//   }, [dispatch]);

//   // Handle product selection
//   useEffect(() => {
//     if (selectedProductId) {
//       dispatch(fetchProductPriceHistory(selectedProductId))
//         .unwrap()
//         .catch((err) => {
//           toast.error(err || 'Failed to load product price history');
//         });
//     } else {
//       dispatch(clearProductPriceHistory());
//     }
//     setDraft(emptyFilters);
//     setApplied(emptyFilters);
//     // eslint-disable-next-line
//   }, [dispatch, selectedProductId]);

//   // Update URL when product is selected
//   const handleProductSelect = (id) => {
//     setSelectedProductId(id);
//     if (id) {
//       navigate(`/purchase/product-price-history/${id}`, { replace: true });
//     }
//   };

//   const product = productPriceHistory?.product;
//   const summary = productPriceHistory?.summary;
//   const history = productPriceHistory?.history || [];

//   const activeFilterCount = Object.values(applied).filter((v) => v !== '' && v !== null && v !== undefined).length;

//   const gstOptions = useMemo(() => {
//     const unique = Array.from(new Set(history.map((h) => Number(h.gst) || 0))).sort((a, b) => a - b);
//     return [{ value: '', label: 'All GST' }, ...unique.map((g) => ({ value: String(g), label: `${g}%` }))];
//   }, [history]);

//   const supplierOptions = [
//     { value: '', label: 'All Suppliers' },
//     ...suppliers.map((s) => ({ value: s._id, label: s.name })),
//   ];

//   const filteredHistory = useMemo(() => {
//     return history.filter((row) => {
//       if (applied.supplier && String(row.supplierId) !== String(applied.supplier)) return false;
//       const rowDate = new Date(row.purchaseDate || row.invoiceDate);
//       if (applied.fromDate && rowDate < new Date(applied.fromDate)) return false;
//       if (applied.toDate) {
//         const to = new Date(applied.toDate);
//         to.setHours(23, 59, 59, 999);
//         if (rowDate > to) return false;
//       }
//       if (applied.invoiceNumber && !String(row.invoiceNumber || '').toLowerCase().includes(applied.invoiceNumber.toLowerCase())) return false;
//       if (applied.batchNo && !String(row.batchNo || '').toLowerCase().includes(applied.batchNo.toLowerCase())) return false;
//       if (applied.priceFrom && Number(row.purchasePrice) < Number(applied.priceFrom)) return false;
//       if (applied.priceTo && Number(row.purchasePrice) > Number(applied.priceTo)) return false;
//       if (applied.gst !== '' && Number(row.gst) !== Number(applied.gst)) return false;
//       return true;
//     });
//   }, [history, applied]);

//   const columns = [
//     { key: '__no', label: 'No.', render: (v) => v },
//     { key: 'purchaseDate', label: 'Purchase Date', render: (v, row) => fmtDate(v || row.invoiceDate) },
//     { key: 'invoiceNumber', label: 'Invoice No.' },
//     { key: 'supplierName', label: 'Supplier' },
//     { key: 'batchNo', label: 'Batch No.' },
//     { key: 'quantity', label: 'Qty' },
//     { key: 'purchasePrice', label: 'Purchase Price', render: (v) => fmt(v) },
//     { key: 'itemCost', label: 'Item Cost', render: (v) => fmt(v) },
//     { key: 'distributorPrice', label: 'Distributor Price', render: (v) => fmt(v) },
//     { key: 'retailerPrice', label: 'Retail Price', render: (v) => fmt(v) },
//     { key: 'walkinPrice', label: 'Walk-in Price', render: (v) => fmt(v) },
//     { key: 'mrp', label: 'MRP', render: (v) => fmt(v) },
//     { key: 'gst', label: 'GST %', render: (v) => `${v || 0}%` },
//     { key: 'rackNo', label: 'Rack No.', render: (v) => v || '—' },
//     { key: 'remarks', label: 'Remarks', render: (v) => v || '—' },
//     { key: 'createdBy', label: 'Created By', render: (v) => v || '—' },
//     {
//       key: '__actions', label: 'Actions',
//       render: (_, row) => <RowActions row={row} onView={setDetailRow} />,
//     },
//   ];

//   const dataWithIndex = filteredHistory.map((row, i) => ({
//     ...row,
//     _id: row.purchaseId ? `${row.purchaseId}-${i}` : `row-${i}`,
//     __no: i + 1,
//   }));

//   const handleApply = () => setApplied(draft);
//   const handleReset = () => { setDraft(emptyFilters); setApplied(emptyFilters); };

//   // If no product selected, show the full product list with a small search box
//   if (!selectedProductId) {
//     return (
//       <ProductListView
//         products={products}
//         loading={productsLoading}
//         onBack={() => navigate('/purchase/entry')}
//         onSelect={handleProductSelect}
//       />
//     );
//   }

//   // Loading state
//   if (productPriceHistoryLoading) {
//     return (
//       <div className="pph-container">
//         <PageHeaderBar
//           onBack={() => navigate('/purchase/entry')}
//           right={<Button variant="secondary" size="sm" onClick={() => handleProductSelect(null)}>Change Product</Button>}
//         />
//         <SectionHeader title="Product Price History" />
//         <Card className="card-pad">
//           <div style={{ textAlign: 'center', padding: '56px 20px' }}>
//             <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
//             <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Loading product price history...</p>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   // Error state
//   if (productPriceHistoryError) {
//     return (
//       <div className="pph-container">
//         <PageHeaderBar
//           onBack={() => navigate('/purchase/entry')}
//           right={<Button variant="secondary" size="sm" onClick={() => handleProductSelect(null)}>Change Product</Button>}
//         />
//         <SectionHeader title="Product Price History" />
//         <Card className="card-pad">
//           <div style={{ textAlign: 'center', padding: '48px 20px' }}>
//             <div style={{
//               width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, var(--red) 12%, transparent)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26,
//             }}>⚠️</div>
//             <h3 style={{ color: 'var(--red)', marginBottom: 6, fontSize: 16 }}>Error Loading Data</h3>
//             <p style={{ color: 'var(--text-muted)', marginBottom: 18, fontSize: 13.5 }}>{productPriceHistoryError}</p>
//             <Button
//               variant="primary"
//               onClick={() => dispatch(fetchProductPriceHistory(selectedProductId))}
//             >
//               Retry
//             </Button>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   // No data state
//   if (!product || history.length === 0) {
//     return (
//       <div className="pph-container">
//         <PageHeaderBar
//           onBack={() => navigate('/purchase/entry')}
//           right={<Button variant="secondary" size="sm" onClick={() => handleProductSelect(null)}>Change Product</Button>}
//         />
//         <SectionHeader title="Product Price History" />
//         <Card className="card-pad">
//           <div style={{ textAlign: 'center', padding: '56px 20px' }}>
//             <div style={{
//               width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-card-hover)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
//             }}>
//               <Package size={30} style={{ color: 'var(--text-muted)' }} />
//             </div>
//             <h3 style={{ color: 'var(--text-primary)', marginBottom: 6, fontSize: 17 }}>No Price History Found</h3>
//             <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 13.5 }}>
//               No purchase records found for <strong>{product?.name || 'this product'}</strong>
//             </p>
//             <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
//               SKU: {product?.sku || '—'} · Category: {product?.category || '—'}
//             </p>
//             <div style={{ marginTop: 20 }}>
//               <Button variant="secondary" onClick={() => handleProductSelect(null)}>
//                 Select Another Product
//               </Button>
//             </div>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   // Main display with all data
//   return (
//     <div className="pph-container">
//       <PageHeaderBar
//         onBack={() => navigate('/purchase/entry')}
//         right={<Button variant="secondary" size="sm" onClick={() => handleProductSelect(null)}>Change Product</Button>}
//       />

//       <SectionHeader title="Product Price History" />

//       {/* ─── Product Info Card ─────────────────────────────────────── */}
//       <div className="pph-product-card" style={{ marginBottom: 20 }}>
//         <Card className="card-pad">
//           <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
//             <div style={{
//               width: 76, height: 76, borderRadius: 14, background: 'var(--bg-card-hover)',
//               border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
//               justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
//             }}>
//               {product?.image ? (
//                 <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//               ) : (
//                 <Package size={30} style={{ color: 'var(--text-muted)' }} />
//               )}
//             </div>
//             <div style={{ flex: 1, minWidth: 260 }}>
//               <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
//                 {product?.name || '—'}
//               </h3>
//               <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
//                 <MetaPill icon={<Tag size={12} />}>SKU: {product?.sku || '—'}</MetaPill>
//                 <MetaPill icon={<Box size={12} />}>{product?.category || '—'}</MetaPill>
//                 <MetaPill icon={<Layers size={12} />}>Unit: {product?.unit || 'Pcs'}</MetaPill>
//               </div>
//               <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
//                 <PriceTile color="green" label="Current Purchase Price"
//                   value={fmt(product?.currentPurchasePrice || summary?.currentPurchasePrice || history[0]?.purchasePrice)} />
//                 <PriceTile color="purple" label="Current MRP" value={fmt(product?.currentMRP || history[0]?.mrp)} />
//                 <PriceTile color="blue" label="Current Distributor Price"
//                   value={fmt(product?.currentDistributorPrice || history[0]?.distributorPrice)} />
//                 <PriceTile color="yellow" label="Current Retail Price"
//                   value={fmt(product?.currentRetailPrice || history[0]?.retailerPrice)} />
//               </div>
//             </div>
//           </div>
//         </Card>
//       </div>

//       {/* ─── Stats Grid ─────────────────────────────────────────────── */}
//       <div className="pph-stats-grid" style={{ marginBottom: 20 }}>
//         <StatCard icon={<Wallet size={18} />} accent="green" label="Current Purchase Price"
//           value={fmt(summary?.currentPurchasePrice || history[0]?.purchasePrice)} />
//         <StatCard icon={<TrendingDown size={18} />} accent="blue" label="Lowest Purchase Price" value={fmt(summary?.lowestPrice)} />
//         <StatCard icon={<TrendingUp size={18} />} accent="yellow" label="Highest Purchase Price" value={fmt(summary?.highestPrice)} />
//         <StatCard icon={<CalendarDays size={18} />} accent="purple" label="Last Purchase Date" value={fmtDate(summary?.lastPurchaseDate)} />
//         <StatCard icon={<ShoppingCart size={18} />} accent="red" label="Total Purchases" value={summary?.totalPurchases ?? history.length} />
//       </div>

//       {/* ─── Filters ─────────────────────────────────────────────────── */}
//       <Card className="card-pad pph-filters" style={{ marginBottom: 20 }}>
//         <div
//           style={{
//             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//             cursor: 'pointer', marginBottom: filtersOpen ? 18 : 0, userSelect: 'none',
//           }}
//           onClick={() => setFiltersOpen((o) => !o)}
//         >
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//             <SlidersHorizontal size={15} style={{ color: 'var(--text-secondary)' }} />
//             <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Filters</span>
//             {activeFilterCount > 0 && (
//               <span style={{
//                 fontSize: 11, fontWeight: 700, color: 'var(--accent, var(--red))',
//                 background: 'color-mix(in srgb, var(--red) 12%, transparent)',
//                 borderRadius: 999, padding: '2px 8px',
//               }}>
//                 {activeFilterCount} active
//               </span>
//             )}
//           </div>
//           <ChevronDown size={16} style={{
//             color: 'var(--text-muted)', transition: 'transform 0.15s ease',
//             transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//           }} />
//         </div>

//         {filtersOpen && (
//           <>
//             <div className="pph-filter-row">
//               <Select label="Supplier" options={supplierOptions} value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} />
//               <Input label="From Date" type="date" value={draft.fromDate} onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })} />
//               <Input label="To Date" type="date" value={draft.toDate} onChange={(e) => setDraft({ ...draft, toDate: e.target.value })} />
//             </div>
//             <div className="pph-filter-row" style={{ marginTop: 14 }}>
//               <Input label="Invoice Number" placeholder="Search invoice number" value={draft.invoiceNumber} onChange={(e) => setDraft({ ...draft, invoiceNumber: e.target.value })} />
//               <Input label="Batch Number" placeholder="Search batch number" value={draft.batchNo} onChange={(e) => setDraft({ ...draft, batchNo: e.target.value })} />
//               <div className="pph-filter-price">
//                 <Input label="Purchase Price From" type="number" min="0" placeholder="Min price" value={draft.priceFrom} onChange={(e) => setDraft({ ...draft, priceFrom: e.target.value })} />
//                 <Input label="Purchase Price To" type="number" min="0" placeholder="Max price" value={draft.priceTo} onChange={(e) => setDraft({ ...draft, priceTo: e.target.value })} />
//               </div>
//               <Select label="GST %" options={gstOptions} value={draft.gst} onChange={(e) => setDraft({ ...draft, gst: e.target.value })} />
//             </div>
//             <div className="pph-filter-actions" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
//               <Button variant="primary" icon={<Filter size={14} />} onClick={handleApply}>Apply Filters</Button>
//               <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={handleReset}>Reset</Button>
//             </div>
//           </>
//         )}
//       </Card>

//       {/* ─── Price History Table ────────────────────────────────────── */}
//       <div className="pph-table-section">
//         <div className="pph-table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
//           <div>
//             <h3 className="pph-table-title" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Price History</h3>
//             <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
//               {filteredHistory.length} of {history.length} record{history.length === 1 ? '' : 's'}
//             </p>
//           </div>
//           <div className="pph-table-actions" style={{ display: 'flex', gap: 8 }}>
//             <Button variant="secondary" size="sm" icon={<FileSpreadsheet size={14} />}
//               onClick={() => exportProductPriceHistoryToExcel(filteredHistory, `${product?.name || 'Product'}_Price_History`)}
//             >
//               Export Excel
//             </Button>
//             <Button variant="secondary" size="sm" icon={<Printer size={14} />} onClick={() => printHistory(product, filteredHistory)}>
//               Print
//             </Button>
//           </div>
//         </div>
//         <Card className="card-pad" style={{ padding: 0, overflow: 'hidden' }}>
//           <DataTable
//             columns={columns}
//             data={dataWithIndex}
//             emptyIcon={<History size={36} />}
//             emptyText="No purchases match the selected filters"
//           />
//         </Card>
//       </div>

//       <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />
//     </div>
//   );
// };

// export default ProductPriceHistoryPage;
