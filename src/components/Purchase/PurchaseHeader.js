// import React from 'react';
// import { Plus } from 'lucide-react';
// import { Card, SectionHeader, Input, Select, Textarea, Button } from '../ui/UI';

// const PAYMENT_TYPES = ['Credit', 'Cash', 'UPI', 'Bank Transfer', 'Cheque'];

// /**
//  * "Purchase Information" section — Supplier, Invoice Number, Invoice Date,
//  * Payment Type, Remarks. Mirrors the layout from the reference image while
//  * reusing the shared Card / Input / Select / Textarea primitives.
//  */
// const PurchaseHeader = ({ values, onChange, suppliers = [], onAddSupplier }) => {
//   const supplierOptions = [
//     { value: '', label: 'Select supplier' },
//     ...suppliers.map((s) => ({ value: s._id, label: s.name })),
//   ];
//   const paymentOptions = PAYMENT_TYPES.map((p) => ({ value: p, label: p }));

//   const set = (k, v) => onChange({ ...values, [k]: v });

//   // Preview only — the real invoice number is generated server-side on save
//   // (format: RC{financial year}/PUC/{sequence}, e.g. RC2026-2027/PUC/001).
//   // The sequence resets each financial year and isn't knowable from here,
//   // so this just shows the financial year of the chosen invoice date (or
//   // today's, if not picked yet) with an illustrative "001".
//   const invoiceNumberPreview = (() => {
//     const d = values.invoiceDate ? new Date(values.invoiceDate) : new Date();
//     const y = d.getFullYear();
//     const fyStart = d.getMonth() >= 3 ? y : y - 1;
//     return `RC${fyStart}-${fyStart + 1}/PUC/001`;
//   })();

//   return (
//     <Card className="card-pad">
//       <SectionHeader
//         title="Purchase Information"
//         action={
//           onAddSupplier && (
//             <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={onAddSupplier}>
//               New Supplier
//             </Button>
//           )
//         }
//       />
//       <div className="form-row-3">
//         <Select
//           label="Supplier *"
//           options={supplierOptions}
//           value={values.supplier || ''}
//           onChange={(e) => set('supplier', e.target.value)}
//           error={values.errors?.supplier}
//         />
//         <Input
//           label="Invoice Number"
//           value={`${invoiceNumberPreview} (preview)`}
//           readOnly
//           disabled
//           hint="Auto-generated on save"
//         />
//         <Input
//           label="Invoice Date *"
//           type="date"
//           value={values.invoiceDate || ''}
//           onChange={(e) => set('invoiceDate', e.target.value)}
//           error={values.errors?.invoiceDate}
//         />
//       </div>
//       <div className="form-row" style={{ marginTop: 14 }}>
//         <Select
//           label="Payment Type"
//           options={paymentOptions}
//           value={values.paymentType || 'Credit'}
//           onChange={(e) => set('paymentType', e.target.value)}
//         />
//         <Textarea
//           label="Remarks"
//           placeholder="Enter remarks (optional)"
//           rows={1}
//           value={values.remarks || ''}
//           onChange={(e) => set('remarks', e.target.value)}
//         />
//       </div>
//     </Card>
//   );
// };

// export default PurchaseHeader;

