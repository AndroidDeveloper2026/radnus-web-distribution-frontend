

// OrderCartPage.js - COMPLETE FIXED VERSION with batch-price validation and fallback

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, updateProductStock } from '../../services/features/products/productSlice';
import { fetchProductBatches, fetchBatchAvailability } from '../../services/features/purchase/purchaseSlice';
import { useTheme } from '../../context/ThemeContext';
import './OrderCartPage.css';

import { 
  Search, X, Package, ShoppingCart, Filter, Edit3, Save, XCircle, 
  Check, ChevronDown, Tag, Calendar, ChevronUp, AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ------------------ Helper functions ------------------
const getNum = (obj, key, fallback = 0) => {
  if (obj?.[key] !== undefined && obj?.[key] !== null) {
    const val = Number(obj[key]);
    if (!isNaN(val)) return val;
  }
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) {
    const val = Number(obj[spacedKey]);
    if (!isNaN(val)) return val;
  }
  return fallback;
};

const getStr = (obj, key, fallback = '') => {
  if (obj?.[key] !== undefined && obj?.[key] !== null) return String(obj[key]).trim();
  const spacedKey = key + ' ';
  if (obj?.[spacedKey] !== undefined && obj?.[spacedKey] !== null) return String(obj[spacedKey]).trim();
  return fallback;
};

const getId = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.$oid) return obj.$oid;
  return obj._id || obj.id;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
// -------------------------------------------------------

// ─── Batch Price Selector Component ──────────────────────────────────────

const BatchPriceSelector = ({ 
  batches, 
  selectedBatchIndex, 
  onSelectBatch,
  productName,
  isDark,
  availableBatches = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const batchesWithAvailability = useMemo(() => {
    if (!batches || batches.length === 0) return [];
    
    const availMap = {};
    availableBatches.forEach(b => {
      availMap[b.batchNo] = b.quantityAvailable || 0;
    });
    
    return batches.map((batch, originalIndex) => ({
      ...batch,
      originalIndex,
      availableQty: availMap[batch.batchNo] || 0,
      isAvailable: (availMap[batch.batchNo] || 0) > 0
    }));
  }, [batches, availableBatches]);

  const availableBatchesList = useMemo(() => {
    return batchesWithAvailability.filter(b => b.isAvailable && b.availableQty > 0);
  }, [batchesWithAvailability]);

  if (batchesWithAvailability.length === 0) {
    return (
      <div className="batch-info" style={{ 
        fontSize: '0.65rem', 
        color: isDark ? '#666' : '#999',
        marginTop: '2px',
        fontStyle: 'italic',
        padding: '4px 8px',
        background: isDark ? '#1a1a22' : '#f5f5f5',
        borderRadius: '4px',
        border: `1px dashed ${isDark ? '#3a3a42' : '#ddd'}`
      }}>
        <span>No batch history - using default price</span>
      </div>
    );
  }

  if (availableBatchesList.length === 0) {
    return (
      <div className="batch-info" style={{ 
        fontSize: '0.65rem', 
        color: isDark ? '#e88181' : '#d32f2f',
        marginTop: '2px',
        fontStyle: 'italic',
        fontWeight: 'bold',
        padding: '4px 8px',
        background: isDark ? '#2a1a1a' : '#fde8e8',
        borderRadius: '4px',
        border: `1px solid ${isDark ? '#4a2a2a' : '#f5c6c6'}`
      }}>
        ⛔ OUT OF STOCK - No batches available
      </div>
    );
  }

  const displayBatchesForSelection = availableBatchesList;
  const selectedBatch = batchesWithAvailability[selectedBatchIndex] || displayBatchesForSelection[0];

  const INITIAL_DISPLAY_COUNT = 3;
  const displayBatches = showAll 
    ? displayBatchesForSelection 
    : displayBatchesForSelection.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreBatches = displayBatchesForSelection.length > INITIAL_DISPLAY_COUNT;

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (isOpen) {
      setShowAll(false);
    }
  };

  return (
    <div className="batch-selector-wrapper" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="batch-selector-current"
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: '6px',
          background: isDark ? '#2a2a32' : '#f0f4f8',
          border: `1px solid ${isDark ? '#3a3a42' : '#e2e8f0'}`,
          transition: 'all 0.2s',
          flexWrap: 'wrap',
          width: '100%',
          minHeight: '30px',
          userSelect: 'none'
        }}
      >
        <Tag size={12} style={{ color: isDark ? '#888' : '#666', flexShrink: 0 }} />
        <span style={{ 
          fontSize: '0.7rem', 
          fontWeight: '600',
          color: isDark ? '#ddd' : '#333',
          fontFamily: 'monospace'
        }}>
          {selectedBatch.batchNo}
        </span>
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: '700',
          color: isDark ? '#81c784' : '#2e7d32'
        }}>
          ₹{Number(selectedBatch.purchasePrice || 0).toFixed(2)}
        </span>
        <span style={{ 
          fontSize: '0.55rem', 
          fontWeight: '600',
          color: selectedBatch.availableQty > 0 
            ? (isDark ? '#ffb74d' : '#e65100')
            : (isDark ? '#666' : '#999'),
          background: selectedBatch.availableQty > 0 
            ? (isDark ? '#3a2a1a' : '#fff3e0')
            : 'transparent',
          padding: '1px 6px',
          borderRadius: '8px'
        }}>
          Stock: {selectedBatch.availableQty || 0}
        </span>
        <span style={{ 
          fontSize: '0.55rem', 
          color: isDark ? '#666' : '#999',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          <Calendar size={10} />
          {formatDate(selectedBatch.invoiceDate)}
        </span>
        <span style={{ 
          marginLeft: 'auto',
          fontSize: '0.5rem',
          color: isDark ? '#555' : '#bbb',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ 
            background: isDark ? '#1f1f28' : '#e8e8e8',
            padding: '0 6px',
            borderRadius: '8px',
            fontSize: '0.5rem',
            fontWeight: '600'
          }}>
            {displayBatchesForSelection.length} batch{displayBatchesForSelection.length > 1 ? 'es' : ''} available
          </span>
          <ChevronDown 
            size={14} 
            style={{ 
              color: isDark ? '#666' : '#999',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0
            }} 
          />
        </span>
      </div>

      {isOpen && (
        <div 
          className="batch-selector-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: isDark ? '#1c1d24' : '#ffffff',
            border: `1px solid ${isDark ? '#3a3a42' : '#e2e8f0'}`,
            borderRadius: '8px',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.5)' 
              : '0 8px 32px rgba(0,0,0,0.12)',
            maxHeight: '320px',
            overflowY: 'auto',
            padding: '4px 0',
            minWidth: '220px'
          }}
        >
          <div style={{
            padding: '6px 12px',
            fontSize: '0.6rem',
            color: isDark ? '#666' : '#999',
            borderBottom: `1px solid ${isDark ? '#2a2a32' : '#f0f0f0'}`,
            background: isDark ? '#1a1a22' : '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <span>{displayBatchesForSelection.length} batch{displayBatchesForSelection.length > 1 ? 'es' : ''} available</span>
            <span style={{ fontSize: '0.5rem', color: isDark ? '#555' : '#ccc' }}>
              oldest first (FIFO)
            </span>
          </div>
          
          {displayBatches.map((batch, index) => {
            const isSelected = batch.originalIndex === selectedBatchIndex;
            const isNewest = index === 0;
            const isOldest = index === displayBatchesForSelection.length - 1 && displayBatchesForSelection.length > 1;
            
            return (
              <div
                key={index}
                className={`batch-option ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (batch.availableQty > 0) {
                    onSelectBatch(batch.originalIndex);
                    setIsOpen(false);
                    setShowAll(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: batch.availableQty > 0 ? 'pointer' : 'not-allowed',
                  opacity: batch.availableQty > 0 ? 1 : 0.5,
                  background: isSelected 
                    ? (isDark ? '#2a2a3a' : '#e8f0fe')
                    : 'transparent',
                  transition: 'all 0.15s',
                  borderBottom: index < displayBatches.length - 1 
                    ? `1px solid ${isDark ? '#2a2a32' : '#f0f0f0'}`
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && batch.availableQty > 0) {
                    e.currentTarget.style.background = isDark ? '#2a2a32' : '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: isSelected ? '600' : '400',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? '600' : '500',
                      color: isDark ? '#ddd' : '#333',
                      fontFamily: 'monospace'
                    }}>
                      {batch.batchNo}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: isDark ? '#81c784' : '#2e7d32'
                    }}>
                      ₹{Number(batch.purchasePrice || 0).toFixed(2)}
                    </span>
                    <span style={{ 
                      fontSize: '0.6rem',
                      fontWeight: '600',
                      color: batch.availableQty > 0 ? (isDark ? '#ffb74d' : '#e65100') : (isDark ? '#666' : '#999'),
                      background: batch.availableQty > 0 ? (isDark ? '#3a2a1a' : '#fff3e0') : 'transparent',
                      padding: '1px 6px',
                      borderRadius: '8px'
                    }}>
                      Stock: {batch.availableQty || 0}
                    </span>
                    {isNewest && (
                      <span style={{
                        fontSize: '0.5rem',
                        fontWeight: '700',
                        background: isDark ? '#1a3a2a' : '#e8f5e9',
                        color: isDark ? '#81c784' : '#2e7d32',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        NEWEST
                      </span>
                    )}
                    {isOldest && displayBatchesForSelection.length > 1 && (
                      <span style={{
                        fontSize: '0.5rem',
                        fontWeight: '700',
                        background: isDark ? '#2a1a1a' : '#fde8e8',
                        color: isDark ? '#e88181' : '#b91c1c',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        OLDEST (FIFO)
                      </span>
                    )}
                    {batch.availableQty === 0 && (
                      <span style={{
                        fontSize: '0.5rem',
                        fontWeight: '700',
                        background: isDark ? '#3a1a1a' : '#fde8e8',
                        color: isDark ? '#e88181' : '#b91c1c',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                      }}>
                        ⛔ OUT OF STOCK
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '0.6rem',
                    color: isDark ? '#666' : '#999',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Calendar size={10} />
                      {formatDate(batch.invoiceDate)}
                    </span>
                    {batch.invoiceNumber && (
                      <span style={{ fontSize: '0.5rem', color: isDark ? '#444' : '#ccc' }}>
                        {batch.invoiceNumber}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && batch.availableQty > 0 && (
                  <Check size={16} style={{ 
                    color: isDark ? '#81c784' : '#2e7d32',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }} />
                )}
              </div>
            );
          })}

          {hasMoreBatches && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
              style={{
                padding: '8px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                borderTop: `1px solid ${isDark ? '#2a2a32' : '#f0f0f0'}`,
                background: isDark ? '#1a1a22' : '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: isDark ? '#81c784' : '#2e7d32',
                fontSize: '0.65rem',
                fontWeight: '600',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? '#2a2a32' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? '#1a1a22' : '#fafafa';
              }}
            >
              {showAll ? (
                <>
                  <ChevronUp size={14} /> Show Less
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> Show All ({displayBatchesForSelection.length} batches)
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Price Type Selector ────────────────────────────────────────────────────

const PriceTypeSelector = ({ priceType, onSelectPriceType }) => {
  const options = [
    { label: 'Retailer', value: 'retailerPrice' },
    { label: 'Distributor', value: 'distributorPrice' },
    { label: 'Walk‑in', value: 'walkinPrice' },
    { label: 'MRP', value: 'mrp' },
  ];

  return (
    <div className="price-selector-row">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`price-option ${priceType === opt.value ? 'active' : ''}`}
          onClick={() => onSelectPriceType(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ─── Product Row ─────────────────────────────────────────────────────────────

const ProductRow = React.memo(({ 
  item, 
  onUpdateQty, 
  onQtyInputChange, 
  price, 
  onPriceChange,
  isEditingPrice,
  onTogglePriceEdit,
  onSavePriceEdit,
  batches,
  selectedBatchIndex,
  onSelectBatch,
  isDark,
  availableBatches = []
}) => {
  const stock = item.currentStock || 0;
  const [localQty, setLocalQty] = useState(item.qty.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState(price.toString());
  const inputRef = useRef(null);

  const selectedBatch = batches && batches.length > 0 && selectedBatchIndex !== undefined 
    ? batches[Math.min(selectedBatchIndex, batches.length - 1)] 
    : null;

  useEffect(() => {
    if (!isEditing) {
      setLocalQty(item.qty.toString());
    }
  }, [item.qty, isEditing]);

  useEffect(() => {
    if (!isEditingPrice) {
      setLocalPrice(price.toString());
    }
  }, [price, isEditingPrice]);

  useEffect(() => {
    if (selectedBatch && selectedBatch.purchasePrice > 0) {
      setLocalPrice(price.toString());
    }
  }, [selectedBatch, price]);

  const maxBatchQty = useMemo(() => {
    if (!availableBatches || availableBatches.length === 0) {
      return stock;
    }
    const batchIndex = Math.min(selectedBatchIndex, availableBatches.length - 1);
    const batch = availableBatches[batchIndex];
    return batch ? batch.quantityAvailable || 0 : stock;
  }, [availableBatches, selectedBatchIndex, stock]);

  const exceedsBatchStock = availableBatches.length > 0 && maxBatchQty > 0 && item.qty > maxBatchQty;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQty(value);
    
    if (value === '') {
      onQtyInputChange(item.id, 0);
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(numValue, stock, maxBatchQty || stock));
      onQtyInputChange(item.id, clampedValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    let numValue = parseInt(localQty, 10);
    if (isNaN(numValue)) numValue = 0;
    const clampedValue = Math.max(0, Math.min(numValue, stock, maxBatchQty || stock));
    onQtyInputChange(item.id, clampedValue);
    setLocalQty(clampedValue.toString());
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handlePriceInputChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    setLocalPrice(value);
  };

  const handlePriceBlur = () => {
    let numValue = parseFloat(localPrice);
    if (isNaN(numValue) || numValue < 0) numValue = 0;
    setLocalPrice(numValue.toString());
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      const numValue = parseFloat(localPrice);
      if (!isNaN(numValue) && numValue >= 0) {
        onSavePriceEdit(item.id, numValue);
      }
    }
  };

  const handleSavePrice = () => {
    const numValue = parseFloat(localPrice);
    if (!isNaN(numValue) && numValue >= 0) {
      onSavePriceEdit(item.id, numValue);
    } else {
      setLocalPrice(price.toString());
      onTogglePriceEdit(item.id);
    }
  };

  const handleCancelPriceEdit = () => {
    setLocalPrice(price.toString());
    onTogglePriceEdit(item.id);
  };

  const isIncrementDisabled = useMemo(() => {
    const currentQty = item.qty || 0;
    const maxAllowed = Math.min(stock, maxBatchQty || stock);
    return currentQty >= maxAllowed;
  }, [item.qty, stock, maxBatchQty]);

  return (
    <div className="product-card">
      <div className="product-row">
        <div className="product-image-placeholder">
          {item.image ? (
            <img src={item.image} alt={item.name} className="product-image" />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>

        <div className="product-info">
          <div className="product-name">{item.name}</div>
          <div className="product-meta">SKU: {item.sku}</div>
          <div className="product-meta">Stock: {stock} units</div>
          
          <div className="batch-selector-container">
            <BatchPriceSelector 
              batches={batches}
              selectedBatchIndex={selectedBatchIndex}
              onSelectBatch={(index) => onSelectBatch(item.id, index)}
              productName={item.name}
              isDark={isDark}
              availableBatches={availableBatches}
            />
          </div>
          
          {exceedsBatchStock && (
            <div style={{ 
              fontSize: '0.6rem', 
              color: '#d32f2f',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <AlertCircle size={12} />
              Quantity exceeds available stock for this batch ({maxBatchQty} units)
            </div>
          )}
          
          <div className="product-price-row">
            {isEditingPrice ? (
              <div className="price-edit-container">
                <span className="price-edit-label">₹</span>
                <input
                  type="text"
                  className="price-edit-input"
                  value={localPrice}
                  onChange={handlePriceInputChange}
                  onBlur={handlePriceBlur}
                  onKeyDown={handlePriceKeyDown}
                  autoFocus
                  placeholder="Enter price"
                />
                <button 
                  className="price-edit-save-btn" 
                  onClick={handleSavePrice}
                  title="Save price"
                >
                  <Save size={14} />
                </button>
                <button 
                  className="price-edit-cancel-btn" 
                  onClick={handleCancelPriceEdit}
                  title="Cancel"
                >
                  <XCircle size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="product-price">₹{Number(price).toLocaleString('en-IN')}</span>
                {selectedBatch && (
                  <span style={{
                    fontSize: '0.55rem',
                    color: isDark ? '#666' : '#999',
                    marginLeft: '2px',
                    fontFamily: 'monospace'
                  }}>
                    ({selectedBatch.batchNo})
                  </span>
                )}
                <button 
                  className="price-edit-toggle-btn"
                  onClick={() => onTogglePriceEdit(item.id)}
                  title="Edit price"
                >
                  <Edit3 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="stepper">
          <button
            className="qty-btn"
            onClick={() => onUpdateQty(item.id, 'dec')}
            disabled={item.qty === 0}
          >
            −
          </button>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="qty-input"
            value={localQty}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <button
            className="qty-btn"
            onClick={() => onUpdateQty(item.id, 'inc')}
            disabled={isIncrementDisabled}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
});

// ✅ PERF FIX: ProductRow is now wrapped in React.memo (above). Previously,
// `cart` held the ENTIRE product catalog (not just added items), so
// clicking "+"/"-" replaced the whole cart array and re-rendered every
// single product row on the page — that's why the number you clicked on
// took a noticeable moment to actually update. With React.memo, only the
// one row whose `item` reference actually changed re-renders; all the
// other rows keep their previous render output untouched.
ProductRow.displayName = 'ProductRow';

// ─── Main Component ─────────────────────────────────────────────────────────

const OrderCartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const products = useSelector(state => state.products.list);
  const { productBatches, productBatchesLoading } = useSelector(state => state.purchases);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [priceType, setPriceType] = useState('retailerPrice');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [selectedBatchMap, setSelectedBatchMap] = useState({});
  const [batchAvailability, setBatchAvailability] = useState({});
  const hasInitialized = useRef(false);
  const batchFetched = useRef(false);

  const categories = useMemo(() => {
    if (!products.length) return [];
    const cats = new Set();
    products.forEach(product => {
      const category = getStr(product, 'category');
      if (category) cats.add(category);
    });
    return Array.from(cats).sort();
  }, [products]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchProducts());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  const stockDataMap = useMemo(() => {
    if (!products.length) return new Map();

    const stockMap = new Map();
    products.forEach(product => {
      const id = getId(product._id);
      const moq = getNum(product, 'moq', 0);
      const category = getStr(product, 'category');

      stockMap.set(id, {
        id,
        name: getStr(product, 'name'),
        sku: getStr(product, 'sku'),
        category: category,
        retailerPrice: getNum(product, 'retailerPrice'),
        distributorPrice: getNum(product, 'distributorPrice'),
        walkinPrice: getNum(product, 'walkinPrice'),
        mrp: getNum(product, 'mrp'),
        image: product.image ?? null,
        availableStock: moq,
      });
    });

    return stockMap;
  }, [products]);

  useEffect(() => {
    if (!stockDataMap.size) return;
    if (hasInitialized.current) return;

    const newCart = Array.from(stockDataMap.values()).map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      retailerPrice: item.retailerPrice,
      distributorPrice: item.distributorPrice,
      walkinPrice: item.walkinPrice,
      mrp: item.mrp,
      image: item.image,
      currentStock: item.availableStock,
      qty: 0,
      customPrices: {
        retailerPrice: item.retailerPrice,
        distributorPrice: item.distributorPrice,
        walkinPrice: item.walkinPrice,
        mrp: item.mrp,
      },
      priceModified: {
        retailerPrice: false,
        distributorPrice: false,
        walkinPrice: false,
        mrp: false,
      },
      addedToCartAt: null,
      selectedBatchIndex: 0,
      _currentBatchForPrice: null,
    }));
    setCart(newCart);
    hasInitialized.current = true;
  }, [stockDataMap]);

  useEffect(() => {
    if (!cart.length || batchFetched.current) return;
    
    const productIds = cart.map(item => item.id).filter(id => id);
    if (productIds.length > 0) {
      dispatch(fetchProductBatches(productIds));
      
      productIds.forEach(productId => {
        dispatch(fetchBatchAvailability(productId)).then((result) => {
          if (result.payload) {
            setBatchAvailability(prev => ({
              ...prev,
              [result.payload.productId]: result.payload.batches
            }));
          }
        });
      });
      
      batchFetched.current = true;
    }
  }, [cart, dispatch]);

  useEffect(() => {
    if (Object.keys(productBatches).length > 0) {
      const newSelectedBatchMap = { ...selectedBatchMap };
      let hasChanges = false;
      
      Object.keys(productBatches).forEach(productId => {
        const batches = productBatches[productId] || [];
        const available = batchAvailability[productId] || [];
        
        if (batches.length > 0) {
          if (selectedBatchMap[productId] === undefined) {
            let validIndex = 0;
            if (available.length > 0) {
              const firstAvailableBatch = available[0];
              const historyIndex = batches.findIndex(b => b.batchNo === firstAvailableBatch.batchNo);
              validIndex = historyIndex >= 0 ? historyIndex : 0;
            }
            newSelectedBatchMap[productId] = validIndex;
            hasChanges = true;
          } else {
            const currentIndex = selectedBatchMap[productId];
            const currentBatch = batches[currentIndex];
            const isStillAvailable = available.some(b => b.batchNo === currentBatch?.batchNo && b.quantityAvailable > 0);
            
            if (!isStillAvailable && available.length > 0) {
              const firstAvailableBatch = available[0];
              const historyIndex = batches.findIndex(b => b.batchNo === firstAvailableBatch.batchNo);
              newSelectedBatchMap[productId] = historyIndex >= 0 ? historyIndex : 0;
              hasChanges = true;
            }
          }
        }
      });
      
      if (hasChanges) {
        setSelectedBatchMap(newSelectedBatchMap);
      }
    }
  }, [productBatches, batchAvailability]);

  useEffect(() => {
    if (Object.keys(selectedBatchMap).length === 0) return;
    if (Object.keys(productBatches).length === 0) return;

    let needsUpdate = false;
    const updatedCart = cart.map(item => {
      const batchIndex = selectedBatchMap[item.id];
      if (batchIndex === undefined) return item;
      
      const batches = productBatches[item.id] || [];
      const selectedBatch = batches[batchIndex];
      
      if (!selectedBatch) return item;
      
      const priceToUse = getPriceFromBatch(selectedBatch, priceType);
      const currentPrice = item.customPrices?.[priceType];
      
      const needsPriceUpdate = currentPrice !== priceToUse;
      const needsBatchUpdate = item._currentBatchForPrice?.batchNo !== selectedBatch.batchNo;
      
      if (needsPriceUpdate || needsBatchUpdate) {
        needsUpdate = true;
        return {
          ...item,
          customPrices: {
            ...item.customPrices,
            [priceType]: priceToUse
          },
          priceModified: {
            ...item.priceModified,
            [priceType]: false
          },
          selectedBatchIndex: batchIndex,
          _currentBatchForPrice: {
            batchNo: selectedBatch.batchNo,
            priceType: priceType,
            price: priceToUse
          }
        };
      }
      return item;
    });

    if (needsUpdate) {
      setCart(updatedCart);
    }
  }, [selectedBatchMap, productBatches, priceType]);

  const updateQty = useCallback((id, type) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const oldItem = prev[index];
      let newQty = oldItem.qty;
      
      const availBatches = batchAvailability[id] || [];
      const batchIndex = selectedBatchMap[id] ?? 0;
      const selectedBatch = availBatches[batchIndex];
      const maxBatchQty = selectedBatch ? selectedBatch.quantityAvailable || 0 : oldItem.currentStock;
      const maxAllowed = Math.min(oldItem.currentStock, maxBatchQty || oldItem.currentStock);
      
      if (type === 'inc') newQty++;
      if (type === 'dec') newQty--;
      
      newQty = Math.max(0, Math.min(newQty, maxAllowed));
      if (newQty === oldItem.qty) return prev;
      
      const newItem = { ...oldItem, qty: newQty };
      
      if (oldItem.qty === 0 && newQty > 0) {
        newItem.addedToCartAt = Date.now();
      }
      if (oldItem.qty > 0 && newQty === 0) {
        newItem.addedToCartAt = null;
      }
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, [batchAvailability, selectedBatchMap]);

  const updateQtyDirect = useCallback((id, newQty) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const oldItem = prev[index];
      
      const availBatches = batchAvailability[id] || [];
      const batchIndex = selectedBatchMap[id] ?? 0;
      const selectedBatch = availBatches[batchIndex];
      const maxBatchQty = selectedBatch ? selectedBatch.quantityAvailable || 0 : oldItem.currentStock;
      const maxAllowed = Math.min(oldItem.currentStock, maxBatchQty || oldItem.currentStock);
      
      const clampedQty = Math.max(0, Math.min(newQty, maxAllowed));
      if (clampedQty === oldItem.qty) return prev;
      
      const newItem = { ...oldItem, qty: clampedQty };
      
      if (oldItem.qty === 0 && clampedQty > 0) {
        newItem.addedToCartAt = Date.now();
      }
      if (oldItem.qty > 0 && clampedQty === 0) {
        newItem.addedToCartAt = null;
      }
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, [batchAvailability, selectedBatchMap]);

  const getPriceFromBatch = useCallback((batch, priceTypeKey) => {
    if (!batch) return 0;
    
    switch(priceTypeKey) {
      case 'retailerPrice':
        return batch.retailerPrice || batch.purchasePrice || 0;
      case 'distributorPrice':
        return batch.distributorPrice || batch.purchasePrice || 0;
      case 'walkinPrice':
        return batch.walkinPrice || batch.purchasePrice || 0;
      case 'mrp':
        return batch.mrp || batch.purchasePrice || 0;
      default:
        return batch.purchasePrice || 0;
    }
  }, []);

  const handleSelectBatch = useCallback((productId, batchIndex) => {
    setSelectedBatchMap(prev => ({
      ...prev,
      [productId]: batchIndex
    }));
  }, []);

  // ✅ FIX: normalize the "no batch" case to the SAME sentinel value (null)
  // on both the write side (saveCustomPrice) and the read side
  // (getCurrentPrice). Previously saveCustomPrice stored `null` for
  // `batchNo` when there was no selected batch, but getCurrentPrice
  // compared against `selectedBatch?.batchNo`, which evaluates to
  // `undefined` (not `null`) when there's no batch. `null === undefined`
  // is `false` in JS, so the freshly-saved custom price was immediately
  // rejected on the very next render and the UI fell back to the old
  // default price — exactly the "price resets after saving" bug.
  const getCurrentPrice = useCallback((item) => {
    const batchIndex = selectedBatchMap[item.id] ?? 0;
    const batches = productBatches[item.id] || [];
    const selectedBatch = batches[batchIndex];
    
    let batchPrice = 0;
    if (selectedBatch && selectedBatch.purchasePrice > 0) {
      batchPrice = getPriceFromBatch(selectedBatch, priceType);
    }
    
    const customPrice = item.customPrices?.[priceType];
    const isPriceModified = item.priceModified?.[priceType] === true;
    const savedBatchNo = item._currentBatchForPrice?.batchNo ?? null;
    const currentBatchNo = selectedBatch?.batchNo ?? null;
    const isCustomPriceForCurrentBatch = savedBatchNo === currentBatchNo;
    
    if (isPriceModified && 
        isCustomPriceForCurrentBatch && 
        customPrice !== undefined) {
      return customPrice;
    }
    
    if (batchPrice > 0) {
      return batchPrice;
    }
    
    return item[priceType] || 0;
  }, [priceType, productBatches, selectedBatchMap, getPriceFromBatch]);

  const togglePriceEdit = useCallback((id) => {
    setEditingPriceId(prev => prev === id ? null : id);
  }, []);

  const saveCustomPrice = useCallback((id, newPrice) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const item = prev[index];
      const batches = productBatches[item.id] || [];
      const batchIndex = selectedBatchMap[item.id] ?? 0;
      const selectedBatch = batches[batchIndex];
      
      const updatedItem = {
        ...item,
        customPrices: {
          ...item.customPrices,
          [priceType]: newPrice
        },
        priceModified: {
          ...item.priceModified,
          [priceType]: true
        },
        _currentBatchForPrice: {
          // ✅ FIX: use ?? (not ||) and normalize consistently with
          // getCurrentPrice's `selectedBatch?.batchNo ?? null` so the two
          // checks always agree on "no batch selected".
          batchNo: selectedBatch?.batchNo ?? null,
          priceType: priceType,
          price: newPrice
        }
      };
      
      const newCart = [...prev];
      newCart[index] = updatedItem;
      return newCart;
    });
    setEditingPriceId(null);
  }, [priceType, productBatches, selectedBatchMap]);

  const handlePriceTypeChange = useCallback((newPriceType) => {
    setPriceType(newPriceType);
    
    setCart(prev => {
      const updatedCart = prev.map(item => {
        const batches = productBatches[item.id] || [];
        const batchIndex = selectedBatchMap[item.id] ?? 0;
        const selectedBatch = batches[batchIndex];
        
        if (selectedBatch && selectedBatch.purchasePrice > 0) {
          const priceToUse = getPriceFromBatch(selectedBatch, newPriceType);
          
          return {
            ...item,
            customPrices: {
              ...item.customPrices,
              [newPriceType]: priceToUse
            },
            priceModified: {
              ...item.priceModified,
              [newPriceType]: false
            },
            _currentBatchForPrice: {
              batchNo: selectedBatch.batchNo,
              priceType: newPriceType,
              price: priceToUse
            }
          };
        }
        return item;
      });
      return updatedCart;
    });
  }, [productBatches, selectedBatchMap, getPriceFromBatch]);

  const filteredAndSortedCart = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    let filtered = cart;
    
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return [...filtered].sort((a, b) => {
      if (a.qty > 0 && b.qty > 0) {
        const timeA = a.addedToCartAt || 0;
        const timeB = b.addedToCartAt || 0;
        return timeA - timeB;
      }
      if (a.qty > 0 && b.qty === 0) return -1;
      if (a.qty === 0 && b.qty > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [cart, searchQuery, selectedCategory]);

  const cartItems = useMemo(() => {
    const selected = cart.filter(item => item.qty > 0);
    return [...selected].sort((a, b) => {
      const timeA = a.addedToCartAt || 0;
      const timeB = b.addedToCartAt || 0;
      return timeA - timeB;
    });
  }, [cart]);

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const totalAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (getCurrentPrice(item) || 0) * item.qty, 0),
    [cartItems, getCurrentPrice]
  );

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }

    const validationErrors = [];
    const batchAllocations = {};

    cartItems.forEach(item => {
      const availBatches = batchAvailability[item.id] || [];
      const selectedIndex = selectedBatchMap[item.id] ?? 0;
      const selectedBatch = availBatches[selectedIndex];
      
      const allBatches = productBatches[item.id] || [];
      const selectedBatchInfo = allBatches[selectedIndex];
      
      if (!selectedBatchInfo) {
        batchAllocations[item.id] = {
          productId: item.id,
          name: item.name,
          qty: item.qty,
          price: item[priceType] || 0,
          batchAllocations: [],
          noBatch: true,
          useDefaultPrice: true
        };
        return;
      }

      const maxQty = selectedBatch ? selectedBatch.quantityAvailable || 0 : item.currentStock;
      if (item.qty > maxQty && maxQty > 0) {
        validationErrors.push({
          name: item.name,
          maxQty: maxQty,
          requestedQty: item.qty
        });
        return;
      }

      batchAllocations[item.id] = {
        productId: item.id,
        name: item.name,
        qty: item.qty,
        price: getCurrentPrice(item) || 0,
        batchAllocations: [{
          batchNumber: selectedBatchInfo.batchNo,
          qty: item.qty,
          purchaseCost: selectedBatchInfo.purchasePrice || 0,
          batchIndex: selectedIndex
        }]
      };
    });

    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.map(e => 
        `${e.name}: Requested ${e.requestedQty}, Available ${e.maxQty}`
      ).join('\n');
      alert(`Cannot place order:\n${errorMsg}`);
      return;
    }

    setIsOrderPlacing(true);

    try {
      const orderedItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: getCurrentPrice(item) || 0,
        originalPrice: item[priceType] || 0,
        priceModified: item.priceModified?.[priceType] || false,
        batchAllocations: batchAllocations[item.id]?.batchAllocations || [],
        noBatch: batchAllocations[item.id]?.noBatch || false,
        useDefaultPrice: batchAllocations[item.id]?.useDefaultPrice || false
      }));

      navigate('/order-success', {
        state: {
          cartItems: orderedItems,
          grandTotal: totalAmount,
          paymentMode: 'cash',
          date: new Date().toISOString(),
          priceType: priceType,
          batchSelections: batchAllocations,
          showBatchSelector: true,
          hasDefaultBatches: Object.values(batchAllocations).some(b => b.noBatch || b.useDefaultPrice)
        }
      });

      setCart(prev => {
        const updatedCart = prev.map(item => {
          const orderedItem = cartItems.find(ci => ci.id === item.id);
          if (orderedItem) {
            const newStock = Math.max(0, item.currentStock - orderedItem.qty);
            
            return {
              ...item,
              currentStock: newStock,
              qty: 0,
              addedToCartAt: null,
              priceModified: {
                retailerPrice: false,
                distributorPrice: false,
                walkinPrice: false,
                mrp: false
              },
              customPrices: {
                retailerPrice: item.retailerPrice,
                distributorPrice: item.distributorPrice,
                walkinPrice: item.walkinPrice,
                mrp: item.mrp
              },
              _currentBatchForPrice: null
            };
          }
          return item;
        });
        return updatedCart;
      });

      setSelectedBatchMap({});

    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsOrderPlacing(false);
    }
  };

  const clearCategoryFilter = () => {
    setSelectedCategory('');
  };

  if (isLoading) {
    return (
      <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
        <LoadingSpinner message="Loading products..." />
      </div>
    );
  }

  return (
    <div className={`order-cart-page ${isDark ? 'dark' : ''}`}>
      <div className="cart-main">
        <div className="cart-header">
          <h1>
            My Cart
            <span className="cart-count-badge">({totalItems})</span>
          </h1>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear">
                <X size={16} />
              </button>
            )}
          </div>
          
          {categories.length > 0 && (
            <div className="category-filter-section">
              <div className="filter-wrapper">
                <Filter size={16} className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {selectedCategory && (
                  <button onClick={clearCategoryFilter} className="filter-clear">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {searchQuery && (
            <div className="result-count">
              {filteredAndSortedCart.length} result{filteredAndSortedCart.length !== 1 ? 's' : ''} found
            </div>
          )}
          
          <PriceTypeSelector 
            priceType={priceType} 
            onSelectPriceType={handlePriceTypeChange} 
          />
        </div>

        <div className="product-grid">
          {filteredAndSortedCart.map(product => {
            const productId = product.id;
            const batches = productBatches?.[productId] || [];
            const selectedBatchIndex = selectedBatchMap?.[productId] ?? 0;
            const availableBatches = batchAvailability?.[productId] || [];
            
            return (
              <ProductRow
                key={product.id}
                item={product}
                onUpdateQty={updateQty}
                onQtyInputChange={updateQtyDirect}
                price={getCurrentPrice(product)}
                onPriceChange={saveCustomPrice}
                isEditingPrice={editingPriceId === product.id}
                onTogglePriceEdit={togglePriceEdit}
                onSavePriceEdit={saveCustomPrice}
                batches={batches}
                selectedBatchIndex={selectedBatchIndex}
                onSelectBatch={handleSelectBatch}
                isDark={isDark}
                availableBatches={availableBatches}
              />
            );
          })}
        </div>

        {filteredAndSortedCart.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>
              {selectedCategory 
                ? `No products found in "${selectedCategory}" category${searchQuery ? ` matching "${searchQuery}"` : ''}`
                : searchQuery 
                  ? `No products match "${searchQuery}"`
                  : 'No products available'}
            </p>
          </div>
        )}
      </div>

      <div className="order-summary-panel">
        <div className="summary-header">
          <ShoppingCart size={20} />
          <span>Order Summary</span>
        </div>

        <div className="summary-scrollable">
          {cartItems.length === 0 ? (
            <div className="summary-empty">No items added yet</div>
          ) : (
            cartItems.map((item, idx) => {
              const currentPrice = getCurrentPrice(item);
              const originalPrice = item[priceType] || 0;
              const isPriceModified = item.priceModified?.[priceType] || false;
              const isPriceReduced = isPriceModified && currentPrice < originalPrice;
              const isPriceIncreased = isPriceModified && currentPrice > originalPrice;
              
              const batches = productBatches?.[item.id] || [];
              const batchIndex = selectedBatchMap?.[item.id] ?? 0;
              const selectedBatch = batches[batchIndex];
              
              return (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-name">
                    <span className="item-order-number">{idx + 1}.</span> {item.name}
                    {selectedBatch && (
                      <span style={{ 
                        fontSize: '0.55rem', 
                        color: isDark ? '#666' : '#999',
                        background: isDark ? '#1f1f28' : '#f5f5f5',
                        padding: '1px 6px',
                        borderRadius: '8px',
                        marginLeft: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {selectedBatch.batchNo}
                      </span>
                    )}
                    {isPriceModified && (
                      <span className={`price-badge ${isPriceReduced ? 'price-reduced' : 'price-increased'}`}>
                        {isPriceReduced ? '⬇' : '⬆'}
                      </span>
                    )}
                  </div>
                  <div className="summary-item-right">
                    <span className="summary-item-qty">×{item.qty}</span>
                    <span className="summary-item-price">
                      ₹{((currentPrice || 0) * item.qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="summary-divider" />

        <div className="summary-row subtotal">
          <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="summary-divider" />

        <div className="summary-row grand-total">
          <span>Total</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <button
          className="place-order-btn"
          onClick={handlePlaceOrder}
          disabled={cartItems.length === 0 || isOrderPlacing}
        >
          {isOrderPlacing ? 'PLACING ORDER...' : 'PLACE ORDER'}
        </button>
      </div>
    </div>
  );
};

export default OrderCartPage;
