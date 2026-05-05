// // src/pages/Customer/CustomerListPage.js
// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
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

//   // ------------------------------------------------------------------
//   // Effects
//   // ------------------------------------------------------------------
//   // Debounce search input
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
//             {filteredCustomers.map(renderItem)}
//           </div>

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

//------------claude new code --------------

// src/pages/Customer/CustomerListPage.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const PAGE_SIZE = 20; // cards per batch
import {
  fetchAllCustomers,
  deleteCustomer,
  updateCustomer,
  clearCustomerError,
} from '../../services/features/customers/customerSlice.js';
import { useTheme } from '../../context/ThemeContext';
import './CustomerListPage.css';

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
} from 'lucide-react';

// ----------------------------------------------------------------------
// Memoized Customer Card (prevents unnecessary re-renders)
// ----------------------------------------------------------------------
const CustomerCard = React.memo(({ customer, isAdmin, onEdit, onDelete }) => {
  return (
    <div className="customer-card">
      <div className="card-avatar">
        {customer.name?.charAt(0).toUpperCase() || '?'}
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
            <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
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
// Main Component
// ----------------------------------------------------------------------
const CustomerListPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Auth – adjust to your actual auth slice (e.g., state.adminAuth, state.auth)
  const user = useSelector((state) => state.auth?.user || null);
  const isAdmin = user?.role === 'Admin' || user?.role === 'MarketingManager';

  // Redux state
  const { list: customers = [], loading, error, updateLoading, updateSuccess } = useSelector(
    (state) => state.customer
  );

  // Local state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // Optimized filtering with useMemo
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!debouncedSearch) return customers;
    const q = debouncedSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
    );
  }, [customers, debouncedSearch]);

  // Slice to only the visible portion (lazy rendering)
  const visibleCustomers = useMemo(
    () => filteredCustomers.slice(0, visibleCount),
    [filteredCustomers, visibleCount]
  );

  // Reset visible count whenever the filtered list changes (new search)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch]);

  // IntersectionObserver — load next batch when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredCustomers.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredCustomers.length]);


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  // Handle successful update - close modal and show success message
  useEffect(() => {
    if (isSaving && !updateLoading && updateSuccess && !error) {
      setEditModalOpen(false);
      setIsSaving(false);
      setShowSuccessMessage(true);
      
      // Auto-hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSaving, updateLoading, updateSuccess, error]);

  // Clear success flags when modal is closed manually
  useEffect(() => {
    if (!editModalOpen && !isSaving) {
      dispatch(clearCustomerError());
    }
  }, [editModalOpen, isSaving, dispatch]);

  // ------------------------------------------------------------------
  // Handlers (useCallback for stability)
  // ------------------------------------------------------------------
  const handleRefresh = useCallback(() => {
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  const openEditModal = useCallback((customer) => {
    if (!isAdmin) return;
    // Clear any previous state
    dispatch(clearCustomerError());
    setIsSaving(false);
    
    setSelectedCustomer(customer);
    setEditName(customer.name || '');
    setEditAddress(customer.address || '');
    setEditCity(customer.city || '');
    setEditState(customer.state || '');
    setEditModalOpen(true);
  }, [isAdmin, dispatch]);

  const handleSaveEdit = useCallback(() => {
    if (!isAdmin || !editName.trim() || !selectedCustomer) return;
    
    setIsSaving(true);
    dispatch(
      updateCustomer({
        phone: selectedCustomer.phone,
        data: {
          name: editName.trim(),
          address: editAddress.trim(),
          city: editCity.trim(),
          state: editState.trim(),
        },
      })
    );
  }, [isAdmin, editName, editAddress, editCity, editState, selectedCustomer, dispatch]);

  const handleDelete = useCallback((customer) => {
    if (!isAdmin) return;
    if (window.confirm(`Delete "${customer.name}"? This action cannot be undone.`)) {
      dispatch(deleteCustomer(customer.phone));
    }
  }, [isAdmin, dispatch]);

  const handleRetry = useCallback(() => {
    dispatch(clearCustomerError());
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  const handleClearSearch = useCallback(() => setSearchText(''), []);
  
  const handleCloseModal = useCallback(() => {
    // Only allow closing if not currently saving
    if (!updateLoading) {
      setEditModalOpen(false);
      setSelectedCustomer(null);
      setIsSaving(false);
    }
  }, [updateLoading]);

  // Memoized card renderer
  const renderItem = useCallback((customer) => (
    <CustomerCard
      key={customer._id || customer.phone}
      customer={customer}
      isAdmin={isAdmin}
      onEdit={openEditModal}
      onDelete={handleDelete}
    />
  ), [isAdmin, openEditModal, handleDelete]);

  // ------------------------------------------------------------------
  // Loading / Error states
  // ------------------------------------------------------------------
  if (error && customers.length === 0) {
    return (
      <div className={`customer-page ${isDark ? 'dark' : ''}`}>
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
    <div className={`customer-page ${isDark ? 'dark' : ''}`}>
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="success-toast">
          <CheckCircle size={18} />
          <span>Customer updated successfully!</span>
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
          <button 
            onClick={handleRefresh} 
            className="btn-refresh"
            disabled={loading}
            title="Refresh customers"
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, phone or city…"
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
          {/* Error banner for update/delete errors when list exists */}
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

          {/* Sentinel element — triggers loading the next batch */}
          {visibleCount < filteredCustomers.length && (
            <div ref={sentinelRef} className="customer-loading" style={{ padding: '2rem' }}>
              <div className="spinner"></div>
              <p>Loading more…</p>
            </div>
          )}

          {filteredCustomers.length === 0 && (
            <div className="customer-empty">
              <div className="empty-illustration">
                <User size={56} strokeWidth={1.5} />
              </div>
              <h3>{searchText ? 'No results found' : 'No customers yet'}</h3>
              <p>
                {searchText
                  ? `No customer matches "${searchText}"`
                  : 'Customers added from orders will appear here'}
              </p>
              {searchText && (
                <button onClick={handleClearSearch} className="btn-clear-search">
                  Clear Search
                </button>
              )}
            </div>
          )}

          {customers.length > 0 && (
            <div className="customer-count">
              {searchText
                ? `Showing ${filteredCustomers.length} of ${customers.length} customers`
                : `${customers.length} customer${customers.length !== 1 ? 's' : ''} total`}
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedCustomer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Pencil size={18} /> Edit Customer
              </h3>
              <button 
                className="modal-close" 
                onClick={handleCloseModal}
                disabled={updateLoading}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="phone-pill">
                <Phone size={12} /> {selectedCustomer.phone}
              </div>
              
              {error && (
                <div className="modal-error">
                  <span>{error}</span>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="edit-name">Customer Name *</label>
                <input
                  id="edit-name"
                  type="text"
                  placeholder="Enter customer name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-address">Address</label>
                <textarea
                  id="edit-address"
                  placeholder="Enter address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="modal-input"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-city">City</label>
                  <input
                    id="edit-city"
                    type="text"
                    placeholder="City"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-state">State</label>
                  <input
                    id="edit-state"
                    type="text"
                    placeholder="State"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  onClick={handleCloseModal}
                  className="btn-cancel"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateLoading || !editName.trim()}
                  className="btn-save"
                >
                  {updateLoading ? (
                    <>
                      <Loader size={16} className="spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;