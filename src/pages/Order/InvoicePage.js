// import React, { useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import html2pdf from "html2pdf.js";
// import { useTheme } from "../../context/ThemeContext";
// import { Printer, FileText } from "lucide-react";
// import "./InvoicePage.css";

// // ─── Shared inline styles — hardcoded so html2canvas/print never sees theme colours ───
// const S = {
//   wrap:    { background: "#ffffff", color: "#000000", WebkitTextFillColor: "#000000" },
//   text:    { color: "#000000", WebkitTextFillColor: "#000000", background: "transparent" },
//   tdWhite: { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#ffffff",
//              color: "#000000", WebkitTextFillColor: "#000000", verticalAlign: "middle", fontSize: "0.75rem" },
//   tdGrey:  { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#f5f5f5",
//              color: "#000000", WebkitTextFillColor: "#000000", verticalAlign: "middle", fontSize: "0.75rem" },
//   tdTotal: { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#e8e8e8",
//              color: "#000000", WebkitTextFillColor: "#000000", fontWeight: "700",
//              verticalAlign: "middle", fontSize: "0.75rem", borderTop: "2px solid #000" },
//   th:      { border: "1px solid #000", padding: "0.45rem 0.4rem", background: "#111111",
//              color: "#ffffff", WebkitTextFillColor: "#ffffff", fontWeight: "800",
//              textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.6px",
//              textAlign: "left", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
//   metaTd:  { border: "1px solid #000", padding: "0.25rem 0.35rem", background: "#ffffff",
//              color: "#000000", WebkitTextFillColor: "#000000", fontSize: "0.75rem" },
// };

// const InvoicePage = () => {
//   const location  = useLocation();
//   const navigate  = useNavigate();
//   const { theme } = useTheme();
//   const isDark    = theme === "dark";

//   const {
//     invoiceNumber,
//     items         = [],
//     total         = 0,
//     paymentMode   = "",
//     date          = new Date().toISOString(),
//     buyerName     = "—",
//     buyerPhone    = "",
//     buyerAddress  = "—",
//     buyerCity     = "",
//     buyerState    = "",
//     courierCharge = 80,
//     discount      = 0,
//     salesperson   = "",
//     referenceNo   = "",
//   } = location.state || {};

//   const componentRef = useRef();
//   const [saveMessage, setSaveMessage] = useState("");

//   const discountedSubtotal = total - discount;
//   const grandTotal         = discountedSubtotal + courierCharge;
//   const totalQty           = items.reduce((s, i) => s + i.qty, 0);
//   const buyerLine1         = buyerName + (buyerPhone ? ` - ${buyerPhone}` : "");
//   const buyerLine2         = buyerAddress || "";
//   const buyerLine3         = [buyerCity, buyerState].filter(Boolean).join(" - ");

//   const amountInWords = (num) => {
//     const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
//                   "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
//                   "Seventeen","Eighteen","Nineteen"];
//     const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
//     if (num === 0)       return "Zero";
//     if (num < 20)        return ones[num];
//     if (num < 100)       return tens[Math.floor(num/10)] + (num%10 ? " "+ones[num%10] : "");
//     if (num < 1000)      return ones[Math.floor(num/100)]+" Hundred"+(num%100 ? " "+amountInWords(num%100) : "");
//     if (num < 100000)    return amountInWords(Math.floor(num/1000))+" Thousand"+(num%1000 ? " "+amountInWords(num%1000) : "");
//     return amountInWords(Math.floor(num/100000))+" Lakh"+(num%100000 ? " "+amountInWords(num%100000) : "");
//   };
//   const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

//   const formatReferenceNo = () => {
//     if (!referenceNo) return "";
//     const d = new Date(date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
//     return `${referenceNo} dt. ${d}`;
//   };

//   // ── Force-inline all element colours before html2canvas/print reads the DOM ──
//   const forceInlineColours = (root) => {
//     if (!root) return;
//     const BLACK = "#000000";
//     const WHITE = "#ffffff";
//     // Everything inside container gets black text
//     root.querySelectorAll("*").forEach((el) => {
//       const tag = el.tagName.toLowerCase();
//       el.style.setProperty("color",                  BLACK, "important");
//       el.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//       el.style.setProperty("background-color",        "transparent", "important");
//     });
//     root.style.setProperty("background-color", WHITE, "important");
//     root.style.setProperty("color",            BLACK, "important");
//     // Header cells → dark bg / white text
//     root.querySelectorAll(".items-table th").forEach((th) => {
//       th.style.setProperty("background-color",        "#111111", "important");
//       th.style.setProperty("color",                   WHITE,     "important");
//       th.style.setProperty("-webkit-text-fill-color", WHITE,     "important");
//       th.style.setProperty("-webkit-print-color-adjust", "exact", "important");
//       th.style.setProperty("print-color-adjust",      "exact",   "important");
//     });
//     // Body cells → white bg / black text
//     root.querySelectorAll(".items-table td").forEach((td) => {
//       td.style.setProperty("background-color",        WHITE, "important");
//       td.style.setProperty("color",                   BLACK, "important");
//       td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//     });
//     root.querySelectorAll(".meta-table td").forEach((td) => {
//       td.style.setProperty("background-color",        WHITE, "important");
//       td.style.setProperty("color",                   BLACK, "important");
//       td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//     });
//   };

//   const restoreInlineColours = (root) => {
//     if (!root) return;
//     root.querySelectorAll("*").forEach((el) => {
//       el.style.removeProperty("color");
//       el.style.removeProperty("-webkit-text-fill-color");
//       el.style.removeProperty("background-color");
//     });
//     root.style.removeProperty("background-color");
//     root.style.removeProperty("color");
//   };

//   const handlePrint = () => {
//     const invoiceHTML = componentRef.current.innerHTML;
//     const printWindow = window.open("", "_blank", "width=900,height=700");
//     printWindow.document.write(`<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8"/>
//   <title>Invoice - ${invoiceNumber}</title>
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     body { font-family: Arial, sans-serif; background: #fff; color: #000; }
//     @page { margin: 10mm; size: A4 portrait; }
//     .invoice-outer { background: #fff; color: #000; padding: 1rem; }
//     p { margin: 2px 0; }
//     .items-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.75rem; }
//     .items-table th {
//       border: 1px solid #000;
//       padding: 0.45rem 0.4rem;
//       background: #111111 !important;
//       color: #ffffff !important;
//       -webkit-text-fill-color: #ffffff !important;
//       font-weight: 800;
//       text-transform: uppercase;
//       font-size: 0.72rem;
//       letter-spacing: 0.6px;
//       text-align: left;
//       -webkit-print-color-adjust: exact;
//       print-color-adjust: exact;
//     }
//     .items-table td {
//       border: 1px solid #000;
//       padding: 0.35rem 0.4rem;
//       background: #ffffff;
//       color: #000000;
//       -webkit-text-fill-color: #000000;
//       vertical-align: middle;
//     }
//     .items-table tbody tr:nth-child(even) td { background: #f5f5f5; }
//     .meta-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
//     .meta-table td {
//       border: 1px solid #000;
//       padding: 0.25rem 0.35rem;
//       background: #ffffff;
//       color: #000000;
//       -webkit-text-fill-color: #000000;
//     }
//     * { color: #000000 !important; -webkit-text-fill-color: #000000 !important; background-color: transparent !important; }
//     .items-table th { background: #111111 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
//     .items-table td { background: #ffffff !important; }
//     .items-table tbody tr:nth-child(even) td { background: #f5f5f5 !important; }
//   </style>
// </head>
// <body>
//   <div class="invoice-outer">${invoiceHTML}</div>
//   <script>
//     window.onload = function() {
//       // Force all th white text one more time
//       document.querySelectorAll('th').forEach(function(th) {
//         th.style.cssText = 'background:#111111!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;border:1px solid #000;padding:0.45rem 0.4rem;font-weight:800;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.6px;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
//       });
//       document.querySelectorAll('td').forEach(function(td) {
//         td.style.color = '#000000';
//         td.style.webkitTextFillColor = '#000000';
//       });
//       window.print();
//       window.onafterprint = function() { window.close(); };
//       setTimeout(function() { window.close(); }, 3000);
//     };
//   </script>
// </body>
// </html>`);
//     printWindow.document.close();
//   };

//   const handleSavePDF = () => {
//     const root = componentRef.current;
//     forceInlineColours(root);

//     const options = {
//       margin: 8,
//       filename: `Invoice-${invoiceNumber}.pdf`,
//       image: { type: "jpeg", quality: 1.0 },
//       html2canvas: {
//         scale: 3,
//         useCORS: true,
//         logging: false,
//         backgroundColor: "#ffffff",
//         onclone: (clonedDoc) => {
//           // Apply the same forced colouring inside the clone html2canvas uses
//           const cloneRoot = clonedDoc.querySelector(".invoice-container");
//           if (cloneRoot) forceInlineColours(cloneRoot);
//         },
//       },
//       jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//     };

//     html2pdf()
//       .set(options)
//       .from(root)
//       .save()
//       .then(() => {
//         restoreInlineColours(root);
//         setSaveMessage("✓ PDF saved");
//         setTimeout(() => setSaveMessage(""), 2500);
//       })
//       .catch(() => restoreInlineColours(root));
//   };

//   if (!invoiceNumber) {
//     return <div style={{ padding: "2rem", color: "var(--text-primary)" }}>No invoice data found.</div>;
//   }

//   // Helper: td style alternating
//   const tdStyle = (rowIdx, isTotal = false) =>
//     isTotal ? S.tdTotal : rowIdx % 2 === 0 ? S.tdWhite : S.tdGrey;

//   return (
//     <div className={`invoice-page ${isDark ? "dark" : ""}`}>
//       {/* ── Toolbar ── */}
//       <div className="invoice-actions">
//         <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
//         <div className="action-btn-group">
//           <button onClick={handlePrint} className="print-btn">
//             <Printer size={16} /> Print
//           </button>
//           <button onClick={handleSavePDF} className="save-btn">
//             <FileText size={16} /> Save PDF
//           </button>
//         </div>
//       </div>
//       {saveMessage && <div className="save-message" style={S.text}>{saveMessage}</div>}

//       {/* ── Invoice Document — every element carries explicit inline colours ── */}
//       <div ref={componentRef} className="invoice-container" style={S.wrap}>
//         <div className="invoice-outer" style={S.wrap}>

//           {/* Header */}
//           <div className="invoice-header" style={{ textAlign:"center", borderBottom:"1px solid #000", paddingBottom:"0.5rem", ...S.wrap }}>
//             <h2 style={{ ...S.text, margin:0, fontSize:"1.1rem" }}>RADNUS COMMUNICATION</h2>
//             <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>No.242/44, MG Road, Sinnaya Plaza, Near Fish Market</p>
//             <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 34</p>
//             <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>E-Mail: sundar12134@gmail.com</p>
//             <p style={{ ...S.text, margin:"2px 0", fontWeight:"700", fontSize:"0.8rem" }}>GST: 34AAHFR8679B</p>
//           </div>

//           {/* Title */}
//           <div style={{ textAlign:"center", fontSize:"1rem", fontWeight:"bold", padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
//             INVOICE
//           </div>

//           {/* Two-column: consignee + meta */}
//           <div style={{ display:"flex", borderBottom:"1px solid #000" }}>
//             {/* Left */}
//             <div style={{ width:"50%", padding:"0.5rem", borderRight:"1px solid #000" }}>
//               <div style={{ ...S.text, fontWeight:"700", fontSize:"0.95rem", marginBottom:"4px" }}>Consignee (Ship to)</div>
//               <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine1}</p>
//               {buyerLine2 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine2}</p>}
//               {buyerLine3 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine3}</p>}
//               <div style={{ ...S.text, fontWeight:"700", fontSize:"0.95rem", margin:"10px 0 4px" }}>Buyer (Bill to)</div>
//               <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine1}</p>
//               {buyerLine2 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine2}</p>}
//               {buyerLine3 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine3}</p>}
//             </div>
//             {/* Right — meta table */}
//             <div style={{ width:"50%", padding:"0.5rem" }}>
//               <table className="meta-table" style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.75rem" }}>
//                 <tbody>
//                   {[
//                     ["Invoice No.",          invoiceNumber],
//                     ["Dated",                new Date(date).toDateString()],
//                     ["Delivery Note",        ""],
//                     ["Mode/Terms of Payment", paymentMode?.toUpperCase()],
//                     ["Salesperson",          salesperson],
//                     ["Reference No. & Date", formatReferenceNo()],
//                     ["Buyer's Order No.",    ""],
//                     ["Dispatched through",   ""],
//                     ["Destination",          buyerLine3],
//                     ["Terms of Delivery",    ""],
//                   ].map(([label, value]) => (
//                     <tr key={label}>
//                       <td style={{ ...S.metaTd, fontWeight:"600", whiteSpace:"nowrap" }}>{label}</td>
//                       <td style={S.metaTd}>{value}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Items table */}
//           <table className="items-table" style={{ width:"100%", borderCollapse:"collapse", margin:"0.5rem 0" }}>
//             <thead>
//               <tr>
//                 {["SL NO.","DESCRIPTION","HSN","QTY","RATE","PER","AMOUNT"].map((h) => (
//                   <th key={h} style={S.th}>{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {items.map((item, idx) => (
//                 <tr key={idx}>
//                   <td style={tdStyle(idx)}>{idx + 1}</td>
//                   <td style={tdStyle(idx)}>{item.name}</td>
//                   <td style={tdStyle(idx)}>-</td>
//                   <td style={tdStyle(idx)}>{item.qty} NOS</td>
//                   <td style={tdStyle(idx)}>₹{item.price}</td>
//                   <td style={tdStyle(idx)}>NOS</td>
//                   <td style={tdStyle(idx)}>₹{(item.qty * item.price).toFixed(2)}</td>
//                 </tr>
//               ))}
//               {discount > 0 && (
//                 <tr>
//                   <td style={tdStyle(items.length)}></td>
//                   <td style={tdStyle(items.length)}>DISCOUNT</td>
//                   <td style={tdStyle(items.length)}></td>
//                   <td style={tdStyle(items.length)}></td>
//                   <td style={tdStyle(items.length)}></td>
//                   <td style={tdStyle(items.length)}></td>
//                   <td style={tdStyle(items.length)}>-₹{discount}.00</td>
//                 </tr>
//               )}
//               <tr>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>COURIER CHARGE</td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>₹{courierCharge}.00</td>
//               </tr>
//               {/* Total row */}
//               <tr>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight:"700" }}>Total</td>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight:"700" }}>{totalQty} NOS</td>
//                 <td style={S.tdTotal}></td>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight:"700" }}>₹{grandTotal.toFixed(2)}</td>
//               </tr>
//             </tbody>
//           </table>

//           {/* Amount in words */}
//           <div style={{ padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
//             <strong style={S.text}>Amount Chargeable (in words)</strong><br />
//             <span style={S.text}>{grandTotalWords}</span>
//           </div>

//           {/* Declaration */}
//           <div style={{ padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
//             <strong style={S.text}>Declaration</strong><br />
//             <span style={{ ...S.text, fontSize:"0.78rem" }}>
//               We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
//             </span>
//           </div>

//           {/* Signature */}
//           <div style={{ display:"flex", padding:"0.5rem", borderBottom:"1px solid #000" }}>
//             <div style={{ width:"60%", ...S.text }}>E. &amp; O.E</div>
//             <div style={{ width:"40%", textAlign:"right", ...S.text }}>
//               <strong style={S.text}>for RADNUS COMMUNICATION</strong>
//               <div style={{ marginTop:"2rem", borderTop:"1px solid #000", width:"100%" }}></div>
//               <span style={S.text}>Authorised Signatory</span>
//             </div>
//           </div>

//           {/* Footer */}
//           <div style={{ textAlign:"center", padding:"0.5rem", fontSize:"0.7rem", ...S.text }}>
//             This is a Computer Generated Invoice
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InvoicePage;

//--------------------------------

import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { useTheme } from "../../context/ThemeContext";
import { Printer, FileText } from "lucide-react";
import "./InvoicePage.css";

// ─── Shared inline styles — hardcoded so html2canvas/print never sees theme colours ───
const S = {
  wrap:    { background: "#ffffff", color: "#000000", WebkitTextFillColor: "#000000" },
  text:    { color: "#000000", WebkitTextFillColor: "#000000", background: "transparent" },
  tdWhite: { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#ffffff",
             color: "#000000", WebkitTextFillColor: "#000000", verticalAlign: "middle", fontSize: "0.75rem" },
  tdGrey:  { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#f5f5f5",
             color: "#000000", WebkitTextFillColor: "#000000", verticalAlign: "middle", fontSize: "0.75rem" },
  tdTotal: { border: "1px solid #000", padding: "0.3rem 0.35rem", background: "#e8e8e8",
             color: "#000000", WebkitTextFillColor: "#000000", fontWeight: "700",
             verticalAlign: "middle", fontSize: "0.75rem", borderTop: "2px solid #000" },
  th:      { border: "1px solid #000", padding: "0.45rem 0.4rem", background: "#111111",
             color: "#ffffff", WebkitTextFillColor: "#ffffff", fontWeight: "800",
             textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: "0.6px",
             textAlign: "left", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  metaTd:  { border: "1px solid #000", padding: "0.25rem 0.35rem", background: "#ffffff",
             color: "#000000", WebkitTextFillColor: "#000000", fontSize: "0.75rem" },
};

const InvoicePage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const isDark    = theme === "dark";

  const {
    invoiceNumber,
    items         = [],
    total         = 0,
    paymentMode   = "",
    date          = new Date().toISOString(),
    buyerName     = "—",
    buyerPhone    = "",
    buyerAddress  = "—",
    buyerCity     = "",
    buyerState    = "",
    courierCharge = 80,
    discount      = 0,
    salesperson   = "",
    referenceNo   = "",
  } = location.state || {};

  const componentRef = useRef();
  const [saveMessage, setSaveMessage] = useState("");

  const discountedSubtotal = total - discount;
  const grandTotal         = discountedSubtotal + courierCharge;
  const totalQty           = items.reduce((s, i) => s + i.qty, 0);
  const buyerLine1         = buyerName + (buyerPhone ? ` - ${buyerPhone}` : "");
  const buyerLine2         = buyerAddress || "";
  const buyerLine3         = [buyerCity, buyerState].filter(Boolean).join(" - ");

  const amountInWords = (num) => {
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
                  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
                  "Seventeen","Eighteen","Nineteen"];
    const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
    if (num === 0)       return "Zero";
    if (num < 20)        return ones[num];
    if (num < 100)       return tens[Math.floor(num/10)] + (num%10 ? " "+ones[num%10] : "");
    if (num < 1000)      return ones[Math.floor(num/100)]+" Hundred"+(num%100 ? " "+amountInWords(num%100) : "");
    if (num < 100000)    return amountInWords(Math.floor(num/1000))+" Thousand"+(num%1000 ? " "+amountInWords(num%1000) : "");
    return amountInWords(Math.floor(num/100000))+" Lakh"+(num%100000 ? " "+amountInWords(num%100000) : "");
  };
  const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

  const formatReferenceNo = () => {
    if (!referenceNo) return "";
    const d = new Date(date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    return `${referenceNo} dt. ${d}`;
  };

  // ── Force-inline all element colours before html2canvas/print reads the DOM ──
  const forceInlineColours = (root) => {
    if (!root) return;
    const BLACK = "#000000";
    const WHITE = "#ffffff";
    // Everything inside container gets black text
    root.querySelectorAll("*").forEach((el) => {
      const tag = el.tagName.toLowerCase();
      el.style.setProperty("color",                  BLACK, "important");
      el.style.setProperty("-webkit-text-fill-color", BLACK, "important");
      // Don't clear background on the root wrapper itself — it needs white bg + border
      if (!el.classList.contains("invoice-outer") && !el.classList.contains("invoice-container")) {
        el.style.setProperty("background-color", "transparent", "important");
      }
    });
    root.style.setProperty("background-color", WHITE, "important");
    root.style.setProperty("color",            BLACK, "important");
    // Header cells → dark bg / white text
    root.querySelectorAll(".items-table th").forEach((th) => {
      th.style.setProperty("background-color",        "#111111", "important");
      th.style.setProperty("color",                   WHITE,     "important");
      th.style.setProperty("-webkit-text-fill-color", WHITE,     "important");
      th.style.setProperty("-webkit-print-color-adjust", "exact", "important");
      th.style.setProperty("print-color-adjust",      "exact",   "important");
    });
    // Body cells → white bg / black text
    root.querySelectorAll(".items-table td").forEach((td) => {
      td.style.setProperty("background-color",        WHITE, "important");
      td.style.setProperty("color",                   BLACK, "important");
      td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
    });
    root.querySelectorAll(".meta-table td").forEach((td) => {
      td.style.setProperty("background-color",        WHITE, "important");
      td.style.setProperty("color",                   BLACK, "important");
      td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
    });
  };

  const restoreInlineColours = (root) => {
    if (!root) return;
    root.querySelectorAll("*").forEach((el) => {
      el.style.removeProperty("color");
      el.style.removeProperty("-webkit-text-fill-color");
      el.style.removeProperty("background-color");
    });
    root.style.removeProperty("background-color");
    root.style.removeProperty("color");
  };

  const handlePrint = () => {
    const invoiceHTML = componentRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
    @page { margin: 10mm; size: A4 portrait; }
    .invoice-outer { background: #fff; color: #000; padding: 1rem; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    p { margin: 2px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.75rem; }
    .items-table th {
      border: 1px solid #000;
      padding: 0.45rem 0.4rem;
      background: #111111 !important;
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.6px;
      text-align: left;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .items-table td {
      border: 1px solid #000;
      padding: 0.35rem 0.4rem;
      background: #ffffff;
      color: #000000;
      -webkit-text-fill-color: #000000;
      vertical-align: middle;
    }
    .items-table tbody tr:nth-child(even) td { background: #f5f5f5; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .meta-table td {
      border: 1px solid #000;
      padding: 0.25rem 0.35rem;
      background: #ffffff;
      color: #000000;
      -webkit-text-fill-color: #000000;
    }
    * { color: #000000 !important; -webkit-text-fill-color: #000000 !important; background-color: transparent !important; }
    body { background-color: #ffffff !important; }
    .invoice-outer { background-color: #ffffff !important; border: 1px solid #000 !important; }
    .items-table th { background: #111111 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
    .items-table td { background: #ffffff !important; }
    .items-table tbody tr:nth-child(even) td { background: #f5f5f5 !important; }
  </style>
</head>
<body>
  ${invoiceHTML}
  <script>
    window.onload = function() {
      // Force all th white text one more time
      document.querySelectorAll('th').forEach(function(th) {
        th.style.cssText = 'background:#111111!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;border:1px solid #000;padding:0.45rem 0.4rem;font-weight:800;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.6px;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
      });
      document.querySelectorAll('td').forEach(function(td) {
        td.style.color = '#000000';
        td.style.webkitTextFillColor = '#000000';
      });
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 3000);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleSavePDF = () => {
    const root = componentRef.current;
    forceInlineColours(root);

    const options = {
      margin: 8,
      filename: `Invoice-${invoiceNumber}.pdf`,
      image: { type: "jpeg", quality: 1.0 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Apply the same forced colouring inside the clone html2canvas uses
          const cloneRoot = clonedDoc.querySelector(".invoice-container");
          if (cloneRoot) forceInlineColours(cloneRoot);
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(root)
      .save()
      .then(() => {
        restoreInlineColours(root);
        setSaveMessage("✓ PDF saved");
        setTimeout(() => setSaveMessage(""), 2500);
      })
      .catch(() => restoreInlineColours(root));
  };

  if (!invoiceNumber) {
    return <div style={{ padding: "2rem", color: "var(--text-primary)" }}>No invoice data found.</div>;
  }

  // Helper: td style alternating
  const tdStyle = (rowIdx, isTotal = false) =>
    isTotal ? S.tdTotal : rowIdx % 2 === 0 ? S.tdWhite : S.tdGrey;

  return (
    <div className={`invoice-page ${isDark ? "dark" : ""}`}>
      {/* ── Toolbar ── */}
      <div className="invoice-actions">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <div className="action-btn-group">
          <button onClick={handlePrint} className="print-btn">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleSavePDF} className="save-btn">
            <FileText size={16} /> Save PDF
          </button>
        </div>
      </div>
      {saveMessage && <div className="save-message" style={S.text}>{saveMessage}</div>}

      {/* ── Invoice Document — every element carries explicit inline colours ── */}
      <div ref={componentRef} className="invoice-container" style={S.wrap}>
        <div className="invoice-outer" style={S.wrap}>

          {/* Header */}
          <div className="invoice-header" style={{ textAlign:"center", borderBottom:"1px solid #000", paddingBottom:"0.5rem", ...S.wrap }}>
            <h2 style={{ ...S.text, margin:0, fontSize:"1.1rem" }}>RADNUS COMMUNICATION</h2>
            <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>No.242/44, MG Road, Sinnaya Plaza, Near Fish Market</p>
            <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 34</p>
            <p style={{ ...S.text, margin:"2px 0", fontSize:"0.75rem" }}>E-Mail: sundar12134@gmail.com</p>
            <p style={{ ...S.text, margin:"2px 0", fontWeight:"700", fontSize:"0.8rem" }}>GST: 34AAHFR8679B</p>
          </div>

          {/* Title */}
          <div style={{ textAlign:"center", fontSize:"1rem", fontWeight:"bold", padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
            INVOICE
          </div>

          {/* Two-column: consignee + meta */}
          <div style={{ display:"flex", borderBottom:"1px solid #000" }}>
            {/* Left */}
            <div style={{ width:"50%", padding:"0.5rem", borderRight:"1px solid #000" }}>
              <div style={{ ...S.text, fontWeight:"700", fontSize:"0.95rem", marginBottom:"4px" }}>Consignee (Ship to)</div>
              <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine1}</p>
              {buyerLine2 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine2}</p>}
              {buyerLine3 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine3}</p>}
              <div style={{ ...S.text, fontWeight:"700", fontSize:"0.95rem", margin:"10px 0 4px" }}>Buyer (Bill to)</div>
              <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine1}</p>
              {buyerLine2 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine2}</p>}
              {buyerLine3 && <p style={{ ...S.text, margin:"2px 0", fontSize:"0.78rem" }}>{buyerLine3}</p>}
            </div>
            {/* Right — meta table */}
            <div style={{ width:"50%", padding:"0.5rem" }}>
              <table className="meta-table" style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.75rem" }}>
                <tbody>
                  {[
                    ["Invoice No.",          invoiceNumber],
                    ["Dated",                new Date(date).toDateString()],
                    ["Delivery Note",        ""],
                    ["Mode/Terms of Payment", paymentMode?.toUpperCase()],
                    ["Salesperson",          salesperson],
                    ["Reference No. & Date", formatReferenceNo()],
                    ["Buyer's Order No.",    ""],
                    ["Dispatched through",   ""],
                    ["Destination",          buyerLine3],
                    ["Terms of Delivery",    ""],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ ...S.metaTd, fontWeight:"600", whiteSpace:"nowrap" }}>{label}</td>
                      <td style={S.metaTd}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items table */}
          <table className="items-table" style={{ width:"100%", borderCollapse:"collapse", margin:"0.5rem 0" }}>
            <thead>
              <tr>
                {["SL NO.","DESCRIPTION","HSN","QTY","RATE","PER","AMOUNT"].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={tdStyle(idx)}>{idx + 1}</td>
                  <td style={tdStyle(idx)}>{item.name}</td>
                  <td style={tdStyle(idx)}>-</td>
                  <td style={tdStyle(idx)}>{item.qty} NOS</td>
                  <td style={tdStyle(idx)}>₹{item.price}</td>
                  <td style={tdStyle(idx)}>NOS</td>
                  <td style={tdStyle(idx)}>₹{(item.qty * item.price).toFixed(2)}</td>
                </tr>
              ))}
              {discount > 0 && (
                <tr>
                  <td style={tdStyle(items.length)}></td>
                  <td style={tdStyle(items.length)}>DISCOUNT</td>
                  <td style={tdStyle(items.length)}></td>
                  <td style={tdStyle(items.length)}></td>
                  <td style={tdStyle(items.length)}></td>
                  <td style={tdStyle(items.length)}></td>
                  <td style={tdStyle(items.length)}>-₹{discount}.00</td>
                </tr>
              )}
              <tr>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>COURIER CHARGE</td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>₹{courierCharge}.00</td>
              </tr>
              {/* Total row */}
              <tr>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight:"700" }}>Total</td>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight:"700" }}>{totalQty} NOS</td>
                <td style={S.tdTotal}></td>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight:"700" }}>₹{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div style={{ padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
            <strong style={S.text}>Amount Chargeable (in words)</strong><br />
            <span style={S.text}>{grandTotalWords}</span>
          </div>

          {/* Declaration */}
          <div style={{ padding:"0.5rem", borderBottom:"1px solid #000", ...S.text }}>
            <strong style={S.text}>Declaration</strong><br />
            <span style={{ ...S.text, fontSize:"0.78rem" }}>
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </span>
          </div>

          {/* Signature */}
          <div style={{ display:"flex", padding:"0.5rem", borderBottom:"1px solid #000" }}>
            <div style={{ width:"60%", ...S.text }}>E. &amp; O.E</div>
            <div style={{ width:"40%", textAlign:"right", ...S.text }}>
              <strong style={S.text}>for RADNUS COMMUNICATION</strong>
              <div style={{ marginTop:"2rem", borderTop:"1px solid #000", width:"100%" }}></div>
              <span style={S.text}>Authorised Signatory</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign:"center", padding:"0.5rem", fontSize:"0.7rem", ...S.text }}>
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;