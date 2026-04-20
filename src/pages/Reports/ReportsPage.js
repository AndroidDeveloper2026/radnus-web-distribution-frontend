import React from 'react';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../../store/selectors/authSelector';
import { Card, SectionHeader, Badge } from '../../components/ui/UI';
import './Reports.css';

/* ─── Bar Chart ──────────────────────────────────────────────────────────────── */
const BarChart = ({ data, height = 130, color = 'var(--red)' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="report-bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="report-bar-col">
          <div
            className="report-bar-fill"
            style={{ height: `${(d.value / max) * 100}%`, background: color }}
            title={`${d.label}: ${d.value}`}
          />
          <div className="report-bar-lbl">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

/* ─── Donut / Ring chart (CSS-based) ────────────────────────────────────────── */
const RingChart = ({ segments }) => {
  let offset = 0;
  const r = 54; const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * c;
          const gap  = c - dash;
          const rot  = (offset / total) * 360 - 90;
          offset += seg.value;
          return (
            <circle key={i} cx="70" cy="70" r={r} fill="none"
              stroke={seg.color} strokeWidth="16"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={c / 4}
              transform={`rotate(${rot} 70 70)`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          );
        })}
        <text x="70" y="66" textAnchor="middle" fill="var(--text-primary)" fontSize="18" fontWeight="700" fontFamily="Syne,sans-serif">{total}</text>
        <text x="70" y="84" textAnchor="middle" fill="var(--text-muted)" fontSize="11">Total</text>
      </svg>
      <div className="ring-legend">
        {segments.map((s, i) => (
          <div key={i} className="ring-leg-item">
            <span className="ring-leg-dot" style={{ background: s.color }} />
            <span className="ring-leg-lbl">{s.label}</span>
            <span className="ring-leg-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══ Reports Page ═══════════════════════════════════════════════════════════════ */
const ReportsPage = () => {
  const { role } = useSelector(selectAuthState);
  const products     = useSelector(s => s.products.list);
  const retailers    = useSelector(s => s.retailer.list);
  const distributors = useSelector(s => s.distributors.list);
  const fseList      = useSelector(s => s.fse.list);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const salesData = months.map((label, i) => ({
    label: label.slice(0,1),
    value: [28,42,35,68,55,72,65,88,74,90,78,95][i],
  }));

  const activeRetailers    = retailers.filter(r => r.status === 'Active').length;
  const inactiveRetailers  = retailers.length - activeRetailers;
  const activeDistributors = distributors.filter(d => d.status === 'Active').length;
  const activeProducts     = products.filter(p => p.status === 'Active' || p.stock > 0).length;
  const lowStockProducts   = products.filter(p => p.stock > 0 && p.stock < 20).length;
  const outOfStock         = products.filter(p => p.stock === 0).length;

  const quarterData = [
    { label: 'Q1', value: 35 },
    { label: 'Q2', value: 68 },
    { label: 'Q3', value: 72 },
    { label: 'Q4', value: 90 },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <SectionHeader title="Reports & Analytics" />
        <div style={{ display: 'flex', gap: 8 }}>
          {['This Month', 'This Quarter', 'This Year'].map((label, i) => (
            <button key={label} className={`report-period-btn ${i === 2 ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="report-kpi-row">
        {[
          { label: 'Total Revenue',    value: '₹0',                    color: 'var(--red)' },
          { label: 'Active Retailers', value: activeRetailers,         color: 'var(--success)' },
          { label: 'Orders (Month)',   value: 0,                       color: 'var(--info)' },
          { label: 'Avg Order Value',  value: '₹0',                    color: 'var(--warning)' },
        ].map(kpi => (
          <div key={kpi.label} className="report-kpi-card" style={{ '--kpi-color': kpi.color }}>
            <div className="report-kpi-value">{kpi.value}</div>
            <div className="report-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="reports-grid-2">
        <Card className="card-pad">
          <SectionHeader title="Monthly Sales — 2025" action={<Badge variant="info">₹ INR</Badge>} />
          <BarChart data={salesData} />
        </Card>
        <Card className="card-pad">
          <SectionHeader title="Quarterly Performance" />
          <BarChart data={quarterData} height={130} color="var(--info)" />
        </Card>
      </div>

      {/* Ring charts row */}
      <div className="reports-grid-3">
        <Card className="card-pad">
          <h3 className="section-title" style={{ marginBottom: 16 }}>Retailer Status</h3>
          <RingChart segments={[
            { label: 'Active',   value: activeRetailers,   color: 'var(--success)' },
            { label: 'Inactive', value: inactiveRetailers, color: 'var(--red)' },
          ]} />
        </Card>

        <Card className="card-pad">
          <h3 className="section-title" style={{ marginBottom: 16 }}>Product Stock</h3>
          <RingChart segments={[
            { label: 'In Stock',   value: activeProducts,  color: 'var(--success)' },
            { label: 'Low Stock',  value: lowStockProducts, color: 'var(--warning)' },
            { label: 'Out of Stock', value: outOfStock,    color: 'var(--red)' },
          ]} />
        </Card>

        {['Admin', 'Radnus', 'MarketingManager'].includes(role) && (
          <Card className="card-pad">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Distributor Status</h3>
            <RingChart segments={[
              { label: 'Active',   value: activeDistributors,                    color: 'var(--info)' },
              { label: 'Inactive', value: distributors.length - activeDistributors, color: 'var(--red)' },
            ]} />
          </Card>
        )}
      </div>

      {/* Summary table */}
      <Card>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <h3 className="section-title">Summary</h3>
        </div>
        <table className="dtable">
          <thead>
            <tr>
              <th>Metric</th><th>Total</th><th>Active</th><th>This Month</th><th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Retailers',    total: retailers.length,    active: activeRetailers,    month: 0, trend: '↑' },
              { label: 'Distributors', total: distributors.length, active: activeDistributors, month: 0, trend: '→' },
              { label: 'Products',     total: products.length,     active: activeProducts,     month: 0, trend: '↑' },
              { label: 'FSE',          total: fseList.length,      active: fseList.length,     month: 0, trend: '→' },
            ].map(row => (
              <tr key={row.label}>
                <td style={{ fontWeight: 600 }}>{row.label}</td>
                <td>{row.total}</td>
                <td><Badge variant="active">{row.active}</Badge></td>
                <td>{row.month}</td>
                <td style={{ color: row.trend === '↑' ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ReportsPage;
