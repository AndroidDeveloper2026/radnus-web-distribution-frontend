// OrderCartPage.js - COMPLETE FIXED VERSION with Working Price Edit

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, updateProductStock } from '../../services/features/products/productSlice';
import { fetchProductBatches, fetchBatchAvailability } from '../../services/features/purchase/purchaseSlice';
import { useTheme } from '../../context/ThemeContext';
import './OrderCartPage.css';

import { 
  Search, X, Package, ShoppingCart, Filter, Edit3, Save, XCircle, 
  Check, ChevronDown, Tag, Calendar, ChevronUp, AlertCircle, Layers
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
  selectedBatchNo,
  onSelectBatch,
  productName,
  isDark,
  availableBatches = [],
  batchQuantities = {}
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
    
    return batches.map((batch) => ({
      ...batch,
      availableQty: availMap[batch.batchNo] || 0,
      isAvailable: (availMap[batch.batchNo] || 0) > 0,
      selectedQty: batchQuantities[batch.batchNo] || 0
    }));
  }, [batches, availableBatches, batchQuantities]);

  const availableBatchesList = useMemo(() => {
    return batchesWithAvailability.filter(b => b.isAvailable && b.availableQty > 0);
  }, [batchesWithAvailability]);

  const totalSelectedQty = useMemo(() => {
    return Object.values(batchQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [batchQuantities]);

  const hasNoBatches = !batches || batches.length === 0;

  if (hasNoBatches) {
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
  const selectedBatch = batchesWithAvailability.find(b => b.batchNo === selectedBatchNo) || displayBatchesForSelection[0];

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
        {selectedBatch.selectedQty > 0 && (
          <span style={{ 
            fontSize: '0.55rem', 
            fontWeight: '700',
            color: isDark ? '#64b5f6' : '#1565c0',
            background: isDark ? '#1a2a3a' : '#e3f2fd',
            padding: '1px 6px',
            borderRadius: '8px'
          }}>
            Selected: {selectedBatch.selectedQty}
          </span>
        )}
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
          {totalSelectedQty > 0 && (
            <span style={{
              fontSize: '0.5rem',
              fontWeight: '700',
              color: isDark ? '#64b5f6' : '#1565c0',
              background: isDark ? '#1a2a3a' : '#e3f2fd',
              padding: '0 6px',
              borderRadius: '8px'
            }}>
              Total: {totalSelectedQty} units
            </span>
          )}
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
              Click to select batch
            </span>
          </div>
          
          {displayBatches.map((batch) => {
            const isSelected = batch.batchNo === selectedBatchNo;
            const isNewest = batch === displayBatchesForSelection[0];
            const isOldest = batch === displayBatchesForSelection[displayBatchesForSelection.length - 1] && displayBatchesForSelection.length > 1;
            const hasSelectedQty = batch.selectedQty > 0;
            
            return (
              <div
                key={batch.batchNo}
                className={`batch-option ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (batch.availableQty > 0) {
                    onSelectBatch(batch.batchNo);
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
                    : (hasSelectedQty ? (isDark ? '#1a2a1a' : '#e8f5e9') : 'transparent'),
                  transition: 'all 0.15s',
                  borderBottom: batch !== displayBatches[displayBatches.length - 1] 
                    ? `1px solid ${isDark ? '#2a2a32' : '#f0f0f0'}`
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && batch.availableQty > 0) {
                    e.currentTarget.style.background = isDark ? '#2a2a32' : '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !hasSelectedQty) {
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
                    {hasSelectedQty && (
                      <span style={{
                        fontSize: '0.55rem',
                        fontWeight: '700',
                        color: isDark ? '#64b5f6' : '#1565c0',
                        background: isDark ? '#1a2a3a' : '#e3f2fd',
                        padding: '1px 6px',
                        borderRadius: '8px'
                      }}>
                        Qty: {batch.selectedQty}
                      </span>
                    )}
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
                        OLDEST
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
  onUpdateBatchQty,
  onSelectBatch,
  onQtyInputChange,
  getPriceForBatch,
  getCurrentPrice,
  isEditingPrice,
  onTogglePriceEdit,
  onSaveBatchPrice,
  onSaveDefaultPrice,
  batches,
  selectedBatchNo,
  isDark,
  availableBatches = [],
  batchQuantities = {},
  priceType
}) => {
  const stock = item.currentStock || 0;
  const [localQty, setLocalQty] = useState('0');
  const [isEditing, setIsEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState('');
  const inputRef = useRef(null);
  const priceInputRef = useRef(null);

  // Get current selected batch
  const selectedBatch = batches?.find(b => b.batchNo === selectedBatchNo) || null;
  
  // Check if product has batch history
  const hasBatches = batches && batches.length > 0;
  
  // Get quantity for selected batch
  const currentBatchQty = batchQuantities[selectedBatchNo] || 0;
  
  // Get stock for selected batch
  const selectedBatchStock = useMemo(() => {
    if (!selectedBatch) return stock;
    const availBatch = availableBatches.find(b => b.batchNo === selectedBatch.batchNo);
    return availBatch ? availBatch.quantityAvailable || 0 : 0;
  }, [availableBatches, selectedBatch, stock]);

  // Get total quantity across all batches
  const totalQty = useMemo(() => {
    return Object.values(batchQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [batchQuantities]);

  // Get current price - FIXED: Works for both batch and no-batch products
  const currentPrice = useMemo(() => {
    if (hasBatches && selectedBatchNo) {
      // Product with batches - get price for specific batch
      const price = getPriceForBatch(item.id, selectedBatchNo);
      return price;
    } else {
      // Product without batches or no batch selected - use default price
      // Check if there's a custom default price saved
      if (item.customDefaultPrice && item.customDefaultPrice[priceType] !== undefined && item.customDefaultPrice[priceType] !== null) {
        return item.customDefaultPrice[priceType];
      }
      return item[priceType] || 0;
    }
  }, [item, selectedBatchNo, hasBatches, getPriceForBatch, priceType]);

  // Get all batch allocations for summary display
  const batchAllocations = useMemo(() => {
    const allocations = [];
    Object.entries(batchQuantities).forEach(([batchNo, qty]) => {
      if (qty > 0) {
        const batch = batches?.find(b => b.batchNo === batchNo);
        const price = getPriceForBatch(item.id, batchNo);
        allocations.push({
          batchNo,
          qty,
          price,
          subtotal: qty * price
        });
      }
    });
    return allocations;
  }, [batchQuantities, batches, item.id, getPriceForBatch]);

  // Reset local quantity when batch changes
  useEffect(() => {
    if (!isEditing) {
      setLocalQty(currentBatchQty.toString());
    }
  }, [currentBatchQty, isEditing]);

  // Reset local price when price changes or edit mode opens
  useEffect(() => {
    setLocalPrice(String(currentPrice));
  }, [currentPrice, isEditingPrice]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQty(value);
    
    if (value === '') {
      onQtyInputChange(item.id, selectedBatchNo, 0);
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(numValue, selectedBatchStock));
      onQtyInputChange(item.id, selectedBatchNo, clampedValue);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    let numValue = parseInt(localQty, 10);
    if (isNaN(numValue)) numValue = 0;
    const clampedValue = Math.max(0, Math.min(numValue, selectedBatchStock));
    onQtyInputChange(item.id, selectedBatchNo, clampedValue);
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
    setLocalPrice(String(numValue));
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      const numValue = parseFloat(localPrice);
      if (!isNaN(numValue) && numValue >= 0) {
        savePrice(numValue);
      }
    }
  };

  const handleSavePrice = () => {
    const numValue = parseFloat(localPrice);
    if (!isNaN(numValue) && numValue >= 0) {
      savePrice(numValue);
    } else {
      setLocalPrice(String(currentPrice));
      onTogglePriceEdit(item.id);
    }
  };

  const savePrice = (numValue) => {
    if (hasBatches && selectedBatchNo) {
      // Save custom price for specific batch
      onSaveBatchPrice(item.id, selectedBatchNo, numValue);
    } else {
      // Save custom default price for product without batches
      onSaveDefaultPrice(item.id, numValue);
    }
    // Close edit mode
    onTogglePriceEdit(item.id);
  };

  const handleCancelPriceEdit = () => {
    setLocalPrice(String(currentPrice));
    onTogglePriceEdit(item.id);
  };

  const handleIncrement = () => {
    if (currentBatchQty < selectedBatchStock) {
      onUpdateBatchQty(item.id, selectedBatchNo, currentBatchQty + 1);
    }
  };

  const handleDecrement = () => {
    if (currentBatchQty > 0) {
      onUpdateBatchQty(item.id, selectedBatchNo, currentBatchQty - 1);
    }
  };

  const isIncrementDisabled = currentBatchQty >= selectedBatchStock || selectedBatchStock === 0;

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
          <div className="product-meta">Total Stock: {stock} units</div>
          {totalQty > 0 && (
            <div className="product-meta" style={{ color: isDark ? '#64b5f6' : '#1565c0' }}>
              <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Total Selected: {totalQty} units across {Object.keys(batchQuantities).filter(k => batchQuantities[k] > 0).length} batch(es)
            </div>
          )}
          
          <div className="batch-selector-container">
            <BatchPriceSelector 
              batches={batches}
              selectedBatchNo={selectedBatchNo}
              onSelectBatch={(batchNo) => onSelectBatch(item.id, batchNo)}
              productName={item.name}
              isDark={isDark}
              availableBatches={availableBatches}
              batchQuantities={batchQuantities}
            />
          </div>
          
          {selectedBatch && currentBatchQty > selectedBatchStock && (
            <div style={{ 
              fontSize: '0.6rem', 
              color: '#d32f2f',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: isDark ? '#2a1a1a' : '#fde8e8',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              <AlertCircle size={12} />
              Selected batch ({selectedBatch.batchNo}) only has {selectedBatchStock} units available. 
              {Object.keys(batchQuantities).some(k => k !== selectedBatchNo && batchQuantities[k] > 0) && 
                ' Other batches have been allocated.'}
            </div>
          )}
          
          {/* Show all batch allocations */}
          {batchAllocations.length > 0 && (
            <div style={{ 
              fontSize: '0.6rem', 
              color: isDark ? '#888' : '#666',
              marginTop: '2px',
              padding: '4px 8px',
              background: isDark ? '#1a1a22' : '#f5f5f5',
              borderRadius: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontWeight: '600' }}>Allocations:</span>
              {batchAllocations.map((alloc, idx) => (
                <span key={idx} style={{ 
                  background: isDark ? '#2a2a32' : '#e8e8e8',
                  padding: '0 6px',
                  borderRadius: '4px',
                  fontSize: '0.55rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontFamily: 'monospace' }}>{alloc.batchNo}</span>
                  <span style={{ fontWeight: '600' }}>{alloc.qty} units</span>
                  <span>@ ₹{alloc.price.toFixed(2)}</span>
                  <span style={{ color: isDark ? '#64b5f6' : '#1565c0' }}>
                    = ₹{alloc.subtotal.toFixed(2)}
                  </span>
                </span>
              ))}
            </div>
          )}
          
          <div className="product-price-row">
            {isEditingPrice ? (
              <div className="price-edit-container">
                <span className="price-edit-label">₹</span>
                <input
                  ref={priceInputRef}
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
                <span className="product-price">₹{Number(currentPrice).toLocaleString('en-IN')}</span>
                {hasBatches && selectedBatch && (
                  <span style={{
                    fontSize: '0.55rem',
                    color: isDark ? '#666' : '#999',
                    marginLeft: '2px',
                    fontFamily: 'monospace'
                  }}>
                    ({selectedBatch.batchNo})
                  </span>
                )}
                {!hasBatches && (
                  <span style={{
                    fontSize: '0.55rem',
                    color: isDark ? '#666' : '#999',
                    marginLeft: '2px',
                  }}>
                    (default)
                  </span>
                )}
                <button 
                  className="price-edit-toggle-btn"
                  onClick={() => {
                    onTogglePriceEdit(item.id);
                  }}
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
            onClick={handleDecrement}
            disabled={currentBatchQty === 0}
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
            onClick={handleIncrement}
            disabled={isIncrementDisabled}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
});

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

  // Load products
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

  // Build stock data map
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

  // Initialize cart with multi-batch support
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
      batchQuantities: {},
      selectedBatchNo: null,
      totalQty: 0,
      batchCustomPrices: {},
      customDefaultPrice: {},
      addedToCartAt: null
    }));
    setCart(newCart);
    hasInitialized.current = true;
  }, [stockDataMap]);

  // Fetch batch data
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

  // Auto-select first available batch for each product
  useEffect(() => {
    if (Object.keys(productBatches).length === 0) return;
    
    setCart(prev => {
      let hasChanges = false;
      const newCart = prev.map(item => {
        const batches = productBatches[item.id] || [];
        const available = batchAvailability[item.id] || [];
        
        if (batches.length > 0 && !item.selectedBatchNo && available.length > 0) {
          hasChanges = true;
          const firstAvailable = available.find(b => b.quantityAvailable > 0);
          if (firstAvailable) {
            return {
              ...item,
              selectedBatchNo: firstAvailable.batchNo
            };
          }
        }
        return item;
      });
      return hasChanges ? newCart : prev;
    });
  }, [productBatches, batchAvailability]);

  // Get price for a specific batch
  const getPriceForBatch = useCallback((productId, batchNo) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return 0;
    
    // Check if custom price exists for this batch and price type
    if (item.batchCustomPrices?.[batchNo]?.[priceType] !== undefined && item.batchCustomPrices[batchNo][priceType] !== null) {
      return item.batchCustomPrices[batchNo][priceType];
    }
    
    // Get batch from productBatches
    const batches = productBatches[productId] || [];
    const batch = batches.find(b => b.batchNo === batchNo);
    if (!batch) {
      return item[priceType] || 0;
    }
    
    // Get price from batch data
    switch(priceType) {
      case 'retailerPrice': return batch.retailerPrice || batch.purchasePrice || 0;
      case 'distributorPrice': return batch.distributorPrice || batch.purchasePrice || 0;
      case 'walkinPrice': return batch.walkinPrice || batch.purchasePrice || 0;
      case 'mrp': return batch.mrp || batch.purchasePrice || 0;
      default: return batch.purchasePrice || 0;
    }
  }, [cart, productBatches, priceType]);

  // Get current price for selected batch
  const getCurrentPrice = useCallback((item) => {
    const hasBatches = productBatches[item.id] && productBatches[item.id].length > 0;
    
    if (hasBatches && item.selectedBatchNo) {
      return getPriceForBatch(item.id, item.selectedBatchNo);
    }
    
    // No batches or no batch selected - use default price with custom override
    if (item.customDefaultPrice && item.customDefaultPrice[priceType] !== undefined && item.customDefaultPrice[priceType] !== null) {
      return item.customDefaultPrice[priceType];
    }
    return item[priceType] || 0;
  }, [priceType, getPriceForBatch, productBatches]);

  // Update quantity for a specific batch
  const updateBatchQty = useCallback((productId, batchNo, newQty) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === productId);
      if (index === -1) return prev;
      
      const oldItem = prev[index];
      
      const newBatchQuantities = { ...oldItem.batchQuantities };
      
      if (newQty === 0) {
        delete newBatchQuantities[batchNo];
      } else {
        newBatchQuantities[batchNo] = newQty;
      }
      
      const newTotalQty = Object.values(newBatchQuantities).reduce((sum, qty) => sum + qty, 0);
      
      const newItem = {
        ...oldItem,
        batchQuantities: newBatchQuantities,
        totalQty: newTotalQty,
        addedToCartAt: newTotalQty > 0 ? (oldItem.addedToCartAt || Date.now()) : null
      };
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, []);

  // Direct quantity input for specific batch
  const updateQtyDirect = useCallback((productId, batchNo, newQty) => {
    updateBatchQty(productId, batchNo, newQty);
  }, [updateBatchQty]);

  // Select batch for a product
  const handleSelectBatch = useCallback((productId, batchNo) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === productId);
      if (index === -1) return prev;
      
      const oldItem = prev[index];
      
      const available = batchAvailability[productId] || [];
      const batch = available.find(b => b.batchNo === batchNo);
      if (!batch || batch.quantityAvailable <= 0) {
        return prev;
      }
      
      const newItem = {
        ...oldItem,
        selectedBatchNo: batchNo
      };
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, [batchAvailability]);

  // Save custom price for a specific batch
  const saveBatchCustomPrice = useCallback((productId, batchNo, newPrice) => {
    if (!batchNo) {
      console.warn('No batch selected, cannot save custom price');
      return;
    }
    
    setCart(prev => {
      const index = prev.findIndex(item => item.id === productId);
      if (index === -1) return prev;
      
      const item = prev[index];
      
      const newBatchCustomPrices = {
        ...item.batchCustomPrices
      };
      
      if (!newBatchCustomPrices[batchNo]) {
        newBatchCustomPrices[batchNo] = {};
      }
      
      newBatchCustomPrices[batchNo][priceType] = newPrice;
      
      const newItem = {
        ...item,
        batchCustomPrices: newBatchCustomPrices
      };
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, [priceType]);

  // Save custom default price for products without batch history
  const saveDefaultPrice = useCallback((productId, newPrice) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === productId);
      if (index === -1) return prev;
      
      const item = prev[index];
      
      const newItem = {
        ...item,
        customDefaultPrice: {
          ...item.customDefaultPrice,
          [priceType]: newPrice
        }
      };
      
      const newCart = [...prev];
      newCart[index] = newItem;
      return newCart;
    });
  }, [priceType]);

  // Toggle price edit
  const togglePriceEdit = useCallback((id) => {
    setEditingPriceId(prev => prev === id ? null : id);
  }, []);

  // Handle price type change
  const handlePriceTypeChange = useCallback((newPriceType) => {
    setPriceType(newPriceType);
  }, []);

  // Filter and sort cart
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
      const aQty = a.totalQty || 0;
      const bQty = b.totalQty || 0;
      if (aQty > 0 && bQty > 0) {
        const timeA = a.addedToCartAt || 0;
        const timeB = b.addedToCartAt || 0;
        return timeA - timeB;
      }
      if (aQty > 0 && bQty === 0) return -1;
      if (aQty === 0 && bQty > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [cart, searchQuery, selectedCategory]);

  // Get cart items (only items with quantity > 0)
  const cartItems = useMemo(() => {
    const selected = cart.filter(item => item.totalQty > 0);
    return selected.map(item => {
      const hasBatches = productBatches[item.id] && productBatches[item.id].length > 0;
      let batchBreakdown = [];
      
      if (hasBatches) {
        // Products with batches - show batch breakdown
        batchBreakdown = Object.entries(item.batchQuantities || {})
          .filter(([_, qty]) => qty > 0)
          .map(([batchNo, qty]) => {
            const price = getPriceForBatch(item.id, batchNo);
            return {
              batchNo,
              qty,
              price,
              subtotal: qty * price
            };
          });
      } else {
        // Products without batches - single entry
        const price = getCurrentPrice(item);
        batchBreakdown = [{
          batchNo: 'default',
          qty: item.totalQty,
          price: price,
          subtotal: item.totalQty * price
        }];
      }
      
      return {
        ...item,
        batchBreakdown,
        totalAmount: batchBreakdown.reduce((sum, b) => sum + b.subtotal, 0)
      };
    });
  }, [cart, getPriceForBatch, getCurrentPrice, productBatches]);

  // Calculate totals
  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.totalQty, 0),
    [cartItems]
  );

  const totalAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [cartItems]
  );

  // Place order
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }

    const validationErrors = [];
    const batchAllocations = {};

    cartItems.forEach(item => {
      const allocations = [];
      const batches = productBatches[item.id] || [];
      const available = batchAvailability[item.id] || [];
      const hasBatches = batches.length > 0;
      
      if (hasBatches) {
        // Products with batches
        Object.entries(item.batchQuantities).forEach(([batchNo, qty]) => {
          const batch = batches.find(b => b.batchNo === batchNo);
          const availBatch = available.find(b => b.batchNo === batchNo);
          const availableQty = availBatch?.quantityAvailable || 0;
          
          if (qty > availableQty) {
            validationErrors.push({
              name: item.name,
              batchNo: batchNo,
              requestedQty: qty,
              availableQty: availableQty
            });
            return;
          }
          
          const price = getPriceForBatch(item.id, batchNo);
          
          allocations.push({
            batchNumber: batchNo,
            qty: qty,
            purchaseCost: batch?.purchasePrice || 0,
            sellingPrice: price
          });
        });
      } else {
        // Products without batches - use default price
        const price = getCurrentPrice(item);
        allocations.push({
          batchNumber: 'default',
          qty: item.totalQty,
          purchaseCost: 0,
          sellingPrice: price
        });
      }
      
      if (allocations.length > 0) {
        batchAllocations[item.id] = {
          productId: item.id,
          name: item.name,
          totalQty: item.totalQty,
          batchAllocations: allocations
        };
      }
    });

    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.map(e => 
        `${e.name} (Batch: ${e.batchNo}): Requested ${e.requestedQty}, Available ${e.availableQty}`
      ).join('\n');
      alert(`Cannot place order:\n${errorMsg}`);
      return;
    }

    setIsOrderPlacing(true);

    try {
      const orderedItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.totalQty,
        price: item.totalAmount / item.totalQty,
        batchAllocations: batchAllocations[item.id]?.batchAllocations || []
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
          multiBatchOrder: true
        }
      });

      // Reset cart after order
      setCart(prev => {
        return prev.map(item => {
          const orderedItem = cartItems.find(ci => ci.id === item.id);
          if (orderedItem) {
            const newStock = Math.max(0, item.currentStock - orderedItem.totalQty);
            
            return {
              ...item,
              currentStock: newStock,
              batchQuantities: {},
              selectedBatchNo: item.selectedBatchNo,
              totalQty: 0,
              addedToCartAt: null,
              // Keep custom prices
            };
          }
          return item;
        });
      });

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
            const selectedBatchNo = product.selectedBatchNo;
            const availableBatches = batchAvailability?.[productId] || [];
            const hasBatches = batches.length > 0;
            
            return (
              <ProductRow
                key={product.id}
                item={product}
                onUpdateBatchQty={updateBatchQty}
                onQtyInputChange={updateQtyDirect}
                onSelectBatch={handleSelectBatch}
                getPriceForBatch={getPriceForBatch}
                getCurrentPrice={getCurrentPrice}
                isEditingPrice={editingPriceId === product.id}
                onTogglePriceEdit={togglePriceEdit}
                onSaveBatchPrice={saveBatchCustomPrice}
                onSaveDefaultPrice={saveDefaultPrice}
                batches={batches}
                selectedBatchNo={hasBatches ? selectedBatchNo : null}
                isDark={isDark}
                availableBatches={availableBatches}
                batchQuantities={product.batchQuantities || {}}
                priceType={priceType}
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
          {totalItems > 0 && (
            <span style={{ 
              fontSize: '0.7rem', 
              color: isDark ? '#888' : '#666',
              marginLeft: 'auto'
            }}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="summary-scrollable">
          {cartItems.length === 0 ? (
            <div className="summary-empty">No items added yet</div>
          ) : (
            cartItems.map((item, idx) => (
              <div className="summary-item" key={item.id}>
                <div className="summary-item-name">
                  <span className="item-order-number">{idx + 1}.</span> 
                  {item.name}
                  {item.batchBreakdown.length > 1 && (
                    <span style={{
                      fontSize: '0.5rem',
                      color: isDark ? '#64b5f6' : '#1565c0',
                      background: isDark ? '#1a2a3a' : '#e3f2fd',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      marginLeft: '4px'
                    }}>
                      {item.batchBreakdown.length} batches
                    </span>
                  )}
                </div>
                
                {item.batchBreakdown.map((batch, bi) => (
                  <div key={bi} className="summary-batch-row" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingLeft: '20px',
                    fontSize: '0.6rem',
                    color: isDark ? '#888' : '#666',
                    paddingTop: '2px'
                  }}>
                    <span>
                      {batch.batchNo === 'default' ? 'Default' : batch.batchNo}: ×{batch.qty} @ ₹{batch.price.toFixed(2)}
                    </span>
                    <span>
                      ₹{batch.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <div className="summary-item-right">
                  <span className="summary-item-qty">×{item.totalQty}</span>
                  <span className="summary-item-price">
                    ₹{item.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
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