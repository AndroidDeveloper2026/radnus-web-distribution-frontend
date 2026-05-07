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

// ─── Return Card (unchanged) ─────────────────────────────────────
const ReturnCard = React.memo(({ ret, onDelete, isAdmin }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="return-card">
      <div className="return-card-header" onClick={() => setExpanded((p) => !p)}>
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
          <span className={`return-badge return-badge-sales`}>Sales Return</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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

          {isAdmin && (
            <div className="return-actions">
              {!confirmDelete ? (
                <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </button>
              ) : (
                <div className="confirm-delete">
                  <span>Delete this return?</span>
                  <button className="btn-confirm-del" onClick={() => onDelete(ret._id)}>Yes, Delete</button>
                  <button className="btn-cancel-del" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Create Return Modal (UPDATED) ────────────────────────────────
const emptyItem = () => ({ productId: '', name: '', qty: '', price: '' });

const CreateReturnModal = ({ onClose, onSubmit, submitting, error }) => {
  // ✅ Access products from Redux to build the selector
  const products = useSelector(state => state.products.list);

  const [form, setForm] = useState({
    customerName: '',
    referenceInvoice: '',
    reason: '',
    items: [emptyItem()],
  });

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
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
          <h3><RotateCcw size={18} /> New Sales Return</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
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
            <button className="btn-add-item" onClick={addItem}><Plus size={14} /> Add Item</button>
          </div>

          {form.items.map((item, idx) => (
            <div className="item-row" key={idx}>
              {/* ─── Product selector instead of plain name input ─── */}
              <select
                className="return-input item-name"
                value={item.productId}
                onChange={(e) => {
                  const product = products.find(p => p._id === e.target.value);
                  updateItem(idx, 'productId', product?._id || '');
                  updateItem(idx, 'name', product?.name || '');
                  // Pre‑fill price (using walkinPrice; adjust to your needs)
                  updateItem(idx, 'price', product?.walkinPrice || 0);
                }}
              >
                <option value="">Select product</option>
                {products.map(p => (
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

// ─── Main Page (unchanged except now includes the updated modal) ──
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
      const res = await dispatch(
        createSalesReturn({ ...payload, billerName })
      );
      if (!res.error) setShowCreate(false);
    },
    [dispatch, billerName]
  );

  const handleDelete = useCallback(
    (id) => dispatch(deleteSalesReturn(id)),
    [dispatch]
  );

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

  const counts = useMemo(() => ({
    all: salesReturns.length,
    today: salesReturns.filter((r) => isToday(r.createdAt || r.date)).length,
    week: salesReturns.filter((r) => isThisWeek(r.createdAt || r.date)).length,
    month: salesReturns.filter((r) => isThisMonth(r.createdAt || r.date)).length,
  }), [salesReturns]);

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