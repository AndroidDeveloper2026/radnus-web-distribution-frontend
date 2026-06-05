// // src/pages/Invoice/InvoicePage.js
// import React, { useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import html2pdf from "html2pdf.js";
// import { useTheme } from "../../context/ThemeContext";
// import { Printer, FileText } from "lucide-react";
// import "./InvoicePage.css";

// const S = {
//   wrap: {
//     background: "#ffffff",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//   },
//   text: {
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     background: "transparent",
//   },
//   tdWhite: {
//     border: "1px solid #000",
//     padding: "0.3rem 0.35rem",
//     background: "#ffffff",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     verticalAlign: "middle",
//     fontSize: "0.75rem",
//   },
//   tdGrey: {
//     border: "1px solid #000",
//     padding: "0.3rem 0.35rem",
//     background: "#f5f5f5",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     verticalAlign: "middle",
//     fontSize: "0.75rem",
//   },
//   tdTotal: {
//     border: "1px solid #000",
//     padding: "0.3rem 0.35rem",
//     background: "#e8e8e8",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     fontWeight: "700",
//     verticalAlign: "middle",
//     fontSize: "0.75rem",
//     borderTop: "2px solid #000",
//   },
//   th: {
//     border: "1px solid #000",
//     padding: "0.45rem 0.4rem",
//     background: "#f0f0f0",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     fontWeight: "800",
//     textTransform: "uppercase",
//     fontSize: "0.72rem",
//     letterSpacing: "0.6px",
//     textAlign: "left",
//     WebkitPrintColorAdjust: "exact",
//     printColorAdjust: "exact",
//   },
//   metaTd: {
//     border: "1px solid #000",
//     padding: "0.25rem 0.35rem",
//     background: "#ffffff",
//     color: "#000000",
//     WebkitTextFillColor: "#000000",
//     fontSize: "0.75rem",
//   },
// };

// // Helper: numerical amount to words (INR)
// const amountInWords = (num) => {
//   const ones = [
//     "",
//     "One",
//     "Two",
//     "Three",
//     "Four",
//     "Five",
//     "Six",
//     "Seven",
//     "Eight",
//     "Nine",
//     "Ten",
//     "Eleven",
//     "Twelve",
//     "Thirteen",
//     "Fourteen",
//     "Fifteen",
//     "Sixteen",
//     "Seventeen",
//     "Eighteen",
//     "Nineteen",
//   ];
//   const tens = [
//     "",
//     "",
//     "Twenty",
//     "Thirty",
//     "Forty",
//     "Fifty",
//     "Sixty",
//     "Seventy",
//     "Eighty",
//     "Ninety",
//   ];
//   if (num === 0) return "Zero";
//   if (num < 20) return ones[num];
//   if (num < 100)
//     return (
//       tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
//     );
//   if (num < 1000)
//     return (
//       ones[Math.floor(num / 100)] +
//       " Hundred" +
//       (num % 100 ? " " + amountInWords(num % 100) : "")
//     );
//   if (num < 100000)
//     return (
//       amountInWords(Math.floor(num / 1000)) +
//       " Thousand" +
//       (num % 1000 ? " " + amountInWords(num % 1000) : "")
//     );
//   return (
//     amountInWords(Math.floor(num / 100000)) +
//     " Lakh" +
//     (num % 100000 ? " " + amountInWords(num % 100000) : "")
//   );
// };

// // Helper function to parse buyer name and extract customer name & shop name
// const parseBuyerName = (buyerName) => {
//   if (!buyerName || buyerName === "—") {
//     return { customerName: buyerName, shopName: null };
//   }
  
//   // Check if it contains parentheses (format: "CustomerName (ShopName)")
//   const hasParentheses = buyerName.includes('(') && buyerName.includes(')');
  
//   if (hasParentheses) {
//     // Extract customer name and shop name from "CustomerName (ShopName)"
//     const customerMatch = buyerName.match(/^([^(]+?)\s*\(/);
//     const shopMatch = buyerName.match(/\(([^)]+)\)/);
//     const customerName = customerMatch ? customerMatch[1].trim() : buyerName;
//     const shopName = shopMatch ? shopMatch[1].trim() : '';
//     return { customerName, shopName };
//   } else {
//     // It's just a regular customer name
//     return { customerName: buyerName, shopName: null };
//   }
// };

// const DisplayBuyerInfo = ({ name, phone, address, city, state }) => {
//   const { customerName, shopName } = parseBuyerName(name);
  
//   return (
//     <div style={{ ...S.text, margin: 0, padding: 0 }}>
//       {/* Display Customer Name first */}
//       {customerName && customerName !== "—" && (
//         <div style={{ margin: "2px 0", fontSize: "0.78rem", fontWeight: "600", lineHeight: "1.4" }}>
//           {customerName}
//         </div>
//       )}
      
//       {/* Display Shop Name underneath (without parentheses) */}
//       {shopName && (
//         <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
//           {shopName}
//         </div>
//       )}
      
//       {/* Display Phone */}
//       {phone && (
//         <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
//           {phone}
//         </div>
//       )}
      
//       {/* Display Address */}
//       {address && address !== "—" && (
//         <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
//           {address}
//         </div>
//       )}
      
//       {/* Display City & State */}
//       {city && state && (
//         <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
//           {[city, state].filter(Boolean).join(" - ")}
//         </div>
//       )}
//     </div>
//   );
// };

// const InvoicePage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { theme } = useTheme();
//   const isDark = theme === "dark";

//   const {
//     invoiceNumber,
//     items = [],
//     total = 0,
//     paymentMode = "",
//     date = new Date().toISOString(),
//     buyerName = "—",
//     buyerPhone = "",
//     buyerAddress = "—",
//     buyerCity = "",
//     buyerState = "",
//     courierCharge = 80,
//     discount = 0,
//     salesperson = "",
//     referenceNo = "",
//   } = location.state || {};

//   const componentRef = useRef();
//   const [saveMessage, setSaveMessage] = useState("");

//   const discountedSubtotal = total - discount;
//   const grandTotal = discountedSubtotal + courierCharge;
//   const totalQty = items.reduce((s, i) => s + i.qty, 0);

//   // Format buyer line for meta table (simple format)
//   const buyerLine1 = buyerName + (buyerPhone ? ` - ${buyerPhone}` : "");
//   const buyerLine2 = buyerAddress || "";
//   const buyerLine3 = [buyerCity, buyerState].filter(Boolean).join(" - ");

//   const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

//   const formatReferenceNo = () => {
//     if (!referenceNo) return "";
//     const d = new Date(date).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//     return `${referenceNo} dt. ${d}`;
//   };

//   const forceInlineColours = (root) => {
//     if (!root) return;
//     const BLACK = "#000000";
//     const WHITE = "#ffffff";

//     root.style.all = "initial";
//     root.style.display = "block";
//     root.style.background = WHITE;
//     root.style.color = BLACK;
//     root.style.fontFamily = "Arial, sans-serif";
//     root.style.WebkitTextFillColor = BLACK;

//     root.querySelectorAll("*").forEach((el) => {
//       el.style.setProperty("color", BLACK, "important");
//       el.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//       if (
//         !el.classList.contains("invoice-outer") &&
//         !el.classList.contains("invoice-container")
//       ) {
//         el.style.setProperty("background-color", "transparent", "important");
//       }
//     });

//     root.style.setProperty("background-color", WHITE, "important");
//     root.style.setProperty("color", BLACK, "important");

//     root.querySelectorAll(".items-table th").forEach((th) => {
//       th.style.setProperty("background-color", "#f0f0f0", "important");
//       th.style.setProperty("color", BLACK, "important");
//       th.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//       th.style.setProperty("-webkit-print-color-adjust", "exact", "important");
//       th.style.setProperty("print-color-adjust", "exact", "important");
//     });

//     root.querySelectorAll(".items-table td").forEach((td) => {
//       td.style.setProperty("background-color", WHITE, "important");
//       td.style.setProperty("color", BLACK, "important");
//       td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
//     });
//     root.querySelectorAll(".meta-table td").forEach((td) => {
//       td.style.setProperty("background-color", WHITE, "important");
//       td.style.setProperty("color", BLACK, "important");
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
//     root.style.all = "";
//   };

//   const handlePrint = () => {
//     const invoiceHTML = componentRef.current.innerHTML;
//     const printWindow = window.open("", "_blank", "width=900,height=700");
//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8"/>
//         <base href="about:blank">
//         <title>Invoice - ${invoiceNumber}</title>
//         <style>
//           * { margin: 0; padding: 0; box-sizing: border-box; }
//           body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
//           @page { margin: 10mm; size: A4 portrait; }

//           .invoice-outer {
//             background: #fff;
//             color: #000;
//             padding: 1rem;
//             border: 1px solid #000 !important;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }

//           p { margin: 2px 0; }

//           .items-table {
//             width: 100%;
//             border-collapse: collapse;
//             margin: 0.5rem 0;
//             font-size: 0.75rem;
//           }
//           .items-table th {
//             border: 1px solid #000;
//             padding: 0.45rem 0.4rem;
//             background: #f0f0f0 !important;
//             color: #000000 !important;
//             -webkit-text-fill-color: #000000 !important;
//             font-weight: 800;
//             text-transform: uppercase;
//             font-size: 0.72rem;
//             letter-spacing: 0.6px;
//             text-align: left;
//             -webkit-print-color-adjust: exact;
//             print-color-adjust: exact;
//           }
//           .items-table td {
//             border: 1px solid #000;
//             padding: 0.35rem 0.4rem;
//             background: #ffffff;
//             color: #000000;
//             -webkit-text-fill-color: #000000;
//             vertical-align: middle;
//           }
//           .items-table tbody tr:nth-child(even) td {
//             background: #f5f5f5 !important;
//           }
//           .meta-table {
//             width: 100%;
//             border-collapse: collapse;
//             font-size: 0.75rem;
//           }
//           .meta-table td {
//             border: 1px solid #000;
//             padding: 0.25rem 0.35rem;
//             background: #ffffff;
//             color: #000000;
//             -webkit-text-fill-color: #000000;
//           }

//           * {
//             color: #000000 !important;
//             -webkit-text-fill-color: #000000 !important;
//             background-color: transparent !important;
//           }
//           body {
//             background-color: #ffffff !important;
//           }
//           .invoice-outer {
//             background-color: #ffffff !important;
//             border: 1px solid #000 !important;
//           }
//           .items-table th {
//             background: #f0f0f0 !important;
//             color: #000000 !important;
//             -webkit-text-fill-color: #000000 !important;
//           }
//           .items-table td {
//             background: #ffffff !important;
//           }
//           .items-table tbody tr:nth-child(even) td {
//             background: #f5f5f5 !important;
//           }

//           .items-table tr {
//             page-break-inside: avoid;
//           }
//           .items-table thead {
//             display: table-header-group;
//           }
//         </style>
//       </head>
//       <body>
//         ${invoiceHTML}
//         <script>
//           window.onload = function() {
//             document.querySelectorAll('th').forEach(function(th) {
//               th.style.cssText = 'background:#f0f0f0!important;color:#000000!important;-webkit-text-fill-color:#000000!important;border:1px solid #000;padding:0.45rem 0.4rem;font-weight:800;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.6px;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
//             });
//             document.querySelectorAll('td').forEach(function(td) {
//               td.style.color = '#000000';
//               td.style.webkitTextFillColor = '#000000';
//             });
//             window.print();
//             window.onafterprint = function() { window.close(); };
//             setTimeout(function() { window.close(); }, 3000);
//           };
//         </script>
//       </body>
//       </html>
//     `);
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
//         allowTaint: false,
//         logging: false,
//         backgroundColor: "#ffffff",
//         onclone: (clonedDoc) => {
//           const cloneRoot = clonedDoc.querySelector(".invoice-container");
//           if (cloneRoot) {
//             cloneRoot.style.all = "initial";
//             cloneRoot.style.display = "block";
//             cloneRoot.style.background = "#ffffff";
//             cloneRoot.style.color = "#000000";
//             cloneRoot.style.fontFamily = "Arial, sans-serif";
//             forceInlineColours(cloneRoot);
//           }
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
//     return (
//       <div style={{ padding: "2rem", color: "var(--text-primary)" }}>
//         No invoice data found.
//       </div>
//     );
//   }

//   const tdStyle = (rowIdx, isTotal = false) =>
//     isTotal ? S.tdTotal : rowIdx % 2 === 0 ? S.tdWhite : S.tdGrey;

//   return (
//     <div className={`invoice-page ${isDark ? "dark" : ""}`}>
//       <div className="invoice-actions">
//         <button onClick={() => navigate(-1)} className="back-btn">
//           ← Back
//         </button>
//         <div className="action-btn-group">
//           <button onClick={handlePrint} className="print-btn">
//             <Printer size={16} /> Print
//           </button>
//           <button onClick={handleSavePDF} className="save-btn">
//             <FileText size={16} /> Save PDF
//           </button>
//         </div>
//       </div>

//       {saveMessage && (
//         <div className="save-message" style={S.text}>
//           {saveMessage}
//         </div>
//       )}

//       <div ref={componentRef} className="invoice-container" style={S.wrap}>
//         <div className="invoice-outer" style={S.wrap}>
//           {/* Header */}
//           <div
//             className="invoice-header"
//             style={{
//               textAlign: "center",
//               borderBottom: "1px solid #000",
//               paddingBottom: "0.5rem",
//               ...S.wrap,
//             }}
//           >
//             <h2 style={{ ...S.text, margin: 0, fontSize: "1.1rem" }}>
//               RADNUS COMMUNICATION
//             </h2>
//             <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
//               No.242/44, MG Road, Sinnaya Plaza, Near Fish Market
//             </p>
//             <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
//               Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 605001
//             </p>
//             <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
//               E-Mail: sundar12134@gmail.com
//             </p>
//           </div>

//           {/* Title */}
//           <div
//             style={{
//               textAlign: "center",
//               fontSize: "1rem",
//               fontWeight: "bold",
//               padding: "0.5rem",
//               borderBottom: "1px solid #000",
//               ...S.text,
//             }}
//           >
//             INVOICE
//           </div>

//           {/* Two-column: consignee + meta */}
//           <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
//             {/* Left - Consignee and Buyer sections */}
//             <div
//               style={{
//                 width: "50%",
//                 padding: "0.5rem",
//                 borderRight: "1px solid #000",
//               }}
//             >
//               <div
//                 style={{
//                   ...S.text,
//                   fontWeight: "700",
//                   fontSize: "0.95rem",
//                   marginBottom: "4px",
//                 }}
//               >
//                 Consignee (Ship to)
//               </div>
//               <DisplayBuyerInfo 
//                 name={buyerName}
//                 phone={buyerPhone}
//                 address={buyerAddress}
//                 city={buyerCity}
//                 state={buyerState}
//               />

//               <div
//                 style={{
//                   ...S.text,
//                   fontWeight: "700",
//                   fontSize: "0.95rem",
//                   margin: "10px 0 4px",
//                 }}
//               >
//                 Buyer (Bill to)
//               </div>
//               <DisplayBuyerInfo 
//                 name={buyerName}
//                 phone={buyerPhone}
//                 address={buyerAddress}
//                 city={buyerCity}
//                 state={buyerState}
//               />
//             </div>

//             {/* Right — meta table */}
//             <div style={{ width: "50%", padding: "0.5rem" }}>
//               <table
//                 className="meta-table"
//                 style={{
//                   width: "100%",
//                   borderCollapse: "collapse",
//                   fontSize: "0.75rem",
//                 }}
//               >
//                 <tbody>
//                   {[
//                     ["Invoice No.", invoiceNumber],
//                     ["Dated", new Date(date).toDateString()],
//                     ["Delivery Note", ""],
//                     ["Mode/Terms of Payment", paymentMode?.toUpperCase()],
//                     ["Salesperson", salesperson],
//                     ["Reference No. & Date", formatReferenceNo()],
//                     ["Buyer's Order No.", ""],
//                     ["Dispatched through", ""],
//                     ["Destination", buyerLine3],
//                     ["Terms of Delivery", ""],
//                   ].map(([label, value]) => (
//                     <tr key={label}>
//                       <td
//                         style={{
//                           ...S.metaTd,
//                           fontWeight: "600",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         {label}
//                       </td>
//                       <td style={S.metaTd}>{value}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Items table - preserving original order */}
//           <table
//             className="items-table"
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               margin: "0.5rem 0",
//             }}
//           >
//             <thead>
//               <tr>
//                 {["SL NO.", "DESCRIPTION", "HSN", "QTY", "RATE", "PER", "AMOUNT"].map(
//                   (h) => (
//                     <th key={h} style={S.th}>
//                       {h}
//                     </th>
//                   )
//                 )}
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
//                   <td style={tdStyle(idx)}>
//                     ₹{(item.qty * item.price).toFixed(2)}
//                   </td>
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
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>
//                   COURIER CHARGE
//                 </td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
//                 <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>
//                   ₹{courierCharge}.00
//                 </td>
//               </tr>
//               {/* Total row */}
//               <tr>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight: "700" }}>Total</td>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight: "700" }}>
//                   {totalQty} NOS
//                 </td>
//                 <td style={S.tdTotal}></td>
//                 <td style={S.tdTotal}></td>
//                 <td style={{ ...S.tdTotal, fontWeight: "700" }}>
//                   ₹{grandTotal.toFixed(2)}
//                 </td>
//               </tr>
//             </tbody>
//           </table>

//           {/* Amount in words */}
//           <div
//             style={{
//               padding: "0.5rem",
//               borderBottom: "1px solid #000",
//               ...S.text,
//             }}
//           >
//             <strong style={S.text}>Amount Chargeable (in words)</strong>
//             <br />
//             <span style={S.text}>{grandTotalWords}</span>
//           </div>

//           {/* Declaration */}
//           <div
//             style={{
//               padding: "0.5rem",
//               borderBottom: "1px solid #000",
//               ...S.text,
//             }}
//           >
//             <strong style={S.text}>Declaration</strong>
//             <br />
//             <span style={{ ...S.text, fontSize: "0.78rem" }}>
//               We declare that this invoice shows the actual price of the goods
//               described and that all particulars are true and correct.
//             </span>
//           </div>

//           {/* Signature */}
//           <div
//             style={{
//               display: "flex",
//               padding: "0.5rem",
//               borderBottom: "1px solid #000",
//             }}
//           >
//             <div style={{ width: "60%", ...S.text }}>E. &amp; O.E</div>
//             <div style={{ width: "40%", textAlign: "right", ...S.text }}>
//               <strong style={S.text}>for RADNUS COMMUNICATION</strong>
//               <div
//                 style={{
//                   marginTop: "2rem",
//                   borderTop: "1px solid #000",
//                   width: "100%",
//                 }}
//               ></div>
//               <span style={S.text}>Authorised Signatory</span>
//             </div>
//           </div>

//           {/* Footer */}
//           <div
//             style={{
//               textAlign: "center",
//               padding: "0.5rem",
//               fontSize: "0.7rem",
//               ...S.text,
//             }}
//           >
//             This is a Computer Generated Invoice
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InvoicePage;

//-----------------------------------

// src/pages/Invoice/InvoicePage.js
import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { useTheme } from "../../context/ThemeContext";
import { Printer, FileText } from "lucide-react";
import "./InvoicePage.css";

const S = {
  wrap: {
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
  },
  text: {
    color: "#000000",
    WebkitTextFillColor: "#000000",
    background: "transparent",
  },
  tdWhite: {
    border: "1px solid #000",
    padding: "0.3rem 0.35rem",
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
    verticalAlign: "middle",
    fontSize: "0.75rem",
  },
  tdGrey: {
    border: "1px solid #000",
    padding: "0.3rem 0.35rem",
    background: "#f5f5f5",
    color: "#000000",
    WebkitTextFillColor: "#000000",
    verticalAlign: "middle",
    fontSize: "0.75rem",
  },
  tdTotal: {
    border: "1px solid #000",
    padding: "0.3rem 0.35rem",
    background: "#e8e8e8",
    color: "#000000",
    WebkitTextFillColor: "#000000",
    fontWeight: "700",
    verticalAlign: "middle",
    fontSize: "0.75rem",
    borderTop: "2px solid #000",
  },
  th: {
    border: "1px solid #000",
    padding: "0.45rem 0.4rem",
    background: "#f0f0f0",
    color: "#000000",
    WebkitTextFillColor: "#000000",
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: "0.72rem",
    letterSpacing: "0.6px",
    textAlign: "left",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  },
  metaTd: {
    border: "1px solid #000",
    padding: "0.25rem 0.35rem",
    background: "#ffffff",
    color: "#000000",
    WebkitTextFillColor: "#000000",
    fontSize: "0.75rem",
  },
};

// Helper: numerical amount to words (INR)
const amountInWords = (num) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if (num === 0) return "Zero";
  if (num < 20) return ones[num];
  if (num < 100)
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000)
    return (
      ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 ? " " + amountInWords(num % 100) : "")
    );
  if (num < 100000)
    return (
      amountInWords(Math.floor(num / 1000)) +
      " Thousand" +
      (num % 1000 ? " " + amountInWords(num % 1000) : "")
    );
  return (
    amountInWords(Math.floor(num / 100000)) +
    " Lakh" +
    (num % 100000 ? " " + amountInWords(num % 100000) : "")
  );
};

// Updated DisplayBuyerInfo component - Customer name first, then shop name on next line
const DisplayBuyerInfo = ({ name, phone, address, city, state, customerType, shopName }) => {
  // Parse the buyer name if it's in "CustomerName (ShopName)" format
  let customerDisplayName = name;
  let shopDisplayName = null;
  
  // Check if the name contains parentheses (format: "CustomerName (ShopName)")
  if (name && name.includes('(') && name.includes(')')) {
    const customerMatch = name.match(/^([^(]+?)\s*\(/);
    const shopMatch = name.match(/\(([^)]+)\)/);
    customerDisplayName = customerMatch ? customerMatch[1].trim() : name;
    shopDisplayName = shopMatch ? shopMatch[1].trim() : null;
  } else if (customerType === 'shop' && shopName) {
    // If we have separate customerType and shopName
    customerDisplayName = name;
    shopDisplayName = shopName;
  }
  
  return (
    <div style={{ ...S.text, margin: 0, padding: 0 }}>
      {/* Display Customer Name first - Line 1 */}
      {customerDisplayName && customerDisplayName !== "—" && (
        <div style={{ margin: "2px 0", fontSize: "0.78rem", fontWeight: "600", lineHeight: "1.4" }}>
          {customerDisplayName}
        </div>
      )}
      
      {/* Display Shop Name on second line - NO parentheses */}
      {shopDisplayName && (
        <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
          {shopDisplayName}
        </div>
      )}
      
      {/* Display Phone - Line 3 */}
      {phone && phone !== "—" && (
        <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
          {phone}
        </div>
      )}
      
      {/* Display Address - Line 4 */}
      {address && address !== "—" && (
        <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
          {address}
        </div>
      )}
      
      {/* Display City & State - Line 5 */}
      {(city && city !== "—" || state && state !== "—") && (
        <div style={{ margin: "2px 0", fontSize: "0.78rem", lineHeight: "1.4" }}>
          {[city, state].filter(Boolean).join(" - ")}
        </div>
      )}
    </div>
  );
};

const InvoicePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    invoiceNumber,
    items = [],
    total = 0,
    paymentMode = "",
    date = new Date().toISOString(),
    buyerName = "—",
    buyerPhone = "",
    buyerAddress = "—",
    buyerCity = "",
    buyerState = "",
    courierCharge = 80,
    discount = 0,
    salesperson = "",
    referenceNo = "",
    customerType = "",
    shopName = "",
  } = location.state || {};

  const componentRef = useRef();
  const [saveMessage, setSaveMessage] = useState("");

  const discountedSubtotal = total - discount;
  const grandTotal = discountedSubtotal + courierCharge;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const buyerLine3 = [buyerCity, buyerState].filter(Boolean).join(" - ");
  const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

  const formatReferenceNo = () => {
    if (!referenceNo) return "";
    const d = new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${referenceNo} dt. ${d}`;
  };

  const forceInlineColours = (root) => {
    if (!root) return;
    const BLACK = "#000000";
    const WHITE = "#ffffff";

    root.style.all = "initial";
    root.style.display = "block";
    root.style.background = WHITE;
    root.style.color = BLACK;
    root.style.fontFamily = "Arial, sans-serif";
    root.style.WebkitTextFillColor = BLACK;

    root.querySelectorAll("*").forEach((el) => {
      el.style.setProperty("color", BLACK, "important");
      el.style.setProperty("-webkit-text-fill-color", BLACK, "important");
      if (
        !el.classList.contains("invoice-outer") &&
        !el.classList.contains("invoice-container")
      ) {
        el.style.setProperty("background-color", "transparent", "important");
      }
    });

    root.style.setProperty("background-color", WHITE, "important");
    root.style.setProperty("color", BLACK, "important");

    root.querySelectorAll(".items-table th").forEach((th) => {
      th.style.setProperty("background-color", "#f0f0f0", "important");
      th.style.setProperty("color", BLACK, "important");
      th.style.setProperty("-webkit-text-fill-color", BLACK, "important");
      th.style.setProperty("-webkit-print-color-adjust", "exact", "important");
      th.style.setProperty("print-color-adjust", "exact", "important");
    });

    root.querySelectorAll(".items-table td").forEach((td) => {
      td.style.setProperty("background-color", WHITE, "important");
      td.style.setProperty("color", BLACK, "important");
      td.style.setProperty("-webkit-text-fill-color", BLACK, "important");
    });
    root.querySelectorAll(".meta-table td").forEach((td) => {
      td.style.setProperty("background-color", WHITE, "important");
      td.style.setProperty("color", BLACK, "important");
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
    root.style.all = "";
  };

  const handlePrint = () => {
    const invoiceHTML = componentRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <base href="about:blank">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 0; margin: 0; }
          @page { margin: 10mm; size: A4 portrait; }

          .invoice-outer {
            background: #fff;
            color: #000;
            padding: 1rem;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          p { margin: 2px 0; }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.5rem 0;
            font-size: 0.75rem;
          }
          .items-table th {
            border: 1px solid #000;
            padding: 0.45rem 0.4rem;
            background: #f0f0f0 !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
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
          .items-table tbody tr:nth-child(even) td {
            background: #f5f5f5 !important;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.75rem;
          }
          .meta-table td {
            border: 1px solid #000;
            padding: 0.25rem 0.35rem;
            background: #ffffff;
            color: #000000;
            -webkit-text-fill-color: #000000;
          }

          * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
            background-color: transparent !important;
          }
          body {
            background-color: #ffffff !important;
          }
          .invoice-outer {
            background-color: #ffffff !important;
            border: 1px solid #000 !important;
          }
          .items-table th {
            background: #f0f0f0 !important;
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          .items-table td {
            background: #ffffff !important;
          }
          .items-table tbody tr:nth-child(even) td {
            background: #f5f5f5 !important;
          }

          .items-table tr {
            page-break-inside: avoid;
          }
          .items-table thead {
            display: table-header-group;
          }
        </style>
      </head>
      <body>
        ${invoiceHTML}
        <script>
          window.onload = function() {
            document.querySelectorAll('th').forEach(function(th) {
              th.style.cssText = 'background:#f0f0f0!important;color:#000000!important;-webkit-text-fill-color:#000000!important;border:1px solid #000;padding:0.45rem 0.4rem;font-weight:800;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.6px;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
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
      </html>
    `);
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
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const cloneRoot = clonedDoc.querySelector(".invoice-container");
          if (cloneRoot) {
            cloneRoot.style.all = "initial";
            cloneRoot.style.display = "block";
            cloneRoot.style.background = "#ffffff";
            cloneRoot.style.color = "#000000";
            cloneRoot.style.fontFamily = "Arial, sans-serif";
            forceInlineColours(cloneRoot);
          }
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
    return (
      <div style={{ padding: "2rem", color: "var(--text-primary)" }}>
        No invoice data found.
      </div>
    );
  }

  const tdStyle = (rowIdx, isTotal = false) =>
    isTotal ? S.tdTotal : rowIdx % 2 === 0 ? S.tdWhite : S.tdGrey;

  return (
    <div className={`invoice-page ${isDark ? "dark" : ""}`}>
      <div className="invoice-actions">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <div className="action-btn-group">
          <button onClick={handlePrint} className="print-btn">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleSavePDF} className="save-btn">
            <FileText size={16} /> Save PDF
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="save-message" style={S.text}>
          {saveMessage}
        </div>
      )}

      <div ref={componentRef} className="invoice-container" style={S.wrap}>
        <div className="invoice-outer" style={S.wrap}>
          {/* Header */}
          <div
            className="invoice-header"
            style={{
              textAlign: "center",
              borderBottom: "1px solid #000",
              paddingBottom: "0.5rem",
              ...S.wrap,
            }}
          >
            <h2 style={{ ...S.text, margin: 0, fontSize: "1.1rem" }}>
              RADNUS COMMUNICATION
            </h2>
            <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
              No.242/244, MG Road, Sinnaya Plaza, Near Fish Market
            </p>
            <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
              Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 605001
            </p>
            <p style={{ ...S.text, margin: "2px 0", fontSize: "0.75rem" }}>
              E-Mail: sundar12134@gmail.com
            </p>
          </div>

          {/* Title */}
          <div
            style={{
              textAlign: "center",
              fontSize: "1rem",
              fontWeight: "bold",
              padding: "0.5rem",
              borderBottom: "1px solid #000",
              ...S.text,
            }}
          >
            INVOICE
          </div>

          {/* Two-column: consignee + meta */}
          <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
            {/* Left - Consignee and Buyer sections */}
            <div
              style={{
                width: "50%",
                padding: "0.5rem",
                borderRight: "1px solid #000",
              }}
            >
              <div
                style={{
                  ...S.text,
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  marginBottom: "4px",
                }}
              >
                Consignee (Ship to)
              </div>
              <DisplayBuyerInfo 
                name={buyerName}
                phone={buyerPhone}
                address={buyerAddress}
                city={buyerCity}
                state={buyerState}
                customerType={customerType}
                shopName={shopName}
              />

              <div
                style={{
                  ...S.text,
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  margin: "10px 0 4px",
                }}
              >
                Buyer (Bill to)
              </div>
              <DisplayBuyerInfo 
                name={buyerName}
                phone={buyerPhone}
                address={buyerAddress}
                city={buyerCity}
                state={buyerState}
                customerType={customerType}
                shopName={shopName}
              />
            </div>

            {/* Right — meta table */}
            <div style={{ width: "50%", padding: "0.5rem" }}>
              <table
                className="meta-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.75rem",
                }}
              >
                <tbody>
                  {[
                    ["Invoice No.", invoiceNumber],
                    ["Dated", new Date(date).toDateString()],
                    ["Delivery Note", ""],
                    ["Mode/Terms of Payment", paymentMode?.toUpperCase()],
                    ["Salesperson", salesperson],
                    ["Reference No. & Date", formatReferenceNo()],
                    ["Buyer's Order No.", ""],
                    ["Dispatched through", ""],
                    ["Destination", buyerLine3],
                    ["Terms of Delivery", ""],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td
                        style={{
                          ...S.metaTd,
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                       </td>
                      <td style={S.metaTd}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Items table - preserving original order */}
          <table
            className="items-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              margin: "0.5rem 0",
            }}
          >
            <thead>
              <tr>
                {["SL NO.", "DESCRIPTION", "HSN", "QTY", "RATE", "PER", "AMOUNT"].map(
                  (h) => (
                    <th key={h} style={S.th}>
                      {h}
                    </th>
                  )
                )}
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
                  <td style={tdStyle(idx)}>
                    ₹{(item.qty * item.price).toFixed(2)}
                  </td>
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
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>
                  COURIER CHARGE
                </td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}></td>
                <td style={tdStyle(items.length + (discount > 0 ? 1 : 0))}>
                  ₹{courierCharge}.00
                </td>
              </tr>
              {/* Total row */}
              <tr>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight: "700" }}>Total</td>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight: "700" }}>
                  {totalQty} NOS
                </td>
                <td style={S.tdTotal}></td>
                <td style={S.tdTotal}></td>
                <td style={{ ...S.tdTotal, fontWeight: "700" }}>
                  ₹{grandTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div
            style={{
              padding: "0.5rem",
              borderBottom: "1px solid #000",
              ...S.text,
            }}
          >
            <strong style={S.text}>Amount Chargeable (in words)</strong>
            <br />
            <span style={S.text}>{grandTotalWords}</span>
          </div>

          {/* Declaration */}
          <div
            style={{
              padding: "0.5rem",
              borderBottom: "1px solid #000",
              ...S.text,
            }}
          >
            <strong style={S.text}>Declaration</strong>
            <br />
            <span style={{ ...S.text, fontSize: "0.78rem" }}>
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </span>
          </div>

          {/* Signature */}
          <div
            style={{
              display: "flex",
              padding: "0.5rem",
              borderBottom: "1px solid #000",
            }}
          >
            <div style={{ width: "60%", ...S.text }}>E. &amp; O.E</div>
            <div style={{ width: "40%", textAlign: "right", ...S.text }}>
              <strong style={S.text}>for RADNUS COMMUNICATION</strong>
              <div
                style={{
                  marginTop: "2rem",
                  borderTop: "1px solid #000",
                  width: "100%",
                }}
              ></div>
              <span style={S.text}>Authorised Signatory</span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              padding: "0.5rem",
              fontSize: "0.7rem",
              ...S.text,
            }}
          >
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;