// // src/components/Billing/BatchInsights.js

// import React from 'react';
// import { Calendar, Package, TrendingUp, TrendingDown } from 'lucide-react';

// export const computeAllocationPreview = (queue, requestedQty) => {
//   let remaining = requestedQty;
//   const allocations = [];
//   let shortfall = 0;

//   // Sort batches by purchase date (oldest first)
//   const sortedBatches = [...queue].sort((a, b) => 
//     new Date(a.purchaseDate) - new Date(b.purchaseDate)
//   );

//   for (const batch of sortedBatches) {
//     if (remaining <= 0) break;

//     const available = batch.quantityAvailable || 0;
//     const allocate = Math.min(remaining, available);

//     if (allocate > 0) {
//       allocations.push({
//         batchNumber: batch.batchNumber,
//         allocatedQty: allocate,
//         purchasePrice: batch.purchasePrice || 0,
//         amount: (batch.purchasePrice || 0) * allocate
//       });
//       remaining -= allocate;
//     }
//   }

//   if (remaining > 0) {
//     shortfall = remaining;
//   }

//   return { allocations, shortfall };
// };

// export const CurrentBatchCard = ({ batch }) => {
//   if (!batch) {
//     return (
//       <div className="batch-card empty">
//         <div className="batch-card-title">Current Batch</div>
//         <div className="batch-card-empty">No active batch</div>
//       </div>
//     );
//   }

//   return (
//     <div className="batch-card active">
//       <div className="batch-card-title">
//         <Package size={16} /> Current Batch
//       </div>
//       <div className="batch-card-number">{batch.batchNumber}</div>
//       <div className="batch-card-details">
//         <div className="batch-card-detail">
//           <Calendar size={14} />
//           <span>{new Date(batch.purchaseDate).toLocaleDateString()}</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Cost:</span>
//           <span>₹{batch.purchasePrice || 0}</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Available:</span>
//           <span>{batch.quantityAvailable || 0} units</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Supplier:</span>
//           <span>{batch.supplier || '—'}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export const NextBatchCard = ({ batch }) => {
//   if (!batch) {
//     return (
//       <div className="batch-card empty">
//         <div className="batch-card-title">Next Batch</div>
//         <div className="batch-card-empty">No waiting batch</div>
//       </div>
//     );
//   }

//   return (
//     <div className="batch-card waiting">
//       <div className="batch-card-title">
//         <Package size={16} /> Next Batch
//       </div>
//       <div className="batch-card-number">{batch.batchNumber}</div>
//       <div className="batch-card-details">
//         <div className="batch-card-detail">
//           <Calendar size={14} />
//           <span>{new Date(batch.purchaseDate).toLocaleDateString()}</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Cost:</span>
//           <span>₹{batch.purchasePrice || 0}</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Available:</span>
//           <span>{batch.quantityAvailable || 0} units</span>
//         </div>
//         <div className="batch-card-detail">
//           <span className="batch-card-label">Supplier:</span>
//           <span>{batch.supplier || '—'}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export const BatchAllocationPanel = ({ productName, qty, allocations, shortfall }) => {
//   const totalCost = allocations.reduce((sum, a) => sum + a.amount, 0);

//   return (
//     <div className="batch-allocation-panel">
//       <div className="batch-allocation-title">
//         Batch Allocation — {productName} × {qty}
//       </div>
//       {allocations.length > 0 ? (
//         <>
//           <table className="batch-allocation-table">
//             <thead>
//               <tr>
//                 <th>Batch</th>
//                 <th>Available</th>
//                 <th>Allocated</th>
//                 <th>Purchase Cost</th>
//                 <th>Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {allocations.map((alloc, idx) => (
//                 <tr key={idx}>
//                   <td>{alloc.batchNumber}</td>
//                   <td>—</td>
//                   <td>{alloc.allocatedQty}</td>
//                   <td>₹{alloc.purchasePrice}</td>
//                   <td>₹{alloc.amount}</td>
//                 </tr>
//               ))}
//               {shortfall > 0 && (
//                 <tr className="shortfall-row">
//                   <td colSpan="3">⚠️ Shortfall</td>
//                   <td colSpan="2">{shortfall} units unavailable</td>
//                 </tr>
//               )}
//             </tbody>
//             <tfoot>
//               <tr>
//                 <td colSpan="3">Total Purchase Cost</td>
//                 <td colSpan="2">₹{totalCost}</td>
//               </tr>
//             </tfoot>
//           </table>
//         </>
//       ) : (
//         <div className="batch-allocation-empty">No allocations</div>
//       )}
//     </div>
//   );
// };

// export const BatchQueue = ({ batches }) => {
//   if (!batches || batches.length === 0) {
//     return <div className="batch-queue-empty">No batches in queue</div>;
//   }

//   const sorted = [...batches].sort((a, b) => 
//     new Date(a.purchaseDate) - new Date(b.purchaseDate)
//   );

//   return (
//     <div className="batch-queue">
//       <div className="batch-queue-title">Batch Queue — FIFO Order</div>
//       <div className="batch-queue-list">
//         {sorted.map((batch, idx) => (
//           <div key={batch.batchNumber} className={`batch-queue-item ${batch.status}`}>
//             <div className="batch-queue-number">{batch.batchNumber}</div>
//             <div className="batch-queue-details">
//               <span>{new Date(batch.purchaseDate).toLocaleDateString()}</span>
//               <span>Qty {batch.quantityAvailable || 0}</span>
//               <span>₹{batch.purchasePrice || 0}</span>
//             </div>
//             <div className={`batch-queue-status ${batch.status}`}>
//               {batch.status || 'active'}
//             </div>
//             {idx === 0 && <span className="batch-queue-oldest">Oldest</span>}
//             {idx === sorted.length - 1 && <span className="batch-queue-newest">Newest</span>}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export const FifoLogicCard = () => {
//   return (
//     <div className="fifo-logic-card">
//       <h4>How FIFO Billing Works</h4>
//       <div className="fifo-flow">
//         <span>Purchase Entry</span>
//         <span>→</span>
//         <span>Batch Queue</span>
//         <span>→</span>
//         <span>Billing</span>
//         <span>→</span>
//         <span>Automatic Allocation</span>
//         <span>→</span>
//         <span>Stock Update</span>
//       </div>
//       <p>No manual batch selection — the oldest available stock is always billed first.</p>
//     </div>
//   );
// };

// //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // import React, { useState, useMemo } from 'react';
// // import { Card, Badge } from '../ui/UI';
// // import { ChevronDown, ChevronUp, Package, ArrowDown, Layers } from 'lucide-react';
// // import './BatchInsights.css';

// // const formatDate = (d) => {
// //   if (!d) return '—';
// //   return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// // };
// // const rupee = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

// // // Pure client-side mirror of the backend's greedy FIFO allocation — used
// // // only to render a live preview as the cashier types a quantity. The
// // // authoritative allocation + stock decrement always happens server-side
// // // inside the invoice-creation transaction; this never writes anything.
// // export function computeAllocationPreview(queue, qty) {
// //   const requested = Number(qty) || 0;
// //   if (!requested) return { allocations: [], shortfall: 0 };

// //   let remaining = requested;
// //   const allocations = [];
// //   for (const batch of queue) {
// //     if (remaining <= 0) break;
// //     if (batch.quantityAvailable <= 0) continue;
// //     const take = Math.min(batch.quantityAvailable, remaining);
// //     allocations.push({ ...batch, allocatedQty: take });
// //     remaining -= take;
// //   }
// //   return { allocations, shortfall: remaining };
// // }

// // /* ─── Current Selling Batch ──────────────────────────────────────────────── */
// // export const CurrentBatchCard = ({ batch }) => {
// //   if (!batch) {
// //     return (
// //       <Card className="batch-card batch-card-empty">
// //         <div className="batch-empty-msg"><Package size={18} /> No stock batches for this product yet</div>
// //       </Card>
// //     );
// //   }
// //   return (
// //     <Card className="batch-card batch-card-active">
// //       <div className="batch-card-top">
// //         <Badge variant="active" dot>ACTIVE</Badge>
// //         <span className="batch-fifo-tag">FIFO Active</span>
// //       </div>
// //       <div className="batch-no">{batch.batchNo}</div>
// //       <div className="batch-grid">
// //         <div><span className="batch-label">Purchase Date</span><span className="batch-value">{formatDate(batch.inwardDate)}</span></div>
// //         <div><span className="batch-label">Remaining Qty</span><span className="batch-value">{batch.quantityAvailable}</span></div>
// //         <div><span className="batch-label">Purchase Cost</span><span className="batch-value">{rupee(batch.purchasePrice)}</span></div>
// //         <div><span className="batch-label">Supplier</span><span className="batch-value">{batch.supplierName || '—'}</span></div>
// //       </div>
// //     </Card>
// //   );
// // };

// // /* ─── Next Batch ──────────────────────────────────────────────────────────── */
// // export const NextBatchCard = ({ batch }) => {
// //   if (!batch) return null;
// //   return (
// //     <Card className="batch-card batch-card-waiting">
// //       <div className="batch-card-top">
// //         <Badge variant="pending" dot>WAITING</Badge>
// //       </div>
// //       <div className="batch-no">{batch.batchNo}</div>
// //       <div className="batch-grid">
// //         <div><span className="batch-label">Purchase Date</span><span className="batch-value">{formatDate(batch.inwardDate)}</span></div>
// //         <div><span className="batch-label">Remaining Qty</span><span className="batch-value">{batch.quantityAvailable}</span></div>
// //         <div><span className="batch-label">Purchase Cost</span><span className="batch-value">{rupee(batch.purchasePrice)}</span></div>
// //       </div>
// //     </Card>
// //   );
// // };

// // /* ─── Upcoming Batches (collapsible) ─────────────────────────────────────── */
// // export const UpcomingBatchesTimeline = ({ batches }) => {
// //   const [open, setOpen] = useState(false);
// //   if (!batches || batches.length === 0) return null;
// //   return (
// //     <Card className="batch-upcoming">
// //       <button className="batch-upcoming-toggle" onClick={() => setOpen((o) => !o)}>
// //         <span>Upcoming Batches ({batches.length})</span>
// //         {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
// //       </button>
// //       {open && (
// //         <div className="batch-upcoming-list">
// //           {batches.map((b) => (
// //             <div className="batch-upcoming-row" key={b.batchId}>
// //               <span className="batch-upcoming-no">{b.batchNo}</span>
// //               <span>{formatDate(b.inwardDate)}</span>
// //               <span>{b.quantityAvailable} pcs</span>
// //               <span>{rupee(b.purchasePrice)}</span>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </Card>
// //   );
// // };

// // /* ─── Batch Allocation Panel ──────────────────────────────────────────────── */
// // export const BatchAllocationPanel = ({ productName, qty, allocations, shortfall }) => {
// //   if (!qty) return null;
// //   return (
// //     <Card className="batch-allocation-panel">
// //       <div className="alloc-header">
// //         <Layers size={16} />
// //         <span>Batch Allocation — {productName} × {qty}</span>
// //       </div>
// //       {shortfall > 0 && (
// //         <div className="alloc-shortfall">
// //           Only {qty - shortfall} of {qty} can be fulfilled from current stock.
// //         </div>
// //       )}
// //       <div className="alloc-table">
// //         <div className="alloc-row alloc-row-head">
// //           <span>Batch</span><span>Available Qty</span><span>Allocated Qty</span><span>Purchase Cost</span><span>Amount</span>
// //         </div>
// //         {allocations.map((a) => (
// //           <div className="alloc-row" key={a.batchId}>
// //             <span>{a.batchNo}</span>
// //             <span>{a.quantityAvailable}</span>
// //             <span className="alloc-qty">{a.allocatedQty}</span>
// //             <span>{rupee(a.purchasePrice)}</span>
// //             <span>{rupee(a.purchasePrice * a.allocatedQty)}</span>
// //           </div>
// //         ))}
// //       </div>
// //     </Card>
// //   );
// // };

// // /* ─── Batch Queue (full FIFO order) ──────────────────────────────────────── */
// // export const BatchQueue = ({ batches }) => {
// //   if (!batches || batches.length === 0) return null;
// //   return (
// //     <Card className="batch-queue">
// //       <div className="batch-queue-title">Batch Queue — FIFO Order</div>
// //       {batches.map((b) => (
// //         <div className={`batch-queue-row batch-queue-${b.status}`} key={b.batchId}>
// //           <span className="batch-queue-pos">{['①','②','③','④','⑤','⑥','⑦','⑧','⑨'][b.position - 1] || `#${b.position}`}</span>
// //           <div className="batch-queue-main">
// //             <span className="batch-queue-no">{b.batchNo}</span>
// //             <span className="batch-queue-meta">{formatDate(b.inwardDate)} · Qty {b.quantityAvailable} · {rupee(b.purchasePrice)}</span>
// //           </div>
// //           <Badge variant={b.status === 'active' ? 'active' : b.status === 'waiting' ? 'pending' : 'inactive'}>
// //             {b.status === 'finished' ? 'Finished' : b.status === 'active' ? 'Active' : 'Waiting'}
// //           </Badge>
// //         </div>
// //       ))}
// //     </Card>
// //   );
// // };

// // /* ─── Stock Movement (simple visual flow) ────────────────────────────────── */
// // export const StockMovementFlow = ({ batches }) => {
// //   const withStock = (batches || []).filter((b) => b.quantityAvailable > 0);
// //   if (withStock.length === 0) return null;
// //   return (
// //     <Card className="stock-flow">
// //       <div className="stock-flow-title">Stock Movement</div>
// //       <div className="stock-flow-track">
// //         {withStock.map((b, idx) => (
// //           <React.Fragment key={b.batchId}>
// //             <div className={`stock-flow-node ${idx === 0 ? 'stock-flow-node-active' : ''}`}>{b.batchNo}</div>
// //             {idx < withStock.length - 1 && <ArrowDown size={14} className="stock-flow-arrow" />}
// //           </React.Fragment>
// //         ))}
// //       </div>
// //       <div className="stock-flow-labels"><span>Oldest</span><span>Newest</span></div>
// //     </Card>
// //   );
// // };

// // /* ─── FIFO Logic Explainer ────────────────────────────────────────────────── */
// // export const FifoLogicCard = () => (
// //   <Card className="fifo-logic-card">
// //     <div className="fifo-logic-title">How FIFO Billing Works</div>
// //     <div className="fifo-logic-flow">
// //       {['Purchase Entry', 'Batch Queue', 'Billing', 'Automatic Allocation', 'Stock Update'].map((step, i, arr) => (
// //         <React.Fragment key={step}>
// //           <div className="fifo-logic-step">{step}</div>
// //           {i < arr.length - 1 && <ArrowDown size={14} className="fifo-logic-arrow" />}
// //         </React.Fragment>
// //       ))}
// //     </div>
// //     <div className="fifo-logic-note">No manual batch selection — the oldest available stock is always billed first.</div>
// //   </Card>
// // );
