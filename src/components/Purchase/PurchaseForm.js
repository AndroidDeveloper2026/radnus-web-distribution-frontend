import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, RotateCcw, History, ArrowUp, ArrowDown, Minus, PackagePlus } from 'lucide-react';
import { Card, SectionHeader, Input, Button, DataTable, Badge, toast } from '../ui/UI';
import { fetchPriceHistory, clearPriceHistory } from '../../services/features/purchase/purchaseSlice';
import ProductFormModal from '../Products/ProductFormModal'; // Import the product modal

const fmt = (v) => (v === null || v === undefined ? '—' : `₹${Number(v).toFixed(2)}`);

// Small up/down/flat indicator vs. the chronologically-previous batch.
const Delta = ({ current, previous }) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  const diff = Number(current) - Number(previous);
  if (Math.abs(diff) < 0.005) return <Minus size={12} style={{ verticalAlign: 'middle', color: 'var(--text-muted)' }} />;
  const up = diff > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return <Icon size={12} style={{ verticalAlign: 'middle', color: up ? 'var(--red)' : 'var(--green, #16a34a)', marginLeft: 4 }} />;
};

// Custom Number Input component with all the fixes applied
const NumberInput = ({ label, error, hint, icon, iconRight, className = '', ...props }) => {
  const handleWheel = (e) => {
    e.preventDefault();
    e.target.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <div className="field-wrap">
        {icon && <span className="field-icon-left">{icon}</span>}
        <input 
          className={`field-input ${icon ? 'has-icon-left' : ''} ${iconRight ? 'has-icon-right' : ''} ${error ? 'has-error' : ''}`} 
          type="number"
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          {...props} 
        />
        {iconRight && <span className="field-icon-right">{iconRight}</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  );
};

/**
 * "Add Items" product entry row. Reuses the searchable-product-dropdown
 * pattern already used in Returns pages (custom absolute-positioned list),
 * built on top of the shared Input primitive rather than inventing a new
 * combobox component.
 */
const PurchaseForm = ({ products = [], onAddItem, onProductCreated }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { priceHistory, priceHistoryLoading } = useSelector((s) => s.purchases);
  
  // ─── State ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [distributorPrice, setDistributorPrice] = useState('');
  const [retailerPrice, setRetailerPrice] = useState('');
  const [walkinPrice, setWalkinPrice] = useState('');
  const [itemCostLinked, setItemCostLinked] = useState(true);
  const [originalPrices, setOriginalPrices] = useState(null);
  
  // ─── New Product Modal State ──────────────────────────────────────────
  const [productModalOpen, setProductModalOpen] = useState(false);
  
  const wrapRef = useRef(null);

  // ─── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return products
      .filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [search, products]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  
  // Handle product selection from dropdown
  const handleSelectProduct = (product) => {
    setSelected(product);
    setSearch(`${product.name} (${product.sku})`);
    setShowDropdown(false);
    const initialPrice = product.lastPurchasePrice ? String(product.lastPurchasePrice) : '';
    setPrice(initialPrice);
    setGst(product.gst !== undefined ? String(product.gst) : '');
    setRackNo(product.rackNo || '');
    setItemCost(initialPrice);
    setDistributorPrice(product.distributorPrice !== undefined ? String(product.distributorPrice) : '');
    setRetailerPrice(product.retailerPrice !== undefined ? String(product.retailerPrice) : '');
    setWalkinPrice(product.walkinPrice !== undefined ? String(product.walkinPrice) : '');
    setOriginalPrices({
      itemCost: product.itemCost,
      distributorPrice: product.distributorPrice,
      retailerPrice: product.retailerPrice,
      walkinPrice: product.walkinPrice,
    });
    setItemCostLinked(true);
    dispatch(clearPriceHistory());
    dispatch(fetchPriceHistory(product._id))
      .unwrap()
      .catch((err) => toast.error(err || 'Failed to load this product\'s price history'));
  };

  // Reset the row after adding an item
  const resetRow = () => {
    setSearch('');
    setSelected(null);
    setQty('');
    setPrice('');
    setGst('');
    setRackNo('');
    setItemCost('');
    setDistributorPrice('');
    setRetailerPrice('');
    setWalkinPrice('');
    setOriginalPrices(null);
    setItemCostLinked(true);
    dispatch(clearPriceHistory());
  };

  // Purchase Price drives Item Cost while they're linked.
  const handlePriceChange = (value) => {
    setPrice(value);
    if (itemCostLinked) setItemCost(value);
  };

  // Editing Item Cost directly breaks the auto-sync for this row.
  const handleItemCostChange = (value) => {
    setItemCost(value);
    setItemCostLinked(false);
  };

  // Add item to purchase
  const handleAddItem = () => {
    if (!selected) return toast.error('Please search and select a product');
    const q = Number(qty);
    const p = Number(price);
    if (!q || q <= 0) return toast.error('Enter a valid quantity');
    if (p === undefined || Number.isNaN(p) || p < 0) return toast.error('Enter a valid purchase price');

    onAddItem({
      productId: selected._id,
      sku: selected.sku,
      name: selected.name,
      quantity: q,
      purchasePrice: p,
      mrp: selected.mrp || 0,
      gst: Number(gst) || 0,
      rackNo,
      batchNo: '', // assigned by the server on save
      total: Math.round(q * p * 100) / 100,
      itemCost: itemCost !== '' ? Number(itemCost) : undefined,
      distributorPrice: distributorPrice !== '' ? Number(distributorPrice) : undefined,
      retailerPrice: retailerPrice !== '' ? Number(retailerPrice) : undefined,
      walkinPrice: walkinPrice !== '' ? Number(walkinPrice) : undefined,
    });
    resetRow();
  };

  // ─── NEW: Handle product creation from the purchase form ──────────────
  const handleProductCreated = (newProduct) => {
    // Close the modal
    setProductModalOpen(false);
    
    // Show success message
    toast.success(`Product "${newProduct.name}" created successfully!`);
    
    // Automatically select the newly created product
    if (newProduct && newProduct._id) {
      handleSelectProduct(newProduct);
    }
    
    // Notify parent component (PurchaseEntryPage) to refresh the product list
    if (onProductCreated) {
      onProductCreated();
    }
  };

  // ─── Price Field Extras ──────────────────────────────────────────────
  const priceFieldExtras = (fieldKey, liveValue, setLiveValue) => {
    if (!originalPrices) return {};
    const original = originalPrices[fieldKey];
    const originalStr = original !== undefined && original !== null ? String(original) : '';
    const changed = liveValue !== originalStr && originalStr !== '';
    return {
      hint: originalStr !== '' ? `Current: ₹${Number(original).toFixed(2)}` : 'Not set previously',
      iconRight: changed ? (
        <RotateCcw
          size={14}
          style={{ cursor: 'pointer' }}
          title={`Revert to ₹${Number(original).toFixed(2)}`}
          onClick={() => setLiveValue(originalStr)}
        />
      ) : undefined,
    };
  };

  const itemCostExtras = () => {
    if (itemCostLinked) {
      return { hint: 'Synced with Purchase Price' };
    }
    return priceFieldExtras('itemCost', itemCost, (v) => { setItemCost(v); setItemCostLinked(false); });
  };

  // ─── Batch Preview ──────────────────────────────────────────────────
  const nextBatchPreview = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `B${y}${m}${day}-001`;
  }, []);

  // ─── Price History ──────────────────────────────────────────────────
  const historyWithPrev = priceHistory.map((row, i) => ({
    ...row,
    _id: `${row.purchaseNumber}-${i}`,
    __prev: priceHistory[i + 1] || null,
  }));

  const historyColumns = [
    { key: 'batchNo', label: 'Batch No', render: (v) => <Badge variant="default">{v}</Badge> },
    { key: 'invoiceDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'supplierName', label: 'Supplier' },
    {
      key: 'purchasePrice', label: 'Purchase Price',
      render: (v, row) => <span>{fmt(v)}<Delta current={v} previous={row.__prev?.purchasePrice} /></span>,
    },
    {
      key: 'itemCost', label: 'Item Cost',
      render: (v, row) => <span>{fmt(v)}<Delta current={v} previous={row.__prev?.itemCost} /></span>,
    },
  ];

  const availableStock = selected?.moq ?? '';

  return (
    <>
      <Card className="card-pad">
        <SectionHeader 
          title="Add Items" 
          action={
            <Button 
              variant="outline" 
              size="sm" 
              icon={<PackagePlus size={14} />}
              onClick={() => setProductModalOpen(true)}
            >
              New Product
            </Button>
          }
        />
        
        {/* ─── Product Search Row ────────────────────────────────────── */}
        <div className="form-row-3" ref={wrapRef} style={{ position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Input
              label="Search Product *"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && search.trim() && (
              <div
                style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  maxHeight: 220, overflowY: 'auto', background: 'var(--bg-modal)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-card)', marginTop: 4,
                }}
              >
                {filtered.length === 0 ? (
                  <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                    No products found. Click "New Product" to create one.
                  </div>
                ) : (
                  filtered.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => handleSelectProduct(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        SKU: {p.sku} | Stock: {p.moq ?? 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <NumberInput label="Available Stock" value={availableStock} readOnly disabled />
          <NumberInput 
            label="Qty *" 
            type="number" 
            min="1" 
            value={qty} 
            onChange={(e) => setQty(e.target.value)} 
          />
        </div>

        {/* ─── Price Row 1 ────────────────────────────────────────────── */}
        <div className="form-row-3" style={{ marginTop: 14 }}>
          <NumberInput
            label="Purchase Price *" 
            type="number" 
            min="0" 
            step="0.01"
            value={price} 
            onChange={(e) => handlePriceChange(e.target.value)}
            hint="Also updates Item Cost below (unless you've edited it separately)"
          />
          <NumberInput 
            label="MRP" 
            type="number"
            min="0"
            step="0.01"
            value={selected?.mrp ?? ''} 
            readOnly 
            disabled 
          />
          <NumberInput 
            label="GST %" 
            type="number" 
            min="0" 
            step="0.01"
            value={gst} 
            onChange={(e) => setGst(e.target.value)} 
          />
        </div>

        {/* ─── Price Row 2 ────────────────────────────────────────────── */}
        <div className="form-row-3" style={{ marginTop: 14 }}>
          <NumberInput
            label="Item Cost" 
            type="number" 
            min="0" 
            step="0.01"
            value={itemCost} 
            onChange={(e) => handleItemCostChange(e.target.value)}
            {...itemCostExtras()}
          />
          <NumberInput
            label="Distributor Price" 
            type="number" 
            min="0" 
            step="0.01"
            value={distributorPrice} 
            onChange={(e) => setDistributorPrice(e.target.value)}
            {...priceFieldExtras('distributorPrice', distributorPrice, setDistributorPrice)}
          />
          <NumberInput
            label="Retailer Price" 
            type="number" 
            min="0" 
            step="0.01"
            value={retailerPrice} 
            onChange={(e) => setRetailerPrice(e.target.value)}
            {...priceFieldExtras('retailerPrice', retailerPrice, setRetailerPrice)}
          />
        </div>

        {/* ─── Price Row 3 ────────────────────────────────────────────── */}
        <div className="form-row-3" style={{ marginTop: 14 }}>
          <NumberInput
            label="Walk-in Price" 
            type="number" 
            min="0" 
            step="0.01"
            value={walkinPrice} 
            onChange={(e) => setWalkinPrice(e.target.value)}
            {...priceFieldExtras('walkinPrice', walkinPrice, setWalkinPrice)}
          />
          <Input label="Rack Number" placeholder="e.g. R-02" value={rackNo} onChange={(e) => setRackNo(e.target.value)} />
          <Input
            label="Batch Number"
            value={selected ? `${nextBatchPreview} (preview)` : 'Auto Generated'}
            readOnly
            disabled
            hint={selected ? 'Confirmed only after Save Purchase' : ''}
          />
        </div>

        {/* ─── Price History ───────────────────────────────────────────── */}
        {selected && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <SectionHeader
              title="Price Variance by Batch"
              count={priceHistory.length || undefined}
              action={
                <button
                  type="button"
                  onClick={() => navigate(`/purchase/product-price-history/${selected._id}`)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--red)', fontSize: 12, fontWeight: 600,
                  }}
                >
                  <History size={12} /> Full History
                </button>
              }
            />
            {priceHistory.length > 0 ? (
              <DataTable
                columns={historyColumns}
                data={historyWithPrev.slice(0, 5)}
                loading={priceHistoryLoading}
              />
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 0' }}>
                {priceHistoryLoading
                  ? 'Loading previous batches…'
                  : `No previous purchases for "${selected.name}" yet — a new batch number will be assigned on save (e.g. ${nextBatchPreview}).`}
              </p>
            )}
          </div>
        )}

        {/* ─── Add Item Button ─────────────────────────────────────────── */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddItem}>Add Item</Button>
        </div>
      </Card>

      {/* ─── NEW: Product Form Modal ────────────────────────────────────── */}
      <ProductFormModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onProductCreated={handleProductCreated}
        isFromPurchase={true}  // Flag to indicate it's from purchase form
      />
    </>
  );
};

export default PurchaseForm;

//-------------------- 13.08.2026 ----------------------------------------
// import React, { useMemo, useRef, useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import { Plus, RotateCcw, History, ArrowUp, ArrowDown, Minus } from 'lucide-react';
// import { Card, SectionHeader, Input, Button, DataTable, Badge, toast } from '../ui/UI';
// import { fetchPriceHistory, clearPriceHistory } from '../../services/features/purchase/purchaseSlice';

// const fmt = (v) => (v === null || v === undefined ? '—' : `₹${Number(v).toFixed(2)}`);

// // Small up/down/flat indicator vs. the chronologically-previous batch.
// const Delta = ({ current, previous }) => {
//   if (current === null || current === undefined || previous === null || previous === undefined) return null;
//   const diff = Number(current) - Number(previous);
//   if (Math.abs(diff) < 0.005) return <Minus size={12} style={{ verticalAlign: 'middle', color: 'var(--text-muted)' }} />;
//   const up = diff > 0;
//   const Icon = up ? ArrowUp : ArrowDown;
//   return <Icon size={12} style={{ verticalAlign: 'middle', color: up ? 'var(--red)' : 'var(--green, #16a34a)', marginLeft: 4 }} />;
// };

// // Custom Number Input component with all the fixes applied
// const NumberInput = ({ label, error, hint, icon, iconRight, className = '', ...props }) => {
//   // Handle wheel event - prevent scroll changes
//   const handleWheel = (e) => {
//     e.preventDefault(); // Prevent default scroll behavior
//     e.target.blur(); // Remove focus to prevent accidental changes
//   };

//   // Handle keyboard arrows - prevent up/down arrow changes
//   const handleKeyDown = (e) => {
//     if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
//       e.preventDefault();
//     }
//     // Call any existing onKeyDown prop
//     if (props.onKeyDown) {
//       props.onKeyDown(e);
//     }
//   };

//   return (
//     <div className={`field ${className}`}>
//       {label && <label className="field-label">{label}</label>}
//       <div className="field-wrap">
//         {icon && <span className="field-icon-left">{icon}</span>}
//         <input 
//           className={`field-input ${icon ? 'has-icon-left' : ''} ${iconRight ? 'has-icon-right' : ''} ${error ? 'has-error' : ''}`} 
//           type="number"
//           onWheel={handleWheel}
//           onKeyDown={handleKeyDown}
//           {...props} 
//         />
//         {iconRight && <span className="field-icon-right">{iconRight}</span>}
//       </div>
//       {error && <p className="field-error">{error}</p>}
//       {hint && !error && <p className="field-hint">{hint}</p>}
//     </div>
//   );
// };

// /**
//  * "Add Items" product entry row. Reuses the searchable-product-dropdown
//  * pattern already used in Returns pages (custom absolute-positioned list),
//  * built on top of the shared Input primitive rather than inventing a new
//  * combobox component.
//  */
// const PurchaseForm = ({ products = [], onAddItem }) => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const { priceHistory, priceHistoryLoading } = useSelector((s) => s.purchases);
//   const [search, setSearch] = useState('');
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [qty, setQty] = useState('');
//   const [price, setPrice] = useState('');
//   const [gst, setGst] = useState('');
//   const [rackNo, setRackNo] = useState('');
//   const [itemCost, setItemCost] = useState('');
//   const [distributorPrice, setDistributorPrice] = useState('');
//   const [retailerPrice, setRetailerPrice] = useState('');
//   const [walkinPrice, setWalkinPrice] = useState('');
//   // Purchase Price and Item Cost represent the same thing (what you paid to
//   // acquire the item), so Item Cost auto-follows Purchase Price by default.
//   // The moment someone edits Item Cost directly, the link breaks for this
//   // row so their manual value isn't overwritten by further Purchase Price edits.
//   const [itemCostLinked, setItemCostLinked] = useState(true);
//   // Frozen snapshot taken the moment a product is selected — this never
//   // changes while you edit the fields above, so it's always safe to show
//   // "what this price used to be" even after you've typed a new value.
//   const [originalPrices, setOriginalPrices] = useState(null);
//   const wrapRef = useRef(null);

//   useEffect(() => {
//     const onClickOutside = (e) => {
//       if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
//     };
//     document.addEventListener('mousedown', onClickOutside);
//     return () => document.removeEventListener('mousedown', onClickOutside);
//   }, []);

//   const filtered = useMemo(() => {
//     if (!search.trim()) return [];
//     const q = search.toLowerCase();
//     return products
//       .filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
//       .slice(0, 20);
//   }, [search, products]);

//   const handleSelectProduct = (product) => {
//     setSelected(product);
//     setSearch(`${product.name} (${product.sku})`);
//     setShowDropdown(false);
//     const initialPrice = product.lastPurchasePrice ? String(product.lastPurchasePrice) : '';
//     setPrice(initialPrice);
//     setGst(product.gst !== undefined ? String(product.gst) : '');
//     setRackNo(product.rackNo || '');
//     // Item Cost starts equal to Purchase Price (same value, linked by default)
//     // rather than the product's old stored itemCost — see handlePriceChange.
//     setItemCost(initialPrice);
//     setDistributorPrice(product.distributorPrice !== undefined ? String(product.distributorPrice) : '');
//     setRetailerPrice(product.retailerPrice !== undefined ? String(product.retailerPrice) : '');
//     setWalkinPrice(product.walkinPrice !== undefined ? String(product.walkinPrice) : '');
//     setOriginalPrices({
//       itemCost: product.itemCost,
//       distributorPrice: product.distributorPrice,
//       retailerPrice: product.retailerPrice,
//       walkinPrice: product.walkinPrice,
//     });
//     setItemCostLinked(true);
//     dispatch(clearPriceHistory());
//     dispatch(fetchPriceHistory(product._id))
//       .unwrap()
//       .catch((err) => toast.error(err || 'Failed to load this product\'s price history'));
//   };

//   const resetRow = () => {
//     setSearch('');
//     setSelected(null);
//     setQty('');
//     setPrice('');
//     setGst('');
//     setRackNo('');
//     setItemCost('');
//     setDistributorPrice('');
//     setRetailerPrice('');
//     setWalkinPrice('');
//     setOriginalPrices(null);
//     setItemCostLinked(true);
//     dispatch(clearPriceHistory());
//   };

//   // Purchase Price drives Item Cost while they're linked.
//   const handlePriceChange = (value) => {
//     setPrice(value);
//     if (itemCostLinked) setItemCost(value);
//   };

//   // Editing Item Cost directly breaks the auto-sync for this row.
//   const handleItemCostChange = (value) => {
//     setItemCost(value);
//     setItemCostLinked(false);
//   };

//   const handleAddItem = () => {
//     if (!selected) return toast.error('Please search and select a product');
//     const q = Number(qty);
//     const p = Number(price);
//     if (!q || q <= 0) return toast.error('Enter a valid quantity');
//     if (p === undefined || Number.isNaN(p) || p < 0) return toast.error('Enter a valid purchase price');

//     onAddItem({
//       productId: selected._id,
//       sku: selected.sku,
//       name: selected.name,
//       quantity: q,
//       purchasePrice: p,
//       mrp: selected.mrp || 0,
//       gst: Number(gst) || 0,
//       rackNo,
//       batchNo: '', // assigned by the server on save
//       total: Math.round(q * p * 100) / 100,
//       // Reference prices — editable here so a purchase can also correct the
//       // product's stored pricing (e.g. supplier renegotiated cost). Sent as
//       // "if provided" values; the backend only overwrites when present.
//       itemCost: itemCost !== '' ? Number(itemCost) : undefined,
//       distributorPrice: distributorPrice !== '' ? Number(distributorPrice) : undefined,
//       retailerPrice: retailerPrice !== '' ? Number(retailerPrice) : undefined,
//       walkinPrice: walkinPrice !== '' ? Number(walkinPrice) : undefined,
//     });
//     resetRow();
//   };

//   const availableStock = selected?.moq ?? '';

//   // Preview only — the real batch number is generated server-side inside the
//   // save transaction (to avoid two simultaneous purchases racing to the same
//   // number). Batches are now date-stamped and numbered per-day across every
//   // product (e.g. B20260713-001), so the exact sequence isn't knowable from
//   // here — this just shows today's date stamp with an illustrative "001".
//   const nextBatchPreview = useMemo(() => {
//     const d = new Date();
//     const y = d.getFullYear();
//     const m = String(d.getMonth() + 1).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     return `B${y}${m}${day}-001`;
//   }, []);

//   // Pair each row with its chronologically-previous one (history is
//   // newest-first) so the Delta arrows have something to compare against.
//   const historyWithPrev = priceHistory.map((row, i) => ({
//     ...row,
//     _id: `${row.purchaseNumber}-${i}`,
//     __prev: priceHistory[i + 1] || null,
//   }));

//   const historyColumns = [
//     { key: 'batchNo', label: 'Batch No', render: (v) => <Badge variant="default">{v}</Badge> },
//     { key: 'invoiceDate', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
//     { key: 'supplierName', label: 'Supplier' },
//     {
//       key: 'purchasePrice', label: 'Purchase Price',
//       render: (v, row) => <span>{fmt(v)}<Delta current={v} previous={row.__prev?.purchasePrice} /></span>,
//     },
//     {
//       key: 'itemCost', label: 'Item Cost',
//       render: (v, row) => <span>{fmt(v)}<Delta current={v} previous={row.__prev?.itemCost} /></span>,
//     },
//   ];

//   // Renders "Current: ₹X" under a field, and a small revert icon once the
//   // user has actually changed the value away from what it was.
//   const priceFieldExtras = (fieldKey, liveValue, setLiveValue) => {
//     if (!originalPrices) return {};
//     const original = originalPrices[fieldKey];
//     const originalStr = original !== undefined && original !== null ? String(original) : '';
//     const changed = liveValue !== originalStr && originalStr !== '';
//     return {
//       hint: originalStr !== '' ? `Current: ₹${Number(original).toFixed(2)}` : 'Not set previously',
//       iconRight: changed ? (
//         <RotateCcw
//           size={14}
//           style={{ cursor: 'pointer' }}
//           title={`Revert to ₹${Number(original).toFixed(2)}`}
//           onClick={() => setLiveValue(originalStr)}
//         />
//       ) : undefined,
//     };
//   };

//   // Item Cost has its own hint logic: while linked to Purchase Price it says
//   // so explicitly; once broken it falls back to the normal "Current: ₹X" hint.
//   const itemCostExtras = () => {
//     if (itemCostLinked) {
//       return { hint: 'Synced with Purchase Price' };
//     }
//     return priceFieldExtras('itemCost', itemCost, (v) => { setItemCost(v); setItemCostLinked(false); });
//   };

//   return (
//     <Card className="card-pad">
//       <SectionHeader title="Add Items" />
//       <div className="form-row-3" ref={wrapRef} style={{ position: 'relative' }}>
//         <div style={{ position: 'relative' }}>
//           <Input
//             label="Search Product *"
//             placeholder="Search by name or SKU…"
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); setSelected(null); setShowDropdown(true); }}
//             onFocus={() => setShowDropdown(true)}
//             autoComplete="off"
//           />
//           {showDropdown && search.trim() && (
//             <div
//               style={{
//                 position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
//                 maxHeight: 220, overflowY: 'auto', background: 'var(--bg-modal)',
//                 border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
//                 boxShadow: 'var(--shadow-card)', marginTop: 4,
//               }}
//             >
//               {filtered.length === 0 ? (
//                 <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
//                   No products found
//                 </div>
//               ) : (
//                 filtered.map((p) => (
//                   <div
//                     key={p._id}
//                     onClick={() => handleSelectProduct(p)}
//                     style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
//                     onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
//                     onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//                   >
//                     <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{p.name}</div>
//                     <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
//                       SKU: {p.sku} | Stock: {p.moq ?? 0}
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//         <NumberInput label="Available Stock" value={availableStock} readOnly disabled />
//         <NumberInput 
//           label="Qty *" 
//           type="number" 
//           min="1" 
//           value={qty} 
//           onChange={(e) => setQty(e.target.value)} 
//         />
//       </div>
//       <div className="form-row-3" style={{ marginTop: 14 }}>
//         <NumberInput
//           label="Purchase Price *" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={price} 
//           onChange={(e) => handlePriceChange(e.target.value)}
//           hint="Also updates Item Cost below (unless you've edited it separately)"
//         />
//         <NumberInput 
//           label="MRP" 
//           type="number"
//           min="0"
//           step="0.01"
//           value={selected?.mrp ?? ''} 
//           readOnly 
//           disabled 
//         />
//         <NumberInput 
//           label="GST %" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={gst} 
//           onChange={(e) => setGst(e.target.value)} 
//         />
//       </div>
//       <div className="form-row-3" style={{ marginTop: 14 }}>
//         <NumberInput
//           label="Item Cost" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={itemCost} 
//           onChange={(e) => handleItemCostChange(e.target.value)}
//           {...itemCostExtras()}
//         />
//         <NumberInput
//           label="Distributor Price" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={distributorPrice} 
//           onChange={(e) => setDistributorPrice(e.target.value)}
//           {...priceFieldExtras('distributorPrice', distributorPrice, setDistributorPrice)}
//         />
//         <NumberInput
//           label="Retailer Price" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={retailerPrice} 
//           onChange={(e) => setRetailerPrice(e.target.value)}
//           {...priceFieldExtras('retailerPrice', retailerPrice, setRetailerPrice)}
//         />
//       </div>
//       <div className="form-row-3" style={{ marginTop: 14 }}>
//         <NumberInput
//           label="Walk-in Price" 
//           type="number" 
//           min="0" 
//           step="0.01"
//           value={walkinPrice} 
//           onChange={(e) => setWalkinPrice(e.target.value)}
//           {...priceFieldExtras('walkinPrice', walkinPrice, setWalkinPrice)}
//         />
//         <Input label="Rack Number" placeholder="e.g. R-02" value={rackNo} onChange={(e) => setRackNo(e.target.value)} />
//         <Input
//           label="Batch Number"
//           value={selected ? `${nextBatchPreview} (preview)` : 'Auto Generated'}
//           readOnly
//           disabled
//           hint={selected ? 'Confirmed only after Save Purchase' : ''}
//         />
//       </div>

//       {selected && (
//         <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
//           <SectionHeader
//             title="Price Variance by Batch"
//             count={priceHistory.length || undefined}
//             action={
//               <button
//                 type="button"
//                 onClick={() => navigate(`/purchase/product-price-history/${selected._id}`)}
//                 style={{
//                   display: 'inline-flex', alignItems: 'center', gap: 4,
//                   background: 'none', border: 'none', padding: 0, cursor: 'pointer',
//                   color: 'var(--red)', fontSize: 12, fontWeight: 600,
//                 }}
//               >
//                 <History size={12} /> Full History
//               </button>
//             }
//           />
//           {priceHistory.length > 0 ? (
//             <DataTable
//               columns={historyColumns}
//               data={historyWithPrev.slice(0, 5)}
//               loading={priceHistoryLoading}
//             />
//           ) : (
//             <p style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '8px 0' }}>
//               {priceHistoryLoading
//                 ? 'Loading previous batches…'
//                 : `No previous purchases for "${selected.name}" yet — a new batch number will be assigned on save (e.g. ${nextBatchPreview}).`}
//             </p>
//           )}
//         </div>
//       )}

//       <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
//         <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddItem}>Add Item</Button>
//       </div>
//     </Card>
//   );
// };

// export default PurchaseForm;

