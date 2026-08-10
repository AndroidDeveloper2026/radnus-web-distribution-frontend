// StockAgingPage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Clock, Package, AlertCircle, CheckCircle, 
  Clock8, Clock3, Clock12, AlertTriangle,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { fetchStockAging } from '../../services/features/purchase/purchaseSlice';
import { SectionHeader, Badge, DataTable, StatCard } from '../../components/ui/UI';
import { useTheme } from '../../context/ThemeContext';

const BUCKETS = [
  { key: '0-30', label: '0-30 Days', variant: 'active', icon: CheckCircle },
  { key: '31-60', label: '31-60 Days', variant: 'active', icon: Clock8 },
  { key: '61-90', label: '61-90 Days', variant: 'pending', icon: Clock3 },
  { key: '91-180', label: '91-180 Days', variant: 'pending', icon: Clock12 },
  { key: '180+', label: '180+ Days', variant: 'inactive', icon: AlertTriangle },
];

const StockAgingPage = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { stockAging, stockAgingLoading } = useSelector((s) => s.purchases);
  const [activeBucket, setActiveBucket] = useState('0-30');

  useEffect(() => {
    dispatch(fetchStockAging());
  }, [dispatch]);

  const columns = [
    { key: 'productName', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'batchNo', label: 'Batch' },
    {
      key: 'inwardDate',
      label: 'Inward Date',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—'
    },
    { key: 'daysInStock', label: 'Days in Stock' },
    { key: 'quantityAvailable', label: 'Qty Available' },
  ];

  const activeData = stockAging[activeBucket] || [];
  const totalItems = Object.values(stockAging).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0
  );

  const getStatAccent = (key) => {
    switch (key) {
      case '0-30': return 'green';
      case '31-60': return 'yellow';
      case '61-90': return 'purple';
      case '91-180': return 'blue';
      case '180+': return 'red';
      default: return 'blue';
    }
  };

  return (
    <div style={{ padding: '0 4px' }}>
      <SectionHeader 
        title="Stock Aging" 
        count={totalItems}
      >
        <Badge variant={totalItems > 0 ? 'active' : 'default'}>
          {totalItems} total items
        </Badge>
      </SectionHeader>

      {/* Stats Grid - Compact Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        {BUCKETS.map((b) => {
          const count = (stockAging[b.key] || []).length;
          const isActive = activeBucket === b.key;
          const accent = getStatAccent(b.key);
          const Icon = b.icon;
          
          return (
            <div
              key={b.key}
              onClick={() => setActiveBucket(b.key)}
              style={{
                background: isDark ? '#1c1d24' : '#ffffff',
                border: `1px solid ${isActive ? '#dc2626' : (isDark ? '#2a2a32' : '#e8e8ee')}`,
                borderRadius: '8px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? '0 0 0 2px rgba(220, 38, 38, 0.15)' : 'none',
              }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isActive ? '#dc2626' : 
                  accent === 'green' ? '#16a34a' :
                  accent === 'yellow' ? '#f59e0b' :
                  accent === 'purple' ? '#7c3aed' :
                  accent === 'blue' ? '#3b82f6' : '#dc2626',
                opacity: isActive ? 1 : 0.4,
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}>
                <Icon size={16} style={{
                  color: accent === 'green' ? '#16a34a' :
                    accent === 'yellow' ? '#f59e0b' :
                    accent === 'purple' ? '#7c3aed' :
                    accent === 'blue' ? '#3b82f6' : '#dc2626',
                  opacity: 0.8,
                }} />
                <span style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: isDark ? '#f0f0f2' : '#0f0f10',
                  lineHeight: 1,
                }}>
                  {count}
                </span>
              </div>
              
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: isDark ? '#6a6a7a' : '#8a8a9a',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}>
                {b.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Bucket Badge */}
      <div style={{ 
        marginBottom: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <Badge variant={BUCKETS.find((b) => b.key === activeBucket)?.variant || 'default'}>
          {BUCKETS.find((b) => b.key === activeBucket)?.label}
        </Badge>
        <span style={{ 
          fontSize: '12px', 
          color: isDark ? '#6a6a7a' : '#8a8a9a',
          fontWeight: 500
        }}>
          {activeData.length} items in this age range
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={activeData}
        loading={stockAgingLoading}
        emptyIcon={<Clock size={36} />}
        emptyText="No batches in this age range"
        keyField="batchNo"
      />
    </div>
  );
};

export default StockAgingPage;

//++++++++++++++++++++++++++++++++++++++++++++++++++++

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Clock } from 'lucide-react';
// import { fetchStockAging } from '../../services/features/purchase/purchaseSlice';
// import { SectionHeader, Badge, DataTable, StatCard } from '../../components/ui/UI';

// const BUCKETS = [
//   { key: '0-30', label: '0-30 Days', variant: 'active' },
//   { key: '31-60', label: '31-60 Days', variant: 'active' },
//   { key: '61-90', label: '61-90 Days', variant: 'pending' },
//   { key: '91-180', label: '91-180 Days', variant: 'pending' },
//   { key: '180+', label: '180+ Days', variant: 'inactive' },
// ];

// const StockAgingPage = () => {
//   const dispatch = useDispatch();
//   const { stockAging, stockAgingLoading } = useSelector((s) => s.purchases);
//   const [activeBucket, setActiveBucket] = useState('0-30');

//   useEffect(() => { dispatch(fetchStockAging()); }, [dispatch]);

//   const columns = [
//     { key: 'productName', label: 'Product' },
//     { key: 'sku', label: 'SKU' },
//     { key: 'batchNo', label: 'Batch' },
//     { key: 'inwardDate', label: 'Inward Date', render: (v) => new Date(v).toLocaleDateString() },
//     { key: 'daysInStock', label: 'Days in Stock' },
//     { key: 'quantityAvailable', label: 'Qty Available' },
//   ];

//   return (
//     <div>
//       <SectionHeader title="Stock Aging" />
//       <div className="cards-grid" style={{ marginBottom: 20 }}>
//         {BUCKETS.map((b) => (
//           <div key={b.key} style={{ outline: activeBucket === b.key ? '2px solid var(--red)' : 'none', borderRadius: 'var(--radius)' }}>
//             <StatCard
//               label={b.label}
//               value={(stockAging[b.key] || []).length}
//               onClick={() => setActiveBucket(b.key)}
//               accent={b.key === activeBucket ? 'red' : 'blue'}
//             />
//           </div>
//         ))}
//       </div>
//       <div style={{ marginBottom: 10 }}>
//         <Badge variant="default">{BUCKETS.find((b) => b.key === activeBucket)?.label}</Badge>
//       </div>
//       <DataTable
//         columns={columns}
//         data={stockAging[activeBucket] || []}
//         loading={stockAgingLoading}
//         emptyIcon={<Clock size={36} />}
//         emptyText="No batches in this age range"
//         keyField="batchNo"
//       />
//     </div>
//   );
// };

// export default StockAgingPage;
