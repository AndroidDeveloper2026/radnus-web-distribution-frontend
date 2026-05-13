// src/pages/Dashboard/DashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Package, Store, Truck, Users, UserCheck, Map,
  IndianRupee, Calendar, Timer, AlertCircle, ShoppingCart, Star,
  Coins, TrendingDown, FileText, Plus, ClipboardList, UserCog,
  MessageSquare, Box, BarChart3, ScrollText
} from 'lucide-react';
import { StatCard, SectionHeader, Badge, Avatar, PageLoader } from '../../components/ui/UI';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchRetailers } from '../../services/features/retailer/retailerSlice';
import { fetchDistributors } from '../../services/features/distributor/distributorSlice';
import { getManagers } from '../../services/features/manager/managerSlice';
import { getExecutives } from '../../services/features/executive/executiveSlice';
import { fetchFSE } from '../../services/features/fse/fseSlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import api from '../../services/API/api';
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
      <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data yet</td></tr>
        ) : (
          rows.map((row, i) => <tr key={i}>{row}</tr>)
        )}
      </tbody>
    </table>
  </div>
);

/* ─── Helper functions ───────────────────────────────────────────────────────── */
const getNum = (obj, key, fallback = 0) => {
  if (obj?.[key] !== undefined && obj[key] !== null) {
    const val = Number(obj[key]);
    if (!isNaN(val)) return val;
  }
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj[spacedKey] !== null) {
    const val = Number(obj[spacedKey]);
    if (!isNaN(val)) return val;
  }
  return fallback;
};

const getId = obj => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  return obj._id || obj.id;
};

const parseDate = dateValue => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return !isNaN(parsed) ? parsed : new Date();
  }
  if (typeof dateValue === 'object' && dateValue.$date) {
    const parsed = new Date(dateValue.$date);
    return !isNaN(parsed) ? parsed : new Date();
  }
  return new Date();
};

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

/* ======================= ADMIN DASHBOARD ======================= */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list: distributors, loading: distLoading } = useSelector(s => s.distributors);
  const { list: retailers } = useSelector(s => s.retailer);
  const { list: fseList } = useSelector(s => s.fse);
  const { list: products } = useSelector(s => s.products);
  const { user } = useSelector(selectAuthState);

  const [todaySales, setTodaySales] = useState(0);
  const [todaySalesLoading, setTodaySalesLoading] = useState(true);
  const [thisMonthSales, setThisMonthSales] = useState(0);
  const [thisMonthSalesLoading, setThisMonthSalesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTodaySales = useCallback(async () => {
    setTodaySalesLoading(true);
    try {
      const res = await api.get('/api/invoices?filter=today');
      const invoices = res.data || [];
      const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      setTodaySales(total);
    } catch (error) {
      console.error("Failed to fetch today's sales:", error);
      setTodaySales(0);
    } finally {
      setTodaySalesLoading(false);
    }
  }, []);

  const fetchThisMonthSales = useCallback(async () => {
    setThisMonthSalesLoading(true);
    try {
      const res = await api.get('/api/invoices?filter=month');
      const invoices = res.data || [];
      const total = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      setThisMonthSales(total);
    } catch (error) {
      console.error("Failed to fetch month sales:", error);
      setThisMonthSales(0);
    } finally {
      setThisMonthSalesLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDistributors()),
      dispatch(fetchRetailers()),
      dispatch(fetchFSE()),
      fetchTodaySales(),
      fetchThisMonthSales(),
    ]);
    setRefreshing(false);
  }, [dispatch, fetchTodaySales, fetchThisMonthSales]);

  useEffect(() => {
    dispatch(fetchDistributors());
    dispatch(fetchRetailers());
    dispatch(fetchFSE());
    fetchTodaySales();
    fetchThisMonthSales();
  }, [dispatch, fetchTodaySales, fetchThisMonthSales]);

  const totalDistributors = distributors.length;
  const activeRetailers = retailers.filter(r => r.status === 'Active').length;
  const activeFSE = fseList.length;
  const attendanceToday = 0;
  const pendingCollections = 0;
  const nonMovingStock = 0;

  return (
    <div className="dashboard">
      <div className="dash-welcome" style={{ justifyContent: 'space-between' }}>
        <div>
          {/* ✅ Show actual profile image in Admin dashboard */}
          <Avatar
            name={user?.name || 'A'}
            size="lg"
            src={user?.profileImage || user?.photo}
          />
          <h2 className="dash-greeting">Good day, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
          <p className="dash-sub">Here's your business overview</p>
        </div>
        <button className="auth-link" onClick={onRefresh} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={<IndianRupee size={20} />} label="Today's Sales" value={todaySalesLoading ? '...' : `₹${todaySales.toLocaleString('en-IN')}`} accent="red" delta="↑ Live data" deltaType="up" onClick={() => navigate('/invoices', { state: { filter: 'today' } })} />
        <StatCard icon={<Calendar size={20} />} label="This Month" value={thisMonthSalesLoading ? '...' : `₹${thisMonthSales.toLocaleString('en-IN')}`} accent="purple" />
        <StatCard icon={<Store size={20} />} label="Active Retailers" value={activeRetailers} accent="green" onClick={() => navigate('/retailers')} />
        <StatCard icon={<Truck size={20} />} label="Distributors" value={totalDistributors} accent="blue" onClick={() => navigate('/distributors')} />
        <StatCard icon={<Users size={20} />} label="Active FSEs" value={activeFSE} accent="yellow" onClick={() => navigate('/fse')} />
        <StatCard icon={<Package size={20} />} label="Products" value={products.length} accent="green" onClick={() => navigate('/products')} />
      </div>

      <div className="stats-grid">
        <StatCard icon={<UserCog size={20} />} label="Active FSE" value={activeFSE} accent="blue" />
        <StatCard icon={<Timer size={20} />} label="Attendance Today" value={`${attendanceToday}%`} accent="yellow" />
        <StatCard icon={<IndianRupee size={20} />} label="Pending Collections" value={`₹${pendingCollections}`} accent="red" />
        <StatCard icon={<Package size={20} />} label="Non-Moving Stock" value={`₹${nonMovingStock}`} accent="orange" />
      </div>

      <SectionHeader title="Action Required" />
      <div className="actions-list">
        <ActionCard icon={AlertCircle} title="Pending Approvals" sub="Distributor · FSE · Retailer requests" accent="red" onClick={() => navigate('/distributors')} />
        <ActionCard icon={BarChart3} title="Distributor Performance" sub="Sales · Stock · Incentives" accent="purple" onClick={() => navigate('/distributor-performance')} />
        <ActionCard icon={UserCheck} title="FSE Performance" sub="Attendance · Sales · Visits" accent="green" onClick={() => navigate('/fse-performance')} />
        <ActionCard icon={UserCheck} title="Manager Onboarding" sub="Onboard Managers" accent="blue" onClick={() => navigate('/manager-onboarding')} />
        <ActionCard icon={UserCheck} title="Manager Management" sub="Edit / Delete Managers" accent="orange" onClick={() => navigate('/manager-management')} />
      </div>

      <SectionHeader title="Master & Control" />
      <div className="actions-list">
        <ActionCard icon={Map} title="Territory Management" sub="State · District · Taluk · Beat" accent="blue" onClick={() => navigate('/territory')} />
        <ActionCard icon={Box} title="Product Master" sub="Products · Pricing · MOQ" accent="green" onClick={() => navigate('/products')} />
        <ActionCard icon={Users} title="Customer Details" sub="Manage customer information" accent="teal" onClick={() => navigate('/customers')} />
        <ActionCard icon={MessageSquare} title="Admin Feedback" sub="Customer feedback & reviews" accent="pink" onClick={() => navigate('/admin-feedback')} />
        <ActionCard icon={ScrollText} title="Activity Log" sub="Edit & Update Products Logs" accent="red" onClick={() => navigate('/activity-log')} />
      </div>
    </div>
  );
};

/* ======================= RADNUS EMPLOYEE DASHBOARD ======================= */
const RadnusDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const products = useSelector(s => s.products.list);

  const [todaySales, setTodaySales] = useState(0);
  const [todaySalesLoading, setTodaySalesLoading] = useState(true);
  const [totalItemCostValue, setTotalItemCostValue] = useState(0);
  const [itemCostLoading, setItemCostLoading] = useState(true);
  const [totalInward, setTotalInward] = useState(0);
  const [totalOutward, setTotalOutward] = useState(0);
  const [inwardOutwardLoading, setInwardOutwardLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTodaySales = useCallback(async () => {
    setTodaySalesLoading(true);
    try {
      const response = await api.get(`/api/invoices?filter=today&billerName=${user?.name || ''}`);
      const invoices = response.data || [];
      const total = invoices.filter(inv => inv?.status === 'completed').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      setTodaySales(total);
    } catch (error) {
      console.error("Failed to fetch today's sales:", error);
      setTodaySales(0);
    } finally {
      setTodaySalesLoading(false);
    }
  }, [user?.name]);

  const computeItemCost = useCallback(() => {
    setItemCostLoading(true);
    try {
      let totalCost = 0;
      products.forEach(product => {
        // Use stock field if present, else moq (both represent live stock from backend)
        const stock = getNum(product, 'stock') || getNum(product, 'moq', 0);
        const itemCost = getNum(product, 'itemCost', 0);
        totalCost += stock * itemCost;
      });
      setTotalItemCostValue(totalCost);
    } catch (error) {
      console.error('Failed to compute item cost:', error);
      setTotalItemCostValue(0);
    } finally {
      setItemCostLoading(false);
    }
  }, [products]);

  const computeInwardOutward = useCallback(async () => {
    if (products.length === 0) return;
    setInwardOutwardLoading(true);
    try {
      const today = new Date();

      // Today's inward = total moq of products created today
      let todayInward = 0;
      products.forEach(product => {
        const createdAt = parseDate(product.createdAt);
        if (isSameDay(createdAt, today)) {
          todayInward += getNum(product, 'moq', 0);
        }
      });

      // Today's outward = sum of item quantities from today's completed invoices
      const response = await api.get('/api/invoices?filter=today');
      const todayInvoices = (response.data || []).filter(inv => inv.status !== 'draft');
      let todayOutward = 0;
      todayInvoices.forEach(invoice => {
        (invoice.items || []).forEach(item => {
          todayOutward += getNum(item, 'qty', 0);
        });
      });

      setTotalInward(todayInward);
      setTotalOutward(todayOutward);
    } catch (error) {
      console.error('Failed to compute inward/outward:', error);
      setTotalInward(0);
      setTotalOutward(0);
    } finally {
      setInwardOutwardLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchTodaySales();
    computeItemCost();
    computeInwardOutward();
  }, [fetchTodaySales, computeItemCost, computeInwardOutward]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTodaySales(), computeItemCost(), computeInwardOutward()]);
    setRefreshing(false);
  };

  return (
    <div className="dashboard">
      <div className="dash-welcome">
        {/* ✅ Show actual profile image in Radnus dashboard */}
        <Avatar
          name={user?.name || 'R'}
          size="lg"
          src={user?.profileImage || user?.photo}
        />
        <div>
          <h2 className="dash-greeting">Welcome, {user?.name || 'User'}</h2>
          <p className="dash-sub">Business Overview</p>
        </div>
        <button className="auth-link" onClick={handleRefresh} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1, marginLeft: 'auto' }}>
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={<IndianRupee size={20} />} label="Today Sales" value={todaySalesLoading ? '...' : `₹${todaySales.toLocaleString('en-IN')}`} accent="green" onClick={() => navigate('/invoices', { state: { filter: 'today' } })} />
        <StatCard icon={<Coins size={20} />} label="Item Cost Total" value={itemCostLoading ? '...' : `₹${Math.round(totalItemCostValue).toLocaleString('en-IN')}`} accent="yellow" onClick={() => navigate('/stock-visibility')} />
        <StatCard icon={<TrendingUp size={20} />} label="Inward (Today)" value={inwardOutwardLoading ? '...' : `${totalInward} units`} accent="green" onClick={() => navigate('/central-stock')} />
        <StatCard icon={<TrendingDown size={20} />} label="Outward (Today)" value={inwardOutwardLoading ? '...' : `${totalOutward} units`} accent="red" onClick={() => navigate('/invoices', { state: { filter: 'today' } })} />
      </div>

      <SectionHeader title="Quick Actions" />
      <div className="actions-list">
        <ActionCard icon={Users} title="Customer Details" sub="View and manage customers" accent="blue" onClick={() => navigate('/customers')} />
        <ActionCard icon={ClipboardList} title="Invoice History" sub="All past invoices" accent="orange" onClick={() => navigate('/invoices')} />
        <ActionCard icon={Plus} title="Product Master" sub="Add or edit products" accent="red" onClick={() => navigate('/products')} />
        <ActionCard icon={Package} title="Stock Summary" sub="Current stock levels" accent="red" onClick={() => navigate('/stock-visibility')} />
        <ActionCard icon={ShoppingCart} title="Order Cart" sub="Create new order" accent="green" onClick={() => navigate('/order-cart')} />
        <ActionCard icon={FileText} title="Central Stock" sub="Central stock overview" accent="purple" onClick={() => navigate('/central-stock')} />
        <ActionCard icon={IndianRupee} title="Order Billing" sub="Generate invoice" accent="yellow" onClick={() => navigate('/order-cart')} />
      </div>
    </div>
  );
};

/* ======================= OTHER ROLE DASHBOARDS ======================= */
const DistributorDashboard = () => <div className="dashboard"><h2>Distributor Dashboard</h2></div>;
const MarketingManagerDashboard = () => <div className="dashboard"><h2>Marketing Manager Dashboard</h2></div>;
const MarketingExecutiveDashboard = () => <div className="dashboard"><h2>Marketing Executive Dashboard</h2></div>;
const FSEDashboard = () => <div className="dashboard"><h2>FSE Dashboard</h2></div>;
const RetailerDashboard = () => <div className="dashboard"><h2>Retailer Dashboard</h2></div>;

/* ======================= MAIN DASHBOARD PAGE ======================= */
const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user, role } = useSelector(selectAuthState);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchRetailers());
    if (['Admin', 'Radnus', 'MarketingManager'].includes(role)) dispatch(fetchDistributors());
    if (['Admin', 'Radnus'].includes(role)) { dispatch(getManagers()); dispatch(getExecutives()); dispatch(fetchFSE()); }
    if (role === 'MarketingManager') dispatch(fetchFSE());
    if (role === 'MarketingExecutive') dispatch(fetchFSE());
  }, [dispatch, role]);

  if (role === 'Admin') return <AdminDashboard />;
  if (role === 'Radnus') return <RadnusDashboard />;
  if (role === 'Distributor') return <DistributorDashboard />;
  if (role === 'MarketingManager') return <MarketingManagerDashboard />;
  if (role === 'MarketingExecutive') return <MarketingExecutiveDashboard />;
  if (role === 'FSE') return <FSEDashboard />;
  if (role === 'Retailer') return <RetailerDashboard />;

  return (
    <div className="dashboard">
      <div className="dash-welcome">
        {/* ✅ Show actual profile image in fallback dashboard */}
        <Avatar
          name={user?.name || 'U'}
          size="lg"
          src={user?.profileImage || user?.photo}
        />
        <div>
          <h2 className="dash-greeting">Welcome, {user?.name || 'User'}</h2>
          <p className="dash-sub">Radnus DMS — {role}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;