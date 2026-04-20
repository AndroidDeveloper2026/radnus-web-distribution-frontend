import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Store } from 'lucide-react';
import { fetchRetailers, addRetailer, updateRetailerStatus } from '../../services/features/retailer/retailerSlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import { SectionHeader, Button, Badge, Modal, Input, Select, DataTable, Avatar, toast, ConfirmDialog } from '../../components/ui/UI';
import locationData from '../../assets/json/Location.json';

/* ─── Onboarding Modal ───────────────────────────────────────────────────────── */
const RetailerModal = ({ open, onClose, onSave }) => {
  const [vals, setVals] = useState({ shopName: '', ownerName: '', phone: '', email: '', state: '', district: '', city: '', address: '', password: '' });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);

  const states    = Object.keys(locationData || {});
  const districts = vals.state ? Object.keys(locationData[vals.state] || {}) : [];

  const set = (k, v) => { setVals(p => ({ ...p, [k]: v, ...(k === 'state' ? { district: '', city: '' } : k === 'district' ? { city: '' } : {}) })); setErrs(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!vals.shopName)   e.shopName  = 'Shop name required';
    if (!vals.ownerName)  e.ownerName = 'Owner name required';
    if (!vals.phone || vals.phone.length < 10) e.phone = 'Valid phone required';
    if (!vals.password || vals.password.length < 6) e.password = 'Min 6 characters';
    setErrs(e); return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try { await onSave(fd); onClose(); toast.success('Retailer onboarded'); }
    catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const stateOpts    = [{ value: '', label: 'Select state' },    ...states.map(s => ({ value: s, label: s }))];
  const districtOpts = [{ value: '', label: 'Select district' }, ...districts.map(d => ({ value: d, label: d }))];

  useEffect(() => { if (!open) setVals({ shopName: '', ownerName: '', phone: '', email: '', state: '', district: '', city: '', address: '', password: '' }); setErrs({}); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Onboard New Retailer" size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handleSave}>Onboard Retailer</Button></>}
    >
      <div className="form-row">
        <Input label="Shop Name"  placeholder="Retail store name" value={vals.shopName}  onChange={e => set('shopName',  e.target.value)} error={errs.shopName} />
        <Input label="Owner Name" placeholder="Full name"          value={vals.ownerName} onChange={e => set('ownerName', e.target.value)} error={errs.ownerName} />
      </div>
      <div className="form-row">
        <Input label="Phone"    type="tel"   placeholder="10-digit mobile" value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
        <Input label="Email"    type="email" placeholder="Email (optional)" value={vals.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div className="form-row">
        <Select label="State"    options={stateOpts}    value={vals.state}    onChange={e => set('state',    e.target.value)} />
        <Select label="District" options={districtOpts} value={vals.district} onChange={e => set('district', e.target.value)} />
      </div>
      <div className="form-row">
        <Input label="City / Town" placeholder="City"    value={vals.city}    onChange={e => set('city',    e.target.value)} />
        <Input label="Address"     placeholder="Address" value={vals.address} onChange={e => set('address', e.target.value)} />
      </div>
      <Input label="Set Password" type="password" placeholder="Min 6 characters" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
    </Modal>
  );
};

/* ─── Retailer Detail Modal ──────────────────────────────────────────────────── */
const RetailerDetail = ({ open, onClose, retailer }) => {
  if (!retailer) return null;
  return (
    <Modal open={open} onClose={onClose} title="Retailer Profile" size="md" footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Avatar name={retailer.shopName || retailer.name || ''} size="lg" />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{retailer.shopName || retailer.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{retailer.ownerName || retailer.owner}</div>
          <Badge variant={retailer.status === 'Active' ? 'active' : 'inactive'} style={{ marginTop: 6 }}>{retailer.status || 'Pending'}</Badge>
        </div>
      </div>
      <div className="divider" />
      <div className="form-row">
        <div><div className="field-label" style={{ marginBottom: 4 }}>Phone</div><div>{retailer.phone || '—'}</div></div>
        <div><div className="field-label" style={{ marginBottom: 4 }}>Email</div><div>{retailer.email || '—'}</div></div>
      </div>
      <div className="form-row" style={{ marginTop: 14 }}>
        <div><div className="field-label" style={{ marginBottom: 4 }}>City</div><div>{retailer.city || '—'}</div></div>
        <div><div className="field-label" style={{ marginBottom: 4 }}>State</div><div>{retailer.state || '—'}</div></div>
      </div>
      {retailer.address && <div style={{ marginTop: 14 }}><div className="field-label" style={{ marginBottom: 4 }}>Address</div><div>{retailer.address}</div></div>}
    </Modal>
  );
};

/* ═══ Retailers Page ════════════════════════════════════════════════════════════ */
const RetailersPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { list: retailers, loading } = useSelector(s => s.retailer);

  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  useEffect(() => { dispatch(fetchRetailers()); }, [dispatch]);

  const filtered = retailers.filter(r =>
    !search ||
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.includes(search)
  );

  const handleAdd = async (fd) => { await dispatch(addRetailer(fd)).unwrap(); };
  const handleToggle = async (r) => {
    const newStatus = r.status === 'Active' ? 'Inactive' : 'Active';
    await dispatch(updateRetailerStatus({ id: r._id, status: newStatus })).unwrap();
    toast.success(`Retailer ${newStatus.toLowerCase()}`);
    setStatusTarget(null);
  };

  const canManage = ['Admin', 'Radnus', 'MarketingManager', 'MarketingExecutive', 'FSE', 'Distributor'].includes(role);

  const columns = [
    {
      key: 'name', label: 'Retailer',
      render: (_, r) => (
        <div className="avatar-row">
          <Avatar name={r.shopName || r.name || ''} size="sm" />
          <div className="avatar-row-info">
            <span className="avatar-row-name">{r.shopName || r.name || '—'}</span>
            <span className="avatar-row-sub">{r.ownerName || r.owner || ''}</span>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone',    render: (v) => v || '—' },
    { key: 'city',  label: 'City',     render: (v) => v || '—' },
    { key: 'state', label: 'State',    render: (v) => v || '—' },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={v === 'Active' ? 'active' : v === 'Inactive' ? 'inactive' : 'pending'}>{v || 'Pending'}</Badge>,
    },
    {
      key: '_id', label: 'Actions',
      render: (_, r) => (
        <div className="td-actions">
          <Button variant="outline" size="xs" onClick={() => setViewTarget(r)}>View</Button>
          {canManage && (
            <Button variant={r.status === 'Active' ? 'secondary' : 'success'} size="xs" onClick={() => setStatusTarget(r)}>
              {r.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Retailer Management"
        count={retailers.length}
        action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Onboard Retailer</Button>}
      />
      <DataTable
        columns={columns} data={filtered} loading={loading}
        searchValue={search} onSearch={setSearch} searchPlaceholder="Search by name, city, phone…"
        emptyIcon={<Store size={36} />} emptyText="No retailers found"
      />
      <RetailerModal open={modal} onClose={() => setModal(false)} onSave={handleAdd} />
      <RetailerDetail open={!!viewTarget} onClose={() => setViewTarget(null)} retailer={viewTarget} />
      <ConfirmDialog
        open={!!statusTarget} onClose={() => setStatusTarget(null)}
        onConfirm={() => handleToggle(statusTarget)}
        title={`${statusTarget?.status === 'Active' ? 'Deactivate' : 'Activate'} Retailer`}
        message={`Are you sure you want to ${statusTarget?.status === 'Active' ? 'deactivate' : 'activate'} ${statusTarget?.shopName || statusTarget?.name}?`}
        confirmLabel={statusTarget?.status === 'Active' ? 'Deactivate' : 'Activate'}
        variant={statusTarget?.status === 'Active' ? 'danger' : 'success'}
      />
    </div>
  );
};

export default RetailersPage;
