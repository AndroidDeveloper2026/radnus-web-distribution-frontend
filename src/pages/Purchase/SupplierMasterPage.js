import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Truck } from 'lucide-react';
import {
  fetchSuppliers, addSupplier, updateSupplier, deleteSupplier,
} from '../../services/features/purchase/supplierSlice';
import { SectionHeader, Button, Badge, DataTable, toast, ConfirmDialog } from '../../components/ui/UI';
import SupplierModal from '../../components/Purchase/SupplierModal';

const SupplierMasterPage = () => {
  const dispatch = useDispatch();
  const { list: suppliers, loading } = useSelector((s) => s.suppliers);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { dispatch(fetchSuppliers()); }, [dispatch]);

  const filtered = suppliers.filter((s) =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.mobile?.includes(search) ||
    s.gstNo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (payload) => {
    try {
      if (editTarget) {
        await dispatch(updateSupplier({ id: editTarget._id, payload })).unwrap();
        toast.success('Supplier updated');
      } else {
        await dispatch(addSupplier(payload)).unwrap();
        toast.success('Supplier added');
      }
    } catch (err) {
      toast.error(err || 'Failed to save supplier');
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteSupplier(deleteTarget._id)).unwrap();
      toast.success('Supplier deleted');
    } catch (err) {
      toast.error(err || 'Failed to delete supplier');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Supplier Name' },
    { key: 'mobile', label: 'Mobile', render: (v) => v || '—' },
    { key: 'gstNo', label: 'GST No', render: (v) => v || '—' },
    { key: 'purchaseCount', label: 'Purchases', render: (v) => v ?? 0 },
    {
      key: 'outstandingBalance', label: 'Outstanding',
      render: (v) => <span style={{ color: v > 0 ? 'var(--red)' : 'var(--text-secondary)', fontWeight: 600 }}>₹{Number(v || 0).toFixed(2)}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={v === 'Active' ? 'active' : 'inactive'}>{v || 'Active'}</Badge>,
    },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <div className="td-actions">
          <Button variant="outline" size="xs" onClick={() => { setEditTarget(row); setModalOpen(true); }}>Edit</Button>
          <Button variant="danger" size="xs" onClick={() => setDeleteTarget(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Supplier Master"
        count={suppliers.length}
        action={<Button variant="primary" size="sm" onClick={() => { setEditTarget(null); setModalOpen(true); }}>+ Add Supplier</Button>}
      />
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, mobile, GST no…"
        emptyIcon={<Truck size={36} />}
        emptyText="No suppliers found"
      />
      <SupplierModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        supplier={editTarget}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SupplierMasterPage;
