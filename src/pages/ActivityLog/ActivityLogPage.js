
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchActivityLogs } from '../../services/features/activity/activitySlice';
import {
  PlusCircle,
  Edit2,
  User,
  Calendar,
  Filter,
  Phone,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ActivityLogPage.css';

const ActivityLogPage = () => {
  const dispatch = useDispatch();
  const { logs, loading, error } = useSelector((state) => state.activity);
  const [filter, setFilter] = useState('today');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    dispatch(fetchActivityLogs());
  }, [dispatch]);

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isThisWeek = (date) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo && date <= now;
  };

  const isThisMonth = (date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const filteredLogs = useMemo(() => {
    if (!Array.isArray(logs) || logs.length === 0) return [];
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      if (filter === 'today') return isToday(logDate);
      if (filter === 'week') return isThisWeek(logDate);
      if (filter === 'month') return isThisMonth(logDate);
      return true;
    });
  }, [logs, filter]);

  const renderLogCard = (log) => (
    <div 
      className="log-card" 
      key={log._id || log.timestamp}
      style={{
        background: isDark ? '#1c1d21' : 'var(--bg-card)',
        borderColor: isDark ? '#2a2a2a' : 'var(--border)'
      }}
    >
      <div className="card-header">
        {log.action === 'ADD_PRODUCT' && <PlusCircle size={20} color="#10b981" />}
        {log.action === 'EDIT_PRODUCT' && <Edit2 size={20} color="#f59e0b" />}
        {log.action === 'EDIT_CUSTOMER' && <User size={20} color="#3b82f6" />}
        <span className="action-text" style={{ color: isDark ? '#f5f5f7' : 'var(--text-primary)' }}>
          {log.action === 'ADD_PRODUCT' && 'Added Product'}
          {log.action === 'EDIT_PRODUCT' && 'Edited Product'}
          {log.action === 'EDIT_CUSTOMER' && 'Edited Customer'}
        </span>
      </div>

      {log.productName && (
        <p className="product-name" style={{ color: isDark ? '#f5f5f7' : 'var(--text-primary)' }}>
          Product: {log.productName}
        </p>
      )}

      {log.action === 'EDIT_CUSTOMER' && (
        <div className="customer-info" style={{ color: isDark ? '#a1a1aa' : 'var(--text-secondary)' }}>
          <Phone size={12} color={isDark ? '#a1a1aa' : '#6b7280'} />
          <span>Customer: {log.customerIdentifier || 'Unknown'}</span>
        </div>
      )}

      {log.action === 'EDIT_CUSTOMER' && log.changes && (
        <div className="changes-container" style={{ 
          background: isDark ? '#2a2a2a' : 'var(--warning-dim)',
          color: isDark ? '#f5f5f7' : 'var(--text-secondary)'
        }}>
          <p className="changes-title" style={{ color: isDark ? '#fbbf24' : 'var(--warning)' }}>
            Changes:
          </p>
          {Object.entries(log.changes).map(([field, { old, new: newVal }]) => (
            <div key={field} className="change-row" style={{ color: isDark ? '#a1a1aa' : 'var(--text-secondary)' }}>
              <span className="field" style={{ color: isDark ? '#f5f5f7' : 'var(--text-primary)' }}>
                {field}: 
              </span>
              <span className="old" style={{ color: isDark ? '#f87171' : 'var(--red-bright)' }}>
                {old || '—'}
              </span> → 
              <span className="new" style={{ color: isDark ? '#34d399' : 'var(--success)' }}>
                {newVal || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="detail-row" style={{ color: isDark ? '#a1a1aa' : 'var(--text-muted)' }}>
        <User size={14} className="icon-muted" color={isDark ? '#a1a1aa' : 'var(--text-muted)'} />
        <span>{log.user} ({log.role})</span>
      </div>

      <div className="detail-row" style={{ color: isDark ? '#a1a1aa' : 'var(--text-muted)' }}>
        <Calendar size={14} className="icon-muted" color={isDark ? '#a1a1aa' : 'var(--text-muted)'} />
        <span>{new Date(log.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="error-message" style={{ color: isDark ? '#f87171' : 'var(--red-bright)' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="activity-log-page" style={{ color: isDark ? '#f5f5f7' : 'var(--text-primary)' }}>
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
          onClick={() => setFilter('today')}
          style={{
            background: filter === 'today' ? 'var(--red)' : (isDark ? '#2a2a2a' : 'var(--bg-card)'),
            color: filter === 'today' ? '#fff' : (isDark ? '#a1a1aa' : 'var(--text-secondary)'),
            borderColor: filter === 'today' ? 'var(--red)' : (isDark ? '#3a3a3a' : 'var(--border)')
          }}
        >
          Today
        </button>
        <button
          className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
          onClick={() => setFilter('week')}
          style={{
            background: filter === 'week' ? 'var(--red)' : (isDark ? '#2a2a2a' : 'var(--bg-card)'),
            color: filter === 'week' ? '#fff' : (isDark ? '#a1a1aa' : 'var(--text-secondary)'),
            borderColor: filter === 'week' ? 'var(--red)' : (isDark ? '#3a3a3a' : 'var(--border)')
          }}
        >
          This Week
        </button>
        <button
          className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
          onClick={() => setFilter('month')}
          style={{
            background: filter === 'month' ? 'var(--red)' : (isDark ? '#2a2a2a' : 'var(--bg-card)'),
            color: filter === 'month' ? '#fff' : (isDark ? '#a1a1aa' : 'var(--text-secondary)'),
            borderColor: filter === 'month' ? 'var(--red)' : (isDark ? '#3a3a3a' : 'var(--border)')
          }}
        >
          This Month
        </button>
      </div>

      <div className="logs-list">
        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        )}
        {!loading && filteredLogs.length === 0 && (
          <div 
            className="empty-state" 
            style={{
              background: isDark ? '#1c1d21' : 'transparent',
              borderRadius: isDark ? '16px' : '0',
              padding: isDark ? '3rem' : '3rem',
              border: isDark ? '1px solid #2a2a2a' : 'none',
              color: isDark ? '#a1a1aa' : 'var(--text-muted)'
            }}
          >
            <Filter size={48} color={isDark ? '#3a3a3a' : '#d1d5db'} />
            <p style={{ color: isDark ? '#a1a1aa' : 'var(--text-muted)' }}>
              No activity found for this period
            </p>
          </div>
        )}
        {filteredLogs.map(renderLogCard)}
      </div>
    </div>
  );
};

export default ActivityLogPage;


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// import React, { useEffect, useMemo, useState } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { fetchActivityLogs } from '../../services/features/activity/activitySlice';
// import {
//   PlusCircle,
//   Edit2,
//   User,
//   Calendar,
//   Filter,
//   Phone,
// } from 'lucide-react';
// import './ActivityLogPage.css';

// const ActivityLogPage = () => {
//   const dispatch = useDispatch();
//   const { logs, loading, error } = useSelector((state) => state.activity);
//   const [filter, setFilter] = useState('today');

//   useEffect(() => {
//     dispatch(fetchActivityLogs());
//   }, [dispatch]);

//   const isToday = (date) => {
//     const today = new Date();
//     return (
//       date.getDate() === today.getDate() &&
//       date.getMonth() === today.getMonth() &&
//       date.getFullYear() === today.getFullYear()
//     );
//   };

//   const isThisWeek = (date) => {
//     const now = new Date();
//     const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//     return date >= oneWeekAgo && date <= now;
//   };

//   const isThisMonth = (date) => {
//     const now = new Date();
//     return (
//       date.getMonth() === now.getMonth() &&
//       date.getFullYear() === now.getFullYear()
//     );
//   };

//   const filteredLogs = useMemo(() => {
//     if (!Array.isArray(logs) || logs.length === 0) return [];
//     return logs.filter((log) => {
//       const logDate = new Date(log.timestamp);
//       if (filter === 'today') return isToday(logDate);
//       if (filter === 'week') return isThisWeek(logDate);
//       if (filter === 'month') return isThisMonth(logDate);
//       return true;
//     });
//   }, [logs, filter]);

//   const renderLogCard = (log) => (
//     <div className="log-card" key={log._id || log.timestamp}>
//       <div className="card-header">
//         {log.action === 'ADD_PRODUCT' && <PlusCircle size={20} color="#10b981" />}
//         {log.action === 'EDIT_PRODUCT' && <Edit2 size={20} color="#f59e0b" />}
//         {log.action === 'EDIT_CUSTOMER' && <User size={20} color="#3b82f6" />}
//         <span className="action-text">
//           {log.action === 'ADD_PRODUCT' && 'Added Product'}
//           {log.action === 'EDIT_PRODUCT' && 'Edited Product'}
//           {log.action === 'EDIT_CUSTOMER' && 'Edited Customer'}
//         </span>
//       </div>

//       {log.productName && <p className="product-name">Product: {log.productName}</p>}

//       {log.action === 'EDIT_CUSTOMER' && (
//         <div className="customer-info">
//           <Phone size={12} color="#6b7280" />
//           <span>Customer: {log.customerIdentifier || 'Unknown'}</span>
//         </div>
//       )}

//       {log.action === 'EDIT_CUSTOMER' && log.changes && (
//         <div className="changes-container">
//           <p className="changes-title">Changes:</p>
//           {Object.entries(log.changes).map(([field, { old, new: newVal }]) => (
//             <div key={field} className="change-row">
//               <span className="field">{field}: </span>
//               <span className="old">{old || '—'}</span> → <span className="new">{newVal || '—'}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       <div className="detail-row">
//         <User size={14} className="icon-muted" />
//         <span>{log.user} ({log.role})</span>
//       </div>

//       <div className="detail-row">
//         <Calendar size={14} className="icon-muted" />
//         <span>{new Date(log.timestamp).toLocaleString()}</span>
//       </div>
//     </div>
//   );

//   if (error) {
//     return (
//       <div className="error-message">
//         Error: {error}
//       </div>
//     );
//   }

//   return (
//     <div className="activity-log-page">
//       <div className="filter-bar">
//         <button
//           className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
//           onClick={() => setFilter('today')}
//         >
//           Today
//         </button>
//         <button
//           className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
//           onClick={() => setFilter('week')}
//         >
//           This Week
//         </button>
//         <button
//           className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
//           onClick={() => setFilter('month')}
//         >
//           This Month
//         </button>
//       </div>

//       <div className="logs-list">
//         {loading && (
//           <div className="spinner-container">
//             <div className="spinner"></div>
//           </div>
//         )}
//         {!loading && filteredLogs.length === 0 && (
//           <div className="empty-state">
//             <Filter size={48} color="#d1d5db" />
//             <p>No activity found for this period</p>
//           </div>
//         )}
//         {filteredLogs.map(renderLogCard)}
//       </div>
//     </div>
//   );
// };

// export default ActivityLogPage;