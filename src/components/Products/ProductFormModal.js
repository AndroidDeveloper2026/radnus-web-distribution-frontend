// components/Products/ProductFormModal.js

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ImagePlus } from 'lucide-react';
import { Modal, Button, Input, toast } from '../ui/UI';
import { addProduct, updateProduct } from '../../services/features/products/productSlice';
import { createActivityLog } from '../../services/features/activity/activitySlice';
import { selectAuthState } from '../../store/selectors/authSelector';

const CAT_OPTS = [
  { value: '', label: 'Select Category' },
  { value: 'CAR CHARGERS', label: 'CAR CHARGERS' },
  { value: 'CHARGER', label: 'CHARGER' },
  { value: 'ADAPTER', label: 'ADAPTER' },
  { value: 'DATA CABLES', label: 'DATA CABLES' },
  { value: 'HANDSFREE', label: 'HANDSFREE' },
  { value: 'BLUETOOTH NECKBAND', label: 'BLUETOOTH NECKBAND' },
  { value: 'EAR BUDS', label: 'EAR BUDS' },
  { value: 'SPEAKERS', label: 'SPEAKERS' },
  { value: 'CONNECTOR', label: 'CONNECTOR' },
  { value: 'TOOLS', label: 'TOOLS' },
  { value: 'MACHINARY', label: 'MACHINARY' },
  { value: 'BATTERY', label: 'BATTERY' },
  { value: 'POWER BANK', label: 'POWER BANK' },
  { value: 'SOFTWARE TOOL', label: 'SOFTWARE TOOL' },
];

const STATUS_OPTS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const validate = (fields) => {
  const errors = {};
  if (!fields.name.trim()) errors.name = 'Product name is required';
  if (!fields.category) errors.category = 'Category is required';
  if (!fields.sku.trim()) errors.sku = 'SKU is required';
  
  if (fields.mrp === '' || fields.mrp === null || fields.mrp === undefined || isNaN(fields.mrp) || Number(fields.mrp) < 0)
    errors.mrp = 'MRP must be 0 or higher';
  
  if (fields.distributorPrice === '' || fields.distributorPrice === null || fields.distributorPrice === undefined || isNaN(fields.distributorPrice) || Number(fields.distributorPrice) < 0)
    errors.distributorPrice = 'Distributor price must be 0 or higher';
  
  if (fields.retailerPrice === '' || fields.retailerPrice === null || fields.retailerPrice === undefined || isNaN(fields.retailerPrice) || Number(fields.retailerPrice) < 0)
    errors.retailerPrice = 'Retailer price must be 0 or higher';
  
  if (fields.itemCost === '' || fields.itemCost === null || fields.itemCost === undefined || isNaN(fields.itemCost) || Number(fields.itemCost) < 0)
    errors.itemCost = 'Item cost must be 0 or higher';
  
  if (!fields.gst || isNaN(fields.gst) || Number(fields.gst) < 0)
    errors.gst = 'GST must be 0 or higher';
  
  if (fields.moq === '' || fields.moq === null || fields.moq === undefined || isNaN(fields.moq) || Number(fields.moq) < 0)
    errors.moq = 'Stock must be a non-negative number';
  
  if (fields.walkinPrice === '' || fields.walkinPrice === null || fields.walkinPrice === undefined || isNaN(fields.walkinPrice) || Number(fields.walkinPrice) < 0)
    errors.walkinPrice = 'Walk‑in price must be 0 or higher';
  
  if (!fields.batchNo.trim()) errors.batchNo = 'Batch number is required';
  if (!fields.rackNo.trim()) errors.rackNo = 'Rack number is required';
  if (!fields.vendorName.trim()) errors.vendorName = 'Vendor name is required';
  return errors;
};

const ProductFormModal = ({ 
  open, 
  onClose, 
  editProduct, 
  onProductCreated,  // NEW: Callback for when product is created
  isFromPurchase = false  // NEW: Flag to indicate source
}) => {
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

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    if (numberFields.includes(field)) {
      value = value.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleKeyDown = (field) => (e) => {
    const numberFields = ['itemCost', 'distributorPrice', 'retailerPrice', 'walkinPrice', 'mrp', 'gst', 'moq'];
    if (numberFields.includes(field)) {
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
        
        // ─── NEW: Call the callback with the created product ───
        if (onProductCreated) {
          onProductCreated(result);
        }
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="field">
          <label className="field-label">
            Product Image {!isEdit && '(Optional)'}
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

export default ProductFormModal;