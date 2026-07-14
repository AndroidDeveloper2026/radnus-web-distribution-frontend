// src/pages/Order/OrderSuccessPage.js
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  lookupCustomer,
  addCustomer,
  updateCustomer,
  resetCustomer,
  clearAddState,
  clearUpdateState,
} from "../../services/features/customers/customerSlice";
import { reduceStock } from "../../services/features/products/productSlice";
import API from "../../services/API/api";
import { useTheme } from "../../context/ThemeContext";
import "./OrderSuccessPage.css";

import {
  FileText,
  ChevronDown,
  X,
  User,
  Truck,
  Calendar,
  Phone,
  UserPlus,
  CheckCircle,
  MapPin,
  Building2,
  AlertTriangle,
  WifiOff,
  CreditCard,
  IndianRupee,
  Check,
} from "lucide-react";

const SALESPERSONS = [
  { id: 1, name: "SHANTHI" },
  { id: 2, name: "HARIVARTHINI" },
  { id: 3, name: "UMA MAM" },
  { id: 4, name: "SHARMILA" },
  { id: 5, name: "MOHANA AMBIGAI" },
  { id: 6, name: "KALAIVANI" },
  { id: 7, name: "SUNDER SIR" },
  { id: 8, name: "PAVITHRA" },
  { id: 9, name: "SARANYA" },
  { id: 10, name: "VIJAYA LAKSHMI" },
  { id: 11, name: "VENNILA" },
  { id: 12, name: "ASHWINI" },
  { id: 13, name: "PRIYADHARSHNI" },
];

const PAYMENT_MODES = [
  { id: 1, label: "Cash" },
  { id: 2, label: "GPay" },
  { id: 3, label: "Credit Card" },
  { id: 4, label: "Debit Card" },
  { id: 5, label: "Office Use" },
  { id: 6, label: "Loan Amount" },
];

const ORDER_TYPES = [
  { id: 1, label: "OEM" },
  { id: 2, label: "TOOLS" },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    cartItems,
    grandTotal,
    paymentMode: initialPaymentMode,
    date,
  } = location.state || {};

  // State
  const [referenceNo, setReferenceNo] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editShopName, setEditShopName] = useState("");
  const [editCustomerType, setEditCustomerType] = useState("customer");
  const [sameAsBuyer, setSameAsBuyer] = useState(true);
  const [shipToName, setShipToName] = useState("");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [courierCharge, setCourierCharge] = useState("0");
  const [selectedSP, setSelectedSP] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(
    initialPaymentMode ? { label: initialPaymentMode } : null,
  );
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
  const [customerType, setCustomerType] = useState("customer");
  const [shopName, setShopName] = useState("");
  
  // ✅ NEW: Order Type state
  const [orderType, setOrderType] = useState("");
  const [orderTypeDropdownOpen, setOrderTypeDropdownOpen] = useState(false);

  // Refs for click outside
  const paymentDropdownRef = useRef();
  const salespersonDropdownRef = useRef();
  const orderTypeDropdownRef = useRef(); // ✅ NEW

  // Redux – using the updated state names
  const {
    lookupData: customer,
    lookupState,
    addLoading,
    addSuccess,
    updateLoading,
    updateSuccess,
    error,
  } = useSelector((s) => s.customer);
  const user = useSelector((state) => state.auth.user);

  // Effects
  useEffect(() => {
    if (!cartItems) navigate("/order-cart");
  }, [cartItems, navigate]);

  useEffect(() => {
    return () => dispatch(resetCustomer());
  }, [dispatch]);

  useEffect(() => {
    if (buyerPhone.length === 10) {
      setPhoneError(false);
      dispatch(lookupCustomer(buyerPhone));
    } else {
      dispatch(resetCustomer());
    }
  }, [buyerPhone, dispatch]);

  useEffect(() => {
    if (addSuccess) {
      setAddModalVisible(false);
      setNewName("");
      setNewAddress("");
      setNewCity("");
      setNewState("");
      dispatch(clearAddState());
      dispatch(lookupCustomer(buyerPhone));
    }
    if (error && addLoading === false) {
      alert("Error: " + error);
    }
  }, [addSuccess, error, addLoading, dispatch, buyerPhone]);

  useEffect(() => {
    if (updateSuccess) {
      setEditModalVisible(false);
      dispatch(lookupCustomer(buyerPhone));
      dispatch(clearUpdateState());
      alert("Customer details updated successfully.");
    }
    if (error && updateLoading === false && updateSuccess === false) {
      alert("Error: " + error);
    }
  }, [updateSuccess, error, updateLoading, dispatch, buyerPhone]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target)
      ) {
        setPaymentDropdownOpen(false);
      }
      if (
        salespersonDropdownRef.current &&
        !salespersonDropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
      // ✅ NEW: Close order type dropdown
      if (
        orderTypeDropdownRef.current &&
        !orderTypeDropdownRef.current.contains(event.target)
      ) {
        setOrderTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleViewInvoice = () => {
    if (!referenceNo.trim()) {
      alert("Please enter a Reference Number before proceeding.");
      return;
    }

    if (buyerPhone.length < 10) {
      setPhoneError(true);
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    if (lookupState === "loading") {
      alert("Verifying customer details...");
      return;
    }
    if (lookupState === "notfound") {
      setPhoneError(true);
      if (
        window.confirm(
          "Customer not found. Would you like to add this customer?",
        )
      ) {
        setAddModalVisible(true);
      }
      return;
    }
    if (lookupState === "error") {
      alert("Could not reach server. Check your connection.");
      return;
    }
    if (lookupState === "found" && customer) {
      setPhoneError(false);
      setConfirmVisible(true);
    }
  };

  const handleSaveNewCustomer = () => {
    if (!newName.trim()) {
      alert("Customer name is required.");
      return;
    }
    if (customerType === "shop" && !shopName.trim()) {
      alert("Shop name is required.");
      return;
    }
    dispatch(
      addCustomer({
        phone: buyerPhone,
        name: newName.trim(),
        address: newAddress.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        type: customerType,
        shopName: shopName.trim(),
      }),
    );
  };

  const goToInvoice = async () => {
    setIsConfirming(true);
    setConfirmVisible(false);

    try {
      // Preserve the original order from cartItems
      const invoiceItems = cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      }));

      const subtotal = grandTotal;
      const discountAmount = parseFloat(discount) || 0;
      const afterDiscount = Math.max(subtotal - discountAmount, 0);
      const courier = parseFloat(courierCharge) || 0;
      const totalWithCourier = afterDiscount + courier;

      const finalShipToName = sameAsBuyer
        ? customer?.type === "shop"
          ? customer?.name
          : customer?.name
        : shipToName;
      const finalShipToPhone = sameAsBuyer ? buyerPhone : shipToPhone;
      const finalShipToAddress = sameAsBuyer
        ? customer?.address || ""
        : shipToAddress;
      const finalShipToCity = sameAsBuyer ? customer?.city || "" : shipToCity;
      const finalShipToState = sameAsBuyer
        ? customer?.state || ""
        : shipToState;

      const payload = {
        billerName: user?.name || "Unknown",
        items: invoiceItems,
        totalAmount: totalWithCourier,
        paymentMode: selectedPaymentMode?.label || initialPaymentMode,
        status: "completed",
        customerPhone: buyerPhone,
        customerName: customer?.name,
        customerType: customer?.type,
        shopName: customer?.shopName,
        customerAddress: customer?.address,
        customerCity: customer?.city,
        customerState: customer?.state,
        sameAsBuyer,
        shippingAddress: {
          name: finalShipToName,
          phone: finalShipToPhone,
          address: finalShipToAddress,
          city: finalShipToCity,
          state: finalShipToState,
        },
        subtotal,
        discount: discountAmount,
        courierCharge: courier,
        salesperson: selectedSP?.name || "",
        referenceNo: referenceNo || "",
        invoiceDate: date || new Date().toISOString(),
        orderType: orderType || "", // ✅ ADDED
      };

      const invoiceRes = await API.post("/api/invoices", payload);
      const invoiceNumber = invoiceRes.data.invoice.invoiceNumber;

      if (reduceStock && typeof reduceStock === "function") {
        await dispatch(reduceStock(cartItems)).unwrap();
      }

      // Navigate to invoice with all required data
      navigate("/invoice", {
        state: {
          invoiceNumber,
          items: cartItems,
          total: grandTotal,
          paymentMode: selectedPaymentMode?.label || initialPaymentMode,
          date: date,
          buyerName: customer?.name || "—",
          buyerPhone,
          buyerAddress: customer?.address || "",
          buyerCity: customer?.city || "",
          buyerState: customer?.state || "",
          courierCharge: courier,
          discount: discountAmount,
          salesperson: selectedSP?.name || "",
          referenceNo,
          shipToName: finalShipToName,
          shipToPhone: finalShipToPhone,
          shipToAddress: finalShipToAddress,
          shipToCity: finalShipToCity,
          shipToState: finalShipToState,
          customerType: customer?.type,
          shopName: customer?.shopName,
          orderType: orderType || "", // ✅ ADDED
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to confirm order. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const discountAmount = parseFloat(discount) || 0;
  const subtotal = grandTotal || 0;
  const afterDiscount = Math.max(subtotal - discountAmount, 0);
  const courier = parseFloat(courierCharge) || 0;
  const grandTotalWithCourier = afterDiscount + courier;

  if (!cartItems)
    return <div className="loading-state">No cart items found</div>;

  return (
    <div className={`order-success-page ${isDark ? "dark" : ""}`}>
      <div className="order-success-container">
        <div className="success-header">📄 Order Confirm</div>

        <div className="form-card">
          <h3>Delivery & Invoice Details</h3>

          {/* Reference No */}
          <div className="field-group">
            <label>
              <FileText size={14} /> Reference No. *
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. PO-12345 (Required)"
              className="field-input"
              required
            />
            {!referenceNo.trim() && (
              <div className="error-text">Reference Number is required</div>
            )}
          </div>

          {/* ✅ NEW: Order Type Dropdown */}
          <div className="field-group" ref={orderTypeDropdownRef}>
            <label>
              <FileText size={14} /> Order Type
            </label>
            <div
              className="custom-select"
              onClick={() => setOrderTypeDropdownOpen(!orderTypeDropdownOpen)}
            >
              <span>{orderType ? orderType : "Select order type…"}</span>
              <ChevronDown
                size={16}
                className={`dropdown-arrow ${orderTypeDropdownOpen ? "open" : ""}`}
              />
            </div>
            {orderTypeDropdownOpen && (
              <div className="dropdown-list">
                {ORDER_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`dropdown-item ${orderType === type.label ? "active" : ""}`}
                    onClick={() => {
                      setOrderType(type.label);
                      setOrderTypeDropdownOpen(false);
                    }}
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Mode */}
          <div className="field-group" ref={paymentDropdownRef}>
            <label>
              <CreditCard size={14} /> Payment Mode
            </label>
            <div
              className="custom-select"
              onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
            >
              <span>
                {selectedPaymentMode
                  ? selectedPaymentMode.label
                  : "Select payment mode…"}
              </span>
              <ChevronDown
                size={16}
                className={`dropdown-arrow ${paymentDropdownOpen ? "open" : ""}`}
              />
            </div>
            {paymentDropdownOpen && (
              <div className="dropdown-list">
                {PAYMENT_MODES.map((mode) => (
                  <div
                    key={mode.id}
                    className={`dropdown-item ${selectedPaymentMode?.id === mode.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedPaymentMode(mode);
                      setPaymentDropdownOpen(false);
                    }}
                  >
                    {mode.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtotal */}
          <div className="field-group">
            <label>
              <IndianRupee size={14} /> Subtotal
            </label>
            <div className="readonly-field">
              ₹{subtotal.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Discount */}
          <div className="field-group">
            <label>
              <IndianRupee size={14} /> Discount
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="field-input"
              placeholder="0"
            />
          </div>

          {/* Invoice Date */}
          <div className="field-group">
            <label>
              <Calendar size={14} /> Invoice Date
            </label>
            <div className="readonly-field">
              {formatDate(date || new Date().toISOString())}
            </div>
          </div>

          {/* Salesperson */}
          <div className="field-group" ref={salespersonDropdownRef}>
            <label>
              <User size={14} /> Salesperson
            </label>
            <div
              className="custom-select"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>
                {selectedSP ? selectedSP.name : "Select salesperson…"}
              </span>
              <ChevronDown
                size={16}
                className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`}
              />
            </div>
            {dropdownOpen && (
              <div className="dropdown-list">
                {SALESPERSONS.map((sp) => (
                  <div
                    key={sp.id}
                    className={`dropdown-item ${selectedSP?.id === sp.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSP(sp);
                      setDropdownOpen(false);
                    }}
                  >
                    {sp.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phone & Customer Lookup */}
          <div className="field-group">
            <label>
              <Phone size={14} /> Phone Number *
            </label>
            <input
              type="tel"
              maxLength="10"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className={`field-input ${phoneError ? "error" : ""}`}
              placeholder="Enter 10-digit mobile number"
            />
            {phoneError && buyerPhone.length < 10 && (
              <div className="error-text">
                Enter a valid 10-digit phone number
              </div>
            )}
            {lookupState === "loading" && (
              <div className="status-row">Checking customer database...</div>
            )}
            {lookupState === "found" && customer && (
              <div className="found-card">
                <div className="found-header">
                  <CheckCircle size={15} /> Customer Found
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditName(customer.name || "");
                      setEditAddress(customer.address || "");
                      setEditCity(customer.city || "");
                      setEditState(customer.state || "");
                      setEditShopName(customer.shopName || "");
                      setEditCustomerType(customer.type || "customer");
                      setEditModalVisible(true);
                    }}
                  >
                    Edit
                  </button>
                </div>
                <div className="customer-name">
                  {customer.type === "shop"
                    ? `${customer.name} (${customer.shopName})`
                    : customer.name}
                </div>
                {customer.address && (
                  <div className="customer-sub address-line">
                    <MapPin size={14} />
                    <span>{customer.address}</span>
                  </div>
                )}
                {(customer.city || customer.state) && (
                  <div className="customer-sub">
                    <Building2 size={14} />{" "}
                    {[customer.city, customer.state].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            )}
            {lookupState === "notfound" && (
              <div className="notfound-box">
                <AlertTriangle size={13} /> No customer found.
                <button
                  className="add-btn"
                  onClick={() => setAddModalVisible(true)}
                >
                  + Add Customer
                </button>
              </div>
            )}
            {lookupState === "error" && (
              <div className="notfound-box">
                <WifiOff size={13} /> Could not reach server.
                <button
                  className="add-btn"
                  onClick={() => dispatch(lookupCustomer(buyerPhone))}
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="field-group">
            <label>
              <Truck size={14} /> Shipping Address
            </label>
            <div className="switch-row">
              <span>Same as buyer address</span>
              <button
                className={`switch ${sameAsBuyer ? "active" : ""}`}
                onClick={() => setSameAsBuyer(!sameAsBuyer)}
              >
                {sameAsBuyer ? "ON" : "OFF"}
              </button>
            </div>
            {!sameAsBuyer && (
              <>
                <input
                  type="text"
                  placeholder="Ship to Name"
                  value={shipToName}
                  onChange={(e) => setShipToName(e.target.value)}
                  className="field-input"
                />
                <input
                  type="tel"
                  placeholder="Ship to Phone"
                  value={shipToPhone}
                  onChange={(e) => setShipToPhone(e.target.value)}
                  className="field-input"
                />
                <textarea
                  placeholder="Ship to Address"
                  value={shipToAddress}
                  onChange={(e) => setShipToAddress(e.target.value)}
                  rows={2}
                  className="field-input"
                />
                <div className="row-inputs">
                  <input
                    type="text"
                    placeholder="City"
                    value={shipToCity}
                    onChange={(e) => setShipToCity(e.target.value)}
                    className="field-input"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={shipToState}
                    onChange={(e) => setShipToState(e.target.value)}
                    className="field-input"
                  />
                </div>
              </>
            )}
          </div>

          {/* Courier Charge */}
          <div className="field-group">
            <label>
              <Truck size={14} /> Courier Charge (₹)
            </label>
            <input
              type="text"
              value={courierCharge}
              onChange={(e) => setCourierCharge(e.target.value)}
              className="field-input"
              placeholder="0"
            />
          </div>

          {/* Total Preview */}
          <div className="total-preview">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-row">
                <span>Discount</span>
                <span className="discount">
                  - ₹{discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="summary-row">
              <span>Courier Charge</span>
              <span>₹{courier.toLocaleString("en-IN")}</span>
            </div>
            <hr />
            <div className="summary-row total">
              <span>Grand Total</span>
              <span>₹{grandTotalWithCourier.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <button
          className="primary-btn"
          onClick={handleViewInvoice}
          disabled={isConfirming || !referenceNo.trim()}
          style={{ opacity: !referenceNo.trim() ? "0.5" : "1" }}
        >
          <FileText size={18} /> View Invoice
        </button>
        {!referenceNo.trim() && (
          <div
            className="error-text"
            style={{ textAlign: "center", marginTop: "0.5rem" }}
          >
            * Reference Number is required to view invoice
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {addModalVisible && (
        <div
          className="modal-overlay"
          onClick={() => setAddModalVisible(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <UserPlus size={18} /> Add New Customer
              <button
                className="close-btn"
                onClick={() => setAddModalVisible(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="phone-pill">
                <Phone size={13} /> {buyerPhone}
              </div>
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
              <input
                type="text"
                placeholder="Customer Name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="modal-input"
              />
              {customerType === "shop" && (
                <input
                  type="text"
                  placeholder="Shop Name *"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="modal-input"
                />
              )}
              <label className="field-label">Delivery Address</label>
              <textarea
                placeholder="Street, landmark, area…"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                rows={3}
                className="modal-input address-textarea"
              />
              <div className="row-inputs">
                <input
                  type="text"
                  placeholder="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="modal-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  className="modal-input"
                />
              </div>
              <button
                className="save-btn"
                onClick={handleSaveNewCustomer}
                disabled={addLoading}
              >
                {addLoading ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editModalVisible && (
        <div
          className="modal-overlay"
          onClick={() => setEditModalVisible(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <UserPlus size={18} /> Edit Customer
              <button
                className="close-btn"
                onClick={() => setEditModalVisible(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="phone-pill">
                <Phone size={13} /> {buyerPhone}
              </div>
              <div className="row-buttons">
                <button
                  className={`type-btn ${editCustomerType === "customer" ? "active" : ""}`}
                  onClick={() => setEditCustomerType("customer")}
                >
                  Customer
                </button>
                <button
                  className={`type-btn ${editCustomerType === "shop" ? "active" : ""}`}
                  onClick={() => setEditCustomerType("shop")}
                >
                  Shop
                </button>
              </div>
              <input
                type="text"
                placeholder="Customer Name *"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="modal-input"
              />
              {editCustomerType === "shop" && (
                <input
                  type="text"
                  placeholder="Shop Name *"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="modal-input"
                />
              )}
              <label className="field-label">Delivery Address</label>
              <textarea
                placeholder="Street, landmark, area…"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                rows={3}
                className="modal-input address-textarea"
              />
              <div className="row-inputs">
                <input
                  type="text"
                  placeholder="City"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="modal-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="modal-input"
                />
              </div>
              <button
                className="save-btn"
                onClick={() => {
                  if (!editName.trim()) return alert("Customer name required");
                  dispatch(
                    updateCustomer({
                      phone: buyerPhone,
                      data: {
                        name: editName.trim(),
                        address: editAddress.trim(),
                        city: editCity.trim(),
                        state: editState.trim(),
                        type: editCustomerType,
                        shopName: editShopName.trim(),
                      },
                    }),
                  );
                }}
                disabled={updateLoading}
              >
                {updateLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmVisible && (
        <div className="modal-overlay" onClick={() => setConfirmVisible(false)}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <Check size={20} /> Ready to Generate Invoice?
              </h3>
              <button
                className="close-btn"
                onClick={() => setConfirmVisible(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Please confirm the order details before proceeding.</p>
              <div className="confirm-info">
                <div>
                  <strong>Reference No:</strong> <span>{referenceNo}</span>
                </div>
                <div>
                  <strong>Order Type:</strong>{" "}
                  <span>{orderType || "—"}</span>
                </div>
                <div>
                  <strong>Buyer:</strong>
                  <span>
                    {customer?.type === "shop"
                      ? `${customer?.name} (${customer?.shopName})`
                      : customer?.name || "—"}
                  </span>
                </div>
                <div>
                  <strong>Phone:</strong> <span>{buyerPhone}</span>
                </div>
                <div>
                  <strong>Address:</strong>{" "}
                  <span>{customer?.address || "—"}</span>
                </div>
                <div>
                  <strong>City/State:</strong>{" "}
                  <span>
                    {[customer?.city, customer?.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                </div>
                <div>
                  <strong>Salesperson:</strong>{" "}
                  <span>{selectedSP?.name || "—"}</span>
                </div>
                <div>
                  <strong>Courier:</strong> <span>₹{courier}</span>
                </div>
                {discountAmount > 0 && (
                  <div>
                    <strong>Discount:</strong> <span>₹{discountAmount}</span>
                  </div>
                )}
                <div>
                  <strong>Grand Total:</strong>{" "}
                  <span>₹{grandTotalWithCourier.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="confirm-buttons">
                <button
                  className="primary-btn"
                  onClick={goToInvoice}
                  disabled={isConfirming}
                >
                  {isConfirming
                    ? "Processing..."
                    : "Confirm & Generate Invoice"}
                </button>
                <button
                  className="outline-btn"
                  onClick={() => setConfirmVisible(false)}
                >
                  Go Back & Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;

//+++++++++++++++++++++++++++++++++++

// // src/pages/Order/OrderSuccessPage.js
// import React, { useState, useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   lookupCustomer,
//   addCustomer,
//   updateCustomer,
//   resetCustomer,
//   clearAddState,
//   clearUpdateState,
// } from "../../services/features/customers/customerSlice";
// import { reduceStock } from "../../services/features/products/productSlice";
// import API from "../../services/API/api";
// import { useTheme } from "../../context/ThemeContext";
// import "./OrderSuccessPage.css";

// import {
//   FileText,
//   ChevronDown,
//   X,
//   User,
//   Truck,
//   Calendar,
//   Phone,
//   UserPlus,
//   CheckCircle,
//   MapPin,
//   Building2,
//   AlertTriangle,
//   WifiOff,
//   CreditCard,
//   IndianRupee,
//   Check,
// } from "lucide-react";

// const SALESPERSONS = [
//   { id: 1, name: "SHANTHI" },
//   { id: 2, name: "HARIVARTHINI" },
//   { id: 3, name: "UMA MAM" },
//   { id: 4, name: "SHARMILA" },
//   { id: 5, name: "MOHANA AMBIGAI" },
//   { id: 6, name: "KALAIVANI" },
//   { id: 7, name: "SUNDER SIR" },
//   { id: 8, name: "PAVITHRA" },
//   { id: 9, name: "SARANYA" },
//   { id: 10, name: "VIJAYA LAKSHMI" },
//   { id: 11, name: "VENNILA" },
//   { id: 12, name: "ASHWINI" },
//   { id: 13, name: "PRIYADHARSHNI" },
// ];

// const PAYMENT_MODES = [
//   { id: 1, label: "Cash" },
//   { id: 2, label: "GPay" },
//   { id: 3, label: "Credit Card" },
//   { id: 4, label: "Debit Card" },
//   { id: 5, label: "Office Use" },
//   { id: 6, label: "Loan Amount" },
// ];

// const formatDate = (iso) =>
//   new Date(iso).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });

// const OrderSuccessPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { theme } = useTheme();
//   const isDark = theme === "dark";

//   const {
//     cartItems,
//     grandTotal,
//     paymentMode: initialPaymentMode,
//     date,
//   } = location.state || {};

//   // State
//   const [referenceNo, setReferenceNo] = useState("");
//   const [buyerPhone, setBuyerPhone] = useState("");
//   const [phoneError, setPhoneError] = useState(false);
//   const [addModalVisible, setAddModalVisible] = useState(false);
//   const [newName, setNewName] = useState("");
//   const [newAddress, setNewAddress] = useState("");
//   const [newCity, setNewCity] = useState("");
//   const [newState, setNewState] = useState("");
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [editName, setEditName] = useState("");
//   const [editAddress, setEditAddress] = useState("");
//   const [editCity, setEditCity] = useState("");
//   const [editState, setEditState] = useState("");
//   const [editShopName, setEditShopName] = useState("");
//   const [editCustomerType, setEditCustomerType] = useState("customer");
//   const [sameAsBuyer, setSameAsBuyer] = useState(true);
//   const [shipToName, setShipToName] = useState("");
//   const [shipToPhone, setShipToPhone] = useState("");
//   const [shipToAddress, setShipToAddress] = useState("");
//   const [shipToCity, setShipToCity] = useState("");
//   const [shipToState, setShipToState] = useState("");
//   const [courierCharge, setCourierCharge] = useState("0");
//   const [selectedSP, setSelectedSP] = useState(null);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [discount, setDiscount] = useState("0");
//   const [confirmVisible, setConfirmVisible] = useState(false);
//   const [isConfirming, setIsConfirming] = useState(false);
//   const [selectedPaymentMode, setSelectedPaymentMode] = useState(
//     initialPaymentMode ? { label: initialPaymentMode } : null,
//   );
//   const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
//   const [customerType, setCustomerType] = useState("customer");
//   const [shopName, setShopName] = useState("");

//   // Refs for click outside
//   const paymentDropdownRef = useRef();
//   const salespersonDropdownRef = useRef();

//   // Redux – using the updated state names
//   const {
//     lookupData: customer,
//     lookupState,
//     addLoading,
//     addSuccess,
//     updateLoading,
//     updateSuccess,
//     error,
//   } = useSelector((s) => s.customer);
//   const user = useSelector((state) => state.auth.user);

//   // Effects
//   useEffect(() => {
//     if (!cartItems) navigate("/order-cart");
//   }, [cartItems, navigate]);

//   useEffect(() => {
//     return () => dispatch(resetCustomer());
//   }, [dispatch]);

//   useEffect(() => {
//     if (buyerPhone.length === 10) {
//       setPhoneError(false);
//       dispatch(lookupCustomer(buyerPhone));
//     } else {
//       dispatch(resetCustomer());
//     }
//   }, [buyerPhone, dispatch]);

//   useEffect(() => {
//     if (addSuccess) {
//       setAddModalVisible(false);
//       setNewName("");
//       setNewAddress("");
//       setNewCity("");
//       setNewState("");
//       dispatch(clearAddState());
//       dispatch(lookupCustomer(buyerPhone));
//     }
//     if (error && addLoading === false) {
//       alert("Error: " + error);
//     }
//   }, [addSuccess, error, addLoading, dispatch, buyerPhone]);

//   useEffect(() => {
//     if (updateSuccess) {
//       setEditModalVisible(false);
//       dispatch(lookupCustomer(buyerPhone));
//       dispatch(clearUpdateState());
//       alert("Customer details updated successfully.");
//     }
//     if (error && updateLoading === false && updateSuccess === false) {
//       alert("Error: " + error);
//     }
//   }, [updateSuccess, error, updateLoading, dispatch, buyerPhone]);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         paymentDropdownRef.current &&
//         !paymentDropdownRef.current.contains(event.target)
//       ) {
//         setPaymentDropdownOpen(false);
//       }
//       if (
//         salespersonDropdownRef.current &&
//         !salespersonDropdownRef.current.contains(event.target)
//       ) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Handlers
//   const handleViewInvoice = () => {
//     if (!referenceNo.trim()) {
//       alert("Please enter a Reference Number before proceeding.");
//       return;
//     }

//     if (buyerPhone.length < 10) {
//       setPhoneError(true);
//       alert("Please enter a valid 10-digit phone number.");
//       return;
//     }
//     if (lookupState === "loading") {
//       alert("Verifying customer details...");
//       return;
//     }
//     if (lookupState === "notfound") {
//       setPhoneError(true);
//       if (
//         window.confirm(
//           "Customer not found. Would you like to add this customer?",
//         )
//       ) {
//         setAddModalVisible(true);
//       }
//       return;
//     }
//     if (lookupState === "error") {
//       alert("Could not reach server. Check your connection.");
//       return;
//     }
//     if (lookupState === "found" && customer) {
//       setPhoneError(false);
//       setConfirmVisible(true);
//     }
//   };

//   const handleSaveNewCustomer = () => {
//     if (!newName.trim()) {
//       alert("Customer name is required.");
//       return;
//     }
//     if (customerType === "shop" && !shopName.trim()) {
//       alert("Shop name is required.");
//       return;
//     }
//     dispatch(
//       addCustomer({
//         phone: buyerPhone,
//         name: newName.trim(),
//         address: newAddress.trim(),
//         city: newCity.trim(),
//         state: newState.trim(),
//         type: customerType,
//         shopName: shopName.trim(),
//       }),
//     );
//   };

//   // In OrderSuccessPage.js - Update the goToInvoice function navigate section (around line 200-230)

//   const goToInvoice = async () => {
//     setIsConfirming(true);
//     setConfirmVisible(false);

//     try {
//       // Preserve the original order from cartItems
//       const invoiceItems = cartItems.map((item) => ({
//         productId: item.id,
//         name: item.name,
//         qty: item.qty,
//         price: item.price,
//       }));

//       const subtotal = grandTotal;
//       const discountAmount = parseFloat(discount) || 0;
//       const afterDiscount = Math.max(subtotal - discountAmount, 0);
//       const courier = parseFloat(courierCharge) || 0;
//       const totalWithCourier = afterDiscount + courier;

//       const finalShipToName = sameAsBuyer
//         ? customer?.type === "shop"
//           ? customer?.name
//           : customer?.name
//         : shipToName;
//       const finalShipToPhone = sameAsBuyer ? buyerPhone : shipToPhone;
//       const finalShipToAddress = sameAsBuyer
//         ? customer?.address || ""
//         : shipToAddress;
//       const finalShipToCity = sameAsBuyer ? customer?.city || "" : shipToCity;
//       const finalShipToState = sameAsBuyer
//         ? customer?.state || ""
//         : shipToState;

//       const payload = {
//         billerName: user?.name || "Unknown",
//         items: invoiceItems,
//         totalAmount: totalWithCourier,
//         paymentMode: selectedPaymentMode?.label || initialPaymentMode,
//         status: "completed",
//         customerPhone: buyerPhone,
//         customerName: customer?.name,
//         customerType: customer?.type,
//         shopName: customer?.shopName,
//         customerAddress: customer?.address,
//         customerCity: customer?.city,
//         customerState: customer?.state,
//         sameAsBuyer,
//         shippingAddress: {
//           name: finalShipToName,
//           phone: finalShipToPhone,
//           address: finalShipToAddress,
//           city: finalShipToCity,
//           state: finalShipToState,
//         },
//         subtotal,
//         discount: discountAmount,
//         courierCharge: courier,
//         salesperson: selectedSP?.name || "",
//         referenceNo: referenceNo || "",
//         invoiceDate: date || new Date().toISOString(),
//       };

//       const invoiceRes = await API.post("/api/invoices", payload);
//       const invoiceNumber = invoiceRes.data.invoice.invoiceNumber;

//       if (reduceStock && typeof reduceStock === "function") {
//         await dispatch(reduceStock(cartItems)).unwrap();
//       }

//       // Navigate to invoice with all required data
//       navigate("/invoice", {
//         state: {
//           invoiceNumber,
//           items: cartItems,
//           total: grandTotal,
//           paymentMode: selectedPaymentMode?.label || initialPaymentMode,
//           date: date,
//           buyerName: customer?.name || "—", // Just the customer name
//           buyerPhone,
//           buyerAddress: customer?.address || "",
//           buyerCity: customer?.city || "",
//           buyerState: customer?.state || "",
//           courierCharge: courier,
//           discount: discountAmount,
//           salesperson: selectedSP?.name || "",
//           referenceNo,
//           shipToName: finalShipToName,
//           shipToPhone: finalShipToPhone,
//           shipToAddress: finalShipToAddress,
//           shipToCity: finalShipToCity,
//           shipToState: finalShipToState,
//           customerType: customer?.type,
//           shopName: customer?.shopName, // Shop name passed separately
//         },
//       });
//     } catch (err) {
//       console.error(err);
//       alert("Failed to confirm order. Please try again.");
//     } finally {
//       setIsConfirming(false);
//     }
//   };

//   const discountAmount = parseFloat(discount) || 0;
//   const subtotal = grandTotal || 0;
//   const afterDiscount = Math.max(subtotal - discountAmount, 0);
//   const courier = parseFloat(courierCharge) || 0;
//   const grandTotalWithCourier = afterDiscount + courier;

//   if (!cartItems)
//     return <div className="loading-state">No cart items found</div>;

//   return (
//     <div className={`order-success-page ${isDark ? "dark" : ""}`}>
//       <div className="order-success-container">
//         <div className="success-header">📄 Order Confirm</div>

//         <div className="form-card">
//           <h3>Delivery & Invoice Details</h3>

//           {/* Reference No - Moved to top for visibility */}
//           <div className="field-group">
//             <label>
//               <FileText size={14} /> Reference No. *
//             </label>
//             <input
//               type="text"
//               value={referenceNo}
//               onChange={(e) => setReferenceNo(e.target.value)}
//               placeholder="e.g. PO-12345 (Required)"
//               className="field-input"
//               required
//             />
//             {!referenceNo.trim() && (
//               <div className="error-text">Reference Number is required</div>
//             )}
//           </div>

//           {/* Payment Mode */}
//           <div className="field-group" ref={paymentDropdownRef}>
//             <label>
//               <CreditCard size={14} /> Payment Mode
//             </label>
//             <div
//               className="custom-select"
//               onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
//             >
//               <span>
//                 {selectedPaymentMode
//                   ? selectedPaymentMode.label
//                   : "Select payment mode…"}
//               </span>
//               <ChevronDown
//                 size={16}
//                 className={`dropdown-arrow ${paymentDropdownOpen ? "open" : ""}`}
//               />
//             </div>
//             {paymentDropdownOpen && (
//               <div className="dropdown-list">
//                 {PAYMENT_MODES.map((mode) => (
//                   <div
//                     key={mode.id}
//                     className={`dropdown-item ${selectedPaymentMode?.id === mode.id ? "active" : ""}`}
//                     onClick={() => {
//                       setSelectedPaymentMode(mode);
//                       setPaymentDropdownOpen(false);
//                     }}
//                   >
//                     {mode.label}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Subtotal */}
//           <div className="field-group">
//             <label>
//               <IndianRupee size={14} /> Subtotal
//             </label>
//             <div className="readonly-field">
//               ₹{subtotal.toLocaleString("en-IN")}
//             </div>
//           </div>

//           {/* Discount */}
//           <div className="field-group">
//             <label>
//               <IndianRupee size={14} /> Discount
//             </label>
//             <input
//               type="number"
//               value={discount}
//               onChange={(e) => setDiscount(e.target.value)}
//               className="field-input"
//               placeholder="0"
//             />
//           </div>

//           {/* Invoice Date */}
//           <div className="field-group">
//             <label>
//               <Calendar size={14} /> Invoice Date
//             </label>
//             <div className="readonly-field">
//               {formatDate(date || new Date().toISOString())}
//             </div>
//           </div>

//           {/* Salesperson */}
//           <div className="field-group" ref={salespersonDropdownRef}>
//             <label>
//               <User size={14} /> Salesperson
//             </label>
//             <div
//               className="custom-select"
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//             >
//               <span>
//                 {selectedSP ? selectedSP.name : "Select salesperson…"}
//               </span>
//               <ChevronDown
//                 size={16}
//                 className={`dropdown-arrow ${dropdownOpen ? "open" : ""}`}
//               />
//             </div>
//             {dropdownOpen && (
//               <div className="dropdown-list">
//                 {SALESPERSONS.map((sp) => (
//                   <div
//                     key={sp.id}
//                     className={`dropdown-item ${selectedSP?.id === sp.id ? "active" : ""}`}
//                     onClick={() => {
//                       setSelectedSP(sp);
//                       setDropdownOpen(false);
//                     }}
//                   >
//                     {sp.name}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Phone & Customer Lookup */}
//           <div className="field-group">
//             <label>
//               <Phone size={14} /> Phone Number *
//             </label>
//             <input
//               type="tel"
//               maxLength="10"
//               value={buyerPhone}
//               onChange={(e) => setBuyerPhone(e.target.value)}
//               className={`field-input ${phoneError ? "error" : ""}`}
//               placeholder="Enter 10-digit mobile number"
//             />
//             {phoneError && buyerPhone.length < 10 && (
//               <div className="error-text">
//                 Enter a valid 10-digit phone number
//               </div>
//             )}
//             {lookupState === "loading" && (
//               <div className="status-row">Checking customer database...</div>
//             )}
//             {lookupState === "found" && customer && (
//               <div className="found-card">
//                 <div className="found-header">
//                   <CheckCircle size={15} /> Customer Found
//                   <button
//                     className="edit-btn"
//                     onClick={() => {
//                       setEditName(customer.name || "");
//                       setEditAddress(customer.address || "");
//                       setEditCity(customer.city || "");
//                       setEditState(customer.state || "");
//                       setEditShopName(customer.shopName || "");
//                       setEditCustomerType(customer.type || "customer");
//                       setEditModalVisible(true);
//                     }}
//                   >
//                     Edit
//                   </button>
//                 </div>
//                 <div className="customer-name">
//                   {customer.type === "shop"
//                     ? `${customer.name} (${customer.shopName})`
//                     : customer.name}
//                 </div>
//                 {customer.address && (
//                   <div className="customer-sub address-line">
//                     <MapPin size={14} />
//                     <span>{customer.address}</span>
//                   </div>
//                 )}
//                 {(customer.city || customer.state) && (
//                   <div className="customer-sub">
//                     <Building2 size={14} />{" "}
//                     {[customer.city, customer.state].filter(Boolean).join(", ")}
//                   </div>
//                 )}
//               </div>
//             )}
//             {lookupState === "notfound" && (
//               <div className="notfound-box">
//                 <AlertTriangle size={13} /> No customer found.
//                 <button
//                   className="add-btn"
//                   onClick={() => setAddModalVisible(true)}
//                 >
//                   + Add Customer
//                 </button>
//               </div>
//             )}
//             {lookupState === "error" && (
//               <div className="notfound-box">
//                 <WifiOff size={13} /> Could not reach server.
//                 <button
//                   className="add-btn"
//                   onClick={() => dispatch(lookupCustomer(buyerPhone))}
//                 >
//                   Retry
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Shipping Address */}
//           <div className="field-group">
//             <label>
//               <Truck size={14} /> Shipping Address
//             </label>
//             <div className="switch-row">
//               <span>Same as buyer address</span>
//               <button
//                 className={`switch ${sameAsBuyer ? "active" : ""}`}
//                 onClick={() => setSameAsBuyer(!sameAsBuyer)}
//               >
//                 {sameAsBuyer ? "ON" : "OFF"}
//               </button>
//             </div>
//             {!sameAsBuyer && (
//               <>
//                 <input
//                   type="text"
//                   placeholder="Ship to Name"
//                   value={shipToName}
//                   onChange={(e) => setShipToName(e.target.value)}
//                   className="field-input"
//                 />
//                 <input
//                   type="tel"
//                   placeholder="Ship to Phone"
//                   value={shipToPhone}
//                   onChange={(e) => setShipToPhone(e.target.value)}
//                   className="field-input"
//                 />
//                 <textarea
//                   placeholder="Ship to Address"
//                   value={shipToAddress}
//                   onChange={(e) => setShipToAddress(e.target.value)}
//                   rows={2}
//                   className="field-input"
//                 />
//                 <div className="row-inputs">
//                   <input
//                     type="text"
//                     placeholder="City"
//                     value={shipToCity}
//                     onChange={(e) => setShipToCity(e.target.value)}
//                     className="field-input"
//                   />
//                   <input
//                     type="text"
//                     placeholder="State"
//                     value={shipToState}
//                     onChange={(e) => setShipToState(e.target.value)}
//                     className="field-input"
//                   />
//                 </div>
//               </>
//             )}
//           </div>

//           {/* Courier Charge */}
//           {/* <div className="field-group">
//             <label><Truck size={14} /> Courier Charge (₹)</label>
//             <input type="number" value={courierCharge} onChange={(e) => setCourierCharge(e.target.value)} className="field-input" />
//           </div> */}

//           {/* Courier Charge */}
//           <div className="field-group">
//             <label>
//               <Truck size={14} /> Courier Charge (₹)
//             </label>
//             <input
//               type="text"
//               value={courierCharge}
//               onChange={(e) => setCourierCharge(e.target.value)}
//               className="field-input"
//               placeholder="0"
//             />
//           </div>

//           {/* Total Preview */}
//           <div className="total-preview">
//             <div className="summary-row">
//               <span>Subtotal</span>
//               <span>₹{subtotal.toLocaleString("en-IN")}</span>
//             </div>
//             {discountAmount > 0 && (
//               <div className="summary-row">
//                 <span>Discount</span>
//                 <span className="discount">
//                   - ₹{discountAmount.toLocaleString("en-IN")}
//                 </span>
//               </div>
//             )}
//             <div className="summary-row">
//               <span>Courier Charge</span>
//               <span>₹{courier.toLocaleString("en-IN")}</span>
//             </div>
//             <hr />
//             <div className="summary-row total">
//               <span>Grand Total</span>
//               <span>₹{grandTotalWithCourier.toLocaleString("en-IN")}</span>
//             </div>
//           </div>
//         </div>

//         <button
//           className="primary-btn"
//           onClick={handleViewInvoice}
//           disabled={isConfirming || !referenceNo.trim()}
//           style={{ opacity: !referenceNo.trim() ? "0.5" : "1" }}
//         >
//           <FileText size={18} /> View Invoice
//         </button>
//         {!referenceNo.trim() && (
//           <div
//             className="error-text"
//             style={{ textAlign: "center", marginTop: "0.5rem" }}
//           >
//             * Reference Number is required to view invoice
//           </div>
//         )}
//       </div>

//       {/* Add Customer Modal */}
//       {addModalVisible && (
//         <div
//           className="modal-overlay"
//           onClick={() => setAddModalVisible(false)}
//         >
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <UserPlus size={18} /> Add New Customer
//               <button
//                 className="close-btn"
//                 onClick={() => setAddModalVisible(false)}
//               >
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="modal-body">
//               <div className="phone-pill">
//                 <Phone size={13} /> {buyerPhone}
//               </div>
//               <div className="row-buttons">
//                 <button
//                   className={`type-btn ${customerType === "customer" ? "active" : ""}`}
//                   onClick={() => setCustomerType("customer")}
//                 >
//                   Customer
//                 </button>
//                 <button
//                   className={`type-btn ${customerType === "shop" ? "active" : ""}`}
//                   onClick={() => setCustomerType("shop")}
//                 >
//                   Shop
//                 </button>
//               </div>
//               <input
//                 type="text"
//                 placeholder="Customer Name *"
//                 value={newName}
//                 onChange={(e) => setNewName(e.target.value)}
//                 className="modal-input"
//               />
//               {customerType === "shop" && (
//                 <input
//                   type="text"
//                   placeholder="Shop Name *"
//                   value={shopName}
//                   onChange={(e) => setShopName(e.target.value)}
//                   className="modal-input"
//                 />
//               )}
//               <label className="field-label">Delivery Address</label>
//               <textarea
//                 placeholder="Street, landmark, area…"
//                 value={newAddress}
//                 onChange={(e) => setNewAddress(e.target.value)}
//                 rows={3}
//                 className="modal-input address-textarea"
//               />
//               <div className="row-inputs">
//                 <input
//                   type="text"
//                   placeholder="City"
//                   value={newCity}
//                   onChange={(e) => setNewCity(e.target.value)}
//                   className="modal-input"
//                 />
//                 <input
//                   type="text"
//                   placeholder="State"
//                   value={newState}
//                   onChange={(e) => setNewState(e.target.value)}
//                   className="modal-input"
//                 />
//               </div>
//               <button
//                 className="save-btn"
//                 onClick={handleSaveNewCustomer}
//                 disabled={addLoading}
//               >
//                 {addLoading ? "Saving..." : "Save Customer"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Customer Modal */}
//       {editModalVisible && (
//         <div
//           className="modal-overlay"
//           onClick={() => setEditModalVisible(false)}
//         >
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <UserPlus size={18} /> Edit Customer
//               <button
//                 className="close-btn"
//                 onClick={() => setEditModalVisible(false)}
//               >
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="modal-body">
//               <div className="phone-pill">
//                 <Phone size={13} /> {buyerPhone}
//               </div>
//               <div className="row-buttons">
//                 <button
//                   className={`type-btn ${editCustomerType === "customer" ? "active" : ""}`}
//                   onClick={() => setEditCustomerType("customer")}
//                 >
//                   Customer
//                 </button>
//                 <button
//                   className={`type-btn ${editCustomerType === "shop" ? "active" : ""}`}
//                   onClick={() => setEditCustomerType("shop")}
//                 >
//                   Shop
//                 </button>
//               </div>
//               <input
//                 type="text"
//                 placeholder="Customer Name *"
//                 value={editName}
//                 onChange={(e) => setEditName(e.target.value)}
//                 className="modal-input"
//               />
//               {editCustomerType === "shop" && (
//                 <input
//                   type="text"
//                   placeholder="Shop Name *"
//                   value={editShopName}
//                   onChange={(e) => setEditShopName(e.target.value)}
//                   className="modal-input"
//                 />
//               )}
//               <label className="field-label">Delivery Address</label>
//               <textarea
//                 placeholder="Street, landmark, area…"
//                 value={editAddress}
//                 onChange={(e) => setEditAddress(e.target.value)}
//                 rows={3}
//                 className="modal-input address-textarea"
//               />
//               <div className="row-inputs">
//                 <input
//                   type="text"
//                   placeholder="City"
//                   value={editCity}
//                   onChange={(e) => setEditCity(e.target.value)}
//                   className="modal-input"
//                 />
//                 <input
//                   type="text"
//                   placeholder="State"
//                   value={editState}
//                   onChange={(e) => setEditState(e.target.value)}
//                   className="modal-input"
//                 />
//               </div>
//               <button
//                 className="save-btn"
//                 onClick={() => {
//                   if (!editName.trim()) return alert("Customer name required");
//                   dispatch(
//                     updateCustomer({
//                       phone: buyerPhone,
//                       data: {
//                         name: editName.trim(),
//                         address: editAddress.trim(),
//                         city: editCity.trim(),
//                         state: editState.trim(),
//                         type: editCustomerType,
//                         shopName: editShopName.trim(),
//                       },
//                     }),
//                   );
//                 }}
//                 disabled={updateLoading}
//               >
//                 {updateLoading ? "Saving..." : "Save Changes"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Confirm Modal */}
//       {confirmVisible && (
//         <div className="modal-overlay" onClick={() => setConfirmVisible(false)}>
//           <div
//             className="modal-content confirm-modal"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="modal-header">
//               <h3>
//                 <Check size={20} /> Ready to Generate Invoice?
//               </h3>
//               <button
//                 className="close-btn"
//                 onClick={() => setConfirmVisible(false)}
//               >
//                 <X size={18} />
//               </button>
//             </div>
//             <div className="modal-body">
//               <p>Please confirm the order details before proceeding.</p>
//               <div className="confirm-info">
//                 <div>
//                   <strong>Reference No:</strong> <span>{referenceNo}</span>
//                 </div>
//                 <div>
//                   <strong>Buyer:</strong>
//                   <span>
//                     {customer?.type === "shop"
//                       ? `${customer?.name} (${customer?.shopName})`
//                       : customer?.name || "—"}
//                   </span>
//                 </div>
//                 <div>
//                   <strong>Phone:</strong> <span>{buyerPhone}</span>
//                 </div>
//                 <div>
//                   <strong>Address:</strong>{" "}
//                   <span>{customer?.address || "—"}</span>
//                 </div>
//                 <div>
//                   <strong>City/State:</strong>{" "}
//                   <span>
//                     {[customer?.city, customer?.state]
//                       .filter(Boolean)
//                       .join(", ") || "—"}
//                   </span>
//                 </div>
//                 <div>
//                   <strong>Salesperson:</strong>{" "}
//                   <span>{selectedSP?.name || "—"}</span>
//                 </div>
//                 <div>
//                   <strong>Courier:</strong> <span>₹{courier}</span>
//                 </div>
//                 {discountAmount > 0 && (
//                   <div>
//                     <strong>Discount:</strong> <span>₹{discountAmount}</span>
//                   </div>
//                 )}
//                 <div>
//                   <strong>Grand Total:</strong>{" "}
//                   <span>₹{grandTotalWithCourier.toLocaleString("en-IN")}</span>
//                 </div>
//               </div>
//               <div className="confirm-buttons">
//                 <button
//                   className="primary-btn"
//                   onClick={goToInvoice}
//                   disabled={isConfirming}
//                 >
//                   {isConfirming
//                     ? "Processing..."
//                     : "Confirm & Generate Invoice"}
//                 </button>
//                 <button
//                   className="outline-btn"
//                   onClick={() => setConfirmVisible(false)}
//                 >
//                   Go Back & Edit
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default OrderSuccessPage;
