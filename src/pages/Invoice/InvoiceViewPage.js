// src/pages/Invoices/InvoiceViewPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import radnusLogo from "../../assets/logo/radnus-logo.png";
import "./InvoiceViewPage.css";

import {
  Download,
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  Printer,
} from "lucide-react";

const InvoiceViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const invoice = location.state?.invoice;
  const [downloading, setDownloading] = useState(false);

  // ===== LOGO FIX: convert imported logo to a base64 data URI =====
  // A plain file path/blob URL can fail to resolve inside the popup print
  // window or during html2pdf's html2canvas capture. Baking the logo into
  // a base64 data URI removes that external dependency entirely, so it
  // always renders correctly regardless of context.
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const convertLogoToBase64 = async () => {
      try {
        const response = await fetch(radnusLogo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) {
            setLogoBase64(reader.result);
            setLogoReady(true);
          }
        };
        reader.onerror = () => {
          console.warn("Logo base64 conversion failed, falling back to file path");
          if (!cancelled) setLogoReady(true);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn("Logo fetch failed, falling back to file path:", err);
        if (!cancelled) setLogoReady(true);
      }
    };
    convertLogoToBase64();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!invoice) {
    return (
      <div className={`invoice-view ${isDark ? "dark" : ""}`}>
        No invoice data found.
      </div>
    );
  }

  // Destructure invoice fields
  const {
    invoiceNumber,
    createdAt,
    customerName,
    customerPhone,
    customerAddress,
    customerCity,
    customerState,
    customerType,
    shopName,
    sameAsBuyer,
    shippingAddress,
    items = [],
    totalAmount,
    paymentMode,
    subtotal: storeSubtotal,
    discount = 0,
    courierCharge = 0,
    billerName,
    salesperson = "",
    referenceNo = "",
    orderType = '',
  } = invoice;

  // Ensure items maintain their original order
  const orderedItems = [...items];

  const subtotal =
    storeSubtotal || orderedItems.reduce((sum, i) => sum + i.qty * i.price, 0);
  const grandTotal = totalAmount;

  // Helper function to get display name (customer name only)
  const getDisplayName = () => {
    return customerName;
  };

  // Helper to get shop name
  const getShopName = () => {
    if (customerType === "shop" && shopName) {
      return shopName;
    }
    return null;
  };

  // Generate the EXACT same HTML used for printing
  const generateInvoiceHTML = () => {
    // Helper: amount to words
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
        return (
          tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
        );
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
    const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

    // Get customer and shop names
    const buyerCustomerName = customerName;
    const buyerShopName = getShopName();

    // Build buyer display lines
    let buyerDisplayLines = "";
    buyerDisplayLines += `<p style="font-size:0.78rem; margin:2px 0; font-weight:600;">${buyerCustomerName}</p>`;
    if (buyerShopName) {
      buyerDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${buyerShopName}</p>`;
    }
    buyerDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${customerPhone}</p>`;
    if (customerAddress && customerAddress !== "—") {
      buyerDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${customerAddress}</p>`;
    }
    if (customerCity || customerState) {
      buyerDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${[customerCity, customerState].filter(Boolean).join(" - ")}</p>`;
    }

    const buyerLine3 = [customerCity, customerState]
      .filter(Boolean)
      .join(" - ");

    // Build shipping display lines
    let shipCustomerName = buyerCustomerName;
    let shipShopName = buyerShopName;
    let shipPhone = customerPhone;
    let shipAddress = customerAddress;
    let shipCity = customerCity;
    let shipState = customerState;

    if (!sameAsBuyer && shippingAddress) {
      shipCustomerName = shippingAddress.name || buyerCustomerName;
      shipShopName = null;
      shipPhone = shippingAddress.phone || customerPhone;
      shipAddress = shippingAddress.address || "";
      shipCity = shippingAddress.city || "";
      shipState = shippingAddress.state || "";
    }

    // Build shipping display lines
    let shipDisplayLines = "";
    shipDisplayLines += `<p style="font-size:0.78rem; margin:2px 0; font-weight:600;">${shipCustomerName}</p>`;
    if (shipShopName) {
      shipDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${shipShopName}</p>`;
    }
    shipDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${shipPhone}</p>`;
    if (shipAddress && shipAddress !== "—") {
      shipDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${shipAddress}</p>`;
    }
    if (shipCity || shipState) {
      shipDisplayLines += `<p style="font-size:0.78rem; margin:2px 0;">${[shipCity, shipState].filter(Boolean).join(" - ")}</p>`;
    }

    // Reference date
    const refDate = createdAt
      ? new Date(createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
    const refDisplay = referenceNo ? `${referenceNo} dt. ${refDate}` : "";

    // Items rows - preserving order exactly as in the array with proper table structure
    let itemsRows = "";
    orderedItems.forEach((item, idx) => {
      const amount = item.qty * item.price;
      itemsRows += `
        <tr>
          <td style="text-align:center;padding:8px;border:1px solid #000;">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #000;">${item.name}</td>
          <td style="text-align:center;padding:8px;border:1px solid #000;">-</td>
          <td style="text-align:center;padding:8px;border:1px solid #000;">${item.qty} NOS</td>
          <td style="text-align:right;padding:8px;border:1px solid #000;">₹${item.price}</td>
          <td style="text-align:center;padding:8px;border:1px solid #000;">NOS</td>
          <td style="text-align:right;padding:8px;border:1px solid #000;">₹${amount.toFixed(2)}</td>
        </tr>
      `;
    });

    const discountRow =
      discount > 0
        ? `
      <tr>
        <td style="border:1px solid #000;padding:8px;"></td>
        <td style="border:1px solid #000;padding:8px;">DISCOUNT</td>
        <td style="border:1px solid #000;padding:8px;"></td>
        <td style="border:1px solid #000;padding:8px;"></td>
        <td style="border:1px solid #000;padding:8px;"></td>
        <td style="border:1px solid #000;padding:8px;"></td>
        <td style="border:1px solid #000;padding:8px;text-align:right;">-₹${discount}.00</td>
      </tr>`
        : "";

    const totalQty = orderedItems.reduce((sum, i) => sum + i.qty, 0);

    // Use the base64 logo (guaranteed to render in the print window / PDF).
    // Falls back to the raw import path only if base64 conversion failed.
    const logoSrcForHtml = logoBase64 || radnusLogo;

    const logoImg = `<img 
      src="${logoSrcForHtml}" 
      alt="Radnus Communication" 
      style="height:60px; width:auto; max-width:100px; display:block; object-fit:contain;"
    />`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <base href="${window.location.origin}/">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            background: #fff; 
            color: #000; 
            padding: 20px; 
            margin: 0;
          }
          @page { 
            margin: 10mm; 
            size: A4 portrait; 
          }

          .invoice-outer {
            background: #fff;
            color: #000;
            padding: 1rem;
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            max-width: 100%;
            margin: 0 auto;
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
            padding: 8px;
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
            padding: 8px;
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
            padding: 6px;
            background: #ffffff;
            color: #000000;
            -webkit-text-fill-color: #000000;
          }

          /* Ensure black text everywhere */
          * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          
          body, .invoice-outer, .items-table, .meta-table {
            background-color: #ffffff !important;
          }
          
          .items-table th {
            background: #f0f0f0 !important;
          }
          
          .items-table td {
            background: #ffffff !important;
          }
          
          .items-table tbody tr:nth-child(even) td {
            background: #f5f5f5 !important;
          }

          /* Page-break for long invoices */
          .items-table tr {
            page-break-inside: avoid;
          }
          .items-table thead {
            display: table-header-group;
          }
        </style>
      </head>
      <body>
        <div class="invoice-outer">
          <!-- Company Header with Logo -->
          <div style="display:flex; align-items:center; border-bottom:1px solid #000; padding-bottom:0.5rem;">
            <div style="width:110px; flex-shrink:0; display:flex; align-items:center; justify-content:flex-start;">
              ${logoImg}
            </div>
            <div style="flex:1; text-align:center; padding:0 0.5rem;">
              <h2 style="margin:0; font-size:1.2rem; font-weight:700; color:#000000; letter-spacing:0.5px;">RADNUS COMMUNICATION</h2>
              <p style="font-size:0.75rem; color:#000000; margin-top:2px;">No.242/244, MG Road, Sinnaya Plaza, Near KFC Chicken</p>
              <p style="font-size:0.75rem; color:#000000;">Puducherry - 605001 &nbsp;|&nbsp; State Name: Puducherry, Code: 605001</p>
              <p style="font-size:0.75rem; color:#000000;">E-Mail: sundar12134@gmail.com</p>
            </div>
            <div style="width:110px; flex-shrink:0;"></div>
          </div>

          <!-- Invoice Title -->
          <div style="text-align:center; font-size:1rem; font-weight:bold; padding:0.5rem; border-bottom:1px solid #000;">INVOICE</div>

          <!-- Two columns: Consignee + Meta -->
          <div style="display:flex; border-bottom:1px solid #000;">
            <div style="width:50%; padding:0.5rem; border-right:1px solid #000;">
              <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;">Consignee (Ship to)</div>
              ${shipDisplayLines}
              <div style="font-weight:700; font-size:0.95rem; margin:10px 0 4px;">Buyer (Bill to)</div>
              ${buyerDisplayLines}
            </div>
            <div style="width:50%; padding:0.5rem;">
              <table class="meta-table">
                <tr><td style="font-weight:600;">Invoice No.</td><td>${invoiceNumber}</td></tr>
                <tr><td style="font-weight:600;">Dated</td><td>${new Date(createdAt).toDateString()}</td></tr>
                <tr><td style="font-weight:600;">Delivery Note</td><td></td></tr>
                <tr><td style="font-weight:600;">Mode/Terms of Payment</td><td>${paymentMode?.toUpperCase()}</td></tr>
                <tr><td style="font-weight:600;">Salesperson</td><td>${salesperson}</td></tr>
                <tr><td style="font-weight:600;">Reference No. &amp; Date</td><td>${refDisplay}</td></tr>
                <tr><td style="font-weight:600;">Order Type</td><td>${orderType || ''}</td></tr>
                <tr><td style="font-weight:600;">Buyer's Order No.</td><td></td></tr>
                <tr><td style="font-weight:600;">Dispatched through</td><td></td></tr>
                <tr><td style="font-weight:600;">Destination</td><td>${buyerLine3}</td></tr>
                <tr><td style="font-weight:600;">Terms of Delivery</td><td></td></tr>
              </table>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>SL NO.</th>
                <th>DESCRIPTION</th>
                <th>HSN</th>
                <th>QTY</th>
                <th>RATE</th>
                <th>PER</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              ${discountRow}
              <tr>
                <td></td>
                <td>COURIER CHARGE</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td style="text-align:right;">₹${courierCharge}.00</td>
              </tr>
              <tr>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;">Total</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:center;">${totalQty} NOS</td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000;"></td>
                <td style="background:#e8e8e8; font-weight:700; border-top:2px solid #000; text-align:right;">₹${grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount in Words -->
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Amount Chargeable (in words)</strong><br/>
            <span>${grandTotalWords}</span>
          </div>

          <!-- Declaration -->
          <div style="padding:0.5rem; border-bottom:1px solid #000;">
            <strong>Declaration</strong><br/>
            <span style="font-size:0.78rem;">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</span>
          </div>

          <!-- Signature -->
          <div style="display:flex; padding:0.5rem; border-bottom:1px solid #000;">
            <div style="width:60%;">E. &amp; O.E</div>
            <div style="width:40%; text-align:right;">
              <strong>for RADNUS COMMUNICATION</strong>
              <div style="margin-top:2rem; border-top:1px solid #000; width:100%;"></div>
              <span>Authorised Signatory</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center; padding:0.5rem; font-size:0.7rem;">
            This is a Computer Generated Invoice
          </div>
        </div>
      </body>
      </html>`;
  };

  // Print handler
  const handlePrint = () => {
    setDownloading(true);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(generateInvoiceHTML());
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
    setDownloading(false);
  };

  // Download PDF handler
  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Create hidden container
      const element = document.createElement("div");
      element.innerHTML = generateInvoiceHTML();

      // Append temporarily
      document.body.appendChild(element);

      // Import html2pdf dynamically
      const html2pdf = (await import("html2pdf.js")).default;

      // PDF options
      const opt = {
        margin: 0.3,
        filename: `${invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
      };

      // Download directly
      await html2pdf().set(opt).from(element).save();

      // Cleanup
      document.body.removeChild(element);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Page Render
  return (
    <div className={`invoice-view ${isDark ? "dark" : ""}`}>
      <div className="view-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>Invoice Details</h1>
      </div>

      <div className="invoice-details">
        {/* Meta */}
        <div className="detail-card">
          <div className="detail-row">
            <span className="label">Invoice No.</span>
            <span>{invoiceNumber}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date</span>
            <span>{new Date(createdAt).toDateString()}</span>
          </div>
          <div className="detail-row">
            <span className="label">Biller</span>
            <span>{billerName}</span>
          </div>
          {salesperson && (
            <div className="detail-row">
              <span className="label">Salesperson</span>
              <span>{salesperson}</span>
            </div>
          )}
          {referenceNo && (
            <div className="detail-row">
              <span className="label">Reference No.</span>
              <span>{referenceNo}</span>
            </div>
          )}
          {orderType && (
            <div className="detail-row">
              <span className="label">Order Type</span>
              <span>{orderType}</span>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="detail-card">
          <h3>Customer</h3>
          <div className="detail-row">
            <Phone size={14} />
            <div>
              <div style={{ fontWeight: "600" }}>{customerName}</div>
              {customerType === "shop" && shopName && <div>{shopName}</div>}
              <div>{customerPhone}</div>
            </div>
          </div>
          <div className="detail-row">
            <MapPin size={14} />
            <span>
              {[customerAddress, customerCity, customerState]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </div>
          <div className="detail-row">
            <CreditCard size={14} />
            <span>Payment: {paymentMode?.toUpperCase()}</span>
          </div>
        </div>

        {/* Items - Displaying in order */}
        <div className="detail-card">
          <h3>Items ({orderedItems.length})</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orderedItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.price}</td>
                  <td>₹{(item.qty * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="detail-card summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-row">
              <span>Discount</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Courier Charge</span>
            <span>₹{courierCharge.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="button-group">
          <button
            className="print-btn"
            onClick={handlePrint}
            disabled={downloading || !logoReady}
          >
            <Printer size={18} />{" "}
            {downloading ? "Preparing..." : logoReady ? "Print Invoice" : "Loading logo..."}
          </button>
          <button
            className="download-btn"
            onClick={handleDownload}
            disabled={downloading || !logoReady}
          >
            <Download size={18} />{" "}
            {downloading ? "Preparing..." : logoReady ? "Download PDF" : "Loading logo..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;

