// // ═══════════════════════════════════════════════════════════════════════════════
// //  Distributors Page
// // ═══════════════════════════════════════════════════════════════════════════════
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Truck, Map, Users, UserCog, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
// import { fetchDistributors, addDistributor, deleteDistributor } from '../../services/features/distributor/distributorSlice';
// import { getManagers, addManager, deleteManager } from '../../services/features/manager/managerSlice';
// import { getExecutives, addExecutive, deleteExecutive } from '../../services/features/executive/executiveSlice';
// import { fetchFSE, addFSE } from '../../services/features/fse/fseSlice';
// import { fetchTerritory, addTerritory, deleteTerritory } from '../../services/features/Territory/TerritorySlice';
// import { selectAuthState } from '../../store/selectors/authSelector';
// import { SectionHeader, Button, Badge, Modal, Input, Select, DataTable, Avatar, toast, ConfirmDialog, Card, EmptyState, Spinner } from '../../components/ui/UI';
// import locationData from '../../assets/json/Location.json';

// /* ─── Shared helpers ─────────────────────────────────────────────────────────── */
// const statusBadge = (s) => <Badge variant={s === 'Active' ? 'active' : s === 'Inactive' ? 'inactive' : 'pending'}>{s || 'Pending'}</Badge>;

// /* ═══════════════════════════════════════════════════════════════════════════════
//    DISTRIBUTORS PAGE
// ════════════════════════════════════════════════════════════════════════════════ */
// export const DistributorsPage = () => {
//   const dispatch = useDispatch();
//   const { role } = useSelector(selectAuthState);
//   const { list, loading } = useSelector(s => s.distributors);
//   const [search, setSearch] = useState('');
//   const [modal,  setModal]  = useState(false);
//   const [view,   setView]   = useState(null);
//   const [deleteId, setDeleteId] = useState(null);
//   const [vals, setVals] = useState({ name: '', contactPerson: '', phone: '', email: '', state: '', district: '', city: '', password: '' });
//   const [errs, setErrs] = useState({});
//   const [saving, setSaving] = useState(false);

//   useEffect(() => { dispatch(fetchDistributors()); }, [dispatch]);

//   const states    = Object.keys(locationData || {});
//   const districts = vals.state ? Object.keys(locationData[vals.state] || {}) : [];
//   const set = (k, v) => { setVals(p => ({ ...p, [k]: v, ...(k === 'state' ? { district: '' } : {}) })); setErrs(p => ({ ...p, [k]: '' })); };

//   const validate = () => {
//     const e = {};
//     if (!vals.name) e.name = 'Company name required';
//     if (!vals.phone || vals.phone.length < 10) e.phone = 'Valid phone required';
//     if (!vals.password || vals.password.length < 6) e.password = 'Min 6 characters';
//     setErrs(e); return !Object.keys(e).length;
//   };

//   const handleSave = async () => {
//     if (!validate()) return;
//     setSaving(true);
//     const fd = new FormData();
//     Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
//     try { await dispatch(addDistributor(fd)).unwrap(); setModal(false); toast.success('Distributor added'); }
//     catch (e) { toast.error(e?.message || 'Failed'); }
//     finally { setSaving(false); }
//   };

//   const filtered = (list || []).filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.city?.toLowerCase().includes(search.toLowerCase()));

//   const stateOpts    = [{ value: '', label: 'Select state' },    ...states.map(s => ({ value: s, label: s }))];
//   const districtOpts = [{ value: '', label: 'Select district' }, ...districts.map(d => ({ value: d, label: d }))];

//   const canManage = ['Admin', 'Radnus', 'MarketingManager'].includes(role);

//   const columns = [
//     { key: 'name', label: 'Company', render: (_, d) => (
//       <div className="avatar-row">
//         <Avatar name={d.name} size="sm" />
//         <div className="avatar-row-info">
//           <span className="avatar-row-name">{d.name}</span>
//           <span className="avatar-row-sub">{d.contactPerson || d.contact || ''}</span>
//         </div>
//       </div>
//     )},
//     { key: 'phone', label: 'Phone', render: v => v || '—' },
//     { key: 'city',  label: 'City',  render: v => v || '—' },
//     { key: 'state', label: 'Territory', render: (_, d) => <Badge variant="info">{d.state || d.territory || '—'}</Badge> },
//     { key: 'status', label: 'Status', render: v => statusBadge(v) },
//     { key: '_id', label: 'Actions', render: (_, d) => (
//       <div className="td-actions">
//         <Button variant="outline" size="xs" onClick={() => setView(d)}>View</Button>
//         {canManage && <Button variant="secondary" size="xs" onClick={() => setDeleteId(d._id)}>Remove</Button>}
//       </div>
//     )},
//   ];

//   return (
//     <div>
//       <SectionHeader title="Distributor Network" count={(list || []).length} action={canManage && <Button variant="primary" size="sm" onClick={() => { setVals({ name:'',contactPerson:'',phone:'',email:'',state:'',district:'',city:'',password:'' }); setModal(true); }}>+ Add Distributor</Button>} />
//       <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} searchPlaceholder="Search by name, city…" emptyIcon={<Truck size={36}/>} emptyText="No distributors found" />

//       <Modal open={modal} onClose={() => setModal(false)} title="Add Distributor" size="lg"
//         footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Distributor</Button></>}
//       >
//         <div className="form-row">
//           <Input label="Company Name"   placeholder="Company"    value={vals.name}          onChange={e => set('name', e.target.value)}          error={errs.name} />
//           <Input label="Contact Person" placeholder="Name"       value={vals.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
//         </div>
//         <div className="form-row">
//           <Input label="Phone" type="tel"   placeholder="Mobile"   value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
//           <Input label="Email" type="email" placeholder="Email"    value={vals.email} onChange={e => set('email', e.target.value)} />
//         </div>
//         <div className="form-row">
//           <Select label="State"    options={stateOpts}    value={vals.state}    onChange={e => set('state',    e.target.value)} />
//           <Select label="District" options={districtOpts} value={vals.district} onChange={e => set('district', e.target.value)} />
//         </div>
//         <div className="form-row">
//           <Input label="City"     placeholder="City"             value={vals.city}     onChange={e => set('city', e.target.value)} />
//           <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
//         </div>
//       </Modal>

//       <Modal open={!!view} onClose={() => setView(null)} title={view?.name || 'Distributor'} footer={<Button variant="primary" onClick={() => setView(null)}>Close</Button>}>
//         {view && (
//           <>
//             <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16 }}>
//               <Avatar name={view.name} size="lg" />
//               <div><div style={{ fontWeight:700, fontSize:16 }}>{view.name}</div><div style={{ color:'var(--text-muted)', fontSize:13 }}>{view.contactPerson || view.contact}</div>{statusBadge(view.status)}</div>
//             </div>
//             <div className="divider" />
//             <div className="form-row">
//               <div><div className="field-label" style={{ marginBottom:4 }}>Phone</div>{view.phone || '—'}</div>
//               <div><div className="field-label" style={{ marginBottom:4 }}>Email</div>{view.email || '—'}</div>
//             </div>
//             <div className="form-row" style={{ marginTop:14 }}>
//               <div><div className="field-label" style={{ marginBottom:4 }}>City</div>{view.city || '—'}</div>
//               <div><div className="field-label" style={{ marginBottom:4 }}>Territory</div>{view.state || '—'}</div>
//             </div>
//           </>
//         )}
//       </Modal>
//       <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteDistributor(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Distributor" message="Remove this distributor from the network?" confirmLabel="Remove" />
//     </div>
//   );
// };
// /* ═══════════════════════════════════════════════════════════════════════════════
//    TERRITORY PAGE – FIXED (supports flat data + fallback fetch)
// ════════════════════════════════════════════════════════════════════════════════ */
// export const TerritoryPage = () => {
//   const dispatch = useDispatch();
//   const { role } = useSelector(selectAuthState);
//   const { list, loading: reduxLoading } = useSelector(s => s.territory);
//   const [modal, setModal] = useState(false);
//   const [expanded, setExpanded] = useState({});
//   const [vals, setVals] = useState({ state: '', districts: '' });
//   const [saving, setSaving] = useState(false);
//   const [localData, setLocalData] = useState(null); // fallback data
//   const [localLoading, setLocalLoading] = useState(false);

//   // Try Redux first, then fallback to direct API call
//   useEffect(() => {
//     dispatch(fetchTerritory());
//   }, [dispatch]);

//   // If Redux list is empty after loading, fetch directly (fallback)
//   useEffect(() => {
//     const fetchDirect = async () => {
//       if (!reduxLoading && (!list || (Array.isArray(list) && list.length === 0))) {
//         setLocalLoading(true);
//         try {
//           // 🔁 Replace this URL with your actual API endpoint
//           const response = await axios.get('/api/territory'); 
//           setLocalData(response.data);
//           console.log('✅ Fallback fetch successful:', response.data);
//         } catch (err) {
//           console.error('❌ Fallback fetch failed:', err);
//           setLocalData([]);
//         } finally {
//           setLocalLoading(false);
//         }
//       }
//     };
//     fetchDirect();
//   }, [reduxLoading, list]);

//   // ─── Transform flat data (state, district, taluk) into nested structure ───
//   const transformFlatTerritories = (data) => {
//     if (!Array.isArray(data) || data.length === 0) return [];
//     // If already nested (has 'districts' property), return as is
//     if (data[0]?.districts !== undefined) return data;

//     const map = new Map(); // state -> Map of district -> Set of taluks

//     for (const item of data) {
//       const { state, district, taluk } = item;
//       if (!state || !district) continue;

//       if (!map.has(state)) map.set(state, new Map());
//       const districtMap = map.get(state);

//       if (!districtMap.has(district)) districtMap.set(district, new Set());
//       if (taluk) districtMap.get(district).add(taluk);
//     }

//     // Convert to expected array format
//     const nested = [];
//     for (const [state, districtMap] of map.entries()) {
//       const districts = [];
//       for (const [districtName, taluksSet] of districtMap.entries()) {
//         districts.push({
//           name: districtName,
//           taluks: Array.from(taluksSet).map(t => ({ name: t, _id: t })),
//         });
//       }
//       nested.push({
//         _id: state,
//         state,
//         districts,
//       });
//     }
//     return nested;
//   };

//   // Use Redux data if available, otherwise fallback data
//   const rawList = Array.isArray(list) && list.length > 0 ? list : (localData || []);
//   const territoryList = transformFlatTerritories(rawList);

//   // Debug logs (remove in production)
//   console.log('🔍 Redux list:', list);
//   console.log('🔍 Fallback data:', localData);
//   console.log('🔍 Final territoryList:', territoryList);

//   const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
//   const canManage = ['Admin', 'Radnus'].includes(role);

//   const handleSave = async () => {
//     if (!vals.state) { toast.error('State is required'); return; }
//     setSaving(true);
//     const districts = vals.districts.split(',').map(d => d.trim()).filter(Boolean).map(name => ({ name, taluks: [] }));
//     try {
//       await dispatch(addTerritory({ state: vals.state, districts })).unwrap();
//       setModal(false);
//       toast.success('Territory added');
//       // Refresh data after add
//       dispatch(fetchTerritory());
//     } catch { toast.error('Failed'); }
//     finally { setSaving(false); }
//   };

//   const isLoading = reduxLoading || localLoading;

//   return (
//     <div>
//       <SectionHeader 
//         title="Territory Management" 
//         action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Territory</Button>} 
//       />

//       {isLoading ? (
//         <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
//       ) : territoryList.length === 0 ? (
//         <EmptyState 
//           icon={<Map size={40} />} 
//           title="No territories configured" 
//           subtitle="Add states, districts and taluks" 
//           action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Territory</Button>} 
//         />
//       ) : (
//         territoryList.map(t => (
//           <div key={t._id} className="territory-node">
//             <div className="territory-header" onClick={() => toggleExpand(t._id)}>
//               <Map size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
//               <span className="territory-state">{t.state}</span>
//               <Badge variant="info">{(t.districts || []).length} districts</Badge>
//               <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
//                 {expanded[t._id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//               </div>
//               {canManage && (
//                 <Button
//                   variant="secondary"
//                   size="xs"
//                   onClick={e => { e.stopPropagation(); dispatch(deleteTerritory(t.state)).then(() => toast.success('Removed')); }}
//                 >
//                   Remove
//                 </Button>
//               )}
//             </div>

//             {expanded[t._id] && (
//               <div className="territory-body">
//                 {(t.districts || []).map(d => (
//                   <div key={d.name} className="district-group">
//                     <div className="district-name"><MapPin size={13} />{d.name}</div>
//                     <div className="taluk-pills">
//                       {(d.taluks || []).map(tk => <span key={tk._id || tk} className="taluk-pill">{tk.name || tk}</span>)}
//                       {(!d.taluks || d.taluks.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No taluks added</span>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))
//       )}

//       <Modal open={modal} onClose={() => setModal(false)} title="Add Territory"
//         footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Territory</Button></>}
//       >
//         <Input label="State Name" placeholder="e.g. Tamil Nadu" value={vals.state} onChange={e => setVals(p => ({ ...p, state: e.target.value }))} />
//         <Input label="Districts (comma-separated)" placeholder="Chennai, Coimbatore, Madurai" value={vals.districts} onChange={e => setVals(p => ({ ...p, districts: e.target.value }))} hint="Enter district names separated by commas" />
//       </Modal>
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════════════════
//    MANAGERS PAGE
// ════════════════════════════════════════════════════════════════════════════════ */
// export const ManagersPage = () => {
//   const dispatch = useDispatch();
//   const { list, loading } = useSelector(s => s.manager);
//   const [search, setSearch] = useState('');
//   const [modal, setModal]   = useState(false);
//   const [deleteId, setDeleteId] = useState(null);
//   const [vals, setVals] = useState({ name:'', phone:'', email:'', territory:'', password:'' });
//   const [errs, setErrs] = useState({});
//   const [saving, setSaving] = useState(false);

//   useEffect(() => { dispatch(getManagers()); }, [dispatch]);

//   const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

//   const handleSave = async () => {
//     const e = {};
//     if (!vals.name) e.name = 'Name required';
//     if (!vals.phone) e.phone = 'Phone required';
//     if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
//     if (Object.keys(e).length) { setErrs(e); return; }
//     setSaving(true);
//     const fd = new FormData();
//     Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
//     try { await dispatch(addManager(fd)).unwrap(); setModal(false); toast.success('Manager added'); }
//     catch (e) { toast.error(e?.message || 'Failed'); }
//     finally { setSaving(false); }
//   };

//   const filtered = (list || []).filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.territory?.toLowerCase().includes(search.toLowerCase()));

//   const columns = [
//     { key: 'name', label: 'Manager', render: (_, m) => (
//       <div className="avatar-row"><Avatar name={m.name} size="sm" /><div className="avatar-row-info"><span className="avatar-row-name">{m.name}</span><span className="avatar-row-sub">{m.email}</span></div></div>
//     )},
//     { key: 'phone',     label: 'Phone',     render: v => v || '—' },
//     { key: 'territory', label: 'Territory', render: v => v ? <Badge variant="info">{v}</Badge> : '—' },
//     { key: 'status',    label: 'Status',    render: v => statusBadge(v || 'Active') },
//     { key: '_id', label: 'Actions', render: (_, m) => (
//       <div className="td-actions">
//         <Button variant="secondary" size="xs" onClick={() => setDeleteId(m._id)}>Remove</Button>
//       </div>
//     )},
//   ];

//   return (
//     <div>
//       <SectionHeader title="Marketing Managers" count={(list || []).length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add Manager</Button>} />
//       <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} searchPlaceholder="Search managers…" emptyIcon={<UserCog size={36}/>} emptyText="No managers added" />

//       <Modal open={modal} onClose={() => setModal(false)} title="Add Marketing Manager"
//         footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Manager</Button></>}
//       >
//         <div className="form-row">
//           <Input label="Full Name"  placeholder="Manager name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
//           <Input label="Phone"      type="tel" placeholder="Phone" value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
//         </div>
//         <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
//         <Input label="Territory"   placeholder="e.g. Tamil Nadu"  value={vals.territory} onChange={e => set('territory', e.target.value)} />
//         <Input label="Set Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
//       </Modal>

//       <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteManager(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Manager" message="Remove this manager from the system?" confirmLabel="Remove" />
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════════════════
//    EXECUTIVES PAGE
// ════════════════════════════════════════════════════════════════════════════════ */
// export const ExecutivesPage = () => {
//   const dispatch = useDispatch();
//   const { list, loading } = useSelector(s => s.executive);
//   const [search, setSearch] = useState('');
//   const [modal, setModal]   = useState(false);
//   const [deleteId, setDeleteId] = useState(null);
//   const [vals, setVals] = useState({ name:'', phone:'', email:'', territory:'', password:'' });
//   const [saving, setSaving] = useState(false);
//   const [errs, setErrs] = useState({});

//   useEffect(() => { dispatch(getExecutives()); }, [dispatch]);

//   const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

//   const handleSave = async () => {
//     const e = {};
//     if (!vals.name) e.name = 'Name required';
//     if (!vals.phone) e.phone = 'Phone required';
//     if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
//     if (Object.keys(e).length) { setErrs(e); return; }
//     setSaving(true);
//     const fd = new FormData();
//     Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
//     try { await dispatch(addExecutive(fd)).unwrap(); setModal(false); toast.success('Executive added'); }
//     catch { toast.error('Failed'); }
//     finally { setSaving(false); }
//   };

//   const filtered = (list || []).filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()));
//   const columns = [
//     { key: 'name', label: 'Executive', render: (_, e) => (
//       <div className="avatar-row"><Avatar name={e.name} size="sm"/><div className="avatar-row-info"><span className="avatar-row-name">{e.name}</span><span className="avatar-row-sub">{e.email}</span></div></div>
//     )},
//     { key: 'phone',     label: 'Phone',     render: v => v || '—' },
//     { key: 'territory', label: 'Territory', render: v => v ? <Badge variant="info">{v}</Badge> : '—' },
//     { key: 'status',    label: 'Status',    render: v => statusBadge(v || 'Active') },
//     { key: '_id', label: 'Actions', render: (_, e) => (
//       <div className="td-actions"><Button variant="secondary" size="xs" onClick={() => setDeleteId(e._id)}>Remove</Button></div>
//     )},
//   ];

//   return (
//     <div>
//       <SectionHeader title="Marketing Executives" count={(list || []).length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add Executive</Button>} />
//       <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} emptyIcon={<Users size={36}/>} emptyText="No executives added" />

//       <Modal open={modal} onClose={() => setModal(false)} title="Add Marketing Executive"
//         footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Executive</Button></>}
//       >
//         <div className="form-row">
//           <Input label="Full Name" placeholder="Executive name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
//           <Input label="Phone"     type="tel" placeholder="Phone"  value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
//         </div>
//         <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
//         <Input label="Territory" placeholder="e.g. Tamil Nadu" value={vals.territory} onChange={e => set('territory', e.target.value)} />
//         <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
//       </Modal>
//       <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteExecutive(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Executive" message="Remove this executive?" confirmLabel="Remove" />
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════════════════
//    FSE PAGE
// ════════════════════════════════════════════════════════════════════════════════ */
// export const FSEPage = () => {
//   const dispatch = useDispatch();
//   const { list, loading } = useSelector(s => s.fse);
//   const [search, setSearch] = useState('');
//   const [modal, setModal]   = useState(false);
//   const [vals, setVals]     = useState({ name:'', phone:'', email:'', territory:'', password:'' });
//   const [errs, setErrs]     = useState({});
//   const [saving, setSaving] = useState(false);

//   useEffect(() => { dispatch(fetchFSE()); }, [dispatch]);

//   const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

//   const handleSave = async () => {
//     const e = {};
//     if (!vals.name) e.name = 'Name required';
//     if (!vals.phone) e.phone = 'Phone required';
//     if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
//     if (Object.keys(e).length) { setErrs(e); return; }
//     setSaving(true);
//     const fd = new FormData();
//     Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
//     try { await dispatch(addFSE(fd)).unwrap(); setModal(false); toast.success('FSE added'); }
//     catch { toast.error('Failed'); }
//     finally { setSaving(false); }
//   };

//   const filtered = (list || []).filter(f => !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.territory?.toLowerCase().includes(search.toLowerCase()));

//   return (
//     <div>
//       <SectionHeader title="Field Sales Executives" count={(list || []).length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add FSE</Button>} />

//       {loading ? <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size="lg"/></div>
//         : filtered.length === 0 ? <EmptyState icon={<Users size={40}/>} title="No FSEs found" />
//         : (
//           <div className="fse-grid">
//             {filtered.map(f => (
//               <div key={f._id} className="fse-card">
//                 <div className="fse-card-head">
//                   <Avatar name={f.name} size="md" />
//                   <div className="fse-info">
//                     <div className="fse-name">{f.name}</div>
//                     <div className="fse-territory">{f.territory || '—'}</div>
//                   </div>
//                   <div className="fse-status-dot" style={{ background: f.isOnline ? 'var(--success)' : 'var(--text-muted)', boxShadow: f.isOnline ? '0 0 8px var(--success)' : 'none' }} />
//                 </div>
//                 <div className="fse-card-footer">
//                   <div className="fse-stat"><span className="fse-stat-lbl">Phone</span><span>{f.phone || '—'}</span></div>
//                   <div className="fse-stat"><span className="fse-stat-lbl">Status</span><span style={{ color: f.isOnline ? 'var(--success)' : 'var(--text-muted)' }}>{f.isOnline ? 'Online' : 'Offline'}</span></div>
//                   <div className="fse-stat"><span className="fse-stat-lbl">Today</span><span>0 visits</span></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )
//       }

//       <Modal open={modal} onClose={() => setModal(false)} title="Add Field Sales Executive"
//         footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add FSE</Button></>}
//       >
//         <div className="form-row">
//           <Input label="Full Name" placeholder="FSE name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
//           <Input label="Phone" type="tel" placeholder="Phone" value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
//         </div>
//         <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
//         <Input label="Territory" placeholder="e.g. Chennai North" value={vals.territory} onChange={e => set('territory', e.target.value)} />
//         <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
//       </Modal>
//     </div>
//   );
// };

// ═══════════════════════════════════════════════════════════════════════════════
//  Distributors Page
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Truck, Map, Users, UserCog, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { fetchDistributors, addDistributor, deleteDistributor } from '../../services/features/distributor/distributorSlice';
import { getManagers, addManager, deleteManager } from '../../services/features/manager/managerSlice';
import { getExecutives, addExecutive, deleteExecutive } from '../../services/features/executive/executiveSlice';
import { fetchFSE, addFSE } from '../../services/features/fse/fseSlice';
import { fetchTerritory, addTerritory, deleteTerritory } from '../../services/features/Territory/TerritorySlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import { SectionHeader, Button, Badge, Modal, Input, Select, DataTable, Avatar, toast, ConfirmDialog, Card, EmptyState, Spinner } from '../../components/ui/UI';
import locationData from '../../assets/json/Location.json';

/* ─── Shared helpers ─────────────────────────────────────────────────────────── */
const statusBadge = (s) => <Badge variant={s === 'Active' ? 'active' : s === 'Inactive' ? 'inactive' : 'pending'}>{s || 'Pending'}</Badge>;

/* ═══════════════════════════════════════════════════════════════════════════════
   DISTRIBUTORS PAGE
════════════════════════════════════════════════════════════════════════════════ */
export const DistributorsPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { list, loading } = useSelector(s => s.distributors);
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(false);
  const [view,   setView]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [vals, setVals] = useState({ name: '', contactPerson: '', phone: '', email: '', state: '', district: '', city: '', password: '' });
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchDistributors()); }, [dispatch]);

  const states    = Object.keys(locationData || {});
  const districts = vals.state ? Object.keys(locationData[vals.state] || {}) : [];
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v, ...(k === 'state' ? { district: '' } : {}) })); setErrs(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!vals.name) e.name = 'Company name required';
    if (!vals.phone || vals.phone.length < 10) e.phone = 'Valid phone required';
    if (!vals.password || vals.password.length < 6) e.password = 'Min 6 characters';
    setErrs(e); return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try { await dispatch(addDistributor(fd)).unwrap(); setModal(false); toast.success('Distributor added'); }
    catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = list.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.city?.toLowerCase().includes(search.toLowerCase()));

  const stateOpts    = [{ value: '', label: 'Select state' },    ...states.map(s => ({ value: s, label: s }))];
  const districtOpts = [{ value: '', label: 'Select district' }, ...districts.map(d => ({ value: d, label: d }))];

  const canManage = ['Admin', 'Radnus', 'MarketingManager'].includes(role);

  const columns = [
    { key: 'name', label: 'Company', render: (_, d) => (
      <div className="avatar-row">
        <Avatar name={d.name} size="sm" />
        <div className="avatar-row-info">
          <span className="avatar-row-name">{d.name}</span>
          <span className="avatar-row-sub">{d.contactPerson || d.contact || ''}</span>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: v => v || '—' },
    { key: 'city',  label: 'City',  render: v => v || '—' },
    { key: 'state', label: 'Territory', render: (_, d) => <Badge variant="info">{d.state || d.territory || '—'}</Badge> },
    { key: 'status', label: 'Status', render: v => statusBadge(v) },
    { key: '_id', label: 'Actions', render: (_, d) => (
      <div className="td-actions">
        <Button variant="outline" size="xs" onClick={() => setView(d)}>View</Button>
        {canManage && <Button variant="secondary" size="xs" onClick={() => setDeleteId(d._id)}>Remove</Button>}
      </div>
    )},
  ];

  return (
    <div>
      <SectionHeader title="Distributor Network" count={list.length} action={canManage && <Button variant="primary" size="sm" onClick={() => { setVals({ name:'',contactPerson:'',phone:'',email:'',state:'',district:'',city:'',password:'' }); setModal(true); }}>+ Add Distributor</Button>} />
      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} searchPlaceholder="Search by name, city…" emptyIcon={<Truck size={36}/>} emptyText="No distributors found" />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Distributor" size="lg"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Distributor</Button></>}
      >
        <div className="form-row">
          <Input label="Company Name"   placeholder="Company"    value={vals.name}          onChange={e => set('name', e.target.value)}          error={errs.name} />
          <Input label="Contact Person" placeholder="Name"       value={vals.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
        </div>
        <div className="form-row">
          <Input label="Phone" type="tel"   placeholder="Mobile"   value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
          <Input label="Email" type="email" placeholder="Email"    value={vals.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-row">
          <Select label="State"    options={stateOpts}    value={vals.state}    onChange={e => set('state',    e.target.value)} />
          <Select label="District" options={districtOpts} value={vals.district} onChange={e => set('district', e.target.value)} />
        </div>
        <div className="form-row">
          <Input label="City"     placeholder="City"             value={vals.city}     onChange={e => set('city', e.target.value)} />
          <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
        </div>
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name || 'Distributor'} footer={<Button variant="primary" onClick={() => setView(null)}>Close</Button>}>
        {view && (
          <>
            <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16 }}>
              <Avatar name={view.name} size="lg" />
              <div><div style={{ fontWeight:700, fontSize:16 }}>{view.name}</div><div style={{ color:'var(--text-muted)', fontSize:13 }}>{view.contactPerson || view.contact}</div>{statusBadge(view.status)}</div>
            </div>
            <div className="divider" />
            <div className="form-row">
              <div><div className="field-label" style={{ marginBottom:4 }}>Phone</div>{view.phone || '—'}</div>
              <div><div className="field-label" style={{ marginBottom:4 }}>Email</div>{view.email || '—'}</div>
            </div>
            <div className="form-row" style={{ marginTop:14 }}>
              <div><div className="field-label" style={{ marginBottom:4 }}>City</div>{view.city || '—'}</div>
              <div><div className="field-label" style={{ marginBottom:4 }}>Territory</div>{view.state || '—'}</div>
            </div>
          </>
        )}
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteDistributor(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Distributor" message="Remove this distributor from the network?" confirmLabel="Remove" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   TERRITORY PAGE
════════════════════════════════════════════════════════════════════════════════ */
export const TerritoryPage = () => {
  const dispatch   = useDispatch();
  const { role }   = useSelector(selectAuthState);
  const { list, loading } = useSelector(s => s.territory);
  const [modal,    setModal]    = useState(false);
  const [expanded, setExpanded] = useState({});
  const [vals,     setVals]     = useState({ state: '', districts: '' });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { dispatch(fetchTerritory()); }, [dispatch]);

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const canManage = ['Admin', 'Radnus'].includes(role);

  // Safely extract taluk name — handles string, { name } or any object
  const getTalukName = (tk) => {
    if (!tk) return '';
    if (typeof tk === 'string') return tk;
    if (typeof tk === 'object') return tk.name || tk.taluk || tk._id || JSON.stringify(tk);
    return String(tk);
  };

  const handleSave = async () => {
    if (!vals.state) { toast.error('State is required'); return; }
    setSaving(true);
    const districts = vals.districts.split(',').map(d => d.trim()).filter(Boolean).map(name => ({ name, taluks: [] }));
    try {
      await dispatch(addTerritory({ state: vals.state, districts })).unwrap();
      setModal(false);
      setVals({ state: '', districts: '' });
      toast.success('Territory added');
    } catch { toast.error('Failed to add territory'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <SectionHeader
        title="Territory Management"
        action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Territory</Button>}
      />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size="lg" /></div>
      ) : !list || list.length === 0 ? (
        <EmptyState
          icon={<Map size={40}/>}
          title="No territories configured"
          subtitle="Add states, districts and taluks"
          action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Territory</Button>}
        />
      ) : (
        list.map(t => {
          const stateKey = t._id || t.state;
          const districts = Array.isArray(t.districts) ? t.districts : [];
          return (
            <div key={stateKey} className="territory-node">
              <div className="territory-header" onClick={() => toggleExpand(stateKey)}>
                <Map size={18} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <span className="territory-state">{t.state}</span>
                <Badge variant="info">{districts.length} district{districts.length !== 1 ? 's' : ''}</Badge>
                <div style={{ marginLeft:'auto', color:'var(--text-muted)' }}>
                  {expanded[stateKey] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </div>
                {canManage && (
                  <Button variant="secondary" size="xs" onClick={e => {
                    e.stopPropagation();
                    dispatch(deleteTerritory(t.state)).then(() => toast.success('State removed'));
                  }}>
                    Remove
                  </Button>
                )}
              </div>

              {expanded[stateKey] && (
                <div className="territory-body">
                  {districts.length === 0 ? (
                    <span style={{ color:'var(--text-muted)', fontSize:13 }}>No districts added</span>
                  ) : (
                    districts.map((d, di) => {
                      const taluks = Array.isArray(d.taluks) ? d.taluks : [];
                      return (
                        <div key={d.name || di} className="district-group">
                          <div className="district-name">
                            <MapPin size={13} />
                            {d.name}
                          </div>
                          <div className="taluk-pills">
                            {taluks.length === 0 ? (
                              <span style={{ color:'var(--text-muted)', fontSize:12 }}>No taluks added</span>
                            ) : (
                              taluks.map((tk, ti) => {
                                const talukName = getTalukName(tk);
                                const talukKey  = (typeof tk === 'object' ? tk._id : tk) || ti;
                                return (
                                  <span key={talukKey} className="taluk-pill">{talukName}</span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Territory"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Add Territory</Button>
          </>
        }
      >
        <Input
          label="State Name"
          placeholder="e.g. Tamil Nadu"
          value={vals.state}
          onChange={e => setVals(p => ({ ...p, state: e.target.value }))}
        />
        <Input
          label="Districts (comma-separated)"
          placeholder="Chennai, Coimbatore, Madurai"
          value={vals.districts}
          onChange={e => setVals(p => ({ ...p, districts: e.target.value }))}
          hint="Enter district names separated by commas"
        />
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MANAGERS PAGE
════════════════════════════════════════════════════════════════════════════════ */
export const ManagersPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.manager);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [vals, setVals] = useState({ name:'', phone:'', email:'', territory:'', password:'' });
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(getManagers()); }, [dispatch]);

  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

  const handleSave = async () => {
    const e = {};
    if (!vals.name) e.name = 'Name required';
    if (!vals.phone) e.phone = 'Phone required';
    if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try { await dispatch(addManager(fd)).unwrap(); setModal(false); toast.success('Manager added'); }
    catch (e) { toast.error(e?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = list.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.territory?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: 'name', label: 'Manager', render: (_, m) => (
      <div className="avatar-row"><Avatar name={m.name} size="sm" /><div className="avatar-row-info"><span className="avatar-row-name">{m.name}</span><span className="avatar-row-sub">{m.email}</span></div></div>
    )},
    { key: 'phone',     label: 'Phone',     render: v => v || '—' },
    { key: 'territory', label: 'Territory', render: v => v ? <Badge variant="info">{v}</Badge> : '—' },
    { key: 'status',    label: 'Status',    render: v => statusBadge(v || 'Active') },
    { key: '_id', label: 'Actions', render: (_, m) => (
      <div className="td-actions">
        <Button variant="secondary" size="xs" onClick={() => setDeleteId(m._id)}>Remove</Button>
      </div>
    )},
  ];

  return (
    <div>
      <SectionHeader title="Marketing Managers" count={list.length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add Manager</Button>} />
      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} searchPlaceholder="Search managers…" emptyIcon={<UserCog size={36}/>} emptyText="No managers added" />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Marketing Manager"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Manager</Button></>}
      >
        <div className="form-row">
          <Input label="Full Name"  placeholder="Manager name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
          <Input label="Phone"      type="tel" placeholder="Phone" value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
        </div>
        <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
        <Input label="Territory"   placeholder="e.g. Tamil Nadu"  value={vals.territory} onChange={e => set('territory', e.target.value)} />
        <Input label="Set Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteManager(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Manager" message="Remove this manager from the system?" confirmLabel="Remove" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EXECUTIVES PAGE
════════════════════════════════════════════════════════════════════════════════ */
export const ExecutivesPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.executive);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [vals, setVals] = useState({ name:'', phone:'', email:'', territory:'', password:'' });
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});

  useEffect(() => { dispatch(getExecutives()); }, [dispatch]);

  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

  const handleSave = async () => {
    const e = {};
    if (!vals.name) e.name = 'Name required';
    if (!vals.phone) e.phone = 'Phone required';
    if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try { await dispatch(addExecutive(fd)).unwrap(); setModal(false); toast.success('Executive added'); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const filtered = list.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()));
  const columns = [
    { key: 'name', label: 'Executive', render: (_, e) => (
      <div className="avatar-row"><Avatar name={e.name} size="sm"/><div className="avatar-row-info"><span className="avatar-row-name">{e.name}</span><span className="avatar-row-sub">{e.email}</span></div></div>
    )},
    { key: 'phone',     label: 'Phone',     render: v => v || '—' },
    { key: 'territory', label: 'Territory', render: v => v ? <Badge variant="info">{v}</Badge> : '—' },
    { key: 'status',    label: 'Status',    render: v => statusBadge(v || 'Active') },
    { key: '_id', label: 'Actions', render: (_, e) => (
      <div className="td-actions"><Button variant="secondary" size="xs" onClick={() => setDeleteId(e._id)}>Remove</Button></div>
    )},
  ];

  return (
    <div>
      <SectionHeader title="Marketing Executives" count={list.length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add Executive</Button>} />
      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearch={setSearch} emptyIcon={<Users size={36}/>} emptyText="No executives added" />

      <Modal open={modal} onClose={() => setModal(false)} title="Add Marketing Executive"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add Executive</Button></>}
      >
        <div className="form-row">
          <Input label="Full Name" placeholder="Executive name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
          <Input label="Phone"     type="tel" placeholder="Phone"  value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
        </div>
        <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
        <Input label="Territory" placeholder="e.g. Tamil Nadu" value={vals.territory} onChange={e => set('territory', e.target.value)} />
        <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await dispatch(deleteExecutive(deleteId)).unwrap(); toast.success('Removed'); }} title="Remove Executive" message="Remove this executive?" confirmLabel="Remove" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   FSE PAGE
════════════════════════════════════════════════════════════════════════════════ */
export const FSEPage = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.fse);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [vals, setVals]     = useState({ name:'', phone:'', email:'', territory:'', password:'' });
  const [errs, setErrs]     = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchFSE()); }, [dispatch]);

  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: '' })); };

  const handleSave = async () => {
    const e = {};
    if (!vals.name) e.name = 'Name required';
    if (!vals.phone) e.phone = 'Phone required';
    if (!vals.password || vals.password.length < 6) e.password = 'Min 6 chars';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => v && fd.append(k, v));
    try { await dispatch(addFSE(fd)).unwrap(); setModal(false); toast.success('FSE added'); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const filtered = list.filter(f => !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.territory?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <SectionHeader title="Field Sales Executives" count={list.length} action={<Button variant="primary" size="sm" onClick={() => { setVals({ name:'',phone:'',email:'',territory:'',password:'' }); setModal(true); }}>+ Add FSE</Button>} />

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size="lg"/></div>
        : filtered.length === 0 ? <EmptyState icon={<Users size={40}/>} title="No FSEs found" />
        : (
          <div className="fse-grid">
            {filtered.map(f => (
              <div key={f._id} className="fse-card">
                <div className="fse-card-head">
                  <Avatar name={f.name} size="md" />
                  <div className="fse-info">
                    <div className="fse-name">{f.name}</div>
                    <div className="fse-territory">{f.territory || '—'}</div>
                  </div>
                  <div className="fse-status-dot" style={{ background: f.isOnline ? 'var(--success)' : 'var(--text-muted)', boxShadow: f.isOnline ? '0 0 8px var(--success)' : 'none' }} />
                </div>
                <div className="fse-card-footer">
                  <div className="fse-stat"><span className="fse-stat-lbl">Phone</span><span>{f.phone || '—'}</span></div>
                  <div className="fse-stat"><span className="fse-stat-lbl">Status</span><span style={{ color: f.isOnline ? 'var(--success)' : 'var(--text-muted)' }}>{f.isOnline ? 'Online' : 'Offline'}</span></div>
                  <div className="fse-stat"><span className="fse-stat-lbl">Today</span><span>0 visits</span></div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Modal open={modal} onClose={() => setModal(false)} title="Add Field Sales Executive"
        footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Add FSE</Button></>}
      >
        <div className="form-row">
          <Input label="Full Name" placeholder="FSE name" value={vals.name}  onChange={e => set('name',  e.target.value)} error={errs.name} />
          <Input label="Phone" type="tel" placeholder="Phone" value={vals.phone} onChange={e => set('phone', e.target.value)} error={errs.phone} />
        </div>
        <Input label="Email" type="email" placeholder="Email" value={vals.email} onChange={e => set('email', e.target.value)} />
        <Input label="Territory" placeholder="e.g. Chennai North" value={vals.territory} onChange={e => set('territory', e.target.value)} />
        <Input label="Password" type="password" placeholder="Min 6 chars" value={vals.password} onChange={e => set('password', e.target.value)} error={errs.password} />
      </Modal>
    </div>
  );
};