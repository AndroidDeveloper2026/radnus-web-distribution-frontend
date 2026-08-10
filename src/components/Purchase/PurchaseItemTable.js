import React from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';
import { Card, SectionHeader, DataTable, Button } from '../ui/UI';

/**
 * Draft line-items table shown while building a Purchase Entry.
 * Reuses the shared DataTable primitive (same one used across the app)
 * rather than a bespoke table.
 */
const PurchaseItemTable = ({ items = [], onEdit, onDelete }) => {
  const columns = [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'quantity', label: 'Qty' },
    { key: 'purchasePrice', label: 'Purchase Price', render: (v) => `₹${Number(v).toFixed(2)}` },
    { key: 'mrp', label: 'MRP', render: (v) => `₹${Number(v || 0).toFixed(2)}` },
    { key: 'gst', label: 'GST %', render: (v) => `${v || 0}%` },
    { key: 'batchNo', label: 'Batch', render: (v) => v || 'Auto' },
    { key: 'rackNo', label: 'Rack', render: (v) => v || '—' },
    { key: 'total', label: 'Total', render: (v) => `₹${Number(v).toFixed(2)}` },
    {
      key: '_row', label: 'Actions',
      render: (_, row) => (
        <div className="td-actions">
          <Button variant="outline" size="xs" onClick={() => onEdit(row.__index)} icon={<Pencil size={13} />} />
          <Button variant="danger" size="xs" onClick={() => onDelete(row.__index)} icon={<Trash2 size={13} />} />
        </div>
      ),
    },
  ];

  const dataWithIndex = items.map((item, idx) => ({ ...item, __index: idx, _id: idx }));

  return (
    <Card className="card-pad">
      <SectionHeader title="Items" count={items.length} />
      <DataTable
        columns={columns}
        data={dataWithIndex}
        emptyIcon={<Package size={36} />}
        emptyText="No items added yet"
      />
    </Card>
  );
};

export default PurchaseItemTable;
