import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import {
  fetchPurchaseReturns,
  createPurchaseReturn,
  deletePurchaseReturn,
} from '../../services/features/returns/returnsSlice';
import './Returns.css';

import {
  Calendar,
  Truck,
  Hash,
  RefreshCw,
  Search,
  X,
  Loader,
  Plus,
  Trash2,
  PackageX,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Download,
  Printer,
} from 'lucide-react';

// ─── Date helpers ─────────────────────────────────────────────────
const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
const isThisWeek = (d) => {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return new Date(d) >= weekStart;
};
const isThisMonth = (d) => {
  const now = new Date();
  return new Date(d) >= new Date(now.getFullYear(), now.getMonth(), 1);
};

// ─── PurchaseReturnCard ─────────────────
const PurchaseReturnCard = React.memo(({ ret, onDelete, isAdmin }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const generatePurchaseReturnHTML = () => {
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
    const totalWords = `INR ${amountInWords(ret.totalAmount)} Only`;
    const dateStr = ret.createdAt ? new Date(ret.createdAt).toDateString() : '';

    let itemsRows = '';
    (ret.items || []).forEach((item, idx) => {
      itemsRows += `
        <tr>
          <td style="text-align:center;padding:6px;border:1px solid #000">${idx + 1}</td>
          <td style="padding:6px;border:1px solid #000">${item.name}</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">-</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">${item.qty} NOS</td>
          <td style="text-align:right;padding:6px;border:1px solid #000">${item.price}</td>
          <td style="text-align:center;padding:6px;border:1px solid #000">NOS</td>
          <td style="text-align:right;padding:6px;border:1px solid #000">₹${(item.qty * item.price).toFixed(2)}</td>
        </tr>`;
    });
    const totalQty = (ret.items || []).reduce((sum, i) => sum + i.qty, 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <base href="about:blank">
        <title>Purchase Return ${ret.returnNumber || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
          @page { margin: 10mm; size: A4 portrait; }
          .invoice-outer { background: #fff; color: #000; padding: 1rem; border: 1px solid #000 !important; }
          p { margin: 2px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.75rem; }
          .items-table th { border: 1px solid #000; padding: 0.45rem 0.4rem; background: #f0f0f0 !important; color: #000 !important; font-weight: 800; font-size: 0.72rem; }
          .items-table td { border: 1px solid #000; padding: 0.35rem 0.4rem; background: #fff; color: #000; }
          .items-table tbody tr:nth-child(even) td { background: #f5f5f5 !important; }
          .meta-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
          .meta-table td { border: 1px solid #000; padding: 0.25rem 0.35rem; background: #fff; color: #000; }
          * { color: #000 !important; }
        </style>
      </head>
      <body>
        <div class="invoice-outer">
          <div style="text-align:center; border-bottom:1px solid #000; padding-bottom:0.5rem;">
            <h2 style="margin:0; font-size:1.1rem;">RADNUS COMMUNICATION</h2>
            <p style="font-size:0.75rem;">No.242/244, MG Road, Sinnaya Plaza, Near Fish Market</p>
            <p style="font-size:0.75rem;">Puducherry - 605001 &nbsp;|&nbsp; State: Puducherry, Code: 605001</p>
            <p style="font-size:0.75rem;">E-Mail: sundar12134@gmail.com</p>
          </div>
          <div style="text-align:center; font-size:1rem; font-weight:bold; padding:0.5rem; border-bottom:1px solid #000;">PURCHASE RETURN / DEBIT NOTE</div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:50%; padding:0.5rem; border-right:1px solid #000;">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;">Supplier Details</div>
              <p style="font-size:0.78rem;">${ret.supplierName || ''}</p>
              ${ret.referencePO ? `<p style="font-size:0.78rem;">Ref PO: ${ret.referencePO}</p>` : ''}
              ${ret.reason ? `<p style="font-size:0.78rem;">Reason: ${ret.reason}</p>` : ''}
            </div>
            <div style="width:50%; padding:0.5rem;">
              <table class="meta-table">
                <tr><td style="font-weight:600;">Return No.</td><td>${ret.returnNumber || ''}</td></tr>
                <tr><td style="font-weight:600;">Date</td><td>${dateStr}</td></tr>
                <tr><td style="font-weight:600;">Biller</td><td>${ret.billerName || ''}</td></tr>
              </table>
            </div>
          </div>
          <table class="items-table">
            <thead>
              <tr><th>SL NO.</th><th>DESCRIPTION</th><th>HSN</th><th>QTY</th><th>RATE</th><th>PER</th><th>AMOUNT</th></tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;">Total</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:center">${totalQty} NOS</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:right">₹${ret.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Amount in Words:</strong><br/>${totalWords}
          </div>
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Declaration</strong><br/>
            <span style="font-size:0.78rem;">We declare that this debit note is issued against the goods returned to the supplier and all particulars are true and correct.</span>
          </div>
          <div style="display:flex; padding:0.5rem; border-bottom:1px solid #000;">
            <div style="width:60%;">E. &amp; O.E</div>
            <div style="width:40%; text-align:right;">
              <strong>for RADNUS COMMUNICATION</strong>
              <div style="margin-top:2rem; border-top:1px solid #000;"></div>
              <span>Authorised Signatory</span>
            </div>
          </div>
          <div style="text-align:center; padding:0.5rem; font-size:0.7rem;">This is a Computer Generated Document</div>
        </div>
      </body>
      </html>`;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const element = document.createElement('div');
      element.innerHTML = generatePurchaseReturnHTML();
      document.body.appendChild(element);
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.3,
        filename: `${ret.returnNumber || 'purchase-return'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (error) {
      console.error('PDF failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePurchaseReturnHTML());
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="return-card return-card-purchase">
      <div className="return-card-header" onClick={toggleExpand}>
        <div className="return-card-meta">
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#E8F5E9' }}>
              <Calendar size={13} color="#2E7D32" />
            </div>
            <span className="return-date">{new Date(ret.createdAt || ret.date).toDateString()}</span>
          </div>
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#E3F2FD' }}>
              <Truck size={13} color="#1565C0" />
            </div>
            <span className="return-customer">{ret.supplierName || ret.vendorName || ret.billerName}</span>
          </div>
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#F3E5F5' }}>
              <Hash size={13} color="#6A1B9A" />
            </div>
            <span className="return-ref">{ret.referencePO || ret.purchaseOrderNo || '—'}</span>
          </div>
        </div>
        
        {/* Fixed Layout: Amount on top, Badge and Toggle side-by-side */}
        <div className="return-card-right">
          <span className="return-amount return-amount-purchase">₹{ret.totalAmount}</span>
          <div className="return-badge-row">
            <span className="return-badge return-badge-purchase">Purchase Return</span>
            <div 
              className="toggle-chevron" 
              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="return-card-body">
          {ret.reason && (
            <div className="return-reason">
              <strong>Reason:</strong> {ret.reason}
            </div>
          )}
          <table className="return-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(ret.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.qty * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="return-summary-row">
            <span>Total Credit Note</span>
            <span className="return-total return-total-purchase">₹{ret.totalAmount}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#2E7D32',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> {downloading ? 'Preparing...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#1565C0',
                color: '#fff',
                border: 'none',
                borderRadius: '0.4rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Print
            </button>
          </div>

          {isAdmin && (
            <div className="return-actions" style={{ marginTop: '0.75rem' }}>
              {!confirmDelete ? (
                <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </button>
              ) : (
                <div className="confirm-delete">
                  <span>Delete this return?</span>
                  <button className="btn-confirm-del" onClick={() => onDelete(ret._id)}>
                    Yes, Delete
                  </button>
                  <button className="btn-cancel-del" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── CreatePurchaseReturnModal ─────
const emptyItem = () => ({ productId: '', name: '', qty: '', price: '' });

const CreatePurchaseReturnModal = ({ onClose, onSubmit, submitting, error }) => {
  const products = useSelector((state) => state.products.list);

  const [form, setForm] = useState({
    supplierName: '',
    referencePO: '',
    reason: '',
    items: [emptyItem()],
  });

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) =>
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });

  const totalAmount = form.items.reduce((sum, it) => {
    return sum + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0);
  }, 0);

  const handleSubmit = () => {
    if (!form.supplierName.trim()) return alert('Supplier name is required.');
    if (form.items.some((it) => !it.productId || !it.qty || !it.price))
      return alert('Please select a product and fill Qty/Price for each item.');

    onSubmit({
      ...form,
      items: form.items.map((it) => ({
        productId: it.productId,
        name: it.name.trim(),
        qty: parseFloat(it.qty),
        price: parseFloat(it.price),
      })),
      totalAmount,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="return-modal return-modal-purchase" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <h3>
            <PackageX size={18} /> New Purchase Return
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-fields">
          <label>Supplier / Vendor Name *</label>
          <input
            className="return-input"
            placeholder="Enter supplier name"
            value={form.supplierName}
            onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))}
          />
          <label>Reference PO / GRN No.</label>
          <input
            className="return-input"
            placeholder="e.g. PO-2024-001"
            value={form.referencePO}
            onChange={(e) => setForm((f) => ({ ...f, referencePO: e.target.value }))}
          />
          <label>Reason for Return</label>
          <textarea
            className="return-input return-textarea"
            placeholder="Defective, excess stock, wrong item..."
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />

          <div className="items-section-header">
            <label>Items *</label>
            <button className="btn-add-item btn-add-item-purchase" onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>

          {form.items.map((item, idx) => (
            <div className="item-row" key={idx}>
              <select
                className="return-input item-name"
                value={item.productId}
                onChange={(e) => {
                  const product = products.find((p) => p._id === e.target.value);
                  updateItem(idx, 'productId', product?._id || '');
                  updateItem(idx, 'name', product?.name || '');
                  updateItem(idx, 'price', product?.walkinPrice || 0);
                }}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (SKU: {p.sku} | Stock: {p.moq})
                  </option>
                ))}
              </select>

              <input
                className="return-input item-num"
                placeholder="Qty"
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => updateItem(idx, 'qty', e.target.value)}
              />
              <input
                className="return-input item-num"
                placeholder="Price"
                type="number"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(idx, 'price', e.target.value)}
              />
              {form.items.length > 1 && (
                <button className="btn-remove-item" onClick={() => removeItem(idx)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          <div className="modal-total">
            Credit Note Value: <strong>₹{totalAmount.toFixed(2)}</strong>
          </div>

          {error && (
            <div className="return-error">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="modal-footer-btns">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-submit btn-submit-purchase"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Loader size={14} className="spin" /> : <PackageX size={14} />}
            {submitting ? 'Submitting...' : 'Create Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────
const PurchaseReturnPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { user } = useSelector((s) => s.auth || {});
  const billerName = user?.name || user?.fullName || '';
  const isAdmin = user?.role === 'Admin' || ['Mohanapriya', 'YOGESH V'].includes(billerName);

  const { purchaseReturns, purchaseLoading, purchaseError, submitting, submitError } =
    useSelector((s) => s.returns);

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseReturns({ billerName: isAdmin ? '' : billerName }));
  }, [dispatch, isAdmin, billerName]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchPurchaseReturns({ billerName: isAdmin ? '' : billerName }));
    setRefreshing(false);
  }, [dispatch, isAdmin, billerName]);

  const handleCreate = useCallback(
    async (payload) => {
      const res = await dispatch(createPurchaseReturn({ ...payload, billerName }));
      if (!res.error) setShowCreate(false);
    },
    [dispatch, billerName]
  );

  const handleDelete = useCallback((id) => dispatch(deletePurchaseReturn(id)), [dispatch]);

  const filtered = useMemo(() => {
    let data = purchaseReturns;
    if (tab === 'today') data = data.filter((r) => isToday(r.createdAt || r.date));
    if (tab === 'week') data = data.filter((r) => isThisWeek(r.createdAt || r.date));
    if (tab === 'month') data = data.filter((r) => isThisMonth(r.createdAt || r.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.supplierName?.toLowerCase().includes(q) ||
          r.vendorName?.toLowerCase().includes(q) ||
          r.referencePO?.toLowerCase().includes(q) ||
          r.billerName?.toLowerCase().includes(q) ||
          String(r.totalAmount).includes(q)
      );
    }
    return data;
  }, [purchaseReturns, tab, search]);

  const counts = useMemo(
    () => ({
      all: purchaseReturns.length,
      today: purchaseReturns.filter((r) => isToday(r.createdAt || r.date)).length,
      week: purchaseReturns.filter((r) => isThisWeek(r.createdAt || r.date)).length,
      month: purchaseReturns.filter((r) => isThisMonth(r.createdAt || r.date)).length,
    }),
    [purchaseReturns]
  );

  if (purchaseError && purchaseReturns.length === 0) {
    return (
      <div className={`returns-page ${isDark ? 'dark' : ''}`}>
        <div className="loading-state">
          <RefreshCw size={48} />
          <h3>Error loading purchase returns</h3>
          <p>{purchaseError}</p>
          <button onClick={handleRefresh} className="btn-retry btn-retry-purchase">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`returns-page ${isDark ? 'dark' : ''}`}>
      <div className="returns-header">
        <div className="returns-title-row">
          <div className="returns-title-icon" style={{ background: '#E8F5E9' }}>
            <PackageX size={22} color="#2E7D32" />
          </div>
          <div>
            <h1>Purchase Returns</h1>
            <p className="returns-subtitle">Manage supplier return & credit notes</p>
          </div>
        </div>
        <div className="returns-header-actions">
          <div className="search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search supplier, PO no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button onClick={() => setSearch('')} className="search-clear">
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          </button>
          <button className="btn-create-return btn-create-purchase" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Return
          </button>
        </div>
      </div>

      <div className="invoice-tabs purchase-tabs">
        {['all', 'today', 'week', 'month'].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active purchase-tab-active' : ''}`}
            onClick={() => setTab(t)}
          >
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            <span className="tab-badge">{counts[t]}</span>
          </button>
        ))}
      </div>

      {purchaseLoading && purchaseReturns.length === 0 ? (
        <div className="loading-state">
          <Loader className="spin" size={32} />
          <p>Loading purchase returns...</p>
        </div>
      ) : (
        <>
          <div className="returns-grid">
            {filtered.map((ret) => (
              <PurchaseReturnCard
                key={ret._id}
                ret={ret}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <PackageX size={40} />
              <p>{search ? `No results for "${search}"` : 'No purchase returns found.'}</p>
              <button className="btn-create-return btn-create-purchase" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Create First Return
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreatePurchaseReturnModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  );
};

export default PurchaseReturnPage;