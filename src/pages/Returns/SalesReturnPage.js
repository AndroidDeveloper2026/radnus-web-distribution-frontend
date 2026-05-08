import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import {
  fetchSalesReturns,
  createSalesReturn,
  deleteSalesReturn,
} from '../../services/features/returns/returnsSlice';
import './Returns.css';

import {
  Calendar,
  User,
  Hash,
  RefreshCw,
  Search,
  X,
  Loader,
  Plus,
  Trash2,
  RotateCcw,
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

// ─── Return Card (FIXED TOGGLE LOGIC) ───────────────────────
const ReturnCard = React.memo(({ ret, onDelete, isAdmin }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Single, reliable toggle function
  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // ── Generate HTML for Sales Return / Credit Note ──────
  const generateSalesReturnHTML = () => {
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
          <td style="text-align:right;padding:6px;border:1px solid #000">₹${item.price}</td>
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
        <title>Sales Return ${ret.returnNumber || ''}</title>
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
            <p style="font-size:0.75rem;">No.242/44, MG Road, Sinnaya Plaza, Near Fish Market</p>
            <p style="font-size:0.75rem;">Puducherry - 605001 &nbsp;|&nbsp; State: Puducherry, Code: 605001</p>
            <p style="font-size:0.75rem;">E-Mail: sundar12134@gmail.com</p>
          </div>
          <div style="text-align:center; font-size:1rem; font-weight:bold; padding:0.5rem; border-bottom:1px solid #000;">SALES RETURN / CREDIT NOTE</div>
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:50%; padding:0.5rem; border-right:1px solid #000;">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;">Customer Details</div>
              <p style="font-size:0.78rem;">${ret.customerName || ''}</p>
              ${ret.referenceInvoice ? `<p style="font-size:0.78rem;">Ref Invoice: ${ret.referenceInvoice}</p>` : ''}
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
            <span style="font-size:0.78rem;">We declare that this credit note is issued against the returned goods and all particulars are true and correct.</span>
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

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const element = document.createElement('div');
      element.innerHTML = generateSalesReturnHTML();
      document.body.appendChild(element);
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.3,
        filename: `${ret.returnNumber || 'sales-return'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateSalesReturnHTML());
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  return (
    <div className="return-card">
      {/* Single click target for the entire header */}
      <div className="return-card-header" onClick={toggleExpand}>
        <div className="return-card-meta">
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#FFF3E0' }}>
              <Calendar size={13} color="#E65100" />
            </div>
            <span className="return-date">{new Date(ret.createdAt || ret.date).toDateString()}</span>
          </div>
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#FCE4EC' }}>
              <User size={13} color="#C62828" />
            </div>
            <span className="return-customer">{ret.customerName || ret.billerName}</span>
          </div>
          <div className="return-meta-row">
            <div className="icon-badge" style={{ backgroundColor: '#EDE7F6' }}>
              <Hash size={13} color="#4527A0" />
            </div>
            <span className="return-ref">{ret.referenceInvoice || ret.invoiceNumber || '—'}</span>
          </div>
        </div>
        <div className="return-card-right">
          <span className="return-amount">₹{ret.totalAmount}</span>
          <span className="return-badge return-badge-sales">Sales Return</span>
          <button 
            className="toggle-chevron"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
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
            <span>Total Refund</span>
            <span className="return-total">₹{ret.totalAmount}</span>
          </div>

          {/* ── Download & Print Buttons ── */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              className="download-btn"
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#E65100',
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
              className="print-btn"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#7B1FA2',
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

// ─── Create Return Modal (unchanged) ──────────
const emptyItem = () => ({ productId: '', name: '', qty: '', price: '' });

const CreateReturnModal = ({ onClose, onSubmit, submitting, error }) => {
  const products = useSelector((state) => state.products.list);

  const [form, setForm] = useState({
    customerName: '',
    referenceInvoice: '',
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
    const qty = parseFloat(it.qty) || 0;
    const price = parseFloat(it.price) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = () => {
    if (!form.customerName.trim()) return alert('Customer name is required.');
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
      <div className="return-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <h3>
            <RotateCcw size={18} /> New Sales Return
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-fields">
          <label>Customer Name *</label>
          <input
            className="return-input"
            placeholder="Enter customer name"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
          />
          <label>Reference Invoice No.</label>
          <input
            className="return-input"
            placeholder="e.g. INV-0042"
            value={form.referenceInvoice}
            onChange={(e) => setForm((f) => ({ ...f, referenceInvoice: e.target.value }))}
          />
          <label>Reason for Return</label>
          <textarea
            className="return-input return-textarea"
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />

          <div className="items-section-header">
            <label>Items *</label>
            <button className="btn-add-item" onClick={addItem}>
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
            Total Refund: <strong>₹{totalAmount.toFixed(2)}</strong>
          </div>

          {error && (
            <div className="return-error">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="modal-footer-btns">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader size={14} className="spin" /> : <RotateCcw size={14} />}
            {submitting ? 'Submitting...' : 'Create Return'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────
const SalesReturnPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { user } = useSelector((s) => s.auth || {});
  const billerName = user?.name || user?.fullName || '';
  const isAdmin = user?.role === 'Admin' || ['Mohanapriya', 'YOGESH V'].includes(billerName);

  const { salesReturns, salesLoading, salesError, submitting, submitError } = useSelector(
    (s) => s.returns
  );

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSalesReturns({ billerName: isAdmin ? '' : billerName }));
  }, [dispatch, isAdmin, billerName]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchSalesReturns({ billerName: isAdmin ? '' : billerName }));
    setRefreshing(false);
  }, [dispatch, isAdmin, billerName]);

  const handleCreate = useCallback(
    async (payload) => {
      const res = await dispatch(createSalesReturn({ ...payload, billerName }));
      if (!res.error) setShowCreate(false);
    },
    [dispatch, billerName]
  );

  const handleDelete = useCallback((id) => dispatch(deleteSalesReturn(id)), [dispatch]);

  const filtered = useMemo(() => {
    let data = salesReturns;
    if (tab === 'today') data = data.filter((r) => isToday(r.createdAt || r.date));
    if (tab === 'week') data = data.filter((r) => isThisWeek(r.createdAt || r.date));
    if (tab === 'month') data = data.filter((r) => isThisMonth(r.createdAt || r.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(q) ||
          r.referenceInvoice?.toLowerCase().includes(q) ||
          r.billerName?.toLowerCase().includes(q) ||
          String(r.totalAmount).includes(q)
      );
    }
    return data;
  }, [salesReturns, tab, search]);

  const counts = useMemo(
    () => ({
      all: salesReturns.length,
      today: salesReturns.filter((r) => isToday(r.createdAt || r.date)).length,
      week: salesReturns.filter((r) => isThisWeek(r.createdAt || r.date)).length,
      month: salesReturns.filter((r) => isThisMonth(r.createdAt || r.date)).length,
    }),
    [salesReturns]
  );

  if (salesError && salesReturns.length === 0) {
    return (
      <div className={`returns-page ${isDark ? 'dark' : ''}`}>
        <div className="loading-state">
          <RefreshCw size={48} />
          <h3>Error loading sales returns</h3>
          <p>{salesError}</p>
          <button onClick={handleRefresh} className="btn-retry">
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
          <div className="returns-title-icon" style={{ background: '#FFF3E0' }}>
            <RotateCcw size={22} color="#E65100" />
          </div>
          <div>
            <h1>Sales Returns</h1>
            <p className="returns-subtitle">Manage customer return transactions</p>
          </div>
        </div>
        <div className="returns-header-actions">
          <div className="search-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search customer, invoice..."
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
          <button className="btn-create-return" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Return
          </button>
        </div>
      </div>

      <div className="invoice-tabs">
        {['all', 'today', 'week', 'month'].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
            <span className="tab-badge">{counts[t]}</span>
          </button>
        ))}
      </div>

      {salesLoading && salesReturns.length === 0 ? (
        <div className="loading-state">
          <Loader className="spin" size={32} />
          <p>Loading sales returns...</p>
        </div>
      ) : (
        <>
          <div className="returns-grid">
            {filtered.map((ret) => (
              <ReturnCard
                key={ret._id}
                ret={ret}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <RotateCcw size={40} />
              <p>{search ? `No results for "${search}"` : 'No sales returns found.'}</p>
              <button className="btn-create-return" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Create First Return
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateReturnModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          submitting={submitting}
          error={submitError}
        />
      )}
    </div>
  );
};

export default SalesReturnPage;