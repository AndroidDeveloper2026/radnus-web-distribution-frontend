// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { PackageX } from 'lucide-react';
// import { fetchNonMovingStock } from '../../services/features/purchase/purchaseSlice';
// import { SectionHeader, DataTable, Input, Button } from '../../components/ui/UI';

// const NonMovingStockPage = () => {
//   const dispatch = useDispatch();
//   const { nonMovingStock, nonMovingLoading } = useSelector((s) => s.purchases);
//   const [days, setDays] = useState('60');

//   useEffect(() => { dispatch(fetchNonMovingStock(Number(days) || 60)); }, [dispatch]); // eslint-disable-line

//   const columns = [
//     { key: 'productName', label: 'Product' },
//     { key: 'sku', label: 'SKU' },
//     { key: 'batchNo', label: 'Batch' },
//     { key: 'supplierName', label: 'Supplier' },
//     { key: 'inwardDate', label: 'Inward Date', render: (v) => new Date(v).toLocaleDateString() },
//     { key: 'lastSaleDate', label: 'Last Sale Date', render: (v) => (v ? new Date(v).toLocaleDateString() : 'Never sold') },
//     { key: 'daysInStock', label: 'Days in Stock' },
//     { key: 'quantityAvailable', label: 'Qty Available' },
//   ];

//   return (
//     <div>
//       <SectionHeader title="Non-Moving Stock" count={nonMovingStock.length} />
//       <div style={{ display: 'flex', gap: 10, alignItems: 'end', marginBottom: 16, maxWidth: 320 }}>
//         <Input
//           label="No sales in the last (days)"
//           type="number" min="1" value={days}
//           onChange={(e) => setDays(e.target.value)}
//         />
//         <Button variant="primary" onClick={() => dispatch(fetchNonMovingStock(Number(days) || 60))}>Apply</Button>
//       </div>
//       <DataTable
//         columns={columns}
//         data={nonMovingStock}
//         loading={nonMovingLoading}
//         emptyIcon={<PackageX size={36} />}
//         emptyText="No non-moving stock found"
//         keyField="batchNo"
//       />
//     </div>
//   );
// };

// export default NonMovingStockPage;

// //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// // import React, { useEffect, useState } from 'react';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { PackageX } from 'lucide-react';
// // import { fetchNonMovingStock } from '../../services/features/purchase/purchaseSlice';
// // import { SectionHeader, DataTable, Input, Button } from '../../components/ui/UI';

// // const NonMovingStockPage = () => {
// //   const dispatch = useDispatch();
// //   const { nonMovingStock, nonMovingLoading } = useSelector((s) => s.purchases);
// //   const [days, setDays] = useState('60');

// //   useEffect(() => { dispatch(fetchNonMovingStock(Number(days) || 60)); }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

// //   const columns = [
// //     { key: 'productName', label: 'Product' },
// //     { key: 'sku', label: 'SKU' },
// //     { key: 'batchNo', label: 'Batch' },
// //     { key: 'supplierName', label: 'Supplier' },
// //     { key: 'inwardDate', label: 'Inward Date', render: (v) => new Date(v).toLocaleDateString() },
// //     { key: 'lastSaleDate', label: 'Last Sale Date', render: (v) => (v ? new Date(v).toLocaleDateString() : 'Never sold') },
// //     { key: 'daysInStock', label: 'Days in Stock' },
// //     { key: 'quantityAvailable', label: 'Qty Available' },
// //   ];

// //   return (
// //     <div>
// //       <SectionHeader title="Non-Moving Stock" count={nonMovingStock.length} />
// //       <div style={{ display: 'flex', gap: 10, alignItems: 'end', marginBottom: 16, maxWidth: 320 }}>
// //         <Input
// //           label="No sales in the last (days)"
// //           type="number" min="1" value={days}
// //           onChange={(e) => setDays(e.target.value)}
// //         />
// //         <Button variant="primary" onClick={() => dispatch(fetchNonMovingStock(Number(days) || 60))}>Apply</Button>
// //       </div>
// //       <DataTable
// //         columns={columns}
// //         data={nonMovingStock}
// //         loading={nonMovingLoading}
// //         emptyIcon={<PackageX size={36} />}
// //         emptyText="No non-moving stock found"
// //         keyField="batchNo"
// //       />
// //     </div>
// //   );
// // };

// // export default NonMovingStockPage;
