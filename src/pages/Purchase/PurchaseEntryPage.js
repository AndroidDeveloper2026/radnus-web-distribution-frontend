// PurchaseEntryPage.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/features/products/productSlice';
import { fetchSuppliers, addSupplier } from '../../services/features/purchase/supplierSlice';
import { createPurchase } from '../../services/features/purchase/purchaseSlice';
import { SectionHeader, toast } from '../../components/ui/UI';
import PurchaseHeader from '../../components/Purchase/PurchaseHeader';
import PurchaseForm from '../../components/Purchase/PurchaseForm';
import PurchaseItemTable from '../../components/Purchase/PurchaseItemTable';
import PurchaseSummary from '../../components/Purchase/PurchaseSummary';
import SupplierModal from '../../components/Purchase/SupplierModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const emptyHeader = { supplier: '', invoiceDate: '', paymentType: 'Credit', remarks: '' };

const PurchaseEntryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list: products } = useSelector((s) => s.products);
  const { list: suppliers } = useSelector((s) => s.suppliers);
  const { submitting } = useSelector((s) => s.purchases);

  const [header, setHeader] = useState(emptyHeader);
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // ─── Calculations ──────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + Number(it.total || 0), 0);
    const gstAmount = items.reduce((sum, it) => sum + (Number(it.total || 0) * (Number(it.gst) || 0)) / 100, 0);
    const grandTotal = subtotal - (Number(discount) || 0) + gstAmount;
    const dueAmount = grandTotal - (Number(paidAmount) || 0);
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      dueAmount: Math.round(dueAmount * 100) / 100,
    };
  }, [items, discount, paidAmount]);

  // ─── Item Handlers ─────────────────────────────────────────────────────
  const handleAddItem = (item) => setItems((prev) => [...prev, item]);
  
  const handleEditItem = (idx) => {
    const item = items[idx];
    if (!item) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    toast.info(`Editing "${item.name}" — adjust and re-add it below`);
  };
  
  const handleDeleteItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  // ─── Product Created Handler ─────────────────────────────────────────
  const handleProductCreated = useCallback(() => {
    // Refresh product list after new product is created
    dispatch(fetchProducts());
  }, [dispatch]);

  // ─── Form Reset ──────────────────────────────────────────────────────
  const resetForm = () => {
    setHeader(emptyHeader);
    setItems([]);
    setDiscount('0');
    setPaidAmount('0');
    setPendingSaveData(null);
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!header.supplier) errors.supplier = 'Supplier is required';
    if (!header.invoiceDate) errors.invoiceDate = 'Invoice date is required';
    if (Object.keys(errors).length) {
      setHeader((prev) => ({ ...prev, errors }));
      return false;
    }
    if (!items.length) {
      toast.error('Add at least one item before saving');
      return false;
    }
    return true;
  };

  const getSupplierName = () => {
    if (!header.supplier) return 'Unknown Supplier';
    const supplier = suppliers.find((s) => s._id === header.supplier);
    return supplier?.name || 'Unknown Supplier';
  };

  // ─── Save Flow ───────────────────────────────────────────────────────
  const prepareSaveData = () => {
    if (!validate()) return;
    
    const supplierObj = suppliers.find((s) => s._id === header.supplier);
    const data = {
      purchaseData: {
        supplier: header.supplier,
        invoiceDate: header.invoiceDate,
        paymentType: header.paymentType,
        remarks: header.remarks,
        products: items,
        discount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || 0,
      },
      supplierObj,
      totals: totals,
      itemCount: items.length,
    };
    
    setPendingSaveData(data);
    setConfirmationModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingSaveData) return;
    
    setConfirmationModalOpen(false);
    
    try {
      const created = await dispatch(
        createPurchase(pendingSaveData.purchaseData)
      ).unwrap();
      
      toast.success('Purchase entry saved successfully');

      const invoiceItems = Array.isArray(created?.products) && created.products.length
        ? created.products
        : items;
      
      const invoiceState = {
        purchase: created,
        supplier: pendingSaveData.supplierObj,
        items: invoiceItems,
        discount: Number(discount) || 0,
      };

      resetForm();
      navigate('/purchase/invoice', { state: invoiceState });
    } catch (err) {
      toast.error(err || 'Failed to save purchase entry');
    }
  };

  const handleCancelSave = () => {
    setConfirmationModalOpen(false);
    setPendingSaveData(null);
  };

  // ─── Supplier Handler ────────────────────────────────────────────────
  const handleAddSupplier = async (payload) => {
    const created = await dispatch(addSupplier(payload)).unwrap();
    setHeader((prev) => ({ ...prev, supplier: created._id }));
    toast.success('Supplier added');
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div>
      <SectionHeader title="Purchase Entry" />
      <div className="entry-with-summary">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <PurchaseHeader
            values={header}
            onChange={setHeader}
            suppliers={suppliers}
            onAddSupplier={() => setSupplierModalOpen(true)}
          />
          <PurchaseForm 
            products={products} 
            onAddItem={handleAddItem}
            onProductCreated={handleProductCreated}
          />
          <PurchaseItemTable 
            items={items} 
            onEdit={handleEditItem} 
            onDelete={handleDeleteItem} 
          />
        </div>
        <div style={{ position: 'sticky', top: 16 }}>
          <PurchaseSummary
            subtotal={totals.subtotal}
            discount={discount}
            onDiscountChange={setDiscount}
            gstAmount={totals.gstAmount}
            grandTotal={totals.grandTotal}
            paidAmount={paidAmount}
            onPaidAmountChange={setPaidAmount}
            dueAmount={totals.dueAmount}
            onSave={prepareSaveData}
            onReset={resetForm}
            onCancel={() => navigate('/purchase/history')}
            saving={submitting}
          />
        </div>
      </div>
      
      {/* ─── Supplier Modal ────────────────────────────────────────────── */}
      <SupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSave={handleAddSupplier}
      />

      {/* ─── Confirmation Modal ────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirm Purchase Entry"
        confirmText="Save & Generate Invoice"
        cancelText="Cancel"
        isProcessing={submitting}
      >
        <p>
          Are you sure you want to save this purchase entry and generate the invoice?
        </p>
        
        <div className="confirmation-summary">
          <div className="confirmation-summary-row">
            <span className="confirmation-summary-label">Supplier</span>
            <span className="confirmation-summary-value">{getSupplierName()}</span>
          </div>
          <div className="confirmation-summary-row">
            <span className="confirmation-summary-label">Items</span>
            <span className="confirmation-summary-value">{items.length} products</span>
          </div>
          <div className="confirmation-summary-row">
            <span className="confirmation-summary-label">Subtotal</span>
            <span className="confirmation-summary-value">₹ {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="confirmation-summary-row">
            <span className="confirmation-summary-label">GST</span>
            <span className="confirmation-summary-value">₹ {totals.gstAmount.toFixed(2)}</span>
          </div>
          {Number(discount) > 0 && (
            <div className="confirmation-summary-row confirmation-summary-row-discount">
              <span className="confirmation-summary-label">Discount</span>
              <span className="confirmation-summary-value">- ₹ {Number(discount).toFixed(2)}</span>
            </div>
          )}
          <hr className="confirmation-summary-divider" />
          <div className="confirmation-summary-total">
            <span className="confirmation-summary-total-label">Grand Total</span>
            <span className="confirmation-summary-total-value">
              ₹ {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
        
        <p className="confirmation-note">
          This action will save the purchase and redirect you to the invoice page.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default PurchaseEntryPage;

//--------------- 13.08.2026 ---------------------------
// import React, { useEffect, useMemo, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { fetchProducts } from '../../services/features/products/productSlice';
// import { fetchSuppliers, addSupplier } from '../../services/features/purchase/supplierSlice';
// import { createPurchase } from '../../services/features/purchase/purchaseSlice';
// import { SectionHeader, toast } from '../../components/ui/UI';
// import PurchaseHeader from '../../components/Purchase/PurchaseHeader';
// import PurchaseForm from '../../components/Purchase/PurchaseForm';
// import PurchaseItemTable from '../../components/Purchase/PurchaseItemTable';
// import PurchaseSummary from '../../components/Purchase/PurchaseSummary';
// import SupplierModal from '../../components/Purchase/SupplierModal';
// import ConfirmationModal from '../../components/ui/ConfirmationModal';

// const emptyHeader = { supplier: '', invoiceDate: '', paymentType: 'Credit', remarks: '' };

// const PurchaseEntryPage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { list: products } = useSelector((s) => s.products);
//   const { list: suppliers } = useSelector((s) => s.suppliers);
//   const { submitting } = useSelector((s) => s.purchases);

//   const [header, setHeader] = useState(emptyHeader);
//   const [items, setItems] = useState([]);
//   const [discount, setDiscount] = useState('0');
//   const [paidAmount, setPaidAmount] = useState('0');
//   const [supplierModalOpen, setSupplierModalOpen] = useState(false);
//   const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
//   const [pendingSaveData, setPendingSaveData] = useState(null);

//   useEffect(() => {
//     dispatch(fetchProducts());
//     dispatch(fetchSuppliers());
//   }, [dispatch]);

//   const totals = useMemo(() => {
//     const subtotal = items.reduce((sum, it) => sum + Number(it.total || 0), 0);
//     const gstAmount = items.reduce((sum, it) => sum + (Number(it.total || 0) * (Number(it.gst) || 0)) / 100, 0);
//     const grandTotal = subtotal - (Number(discount) || 0) + gstAmount;
//     const dueAmount = grandTotal - (Number(paidAmount) || 0);
//     return {
//       subtotal: Math.round(subtotal * 100) / 100,
//       gstAmount: Math.round(gstAmount * 100) / 100,
//       grandTotal: Math.round(grandTotal * 100) / 100,
//       dueAmount: Math.round(dueAmount * 100) / 100,
//     };
//   }, [items, discount, paidAmount]);

//   const handleAddItem = (item) => setItems((prev) => [...prev, item]);
  
//   const handleEditItem = (idx) => {
//     const item = items[idx];
//     if (!item) return;
//     setItems((prev) => prev.filter((_, i) => i !== idx));
//     toast.info(`Editing "${item.name}" — adjust and re-add it below`);
//   };
  
//   const handleDeleteItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

//   const resetForm = () => {
//     setHeader(emptyHeader);
//     setItems([]);
//     setDiscount('0');
//     setPaidAmount('0');
//     setPendingSaveData(null);
//   };

//   const validate = () => {
//     const errors = {};
//     if (!header.supplier) errors.supplier = 'Supplier is required';
//     if (!header.invoiceDate) errors.invoiceDate = 'Invoice date is required';
//     if (Object.keys(errors).length) {
//       setHeader((prev) => ({ ...prev, errors }));
//       return false;
//     }
//     if (!items.length) {
//       toast.error('Add at least one item before saving');
//       return false;
//     }
//     return true;
//   };

//   const getSupplierName = () => {
//     if (!header.supplier) return 'Unknown Supplier';
//     const supplier = suppliers.find((s) => s._id === header.supplier);
//     return supplier?.name || 'Unknown Supplier';
//   };

//   const prepareSaveData = () => {
//     if (!validate()) return;
    
//     const supplierObj = suppliers.find((s) => s._id === header.supplier);
//     const data = {
//       purchaseData: {
//         supplier: header.supplier,
//         invoiceDate: header.invoiceDate,
//         paymentType: header.paymentType,
//         remarks: header.remarks,
//         products: items,
//         discount: Number(discount) || 0,
//         paidAmount: Number(paidAmount) || 0,
//       },
//       supplierObj,
//       totals: totals,
//       itemCount: items.length,
//     };
    
//     setPendingSaveData(data);
//     setConfirmationModalOpen(true);
//   };

//   const handleConfirmSave = async () => {
//     if (!pendingSaveData) return;
    
//     setConfirmationModalOpen(false);
    
//     try {
//       const created = await dispatch(
//         createPurchase(pendingSaveData.purchaseData)
//       ).unwrap();
      
//       toast.success('Purchase entry saved successfully');

//       const invoiceItems = Array.isArray(created?.products) && created.products.length
//         ? created.products
//         : items;
      
//       const invoiceState = {
//         purchase: created,
//         supplier: pendingSaveData.supplierObj,
//         items: invoiceItems,
//         discount: Number(discount) || 0,
//       };

//       resetForm();
//       navigate('/purchase/invoice', { state: invoiceState });
//     } catch (err) {
//       toast.error(err || 'Failed to save purchase entry');
//     }
//   };

//   const handleCancelSave = () => {
//     setConfirmationModalOpen(false);
//     setPendingSaveData(null);
//   };

//   const handleAddSupplier = async (payload) => {
//     const created = await dispatch(addSupplier(payload)).unwrap();
//     setHeader((prev) => ({ ...prev, supplier: created._id }));
//     toast.success('Supplier added');
//   };

//   return (
//     <div>
//       <SectionHeader title="Purchase Entry" />
//       <div className="entry-with-summary">
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
//           <PurchaseHeader
//             values={header}
//             onChange={setHeader}
//             suppliers={suppliers}
//             onAddSupplier={() => setSupplierModalOpen(true)}
//           />
//           <PurchaseForm products={products} onAddItem={handleAddItem} />
//           <PurchaseItemTable items={items} onEdit={handleEditItem} onDelete={handleDeleteItem} />
//         </div>
//         <div style={{ position: 'sticky', top: 16 }}>
//           <PurchaseSummary
//             subtotal={totals.subtotal}
//             discount={discount}
//             onDiscountChange={setDiscount}
//             gstAmount={totals.gstAmount}
//             grandTotal={totals.grandTotal}
//             paidAmount={paidAmount}
//             onPaidAmountChange={setPaidAmount}
//             dueAmount={totals.dueAmount}
//             onSave={prepareSaveData}
//             onReset={resetForm}
//             onCancel={() => navigate('/purchase/history')}
//             saving={submitting}
//           />
//         </div>
//       </div>
      
//       <SupplierModal
//         open={supplierModalOpen}
//         onClose={() => setSupplierModalOpen(false)}
//         onSave={handleAddSupplier}
//       />

//       {/* ===== CONFIRMATION MODAL ===== */}
//       <ConfirmationModal
//         isOpen={confirmationModalOpen}
//         onClose={handleCancelSave}
//         onConfirm={handleConfirmSave}
//         title="Confirm Purchase Entry"
//         confirmText="Save & Generate Invoice"
//         cancelText="Cancel"
//         isProcessing={submitting}
//       >
//         <p>
//           Are you sure you want to save this purchase entry and generate the invoice?
//         </p>
        
//         <div className="confirmation-summary">
//           <div className="confirmation-summary-row">
//             <span className="confirmation-summary-label">Supplier</span>
//             <span className="confirmation-summary-value">{getSupplierName()}</span>
//           </div>
//           <div className="confirmation-summary-row">
//             <span className="confirmation-summary-label">Items</span>
//             <span className="confirmation-summary-value">{items.length} products</span>
//           </div>
//           <div className="confirmation-summary-row">
//             <span className="confirmation-summary-label">Subtotal</span>
//             <span className="confirmation-summary-value">₹ {totals.subtotal.toFixed(2)}</span>
//           </div>
//           <div className="confirmation-summary-row">
//             <span className="confirmation-summary-label">GST</span>
//             <span className="confirmation-summary-value">₹ {totals.gstAmount.toFixed(2)}</span>
//           </div>
//           {Number(discount) > 0 && (
//             <div className="confirmation-summary-row confirmation-summary-row-discount">
//               <span className="confirmation-summary-label">Discount</span>
//               <span className="confirmation-summary-value">- ₹ {Number(discount).toFixed(2)}</span>
//             </div>
//           )}
//           <hr className="confirmation-summary-divider" />
//           <div className="confirmation-summary-total">
//             <span className="confirmation-summary-total-label">Grand Total</span>
//             <span className="confirmation-summary-total-value">
//               ₹ {totals.grandTotal.toFixed(2)}
//             </span>
//           </div>
//         </div>
        
//         <p className="confirmation-note">
//           This action will save the purchase and redirect you to the invoice page.
//         </p>
//       </ConfirmationModal>
//     </div>
//   );
// };

// export default PurchaseEntryPage;