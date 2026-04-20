import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../services/features/auth/authSlice';
import { adminLogout } from '../../services/features/auth/adminAuthSlice';
import { clearAll } from '../../services/AuthStorage/authStorage';
import './Layout.css';

import {
  LayoutDashboard, Package, Users, Store, Truck, Map, BarChart3,
  UserCheck, UserCog, LogOut, Sun, Moon, ChevronLeft, Menu,
  FileText, ShoppingCart, Star, Settings, Home
} from 'lucide-react';

/* ─── Role → Nav Map (mirrors BottomTabsNavigator.js ROLE_TABS) ─────────────── */
const ROLE_NAV = {
  Admin: [
    { path: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
    { path: '/products',     label: 'Products',       icon: Package },
    { path: '/distributors', label: 'Distributors',   icon: Truck },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/managers',     label: 'Managers',       icon: UserCog },
    { path: '/executives',   label: 'Executives',     icon: UserCheck },
    { path: '/fse',          label: 'Field Execs',    icon: Users },
    { path: '/territory',    label: 'Territory',      icon: Map },
    { path: '/orders',       label: 'Orders',         icon: ShoppingCart },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  Radnus: [
    { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/products',     label: 'Products',       icon: Package },
    { path: '/distributors', label: 'Distributors',   icon: Truck },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/territory',    label: 'Territory',      icon: Map },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  Distributor: [
    { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/products',     label: 'Products',       icon: Package },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/orders',       label: 'Orders',         icon: ShoppingCart },
    { path: '/invoices',     label: 'Invoices',       icon: FileText },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  MarketingManager: [
    { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/distributors', label: 'Distributors',   icon: Truck },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/executives',   label: 'Executives',     icon: UserCheck },
    { path: '/fse',          label: 'Field Execs',    icon: Users },
    { path: '/territory',    label: 'Territory',      icon: Map },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  MarketingExecutive: [
    { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/distributors', label: 'Distributors',   icon: Truck },
    { path: '/fse',          label: 'Field Execs',    icon: Users },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  FSE: [
    { path: '/dashboard',    label: 'My Dashboard',   icon: Home },
    { path: '/retailers',    label: 'Retailers',      icon: Store },
    { path: '/products',     label: 'Products',       icon: Package },
    { path: '/orders',       label: 'Orders',         icon: ShoppingCart },
    { path: '/reports',      label: 'Reports',        icon: BarChart3 },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
  Retailer: [
    { path: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
    { path: '/products',     label: 'Products',       icon: Package },
    { path: '/orders',       label: 'My Orders',      icon: ShoppingCart },
    { path: '/invoices',     label: 'Invoices',       icon: FileText },
    { path: '/feedback',     label: 'Feedback',       icon: Star },
    { path: '/profile',      label: 'Profile',        icon: Settings },
  ],
};

const Sidebar = ({ user, collapsed, onCollapse }) => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const role       = user?.role || 'Retailer';
  const navItems   = ROLE_NAV[role] || ROLE_NAV['Retailer'];
  const initials   = (user?.name || user?.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    if (role === 'Admin') await dispatch(adminLogout());
    else await dispatch(logoutUser());
    clearAll();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-logo">R</div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Radnus</span>
              <span className="sidebar-brand-sub">DMS Platform</span>
            </div>
          </div>
        )}
        {collapsed && <div className="sidebar-logo">R</div>}
        <button className="sidebar-toggle" onClick={onCollapse}>
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User pill */}
      {!collapsed && (
        <div className="sidebar-user">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-user-info">
            <span className="sb-user-name">{user?.name || 'User'}</span>
            <span className="sb-user-role">{role}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-group-label">Navigation</span>}
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} className="nav-item-icon" />
              {!collapsed && <span className="nav-item-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-footer-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button className="sidebar-footer-btn sidebar-logout" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
