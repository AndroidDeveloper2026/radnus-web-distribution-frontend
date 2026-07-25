import React, { useState, useMemo } from 'react';
import { Card, Badge } from '../ui/UI';
import { ChevronDown, ChevronUp, Package, ArrowDown, Layers } from 'lucide-react';
import './BatchInsights.css';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const rupee = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

// Pure client-side mirror of the backend's greedy FIFO allocation — used
// only to render a live preview as the cashier types a quantity. The
// authoritative allocation + stock decrement always happens server-side
// inside the invoice-creation transaction; this never writes anything.
export function computeAllocationPreview(queue, qty) {
  const requested = Number(qty) || 0;
  if (!requested) return { allocations: [], shortfall: 0 };

  let remaining = requested;
  const allocations = [];
  for (const batch of queue) {
    if (remaining <= 0) break;
    if (batch.quantityAvailable <= 0) continue;
    const take = Math.min(batch.quantityAvailable, remaining);
    allocations.push({ ...batch, allocatedQty: take });
    remaining -= take;
  }
  return { allocations, shortfall: remaining };
}

/* ─── Current Selling Batch ──────────────────────────────────────────────── */
export const CurrentBatchCard = ({ batch }) => {
  if (!batch) {
    return (
      <Card className="batch-card batch-card-empty">
        <div className="batch-empty-msg"><Package size={18} /> No stock batches for this product yet</div>
      </Card>
    );
  }
  return (
    <Card className="batch-card batch-card-active">
      <div className="batch-card-top">
        <Badge variant="active" dot>ACTIVE</Badge>
        <span className="batch-fifo-tag">FIFO Active</span>
      </div>
      <div className="batch-no">{batch.batchNo}</div>
      <div className="batch-grid">
        <div><span className="batch-label">Purchase Date</span><span className="batch-value">{formatDate(batch.inwardDate)}</span></div>
        <div><span className="batch-label">Remaining Qty</span><span className="batch-value">{batch.quantityAvailable}</span></div>
        <div><span className="batch-label">Purchase Cost</span><span className="batch-value">{rupee(batch.purchasePrice)}</span></div>
        <div><span className="batch-label">Supplier</span><span className="batch-value">{batch.supplierName || '—'}</span></div>
      </div>
    </Card>
  );
};

/* ─── Next Batch ──────────────────────────────────────────────────────────── */
export const NextBatchCard = ({ batch }) => {
  if (!batch) return null;
  return (
    <Card className="batch-card batch-card-waiting">
      <div className="batch-card-top">
        <Badge variant="pending" dot>WAITING</Badge>
      </div>
      <div className="batch-no">{batch.batchNo}</div>
      <div className="batch-grid">
        <div><span className="batch-label">Purchase Date</span><span className="batch-value">{formatDate(batch.inwardDate)}</span></div>
        <div><span className="batch-label">Remaining Qty</span><span className="batch-value">{batch.quantityAvailable}</span></div>
        <div><span className="batch-label">Purchase Cost</span><span className="batch-value">{rupee(batch.purchasePrice)}</span></div>
      </div>
    </Card>
  );
};

/* ─── Upcoming Batches (collapsible) ─────────────────────────────────────── */
export const UpcomingBatchesTimeline = ({ batches }) => {
  const [open, setOpen] = useState(false);
  if (!batches || batches.length === 0) return null;
  return (
    <Card className="batch-upcoming">
      <button className="batch-upcoming-toggle" onClick={() => setOpen((o) => !o)}>
        <span>Upcoming Batches ({batches.length})</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="batch-upcoming-list">
          {batches.map((b) => (
            <div className="batch-upcoming-row" key={b.batchId}>
              <span className="batch-upcoming-no">{b.batchNo}</span>
              <span>{formatDate(b.inwardDate)}</span>
              <span>{b.quantityAvailable} pcs</span>
              <span>{rupee(b.purchasePrice)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/* ─── Batch Allocation Panel ──────────────────────────────────────────────── */
export const BatchAllocationPanel = ({ productName, qty, allocations, shortfall }) => {
  if (!qty) return null;
  return (
    <Card className="batch-allocation-panel">
      <div className="alloc-header">
        <Layers size={16} />
        <span>Batch Allocation — {productName} × {qty}</span>
      </div>
      {shortfall > 0 && (
        <div className="alloc-shortfall">
          Only {qty - shortfall} of {qty} can be fulfilled from current stock.
        </div>
      )}
      <div className="alloc-table">
        <div className="alloc-row alloc-row-head">
          <span>Batch</span><span>Available Qty</span><span>Allocated Qty</span><span>Purchase Cost</span><span>Amount</span>
        </div>
        {allocations.map((a) => (
          <div className="alloc-row" key={a.batchId}>
            <span>{a.batchNo}</span>
            <span>{a.quantityAvailable}</span>
            <span className="alloc-qty">{a.allocatedQty}</span>
            <span>{rupee(a.purchasePrice)}</span>
            <span>{rupee(a.purchasePrice * a.allocatedQty)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ─── Batch Queue (full FIFO order) ──────────────────────────────────────── */
export const BatchQueue = ({ batches }) => {
  if (!batches || batches.length === 0) return null;
  return (
    <Card className="batch-queue">
      <div className="batch-queue-title">Batch Queue — FIFO Order</div>
      {batches.map((b) => (
        <div className={`batch-queue-row batch-queue-${b.status}`} key={b.batchId}>
          <span className="batch-queue-pos">{['①','②','③','④','⑤','⑥','⑦','⑧','⑨'][b.position - 1] || `#${b.position}`}</span>
          <div className="batch-queue-main">
            <span className="batch-queue-no">{b.batchNo}</span>
            <span className="batch-queue-meta">{formatDate(b.inwardDate)} · Qty {b.quantityAvailable} · {rupee(b.purchasePrice)}</span>
          </div>
          <Badge variant={b.status === 'active' ? 'active' : b.status === 'waiting' ? 'pending' : 'inactive'}>
            {b.status === 'finished' ? 'Finished' : b.status === 'active' ? 'Active' : 'Waiting'}
          </Badge>
        </div>
      ))}
    </Card>
  );
};

/* ─── Stock Movement (simple visual flow) ────────────────────────────────── */
export const StockMovementFlow = ({ batches }) => {
  const withStock = (batches || []).filter((b) => b.quantityAvailable > 0);
  if (withStock.length === 0) return null;
  return (
    <Card className="stock-flow">
      <div className="stock-flow-title">Stock Movement</div>
      <div className="stock-flow-track">
        {withStock.map((b, idx) => (
          <React.Fragment key={b.batchId}>
            <div className={`stock-flow-node ${idx === 0 ? 'stock-flow-node-active' : ''}`}>{b.batchNo}</div>
            {idx < withStock.length - 1 && <ArrowDown size={14} className="stock-flow-arrow" />}
          </React.Fragment>
        ))}
      </div>
      <div className="stock-flow-labels"><span>Oldest</span><span>Newest</span></div>
    </Card>
  );
};

/* ─── FIFO Logic Explainer ────────────────────────────────────────────────── */
export const FifoLogicCard = () => (
  <Card className="fifo-logic-card">
    <div className="fifo-logic-title">How FIFO Billing Works</div>
    <div className="fifo-logic-flow">
      {['Purchase Entry', 'Batch Queue', 'Billing', 'Automatic Allocation', 'Stock Update'].map((step, i, arr) => (
        <React.Fragment key={step}>
          <div className="fifo-logic-step">{step}</div>
          {i < arr.length - 1 && <ArrowDown size={14} className="fifo-logic-arrow" />}
        </React.Fragment>
      ))}
    </div>
    <div className="fifo-logic-note">No manual batch selection — the oldest available stock is always billed first.</div>
  </Card>
);
