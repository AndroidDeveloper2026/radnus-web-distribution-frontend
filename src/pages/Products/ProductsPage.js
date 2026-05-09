import React, { useEffect, useState, useRef } from 'react';
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
import { fetchInvoices } from '../../services/features/invoice/invoiceSlice'; // 👈 import invoice action
import { createActivityLog } from '../../services/features/activity/activitySlice';
import { selectAuthState } from '../../store/selectors/authSelector';
import {
  Button,
  Modal,
  Input,
  Select,
  toast,
  ConfirmDialog,
  Spinner,
} from '../../components/ui/UI';
import './Products.css';

/* ─── Category options (matching mobile) ─── */
const CAT_OPTS = [
  { value: '', label: 'Select Category' },
  { value: 'PD Chargers & Car Chargers', label: 'PD Chargers & Car Chargers' },
  { value: 'Charger', label: 'Charger' },
  { value: 'Data Cables', label: 'Data Cables' },
  { value: 'Handsfree', label: 'Handsfree' },
  { value: 'Bluetooth Neckband', label: 'Bluetooth Neckband' },
  { value: 'Ear Buds', label: 'Ear Buds' },
  { value: 'Speakers', label: 'Speakers' },
  { value: 'Radnus Battery', label: 'Radnus Battery' },
];

const STATUS_OPTS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

/* ─── Validation (same logic as mobile Yup) ─── */
const validate = (fields) => {
  const errors = {};
  if (!fields.name.trim()) errors.name = 'Product name is required';
  if (!fields.category) errors.category = 'Category is required';
  if (!fields.sku.trim()) errors.sku = 'SKU is required';
  if (!fields.mrp || isNaN(fields.mrp) || Number(fields.mrp) <= 0)
    errors.mrp = 'MRP must be a positive number';
  if (!fields.distributorPrice || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) <= 0)
    errors.distributorPrice = 'Distributor price must be a positive number';
  if (!fields.retailerPrice || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) <= 0)
    errors.retailerPrice = 'Retailer price must be a positive number';
  if (!fields.itemCost || isNaN(fields.itemCost) || Number(fields.itemCost) <= 0)
    errors.itemCost = 'Item cost must be a positive number';
  if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
    errors.gst = 'GST must be 0 or higher';
  if (!fields.moq || isNaN(fields.moq) || Number(fields.moq) <= 0)
    errors.moq = 'Stock must be a positive number';
  if (!fields.walkinPrice || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) <= 0)
    errors.walkinPrice = 'Walk‑in price must be a positive number';
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
  const [image, setImage] = useState(null);     // File object or null
  const [preview, setPreview] = useState(null); // preview URL
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      const p = editProduct;
      setForm({
        name: p.name || '',
        category: p.category || '',
        sku: p.sku || '',
        batchNo: p.batchNo || '',
        rackNo: p.rackNo || '',
        vendorName: p.vendorName || '',
        itemCost: p.itemCost ?? '',
        distributorPrice: p.distributorPrice ?? '',
        retailerPrice: p.retailerPrice ?? '',
        walkinPrice: p.walkinPrice ?? '',
        mrp: p.mrp ?? '',
        gst: p.gst ?? '',
        moq: p.moq ?? '',
        status: p.status || 'Active',
      });
      // Show existing image as preview
      setPreview(typeof p.image === 'string' ? p.image : null);
      setImage(null);
    } else {
      setForm(emptyForm);
      setPreview(null);
      setImage(null);
    }
    setErrors({});
  }, [open, editProduct]);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
    // Image required only for new product
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
      if (image) {
        fd.append('image', image);
      }

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

  const input = (label, field, props = {}) => (
    <Input
      label={label}
      value={form[field]}
      onChange={handleChange(field)}
      error={errors[field]}
      {...props}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      footer={
        <div className="prod-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={saving}
            onClick={handleSubmit}
          >
            {saving
              ? 'Saving...'
              : isEdit
              ? 'Update Product'
              : 'Save Product'}
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
                <button
                  type="button"
                  className="img-remove-btn"
                  onClick={clearImage}
                >
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

        {input('Product Name *', 'name')}
        <Select
          label="Category *"
          options={CAT_OPTS}
          value={form.category}
          onChange={(e) => {
            setForm((f) => ({ ...f, category: e.target.value }));
            setErrors((e) => ({ ...e, category: undefined }));
          }}
          error={errors.category}
        />
        {input('SKU *', 'sku')}
        {input('Batch No *', 'batchNo')}
        {input('Rack No *', 'rackNo')}
        {input('Vendor Name *', 'vendorName')}
        {input('Item Cost (₹) *', 'itemCost', { type: 'number' })}
        <div className="form-row">
          {input('Distributor Price (₹) *', 'distributorPrice', {
            type: 'number',
          })}
          {input('Retailer Price (₹) *', 'retailerPrice', { type: 'number' })}
        </div>
        <div className="form-row">
          {input('Walk‑in Price (₹) *', 'walkinPrice', { type: 'number' })}
          {input('MRP (₹) *', 'mrp', { type: 'number' })}
        </div>
        <div className="form-row">
          {input('GST (%) *', 'gst', { type: 'number', step: '0.01' })}
          {input('Stock (Units) *', 'moq', { type: 'number' })}
        </div>
        <Select
          label="Status"
          options={STATUS_OPTS}
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value }))
          }
        />
      </div>
    </Modal>
  );
};

/* ─── Product Card (web, now with live stock) ─── */
const ProductCard = ({ product, onEdit, onDelete, role, currentStock }) => {
  const canManage = ['Admin', 'Radnus'].includes(role);
  const outOfStock = (currentStock ?? 0) === 0;
  const lowStock = (currentStock ?? 0) > 0 && (currentStock ?? 0) < 20;

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
            style={{
              color: outOfStock ? 'var(--red-bright)' : 'var(--green-dark)',
            }}
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
        <div className="price-item">
          <span className="price-lbl">Item Cost</span>
          <span className="price-val">₹{product.itemCost ?? 0}</span>
        </div>
        <div className="price-item">
          <span className="price-lbl">Distributor</span>
          <span className="price-val">₹{product.distributorPrice ?? 0}</span>
        </div>
        <div className="price-item">
          <span className="price-lbl">Retailer</span>
          <span className="price-val">₹{product.retailerPrice ?? 0}</span>
        </div>
        <div className="price-item">
          <span className="price-lbl">Walk‑in</span>
          <span className="price-val">₹{product.walkinPrice ?? 0}</span>
        </div>
        <div className="price-item">
          <span className="price-lbl">MRP</span>
          <span className="price-val">₹{product.mrp ?? 0}</span>
        </div>
        <div className="price-item">
          <span className="price-lbl">GST</span>
          <span className="price-val">{product.gst ?? 0}%</span>
        </div>
      </div>
    </div>
  );
};

/* ═══ Products Page ═══════════════════════════════════════════════════════════════ */
const ProductsPage = () => {
  const dispatch = useDispatch();
  const { role } = useSelector(selectAuthState);
  const { list: products, loading } = useSelector((s) => s.products);
  const { data: invoices } = useSelector((state) => state.invoice || { data: [] }); // 👈 get invoices

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch products and invoices on mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchInvoices("all")); // 👈 fetch all invoices for stock calculation
  }, [dispatch]);

  // 🧮 Calculate current stock (same as mobile)
  const getCurrentStock = (productId, moq) => {
    if (!invoices || invoices.length === 0) return moq;
    const totalSold = invoices.reduce((sum, invoice) => {
      const item = invoice.items?.find(i => i.productId === productId);
      return sum + (item?.qty || 0);
    }, 0);
    return Math.max(0, moq - totalSold);
  };

  // Search & filter
  const filtered = products.filter((p) => {
    const s = search.toLowerCase().trim();
    const matchSearch =
      !s ||
      (p.name || '').toLowerCase().includes(s) ||
      (p.sku || '').toLowerCase().includes(s);
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

  // Dynamic category list (unique values)
  const dynamicCatOptions = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

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
        <select
          className="cat-select"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {dynamicCatOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-center">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={40} />
          <p>No products found</p>
          {['Admin', 'Radnus'].includes(role) && (
            <Button variant="primary" size="sm" onClick={openAdd}>
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              role={role}
              currentStock={getCurrentStock(p._id, p.moq)} // 👈 pass live stock
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <ProductFormModal
        open={modal}
        onClose={() => {
          setModal(false);
          setEditTarget(null);
        }}
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