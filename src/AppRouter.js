import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { checkAuth } from "./services/features/auth/authSlice";
import { checkAdminAuth } from "./services/features/auth/adminAuthSlice";
import { selectAuthState } from "./store/selectors/authSelector";

// Pre‑fetch all data
import { fetchProducts } from "./services/features/products/productSlice";
import { fetchRetailers } from "./services/features/retailer/retailerSlice";
import { fetchDistributors } from "./services/features/distributor/distributorSlice";
import { getManagers } from "./services/features/manager/managerSlice";
import { getExecutives } from "./services/features/executive/executiveSlice";
import { fetchFSE } from "./services/features/fse/fseSlice";
import { fetchTerritory } from "./services/features/Territory/TerritorySlice";

import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/Auth/LoginPage";
import {
  RegisterPage,
  OtpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/Auth/AuthPages";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductsPage from "./pages/Products/ProductsPage";
import RetailersPage from "./pages/Retailers/RetailersPage";
import ReportsPage from "./pages/Reports/ReportsPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import CustomerListPage from "./pages/Customer/CustomerListPage";
import InvoiceListPage from "./pages/Invoice/InvoiceListPage";
import InvoiceViewPage from "./pages/Invoice/InvoiceViewPage";
import StockVisibilityPage from "./pages/StockVisibility/StockVisibilityPage";
import CentralStockPage from "./pages/Stock/CentralStockPage";
import OrderCartPage from "./pages/Order/OrderCartPage";
import OrderSuccessPage from "./pages/Order/OrderSuccessPage";
import InvoicePage from "./pages/Order/InvoicePage";
import ActivityLogPage from "./pages/ActivityLog/ActivityLogPage";
import FeedbackPage from "./pages/Feedback/FeedbackPage";
import AdminFeedbackPage from "./pages/Feedback/AdminFeedbackPage";
import SalesReturnPage from "./pages/Returns/SalesReturnPage";
import PurchaseReturnPage from "./pages/Returns/PurchaseReturnPage";
import ExcelExportScreen from "./pages/Reports/ExcelExportScreen";
import {
  DistributorsPage,
  TerritoryPage,
  ManagersPage,
  ExecutivesPage,
  FSEPage,
} from "./pages/Features/FeaturePages";
import StockMovement from "./pages/StockMovement/StockMovement";

import { PageLoader } from "./components/ui/UI";

const ROLE_ROUTES = {
  Admin: [
    "dashboard",
    "products",
    "distributors",
    "retailers",
    "managers",
    "executives",
    "fse",
    "territory",
    "orders",
    "reports",
    "profile",
    "invoices",
    "stock",
    "customers",
    "central-stock",
    "order-cart",
    "order-success",
    "invoice",
    "activity-logs",
    "admin-feedback",
    "sales-return",
    "purchase-return",
    "excel-export",
    "stock-movement",
  ],
  Radnus: [
    "dashboard",
    "products",
    "distributors",
    "retailers",
    "territory",
    "reports",
    "profile",
    "invoices",
    "customers",
    "stock",
    "central-stock",
    "order-cart",
    "order-success",
    "invoice",
    "feedback",
    "sales-return",
    "purchase-return",
    "excel-export",
    "stock-movement",
  ],
  Distributor: [
    "dashboard",
    "products",
    "retailers",
    "orders",
    "invoices",
    "reports",
    "profile",
    "stock",
    "central-stock",
    "order-cart",
    "order-success",
    "invoice",
    "sales-return",
    "purchase-return",
  ],
  MarketingManager: [
    "dashboard",
    "distributors",
    "retailers",
    "executives",
    "fse",
    "territory",
    "reports",
    "profile",
  ],
  MarketingExecutive: [
    "dashboard",
    "retailers",
    "distributors",
    "fse",
    "reports",
    "profile",
  ],
  FSE: [
    "dashboard",
    "retailers",
    "products",
    "orders",
    "reports",
    "profile",
    "order-cart",
    "order-success",
    "invoice",
  ],
  Retailer: [
    "dashboard",
    "products",
    "orders",
    "invoices",
    "feedback",
    "profile",
    "order-cart",
    "order-success",
    "invoice",
  ],
};

const DataPrefetcher = () => {
  const dispatch = useDispatch();
  const { token, role } = useSelector(selectAuthState);

  useEffect(() => {
    if (!token || !role) return;
    dispatch(fetchProducts());
    dispatch(fetchRetailers());
    if (
      [
        "Admin",
        "Radnus",
        "MarketingManager",
        "MarketingExecutive",
        "Distributor",
      ].includes(role)
    ) {
      dispatch(fetchDistributors());
    }
    if (["Admin", "Radnus"].includes(role)) {
      dispatch(getManagers());
      dispatch(getExecutives());
      dispatch(fetchFSE());
      dispatch(fetchTerritory());
    }
    if (["MarketingManager", "MarketingExecutive"].includes(role)) {
      dispatch(fetchFSE());
      dispatch(fetchTerritory());
    }
  }, [token, role, dispatch]);
  return null;
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, role, isCheckingAuth } = useSelector(selectAuthState);
  const { isCheckingAuth: adminChecking } = useSelector((s) => s.adminAuth);
  const location = useLocation();
  if (isCheckingAuth || adminChecking) return <PageLoader />;
  if (!token || !user)
    return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token, user, isCheckingAuth } = useSelector(selectAuthState);
  const { isCheckingAuth: adminChecking } = useSelector((s) => s.adminAuth);
  if (isCheckingAuth || adminChecking) return <PageLoader />;
  if (token && user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = () => {
  const { user } = useSelector(selectAuthState);
  return (
    <ProtectedRoute>
      <AppShell user={user} />
    </ProtectedRoute>
  );
};

const RolePage = ({ routeKey, children }) => {
  const { role } = useSelector(selectAuthState);
  const allowed = ROLE_ROUTES[role] || [];
  if (!allowed.includes(routeKey)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PlaceholderPage = ({ title }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      gap: 12,
      color: "var(--text-muted)",
    }}
  >
    <div style={{ fontSize: 48 }}>🚧</div>
    <div
      style={{
        fontFamily: "var(--font-head)",
        fontSize: 20,
        fontWeight: 700,
        color: "var(--text-secondary)",
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: 13 }}>This page is under construction</div>
  </div>
);

const AppRouterInner = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkAuth());
    dispatch(checkAdminAuth());
  }, [dispatch]);

  return (
    <>
      <DataPrefetcher />
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/otp"
          element={
            <PublicRoute>
              <OtpPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Protected */}
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <RolePage routeKey="products">
                  <ProductsPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/retailers"
            element={
              <ProtectedRoute>
                <RolePage routeKey="retailers">
                  <RetailersPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributors"
            element={
              <ProtectedRoute>
                <RolePage routeKey="distributors">
                  <DistributorsPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/managers"
            element={
              <ProtectedRoute>
                <RolePage routeKey="managers">
                  <ManagersPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/executives"
            element={
              <ProtectedRoute>
                <RolePage routeKey="executives">
                  <ExecutivesPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fse"
            element={
              <ProtectedRoute>
                <RolePage routeKey="fse">
                  <FSEPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/territory"
            element={
              <ProtectedRoute>
                <RolePage routeKey="territory">
                  <TerritoryPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <RolePage routeKey="orders">
                  <PlaceholderPage title="Orders" />
                </RolePage>
              </ProtectedRoute>
            }
          />

          {/* Invoices */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <RolePage routeKey="invoices">
                  <InvoiceListPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <RolePage routeKey="invoices">
                  <InvoiceViewPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          {/* 
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <RolePage routeKey="feedback">
                  <PlaceholderPage title="Feedback" />
                </RolePage>
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/stock-movement"
            element={
              <ProtectedRoute>
                <RolePage routeKey="stock-movement">
                  <StockMovement />
                </RolePage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/excel-export"
            element={
              <ProtectedRoute>
                <RolePage routeKey="excel-export">
                  <ExcelExportScreen />
                </RolePage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <RolePage routeKey="customers">
                  <CustomerListPage />
                </RolePage>
              </ProtectedRoute>
            }
          />

          {/* Stock Visibility */}
          <Route
            path="/stock-visibility"
            element={
              <ProtectedRoute>
                <RolePage routeKey="stock">
                  <StockVisibilityPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/central-stock"
            element={
              <ProtectedRoute>
                <RolePage routeKey="central-stock">
                  <CentralStockPage />
                </RolePage>
              </ProtectedRoute>
            }
          />

          {/* Order Flow */}
          <Route
            path="/order-cart"
            element={
              <ProtectedRoute>
                <RolePage routeKey="order-cart">
                  <OrderCartPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <RolePage routeKey="order-success">
                  <OrderSuccessPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <RolePage routeKey="invoice">
                  <InvoicePage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          {/* Activity Logs */}
          <Route
            path="/activity-logs"
            element={
              <ProtectedRoute>
                <RolePage routeKey="activity-logs">
                  <ActivityLogPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <RolePage routeKey="feedback">
                  <FeedbackPage />
                </RolePage>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-feedback"
            element={
              <ProtectedRoute>
                <RolePage routeKey="admin-feedback">
                  <AdminFeedbackPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-return"
            element={
              <ProtectedRoute>
                <RolePage routeKey="sales-return">
                  <SalesReturnPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-return"
            element={
              <ProtectedRoute>
                <RolePage routeKey="purchase-return">
                  <PurchaseReturnPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RolePage routeKey="reports">
                  <ReportsPage />
                </RolePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <AppRouterInner />
  </BrowserRouter>
);

export default AppRouter;
