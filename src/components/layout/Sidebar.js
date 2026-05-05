// import React, { useState, useRef, useEffect } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { useTheme } from "../../context/ThemeContext";
// import { logoutUser } from "../../services/features/auth/authSlice";
// import { adminLogout } from "../../services/features/auth/adminAuthSlice";
// import { clearAll } from "../../services/AuthStorage/authStorage";
// import "./Layout.css";

// import {
//   LayoutDashboard,
//   Package,
//   Users,
//   Store,
//   Truck,
//   Map,
//   BarChart3,
//   UserCheck,
//   UserCog,
//   LogOut,
//   Sun,
//   Moon,
//   ChevronLeft,
//   Menu,
//   FileText,
//   ShoppingCart,
//   Star,
//   Settings,
//   Home,
//   MessageSquare,
//   MoreVertical,
//   AlertTriangle,
// } from "lucide-react";

// const ROLE_NAV = {
//   Admin: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/products", label: "Products", icon: Package },
//     { path: "/distributors", label: "Distributors", icon: Truck },
//     { path: "/retailers", label: "Retailers", icon: Store },
//     { path: "/managers", label: "Managers", icon: UserCog },
//     { path: "/executives", label: "Executives", icon: UserCheck },
//     { path: "/fse", label: "Field Execs", icon: Users },
//     { path: "/territory", label: "Territory", icon: Map },
//     { path: "/customers", label: "Customers", icon: Users },
//     { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
//     { path: "/central-stock", label: "Central Stock", icon: Package },
//     { path: "/activity-logs", label: "Activity Log", icon: FileText },
//     { path: "/admin-feedback", label: "Admin Feedback", icon: MessageSquare },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   Radnus: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/products", label: "Products", icon: Package },
//     { path: "/customers", label: "Customers", icon: Users },
//     { path: "/invoices", label: "Invoices History", icon: Store },
//     { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
//     { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
//     { path: "/central-stock", label: "Central Stock", icon: Package },
//     { path: "/feedback", label: "Feedback", icon: Star },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   Distributor: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/products", label: "Products", icon: Package },
//     { path: "/retailers", label: "Retailers", icon: Store },
//     { path: "/orders", label: "Orders", icon: ShoppingCart },
//     { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
//     { path: "/invoices", label: "Invoices", icon: FileText },
//     { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
//     { path: "/central-stock", label: "Central Stock", icon: Package },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   MarketingManager: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/distributors", label: "Distributors", icon: Truck },
//     { path: "/retailers", label: "Retailers", icon: Store },
//     { path: "/executives", label: "Executives", icon: UserCheck },
//     { path: "/fse", label: "Field Execs", icon: Users },
//     { path: "/territory", label: "Territory", icon: Map },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   MarketingExecutive: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/retailers", label: "Retailers", icon: Store },
//     { path: "/distributors", label: "Distributors", icon: Truck },
//     { path: "/fse", label: "Field Execs", icon: Users },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   FSE: [
//     { path: "/dashboard", label: "My Dashboard", icon: Home },
//     { path: "/retailers", label: "Retailers", icon: Store },
//     { path: "/products", label: "Products", icon: Package },
//     { path: "/orders", label: "Orders", icon: ShoppingCart },
//     { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
//     { path: "/reports", label: "Reports", icon: BarChart3 },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
//   Retailer: [
//     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { path: "/products", label: "Products", icon: Package },
//     { path: "/orders", label: "My Orders", icon: ShoppingCart },
//     { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
//     { path: "/invoices", label: "Invoices", icon: FileText },
//     { path: "/feedback", label: "Feedback", icon: Star },
//     { path: "/profile", label: "Profile", icon: Settings },
//   ],
// };

// const Sidebar = ({ user, collapsed, onCollapse, mobileOpen, onMobileClose }) => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme();
//   const role = user?.role || "Retailer";
//   const navItems = ROLE_NAV[role] || ROLE_NAV["Retailer"];
//   const initials = (user?.name || user?.email || "U")
//     .split(" ")
//     .map((w) => w[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);

//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);
//   const dropdownRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleLogoutClick = () => setShowLogoutModal(true);

//   const confirmLogout = async () => {
//     setShowLogoutModal(false);
//     if (role === "Admin") await dispatch(adminLogout());
//     else await dispatch(logoutUser());
//     clearAll();
//     navigate("/login", { replace: true });
//   };

//   const cancelLogout = () => setShowLogoutModal(false);

//   return (
//     <>
//       <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
//         <div className="sidebar-header">
//           {!collapsed && (
//             <div className="sidebar-brand">
//               <div className="sidebar-logo">R</div>
//               <div className="sidebar-brand-text">
//                 <span className="sidebar-brand-name">Radnus</span>
//                 <span className="sidebar-brand-sub">DMS Platform</span>
//               </div>
//             </div>
//           )}
//           {collapsed && <div className="sidebar-logo">R</div>}
//           <button className="sidebar-toggle" onClick={onCollapse}>
//             {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
//           </button>
//         </div>

//         {!collapsed && (
//           <div className="sidebar-user">
//             <div className="sb-avatar">{initials}</div>
//             <div className="sb-user-info">
//               <span className="sb-user-name">{user?.name || "User"}</span>
//               <span className="sb-user-role">{role}</span>
//             </div>
//           </div>
//         )}

//         <nav className="sidebar-nav">
//           {!collapsed && <span className="nav-group-label">Navigation</span>}
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             return (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 className={({ isActive }) =>
//                   `nav-item ${isActive ? "nav-active" : ""}`
//                 }
//                 title={collapsed ? item.label : ""}
//                 onClick={onMobileClose}
//               >
//                 <Icon size={18} className="nav-item-icon" />
//                 {!collapsed && (
//                   <span className="nav-item-label">{item.label}</span>
//                 )}
//               </NavLink>
//             );
//           })}
//         </nav>

//         <div className="sidebar-footer">
//           {!collapsed ? (
//             <>
//               <button
//                 className="sidebar-footer-btn"
//                 onClick={toggleTheme}
//                 title="Toggle theme"
//               >
//                 {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
//                 <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
//               </button>
//               <button
//                 className="sidebar-footer-btn sidebar-logout"
//                 onClick={handleLogoutClick}
//                 title="Sign out"
//               >
//                 <LogOut size={16} />
//                 <span>Sign Out</span>
//               </button>
//             </>
//           ) : (
//             <div className="collapsed-menu" ref={dropdownRef}>
//               <button
//                 className="three-dot-btn"
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//                 title="Menu"
//               >
//                 <MoreVertical size={18} />
//               </button>
//               {dropdownOpen && (
//                 <div className="three-dot-dropdown">
//                   {navItems.map((item) => {
//                     const Icon = item.icon;
//                     return (
//                       <NavLink
//                         key={item.path}
//                         to={item.path}
//                         className="dropdown-item"
//                         onClick={() => setDropdownOpen(false)}
//                         title={item.label}
//                       >
//                         <Icon size={16} />
//                         <span>{item.label}</span>
//                       </NavLink>
//                     );
//                   })}
//                   <div className="dropdown-divider" />
//                   <button className="dropdown-item" onClick={toggleTheme}>
//                     {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
//                     <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
//                   </button>
//                   <button className="dropdown-item" onClick={handleLogoutClick}>
//                     <LogOut size={16} />
//                     <span>Sign Out</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </aside>

//       {/* Custom Logout Modal */}
//       {showLogoutModal && (
//         <div className="modal-overlay" onClick={cancelLogout}>
//           <div className="modal-container" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <AlertTriangle size={24} className="modal-icon" />
//               <h3>Confirm Sign Out</h3>
//             </div>
//             <div className="modal-body">
//               <p>Are you sure you want to sign out?</p>
//             </div>
//             <div className="modal-footer">
//               <button className="modal-btn modal-btn-cancel" onClick={cancelLogout}>
//                 Cancel
//               </button>
//               <button className="modal-btn modal-btn-confirm" onClick={confirmLogout}>
//                 OK
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Sidebar;

//------------------------------

import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import { logoutUser } from "../../services/features/auth/authSlice";
import { adminLogout } from "../../services/features/auth/adminAuthSlice";
import { clearAll } from "../../services/AuthStorage/authStorage";
import "./Layout.css";

import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  Truck,
  Map,
  BarChart3,
  UserCheck,
  UserCog,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  Menu,
  FileText,
  ShoppingCart,
  Star,
  Settings,
  Home,
  MessageSquare,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";

const ROLE_NAV = {
  Admin: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/distributors", label: "Distributors", icon: Truck },
    { path: "/retailers", label: "Retailers", icon: Store },
    { path: "/managers", label: "Managers", icon: UserCog },
    { path: "/executives", label: "Executives", icon: UserCheck },
    { path: "/fse", label: "Field Execs", icon: Users },
    { path: "/territory", label: "Territory", icon: Map },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
    { path: "/central-stock", label: "Central Stock", icon: Package },
    { path: "/activity-logs", label: "Activity Log", icon: FileText },
    { path: "/admin-feedback", label: "Admin Feedback", icon: MessageSquare },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  Radnus: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/invoices", label: "Invoices History", icon: Store },
    { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
    { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
    { path: "/central-stock", label: "Central Stock", icon: Package },
    { path: "/feedback", label: "Feedback", icon: Star },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  Distributor: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/retailers", label: "Retailers", icon: Store },
    { path: "/orders", label: "Orders", icon: ShoppingCart },
    { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/stock-visibility", label: "Stock Visibility", icon: Package },
    { path: "/central-stock", label: "Central Stock", icon: Package },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  MarketingManager: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/distributors", label: "Distributors", icon: Truck },
    { path: "/retailers", label: "Retailers", icon: Store },
    { path: "/executives", label: "Executives", icon: UserCheck },
    { path: "/fse", label: "Field Execs", icon: Users },
    { path: "/territory", label: "Territory", icon: Map },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  MarketingExecutive: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/retailers", label: "Retailers", icon: Store },
    { path: "/distributors", label: "Distributors", icon: Truck },
    { path: "/fse", label: "Field Execs", icon: Users },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  FSE: [
    { path: "/dashboard", label: "My Dashboard", icon: Home },
    { path: "/retailers", label: "Retailers", icon: Store },
    { path: "/products", label: "Products", icon: Package },
    { path: "/orders", label: "Orders", icon: ShoppingCart },
    { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
  Retailer: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/products", label: "Products", icon: Package },
    { path: "/orders", label: "My Orders", icon: ShoppingCart },
    { path: "/order-cart", label: "Place Order", icon: ShoppingCart },
    { path: "/invoices", label: "Invoices", icon: FileText },
    { path: "/feedback", label: "Feedback", icon: Star },
    { path: "/profile", label: "Profile", icon: Settings },
  ],
};

const Sidebar = ({ user, collapsed, onCollapse, mobileOpen, onMobileClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const role = user?.role || "Retailer";
  const navItems = ROLE_NAV[role] || ROLE_NAV["Retailer"];
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    if (role === "Admin") await dispatch(adminLogout());
    else await dispatch(logoutUser());
    clearAll();
    navigate("/login", { replace: true });
  };

  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
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

        {!collapsed && (
          <div className="sidebar-user">
            <div className="sb-avatar">
              {user?.profileImage || user?.photo
                ? <img src={user.profileImage || user.photo} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
            <div className="sb-user-info">
              <span className="sb-user-name">{user?.name || "User"}</span>
              <span className="sb-user-role">{role}</span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {!collapsed && <span className="nav-group-label">Navigation</span>}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "nav-active" : ""}`
                }
                title={collapsed ? item.label : ""}
                onClick={onMobileClose}
              >
                <Icon size={18} className="nav-item-icon" />
                {!collapsed && (
                  <span className="nav-item-label">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!collapsed ? (
            <>
              <button
                className="sidebar-footer-btn"
                onClick={toggleTheme}
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                className="sidebar-footer-btn sidebar-logout"
                onClick={handleLogoutClick}
                title="Sign out"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="collapsed-menu" ref={dropdownRef}>
              <button
                className="three-dot-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title="Menu"
              >
                <MoreVertical size={18} />
              </button>
              {dropdownOpen && (
                <div className="three-dot-dropdown">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                        title={item.label}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={toggleTheme}>
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </button>
                  <button className="dropdown-item" onClick={handleLogoutClick}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={cancelLogout}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle size={24} className="modal-icon" />
              <h3>Confirm Sign Out</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to sign out?</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={confirmLogout}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;