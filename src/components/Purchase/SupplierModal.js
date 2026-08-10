import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, Textarea, Select } from '../ui/UI';

const emptyForm = { name: '', mobile: '', email: '', gstNo: '', address: '', status: 'Active' };

/**
 * Add / Edit Supplier modal. Used both from Supplier Master (full CRUD)
 * and from Purchase Entry's "New Supplier" quick-add action.
 */
const SupplierModal = ({ open, onClose, onSave, supplier }) => {
  const [vals, setVals] = useState(emptyForm);
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVals(supplier ? { ...emptyForm, ...supplier } : emptyForm);
      setErrs({});
    }
  }, [open, supplier]);

  const set = (k, v) => { setVals((p) => ({ ...p, [k]: v })); setErrs((p) => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!vals.name?.trim()) e.name = 'Supplier name is required';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        name: vals.name,
        mobile: vals.mobile,
        email: vals.email,
        gstNo: vals.gstNo,
        address: vals.address,
        status: vals.status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add Supplier'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {supplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </>
      }
    >
      <div className="form-row">
        <Input label="Supplier Name *" value={vals.name} onChange={(e) => set('name', e.target.value)} error={errs.name} />
        <Input label="Mobile" value={vals.mobile} onChange={(e) => set('mobile', e.target.value)} />
      </div>
      <div className="form-row" style={{ marginTop: 14 }}>
        <Input label="Email" type="email" value={vals.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="GST No" value={vals.gstNo} onChange={(e) => set('gstNo', e.target.value)} />
      </div>
      <div style={{ marginTop: 14 }}>
        <Textarea label="Address" rows={2} value={vals.address} onChange={(e) => set('address', e.target.value)} />
      </div>
      {supplier && (
        <div style={{ marginTop: 14 }}>
          <Select
            label="Status"
            options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
            value={vals.status}
            onChange={(e) => set('status', e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
};

export default SupplierModal;
