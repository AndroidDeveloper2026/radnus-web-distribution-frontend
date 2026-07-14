import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Package,
  X,
  ImagePlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from '../../services/features/products/productSlice';
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
import { createActivityLog } from '../../services/features/activity/activitySlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import {
  Button,
  Modal,
  toast,
  ConfirmDialog,
  Spinner,
} from '../../components/ui/UI';
import './Products.css';

/* ─── Category & Status options ─── */
const CAT_OPTS = [
  { value: '', label: 'Select Category' },
  { value: 'PD Chargers & Car Chargers', label: 'PD Chargers & Car Chargers' },
  { value: 'Charger', label: 'Charger' },
  { value: 'Adapter', label: 'Adapter' },
  { value: 'Data Cables', label: 'Data Cables' },
  { value: 'Handsfree', label: 'Handsfree' },
  { value: 'Bluetooth Neckband', label: 'Bluetooth Neckband' },
  { value: 'Ear Buds', label: 'Ear Buds' },
  { value: 'Speakers', label: 'Speakers' },
  { value: 'Radnus Battery', label: 'Radnus Battery' },
  { value: 'Connector', label: 'Connector' },
  { value: 'Tools', label: 'Tools' },
  { value: 'Battery', label: 'Battery' },
];

const STATUS_OPTS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

/* ─── Validation - Now allows 0 for all fields ─── */
const validate = (fields) => {
  const errors = {};
  if (!fields.name.trim()) errors.name = 'Product name is required';
  if (!fields.category) errors.category = 'Category is required';
  if (!fields.sku.trim()) errors.sku = 'SKU is required';
  
  // Allow 0 as valid for MRP
  if (fields.mrp === '' || fields.mrp === null || fields.mrp === undefined || isNaN(fields.mrp) || Number(fields.mrp) < 0)
    errors.mrp = 'MRP must be 0 or higher';
  
  // Allow 0 as valid for distributorPrice
  if (fields.distributorPrice === '' || fields.distributorPrice === null || fields.distributorPrice === undefined || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) < 0)
    errors.distributorPrice = 'Distributor price must be 0 or higher';
  
  // Allow 0 as valid for retailerPrice
  if (fields.retailerPrice === '' || fields.retailerPrice === null || fields.retailerPrice === undefined || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) < 0)
    errors.retailerPrice = 'Retailer price must be 0 or higher';
  
  // Allow 0 as valid for itemCost
  if (fields.itemCost === '' || fields.itemCost === null || fields.itemCost === undefined || isNaN(fields.itemCost) || Number(fields.itemCost) < 0)
    errors.itemCost = 'Item cost must be 0 or higher';
  
  if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
    errors.gst = 'GST must be 0 or higher';
  
  // Allow stock to be 0
  if (fields.moq === '' || fields.moq === null || fields.moq === undefined || isNaN(fields.moq) || Number(fields.moq) < 0)
    errors.moq = 'Stock must be a non-negative number';
  
  // Allow 0 as valid for walkinPrice
  if (fields.walkinPrice === '' || fields.walkinPrice === null || fields.walkinPrice === undefined || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) < 0)
    errors.walkinPrice = 'Walk‑in price must be 0 or higher';
  
  if (!fields.batchNo.trim()) errors.batchNo = 'Batch number is required';
  if (!fields.rackNo.trim()) errors.rackNo = 'Rack number is required';
  if (!fields.vendorName.trim()) errors.vendorName = 'Vendor name is required';
  return errors;
};

/* ─── ProductFormModal (Add / Edit) ─── */
const ProductFormModal = ({ open, onClose, editProduct }) => {
  const isEdit = !!editProduct;
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuthState);
  const fileInputRef = useRef();

  const emptyForm = {
    name: '',
    category: '',
    sku: '',
    batchNo: '',
    rackNo: '',
    vendorName: '',
    itemCost: '',
    distributorPrice: '',
    retailerPrice: '',
    walkinPrice: '',
    mrp: '',
    gst: '',
    moq: '',
    status: 'Active',
  };

  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      const p = editProduct;
      const displayStock = p.moq ?? 0;
      setForm({
        name: p.name || '',
        category: p.category || '',
        sku: p.sku || '',
        batchNo: p.batchNo || '',
        rackNo: p.rackNo || '',
        vendorName: p.vendorName || '',
        itemCost: String(p.itemCost ?? ''),
        distributorPrice: String(p.distributorPrice ?? ''),
        retailerPrice: String(p.retailerPrice ?? ''),
        walkinPrice: String(p.walkinPrice ?? ''),
        mrp: String(p.mrp ?? ''),
        gst: String(p.gst ?? ''),
        moq: String(displayStock),
        status: p.status || 'Active',
      });
      setPreview(typeof p.image === 'string' ? p.image : null);
      setImage(null);
    } else {
      setForm(emptyForm);
      setPreview(null);
      setImage(null);
    }
    setErrors({});
  }, [open, editProduct]);

  // Updated handleChange to only allow numbers and prevent arrow key changes
  const handleChange = (field) => (e) => {
    let value = e.target.value;
    
    // List of number fields
    const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    
    if (numberFields.includes(field)) {
      // Allow only digits and decimal point
      value = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    setForm((f) => ({ ...f, [field]: value }));
  };

  // Handle key down to prevent arrow keys from changing values
  const handleKeyDown = (field) => (e) => {
    const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    
    if (numberFields.includes(field)) {
      // Prevent up and down arrow keys from changing the value
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (!isEdit && !image) {
      toast.error('Product image is required');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          fd.append(key, val);
        }
      });
      if (image) fd.append('image', image);

      let result;
      if (isEdit) {
        result = await dispatch(
          updateProduct({ id: editProduct._id, formData: fd })
        ).unwrap();
        toast.success('Product updated');
        await dispatch(
          createActivityLog({
            action: 'EDIT_PRODUCT',
            productId: result._id,
            productName: result.name,
            user: user?.name || user?.fullName || user?.email || 'Unknown',
            role: user?.role || 'Radnus',
          })
        );
      } else {
        result = await dispatch(addProduct(fd)).unwrap();
        toast.success('Product added');
        await dispatch(
          createActivityLog({
            action: 'ADD_PRODUCT',
            productId: result._id || result.id,
            productName: result.name,
            user: user?.name || user?.fullName || user?.email || 'Unknown',
            role: user?.role || 'Radnus',
            timestamp: new Date().toISOString(),
          })
        );
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Updated renderInput with no-spinner class and keydown handler
  const renderInput = (label, field, options = {}) => {
    const { type = 'text', step, ...rest } = options;
    const id = `field-${field}`;
    const isNumber = type === 'number';
    
    return (
      <div className="field" key={field}>
        <label htmlFor={id} className="field-label">{label}</label>
        <input
          id={id}
          type={type}
          step={step}
          value={form[field]}
          onChange={handleChange(field)}
          onKeyDown={handleKeyDown(field)}
          className={`field-input ${errors[field] ? 'field-input-error' : ''} ${isNumber ? 'no-spinner' : ''}`}
          {...rest}
        />
        {errors[field] && <span className="field-error">{errors[field]}</span>}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      footer={
        <div className="prod-footer">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      }
    >
      <div className="prod-form">
        {/* Image */}
        <div className="field">
          <label className="field-label">
            Product Image {!isEdit && '*'}
          </label>
          <div className="img-upload">
            {preview ? (
              <div className="img-preview-wrap">
                <img src={preview} alt="preview" className="img-preview" />
                <button type="button" className="img-remove-btn" onClick={clearImage}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="img-upload-placeholder">
                <ImagePlus size={32} color="#9e9e9e" />
                <span>Tap to add image</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {renderInput('Product Name *', 'name')}

        <div className="field">
          <label className="field-label">Category *</label>
          <select
            value={form.category}
            onChange={(e) => {
              setForm((f) => ({ ...f, category: e.target.value }));
              setErrors((e) => ({ ...e, category: undefined }));
            }}
            className={`field-input ${errors.category ? 'field-input-error' : ''}`}
          >
            {CAT_OPTS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        {renderInput('SKU *', 'sku')}
        {renderInput('Batch No *', 'batchNo')}
        {renderInput('Rack No *', 'rackNo')}
        {renderInput('Vendor Name *', 'vendorName')}

        {renderInput('Item Cost (₹) *', 'itemCost', { type: 'number' })}

        <div className="form-row">
          {renderInput('Distributor Price (₹) *', 'distributorPrice', { type: 'number' })}
          {renderInput('Retailer Price (₹) *', 'retailerPrice', { type: 'number' })}
        </div>
        <div className="form-row">
          {renderInput('Walk‑in Price (₹) *', 'walkinPrice', { type: 'number' })}
          {renderInput('MRP (₹) *', 'mrp', { type: 'number' })}
        </div>
        <div className="form-row">
          {renderInput('GST (%) *', 'gst', { type: 'number', step: '0.01' })}
          {renderInput('Stock (Units) *', 'moq', { type: 'number' })}
        </div>

        <div className="field">
          <label className="field-label">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="field-input"
          >
            {STATUS_OPTS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

/* ─── ProductCard ─── */
const ProductCard = ({ product, onEdit, onDelete, role, currentStock }) => {
  const canManage = ['Admin', 'Radnus'].includes(role);
  const outOfStock = (currentStock ?? 0) === 0;

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-card-top">
        <div className="prod-img">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="prod-img-placeholder">📦</div>
          )}
        </div>
        <div className="prod-info">
          <h3 className="prod-name">{product.name}</h3>
          <div className="prod-sku">SKU: {product.sku || '–'}</div>
          <div className="prod-vendor">Vendor: {product.vendorName || '–'}</div>
          <div
            className="prod-stock"
            style={{ color: outOfStock ? 'var(--red-bright)' : 'var(--green-dark)' }}
          >
            Stock: {currentStock ?? 0}
          </div>
          <span className={`prod-status-badge ${product.status === 'Inactive' ? 'inactive' : ''}`}>
            {product.status || 'Active'}
          </span>
        </div>
        {canManage && (
          <div className="prod-actions">
            <button className="prod-action-btn" onClick={() => onEdit(product)}>
              <Pencil size={16} />
            </button>
            <button className="prod-action-btn" onClick={() => onDelete(product._id)}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="product-card-divider" />
      <div className="product-price-grid">
        <div className="price-item"><span className="price-lbl">Item Cost</span><span className="price-val">₹{product.itemCost ?? 0}</span></div>
        <div className="price-item"><span className="price-lbl">Distributor</span><span className="price-val">₹{product.distributorPrice ?? 0}</span></div>
        <div className="price-item"><span className="price-lbl">Retailer</span><span className="price-val">₹{product.retailerPrice ?? 0}</span></div>
        <div className="price-item"><span className="price-lbl">Walk‑in</span><span className="price-val">₹{product.walkinPrice ?? 0}</span></div>
        <div className="price-item"><span className="price-lbl">MRP</span><span className="price-val">₹{product.mrp ?? 0}</span></div>
        <div className="price-item"><span className="price-lbl">GST</span><span className="price-val">{product.gst ?? 0}%</span></div>
      </div>
    </div>
  );
};

/* ═══ Products Page ═══════════════════════════════════════════════ */
const ProductsPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { list: products, loading } = useSelector((s) => s.products);
  const { data: invoices } = useSelector((state) => state.invoice || { data: [] });

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchInvoices("all"));
  }, [dispatch]);

  const getCurrentStock = (productId, moq) => {
    return moq ?? 0;
  };

  const filtered = products.filter((p) => {
    const s = search.toLowerCase().trim();
    const matchSearch = !s || (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleDelete = async (id) => {
    await dispatch(deleteProduct(id)).unwrap();
    toast.success('Product deleted');
  };

  const openAdd = () => {
    setEditTarget(null);
    setModal(true);
  };
  const openEdit = (p) => {
    setEditTarget(p);
    setModal(true);
  };

  const dynamicCatOptions = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Product Catalog</h2>
          <span className="section-count">{filtered.length} products</span>
        </div>
        {['Admin', 'Radnus'].includes(role) && (
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus size={16} /> Add Product
          </Button>
        )}
      </div>

      <div className="products-toolbar">
        <div className="dtable-search" style={{ maxWidth: 320 }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
          />
        </div>
        <select className="cat-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {dynamicCatOptions.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={40} />
          <p>No products found</p>
          {['Admin', 'Radnus'].includes(role) && (
            <Button variant="primary" size="sm" onClick={openAdd}>Add Product</Button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              role={role}
              currentStock={getCurrentStock(p._id, p.moq)}
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <ProductFormModal
        key={editTarget?._id || 'new'}
        open={modal}
        onClose={() => { setModal(false); setEditTarget(null); }}
        editProduct={editTarget}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default ProductsPage;

// ??????????????????????????????????????????????????????????????????????????????
// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   Plus,
//   Search,
//   Package,
//   X,
//   ImagePlus,
//   Pencil,
//   Trash2,
// } from 'lucide-react';
// import {
//   fetchProducts,
//   addProduct,
//   updateProduct,
//   deleteProduct,
// } from '../../services/features/products/productSlice';
// import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
// import { createActivityLog } from '../../services/features/activity/activitySlice';
// import { selectAuthState } from '../../store/selectors/authSelector';
// import {
//   Button,
//   Modal,
//   toast,
//   ConfirmDialog,
//   Spinner,
// } from '../../components/ui/UI';
// import './Products.css';

// /* ─── Category & Status options ─── */
// const CAT_OPTS = [
//   { value: '', label: 'Select Category' },
//   { value: 'PD Chargers & Car Chargers', label: 'PD Chargers & Car Chargers' },
//   { value: 'Charger', label: 'Charger' },
//   { value: 'Adapter', label: 'Adapter' },
//   { value: 'Data Cables', label: 'Data Cables' },
//   { value: 'Handsfree', label: 'Handsfree' },
//   { value: 'Bluetooth Neckband', label: 'Bluetooth Neckband' },
//   { value: 'Ear Buds', label: 'Ear Buds' },
//   { value: 'Speakers', label: 'Speakers' },
//   { value: 'Radnus Battery', label: 'Radnus Battery' },
//   { value: 'Connector', label: 'Connector' },
//   { value: 'Tools', label: 'Tools' },
//   { value: 'Battery', label: 'Battery' },
// ];

// const STATUS_OPTS = [
//   { value: 'Active', label: 'Active' },
//   { value: 'Inactive', label: 'Inactive' },
// ];

// /* ─── Validation - FIXED to allow stock = 0 ─── */
// const validate = (fields) => {
//   const errors = {};
//   if (!fields.name.trim()) errors.name = 'Product name is required';
//   if (!fields.category) errors.category = 'Category is required';
//   if (!fields.sku.trim()) errors.sku = 'SKU is required';
//   if (!fields.mrp || isNaN(fields.mrp) || Number(fields.mrp) <= 0)
//     errors.mrp = 'MRP must be a positive number';
//   if (!fields.distributorPrice || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) <= 0)
//     errors.distributorPrice = 'Distributor price must be a positive number';
//   if (!fields.retailerPrice || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) <= 0)
//     errors.retailerPrice = 'Retailer price must be a positive number';
//   if (!fields.itemCost || isNaN(fields.itemCost) || Number(fields.itemCost) <= 0)
//     errors.itemCost = 'Item cost must be a positive number';
//   if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
//     errors.gst = 'GST must be 0 or higher';
//   // FIXED: Allow stock to be 0 (non-negative instead of positive)
//   if (fields.moq === '' || fields.moq === null || fields.moq === undefined || isNaN(fields.moq) || Number(fields.moq) < 0)
//     errors.moq = 'Stock must be a non-negative number';
//   if (!fields.walkinPrice || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) <= 0)
//     errors.walkinPrice = 'Walk‑in price must be a positive number';
//   if (!fields.batchNo.trim()) errors.batchNo = 'Batch number is required';
//   if (!fields.rackNo.trim()) errors.rackNo = 'Rack number is required';
//   if (!fields.vendorName.trim()) errors.vendorName = 'Vendor name is required';
//   return errors;
// };

// /* ─── ProductFormModal (Add / Edit) ─── */
// const ProductFormModal = ({ open, onClose, editProduct }) => {
//   const isEdit = !!editProduct;
//   const dispatch = useDispatch();
//   const { user } = useSelector(selectAuthState);
//   const fileInputRef = useRef();

//   const emptyForm = {
//     name: '',
//     category: '',
//     sku: '',
//     batchNo: '',
//     rackNo: '',
//     vendorName: '',
//     itemCost: '',
//     distributorPrice: '',
//     retailerPrice: '',
//     walkinPrice: '',
//     mrp: '',
//     gst: '',
//     moq: '',
//     status: 'Active',
//   };

//   const [form, setForm] = useState(emptyForm);
//   const [image, setImage] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (editProduct) {
//       const p = editProduct;
//       const displayStock = p.moq ?? 0;
//       setForm({
//         name: p.name || '',
//         category: p.category || '',
//         sku: p.sku || '',
//         batchNo: p.batchNo || '',
//         rackNo: p.rackNo || '',
//         vendorName: p.vendorName || '',
//         itemCost: String(p.itemCost ?? ''),
//         distributorPrice: String(p.distributorPrice ?? ''),
//         retailerPrice: String(p.retailerPrice ?? ''),
//         walkinPrice: String(p.walkinPrice ?? ''),
//         mrp: String(p.mrp ?? ''),
//         gst: String(p.gst ?? ''),
//         moq: String(displayStock),
//         status: p.status || 'Active',
//       });
//       setPreview(typeof p.image === 'string' ? p.image : null);
//       setImage(null);
//     } else {
//       setForm(emptyForm);
//       setPreview(null);
//       setImage(null);
//     }
//     setErrors({});
//   }, [open, editProduct]);

//   // Updated handleChange to only allow numbers and prevent arrow key changes
//   const handleChange = (field) => (e) => {
//     let value = e.target.value;
    
//     // List of number fields
//     const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    
//     if (numberFields.includes(field)) {
//       // Allow only digits and decimal point
//       value = value.replace(/[^0-9.]/g, '');
//       // Prevent multiple decimal points
//       const parts = value.split('.');
//       if (parts.length > 2) {
//         value = parts[0] + '.' + parts.slice(1).join('');
//       }
//     }
    
//     setForm((f) => ({ ...f, [field]: value }));
//   };

//   // Handle key down to prevent arrow keys from changing values
//   const handleKeyDown = (field) => (e) => {
//     const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    
//     if (numberFields.includes(field)) {
//       // Prevent up and down arrow keys from changing the value
//       if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
//         e.preventDefault();
//       }
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setImage(file);
//     setPreview(URL.createObjectURL(file));
//   };

//   const clearImage = () => {
//     setImage(null);
//     setPreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   const handleSubmit = async () => {
//     const errs = validate(form);
//     setErrors(errs);
//     if (Object.keys(errs).length > 0) {
//       toast.error('Please fix the highlighted fields');
//       return;
//     }
//     if (!isEdit && !image) {
//       toast.error('Product image is required');
//       return;
//     }

//     setSaving(true);
//     try {
//       const fd = new FormData();
//       Object.entries(form).forEach(([key, val]) => {
//         if (val !== '' && val !== null && val !== undefined) {
//           fd.append(key, val);
//         }
//       });
//       if (image) fd.append('image', image);

//       let result;
//       if (isEdit) {
//         result = await dispatch(
//           updateProduct({ id: editProduct._id, formData: fd })
//         ).unwrap();
//         toast.success('Product updated');
//         await dispatch(
//           createActivityLog({
//             action: 'EDIT_PRODUCT',
//             productId: result._id,
//             productName: result.name,
//             user: user?.name || user?.fullName || user?.email || 'Unknown',
//             role: user?.role || 'Radnus',
//           })
//         );
//       } else {
//         result = await dispatch(addProduct(fd)).unwrap();
//         toast.success('Product added');
//         await dispatch(
//           createActivityLog({
//             action: 'ADD_PRODUCT',
//             productId: result._id || result.id,
//             productName: result.name,
//             user: user?.name || user?.fullName || user?.email || 'Unknown',
//             role: user?.role || 'Radnus',
//             timestamp: new Date().toISOString(),
//           })
//         );
//       }
//       onClose();
//     } catch (err) {
//       toast.error(err?.message || 'Operation failed');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Updated renderInput with no-spinner class and keydown handler
//   const renderInput = (label, field, options = {}) => {
//     const { type = 'text', step, ...rest } = options;
//     const id = `field-${field}`;
//     const isNumber = type === 'number';
    
//     return (
//       <div className="field" key={field}>
//         <label htmlFor={id} className="field-label">{label}</label>
//         <input
//           id={id}
//           type={type}
//           step={step}
//           value={form[field]}
//           onChange={handleChange(field)}
//           onKeyDown={handleKeyDown(field)}
//           className={`field-input ${errors[field] ? 'field-input-error' : ''} ${isNumber ? 'no-spinner' : ''}`}
//           {...rest}
//         />
//         {errors[field] && <span className="field-error">{errors[field]}</span>}
//       </div>
//     );
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={isEdit ? 'Edit Product' : 'Add Product'}
//       footer={
//         <div className="prod-footer">
//           <Button variant="ghost" onClick={onClose}>Cancel</Button>
//           <Button variant="primary" loading={saving} onClick={handleSubmit}>
//             {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
//           </Button>
//         </div>
//       }
//     >
//       <div className="prod-form">
//         {/* Image */}
//         <div className="field">
//           <label className="field-label">
//             Product Image {!isEdit && '*'}
//           </label>
//           <div className="img-upload">
//             {preview ? (
//               <div className="img-preview-wrap">
//                 <img src={preview} alt="preview" className="img-preview" />
//                 <button type="button" className="img-remove-btn" onClick={clearImage}>
//                   <X size={16} />
//                 </button>
//               </div>
//             ) : (
//               <label className="img-upload-placeholder">
//                 <ImagePlus size={32} color="#9e9e9e" />
//                 <span>Tap to add image</span>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   style={{ display: 'none' }}
//                 />
//               </label>
//             )}
//           </div>
//         </div>

//         {renderInput('Product Name *', 'name')}

//         <div className="field">
//           <label className="field-label">Category *</label>
//           <select
//             value={form.category}
//             onChange={(e) => {
//               setForm((f) => ({ ...f, category: e.target.value }));
//               setErrors((e) => ({ ...e, category: undefined }));
//             }}
//             className={`field-input ${errors.category ? 'field-input-error' : ''}`}
//           >
//             {CAT_OPTS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//           {errors.category && <span className="field-error">{errors.category}</span>}
//         </div>

//         {renderInput('SKU *', 'sku')}
//         {renderInput('Batch No *', 'batchNo')}
//         {renderInput('Rack No *', 'rackNo')}
//         {renderInput('Vendor Name *', 'vendorName')}

//         {renderInput('Item Cost (₹) *', 'itemCost', { type: 'number' })}

//         <div className="form-row">
//           {renderInput('Distributor Price (₹) *', 'distributorPrice', { type: 'number' })}
//           {renderInput('Retailer Price (₹) *', 'retailerPrice', { type: 'number' })}
//         </div>
//         <div className="form-row">
//           {renderInput('Walk‑in Price (₹) *', 'walkinPrice', { type: 'number' })}
//           {renderInput('MRP (₹) *', 'mrp', { type: 'number' })}
//         </div>
//         <div className="form-row">
//           {renderInput('GST (%) *', 'gst', { type: 'number', step: '0.01' })}
//           {renderInput('Stock (Units) *', 'moq', { type: 'number' })}
//         </div>

//         <div className="field">
//           <label className="field-label">Status</label>
//           <select
//             value={form.status}
//             onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
//             className="field-input"
//           >
//             {STATUS_OPTS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ─── ProductCard ─── */
// const ProductCard = ({ product, onEdit, onDelete, role, currentStock }) => {
//   const canManage = ['Admin', 'Radnus'].includes(role);
//   const outOfStock = (currentStock ?? 0) === 0;

//   return (
//     <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
//       <div className="product-card-top">
//         <div className="prod-img">
//           {product.image ? (
//             <img src={product.image} alt={product.name} />
//           ) : (
//             <div className="prod-img-placeholder">📦</div>
//           )}
//         </div>
//         <div className="prod-info">
//           <h3 className="prod-name">{product.name}</h3>
//           <div className="prod-sku">SKU: {product.sku || '–'}</div>
//           <div className="prod-vendor">Vendor: {product.vendorName || '–'}</div>
//           <div
//             className="prod-stock"
//             style={{ color: outOfStock ? 'var(--red-bright)' : 'var(--green-dark)' }}
//           >
//             Stock: {currentStock ?? 0}
//           </div>
//           <span className={`prod-status-badge ${product.status === 'Inactive' ? 'inactive' : ''}`}>
//             {product.status || 'Active'}
//           </span>
//         </div>
//         {canManage && (
//           <div className="prod-actions">
//             <button className="prod-action-btn" onClick={() => onEdit(product)}>
//               <Pencil size={16} />
//             </button>
//             <button className="prod-action-btn" onClick={() => onDelete(product._id)}>
//               <Trash2 size={16} />
//             </button>
//           </div>
//         )}
//       </div>
//       <div className="product-card-divider" />
//       <div className="product-price-grid">
//         <div className="price-item"><span className="price-lbl">Item Cost</span><span className="price-val">₹{product.itemCost ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Distributor</span><span className="price-val">₹{product.distributorPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Retailer</span><span className="price-val">₹{product.retailerPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Walk‑in</span><span className="price-val">₹{product.walkinPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">MRP</span><span className="price-val">₹{product.mrp ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">GST</span><span className="price-val">{product.gst ?? 0}%</span></div>
//       </div>
//     </div>
//   );
// };

// /* ═══ Products Page ═══════════════════════════════════════════════ */
// const ProductsPage = () => {
//   const dispatch = useDispatch();
//   const { role } = useSelector(selectAuthState);
//   const { list: products, loading } = useSelector((s) => s.products);
//   const { data: invoices } = useSelector((state) => state.invoice || { data: [] });

//   const [search, setSearch] = useState('');
//   const [catFilter, setCatFilter] = useState('');
//   const [modal, setModal] = useState(false);
//   const [editTarget, setEditTarget] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);

//   useEffect(() => {
//     dispatch(fetchProducts());
//     dispatch(fetchInvoices("all"));
//   }, [dispatch]);

//   const getCurrentStock = (productId, moq) => {
//     return moq ?? 0;
//   };

//   const filtered = products.filter((p) => {
//     const s = search.toLowerCase().trim();
//     const matchSearch = !s || (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s);
//     const matchCat = !catFilter || p.category === catFilter;
//     return matchSearch && matchCat;
//   });

//   const handleDelete = async (id) => {
//     await dispatch(deleteProduct(id)).unwrap();
//     toast.success('Product deleted');
//   };

//   const openAdd = () => {
//     setEditTarget(null);
//     setModal(true);
//   };
//   const openEdit = (p) => {
//     setEditTarget(p);
//     setModal(true);
//   };

//   const dynamicCatOptions = [...new Set(products.map((p) => p.category).filter(Boolean))];

//   return (
//     <div>
//       <div className="section-header">
//         <div>
//           <h2 className="section-title">Product Catalog</h2>
//           <span className="section-count">{filtered.length} products</span>
//         </div>
//         {['Admin', 'Radnus'].includes(role) && (
//           <Button variant="primary" size="sm" onClick={openAdd}>
//             <Plus size={16} /> Add Product
//           </Button>
//         )}
//       </div>

//       <div className="products-toolbar">
//         <div className="dtable-search" style={{ maxWidth: 320 }}>
//           <Search size={16} />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search by name or SKU…"
//           />
//         </div>
//         <select className="cat-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
//           <option value="">All Categories</option>
//           {dynamicCatOptions.map((cat) => (
//             <option key={cat} value={cat}>{cat}</option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <div className="loading-center"><Spinner size="lg" /></div>
//       ) : filtered.length === 0 ? (
//         <div className="empty-state">
//           <Package size={40} />
//           <p>No products found</p>
//           {['Admin', 'Radnus'].includes(role) && (
//             <Button variant="primary" size="sm" onClick={openAdd}>Add Product</Button>
//           )}
//         </div>
//       ) : (
//         <div className="products-grid">
//           {filtered.map((p) => (
//             <ProductCard
//               key={p._id}
//               product={p}
//               role={role}
//               currentStock={getCurrentStock(p._id, p.moq)}
//               onEdit={openEdit}
//               onDelete={(id) => setDeleteId(id)}
//             />
//           ))}
//         </div>
//       )}

//       <ProductFormModal
//         key={editTarget?._id || 'new'}
//         open={modal}
//         onClose={() => { setModal(false); setEditTarget(null); }}
//         editProduct={editTarget}
//       />

//       <ConfirmDialog
//         open={!!deleteId}
//         onClose={() => setDeleteId(null)}
//         onConfirm={() => handleDelete(deleteId)}
//         title="Delete Product"
//         message="Are you sure you want to delete this product? This action cannot be undone."
//         confirmLabel="Delete"
//       />
//     </div>
//   );
// };

// export default ProductsPage;

// // import React, { useEffect, useState, useRef, useMemo } from 'react';
// // import { useDispatch, useSelector } from 'react-redux';
// // import {
// //   Plus,
// //   Search,
// //   Package,
// //   X,
// //   ImagePlus,
// //   Pencil,
// //   Trash2,
// // } from 'lucide-react';
// // import {
// //   fetchProducts,
// //   addProduct,
// //   updateProduct,
// //   deleteProduct,
// // } from '../../services/features/products/productSlice';
// // import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
// // import { createActivityLog } from '../../services/features/activity/activitySlice';
// // import { selectAuthState } from '../../store/selectors/authSelector';
// // import {
// //   Button,
// //   Modal,
// //   toast,
// //   ConfirmDialog,
// //   Spinner,
// // } from '../../components/ui/UI';
// // import './Products.css';

// // /* ─── Category & Status options ─── */
// // const CAT_OPTS = [
// //   { value: '', label: 'Select Category' },
// //   { value: 'PD Chargers & Car Chargers', label: 'PD Chargers & Car Chargers' },
// //   { value: 'Charger', label: 'Charger' },
// //   { value: 'Data Cables', label: 'Data Cables' },
// //   { value: 'Handsfree', label: 'Handsfree' },
// //   { value: 'Bluetooth Neckband', label: 'Bluetooth Neckband' },
// //   { value: 'Ear Buds', label: 'Ear Buds' },
// //   { value: 'Speakers', label: 'Speakers' },
// //   { value: 'Radnus Battery', label: 'Radnus Battery' },
// // ];

// // const STATUS_OPTS = [
// //   { value: 'Active', label: 'Active' },
// //   { value: 'Inactive', label: 'Inactive' },
// // ];

// // /* ─── Validation (unchanged) ─── */
// // const validate = (fields) => {
// //   const errors = {};
// //   if (!fields.name.trim()) errors.name = 'Product name is required';
// //   if (!fields.category) errors.category = 'Category is required';
// //   if (!fields.sku.trim()) errors.sku = 'SKU is required';
// //   if (!fields.mrp || isNaN(fields.mrp) || Number(fields.mrp) <= 0)
// //     errors.mrp = 'MRP must be a positive number';
// //   if (!fields.distributorPrice || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) <= 0)
// //     errors.distributorPrice = 'Distributor price must be a positive number';
// //   if (!fields.retailerPrice || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) <= 0)
// //     errors.retailerPrice = 'Retailer price must be a positive number';
// //   if (!fields.itemCost || isNaN(fields.itemCost) || Number(fields.itemCost) <= 0)
// //     errors.itemCost = 'Item cost must be a positive number';
// //   if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
// //     errors.gst = 'GST must be 0 or higher';
// //   if (!fields.moq || isNaN(fields.moq) || Number(fields.moq) <= 0)
// //     errors.moq = 'Stock must be a positive number';
// //   if (!fields.walkinPrice || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) <= 0)
// //     errors.walkinPrice = 'Walk‑in price must be a positive number';
// //   if (!fields.batchNo.trim()) errors.batchNo = 'Batch number is required';
// //   if (!fields.rackNo.trim()) errors.rackNo = 'Rack number is required';
// //   if (!fields.vendorName.trim()) errors.vendorName = 'Vendor name is required';
// //   return errors;
// // };

// // /* ─── ProductFormModal (Add / Edit) ─── */
// // const ProductFormModal = ({ open, onClose, editProduct }) => {
// //   const isEdit = !!editProduct;
// //   const dispatch = useDispatch();
// //   const { user } = useSelector(selectAuthState);
// //   const fileInputRef = useRef();

// //   // Invoices are not used to compute stock anymore; they are still fetched
// //   // but we remove the totalSold logic.
// //   const emptyForm = {
// //     name: '',
// //     category: '',
// //     sku: '',
// //     batchNo: '',
// //     rackNo: '',
// //     vendorName: '',
// //     itemCost: '',
// //     distributorPrice: '',
// //     retailerPrice: '',
// //     walkinPrice: '',
// //     mrp: '',
// //     gst: '',
// //     moq: '',
// //     status: 'Active',
// //   };

// //   const [form, setForm] = useState(emptyForm);
// //   const [image, setImage] = useState(null);
// //   const [preview, setPreview] = useState(null);
// //   const [errors, setErrors] = useState({});
// //   const [saving, setSaving] = useState(false);

// //   useEffect(() => {
// //     if (!open) return;
// //     if (editProduct) {
// //       const p = editProduct;
// //       // Show the current stock from the product itself (already updated by backend)
// //       const displayStock = p.moq ?? 0;
// //       setForm({
// //         name: p.name || '',
// //         category: p.category || '',
// //         sku: p.sku || '',
// //         batchNo: p.batchNo || '',
// //         rackNo: p.rackNo || '',
// //         vendorName: p.vendorName || '',
// //         itemCost: String(p.itemCost ?? ''),
// //         distributorPrice: String(p.distributorPrice ?? ''),
// //         retailerPrice: String(p.retailerPrice ?? ''),
// //         walkinPrice: String(p.walkinPrice ?? ''),
// //         mrp: String(p.mrp ?? ''),
// //         gst: String(p.gst ?? ''),
// //         moq: String(displayStock),   // live stock from backend
// //         status: p.status || 'Active',
// //       });
// //       setPreview(typeof p.image === 'string' ? p.image : null);
// //       setImage(null);
// //     } else {
// //       setForm(emptyForm);
// //       setPreview(null);
// //       setImage(null);
// //     }
// //     setErrors({});
// //   }, [open, editProduct]);

// //   const handleChange = (field) => (e) =>
// //     setForm((f) => ({ ...f, [field]: e.target.value }));

// //   const handleFileChange = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;
// //     setImage(file);
// //     setPreview(URL.createObjectURL(file));
// //   };

// //   const clearImage = () => {
// //     setImage(null);
// //     setPreview(null);
// //     if (fileInputRef.current) fileInputRef.current.value = '';
// //   };

// //   const handleSubmit = async () => {
// //     const errs = validate(form);
// //     setErrors(errs);
// //     if (Object.keys(errs).length > 0) {
// //       toast.error('Please fix the highlighted fields');
// //       return;
// //     }
// //     if (!isEdit && !image) {
// //       toast.error('Product image is required');
// //       return;
// //     }

// //     setSaving(true);
// //     try {
// //       // No need to add totalSold – the form.moq holds the new desired stock
// //       // (backend will treat it as the total stock to set)
// //       const fd = new FormData();
// //       Object.entries(form).forEach(([key, val]) => {
// //         if (val !== '' && val !== null && val !== undefined) {
// //           fd.append(key, val);
// //         }
// //       });
// //       if (image) fd.append('image', image);

// //       let result;
// //       if (isEdit) {
// //         result = await dispatch(
// //           updateProduct({ id: editProduct._id, formData: fd })
// //         ).unwrap();
// //         toast.success('Product updated');
// //         await dispatch(
// //           createActivityLog({
// //             action: 'EDIT_PRODUCT',
// //             productId: result._id,
// //             productName: result.name,
// //             user: user?.name || user?.fullName || user?.email || 'Unknown',
// //             role: user?.role || 'Radnus',
// //           })
// //         );
// //       } else {
// //         result = await dispatch(addProduct(fd)).unwrap();
// //         toast.success('Product added');
// //         await dispatch(
// //           createActivityLog({
// //             action: 'ADD_PRODUCT',
// //             productId: result._id || result.id,
// //             productName: result.name,
// //             user: user?.name || user?.fullName || user?.email || 'Unknown',
// //             role: user?.role || 'Radnus',
// //             timestamp: new Date().toISOString(),
// //           })
// //         );
// //       }
// //       onClose();
// //     } catch (err) {
// //       toast.error(err?.message || 'Operation failed');
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   const renderInput = (label, field, options = {}) => {
// //     const { type = 'text', step, ...rest } = options;
// //     const id = `field-${field}`;
// //     return (
// //       <div className="field" key={field}>
// //         <label htmlFor={id} className="field-label">{label}</label>
// //         <input
// //           id={id}
// //           type={type}
// //           step={step}
// //           value={form[field]}
// //           onChange={handleChange(field)}
// //           className={`field-input ${errors[field] ? 'field-input-error' : ''}`}
// //           {...rest}
// //         />
// //         {errors[field] && <span className="field-error">{errors[field]}</span>}
// //       </div>
// //     );
// //   };

// //   return (
// //     <Modal
// //       open={open}
// //       onClose={onClose}
// //       title={isEdit ? 'Edit Product' : 'Add Product'}
// //       footer={
// //         <div className="prod-footer">
// //           <Button variant="ghost" onClick={onClose}>Cancel</Button>
// //           <Button variant="primary" loading={saving} onClick={handleSubmit}>
// //             {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
// //           </Button>
// //         </div>
// //       }
// //     >
// //       <div className="prod-form">
// //         {/* Image */}
// //         <div className="field">
// //           <label className="field-label">
// //             Product Image {!isEdit && '*'}
// //           </label>
// //           <div className="img-upload">
// //             {preview ? (
// //               <div className="img-preview-wrap">
// //                 <img src={preview} alt="preview" className="img-preview" />
// //                 <button type="button" className="img-remove-btn" onClick={clearImage}>
// //                   <X size={16} />
// //                 </button>
// //               </div>
// //             ) : (
// //               <label className="img-upload-placeholder">
// //                 <ImagePlus size={32} color="#9e9e9e" />
// //                 <span>Tap to add image</span>
// //                 <input
// //                   type="file"
// //                   accept="image/*"
// //                   ref={fileInputRef}
// //                   onChange={handleFileChange}
// //                   style={{ display: 'none' }}
// //                 />
// //               </label>
// //             )}
// //           </div>
// //         </div>

// //         {renderInput('Product Name *', 'name')}

// //         <div className="field">
// //           <label className="field-label">Category *</label>
// //           <select
// //             value={form.category}
// //             onChange={(e) => {
// //               setForm((f) => ({ ...f, category: e.target.value }));
// //               setErrors((e) => ({ ...e, category: undefined }));
// //             }}
// //             className={`field-input ${errors.category ? 'field-input-error' : ''}`}
// //           >
// //             {CAT_OPTS.map((opt) => (
// //               <option key={opt.value} value={opt.value}>{opt.label}</option>
// //             ))}
// //           </select>
// //           {errors.category && <span className="field-error">{errors.category}</span>}
// //         </div>

// //         {renderInput('SKU *', 'sku')}
// //         {renderInput('Batch No *', 'batchNo')}
// //         {renderInput('Rack No *', 'rackNo')}
// //         {renderInput('Vendor Name *', 'vendorName')}

// //         {renderInput('Item Cost (₹) *', 'itemCost', { type: 'number' })}

// //         <div className="form-row">
// //           {renderInput('Distributor Price (₹) *', 'distributorPrice', { type: 'number' })}
// //           {renderInput('Retailer Price (₹) *', 'retailerPrice', { type: 'number' })}
// //         </div>
// //         <div className="form-row">
// //           {renderInput('Walk‑in Price (₹) *', 'walkinPrice', { type: 'number' })}
// //           {renderInput('MRP (₹) *', 'mrp', { type: 'number' })}
// //         </div>
// //         <div className="form-row">
// //           {renderInput('GST (%) *', 'gst', { type: 'number', step: '0.01' })}
// //           {renderInput('Stock (Units) *', 'moq', { type: 'number' })}
// //         </div>

// //         <div className="field">
// //           <label className="field-label">Status</label>
// //           <select
// //             value={form.status}
// //             onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
// //             className="field-input"
// //           >
// //             {STATUS_OPTS.map((opt) => (
// //               <option key={opt.value} value={opt.value}>{opt.label}</option>
// //             ))}
// //           </select>
// //         </div>
// //       </div>
// //     </Modal>
// //   );
// // };

// // /* ─── ProductCard (unchanged) ─── */
// // const ProductCard = ({ product, onEdit, onDelete, role, currentStock }) => {
// //   const canManage = ['Admin', 'Radnus'].includes(role);
// //   const outOfStock = (currentStock ?? 0) === 0;

// //   return (
// //     <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
// //       <div className="product-card-top">
// //         <div className="prod-img">
// //           {product.image ? (
// //             <img src={product.image} alt={product.name} />
// //           ) : (
// //             <div className="prod-img-placeholder">📦</div>
// //           )}
// //         </div>
// //         <div className="prod-info">
// //           <h3 className="prod-name">{product.name}</h3>
// //           <div className="prod-sku">SKU: {product.sku || '–'}</div>
// //           <div className="prod-vendor">Vendor: {product.vendorName || '–'}</div>
// //           <div
// //             className="prod-stock"
// //             style={{ color: outOfStock ? 'var(--red-bright)' : 'var(--green-dark)' }}
// //           >
// //             Stock: {currentStock ?? 0}
// //           </div>
// //           <span className={`prod-status-badge ${product.status === 'Inactive' ? 'inactive' : ''}`}>
// //             {product.status || 'Active'}
// //           </span>
// //         </div>
// //         {canManage && (
// //           <div className="prod-actions">
// //             <button className="prod-action-btn" onClick={() => onEdit(product)}>
// //               <Pencil size={16} />
// //             </button>
// //             <button className="prod-action-btn" onClick={() => onDelete(product._id)}>
// //               <Trash2 size={16} />
// //             </button>
// //           </div>
// //         )}
// //       </div>
// //       <div className="product-card-divider" />
// //       <div className="product-price-grid">
// //         <div className="price-item"><span className="price-lbl">Item Cost</span><span className="price-val">₹{product.itemCost ?? 0}</span></div>
// //         <div className="price-item"><span className="price-lbl">Distributor</span><span className="price-val">₹{product.distributorPrice ?? 0}</span></div>
// //         <div className="price-item"><span className="price-lbl">Retailer</span><span className="price-val">₹{product.retailerPrice ?? 0}</span></div>
// //         <div className="price-item"><span className="price-lbl">Walk‑in</span><span className="price-val">₹{product.walkinPrice ?? 0}</span></div>
// //         <div className="price-item"><span className="price-lbl">MRP</span><span className="price-val">₹{product.mrp ?? 0}</span></div>
// //         <div className="price-item"><span className="price-lbl">GST</span><span className="price-val">{product.gst ?? 0}%</span></div>
// //       </div>
// //     </div>
// //   );
// // };

// // /* ═══ Products Page ═══════════════════════════════════════════════ */
// // const ProductsPage = () => {
// //   const dispatch = useDispatch();
// //   const { role } = useSelector(selectAuthState);
// //   const { list: products, loading } = useSelector((s) => s.products);
// //   const { data: invoices } = useSelector((state) => state.invoice || { data: [] });

// //   const [search, setSearch] = useState('');
// //   const [catFilter, setCatFilter] = useState('');
// //   const [modal, setModal] = useState(false);
// //   const [editTarget, setEditTarget] = useState(null);
// //   const [deleteId, setDeleteId] = useState(null);

// //   useEffect(() => {
// //     dispatch(fetchProducts());
// //     dispatch(fetchInvoices("all")); // still fetch invoices for potential reporting, but stock computed differently
// //   }, [dispatch]);

// //   // Stock now comes directly from the product's moq field (already live stock)
// //   const getCurrentStock = (productId, moq) => {
// //     // Backend already updated moq after each sale, so just return it
// //     return moq ?? 0;
// //   };

// //   const filtered = products.filter((p) => {
// //     const s = search.toLowerCase().trim();
// //     const matchSearch = !s || (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s);
// //     const matchCat = !catFilter || p.category === catFilter;
// //     return matchSearch && matchCat;
// //   });

// //   const handleDelete = async (id) => {
// //     await dispatch(deleteProduct(id)).unwrap();
// //     toast.success('Product deleted');
// //   };

// //   const openAdd = () => {
// //     setEditTarget(null);
// //     setModal(true);
// //   };
// //   const openEdit = (p) => {
// //     setEditTarget(p);
// //     setModal(true);
// //   };

// //   const dynamicCatOptions = [...new Set(products.map((p) => p.category).filter(Boolean))];

// //   return (
// //     <div>
// //       <div className="section-header">
// //         <div>
// //           <h2 className="section-title">Product Catalog</h2>
// //           <span className="section-count">{filtered.length} products</span>
// //         </div>
// //         {['Admin', 'Radnus'].includes(role) && (
// //           <Button variant="primary" size="sm" onClick={openAdd}>
// //             <Plus size={16} /> Add Product
// //           </Button>
// //         )}
// //       </div>

// //       <div className="products-toolbar">
// //         <div className="dtable-search" style={{ maxWidth: 320 }}>
// //           <Search size={16} />
// //           <input
// //             value={search}
// //             onChange={(e) => setSearch(e.target.value)}
// //             placeholder="Search by name or SKU…"
// //           />
// //         </div>
// //         <select className="cat-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
// //           <option value="">All Categories</option>
// //           {dynamicCatOptions.map((cat) => (
// //             <option key={cat} value={cat}>{cat}</option>
// //           ))}
// //         </select>
// //       </div>

// //       {loading ? (
// //         <div className="loading-center"><Spinner size="lg" /></div>
// //       ) : filtered.length === 0 ? (
// //         <div className="empty-state">
// //           <Package size={40} />
// //           <p>No products found</p>
// //           {['Admin', 'Radnus'].includes(role) && (
// //             <Button variant="primary" size="sm" onClick={openAdd}>Add Product</Button>
// //           )}
// //         </div>
// //       ) : (
// //         <div className="products-grid">
// //           {filtered.map((p) => (
// //             <ProductCard
// //               key={p._id}
// //               product={p}
// //               role={role}
// //               currentStock={getCurrentStock(p._id, p.moq)}
// //               onEdit={openEdit}
// //               onDelete={(id) => setDeleteId(id)}
// //             />
// //           ))}
// //         </div>
// //       )}

// //       {/* Key forces remount when switching between add/edit */}
// //       <ProductFormModal
// //         key={editTarget?._id || 'new'}
// //         open={modal}
// //         onClose={() => { setModal(false); setEditTarget(null); }}
// //         editProduct={editTarget}
// //       />

// //       <ConfirmDialog
// //         open={!!deleteId}
// //         onClose={() => setDeleteId(null)}
// //         onConfirm={() => handleDelete(deleteId)}
// //         title="Delete Product"
// //         message="Are you sure you want to delete this product? This action cannot be undone."
// //         confirmLabel="Delete"
// //       />
// //     </div>
// //   );
// // };

// // export default ProductsPage;

// //================================================

// import React, { useEffect, useState, useRef, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   Plus,
//   Search,
//   Package,
//   X,
//   ImagePlus,
//   Pencil,
//   Trash2,
// } from 'lucide-react';
// import {
//   fetchProducts,
//   addProduct,
//   updateProduct,
//   deleteProduct,
// } from '../../services/features/products/productSlice';
// import { fetchInvoices } from '../../services/features/invoice/invoiceSlice';
// import { createActivityLog } from '../../services/features/activity/activitySlice';
// import { selectAuthState } from '../../store/selectors/authSelector';
// import {
//   Button,
//   Modal,
//   toast,
//   ConfirmDialog,
//   Spinner,
// } from '../../components/ui/UI';
// import './Products.css';


// /* ─── Category & Status options ─── */
// const CAT_OPTS = [
//   { value: '', label: 'Select Category' },
//   { value: 'PD Chargers & Car Chargers', label: 'PD Chargers & Car Chargers' },
//   { value: 'Charger', label: 'Charger' },
//   { value: 'Adapter', label: 'Adapter' },
//   { value: 'Data Cables', label: 'Data Cables' },
//   { value: 'Handsfree', label: 'Handsfree' },
//   { value: 'Bluetooth Neckband', label: 'Bluetooth Neckband' },
//   { value: 'Ear Buds', label: 'Ear Buds' },
//   { value: 'Speakers', label: 'Speakers' },
//   { value: 'Radnus Battery', label: 'Radnus Battery' },
//   { value: 'Connector', label: 'Connector' },
//   { value: 'Tools', label: 'Tools' },
//   { value: 'Battery', label: 'Battery' },
// ];

// const STATUS_OPTS = [
//   { value: 'Active', label: 'Active' },
//   { value: 'Inactive', label: 'Inactive' },
// ];

// /* ─── Validation - FIXED to allow stock = 0 ─── */
// const validate = (fields) => {
//   const errors = {};
//   if (!fields.name.trim()) errors.name = 'Product name is required';
//   if (!fields.category) errors.category = 'Category is required';
//   if (!fields.sku.trim()) errors.sku = 'SKU is required';
//   if (!fields.mrp || isNaN(fields.mrp) || Number(fields.mrp) <= 0)
//     errors.mrp = 'MRP must be a positive number';
//   if (!fields.distributorPrice || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) <= 0)
//     errors.distributorPrice = 'Distributor price must be a positive number';
//   if (!fields.retailerPrice || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) <= 0)
//     errors.retailerPrice = 'Retailer price must be a positive number';
//   if (!fields.itemCost || isNaN(fields.itemCost) || Number(fields.itemCost) <= 0)
//     errors.itemCost = 'Item cost must be a positive number';
//   if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
//     errors.gst = 'GST must be 0 or higher';
//   // FIXED: Allow stock to be 0 (non-negative instead of positive)
//   if (fields.moq === '' || fields.moq === null || fields.moq === undefined || isNaN(fields.moq) || Number(fields.moq) < 0)
//     errors.moq = 'Stock must be a non-negative number';
//   if (!fields.walkinPrice || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) <= 0)
//     errors.walkinPrice = 'Walk‑in price must be a positive number';
//   if (!fields.batchNo.trim()) errors.batchNo = 'Batch number is required';
//   if (!fields.rackNo.trim()) errors.rackNo = 'Rack number is required';
//   if (!fields.vendorName.trim()) errors.vendorName = 'Vendor name is required';
//   return errors;
// };

// /* ─── ProductFormModal (Add / Edit) ─── */
// const ProductFormModal = ({ open, onClose, editProduct }) => {
//   const isEdit = !!editProduct;
//   const dispatch = useDispatch();
//   const { user } = useSelector(selectAuthState);
//   const fileInputRef = useRef();

//   const emptyForm = {
//     name: '',
//     category: '',
//     sku: '',
//     batchNo: '',
//     rackNo: '',
//     vendorName: '',
//     itemCost: '',
//     distributorPrice: '',
//     retailerPrice: '',
//     walkinPrice: '',
//     mrp: '',
//     gst: '',
//     moq: '',
//     status: 'Active',
//   };

//   const [form, setForm] = useState(emptyForm);
//   const [image, setImage] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!open) return;
//     if (editProduct) {
//       const p = editProduct;
//       const displayStock = p.moq ?? 0;
//       setForm({
//         name: p.name || '',
//         category: p.category || '',
//         sku: p.sku || '',
//         batchNo: p.batchNo || '',
//         rackNo: p.rackNo || '',
//         vendorName: p.vendorName || '',
//         itemCost: String(p.itemCost ?? ''),
//         distributorPrice: String(p.distributorPrice ?? ''),
//         retailerPrice: String(p.retailerPrice ?? ''),
//         walkinPrice: String(p.walkinPrice ?? ''),
//         mrp: String(p.mrp ?? ''),
//         gst: String(p.gst ?? ''),
//         moq: String(displayStock),
//         status: p.status || 'Active',
//       });
//       setPreview(typeof p.image === 'string' ? p.image : null);
//       setImage(null);
//     } else {
//       setForm(emptyForm);
//       setPreview(null);
//       setImage(null);
//     }
//     setErrors({});
//   }, [open, editProduct]);

//   const handleChange = (field) => (e) =>
//     setForm((f) => ({ ...f, [field]: e.target.value }));

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setImage(file);
//     setPreview(URL.createObjectURL(file));
//   };

//   const clearImage = () => {
//     setImage(null);
//     setPreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   const handleSubmit = async () => {
//     const errs = validate(form);
//     setErrors(errs);
//     if (Object.keys(errs).length > 0) {
//       toast.error('Please fix the highlighted fields');
//       return;
//     }
//     if (!isEdit && !image) {
//       toast.error('Product image is required');
//       return;
//     }

//     setSaving(true);
//     try {
//       const fd = new FormData();
//       Object.entries(form).forEach(([key, val]) => {
//         if (val !== '' && val !== null && val !== undefined) {
//           fd.append(key, val);
//         }
//       });
//       if (image) fd.append('image', image);

//       let result;
//       if (isEdit) {
//         result = await dispatch(
//           updateProduct({ id: editProduct._id, formData: fd })
//         ).unwrap();
//         toast.success('Product updated');
//         await dispatch(
//           createActivityLog({
//             action: 'EDIT_PRODUCT',
//             productId: result._id,
//             productName: result.name,
//             user: user?.name || user?.fullName || user?.email || 'Unknown',
//             role: user?.role || 'Radnus',
//           })
//         );
//       } else {
//         result = await dispatch(addProduct(fd)).unwrap();
//         toast.success('Product added');
//         await dispatch(
//           createActivityLog({
//             action: 'ADD_PRODUCT',
//             productId: result._id || result.id,
//             productName: result.name,
//             user: user?.name || user?.fullName || user?.email || 'Unknown',
//             role: user?.role || 'Radnus',
//             timestamp: new Date().toISOString(),
//           })
//         );
//       }
//       onClose();
//     } catch (err) {
//       toast.error(err?.message || 'Operation failed');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const renderInput = (label, field, options = {}) => {
//     const { type = 'text', step, ...rest } = options;
//     const id = `field-${field}`;
//     return (
//       <div className="field" key={field}>
//         <label htmlFor={id} className="field-label">{label}</label>
//         <input
//           id={id}
//           type={type}
//           step={step}
//           value={form[field]}
//           onChange={handleChange(field)}
//           className={`field-input ${errors[field] ? 'field-input-error' : ''}`}
//           {...rest}
//         />
//         {errors[field] && <span className="field-error">{errors[field]}</span>}
//       </div>
//     );
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title={isEdit ? 'Edit Product' : 'Add Product'}
//       footer={
//         <div className="prod-footer">
//           <Button variant="ghost" onClick={onClose}>Cancel</Button>
//           <Button variant="primary" loading={saving} onClick={handleSubmit}>
//             {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
//           </Button>
//         </div>
//       }
//     >
//       <div className="prod-form">
//         {/* Image */}
//         <div className="field">
//           <label className="field-label">
//             Product Image {!isEdit && '*'}
//           </label>
//           <div className="img-upload">
//             {preview ? (
//               <div className="img-preview-wrap">
//                 <img src={preview} alt="preview" className="img-preview" />
//                 <button type="button" className="img-remove-btn" onClick={clearImage}>
//                   <X size={16} />
//                 </button>
//               </div>
//             ) : (
//               <label className="img-upload-placeholder">
//                 <ImagePlus size={32} color="#9e9e9e" />
//                 <span>Tap to add image</span>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   style={{ display: 'none' }}
//                 />
//               </label>
//             )}
//           </div>
//         </div>

//         {renderInput('Product Name *', 'name')}

//         <div className="field">
//           <label className="field-label">Category *</label>
//           <select
//             value={form.category}
//             onChange={(e) => {
//               setForm((f) => ({ ...f, category: e.target.value }));
//               setErrors((e) => ({ ...e, category: undefined }));
//             }}
//             className={`field-input ${errors.category ? 'field-input-error' : ''}`}
//           >
//             {CAT_OPTS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//           {errors.category && <span className="field-error">{errors.category}</span>}
//         </div>

//         {renderInput('SKU *', 'sku')}
//         {renderInput('Batch No *', 'batchNo')}
//         {renderInput('Rack No *', 'rackNo')}
//         {renderInput('Vendor Name *', 'vendorName')}

//         {renderInput('Item Cost (₹) *', 'itemCost', { type: 'number' })}

//         <div className="form-row">
//           {renderInput('Distributor Price (₹) *', 'distributorPrice', { type: 'number' })}
//           {renderInput('Retailer Price (₹) *', 'retailerPrice', { type: 'number' })}
//         </div>
//         <div className="form-row">
//           {renderInput('Walk‑in Price (₹) *', 'walkinPrice', { type: 'number' })}
//           {renderInput('MRP (₹) *', 'mrp', { type: 'number' })}
//         </div>
//         <div className="form-row">
//           {renderInput('GST (%) *', 'gst', { type: 'number', step: '0.01' })}
//           {renderInput('Stock (Units) *', 'moq', { type: 'number' })}
//         </div>

//         <div className="field">
//           <label className="field-label">Status</label>
//           <select
//             value={form.status}
//             onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
//             className="field-input"
//           >
//             {STATUS_OPTS.map((opt) => (
//               <option key={opt.value} value={opt.value}>{opt.label}</option>
//             ))}
//           </select>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// /* ─── ProductCard ─── */
// const ProductCard = ({ product, onEdit, onDelete, role, currentStock }) => {
//   const canManage = ['Admin', 'Radnus'].includes(role);
//   const outOfStock = (currentStock ?? 0) === 0;

//   return (
//     <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
//       <div className="product-card-top">
//         <div className="prod-img">
//           {product.image ? (
//             <img src={product.image} alt={product.name} />
//           ) : (
//             <div className="prod-img-placeholder">📦</div>
//           )}
//         </div>
//         <div className="prod-info">
//           <h3 className="prod-name">{product.name}</h3>
//           <div className="prod-sku">SKU: {product.sku || '–'}</div>
//           <div className="prod-vendor">Vendor: {product.vendorName || '–'}</div>
//           <div
//             className="prod-stock"
//             style={{ color: outOfStock ? 'var(--red-bright)' : 'var(--green-dark)' }}
//           >
//             Stock: {currentStock ?? 0}
//           </div>
//           <span className={`prod-status-badge ${product.status === 'Inactive' ? 'inactive' : ''}`}>
//             {product.status || 'Active'}
//           </span>
//         </div>
//         {canManage && (
//           <div className="prod-actions">
//             <button className="prod-action-btn" onClick={() => onEdit(product)}>
//               <Pencil size={16} />
//             </button>
//             <button className="prod-action-btn" onClick={() => onDelete(product._id)}>
//               <Trash2 size={16} />
//             </button>
//           </div>
//         )}
//       </div>
//       <div className="product-card-divider" />
//       <div className="product-price-grid">
//         <div className="price-item"><span className="price-lbl">Item Cost</span><span className="price-val">₹{product.itemCost ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Distributor</span><span className="price-val">₹{product.distributorPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Retailer</span><span className="price-val">₹{product.retailerPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">Walk‑in</span><span className="price-val">₹{product.walkinPrice ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">MRP</span><span className="price-val">₹{product.mrp ?? 0}</span></div>
//         <div className="price-item"><span className="price-lbl">GST</span><span className="price-val">{product.gst ?? 0}%</span></div>
//       </div>
//     </div>
//   );
// };

// /* ═══ Products Page ═══════════════════════════════════════════════ */
// const ProductsPage = () => {
//   const dispatch = useDispatch();
//   const { role } = useSelector(selectAuthState);
//   const { list: products, loading } = useSelector((s) => s.products);
//   const { data: invoices } = useSelector((state) => state.invoice || { data: [] });

//   const [search, setSearch] = useState('');
//   const [catFilter, setCatFilter] = useState('');
//   const [modal, setModal] = useState(false);
//   const [editTarget, setEditTarget] = useState(null);
//   const [deleteId, setDeleteId] = useState(null);

//   useEffect(() => {
//     dispatch(fetchProducts());
//     dispatch(fetchInvoices("all"));
//   }, [dispatch]);

//   const getCurrentStock = (productId, moq) => {
//     return moq ?? 0;
//   };

//   const filtered = products.filter((p) => {
//     const s = search.toLowerCase().trim();
//     const matchSearch = !s || (p.name || '').toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s);
//     const matchCat = !catFilter || p.category === catFilter;
//     return matchSearch && matchCat;
//   });

//   const handleDelete = async (id) => {
//     await dispatch(deleteProduct(id)).unwrap();
//     toast.success('Product deleted');
//   };

//   const openAdd = () => {
//     setEditTarget(null);
//     setModal(true);
//   };
//   const openEdit = (p) => {
//     setEditTarget(p);
//     setModal(true);
//   };

//   const dynamicCatOptions = [...new Set(products.map((p) => p.category).filter(Boolean))];

//   return (
//     <div>
//       <div className="section-header">
//         <div>
//           <h2 className="section-title">Product Catalog</h2>
//           <span className="section-count">{filtered.length} products</span>
//         </div>
//         {['Admin', 'Radnus'].includes(role) && (
//           <Button variant="primary" size="sm" onClick={openAdd}>
//             <Plus size={16} /> Add Product
//           </Button>
//         )}
//       </div>

//       <div className="products-toolbar">
//         <div className="dtable-search" style={{ maxWidth: 320 }}>
//           <Search size={16} />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search by name or SKU…"
//           />
//         </div>
//         <select className="cat-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
//           <option value="">All Categories</option>
//           {dynamicCatOptions.map((cat) => (
//             <option key={cat} value={cat}>{cat}</option>
//           ))}
//         </select>
//       </div>

//       {loading ? (
//         <div className="loading-center"><Spinner size="lg" /></div>
//       ) : filtered.length === 0 ? (
//         <div className="empty-state">
//           <Package size={40} />
//           <p>No products found</p>
//           {['Admin', 'Radnus'].includes(role) && (
//             <Button variant="primary" size="sm" onClick={openAdd}>Add Product</Button>
//           )}
//         </div>
//       ) : (
//         <div className="products-grid">
//           {filtered.map((p) => (
//             <ProductCard
//               key={p._id}
//               product={p}
//               role={role}
//               currentStock={getCurrentStock(p._id, p.moq)}
//               onEdit={openEdit}
//               onDelete={(id) => setDeleteId(id)}
//             />
//           ))}
//         </div>
//       )}

//       <ProductFormModal
//         key={editTarget?._id || 'new'}
//         open={modal}
//         onClose={() => { setModal(false); setEditTarget(null); }}
//         editProduct={editTarget}
//       />

//       <ConfirmDialog
//         open={!!deleteId}
//         onClose={() => setDeleteId(null)}
//         onConfirm={() => handleDelete(deleteId)}
//         title="Delete Product"
//         message="Are you sure you want to delete this product? This action cannot be undone."
//         confirmLabel="Delete"
//       />
//     </div>
//   );
// };

// export default ProductsPage;