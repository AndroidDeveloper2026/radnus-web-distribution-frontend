
// src/pages/Stock/DataExplorerPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, Filter, ChevronDown, ChevronRight,
  FileSpreadsheet, Printer, Eye, MoreVertical,
  Package, X, AlertCircle, Clock, Box
} from 'lucide-react';
import {
  Card,
  Input,
  Select,
  Button,
  Badge,
  toast,
  Modal,
} from '../../components/ui/UI';
import { 
  fetchStockBatches, 
  clearStockBatches,
  fetchFilterOptions,
  exportStockBatches
} from '../../services/features/purchase/purchaseSlice';

// ─── Helper Components ──────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const statusMap = {
    'paid': { label: 'Paid', variant: 'active' },
    'unpaid': { label: 'Unpaid', variant: 'inactive' },
    'partial': { label: 'Partial', variant: 'pending' },
  };
  const config = statusMap[status] || statusMap.unpaid;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ExpiryStatusBadge = ({ status }) => {
  const statusMap = {
    'expired': { label: 'Expired', variant: 'inactive' },
    'expiring-soon': { label: 'Expiring Soon', variant: 'pending' },
    'healthy': { label: 'Healthy', variant: 'active' },
  };
  const config = statusMap[status] || statusMap.healthy;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const CurrencyCell = ({ value }) => {
  if (value === undefined || value === null || value === '') return '—';
  return `₹${Number(value).toFixed(2)}`;
};

const DetailItem = ({ label, value }) => (
  <div>
    <label style={{ 
      fontSize: 11, 
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      display: 'block',
      marginBottom: 4
    }}>
      {label}
    </label>
    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
      {value || '—'}
    </span>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const DataExplorerPage = () => {
  const dispatch = useDispatch();
  
  // ─── Redux State ────────────────────────────────────────────────────
  const { 
    stockBatches, 
    stockBatchesLoading, 
    stockBatchesTotal,
    stockBatchesTotalPages,
    filterOptions,
    filterOptionsLoading,
    exporting
  } = useSelector((s) => s.purchases);

  // ─── Local State ────────────────────────────────────────────────────
  const DEFAULT_FILTERS = {
    search: '',
    product: 'all',
    batchNo: 'all',
    purchaseEntry: 'all',
    supplier: 'all',
    rackNo: 'all',
    expiryStatus: 'all',
    inwardDateFrom: '',
    inwardDateTo: '',
    paymentStatus: 'all',
    paymentType: 'all',
  };

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [sortConfig, setSortConfig] = useState({ key: 'batchNo', direction: 'desc' });
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // ─── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(prev => {
        if (prev.search === filters.search) return prev;
        return { ...prev, search: filters.search };
      });
      setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const params = {
      ...appliedFilters,
      page: pagination.page,
      limit: pagination.limit,
      sortKey: sortConfig.key,
      sortDirection: sortConfig.direction,
    };
    
    Object.keys(params).forEach(key => {
      if (params[key] === 'all' || params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });
    
    dispatch(fetchStockBatches(params));
    
    return () => {
      dispatch(clearStockBatches());
    };
  }, [dispatch, appliedFilters, pagination.page, pagination.limit, sortConfig.key, sortConfig.direction]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
    toast.success('Filters applied');
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPagination({ page: 1, limit: 10 });
    toast.info('Filters cleared');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = async () => {
    try {
      const params = {
        ...appliedFilters,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === 'all' || params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const blob = await dispatch(exportStockBatches(params)).unwrap();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stock_batches_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully');
    } catch (err) {
      toast.error(err || 'Failed to export data');
    }
  };

  // ─── Filter Options ──────────────────────────────────────────────────
  const productOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Products' }];
    if (filterOptions.products) {
      filterOptions.products.forEach(p => {
        opts.push({ value: p._id, label: p.name });
      });
    }
    return opts;
  }, [filterOptions.products]);

  const batchOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Batches' }];
    if (filterOptions.batches) {
      filterOptions.batches.forEach(b => {
        opts.push({ value: b, label: b });
      });
    }
    return opts;
  }, [filterOptions.batches]);

  const purchaseEntryOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Purchases' }];
    if (filterOptions.purchaseEntries) {
      filterOptions.purchaseEntries.forEach(p => {
        opts.push({ value: p, label: p });
      });
    }
    return opts;
  }, [filterOptions.purchaseEntries]);

  const supplierOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Suppliers' }];
    if (filterOptions.suppliers) {
      filterOptions.suppliers.forEach(s => {
        opts.push({ value: s._id, label: s.name });
      });
    }
    return opts;
  }, [filterOptions.suppliers]);

  const rackOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Racks' }];
    if (filterOptions.racks) {
      filterOptions.racks.forEach(r => {
        opts.push({ value: r, label: r || 'No Rack' });
      });
    }
    return opts;
  }, [filterOptions.racks]);

  const expiryStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'expired', label: 'Expired' },
    { value: 'expiring-soon', label: 'Expiring Soon' },
    { value: 'healthy', label: 'Healthy' },
  ];

  const paymentStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
  ];

  const paymentTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Credit', label: 'Credit' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
    { value: 'Cheque', label: 'Cheque' },
  ];

  // ─── Quick Stats ──────────────────────────────────────────────────────
  const quickStats = useMemo(() => {
    const total = stockBatches.length;
    const expired = stockBatches.filter(b => b.expiryStatus === 'expired').length;
    const lowStock = stockBatches.filter(b => b.quantityAvailable < 50).length;
    const unpaid = stockBatches.filter(b => b.paymentStatus === 'unpaid').length;
    
    return { total, expired, lowStock, unpaid };
  }, [stockBatches]);

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ 
      maxWidth: 1440, 
      margin: '0 auto', 
      padding: '20px 24px',
      background: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      {/* ─── Header Row ──────────────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h1 style={{ 
            fontSize: 20, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '-0.3px'
          }}>
            Data Explorer
          </h1>
          <span style={{ 
            fontSize: 14, 
            color: 'var(--text-muted)',
            fontWeight: 500
          }}>
            ({stockBatchesTotal})
          </span>
        </div>

        <div style={{ 
          flex: 1,
          maxWidth: 420,
          minWidth: 200,
          position: 'relative'
        }}>
          <Search 
            size={15} 
            style={{ 
              position: 'absolute', 
              left: 10, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)' 
            }} 
          />
          <input
            placeholder="Search by batch, product, rack, purchase..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--bg-card)',
              fontSize: 13,
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--red)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedFilters(prev => ({ ...prev, search: filters.search }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }
            }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          flexWrap: 'wrap'
        }}>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<FileSpreadsheet size={14} />}
            onClick={handleExport}
            loading={exporting}
            disabled={stockBatches.length === 0}
          >
            Export
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Printer size={14} />}
            onClick={() => window.print()}
            disabled={stockBatches.length === 0}
          >
            Print
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* ─── Filter Panel ──────────────────────────────────────────── */}
      {showFilters && (
        <div style={{ 
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '16px',
          marginBottom: 16
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 12,
            marginBottom: 12
          }}>
            <Select
              label="Product"
              options={productOptions}
              value={filters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              loading={filterOptionsLoading}
            />
            <Select
              label="Batch No"
              options={batchOptions}
              value={filters.batchNo}
              onChange={(e) => handleFilterChange('batchNo', e.target.value)}
              loading={filterOptionsLoading}
            />
            <Select
              label="Purchase Entry"
              options={purchaseEntryOptions}
              value={filters.purchaseEntry}
              onChange={(e) => handleFilterChange('purchaseEntry', e.target.value)}
              loading={filterOptionsLoading}
            />
            <Select
              label="Supplier"
              options={supplierOptions}
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              loading={filterOptionsLoading}
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 2fr 2fr 2fr 2fr 1.5fr', 
            gap: 12,
            alignItems: 'flex-end'
          }}>
            <Select
              label="Rack No"
              options={rackOptions}
              value={filters.rackNo}
              onChange={(e) => handleFilterChange('rackNo', e.target.value)}
              loading={filterOptionsLoading}
            />
            <Select
              label="Expiry Status"
              options={expiryStatusOptions}
              value={filters.expiryStatus}
              onChange={(e) => handleFilterChange('expiryStatus', e.target.value)}
            />
            <Input
              label="Inward From"
              type="date"
              value={filters.inwardDateFrom}
              onChange={(e) => handleFilterChange('inwardDateFrom', e.target.value)}
            />
            <Input
              label="Inward To"
              type="date"
              value={filters.inwardDateTo}
              onChange={(e) => handleFilterChange('inwardDateTo', e.target.value)}
            />
            <Select
              label="Payment Status"
              options={paymentStatusOptions}
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            />
            <div style={{ 
              display: 'flex', 
              gap: 8,
              paddingBottom: 1,
              justifyContent: 'flex-end'
            }}>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Table ────────────────────────────────────────────────── */}
      <div style={{ 
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: 13,
            minWidth: 1600
          }}>
            <thead>
              <tr style={{ 
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)'
              }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Batch No</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>SKU</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Purchase Entry</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Invoice No</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Invoice Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Supplier</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Payment Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Payment Type</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Due Amount</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Rack No</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Expiry Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Inward Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Purchased Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Available Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Purchase Price</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>MRP</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Distributor</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Retailer</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Walk-in</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Created By</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Created At</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stockBatchesLoading ? (
                <tr>
                  <td colSpan={24} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                      <div className="spinner spinner-sm" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : stockBatches.length === 0 ? (
                <tr>
                  <td colSpan={24} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Package size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    No records found
                  </td>
                </tr>
              ) : (
                stockBatches.map((row, idx) => (
                  <tr key={row._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--red)' }}>{row.batchNo || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.productName || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{row.sku || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{row.purchaseEntry || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{row.invoiceNumber || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{row.supplierName || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={row.paymentStatus} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>{row.paymentType || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                      <CurrencyCell value={row.dueAmount} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>{row.rackNo || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <ExpiryStatusBadge status={row.expiryStatus} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {row.inwardDate ? new Date(row.inwardDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{row.quantityPurchased || 0}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                      <span style={{ color: row.quantityAvailable > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {row.quantityAvailable || 0}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <CurrencyCell value={row.purchasePrice} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <CurrencyCell value={row.mrp} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <CurrencyCell value={row.distributorPrice} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <CurrencyCell value={row.retailerPrice} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <CurrencyCell value={row.walkinPrice} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>{row.createdBy || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString('en-GB') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          icon={<Eye size={14} />}
                          onClick={() => { setSelectedBatch(row); setViewModalOpen(true); }}
                        />
                        <Button variant="ghost" size="xs" icon={<MoreVertical size={14} />} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ────────────────────────────────────────────── */}
        {stockBatchesTotal > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            flexWrap: 'wrap',
            gap: 8
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, stockBatchesTotal)} of {stockBatchesTotal} records
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="ghost" 
                size="xs"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span style={{ fontSize: 13, fontWeight: 500, padding: '0 8px', color: 'var(--text-primary)' }}>
                {pagination.page} / {stockBatchesTotalPages || 1}
              </span>
              <Button 
                variant="ghost" 
                size="xs"
                disabled={pagination.page >= stockBatchesTotalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
              <select
                value={pagination.limit}
                onChange={(e) => {
                  setPagination({ page: 1, limit: Number(e.target.value) });
                }}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  marginLeft: 8,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2 }}>
                per page
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── View Modal ────────────────────────────────────────────── */}
      <Modal
        open={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedBatch(null); }}
        title={`Batch Details - ${selectedBatch?.batchNo || ''}`}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => { setViewModalOpen(false); setSelectedBatch(null); }}>
            Close
          </Button>
        }
      >
        {selectedBatch && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: 16,
            padding: '4px 0'
          }}>
            <DetailItem label="Batch No" value={selectedBatch.batchNo} />
            <DetailItem label="Product" value={selectedBatch.productName} />
            <DetailItem label="SKU" value={selectedBatch.sku} />
            
            <DetailItem label="Purchase Entry" value={selectedBatch.purchaseEntry} />
            <DetailItem label="Invoice No" value={selectedBatch.invoiceNumber} />
            <DetailItem label="Invoice Date" value={selectedBatch.invoiceDate} />
            
            <DetailItem label="Supplier" value={selectedBatch.supplierName} />
            <DetailItem label="Payment Status" value={selectedBatch.paymentStatus} />
            <DetailItem label="Payment Type" value={selectedBatch.paymentType} />
            
            <DetailItem label="Due Amount" value={selectedBatch.dueAmount} />
            <DetailItem label="Rack No" value={selectedBatch.rackNo} />
            <DetailItem label="Expiry Status" value={selectedBatch.expiryStatus} />
            
            <DetailItem label="Inward Date" value={selectedBatch.inwardDate} />
            <DetailItem label="Purchased Qty" value={selectedBatch.quantityPurchased} />
            <DetailItem label="Available Qty" value={selectedBatch.quantityAvailable} />
            
            <DetailItem label="Purchase Price" value={selectedBatch.purchasePrice} />
            <DetailItem label="MRP" value={selectedBatch.mrp} />
            <DetailItem label="Item Cost" value={selectedBatch.itemCost} />
            
            <DetailItem label="Distributor Price" value={selectedBatch.distributorPrice} />
            <DetailItem label="Retailer Price" value={selectedBatch.retailerPrice} />
            <DetailItem label="Walk-in Price" value={selectedBatch.walkinPrice} />
            
            <DetailItem label="Created By" value={selectedBatch.createdBy} />
            <DetailItem label="Created At" value={selectedBatch.createdAt} />
            <DetailItem label="Remarks" value={selectedBatch.remarks} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataExplorerPage;

//================== 14.08.26 ====================
// // src/pages/Stock/DataExplorerPage.js

// import React, { useState, useEffect, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { 
//   Search, Filter, 
//   ChevronDown, ChevronRight,
//   FileSpreadsheet, Printer,
//   RotateCcw, Eye, Edit,
//   CheckSquare, Square,
//   Package, X
// } from 'lucide-react';
// import {
//   SectionHeader,
//   Card,
//   Input,
//   Select,
//   Button,
//   DataTable,
//   Badge,
//   toast,
//   Modal,
// } from '../../components/ui/UI';
// import { 
//   fetchStockBatches, 
//   clearStockBatches,
//   fetchFilterOptions,
//   exportStockBatches
// } from '../../services/features/purchase/purchaseSlice';

// // ─── Helper Components ──────────────────────────────────────────────────────

// const DetailItem = ({ label, value, highlight, currency, badge, suffix }) => {
//   let displayValue = value || '—';
  
//   if (currency && value) {
//     displayValue = `₹${Number(value).toFixed(2)}`;
//   }
  
//   if (suffix && value) {
//     displayValue = `${value}${suffix}`;
//   }
  
//   return (
//     <div>
//       <label style={{ 
//         fontWeight: 600, 
//         color: 'var(--text-secondary)', 
//         display: 'block', 
//         marginBottom: 4, 
//         fontSize: 12, 
//         textTransform: 'uppercase', 
//         letterSpacing: '0.5px' 
//       }}>
//         {label}
//       </label>
//       {badge ? (
//         <Badge variant={
//           value === 'paid' ? 'active' :
//           value === 'unpaid' ? 'inactive' :
//           value === 'partial' ? 'pending' : 'default'
//         }>
//           {value || '—'}
//         </Badge>
//       ) : (
//         <span style={{ 
//           fontWeight: highlight ? 600 : 400,
//           color: highlight ? 'var(--red)' : 'var(--text-primary)',
//           fontSize: highlight ? 15 : 14
//         }}>
//           {displayValue}
//         </span>
//       )}
//     </div>
//   );
// };

// // ─── Main Component ──────────────────────────────────────────────────────────

// const DataExplorerPage = () => {
//   const dispatch = useDispatch();
  
//   // ─── Redux State ────────────────────────────────────────────────────
//   const { 
//     stockBatches, 
//     stockBatchesLoading, 
//     stockBatchesTotal,
//     stockBatchesPage,
//     stockBatchesTotalPages,
//     stockBatchesLimit,
//     filterOptions,
//     filterOptionsLoading,
//     exporting
//   } = useSelector((s) => s.purchases);

//   // ─── Local State ────────────────────────────────────────────────────
//   const DEFAULT_FILTERS = {
//     search: '',
//     product: 'all',
//     batchNo: 'all',
//     purchaseEntry: 'all',
//     supplier: 'all',
//     rackNo: 'all',
//     expiryStatus: 'all',
//     inwardDateFrom: '',
//     inwardDateTo: '',
//     paymentStatus: 'all',
//     paymentType: 'all',
//   };

//   const [filters, setFilters] = useState(DEFAULT_FILTERS);
//   const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  
//   const [showFilters, setShowFilters] = useState(true);
//   const [selectedRows, setSelectedRows] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [viewModalOpen, setViewModalOpen] = useState(false);
//   const [selectedBatch, setSelectedBatch] = useState(null);
//   const [pagination, setPagination] = useState({ page: 1, limit: 50 });
//   const [sortConfig, setSortConfig] = useState({ key: 'batchNo', direction: 'desc' });

//   // ─── Load Filter Options ──────────────────────────────────────────────
//   useEffect(() => {
//     dispatch(fetchFilterOptions());
//   }, [dispatch]);

//   // ─── Live (debounced) Search ───────────────────────────────────────
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setAppliedFilters(prev => {
//         if (prev.search === filters.search) return prev;
//         return { ...prev, search: filters.search };
//       });
//       setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
//     }, 400);

//     return () => clearTimeout(timer);
//   }, [filters.search]);

//   // ─── Load Data ──────────────────────────────────────────────────────
//   useEffect(() => {
//     const params = {
//       ...appliedFilters,
//       page: pagination.page,
//       limit: pagination.limit,
//       sortKey: sortConfig.key,
//       sortDirection: sortConfig.direction,
//     };
    
//     Object.keys(params).forEach(key => {
//       if (params[key] === 'all' || params[key] === '' || params[key] === undefined) {
//         delete params[key];
//       }
//     });
    
//     dispatch(fetchStockBatches(params));
    
//     return () => {
//       dispatch(clearStockBatches());
//     };
//   }, [dispatch, appliedFilters, pagination.page, pagination.limit, sortConfig.key, sortConfig.direction]);

//   // ─── Filter Handlers ──────────────────────────────────────────────
//   const handleFilterChange = (key, value) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const handleApplyFilters = () => {
//     setAppliedFilters(filters);
//     setPagination(prev => ({ ...prev, page: 1 }));
//     toast.success('Filters applied');
//   };

//   const handleClearFilters = () => {
//     setFilters(DEFAULT_FILTERS);
//     setAppliedFilters(DEFAULT_FILTERS);
//     setPagination({ page: 1, limit: 50 });
//     toast.info('Filters cleared');
//   };

//   // ─── Selection Handlers ────────────────────────────────────────────
//   const toggleRowSelection = (id) => {
//     setSelectedRows(prev => 
//       prev.includes(id) 
//         ? prev.filter(rowId => rowId !== id)
//         : [...prev, id]
//     );
//   };

//   const toggleSelectAll = () => {
//     if (selectAll) {
//       setSelectedRows([]);
//     } else {
//       const allIds = stockBatches.map(batch => batch._id);
//       setSelectedRows(allIds);
//     }
//     setSelectAll(!selectAll);
//   };

//   // ─── Sort Handler ──────────────────────────────────────────────────
//   const handleSort = (key) => {
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
//     }));
//   };

//   // ─── Export Handler ──────────────────────────────────────────────────
//   const handleExport = async () => {
//     try {
//       const params = {
//         ...appliedFilters,
//         sortKey: sortConfig.key,
//         sortDirection: sortConfig.direction,
//       };
      
//       Object.keys(params).forEach(key => {
//         if (params[key] === 'all' || params[key] === '' || params[key] === undefined) {
//           delete params[key];
//         }
//       });
      
//       const blob = await dispatch(exportStockBatches(params)).unwrap();
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `stock_batches_${new Date().toISOString().split('T')[0]}.xlsx`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       toast.success('Export completed successfully');
//     } catch (err) {
//       toast.error(err || 'Failed to export data');
//     }
//   };

//   // ─── Column Definitions ────────────────────────────────────────────
//   const columns = useMemo(() => {
//     return [
//       { 
//         key: '_rowSelect', 
//         label: '',
//         width: 40,
//         header: (
//           <button 
//             onClick={toggleSelectAll}
//             style={{ background: 'none', border: 'none', cursor: 'pointer' }}
//           >
//             {selectAll ? <CheckSquare size={16} /> : <Square size={16} />}
//           </button>
//         ),
//         render: (_, row) => (
//           <input 
//             type="checkbox" 
//             checked={selectedRows.includes(row._id)}
//             onChange={() => toggleRowSelection(row._id)}
//             style={{ cursor: 'pointer' }}
//           />
//         )
//       },
//       { 
//         key: 'index', 
//         label: '#', 
//         width: 50, 
//         render: (_, row, idx) => (pagination.page - 1) * pagination.limit + idx + 1 
//       },
//       { 
//         key: 'batchNo', 
//         label: 'Batch No', 
//         width: 140,
//         sortable: true,
//         render: (v) => <span style={{ fontWeight: 600, color: 'var(--red)' }}>{v}</span>
//       },
//       { 
//         key: 'productName', 
//         label: 'Product', 
//         width: 200,
//         sortable: true,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'sku', 
//         label: 'SKU', 
//         width: 120,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'purchaseEntry', 
//         label: 'Purchase Entry', 
//         width: 140,
//         render: (v) => v ? <Badge variant="default">{v}</Badge> : '—'
//       },
//       // ─── NEW: Invoice Details ───────────────────────────────────────
//       { 
//         key: 'invoiceNumber', 
//         label: 'Invoice No', 
//         width: 150,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'invoiceDate', 
//         label: 'Invoice Date', 
//         width: 120,
//         render: (v) => v ? new Date(v).toLocaleDateString('en-GB') : '—'
//       },
//       // ─── NEW: Payment Information ──────────────────────────────────
//       { 
//         key: 'paymentStatus', 
//         label: 'Payment Status', 
//         width: 130,
//         render: (v) => {
//           const statusMap = {
//             'paid': { label: 'Paid', variant: 'active' },
//             'unpaid': { label: 'Unpaid', variant: 'inactive' },
//             'partial': { label: 'Partial', variant: 'pending' },
//           };
//           const status = statusMap[v] || statusMap.unpaid;
//           return <Badge variant={status.variant}>{status.label}</Badge>;
//         }
//       },
//       { 
//         key: 'paymentType', 
//         label: 'Payment Type', 
//         width: 130,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'dueAmount', 
//         label: 'Due Amount', 
//         width: 120,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '₹0.00'
//       },
//       { 
//         key: 'supplierName', 
//         label: 'Supplier', 
//         width: 160,
//         render: (v) => v || '—'
//       },
//       // ─── NEW: Product Quantity ──────────────────────────────────────
//       { 
//         key: 'quantity', 
//         label: 'Purchased Qty', 
//         width: 110,
//         render: (v) => v || 0
//       },
//       // ─── NEW: MRP ────────────────────────────────────────────────────
//       { 
//         key: 'mrp', 
//         label: 'MRP', 
//         width: 100,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '—'
//       },
//       { 
//         key: 'rackNo', 
//         label: 'Rack No', 
//         width: 100,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'expiryStatus', 
//         label: 'Expiry Status', 
//         width: 130,
//         render: (v) => {
//           const statusMap = {
//             'expired': { label: 'Expired', variant: 'inactive' },
//             'expiring-soon': { label: 'Expiring Soon', variant: 'pending' },
//             'healthy': { label: 'Healthy', variant: 'active' },
//           };
//           const status = statusMap[v] || statusMap.healthy;
//           return <Badge variant={status.variant}>{status.label}</Badge>;
//         }
//       },
//       { 
//         key: 'inwardDate', 
//         label: 'Inward Date', 
//         width: 120,
//         render: (v) => v ? new Date(v).toLocaleDateString('en-GB') : '—'
//       },
//       { 
//         key: 'quantityAvailable', 
//         label: 'Available Qty', 
//         width: 110,
//         render: (v) => (
//           <span style={{ 
//             fontWeight: 700, 
//             color: v > 0 ? 'var(--green)' : 'var(--red)'
//           }}>
//             {v || 0}
//           </span>
//         )
//       },
//       { 
//         key: 'purchasePrice', 
//         label: 'Purchase Price', 
//         width: 120,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '—'
//       },
//       // ─── NEW: Additional Pricing Tiers ──────────────────────────────
//       { 
//         key: 'distributorPrice', 
//         label: 'Distributor Price', 
//         width: 130,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '—'
//       },
//       { 
//         key: 'retailerPrice', 
//         label: 'Retailer Price', 
//         width: 130,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '—'
//       },
//       { 
//         key: 'walkinPrice', 
//         label: 'Walk-in Price', 
//         width: 130,
//         render: (v) => v !== undefined && v !== null ? `₹${Number(v).toFixed(2)}` : '—'
//       },
//       // ─── NEW: Audit Information ──────────────────────────────────────
//       { 
//         key: 'createdBy', 
//         label: 'Created By', 
//         width: 120,
//         render: (v) => v || '—'
//       },
//       { 
//         key: 'createdAt', 
//         label: 'Created At', 
//         width: 150,
//         render: (v) => v ? new Date(v).toLocaleString('en-GB') : '—'
//       },
//       {
//         key: '_actions',
//         label: 'Actions',
//         width: 120,
//         render: (_, row) => (
//           <div style={{ display: 'flex', gap: 4 }}>
//             <Button 
//               variant="ghost" 
//               size="xs" 
//               icon={<Eye size={14} />}
//               onClick={() => { setSelectedBatch(row); setViewModalOpen(true); }}
//             />
//             <Button variant="ghost" size="xs" icon={<Edit size={14} />} />
//           </div>
//         )
//       }
//     ];
//   }, [selectedRows, selectAll, pagination]);

//   // ─── Prepare Filter Options ────────────────────────────────────────
//   const productOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All Products' }];
//     if (filterOptions.products) {
//       filterOptions.products.forEach(p => {
//         opts.push({ value: p._id, label: p.name });
//       });
//     }
//     return opts;
//   }, [filterOptions.products]);

//   const batchOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All Batches' }];
//     if (filterOptions.batches) {
//       filterOptions.batches.forEach(b => {
//         opts.push({ value: b, label: b });
//       });
//     }
//     return opts;
//   }, [filterOptions.batches]);

//   const purchaseEntryOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All Purchases' }];
//     if (filterOptions.purchaseEntries) {
//       filterOptions.purchaseEntries.forEach(p => {
//         opts.push({ value: p, label: p });
//       });
//     }
//     return opts;
//   }, [filterOptions.purchaseEntries]);

//   const supplierOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All Suppliers' }];
//     if (filterOptions.suppliers) {
//       filterOptions.suppliers.forEach(s => {
//         opts.push({ value: s._id, label: s.name });
//       });
//     }
//     return opts;
//   }, [filterOptions.suppliers]);

//   const rackOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All Racks' }];
//     if (filterOptions.racks) {
//       filterOptions.racks.forEach(r => {
//         opts.push({ value: r, label: r || 'No Rack' });
//       });
//     }
//     return opts;
//   }, [filterOptions.racks]);

//   const expiryStatusOptions = [
//     { value: 'all', label: 'All' },
//     { value: 'expired', label: 'Expired' },
//     { value: 'expiring-soon', label: 'Expiring Soon' },
//     { value: 'healthy', label: 'Healthy' },
//   ];

//   // ─── NEW: Payment Status Options ──────────────────────────────────
//   const paymentStatusOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All' }];
//     if (filterOptions.paymentStatuses) {
//       filterOptions.paymentStatuses.forEach(status => {
//         const labels = {
//           'paid': 'Paid',
//           'unpaid': 'Unpaid',
//           'partial': 'Partial'
//         };
//         opts.push({ value: status, label: labels[status] || status });
//       });
//     }
//     return opts;
//   }, [filterOptions.paymentStatuses]);

//   // ─── NEW: Payment Type Options ────────────────────────────────────
//   const paymentTypeOptions = useMemo(() => {
//     const opts = [{ value: 'all', label: 'All' }];
//     if (filterOptions.paymentTypes) {
//       filterOptions.paymentTypes.forEach(type => {
//         opts.push({ value: type, label: type });
//       });
//     }
//     return opts;
//   }, [filterOptions.paymentTypes]);

//   // ─── Render ──────────────────────────────────────────────────────────
//   return (
//     <div className="data-explorer">
//       <SectionHeader 
//         title="Data Explorer" 
//         subtitle="View and manage your inventory data in Excel style."
//         count={stockBatchesTotal}
//         action={
//           <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
//             <Button 
//               variant="outline" 
//               size="sm" 
//               icon={<FileSpreadsheet size={14} />} 
//               onClick={handleExport}
//               loading={exporting}
//               disabled={stockBatches.length === 0}
//             >
//               Export
//             </Button>
//             <Button 
//               variant="outline" 
//               size="sm" 
//               icon={<Printer size={14} />}
//               onClick={() => window.print()}
//               disabled={stockBatches.length === 0}
//             >
//               Print
//             </Button>
//           </div>
//         }
//       />
      
//       {/* ─── Search Bar ────────────────────────────────────────────── */}
//       <Card className="card-pad" style={{ marginBottom: 16 }}>
//         <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
//           <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
//             <Search 
//               size={18} 
//               style={{ 
//                 position: 'absolute', 
//                 left: 12, 
//                 top: '50%', 
//                 transform: 'translateY(-50%)', 
//                 color: 'var(--text-muted)' 
//               }} 
//             />
//             <Input
//               placeholder="Search by batch no, product, rack, purchase no..."
//               value={filters.search}
//               onChange={(e) => handleFilterChange('search', e.target.value)}
//               style={{ paddingLeft: 36 }}
//               className="field"
//               onKeyDown={(e) => {
//                 if (e.key === 'Enter') {
//                   setAppliedFilters(prev => ({ ...prev, search: filters.search }));
//                   setPagination(prev => ({ ...prev, page: 1 }));
//                 }
//               }}
//             />
//           </div>
//           <Button 
//             variant="ghost" 
//             size="sm"
//             onClick={() => setShowFilters(!showFilters)}
//             icon={showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
//           >
//             {showFilters ? 'Hide Filters' : 'Show Filters'}
//           </Button>
//           {selectedRows.length > 0 && (
//             <Badge variant="active">
//               {selectedRows.length} selected
//             </Badge>
//           )}
//           {stockBatchesTotal > 0 && (
//             <Badge variant="default">
//               {stockBatchesTotal} total records
//             </Badge>
//           )}
//         </div>
//       </Card>
      
//       {/* ─── Filter Panel ──────────────────────────────────────────── */}
//       {showFilters && (
//         <Card className="card-pad" style={{ marginBottom: 16 }}>
//           <div className="filter-grid">
//             {/* Row 1 */}
//             <div style={{ 
//               display: 'grid', 
//               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
//               gap: 12 
//             }}>
//               <Select
//                 label="Product"
//                 options={productOptions}
//                 value={filters.product}
//                 onChange={(e) => handleFilterChange('product', e.target.value)}
//                 loading={filterOptionsLoading}
//               />
//               <Select
//                 label="Batch No"
//                 options={batchOptions}
//                 value={filters.batchNo}
//                 onChange={(e) => handleFilterChange('batchNo', e.target.value)}
//                 loading={filterOptionsLoading}
//               />
//               <Select
//                 label="Purchase Entry"
//                 options={purchaseEntryOptions}
//                 value={filters.purchaseEntry}
//                 onChange={(e) => handleFilterChange('purchaseEntry', e.target.value)}
//                 loading={filterOptionsLoading}
//               />
//               <Select
//                 label="Supplier"
//                 options={supplierOptions}
//                 value={filters.supplier}
//                 onChange={(e) => handleFilterChange('supplier', e.target.value)}
//                 loading={filterOptionsLoading}
//               />
//             </div>
            
//             {/* Row 2 */}
//             <div style={{ 
//               display: 'grid', 
//               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
//               gap: 12,
//               marginTop: 12 
//             }}>
//               <Select
//                 label="Rack No"
//                 options={rackOptions}
//                 value={filters.rackNo}
//                 onChange={(e) => handleFilterChange('rackNo', e.target.value)}
//                 loading={filterOptionsLoading}
//               />
//               <Select
//                 label="Expiry Status"
//                 options={expiryStatusOptions}
//                 value={filters.expiryStatus}
//                 onChange={(e) => handleFilterChange('expiryStatus', e.target.value)}
//               />
//               <Input
//                 label="Inward Date From"
//                 type="date"
//                 value={filters.inwardDateFrom}
//                 onChange={(e) => handleFilterChange('inwardDateFrom', e.target.value)}
//               />
//               <Input
//                 label="Inward Date To"
//                 type="date"
//                 value={filters.inwardDateTo}
//                 onChange={(e) => handleFilterChange('inwardDateTo', e.target.value)}
//               />
//             </div>
            
//             {/* Row 3 - NEW: Payment Filters */}
//             <div style={{ 
//               display: 'grid', 
//               gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
//               gap: 12,
//               marginTop: 12 
//             }}>
//               <Select
//                 label="Payment Status"
//                 options={paymentStatusOptions}
//                 value={filters.paymentStatus}
//                 onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
//               />
//               <Select
//                 label="Payment Type"
//                 options={paymentTypeOptions}
//                 value={filters.paymentType}
//                 onChange={(e) => handleFilterChange('paymentType', e.target.value)}
//               />
//             </div>
            
//             {/* Row 4: Actions */}
//             <div style={{ 
//               display: 'flex', 
//               gap: 8, 
//               marginTop: 16, 
//               justifyContent: 'flex-end',
//               paddingTop: 12,
//               borderTop: '1px solid var(--border-subtle)'
//             }}>
//               <Button variant="secondary" onClick={handleClearFilters} icon={<RotateCcw size={14} />}>
//                 Clear
//               </Button>
//               <Button variant="primary" onClick={handleApplyFilters} icon={<Filter size={14} />}>
//                 Apply Filters
//               </Button>
//             </div>
//           </div>
//         </Card>
//       )}
      
//       {/* ─── Data Table ────────────────────────────────────────────── */}
//       <Card className="card-pad" style={{ padding: 0, overflow: 'hidden' }}>
//         <div className="data-explorer-table" style={{ overflowX: 'auto' }}>
//           <DataTable
//             columns={columns}
//             data={stockBatches}
//             loading={stockBatchesLoading}
//             emptyIcon={<Package size={36} />}
//             emptyText={
//               stockBatchesTotal === 0 && !stockBatchesLoading
//                 ? 'No stock batches found. Try adjusting your filters.'
//                 : 'No stock batches found'
//             }
//             keyField="_id"
//             onSort={handleSort}
//             sortKey={sortConfig.key}
//             sortDirection={sortConfig.direction}
//             disablePagination
//           />
//         </div>
        
//         {/* ─── Pagination ────────────────────────────────────────────── */}
//         {stockBatchesTotal > 0 && (
//           <div style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             padding: '12px 16px',
//             borderTop: '1px solid var(--border)',
//             flexWrap: 'wrap',
//             gap: 8
//           }}>
//             <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
//               Showing {stockBatches.length} of {stockBatchesTotal} records
//             </span>
//             <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
//               <Button 
//                 variant="ghost" 
//                 size="xs"
//                 disabled={pagination.page === 1}
//                 onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
//               >
//                 Previous
//               </Button>
//               <span style={{ fontSize: 13, fontWeight: 600, padding: '0 8px' }}>
//                 {pagination.page} / {stockBatchesTotalPages || 1}
//               </span>
//               <Button 
//                 variant="ghost" 
//                 size="xs"
//                 disabled={pagination.page >= stockBatchesTotalPages}
//                 onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
//               >
//                 Next
//               </Button>
//               <Select
//                 options={[
//                   { value: '25', label: '25' },
//                   { value: '50', label: '50' },
//                   { value: '100', label: '100' },
//                   { value: '200', label: '200' },
//                 ]}
//                 value={String(pagination.limit)}
//                 onChange={(e) => {
//                   setPagination({ page: 1, limit: Number(e.target.value) });
//                 }}
//                 style={{ width: 80, marginLeft: 8 }}
//               />
//             </div>
//           </div>
//         )}
//       </Card>

//       {/* ─── View Modal ────────────────────────────────────────────── */}
//       <Modal
//         open={viewModalOpen}
//         onClose={() => { setViewModalOpen(false); setSelectedBatch(null); }}
//         title={`Batch Details - ${selectedBatch?.batchNo || ''}`}
//         size="lg"
//         footer={
//           <Button variant="primary" onClick={() => { setViewModalOpen(false); setSelectedBatch(null); }}>
//             Close
//           </Button>
//         }
//       >
//         {selectedBatch && (
//           <div className="batch-details">
//             <style>
//               {`
//                 .batch-details .section-title {
//                   font-weight: 700;
//                   font-size: 14px;
//                   color: var(--text-secondary);
//                   text-transform: uppercase;
//                   letter-spacing: 0.5px;
//                   margin: 20px 0 12px 0;
//                   padding-bottom: 8px;
//                   border-bottom: 2px solid var(--border-subtle);
//                 }
//                 .batch-details .section-title:first-of-type {
//                   margin-top: 0;
//                 }
//                 .batch-details .detail-grid {
//                   display: grid;
//                   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//                   gap: 16px;
//                 }
//                 .batch-details .badge-row {
//                   display: flex;
//                   gap: 8px;
//                   flex-wrap: wrap;
//                   margin-top: 4px;
//                 }
//               `}
//             </style>

//             {/* ─── Purchase Information ─────────────────────────────── */}
//             <div className="section-title">Purchase Information</div>
//             <div className="detail-grid">
//               <DetailItem label="Purchase Entry" value={selectedBatch.purchaseEntry} />
//               <DetailItem label="Invoice Number" value={selectedBatch.invoiceNumber} />
//               <DetailItem label="Invoice Date" value={selectedBatch.invoiceDate} />
//               <DetailItem label="Payment Type" value={selectedBatch.paymentType} />
//               <DetailItem label="Payment Status" value={selectedBatch.paymentStatus} badge />
//               <DetailItem label="Due Amount" value={selectedBatch.dueAmount} currency />
//             </div>

//             {/* ─── Product Information ──────────────────────────────── */}
//             <div className="section-title">Product Information</div>
//             <div className="detail-grid">
//               <DetailItem label="Product" value={selectedBatch.productName} />
//               <DetailItem label="SKU" value={selectedBatch.sku} />
//               <DetailItem label="Batch Number" value={selectedBatch.batchNo} highlight />
//               <DetailItem label="Rack Number" value={selectedBatch.rackNo} />
//               <DetailItem label="Purchased Quantity" value={selectedBatch.quantity} />
//               <DetailItem label="Available Quantity" value={selectedBatch.quantityAvailable} highlight />
//             </div>

//             {/* ─── Pricing Information ──────────────────────────────── */}
//             <div className="section-title">Pricing Information</div>
//             <div className="detail-grid">
//               <DetailItem label="Purchase Price" value={selectedBatch.purchasePrice} currency />
//               <DetailItem label="MRP" value={selectedBatch.mrp} currency />
//               <DetailItem label="GST" value={selectedBatch.gst} suffix="%" />
//               <DetailItem label="Line Total" value={selectedBatch.total} currency />
//             </div>

//             {/* ─── Price Tiers ───────────────────────────────────────── */}
//             {(selectedBatch.distributorPrice || selectedBatch.retailerPrice || selectedBatch.walkinPrice) && (
//               <>
//                 <div className="section-title">Price Tiers</div>
//                 <div className="detail-grid">
//                   {selectedBatch.distributorPrice && (
//                     <DetailItem label="Distributor Price" value={selectedBatch.distributorPrice} currency />
//                   )}
//                   {selectedBatch.retailerPrice && (
//                     <DetailItem label="Retailer Price" value={selectedBatch.retailerPrice} currency />
//                   )}
//                   {selectedBatch.walkinPrice && (
//                     <DetailItem label="Walk-in Price" value={selectedBatch.walkinPrice} currency />
//                   )}
//                 </div>
//               </>
//             )}

//             {/* ─── Stock Information ────────────────────────────────── */}
//             <div className="section-title">Stock Information</div>
//             <div className="detail-grid">
//               <DetailItem label="Expiry Status" value={selectedBatch.expiryStatus} badge />
//               <DetailItem label="Expiry Date" value={selectedBatch.expiryDate} />
//               <DetailItem label="Inward Date" value={selectedBatch.inwardDate} />
//             </div>

//             {/* ─── Audit Information ────────────────────────────────── */}
//             <div className="section-title">Audit Information</div>
//             <div className="detail-grid">
//               <DetailItem label="Created By" value={selectedBatch.createdBy} />
//               <DetailItem label="Created At" value={selectedBatch.createdAt} />
//               {selectedBatch.updatedAt && (
//                 <DetailItem label="Last Updated" value={selectedBatch.updatedAt} />
//               )}
//             </div>

//             {/* ─── Remarks ───────────────────────────────────────────── */}
//             {selectedBatch.remarks && (
//               <>
//                 <div className="section-title">Remarks</div>
//                 <div style={{ 
//                   padding: 12, 
//                   background: 'var(--bg-subtle)', 
//                   borderRadius: 6,
//                   color: 'var(--text-secondary)'
//                 }}>
//                   {selectedBatch.remarks}
//                 </div>
//               </>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default DataExplorerPage;