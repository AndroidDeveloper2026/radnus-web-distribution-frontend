import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthState } from '../../store/selectors/authSelector';
import { Card } from '../../components/ui/UI';
import {
  BarChart3, Package, ReceiptText, DollarSign, TrendingUp,
  RotateCcw, RotateCw, Gem, ClipboardList, Truck, Search,
  User, Shield, Calendar, Lock
} from 'lucide-react';
import './Reports.css';

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
const fmt    = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');
const fmtDate = d => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const getYear = d => new Date(d).getFullYear();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const filterByPeriod = (list, period, dateField, selMonth, selYear) => {
  const now = new Date();
  return list.filter(item => {
    const d = new Date(item[dateField]);
    if (!d || isNaN(d)) return true;
    if (period === 'day')    return d.toDateString() === now.toDateString();
    if (period === 'month')  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year')   return d.getFullYear() === now.getFullYear();
    if (period === 'custom') {
      const mOk = selMonth === '' ? true : d.getMonth() === Number(selMonth);
      const yOk = selYear  === '' ? true : d.getFullYear() === Number(selYear);
      return mOk && yOk;
    }
    return true;
  });
};

/* ══════════════════════════════════════════════════════════════════
   RING CHART
══════════════════════════════════════════════════════════════════ */
const RingChart = ({ segments, size = 130 }) => {
  const r = size * 0.38; const c = 2 * Math.PI * r;
  const cx = size / 2; const cy = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="rpt-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="13" />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * c;
          const rot  = (offset / total) * 360 - 90;
          offset += seg.value;
          if (seg.value === 0) return null;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="13"
              strokeDasharray={`${dash} ${c - dash}`}
              transform={`rotate(${rot} ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.8s ease', strokeLinecap: 'round' }}
            />
          );
        })}
        <text x={cx} y={cy - 7} textAnchor="middle" fill="var(--text-primary)"
          fontSize={size * 0.15} fontWeight="800" fontFamily="var(--font-head)">
          {segments.reduce((s,x)=>s+x.value,0)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="10">Total</text>
      </svg>
      <div className="rpt-ring-legend">
        {segments.map((s, i) => {
          const pct = ((s.value / total) * 100).toFixed(0);
          return (
            <div key={i} className="rpt-ring-item">
              <span className="rpt-ring-dot" style={{ background: s.color }} />
              <span className="rpt-ring-lbl">{s.label}</span>
              <span className="rpt-ring-val">{s.value}</span>
              <span className="rpt-ring-pct">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════════════ */
const KpiCard = ({ label, value, sub, icon, color, dim, trend, trendDir = 'neu' }) => (
  <div className="rpt-kpi" style={{ '--kpi-c': color, '--kpi-dim': dim }}>
    <div className="rpt-kpi-top">
      <div className="rpt-kpi-icon-wrap">{icon}</div>
      {trend && <div className={`rpt-kpi-trend ${trendDir}`}>{trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→'} {trend}</div>}
    </div>
    <div className="rpt-kpi-value">{value}</div>
    <div className="rpt-kpi-label">{label}</div>
    {sub && <div className="rpt-kpi-foot">{sub}</div>}
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   PERIOD CONTROL
══════════════════════════════════════════════════════════════════ */
const PeriodControl = ({ period, setPeriod, selMonth, setMonth, selYear, setYear, years }) => (
  <div className="rpt-filter-row">
    <div className="rpt-period-strip">
      {[
        { id: 'day',    label: 'Today' },
        { id: 'month',  label: 'This Month' },
        { id: 'year',   label: 'This Year' },
        { id: 'custom', label: 'Custom' },
        { id: 'all',    label: 'All Time' },
      ].map(p => (
        <button key={p.id} className={`rpt-period-btn ${period === p.id ? 'active' : ''}`} onClick={() => setPeriod(p.id)}>
          {p.label}
        </button>
      ))}
    </div>

    <div className="rpt-filter-group">
      {period === 'custom' && (
        <>
          <select className="rpt-select" value={selMonth} onChange={e => setMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="rpt-select" value={selYear} onChange={e => setYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </>
      )}
      {period !== 'custom' && (
        <select className="rpt-select" value={selYear} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   SPARKBAR — inline mini bar chart in monthly table
══════════════════════════════════════════════════════════════════ */
const SparkBar = ({ value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color, minWidth: 60, textAlign: 'right' }}>
        {fmt(value)}
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PRODUCT DETAIL TABLE
══════════════════════════════════════════════════════════════════ */
const ProductDetailTable = ({ products, invoices, salesReturns, purchaseReturns, period, selMonth, selYear }) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('salesAmt');
  const [sortDir, setSortDir] = useState('desc');

  const fInv = useMemo(() => filterByPeriod(invoices,        period, 'invoiceDate', selMonth, selYear), [invoices, period, selMonth, selYear]);
  const fSR  = useMemo(() => filterByPeriod(salesReturns,    period, 'createdAt',   selMonth, selYear), [salesReturns, period, selMonth, selYear]);
  const fPR  = useMemo(() => filterByPeriod(purchaseReturns, period, 'createdAt',   selMonth, selYear), [purchaseReturns, period, selMonth, selYear]);

  const rows = useMemo(() => {
    return products
      .filter(p => (p.name||'').toLowerCase().includes(search.toLowerCase()))
      .map(p => {
        let salesQty = 0, salesAmt = 0;
        fInv.forEach(inv => (inv.items||[]).forEach(it => {
          if (it.productId === p._id || it.name === p.name) { salesQty += it.qty||0; salesAmt += (it.qty||0)*(it.price||0); }
        }));
        let srQty = 0, srAmt = 0;
        fSR.forEach(r => (r.items||[]).forEach(it => {
          if (String(it.productId) === String(p._id) || it.name === p.name) { srQty += it.qty||0; srAmt += (it.qty||0)*(it.price||0); }
        }));
        let prQty = 0, prAmt = 0;
        fPR.forEach(r => (r.items||[]).forEach(it => {
          if (String(it.productId) === String(p._id) || it.name === p.name) { prQty += it.qty||0; prAmt += (it.qty||0)*(it.price||0); }
        }));
        return {
          id: p._id, name: p.name||'—', sku: p.sku||p.hsnCode||'—',
          mrp: p.mrp||0, retailerPrice: p.retailerPrice||0,
          distributorPrice: p.distributorPrice||0, itemCost: p.itemCost||0,
          status: p.status||'—', salesQty, salesAmt, srQty, srAmt, prQty, prAmt,
          net: salesAmt - srAmt,
        };
      })
      .sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [products, fInv, fSR, fPR, search, sortKey, sortDir]);

  const totSales = rows.reduce((s,r)=>s+r.salesAmt,0);
  const totSR    = rows.reduce((s,r)=>s+r.srAmt,0);
  const totPR    = rows.reduce((s,r)=>s+r.prAmt,0);
  const totNet   = rows.reduce((s,r)=>s+r.net,0);

  const Th = ({ col, label }) => (
    <th className={sortKey === col ? 'sort-active' : ''}
      onClick={() => { if (sortKey === col) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortKey(col); setSortDir('desc'); } }}>
      {label}{sortKey === col ? (sortDir==='asc'?' ↑':' ↓') : ''}
    </th>
  );

  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">
          <div className="rpt-card-title-icon"><Package size={16} /></div>
          Product Sales Detail
        </div>
        <div className="rpt-filter-group">
          <div className="rpt-search-wrap">
            <Search size={16} className="rpt-search-icon" />
            <input className="rpt-search" placeholder="Search product…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="rpill rpill-blue">{rows.length} products</span>
        </div>
      </div>
      <div className="rpt-table-wrap">
        {rows.length === 0
          ? <div className="rpt-empty"><Package size={36} className="rpt-empty-icon" />No products found.</div>
          : (
          <table className="rpt-table">
            <thead>
              <tr>
                <Th col="name"             label="Product" />
                <th>SKU / HSN</th>
                <Th col="mrp"              label="MRP" />
                <Th col="retailerPrice"    label="Retail ₹" />
                <Th col="distributorPrice" label="Distrib ₹" />
                <Th col="itemCost"         label="Cost" />
                <Th col="salesQty"         label="Sales Qty" />
                <Th col="salesAmt"         label="Sales ₹" />
                <Th col="srQty"            label="SR Qty" />
                <Th col="srAmt"            label="SR ₹" />
                <Th col="prQty"            label="PR Qty" />
                <Th col="prAmt"            label="PR ₹" />
                <Th col="net"              label="Net ₹" />
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="rtd-name">{r.name}</td>
                  <td className="rtd-muted">{r.sku}</td>
                  <td className="rtd-num rtd-red">{fmt(r.mrp)}</td>
                  <td className="rtd-num rtd-green">{fmt(r.retailerPrice)}</td>
                  <td className="rtd-num rtd-blue">{fmt(r.distributorPrice)}</td>
                  <td className="rtd-num rtd-orange">{fmt(r.itemCost)}</td>
                  <td className="rtd-num">{r.salesQty > 0 ? fmtNum(r.salesQty) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num rtd-green">{r.salesAmt > 0 ? fmt(r.salesAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num">{r.srQty > 0 ? fmtNum(r.srQty) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num rtd-orange">{r.srAmt > 0 ? fmt(r.srAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num">{r.prQty > 0 ? fmtNum(r.prQty) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num rtd-red">{r.prAmt > 0 ? fmt(r.prAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num" style={{ color: r.net >= 0 ? 'var(--success)' : 'var(--red)' }}>{fmt(r.net)}</td>
                  <td><span className={`rpill ${r.status === 'Active' ? 'rpill-green' : 'rpill-red'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{ color: 'var(--text-muted)', fontSize: 11 }}>TOTALS</td>
                <td className="rtd-num rtd-green">{fmt(totSales)}</td>
                <td></td>
                <td className="rtd-num rtd-orange">{fmt(totSR)}</td>
                <td></td>
                <td className="rtd-num rtd-red">{fmt(totPR)}</td>
                <td className="rtd-num" style={{ color: totNet>=0?'var(--success)':'var(--red)' }}>{fmt(totNet)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   INVOICE TABLE
══════════════════════════════════════════════════════════════════ */
const InvoiceTable = ({ invoices, period, selMonth, selYear }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => filterByPeriod(invoices, period, 'invoiceDate', selMonth, selYear), [invoices, period, selMonth, selYear]);
  const rows = filtered
    .filter(inv => {
      const q = search.toLowerCase();
      return !q || (inv.customerName||'').toLowerCase().includes(q) || (inv.invoiceNumber||'').toLowerCase().includes(q);
    })
    .sort((a,b) => new Date(b.invoiceDate||b.createdAt) - new Date(a.invoiceDate||a.createdAt));

  const total = rows.reduce((s,r)=>s+(r.totalAmount||0),0);

  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">
          <div className="rpt-card-title-icon"><ReceiptText size={16} /></div>
          Invoice History
        </div>
        <div className="rpt-filter-group">
          <div className="rpt-search-wrap">
            <Search size={16} className="rpt-search-icon" />
            <input className="rpt-search" placeholder="Search invoice / customer…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="rpill rpill-blue">{rows.length} invoices</span>
          <span className="rpill rpill-green">{fmt(total)}</span>
        </div>
      </div>
      <div className="rpt-table-wrap">
        {rows.length === 0
          ? <div className="rpt-empty"><ReceiptText size={36} className="rpt-empty-icon" />No invoices for this period.</div>
          : (
          <table className="rpt-table">
            <thead>
              <tr>
                <th>#Invoice</th><th>Date</th><th>Customer</th><th>Type</th>
                <th>Items</th><th>Subtotal</th><th>Discount</th><th>Courier</th>
                <th>Total</th><th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(inv => (
                <tr key={inv._id}>
                  <td><span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--info)', fontSize: 13 }}>{inv.invoiceNumber}</span></td>
                  <td className="rtd-muted">{fmtDate(inv.invoiceDate||inv.createdAt)}</td>
                  <td style={{ fontWeight: 600 }}>{inv.customerName||'—'}</td>
                  <td><span className={`rpill ${inv.customerType==='shop'?'rpill-blue':'rpill-purple'}`}>{inv.customerType||'customer'}</span></td>
                  <td className="rtd-num">{(inv.items||[]).length}</td>
                  <td className="rtd-num">{fmt(inv.subtotal)}</td>
                  <td className="rtd-num rtd-red">{inv.discount ? fmt(inv.discount) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num">{inv.courierCharge ? fmt(inv.courierCharge) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num rtd-green" style={{ fontSize: 14 }}>{fmt(inv.totalAmount)}</td>
                  <td><span className="rpill rpill-orange">{inv.paymentMode||'—'}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8} style={{ color: 'var(--text-muted)', fontSize: 11 }}>TOTAL REVENUE</td>
                <td className="rtd-num rtd-green" style={{ fontSize: 15 }}>{fmt(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MONTHLY BREAKDOWN TABLE
══════════════════════════════════════════════════════════════════ */
const MonthlyTable = ({ invoices, salesReturns, purchaseReturns, year }) => {
  const yr = year ? Number(year) : new Date().getFullYear();
  const data = MONTHS.map((month, mi) => {
    const inv = invoices.filter(i => { const d = new Date(i.invoiceDate||i.createdAt); return d.getMonth()===mi && d.getFullYear()===yr; });
    const sr  = salesReturns.filter(r => { const d = new Date(r.createdAt); return d.getMonth()===mi && d.getFullYear()===yr; });
    const pr  = purchaseReturns.filter(r => { const d = new Date(r.createdAt); return d.getMonth()===mi && d.getFullYear()===yr; });
    const salesAmt = inv.reduce((s,i)=>s+(i.totalAmount||0),0);
    const srAmt    = sr.reduce((s,r)=>s+(r.totalAmount||0),0);
    const prAmt    = pr.reduce((s,r)=>s+(r.totalAmount||0),0);
    return { month, salesCount: inv.length, salesAmt, srCount: sr.length, srAmt, prCount: pr.length, prAmt, net: salesAmt - srAmt };
  });

  const maxSales = Math.max(...data.map(d=>d.salesAmt), 1);
  const totSales = data.reduce((s,r)=>s+r.salesAmt,0);
  const totSR    = data.reduce((s,r)=>s+r.srAmt,0);
  const totPR    = data.reduce((s,r)=>s+r.prAmt,0);
  const totNet   = data.reduce((s,r)=>s+r.net,0);

  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">
          <div className="rpt-card-title-icon"><Calendar size={16} /></div>
          Monthly Breakdown — {yr}
        </div>
        <span className="rpill rpill-blue">Full Year</span>
      </div>
      <div className="rpt-table-wrap">
        <table className="rpt-table">
          <thead>
            <tr>
              <th>Month</th><th>Sales Chart</th><th>Invoices</th>
              <th>Sales ₹</th><th>SR Count</th><th>SR ₹</th>
              <th>PR Count</th><th>PR ₹</th><th>Net Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isEmpty = row.salesCount===0 && row.srCount===0 && row.prCount===0;
              return (
                <tr key={i} style={{ opacity: isEmpty ? 0.45 : 1 }}>
                  <td style={{ fontWeight: 700, width: 50 }}>{row.month}</td>
                  <td style={{ width: 180 }}>
                    <SparkBar value={row.salesAmt} max={maxSales} color="var(--success)" />
                  </td>
                  <td className="rtd-num">{row.salesCount||<span className="rtd-zero">0</span>}</td>
                  <td className="rtd-num rtd-green">{row.salesAmt > 0 ? fmt(row.salesAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num">{row.srCount||<span className="rtd-zero">0</span>}</td>
                  <td className="rtd-num rtd-orange">{row.srAmt > 0 ? fmt(row.srAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num">{row.prCount||<span className="rtd-zero">0</span>}</td>
                  <td className="rtd-num rtd-red">{row.prAmt > 0 ? fmt(row.prAmt) : <span className="rtd-zero">—</span>}</td>
                  <td className="rtd-num" style={{ color: row.net>=0?'var(--success)':'var(--red)', fontWeight: 800 }}>
                    {row.net !== 0 ? fmt(row.net) : <span className="rtd-zero">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ color: 'var(--text-muted)', fontSize: 11 }}>YEAR TOTALS</td>
              <td className="rtd-num rtd-green">{fmt(totSales)}</td>
              <td></td>
              <td className="rtd-num rtd-orange">{fmt(totSR)}</td>
              <td></td>
              <td className="rtd-num rtd-red">{fmt(totPR)}</td>
              <td className="rtd-num" style={{ color: totNet>=0?'var(--success)':'var(--red)', fontSize: 15 }}>{fmt(totNet)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   RADNUS REPORTS
══════════════════════════════════════════════════════════════════ */
const RadnusReports = ({ invoices, salesReturns, purchaseReturns, products }) => {
  const [period, setPeriod]     = useState('month');
  const [selMonth, setMonth]    = useState('');
  const [selYear, setYear]      = useState(String(new Date().getFullYear()));
  const [activeTab, setActiveTab] = useState('overview');

  const years = useMemo(() => {
    const all = new Set();
    [...invoices, ...salesReturns, ...purchaseReturns].forEach(i => {
      const y = getYear(i.invoiceDate||i.createdAt);
      if (y && !isNaN(y)) all.add(y);
    });
    const now = new Date().getFullYear();
    all.add(now); all.add(now - 1);
    return Array.from(all).sort((a,b)=>b-a);
  }, [invoices, salesReturns, purchaseReturns]);

  const fInv = useMemo(() => filterByPeriod(invoices,        period, 'invoiceDate', selMonth, selYear), [invoices, period, selMonth, selYear]);
  const fSR  = useMemo(() => filterByPeriod(salesReturns,    period, 'createdAt',   selMonth, selYear), [salesReturns, period, selMonth, selYear]);
  const fPR  = useMemo(() => filterByPeriod(purchaseReturns, period, 'createdAt',   selMonth, selYear), [purchaseReturns, period, selMonth, selYear]);

  const totalSales = fInv.reduce((s,i)=>s+(i.totalAmount||0),0);
  const totalSR    = fSR.reduce((s,r)=>s+(r.totalAmount||0),0);
  const totalPR    = fPR.reduce((s,r)=>s+(r.totalAmount||0),0);
  const netRevenue = totalSales - totalSR;

  const activeProds   = products.filter(p=>p.status==='Active').length;
  const inactiveProds = products.length - activeProds;
  const totalMRP      = products.reduce((s,p)=>s+(p.mrp||0),0);
  const totalRP       = products.reduce((s,p)=>s+(p.retailerPrice||0),0);
  const totalDP       = products.reduce((s,p)=>s+(p.distributorPrice||0),0);
  const totalIC       = products.reduce((s,p)=>s+(p.itemCost||0),0);

  const srPend = salesReturns.filter(r=>r.status==='pending').length;
  const srAppr = salesReturns.filter(r=>r.status==='approved').length;
  const srRej  = salesReturns.filter(r=>r.status==='rejected').length;
  const prPend = purchaseReturns.filter(r=>r.status==='pending').length;
  const prAppr = purchaseReturns.filter(r=>r.status==='approved').length;
  const prRej  = purchaseReturns.filter(r=>r.status==='rejected').length;

  const TABS = [
    { id: 'overview', label: 'Overview',  icon: <BarChart3 size={15} />,  count: null },
    { id: 'products', label: 'Products',  icon: <Package size={15} />,    count: products.length },
    { id: 'invoices', label: 'Invoices',  icon: <ReceiptText size={15} />,count: fInv.length },
    { id: 'monthly',  label: 'Monthly',   icon: <Calendar size={15} />,   count: null },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <div className="rpt-hero">
        <div className="rpt-hero-left">
          <div className="rpt-hero-eyebrow">
            <span className="rpt-hero-eyebrow-dot" />
            Live Dashboard
          </div>
          <div className="rpt-hero-title">Reports & Analytics</div>
          <div className="rpt-hero-sub">Financial overview for Radnus — track sales, returns, and stock</div>
        </div>
        <div className="rpt-hero-right">
          <div className="rpt-hero-badge">
            <User size={14} /> Radnus
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: 'var(--success)', letterSpacing: -1 }}>{fmt(netRevenue)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Net Revenue</div>
          </div>
        </div>
      </div>

      {/* ── Period control ── */}
      <PeriodControl period={period} setPeriod={setPeriod} selMonth={selMonth} setMonth={setMonth} selYear={selYear} setYear={setYear} years={years} />

      {/* ── KPI Cards ── */}
      <div className="rpt-kpi-grid">
        <KpiCard label="Total Sales"      value={fmt(totalSales)}   icon={<DollarSign size={18} />} color="var(--success)" dim="rgba(16,185,129,0.1)"  trend={`${fInv.length} invoices`} trendDir="up" sub={<>Revenue from all invoices</>} />
        <KpiCard label="Net Revenue"      value={fmt(netRevenue)}   icon={<TrendingUp size={18} />} color="var(--info)"    dim="rgba(99,102,241,0.1)"  trend="After returns"              trendDir="neu" sub={<>Sales minus sales returns</>} />
        <KpiCard label="Sales Returns"    value={fmt(totalSR)}      icon={<RotateCcw size={18} />} color="var(--warning)" dim="rgba(245,158,11,0.1)"  trend={`${fSR.length} returns`}    trendDir="down" sub={<>{srPend} pending approval</>} />
        <KpiCard label="Purchase Returns" value={fmt(totalPR)}      icon={<RotateCw size={18} />} color="var(--red)"     dim="rgba(220,38,38,0.08)"  trend={`${fPR.length} returns`}    trendDir="down" sub={<>{prPend} pending approval</>} />
      </div>

      {/* ── Tabs ── */}
      <div>
        <div className="rpt-tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`rpt-tab-btn ${activeTab===t.id?'active':''}`} onClick={() => setActiveTab(t.id)}>
              {t.icon}
              {t.label}
              {t.count !== null && <span className="rpt-tab-dot">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>

            {/* Product price totals */}
            <div className="rpt-card">
              <div className="rpt-card-head">
                <div className="rpt-card-title"><div className="rpt-card-title-icon"><Gem size={16} /></div>Product Price Totals</div>
                <span className="rpill rpill-blue">{products.length} products</span>
              </div>
              <div className="rpt-price-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                {[
                  { label: 'Total MRP',               value: totalMRP, avg: totalMRP/(products.length||1),  color: 'var(--red)',     pc: 'var(--red)' },
                  { label: 'Total Retailer Price',     value: totalRP,  avg: totalRP/(products.length||1),   color: 'var(--success)', pc: 'var(--success)' },
                  { label: 'Total Distributor Price',  value: totalDP,  avg: totalDP/(products.length||1),   color: 'var(--info)',    pc: 'var(--info)' },
                  { label: 'Total Item Cost',          value: totalIC,  avg: totalIC/(products.length||1),   color: 'var(--warning)', pc: 'var(--warning)' },
                ].map(item => (
                  <div key={item.label} className="rpt-price-cell" style={{ '--pc': item.pc }}>
                    <div className="rpt-price-lbl">{item.label}</div>
                    <div className="rpt-price-val" style={{ color: item.color }}>{fmt(item.value)}</div>
                    <div className="rpt-price-avg">Avg per product: {fmt(item.avg)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ring charts */}
            <div className="rpt-grid-3">
              {[
                { title: 'Product Stock', icon: <Package size={15} />, segs: [
                  { label: 'Active',   value: activeProds,   color: 'var(--success)' },
                  { label: 'Inactive', value: inactiveProds, color: 'var(--red)' },
                ]},
                { title: 'Sales Returns', icon: <RotateCcw size={15} />, segs: [
                  { label: 'Pending',  value: srPend, color: 'var(--warning)' },
                  { label: 'Approved', value: srAppr, color: 'var(--success)' },
                  { label: 'Rejected', value: srRej,  color: 'var(--red)' },
                ]},
                { title: 'Purchase Returns', icon: <RotateCw size={15} />, segs: [
                  { label: 'Pending',  value: prPend, color: 'var(--warning)' },
                  { label: 'Approved', value: prAppr, color: 'var(--success)' },
                  { label: 'Rejected', value: prRej,  color: 'var(--red)' },
                ]},
              ].map(c => (
                <div key={c.title} className="rpt-card">
                  <div className="rpt-card-head">
                    <div className="rpt-card-title">
                      {c.icon}
                      {c.title}
                    </div>
                  </div>
                  <div className="rpt-card-body"><RingChart segments={c.segs} /></div>
                </div>
              ))}
            </div>

            {/* Summary table */}
            <div className="rpt-card">
              <div className="rpt-card-head"><div className="rpt-card-title"><div className="rpt-card-title-icon"><ClipboardList size={16} /></div>Summary</div></div>
              <table className="rpt-summary-table">
                <thead>
                  <tr><th>Metric</th><th>Count</th><th>Total Value</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Sales (Invoices)',   count: fInv.length, value: totalSales, pill: <span className="rpill rpill-green">Completed</span> },
                    { label: 'Sales Returns',       count: fSR.length,  value: totalSR,    pill: <span className="rpill rpill-orange">{srPend} Pending</span> },
                    { label: 'Purchase Returns',    count: fPR.length,  value: totalPR,    pill: <span className="rpill rpill-orange">{prPend} Pending</span> },
                    { label: 'Total Products',      count: products.length, value: totalMRP, pill: <span className="rpill rpill-green">{activeProds} Active</span> },
                  ].map(row => (
                    <tr key={row.label}>
                      <td style={{ fontWeight: 600 }}>{row.label}</td>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{row.count}</td>
                      <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{fmt(row.value)}</td>
                      <td>{row.pill}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: 700 }}>Net Revenue</td>
                    <td>—</td>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: netRevenue>=0?'var(--success)':'var(--red)' }}>{fmt(netRevenue)}</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div style={{ marginTop: 24 }}>
            <ProductDetailTable products={products} invoices={invoices} salesReturns={salesReturns} purchaseReturns={purchaseReturns} period={period} selMonth={selMonth} selYear={selYear} />
          </div>
        )}

        {activeTab === 'invoices' && (
          <div style={{ marginTop: 24 }}>
            <InvoiceTable invoices={invoices} period={period} selMonth={selMonth} selYear={selYear} />
          </div>
        )}

        {activeTab === 'monthly' && (
          <div style={{ marginTop: 24 }}>
            <MonthlyTable invoices={invoices} salesReturns={salesReturns} purchaseReturns={purchaseReturns} year={selYear} />
          </div>
        )}
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ADMIN REPORTS
══════════════════════════════════════════════════════════════════ */
const AdminReports = ({ products, retailers, distributors, fseList }) => {
  const activeRet  = retailers.filter(r=>r.status==='APPROVED').length;
  const activeDist = distributors.filter(d=>d.status==='APPROVED').length;
  const activeProd = products.filter(p=>p.status==='Active').length;
  const activeFSE  = fseList.filter(f=>f.status==='APPROVED').length;

  return (
    <>
      <div className="rpt-hero">
        <div className="rpt-hero-left">
          <div className="rpt-hero-eyebrow"><span className="rpt-hero-eyebrow-dot" />Admin Dashboard</div>
          <div className="rpt-hero-title">Reports & Analytics</div>
          <div className="rpt-hero-sub">Full platform overview — retailers, distributors, products & FSE</div>
        </div>
        <div className="rpt-hero-right">
          <div className="rpt-hero-badge"><Shield size={14} /> Admin</div>
        </div>
      </div>

      <div className="rpt-kpi-grid">
        <KpiCard label="Total Revenue"    value="₹0"         icon={<DollarSign size={18} />} color="var(--red)"     dim="rgba(220,38,38,0.08)"  trendDir="neu" sub="No revenue data yet" />
        <KpiCard label="Active Retailers" value={activeRet}  icon={<User size={18} />} color="var(--success)" dim="rgba(16,185,129,0.1)"  trendDir="up"  sub={`${retailers.length} total retailers`} />
        <KpiCard label="Total Products"   value={activeProd} icon={<Package size={18} />} color="var(--info)"    dim="rgba(99,102,241,0.1)"  trendDir="up"  sub={`${products.length} total products`} />
        <KpiCard label="Active FSE"       value={activeFSE}  icon={<User size={18} />} color="var(--warning)" dim="rgba(245,158,11,0.1)"  trendDir="neu" sub={`${fseList.length} total FSE`} />
      </div>

      <div className="rpt-grid-3">
        {[
          { title: 'Retailer Status', icon: <User size={15} />, segs: [
            { label: 'Active',   value: activeRet,               color: 'var(--success)' },
            { label: 'Inactive', value: retailers.length-activeRet, color: 'var(--red)' },
          ]},
          { title: 'Product Stock', icon: <Package size={15} />, segs: [
            { label: 'In Stock',     value: activeProd,               color: 'var(--success)' },
            { label: 'Out of Stock', value: products.length-activeProd, color: 'var(--red)' },
          ]},
          { title: 'Distributor Status', icon: <Truck size={15} />, segs: [
            { label: 'Active',   value: activeDist,                    color: 'var(--info)' },
            { label: 'Inactive', value: distributors.length-activeDist, color: 'var(--red)' },
          ]},
        ].map(c => (
          <div key={c.title} className="rpt-card">
            <div className="rpt-card-head">
              <div className="rpt-card-title">
                {c.icon}
                {c.title}
              </div>
            </div>
            <div className="rpt-card-body"><RingChart segments={c.segs} /></div>
          </div>
        ))}
      </div>

      <div className="rpt-card">
        <div className="rpt-card-head"><div className="rpt-card-title"><div className="rpt-card-title-icon"><ClipboardList size={16} /></div>Summary</div></div>
        <table className="rpt-summary-table">
          <thead><tr><th>Metric</th><th>Total</th><th>Active</th><th>This Month</th><th>Trend</th></tr></thead>
          <tbody>
            {[
              { label: 'Retailers',    total: retailers.length,    active: activeRet,  month: 0, trend: '↑', tc: 'var(--success)' },
              { label: 'Distributors', total: distributors.length, active: activeDist, month: 0, trend: '→', tc: 'var(--text-muted)' },
              { label: 'Products',     total: products.length,     active: activeProd, month: 0, trend: '↑', tc: 'var(--success)' },
              { label: 'FSE',          total: fseList.length,      active: activeFSE,  month: 0, trend: '→', tc: 'var(--text-muted)' },
            ].map(row => (
              <tr key={row.label}>
                <td style={{ fontWeight: 600 }}>{row.label}</td>
                <td style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{row.total}</td>
                <td><span className="rpill rpill-green">{row.active}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{row.month}</td>
                <td style={{ color: row.tc, fontWeight: 800, fontSize: 18 }}>{row.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
const ReportsPage = () => {
  const { role } = useSelector(selectAuthState);
  const products        = useSelector(s => s.products.list);
  const retailers       = useSelector(s => s.retailer.list);
  const distributors    = useSelector(s => s.distributors.list);
  const fseList         = useSelector(s => s.fse.list);
  const invoices        = useSelector(s => s.invoice.data);
  const salesReturns    = useSelector(s => s.returns.salesReturns);
  const purchaseReturns = useSelector(s => s.returns.purchaseReturns);

  return (
    <div className="reports-page">
      {role === 'Admin' && (
        <AdminReports products={products} retailers={retailers} distributors={distributors} fseList={fseList} />
      )}
      {role === 'Radnus' && (
        <RadnusReports invoices={invoices} salesReturns={salesReturns} purchaseReturns={purchaseReturns} products={products} />
      )}
    </div>
  );
};

export default ReportsPage;