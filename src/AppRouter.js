import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { checkAuth }      from './services/features/auth/authSlice';
import { checkAdminAuth } from './services/features/auth/adminAuthSlice';
import { selectAuthState } from './store/selectors/authSelector';

import AppShell  from './components/layout/AppShell';
import LoginPage from './pages/Auth/LoginPage';
import { RegisterPage, OtpPage, ForgotPasswordPage, ResetPasswordPage } from './pages/Auth/AuthPages';

import DashboardPage  from './pages/Dashboard/DashboardPage';
import ProductsPage   from './pages/Products/ProductsPage';
import RetailersPage  from './pages/Retailers/RetailersPage';
import ReportsPage    from './pages/Reports/ReportsPage';
import ProfilePage    from './pages/Profile/ProfilePage';
import {
  DistributorsPage, TerritoryPage, ManagersPage, ExecutivesPage, FSEPage,
} from './pages/Features/FeaturePages';

import { PageLoader } from './components/ui/UI';

/* ─── Role → allowed routes ──────────────────────────────────────────────────── */
const ROLE_ROUTES = {
  Admin:              ['dashboard','products','distributors','retailers','managers','executives','fse','territory','orders','reports','profile'],
  Radnus:             ['dashboard','products','distributors','retailers','territory','reports','profile'],
  Distributor:        ['dashboard','products','retailers','orders','invoices','reports','profile'],
  MarketingManager:   ['dashboard','distributors','retailers','executives','fse','territory','reports','profile'],
  MarketingExecutive: ['dashboard','retailers','distributors','fse','reports','profile'],
  FSE:                ['dashboard','retailers','products','orders','reports','profile'],
  Retailer:           ['dashboard','products','orders','invoices','feedback','profile'],
};

/* ─── Protected Route ────────────────────────────────────────────────────────── */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, role, isCheckingAuth } = useSelector(selectAuthState);
  const { isCheckingAuth: adminChecking }     = useSelector(s => s.adminAuth);
  const location = useLocation();

  if (isCheckingAuth || adminChecking) return <PageLoader />;
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/* ─── Public Route (redirect if already logged in) ───────────────────────────── */
const PublicRoute = ({ children }) => {
  const { token, user, isCheckingAuth } = useSelector(selectAuthState);
  const { isCheckingAuth: adminChecking } = useSelector(s => s.adminAuth);

  if (isCheckingAuth || adminChecking) return <PageLoader />;
  if (token && user) return <Navigate to="/dashboard" replace />;
  return children;
};

/* ─── Layout wrapper with role check ────────────────────────────────────────── */
const AppLayout = () => {
  const { user } = useSelector(selectAuthState);
  return (
    <ProtectedRoute>
      <AppShell user={user} />
    </ProtectedRoute>
  );
};

/* ─── Role-gated page ────────────────────────────────────────────────────────── */
const RolePage = ({ routeKey, children }) => {
  const { role } = useSelector(selectAuthState);
  const allowed  = ROLE_ROUTES[role] || [];
  if (!allowed.includes(routeKey)) return <Navigate to="/dashboard" replace />;
  return children;
};

/* ─── Placeholder for pages not yet built (Orders, Invoices, Feedback) ──────── */
const PlaceholderPage = ({ title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-muted)' }}>
    <div style={{ fontSize: 48 }}>🚧</div>
    <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
    <div style={{ fontSize: 13 }}>This page is under construction</div>
  </div>
);

/* ═══ AppRouter ════════════════════════════════════════════════════════════════ */
const AppRouterInner = () => {
  console.log("BASE URL:", process.env.REACT_APP_API_BASE_URL);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkAdminAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* ─── Public Auth Routes ──────────────────────────────────────────────── */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/otp"             element={<PublicRoute><OtpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* ─── Protected App Routes ────────────────────────────────────────────── */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/products" element={
          <ProtectedRoute><RolePage routeKey="products"><ProductsPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/retailers" element={
          <ProtectedRoute><RolePage routeKey="retailers"><RetailersPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/distributors" element={
          <ProtectedRoute><RolePage routeKey="distributors"><DistributorsPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/managers" element={
          <ProtectedRoute><RolePage routeKey="managers"><ManagersPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/executives" element={
          <ProtectedRoute><RolePage routeKey="executives"><ExecutivesPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/fse" element={
          <ProtectedRoute><RolePage routeKey="fse"><FSEPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/territory" element={
          <ProtectedRoute><RolePage routeKey="territory"><TerritoryPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute><RolePage routeKey="orders"><PlaceholderPage title="Orders" /></RolePage></ProtectedRoute>
        } />

        <Route path="/invoices" element={
          <ProtectedRoute><RolePage routeKey="invoices"><PlaceholderPage title="Invoices" /></RolePage></ProtectedRoute>
        } />

        <Route path="/feedback" element={
          <ProtectedRoute><RolePage routeKey="feedback"><PlaceholderPage title="Feedback" /></RolePage></ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute><RolePage routeKey="reports"><ReportsPage /></RolePage></ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
      </Route>

      {/* ─── Fallback ────────────────────────────────────────────────────────── */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <AppRouterInner />
  </BrowserRouter>
);

export default AppRouter;
