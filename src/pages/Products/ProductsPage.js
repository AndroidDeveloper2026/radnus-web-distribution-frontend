import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Package } from 'lucide-react';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../../services/features/products/productSlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import { SectionHeader, Button, Badge, Modal, Input, Select, toast, EmptyState, ConfirmDialog, Spinner } from '../../components/ui/UI';
import './Products.css';

const CAT_EMOJI = { Oils: '🛢️', Cleaning: '🧴', 'Personal Care': '🧼', Food: '🥫', Beverages: '🥤', default: '📦' };

/* ─── Product Card ───────────────────────────────────────────────────────────── */
const ProductCard = ({ product, role, onEdit, onDelete, onOrder }) => {
  const showDist = ['Admin', 'Radnus', 'Distributor'].includes(role);
  const outOfStock = product.stock === 0;
  const lowStock   = product.stock > 0 && product.stock < 20;

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-img">
        {product.image
          ? <img src={product.image} alt={product.name} />
          : <span className="product-emoji">{CAT_EMOJI[product.category] || CAT_EMOJI.default}</span>
        }
        {outOfStock && <Badge variant="inactive" style={{ position: 'absolute', top: 10, right: 10 }}>Out of Stock</Badge>}
        {lowStock   && <Badge variant="warning"  style={{ position: 'absolute', top: 10, right: 10 }}>Low Stock</Badge>}
        {product.status === 'Inactive' && <div className="product-inactive-overlay">Inactive</div>}
      </div>
      <div className="product-body">
        <div className="product-name">{product.name}</div>
        <div className="product-cat">{product.category || 'General'}</div>
        <div className="product-prices">
          {showDist && (
            <div className="price-box">
              <span className="price-lbl">Dist</span>
              <span className="price-val">₹{product.distributorPrice || 0}</span>
            </div>
          )}
          <div className="price-box">
            <span className="price-lbl">Retail</span>
            <span className="price-val">₹{product.retailerPrice || 0}</span>
          </div>
        </div>
        <div className="product-stock">
          Stock: <strong style={{ color: outOfStock ? 'var(--red-bright)' : 'var(--text-primary)' }}>{product.stock || 0}</strong> units
        </div>
        <div className="product-actions">
          {['Admin', 'Radnus'].includes(role) ? (
            <>
              <Button variant="outline" size="sm" fullWidth onClick={() => onEdit(product)}>Edit</Button>
              <Button variant="danger"  size="sm"           onClick={() => onDelete(product._id)}>🗑</Button>
            </>
          ) : (
            <Button variant="primary" size="sm" fullWidth disabled={outOfStock} onClick={() => onOrder?.(product)}>
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Add / Edit Modal ───────────────────────────────────────────────────────── */
const ProductModal = ({ open, onClose, product, onSave }) => {
  const [vals, setVals] = useState({ name: '', category: '', distributorPrice: '', retailerPrice: '', stock: '', status: 'Active', image: null });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) setVals({ name: product.name || '', category: product.category || '', distributorPrice: product.distributorPrice || '', retailerPrice: product.retailerPrice || '', stock: product.stock || '', status: product.status || 'Active', image: null });
    else setVals({ name: '', category: '', distributorPrice: '', retailerPrice: '', stock: '', status: 'Active', image: null });
    setErrs({});
  }, [product, open]);

  const set = (k, v) => setVals(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!vals.name) e.name = 'Product name required';
    if (!vals.retailerPrice) e.retailerPrice = 'Retailer price required';
    setErrs(e); return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v); });
    try { await onSave(fd, product?._id); onClose(); }
    catch (e) { toast.error(e?.message || 'Save failed'); }
    finally { setLoading(false); }
  };

  const STATUS_OPTS = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];
  const CAT_OPTS = [
    { value: '', label: 'Select category' },
    ...['Oils', 'Cleaning', 'Personal Care', 'Food', 'Beverages', 'Other'].map(c => ({ value: c, label: c })),
  ];

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" loading={loading} onClick={handleSave}>{product ? 'Save Changes' : 'Add Product'}</Button></>}
    >
      <Input label="Product Name" placeholder="Enter product name" value={vals.name} onChange={e => set('name', e.target.value)} error={errs.name} />
      <Select label="Category" options={CAT_OPTS} value={vals.category} onChange={e => set('category', e.target.value)} />
      <div className="form-row">
        <Input label="Distributor Price (₹)" type="number" placeholder="0" value={vals.distributorPrice} onChange={e => set('distributorPrice', e.target.value)} />
        <Input label="Retailer Price (₹)"    type="number" placeholder="0" value={vals.retailerPrice}    onChange={e => set('retailerPrice',    e.target.value)} error={errs.retailerPrice} />
      </div>
      <div className="form-row">
        <Input label="Stock (units)" type="number" placeholder="0" value={vals.stock} onChange={e => set('stock', e.target.value)} />
        <Select label="Status" options={STATUS_OPTS} value={vals.status} onChange={e => set('status', e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Product Image</label>
        <input type="file" accept="image/*" className="field-input" onChange={e => set('image', e.target.files[0])} />
      </div>
    </Modal>
  );
};

/* ═══ Products Page ══════════════════════════════════════════════════════════════ */
const ProductsPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { list: products, loading } = useSelector(s => s.products);

  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [modal,      setModal]      = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId,   setDeleteId]   = useState(null);

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const categories = ['', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = !search    || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (formData, id) => {
    if (id) {
      await dispatch(updateProduct({ id, formData })).unwrap();
      toast.success('Product updated');
    } else {
      await dispatch(addProduct(formData)).unwrap();
      toast.success('Product added');
    }
  };

  const handleDelete = async (id) => {
    await dispatch(deleteProduct(id)).unwrap();
    toast.success('Product deleted');
  };

  const canManage = ['Admin', 'Radnus'].includes(role);

  return (
    <div>
      <SectionHeader
        title="Product Catalog"
        count={filtered.length}
        action={canManage && <Button variant="primary" size="sm" onClick={() => { setEditTarget(null); setModal(true); }}>+ Add Product</Button>}
      />

      {/* Filters */}
      <div className="products-toolbar">
        <div className="dtable-search" style={{ maxWidth: 300 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        <select className="field-input field-select" style={{ width: 'auto', padding: '8px 32px 8px 12px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Package size={40} />} title="No products found" subtitle="Try adjusting your search or add a new product" action={canManage && <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ Add Product</Button>} />
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <ProductCard
              key={p._id} product={p} role={role}
              onEdit={p => { setEditTarget(p); setModal(true); }}
              onDelete={id => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <ProductModal open={modal} onClose={() => { setModal(false); setEditTarget(null); }} product={editTarget} onSave={handleSave} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId)} title="Delete Product" message="Are you sure you want to delete this product? This action cannot be undone." confirmLabel="Delete" />
    </div>
  );
};

export default ProductsPage;
