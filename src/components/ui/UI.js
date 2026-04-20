import React, { useState, useEffect, useRef } from 'react';
import './UI.css';

/* ─── Button ─────────────────────────────────────────────────────────────────── */
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, icon, iconRight, fullWidth,
  className = '', ...props
}) => (
  <button
    className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? <span className="btn-spinner" /> : icon && <span className="btn-icon-left">{icon}</span>}
    {children}
    {iconRight && !loading && <span className="btn-icon-right">{iconRight}</span>}
  </button>
);

/* ─── Input ──────────────────────────────────────────────────────────────────── */
export const Input = ({
  label, error, hint, icon, iconRight, className = '', ...props
}) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <div className="field-wrap">
      {icon && <span className="field-icon-left">{icon}</span>}
      <input className={`field-input ${icon ? 'has-icon-left' : ''} ${iconRight ? 'has-icon-right' : ''} ${error ? 'has-error' : ''}`} {...props} />
      {iconRight && <span className="field-icon-right">{iconRight}</span>}
    </div>
    {error && <p className="field-error">{error}</p>}
    {hint && !error && <p className="field-hint">{hint}</p>}
  </div>
);

/* ─── Select ─────────────────────────────────────────────────────────────────── */
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label className="field-label">{label}</label>}
    <div className="field-wrap">
      <select className={`field-input field-select ${error ? 'has-error' : ''}`} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
    {error && <p className="field-error">{error}</p>}
  </div>
);

/* ─── Badge ──────────────────────────────────────────────────────────────────── */
export const Badge = ({ children, variant = 'default', dot }) => (
  <span className={`badge badge-${variant}`}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

/* ─── Avatar ─────────────────────────────────────────────────────────────────── */
export const Avatar = ({ name = '', size = 'md', src, color }) => {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div className={`avatar avatar-${size}`} style={color ? { background: color } : {}}>
      {src ? <img src={src} alt={name} /> : initials}
    </div>
  );
};

/* ─── StatCard ───────────────────────────────────────────────────────────────── */
export const StatCard = ({ icon, label, value, delta, deltaType = 'up', accent = 'red', onClick }) => (
  <div className={`stat-card stat-${accent} ${onClick ? 'stat-clickable' : ''}`} onClick={onClick}>
    <div className={`stat-icon stat-icon-${accent}`}>{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {delta && <div className={`stat-delta delta-${deltaType}`}>{delta}</div>}
  </div>
);

/* ─── Card ───────────────────────────────────────────────────────────────────── */
export const Card = ({ children, className = '', padding = true }) => (
  <div className={`card ${padding ? 'card-pad' : ''} ${className}`}>{children}</div>
);

/* ─── SectionHeader ──────────────────────────────────────────────────────────── */
export const SectionHeader = ({ title, count, action }) => (
  <div className="section-hdr">
    <h2 className="section-title">
      {title}
      {count !== undefined && <span className="section-count">({count})</span>}
    </h2>
    {action && <div className="section-action">{action}</div>}
  </div>
);

/* ─── Spinner ────────────────────────────────────────────────────────────────── */
export const Spinner = ({ size = 'md' }) => (
  <div className={`spinner spinner-${size}`} />
);

export const PageLoader = () => (
  <div className="page-loader">
    <Spinner size="lg" />
  </div>
);

/* ─── Empty State ────────────────────────────────────────────────────────────── */
export const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-icon">{icon}</div>}
    <div className="empty-title">{title}</div>
    {subtitle && <div className="empty-sub">{subtitle}</div>}
    {action && <div className="empty-action">{action}</div>}
  </div>
);

/* ─── Modal ──────────────────────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) { document.addEventListener('keydown', handleKey); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal modal-${size}`}>
        {title && (
          <div className="modal-head">
            <h3 className="modal-title">{title}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

/* ─── Toast System ───────────────────────────────────────────────────────────── */
let _addToast = null;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _addToast = (msg, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { _addToast = null; };
  }, []);
  return (
    <div className="toast-root">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-dot" />
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

export const toast = {
  success: (msg) => _addToast?.(msg, 'success'),
  error:   (msg) => _addToast?.(msg, 'error'),
  info:    (msg) => _addToast?.(msg, 'info'),
  warn:    (msg) => _addToast?.(msg, 'warn'),
};

/* ─── DataTable ──────────────────────────────────────────────────────────────── */
export const DataTable = ({
  columns = [], data = [], loading, emptyIcon, emptyText = 'No records found',
  searchValue, onSearch, searchPlaceholder = 'Search…', actions,
  keyField = '_id',
}) => {
  const [page, setPage]       = useState(1);
  const [perPage]             = useState(10);
  const paginated = data.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(data.length / perPage);

  return (
    <div className="dtable-wrap">
      {(onSearch || actions) && (
        <div className="dtable-toolbar">
          {onSearch && (
            <div className="dtable-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={searchValue} onChange={e => { onSearch(e.target.value); setPage(1); }} placeholder={searchPlaceholder} />
            </div>
          )}
          {actions && <div className="dtable-actions">{actions}</div>}
        </div>
      )}
      <div className="dtable-scroll">
        <table className="dtable">
          <thead>
            <tr>{columns.map(c => <th key={c.key} style={c.width ? { width: c.width } : {}}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length}><div className="dtable-loader"><Spinner /></div></td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={columns.length}>
                <EmptyState icon={emptyIcon} title={emptyText} />
              </td></tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row[keyField] || i}>
                  {columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="dtable-footer">
          <span className="dtable-info">Showing {((page-1)*perPage)+1}–{Math.min(page*perPage, data.length)} of {data.length}</span>
          <div className="dtable-pages">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── ConfirmDialog ──────────────────────────────────────────────────────────── */
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    }
  >
    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
  </Modal>
);
