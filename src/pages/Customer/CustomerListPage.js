// src/pages/Customer/CustomerListPage.js
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";

const PAGE_SIZE = 20;
import {
  fetchAllCustomers,
  deleteCustomer,
  updateCustomer,
  addCustomer,
  clearCustomerError,
  clearAddState,
} from "../../services/features/customers/customerSlice.js";
import { useTheme } from "../../context/ThemeContext";
import "./CustomerListPage.css";

import {
  Search,
  X,
  Phone,
  MapPin,
  Building2,
  User,
  RefreshCw,
  Pencil,
  Trash2,
  Loader,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Plus,
} from "lucide-react";

// ----------------------------------------------------------------------
// Memoized Customer Card
// ----------------------------------------------------------------------
const CustomerCard = React.memo(({ customer, isAdmin, onEdit, onDelete }) => {
  return (
    <div className="customer-card">
      <div className="card-avatar">
        {customer.name?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="card-info">
        <h3 className="customer-name">{customer.name}</h3>
        <div className="detail-row">
          <Phone size={12} />
          <span>{customer.phone}</span>
        </div>
        {customer.address && (
          <div className="detail-row">
            <MapPin size={12} />
            <span>{customer.address}</span>
          </div>
        )}
        {(customer.city || customer.state) && (
          <div className="detail-row">
            <Building2 size={12} />
            <span>
              {[customer.city, customer.state].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
        {customer.type === "shop" && customer.shopName && (
          <div className="detail-row">
            <Building2 size={12} />
            <span>Shop: {customer.shopName}</span>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="card-actions">
          <button
            className="action-btn edit"
            onClick={() => onEdit(customer)}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            className="action-btn delete"
            onClick={() => onDelete(customer)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------
// Add Customer Modal Component
// ----------------------------------------------------------------------
const AddCustomerModal = ({ isOpen, onClose, onSave, loading, error }) => {
  const [customerType, setCustomerType] = useState("customer");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const resetForm = () => {
    setCustomerType("customer");
    setName("");
    setShopName("");
    setAddress("");
    setCity("");
    setState("");
    setPhone("");
    setPhoneError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    // Validate phone
    if (!phone || phone.length !== 10) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }
    setPhoneError("");

    // Validate name
    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }

    // Validate shop name if type is shop
    if (customerType === "shop" && !shopName.trim()) {
      alert("Shop name is required");
      return;
    }

    onSave({
      phone: phone.trim(),
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      type: customerType,
      shopName: shopName.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <UserPlus size={18} /> Add New Customer
          </h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {/* Customer Type Toggle */}
          <div className="row-buttons">
            <button
              className={`type-btn ${customerType === "customer" ? "active" : ""}`}
              onClick={() => setCustomerType("customer")}
            >
              Customer
            </button>
            <button
              className={`type-btn ${customerType === "shop" ? "active" : ""}`}
              onClick={() => setCustomerType("shop")}
            >
              Shop
            </button>
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="add-phone">Phone Number *</label>
            <input
              id="add-phone"
              type="tel"
              maxLength="10"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPhone(value);
                if (value.length === 10) setPhoneError("");
              }}
              className={`modal-input ${phoneError ? "error" : ""}`}
            />
            {phoneError && <div className="error-text">{phoneError}</div>}
          </div>

          {/* Customer Name */}
          <div className="form-group">
            <label htmlFor="add-name">Customer Name *</label>
            <input
              id="add-name"
              type="text"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
            />
          </div>

          {/* Shop Name (only for shops) */}
          {customerType === "shop" && (
            <div className="form-group">
              <label htmlFor="add-shop">Shop Name *</label>
              <input
                id="add-shop"
                type="text"
                placeholder="Enter shop name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="modal-input"
              />
            </div>
          )}

          {/* Delivery Address */}
          <div className="form-group">
            <label htmlFor="add-address">Delivery Address</label>
            <textarea
              id="add-address"
              placeholder="Street, landmark, area..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="modal-input"
            />
          </div>

          {/* City & State */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="add-city">City</label>
              <input
                id="add-city"
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="add-state">State</label>
              <input
                id="add-state"
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="modal-input"
              />
            </div>
          </div>
          {error && (
            <div className="modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button
              onClick={handleClose}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-save"
            >
              {loading ? (
                <>
                  <Loader size={16} className="spin" />
                  Saving...
                </>
              ) : (
                "Save Customer"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Edit Customer Modal Component
// ----------------------------------------------------------------------
const EditCustomerModal = ({
  isOpen,
  customer,
  onClose,
  onSave,
  loading,
  error,
}) => {
  const [customerType, setCustomerType] = useState("customer");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Populate form when customer changes
  useEffect(() => {
    if (customer) {
      setCustomerType(customer.type || "customer");
      setName(customer.name || "");
      setShopName(customer.shopName || "");
      setAddress(customer.address || "");
      setCity(customer.city || "");
      setState(customer.state || "");
    }
  }, [customer]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }
    if (customerType === "shop" && !shopName.trim()) {
      alert("Shop name is required");
      return;
    }

    onSave({
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      type: customerType,
      shopName: shopName.trim(),
    });
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Pencil size={18} /> Edit Customer
          </h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {/* Phone Pill */}
          <div className="phone-pill">
            <Phone size={12} /> {customer.phone}
          </div>

          {/* Error Display */}
          {error && (
            <div className="modal-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Type Toggle */}
          <div className="row-buttons">
            <button
              className={`type-btn ${customerType === "customer" ? "active" : ""}`}
              onClick={() => setCustomerType("customer")}
            >
              Customer
            </button>
            <button
              className={`type-btn ${customerType === "shop" ? "active" : ""}`}
              onClick={() => setCustomerType("shop")}
            >
              Shop
            </button>
          </div>

          {/* Customer Name */}
          <div className="form-group">
            <label htmlFor="edit-name">Customer Name *</label>
            <input
              id="edit-name"
              type="text"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
            />
          </div>

          {/* Shop Name (only for shops) */}
          {customerType === "shop" && (
            <div className="form-group">
              <label htmlFor="edit-shop">Shop Name *</label>
              <input
                id="edit-shop"
                type="text"
                placeholder="Enter shop name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="modal-input"
              />
            </div>
          )}

          {/* Delivery Address */}
          <div className="form-group">
            <label htmlFor="edit-address">Delivery Address</label>
            <textarea
              id="edit-address"
              placeholder="Street, landmark, area..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="modal-input"
            />
          </div>

          {/* City & State */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-city">City</label>
              <input
                id="edit-city"
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-state">State</label>
              <input
                id="edit-state"
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="modal-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="btn-save"
            >
              {loading ? (
                <>
                  <Loader size={16} className="spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const CustomerListPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ✅ FIXED: Get user from multiple possible locations in Redux state
  const user = useSelector((state) => {
    // Try multiple possible paths where user might be stored
    const userFromAuth = state.auth?.user;
    const userFromAdminAuth = state.adminAuth?.user;
    const userFromRoot = state.user;
    const userFromAuthData = state.auth?.data?.user;

    // Return the first found user
    return (
      userFromAuth ||
      userFromAdminAuth ||
      userFromRoot ||
      userFromAuthData ||
      null
    );
  });

  // ✅ FIXED: Check admin status with multiple conditions
  const isAdmin = useMemo(() => {
    if (!user) {
      return false;
    }

    // Get role from multiple possible locations
    const role =
      user.role || user.userRole || user.roleName || user.userType || "";
    const isAdminUser =
      role === "Admin" ||
      role === "admin" ||
      role === "MarketingManager" ||
      role === "marketingmanager" ||
      role === "MARKETINGMANAGER" ||
      user.isAdmin === true ||
      user.is_admin === true ||
      user.userType === "Admin" ||
      user.userType === "MarketingManager";

    return isAdminUser;
  }, [user]);

  // Redux state
  const {
    list: customers = [],
    loading,
    error,
    updateLoading,
    updateSuccess,
    addLoading,
    addSuccess,
  } = useSelector((state) => state.customer);

  // Local state
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Optimized filtering
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.shopName?.toLowerCase().includes(q),
    );
  }, [customers, debouncedSearch]);

  // Slice for lazy rendering
  const visibleCustomers = useMemo(
    () => filteredCustomers.slice(0, visibleCount),
    [filteredCustomers, visibleCount],
  );

  // Reset visible count on search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredCustomers.length),
          );
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredCustomers.length]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  // Handle successful add
  useEffect(() => {
    if (addLoading === false && addSuccess) {
      setAddModalOpen(false);
      setShowSuccessMessage("Customer added successfully!");
      dispatch(clearAddState());
      dispatch(fetchAllCustomers());

      const timer = setTimeout(() => {
        setShowSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [addLoading, addSuccess, dispatch]);

  // Handle successful update
  useEffect(() => {
    if (updateLoading === false && updateSuccess) {
      setEditModalOpen(false);
      setShowSuccessMessage("Customer updated successfully!");
      dispatch(fetchAllCustomers());

      const timer = setTimeout(() => {
        setShowSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateLoading, updateSuccess, dispatch]);

  // Clear error when modals close
  useEffect(() => {
    if (!addModalOpen && !editModalOpen) {
      dispatch(clearCustomerError());
    }
  }, [addModalOpen, editModalOpen, dispatch]);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleRefresh = useCallback(() => {
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  const handleAddCustomer = useCallback(
    (customerData) => {
      dispatch(addCustomer(customerData));
    },
    [dispatch],
  );

  const handleOpenAddModal = useCallback(() => {
    dispatch(clearCustomerError());
    setAddModalOpen(true);
  }, [dispatch]);

  const handleCloseAddModal = useCallback(() => {
    if (!addLoading) {
      setAddModalOpen(false);
      dispatch(clearCustomerError());
    }
  }, [addLoading, dispatch]);

  const handleOpenEditModal = useCallback(
    (customer) => {
      if (!isAdmin) return;
      dispatch(clearCustomerError());
      setSelectedCustomer(customer);
      setEditModalOpen(true);
    },
    [isAdmin, dispatch],
  );

  const handleCloseEditModal = useCallback(() => {
    if (!updateLoading) {
      setEditModalOpen(false);
      setSelectedCustomer(null);
      dispatch(clearCustomerError());
    }
  }, [updateLoading, dispatch]);

  const handleSaveEdit = useCallback(
    (data) => {
      if (!selectedCustomer) return;
      dispatch(
        updateCustomer({
          phone: selectedCustomer.phone,
          data: data,
        }),
      );
    },
    [selectedCustomer, dispatch],
  );

  const handleDelete = useCallback(
    (customer) => {
      if (!isAdmin) return;
      if (
        window.confirm(
          `Delete "${customer.name}"? This action cannot be undone.`,
        )
      ) {
        dispatch(deleteCustomer(customer.phone));
      }
    },
    [isAdmin, dispatch],
  );

  const handleRetry = useCallback(() => {
    dispatch(clearCustomerError());
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  const handleClearSearch = useCallback(() => setSearchText(""), []);

  // Memoized card renderer
  const renderItem = useCallback(
    (customer) => (
      <CustomerCard
        key={customer._id || customer.phone}
        customer={customer}
        isAdmin={isAdmin}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
      />
    ),
    [isAdmin, handleOpenEditModal, handleDelete],
  );

  // ------------------------------------------------------------------
  // Loading / Error states
  // ------------------------------------------------------------------
  if (error && customers.length === 0) {
    return (
      <div className={`customer-page ${isDark ? "dark" : ""}`}>
        <div className="customer-error">
          <RefreshCw size={48} />
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="btn-retry">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------------
  return (
    <div className={`customer-page ${isDark ? "dark" : ""}`}>
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="success-toast">
          <CheckCircle size={18} />
          <span>{showSuccessMessage}</span>
        </div>
      )}

      <div className="customer-header">
        <div className="title-section">
          <h1>Customers</h1>
          {!loading && customers.length > 0 && (
            <span className="customer-badge">{customers.length}</span>
          )}
        </div>
        <div className="header-actions">
          {/* ✅ FIXED: Add Customer Button - Now uses showAddButton with multiple checks */}

          <button
            onClick={handleOpenAddModal}
            className="btn-add-customer"
            title="Add new customer"
          >
            <Plus size={18} />
            <span>Add Customer</span>
          </button>

          <button
            onClick={handleRefresh}
            className="btn-refresh"
            disabled={loading}
            title="Refresh customers"
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            {searchText && (
              <button onClick={handleClearSearch} className="search-clear">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && customers.length === 0 ? (
        <div className="customer-loading">
          <div className="spinner"></div>
          <p>Loading customers…</p>
        </div>
      ) : (
        <>
          {/* Error banner for update/delete errors */}
          {error && customers.length > 0 && (
            <div className="error-banner">
              <span>{error}</span>
              <button
                onClick={() => dispatch(clearCustomerError())}
                className="error-dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="customer-grid">
            {visibleCustomers.map(renderItem)}
          </div>

          {/* Sentinel element for lazy loading */}
          {visibleCount < filteredCustomers.length && (
            <div
              ref={sentinelRef}
              className="customer-loading"
              style={{ padding: "2rem" }}
            >
              <div className="spinner"></div>
              <p>Loading more…</p>
            </div>
          )}

          {filteredCustomers.length === 0 && (
            <div className="customer-empty">
              <div className="empty-illustration">
                <User size={56} strokeWidth={1.5} />
              </div>
              <h3>{searchText ? "No results found" : "No customers yet"}</h3>
              <p>
                {searchText
                  ? `No customer matches "${searchText}"`
                  : 'Click "Add Customer" to create your first customer'}
              </p>
              {searchText && (
                <button
                  onClick={handleClearSearch}
                  className="btn-clear-search"
                >
                  Clear Search
                </button>
              )}
              {!searchText && isAdmin && (
                <button
                  onClick={handleOpenAddModal}
                  className="btn-add-customer"
                >
                  <Plus size={18} /> Add Customer
                </button>
              )}
            </div>
          )}

          {customers.length > 0 && (
            <div className="customer-count">
              {searchText
                ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
                : `${customers.length} customer${customers.length !== 1 ? "s" : ""} total`}
            </div>
          )}
        </>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={addModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleAddCustomer}
        loading={addLoading}
        error={error}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={editModalOpen}
        customer={selectedCustomer}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
        loading={updateLoading}
        error={error}
      />
    </div>
  );
};

export default CustomerListPage;

//------------ 13.08.2026 ----------------------------------
// // src/pages/Customer/CustomerListPage.js
// import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';

// const PAGE_SIZE = 20; // cards per batch
// import {
//   fetchAllCustomers,
//   deleteCustomer,
//   updateCustomer,
//   clearCustomerError,
// } from '../../services/features/customers/customerSlice.js';
// import { useTheme } from '../../context/ThemeContext';
// import './CustomerListPage.css';

// import {
//   Search,
//   X,
//   Phone,
//   MapPin,
//   Building2,
//   User,
//   RefreshCw,
//   Pencil,
//   Trash2,
//   Loader,
//   CheckCircle,
// } from 'lucide-react';

// // ----------------------------------------------------------------------
// // Memoized Customer Card (prevents unnecessary re-renders)
// // ----------------------------------------------------------------------
// const CustomerCard = React.memo(({ customer, isAdmin, onEdit, onDelete }) => {
//   return (
//     <div className="customer-card">
//       <div className="card-avatar">
//         {customer.name?.charAt(0).toUpperCase() || '?'}
//       </div>
//       <div className="card-info">
//         <h3 className="customer-name">{customer.name}</h3>
//         <div className="detail-row">
//           <Phone size={12} />
//           <span>{customer.phone}</span>
//         </div>
//         {customer.address && (
//           <div className="detail-row">
//             <MapPin size={12} />
//             <span>{customer.address}</span>
//           </div>
//         )}
//         {(customer.city || customer.state) && (
//           <div className="detail-row">
//             <Building2 size={12} />
//             <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
//           </div>
//         )}
//       </div>
//       {isAdmin && (
//         <div className="card-actions">
//           <button
//             className="action-btn edit"
//             onClick={() => onEdit(customer)}
//             title="Edit"
//           >
//             <Pencil size={14} />
//           </button>
//           <button
//             className="action-btn delete"
//             onClick={() => onDelete(customer)}
//             title="Delete"
//           >
//             <Trash2 size={14} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// });

// // ----------------------------------------------------------------------
// // Main Component
// // ----------------------------------------------------------------------
// const CustomerListPage = () => {
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const isDark = theme === 'dark';

//   // Auth – adjust to your actual auth slice (e.g., state.adminAuth, state.auth)
//   const user = useSelector((state) => state.auth?.user || null);
//   const isAdmin = user?.role === 'Admin' || user?.role === 'MarketingManager';

//   // Redux state
//   const { list: customers = [], loading, error, updateLoading, updateSuccess } = useSelector(
//     (state) => state.customer
//   );

//   // Local state
//   const [searchText, setSearchText] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [editName, setEditName] = useState('');
//   const [editAddress, setEditAddress] = useState('');
//   const [editCity, setEditCity] = useState('');
//   const [editState, setEditState] = useState('');
//   const [isSaving, setIsSaving] = useState(false);
//   const [showSuccessMessage, setShowSuccessMessage] = useState(false);
//   const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
//   const sentinelRef = useRef(null);

//   // Optimized filtering with useMemo
//   const filteredCustomers = useMemo(() => {
//     if (!customers) return [];
//     if (!debouncedSearch) return customers;
//     const q = debouncedSearch.toLowerCase().trim();
//     return customers.filter(
//       (c) =>
//         c.name?.toLowerCase().includes(q) ||
//         c.phone?.includes(q) ||
//         c.city?.toLowerCase().includes(q) ||
//         c.state?.toLowerCase().includes(q)
//     );
//   }, [customers, debouncedSearch]);

//   // Slice to only the visible portion (lazy rendering)
//   const visibleCustomers = useMemo(
//     () => filteredCustomers.slice(0, visibleCount),
//     [filteredCustomers, visibleCount]
//   );

//   // Reset visible count whenever the filtered list changes (new search)
//   useEffect(() => {
//     setVisibleCount(PAGE_SIZE);
//   }, [debouncedSearch]);

//   // IntersectionObserver — load next batch when sentinel enters viewport
//   useEffect(() => {
//     const el = sentinelRef.current;
//     if (!el) return;
//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting) {
//           setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredCustomers.length));
//         }
//       },
//       { rootMargin: '200px' }
//     );
//     observer.observe(el);
//     return () => observer.disconnect();
//   }, [filteredCustomers.length]);

//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
//     return () => clearTimeout(timer);
//   }, [searchText]);

//   // Initial fetch
//   useEffect(() => {
//     dispatch(fetchAllCustomers());
//   }, [dispatch]);

//   // Handle successful update - close modal and show success message
//   useEffect(() => {
//     if (isSaving && !updateLoading && updateSuccess && !error) {
//       setEditModalOpen(false);
//       setIsSaving(false);
//       setShowSuccessMessage(true);

//       // Auto-hide success message after 3 seconds
//       const timer = setTimeout(() => {
//         setShowSuccessMessage(false);
//       }, 3000);

//       return () => clearTimeout(timer);
//     }
//   }, [isSaving, updateLoading, updateSuccess, error]);

//   // Clear success flags when modal is closed manually
//   useEffect(() => {
//     if (!editModalOpen && !isSaving) {
//       dispatch(clearCustomerError());
//     }
//   }, [editModalOpen, isSaving, dispatch]);

//   // ------------------------------------------------------------------
//   // Handlers (useCallback for stability)
//   // ------------------------------------------------------------------
//   const handleRefresh = useCallback(() => {
//     dispatch(fetchAllCustomers());
//   }, [dispatch]);

//   const openEditModal = useCallback((customer) => {
//     if (!isAdmin) return;
//     // Clear any previous state
//     dispatch(clearCustomerError());
//     setIsSaving(false);

//     setSelectedCustomer(customer);
//     setEditName(customer.name || '');
//     setEditAddress(customer.address || '');
//     setEditCity(customer.city || '');
//     setEditState(customer.state || '');
//     setEditModalOpen(true);
//   }, [isAdmin, dispatch]);

//   const handleSaveEdit = useCallback(() => {
//     if (!isAdmin || !editName.trim() || !selectedCustomer) return;

//     setIsSaving(true);
//     dispatch(
//       updateCustomer({
//         phone: selectedCustomer.phone,
//         data: {
//           name: editName.trim(),
//           address: editAddress.trim(),
//           city: editCity.trim(),
//           state: editState.trim(),
//         },
//       })
//     );
//   }, [isAdmin, editName, editAddress, editCity, editState, selectedCustomer, dispatch]);

//   const handleDelete = useCallback((customer) => {
//     if (!isAdmin) return;
//     if (window.confirm(`Delete "${customer.name}"? This action cannot be undone.`)) {
//       dispatch(deleteCustomer(customer.phone));
//     }
//   }, [isAdmin, dispatch]);

//   const handleRetry = useCallback(() => {
//     dispatch(clearCustomerError());
//     dispatch(fetchAllCustomers());
//   }, [dispatch]);

//   const handleClearSearch = useCallback(() => setSearchText(''), []);

//   const handleCloseModal = useCallback(() => {
//     // Only allow closing if not currently saving
//     if (!updateLoading) {
//       setEditModalOpen(false);
//       setSelectedCustomer(null);
//       setIsSaving(false);
//     }
//   }, [updateLoading]);

//   // Memoized card renderer
//   const renderItem = useCallback((customer) => (
//     <CustomerCard
//       key={customer._id || customer.phone}
//       customer={customer}
//       isAdmin={isAdmin}
//       onEdit={openEditModal}
//       onDelete={handleDelete}
//     />
//   ), [isAdmin, openEditModal, handleDelete]);

//   // ------------------------------------------------------------------
//   // Loading / Error states
//   // ------------------------------------------------------------------
//   if (error && customers.length === 0) {
//     return (
//       <div className={`customer-page ${isDark ? 'dark' : ''}`}>
//         <div className="customer-error">
//           <RefreshCw size={48} />
//           <h3>Connection Error</h3>
//           <p>{error}</p>
//           <button onClick={handleRetry} className="btn-retry">
//             <RefreshCw size={16} /> Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ------------------------------------------------------------------
//   // Main render
//   // ------------------------------------------------------------------
//   return (
//     <div className={`customer-page ${isDark ? 'dark' : ''}`}>
//       {/* Success Message Toast */}
//       {showSuccessMessage && (
//         <div className="success-toast">
//           <CheckCircle size={18} />
//           <span>Customer updated successfully!</span>
//         </div>
//       )}

//       <div className="customer-header">
//         <div className="title-section">
//           <h1>Customers</h1>
//           {!loading && customers.length > 0 && (
//             <span className="customer-badge">{customers.length}</span>
//           )}
//         </div>
//         <div className="header-actions">
//           <button
//             onClick={handleRefresh}
//             className="btn-refresh"
//             disabled={loading}
//             title="Refresh customers"
//           >
//             <RefreshCw size={18} className={loading ? 'spin' : ''} />
//           </button>
//           <div className="search-wrapper">
//             <Search size={18} />
//             <input
//               type="text"
//               placeholder="Search by name, phone or city…"
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               className="search-input"
//             />
//             {searchText && (
//               <button onClick={handleClearSearch} className="search-clear">
//                 <X size={16} />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {loading && customers.length === 0 ? (
//         <div className="customer-loading">
//           <div className="spinner"></div>
//           <p>Loading customers…</p>
//         </div>
//       ) : (
//         <>
//           {/* Error banner for update/delete errors when list exists */}
//           {error && customers.length > 0 && (
//             <div className="error-banner">
//               <span>{error}</span>
//               <button
//                 onClick={() => dispatch(clearCustomerError())}
//                 className="error-dismiss"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           )}

//           <div className="customer-grid">
//             {visibleCustomers.map(renderItem)}
//           </div>

//           {/* Sentinel element — triggers loading the next batch */}
//           {visibleCount < filteredCustomers.length && (
//             <div ref={sentinelRef} className="customer-loading" style={{ padding: '2rem' }}>
//               <div className="spinner"></div>
//               <p>Loading more…</p>
//             </div>
//           )}

//           {filteredCustomers.length === 0 && (
//             <div className="customer-empty">
//               <div className="empty-illustration">
//                 <User size={56} strokeWidth={1.5} />
//               </div>
//               <h3>{searchText ? 'No results found' : 'No customers yet'}</h3>
//               <p>
//                 {searchText
//                   ? `No customer matches "${searchText}"`
//                   : 'Customers added from orders will appear here'}
//               </p>
//               {searchText && (
//                 <button onClick={handleClearSearch} className="btn-clear-search">
//                   Clear Search
//                 </button>
//               )}
//             </div>
//           )}

//           {customers.length > 0 && (
//             <div className="customer-count">
//               {searchText
//                 ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
//                 : `${customers.length} customer${customers.length !== 1 ? 's' : ''} total`}
//             </div>
//           )}
//         </>
//       )}

//       {/* Edit Modal */}
//       {editModalOpen && selectedCustomer && (
//         <div className="modal-overlay" onClick={handleCloseModal}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h3>
//                 <Pencil size={18} /> Edit Customer
//               </h3>
//               <button
//                 className="modal-close"
//                 onClick={handleCloseModal}
//                 disabled={updateLoading}
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <div className="modal-body">
//               <div className="phone-pill">
//                 <Phone size={12} /> {selectedCustomer.phone}
//               </div>

//               {error && (
//                 <div className="modal-error">
//                   <span>{error}</span>
//                 </div>
//               )}

//               <div className="form-group">
//                 <label htmlFor="edit-name">Customer Name *</label>
//                 <input
//                   id="edit-name"
//                   type="text"
//                   placeholder="Enter customer name"
//                   value={editName}
//                   onChange={(e) => setEditName(e.target.value)}
//                   className="modal-input"
//                   autoFocus
//                 />
//               </div>

//               <div className="form-group">
//                 <label htmlFor="edit-address">Address</label>
//                 <textarea
//                   id="edit-address"
//                   placeholder="Enter address"
//                   value={editAddress}
//                   onChange={(e) => setEditAddress(e.target.value)}
//                   rows={2}
//                   className="modal-input"
//                 />
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label htmlFor="edit-city">City</label>
//                   <input
//                     id="edit-city"
//                     type="text"
//                     placeholder="City"
//                     value={editCity}
//                     onChange={(e) => setEditCity(e.target.value)}
//                     className="modal-input"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label htmlFor="edit-state">State</label>
//                   <input
//                     id="edit-state"
//                     type="text"
//                     placeholder="State"
//                     value={editState}
//                     onChange={(e) => setEditState(e.target.value)}
//                     className="modal-input"
//                   />
//                 </div>
//               </div>

//               <div className="modal-actions">
//                 <button
//                   onClick={handleCloseModal}
//                   className="btn-cancel"
//                   disabled={updateLoading}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveEdit}
//                   disabled={updateLoading || !editName.trim()}
//                   className="btn-save"
//                 >
//                   {updateLoading ? (
//                     <>
//                       <Loader size={16} className="spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     'Save Changes'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CustomerListPage;
