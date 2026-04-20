import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Package, Store, Truck, Users, UserCheck, Map,
  IndianRupee, Calendar, Timer, AlertCircle, ShoppingCart, Star
} from 'lucide-react';
import { StatCard, SectionHeader, Badge, Avatar, PageLoader } from '../../components/ui/UI';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchRetailers } from '../../services/features/retailer/retailerSlice';
import { fetchDistributors } from '../../services/features/distributor/distributorSlice';
import { getManagers } from '../../services/features/manager/managerSlice';
import { getExecutives } from '../../services/features/executive/executiveSlice';
import { fetchFSE } from '../../services/features/fse/fseSlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import './Dashboard.css';

/* ─── Mini bar chart ─────────────────────────────────────────────────────────── */
const BarChart = ({ data, label }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.label}: ${d.value}`} />
          <div className="bar-lbl">{d.label}</div>
        </div>
      ))}
      {label && <div className="bar-y-label">{label}</div>}
    </div>
  );
};

/* ─── Quick action card ──────────────────────────────────────────────────────── */
const ActionCard = ({ icon: Icon, title, sub, accent, onClick }) => (
  <div className={`action-card accent-${accent}`} onClick={onClick}>
    <div className={`action-icon accent-${accent}`}><Icon size={20} /></div>
    <div className="action-info">
      <div className="action-title">{title}</div>
      <div className="action-sub">{sub}</div>
    </div>
    <div className="action-arrow">→</div>
  </div>
);

/* ─── Recent items table ─────────────────────────────────────────────────────── */
const RecentTable = ({ title, rows, columns }) => (
  <div className="dash-table-card">
    <div className="dash-table-head"><h3 className="section-title">{title}</h3></div>
    <table className="dash-table">
      <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data yet</td></tr>
          : rows.map((r, i) => <tr key={i}>{r}</tr>)
        }
      </tbody>
    </table>
  </div>
);

/* ═══ Dashboard ══════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user, role } = useSelector(selectAuthState);
  const products     = useSelector(s => s.products.list);
  const retailers    = useSelector(s => s.retailer.list);
  const distributors = useSelector(s => s.distributors.list);
  const managers     = useSelector(s => s.manager.list);
  const executives   = useSelector(s => s.executive.list);
  const fseList      = useSelector(s => s.fse.list);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchRetailers());
    if (['Admin', 'Radnus', 'MarketingManager'].includes(role)) dispatch(fetchDistributors());
    if (['Admin', 'Radnus'].includes(role)) { dispatch(getManagers()); dispatch(getExecutives()); dispatch(fetchFSE()); }
    if (role === 'MarketingManager') dispatch(fetchFSE());
    if (role === 'MarketingExecutive') dispatch(fetchFSE());
  }, [dispatch, role]);

  const activeRetailers    = retailers.filter(r => r.status === 'Active').length;
  const activeDistributors = distributors.filter(d => d.status === 'Active').length;
  const activeProducts     = products.filter(p => p.status === 'Active' || p.stock > 0).length;
  const lowStock           = products.filter(p => p.stock < 20 && p.stock > 0).length;

  // Months bar data (demo — replace with API response)
  const monthlyData = ['J','F','M','A','M','J','J','A','S','O','N','D'].map((l, i) => ({
    label: l, value: [28,42,35,68,55,72,65,88,74,90,78,95][i],
  }));

  /* ─── Admin / Radnus Dashboard ──────────────────────────────────────────────── */
  if (role === 'Admin' || role === 'Radnus') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'A'} size="lg" />
        <div>
          <h2 className="dash-greeting">Good day, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
          <p className="dash-sub">Here's your business overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<IndianRupee size={20}/>} label="Today's Sales"     value="₹0"                   accent="red"    delta="↑ Live data" deltaType="up" />
        <StatCard icon={<Calendar size={20}/>}    label="This Month"        value="₹0"                   accent="purple" />
        <StatCard icon={<Store size={20}/>}       label="Active Retailers"  value={activeRetailers}      accent="green"  onClick={() => navigate('/retailers')} />
        <StatCard icon={<Truck size={20}/>}       label="Distributors"      value={distributors.length}  accent="blue"   onClick={() => navigate('/distributors')} />
        <StatCard icon={<Users size={20}/>}       label="Active FSEs"       value={fseList.length}       accent="yellow" onClick={() => navigate('/fse')} />
        <StatCard icon={<Package size={20}/>}     label="Products"          value={products.length}      accent="green"  onClick={() => navigate('/products')} />
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="card card-pad">
          <SectionHeader title="Sales Trend — 2025" />
          <BarChart data={monthlyData} />
        </div>
        <div className="card card-pad">
          <SectionHeader title="Network Overview" />
          {[
            ['Retailers',    activeRetailers,    retailers.length,    'var(--success)'],
            ['Distributors', activeDistributors, distributors.length, 'var(--info)'],
            ['Products',     activeProducts,     products.length,     'var(--red)'],
            ['Managers',     managers.length,    managers.length,     'var(--purple)'],
          ].map(([lbl, val, total, color]) => (
            <div key={lbl} className="progress-row">
              <div className="progress-info"><span>{lbl}</span><span>{val}/{total}</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: total ? `${(val/total)*100}%` : '0%', background: color }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        <div>
          <SectionHeader title="Quick Actions" />
          <div className="actions-list">
            <ActionCard icon={Truck}     title="Pending Approvals"       sub="Distributor · FSE · Retailer requests" accent="red"    onClick={() => navigate('/distributors')} />
            <ActionCard icon={Map}       title="Territory Management"    sub="State · District · Taluk · Beat"       accent="blue"   onClick={() => navigate('/territory')} />
            <ActionCard icon={Package}   title="Product Master"          sub="Products · Pricing · MOQ"              accent="green"  onClick={() => navigate('/products')} />
            <ActionCard icon={AlertCircle} title="Non-Moving Stock"      sub="Items with zero activity"              accent="yellow" onClick={() => navigate('/products')} />
          </div>
        </div>
        <RecentTable
          title="Recent Retailers"
          columns={['Retailer', 'City', 'Status']}
          rows={retailers.slice(0, 5).map(r => [
            <td key="n"><div className="avatar-row"><Avatar name={r.name} size="xs"/><span style={{marginLeft:8}}>{r.name}</span></div></td>,
            <td key="c">{r.city || '—'}</td>,
            <td key="s"><Badge variant={r.status === 'Active' ? 'active' : 'inactive'}>{r.status || 'Pending'}</Badge></td>,
          ])}
        />
      </div>

      {lowStock > 0 && (
        <div className="alert-card">
          <AlertCircle size={18} /> <span>{lowStock} products with low stock — </span>
          <button className="auth-link" onClick={() => navigate('/products')}>View Products →</button>
        </div>
      )}
    </div>
  );

  /* ─── Distributor Dashboard ─────────────────────────────────────────────────── */
  if (role === 'Distributor') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'D'} size="lg" />
        <div>
          <h2 className="dash-greeting">Welcome, {user?.name?.split(' ')[0] || 'Distributor'}</h2>
          <p className="dash-sub">Your business at a glance</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<IndianRupee size={20}/>} label="Today's Sales"    value="₹0"              accent="green"  />
        <StatCard icon={<Package size={20}/>}     label="Stock Value"      value="₹0"              accent="red"    />
        <StatCard icon={<ShoppingCart size={20}/>} label="Pending Orders"  value="0"               accent="yellow" onClick={() => navigate('/orders')} />
        <StatCard icon={<Store size={20}/>}       label="My Retailers"    value={retailers.length} accent="blue"   onClick={() => navigate('/retailers')} />
      </div>
      <div className="two-col">
        <div className="card card-pad">
          <SectionHeader title="Monthly Sales" />
          <BarChart data={monthlyData} />
        </div>
        <div>
          <SectionHeader title="Quick Actions" />
          <div className="actions-list">
            <ActionCard icon={ShoppingCart} title="Place Order"    sub="Order products from catalog"    accent="red"   onClick={() => navigate('/products')} />
            <ActionCard icon={Store}        title="My Retailers"   sub="Manage retailer network"        accent="green" onClick={() => navigate('/retailers')} />
            <ActionCard icon={Package}      title="Product Catalog" sub="Browse available products"     accent="blue"  onClick={() => navigate('/products')} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Marketing Manager Dashboard ──────────────────────────────────────────── */
  if (role === 'MarketingManager') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'M'} size="lg" />
        <div>
          <h2 className="dash-greeting">Manager Dashboard</h2>
          <p className="dash-sub">Team and territory overview — {user?.name}</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<UserCheck size={20}/>}   label="My Executives" value={executives.length}   accent="blue"   onClick={() => navigate('/executives')} />
        <StatCard icon={<Users size={20}/>}       label="Field Execs"   value={fseList.length}      accent="purple" onClick={() => navigate('/fse')} />
        <StatCard icon={<Store size={20}/>}       label="Retailers"     value={retailers.length}    accent="green"  onClick={() => navigate('/retailers')} />
        <StatCard icon={<Truck size={20}/>}       label="Distributors"  value={distributors.length} accent="yellow" onClick={() => navigate('/distributors')} />
      </div>
      <div className="actions-list" style={{ marginBottom: 24 }}>
        <ActionCard icon={UserCheck} title="Onboard Executive"    sub="Add marketing executive"           accent="blue"   onClick={() => navigate('/executives')} />
        <ActionCard icon={Map}       title="Territory Management" sub="Review territory assignments"       accent="red"    onClick={() => navigate('/territory')} />
        <ActionCard icon={Users}     title="FSE Management"       sub="Monitor field executive activity"   accent="green"  onClick={() => navigate('/fse')} />
      </div>
    </div>
  );

  /* ─── Marketing Executive Dashboard ────────────────────────────────────────── */
  if (role === 'MarketingExecutive') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'E'} size="lg" />
        <div>
          <h2 className="dash-greeting">Executive Dashboard</h2>
          <p className="dash-sub">Your territory overview — {user?.name}</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<Users size={20}/>}  label="My FSEs"      value={fseList.length}   accent="blue"   onClick={() => navigate('/fse')} />
        <StatCard icon={<Store size={20}/>}  label="Retailers"    value={retailers.length} accent="green"  onClick={() => navigate('/retailers')} />
        <StatCard icon={<Truck size={20}/>}  label="Distributors" value={distributors.length} accent="purple" onClick={() => navigate('/distributors')} />
        <StatCard icon={<TrendingUp size={20}/>} label="This Month Sales" value="₹0" accent="red" />
      </div>
      <div className="actions-list">
        <ActionCard icon={Users}  title="Manage FSEs"     sub="View FSE activity and routes"       accent="blue"  onClick={() => navigate('/fse')} />
        <ActionCard icon={Store}  title="Retailer List"   sub="Browse and manage retailers"        accent="green" onClick={() => navigate('/retailers')} />
        <ActionCard icon={Truck}  title="Distributor List" sub="View distributor details"          accent="red"   onClick={() => navigate('/distributors')} />
      </div>
    </div>
  );

  /* ─── FSE Dashboard ─────────────────────────────────────────────────────────── */
  if (role === 'FSE') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'F'} size="lg" />
        <div>
          <h2 className="dash-greeting">Good day, {user?.name?.split(' ')[0] || 'FSE'} 👋</h2>
          <p className="dash-sub">Field Dashboard</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<Store size={20}/>}     label="Today's Visits"   value="0"              accent="blue"   />
        <StatCard icon={<IndianRupee size={20}/>} label="Today's Sales"  value="₹0"             accent="green"  />
        <StatCard icon={<Timer size={20}/>}     label="Session"          value="Not Started"    accent="yellow" />
        <StatCard icon={<Package size={20}/>}   label="Orders Taken"     value="0"              accent="red"    />
      </div>
      <div className="actions-list">
        <ActionCard icon={Store}       title="Visit Retailer"    sub="Log retailer visit and order"    accent="green"  onClick={() => navigate('/retailers')} />
        <ActionCard icon={Package}     title="Product Catalog"   sub="Browse product list"             accent="blue"   onClick={() => navigate('/products')} />
        <ActionCard icon={ShoppingCart} title="Take Order"       sub="Place order for retailer"        accent="red"    onClick={() => navigate('/orders')} />
      </div>
    </div>
  );

  /* ─── Retailer Dashboard ────────────────────────────────────────────────────── */
  if (role === 'Retailer') return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'R'} size="lg" />
        <div>
          <h2 className="dash-greeting">Welcome, {user?.name?.split(' ')[0] || 'Retailer'}</h2>
          <p className="dash-sub">Your store overview</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<ShoppingCart size={20}/>} label="My Orders"    value="0"  accent="blue"   onClick={() => navigate('/orders')} />
        <StatCard icon={<Package size={20}/>}      label="Products"     value={products.length} accent="green" onClick={() => navigate('/products')} />
        <StatCard icon={<IndianRupee size={20}/>}  label="Pending Dues" value="₹0" accent="yellow" />
        <StatCard icon={<Star size={20}/>}         label="Feedback"     value="0"  accent="red"    onClick={() => navigate('/feedback')} />
      </div>
      <div className="actions-list">
        <ActionCard icon={Package}     title="Browse Products"  sub="View full product catalog"      accent="blue"  onClick={() => navigate('/products')} />
        <ActionCard icon={ShoppingCart} title="My Orders"       sub="View order history"             accent="green" onClick={() => navigate('/orders')} />
        <ActionCard icon={Star}        title="Give Feedback"    sub="Rate products and service"      accent="red"   onClick={() => navigate('/feedback')} />
      </div>
    </div>
  );

  /* ─── Default / Radnus Employee ─────────────────────────────────────────────── */
  return (
    <div className="dashboard">
      <div className="dash-welcome">
        <Avatar name={user?.name || 'U'} size="lg" />
        <div>
          <h2 className="dash-greeting">Welcome, {user?.name || 'User'}</h2>
          <p className="dash-sub">Radnus DMS — {role}</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard icon={<Package size={20}/>} label="Products"    value={products.length}    accent="red"   />
        <StatCard icon={<Store size={20}/>}   label="Retailers"   value={retailers.length}   accent="green" />
        <StatCard icon={<Truck size={20}/>}   label="Distributors" value={distributors.length} accent="blue" />
      </div>
    </div>
  );
};

export default DashboardPage;
