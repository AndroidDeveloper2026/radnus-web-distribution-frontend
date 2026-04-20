import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/products':     'Product Catalog',
  '/retailers':    'Retailer Management',
  '/distributors': 'Distributor Network',
  '/managers':     'Marketing Managers',
  '/executives':   'Marketing Executives',
  '/fse':          'Field Sales Executives',
  '/territory':    'Territory Management',
  '/orders':       'Orders',
  '/invoices':     'Invoices',
  '/reports':      'Reports & Analytics',
  '/profile':      'Profile Settings',
  '/feedback':     'Feedback',
};

const AppShell = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Radnus DMS';

  return (
    <div className={`app-shell ${collapsed ? 'shell-collapsed' : ''}`}>
      <Sidebar user={user} collapsed={collapsed} onCollapse={() => setCollapsed(c => !c)} />
      <div className="shell-main">
        <Topbar title={title} user={user} />
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
