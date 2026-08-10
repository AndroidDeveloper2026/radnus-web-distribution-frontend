import React from 'react';
import { Card, SectionHeader, Input, Button } from '../ui/UI';

const Row = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: bold ? 15 : 13.5 }}>
    <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 700 : 500 }}>{label}</span>
    <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 700 : 600 }}>{value}</span>
  </div>
);

/**
 * Summary panel — Subtotal / Discount / GST / Grand Total / Paid / Due,
 * plus Save / Reset / Cancel actions.
 */
const PurchaseSummary = ({
  subtotal, discount, onDiscountChange,
  gstAmount, grandTotal, paidAmount, onPaidAmountChange,
  dueAmount, onSave, onReset, onCancel, saving,
}) => {
  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

  return (
    <Card className="card-pad">
      <SectionHeader title="Summary" />
      <Row label="Subtotal" value={fmt(subtotal)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 500 }}>Discount</span>
        <Input
          type="number" min="0" step="0.01" value={discount}
          onChange={(e) => onDiscountChange(e.target.value)}
          style={{ maxWidth: 140 }} className="field" 
        />
      </div>
      <Row label="GST" value={fmt(gstAmount)} />
      <div className="divider" />
      <Row label="Grand Total" value={fmt(grandTotal)} bold />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 500 }}>Paid Amount</span>
        <Input
          type="number" min="0" step="0.01" value={paidAmount}
          onChange={(e) => onPaidAmountChange(e.target.value)}
          style={{ maxWidth: 140 }} className="field"
        />
      </div>
      <Row label="Due Amount" value={fmt(dueAmount)} bold />

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Button variant="primary" fullWidth loading={saving} onClick={onSave}>Save Purchase</Button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <Button variant="secondary" fullWidth onClick={onReset}>Reset</Button>
        <Button variant="ghost" fullWidth onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
};

export default PurchaseSummary;
