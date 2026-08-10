// src/pages/Purchase/PurchaseInvoicePage.js
import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { Printer, FileText, ArrowLeft, ClipboardList } from 'lucide-react';
import '../Order/InvoicePage.css';
import radnusLogo from '../../assets/logo/radnus-logo.png';

/* Radnus's own company details — this app's DMS always belongs to Radnus,
   so on a purchase we are always the buyer / consignee. Only the supplier
   side changes per-purchase. */
const COMPANY = {
  name: 'RADNUS COMMUNICATION',
  addressLine1: 'No.242/244, MG ROAD, SINNAYA PLAZA',
  addressLine2: 'NEAR FISH MARKET',
  addressLine3: 'PUDUCHERRY - 605001',
  stateLine: 'State Name : Puducherry, Code : 34',
  email: 'sundar12134@gmail.com',
};

const S = {
  wrap: { background: '#ffffff', color: '#000000', WebkitTextFillColor: '#000000' },
  text: { color: '#000000', WebkitTextFillColor: '#000000', background: 'transparent' },
  tdWhite: {
    border: '1px solid #000', padding: '0.3rem 0.35rem', background: '#ffffff',
    color: '#000000', WebkitTextFillColor: '#000000', verticalAlign: 'middle', fontSize: '0.75rem',
  },
  tdGrey: {
    border: '1px solid #000', padding: '0.3rem 0.35rem', background: '#f5f5f5',
    color: '#000000', WebkitTextFillColor: '#000000', verticalAlign: 'middle', fontSize: '0.75rem',
  },
  tdTotal: {
    border: '1px solid #000', padding: '0.3rem 0.35rem', background: '#e8e8e8',
    color: '#000000', WebkitTextFillColor: '#000000', fontWeight: '700',
    verticalAlign: 'middle', fontSize: '0.75rem', borderTop: '2px solid #000',
  },
  th: {
    border: '1px solid #000', padding: '0.45rem 0.4rem', background: '#f0f0f0',
    color: '#000000', WebkitTextFillColor: '#000000', fontWeight: '800',
    textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.6px',
    textAlign: 'left', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
  },
  metaTd: {
    border: '1px solid #000', padding: '0.25rem 0.35rem', background: '#ffffff',
    color: '#000000', WebkitTextFillColor: '#000000', fontSize: '0.75rem',
  },
};

/* Numeric amount → words (INR) */
const amountInWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + amountInWords(num % 100) : '');
  if (num < 100000) return amountInWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + amountInWords(num % 1000) : '');
  if (num < 10000000) return amountInWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + amountInWords(num % 100000) : '');
  return amountInWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + amountInWords(num % 10000000) : '');
};

const fmtMoney = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
};

const PurchaseInvoicePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const componentRef = useRef();
  const [saveMessage, setSaveMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode on mount and when it changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                     document.body.classList.contains('dark-mode') ||
                     document.querySelector('.dark-mode') !== null;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Observe changes to the document
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const {
    purchase = null,
    supplier = null,
    items = [],
    discount = 0,
  } = location.state || {};

  if (!purchase) {
    return (
      <div style={{ 
        padding: '2rem', 
        color: isDarkMode ? '#fff' : '#000',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        minHeight: '100vh'
      }}>
        No invoice data found.
        <div style={{ marginTop: 12 }}>
          <button 
            className="back-btn" 
            onClick={() => navigate('/purchase/entry')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isDarkMode ? '#3d3d3d' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              border: isDarkMode ? '1px solid #555' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Purchase Entry
          </button>
        </div>
      </div>
    );
  }

  const invoiceNumber = purchase.invoiceNumber || '—';
  const invoiceDate = purchase.invoiceDate;
  const grandTotal = Number(purchase.grandTotal || 0);
  const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const grandTotalWords = `INR ${amountInWords(Math.round(grandTotal))} Only`;

  const supplierAddressLines = (supplier?.address || '').split(/\r?\n|,\s*/).filter(Boolean);

  const forceInlineColours = (root) => {
    if (!root) return;
    const BLACK = '#000000';
    const WHITE = '#ffffff';
    root.style.all = 'initial';
    root.style.display = 'block';
    root.style.background = WHITE;
    root.style.color = BLACK;
    root.style.fontFamily = 'Arial, sans-serif';
    root.style.WebkitTextFillColor = BLACK;

    root.querySelectorAll('*').forEach((el) => {
      el.style.setProperty('color', BLACK, 'important');
      el.style.setProperty('-webkit-text-fill-color', BLACK, 'important');
      if (!el.classList.contains('invoice-outer') && !el.classList.contains('invoice-container')) {
        el.style.setProperty('background-color', 'transparent', 'important');
      }
    });
    root.style.setProperty('background-color', WHITE, 'important');
    root.style.setProperty('color', BLACK, 'important');

    root.querySelectorAll('.items-table th').forEach((th) => {
      th.style.setProperty('background-color', '#f0f0f0', 'important');
      th.style.setProperty('color', BLACK, 'important');
      th.style.setProperty('-webkit-text-fill-color', BLACK, 'important');
      th.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
      th.style.setProperty('print-color-adjust', 'exact', 'important');
    });
    root.querySelectorAll('.items-table td').forEach((td) => {
      td.style.setProperty('background-color', WHITE, 'important');
      td.style.setProperty('color', BLACK, 'important');
      td.style.setProperty('-webkit-text-fill-color', BLACK, 'important');
    });
    root.querySelectorAll('.meta-table td').forEach((td) => {
      td.style.setProperty('background-color', WHITE, 'important');
      td.style.setProperty('color', BLACK, 'important');
      td.style.setProperty('-webkit-text-fill-color', BLACK, 'important');
    });
  };

  const restoreInlineColours = (root) => {
    if (!root) return;
    root.querySelectorAll('*').forEach((el) => {
      el.style.removeProperty('color');
      el.style.removeProperty('-webkit-text-fill-color');
      el.style.removeProperty('background-color');
    });
    root.style.removeProperty('background-color');
    root.style.removeProperty('color');
    root.style.all = '';
  };

  const getPrintHTML = (content) => {
    const logoUrl = radnusLogo;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <base href="${window.location.origin}/">
      <title>Purchase Invoice - ${invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          background: #fff; 
          color: #000; 
          padding: 0; 
          margin: 0; 
        }
        @page { margin: 10mm; size: A4 portrait; }
        .invoice-outer {
          background: #fff; 
          color: #000; 
          padding: 1rem; 
          border: 1px solid #000 !important;
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .invoice-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #000;
          background: #ffffff;
        }
        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }
        .logo-container img {
          height: 50px;
          width: auto;
          max-width: 130px;
          object-fit: contain;
          display: block;
        }
        .since-text {
          font-size: 0.55rem;
          color: #000;
          font-weight: 700;
          letter-spacing: 1px;
          text-align: center;
        }
        .invoice-title {
          font-size: 1.2rem;
          font-weight: bold;
          letter-spacing: 2px;
          color: #000;
          flex: 1;
          text-align: center;
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
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-outer">
        ${content}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;
  };

  const handlePrint = () => {
    const invoiceContent = componentRef.current.querySelector('.invoice-outer').innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (!printWindow) {
      setSaveMessage('⚠️ Please allow popups for this site to print');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    printWindow.document.write(getPrintHTML(invoiceContent));
    printWindow.document.close();
    printWindow.focus();
  };

  const handleSavePDF = () => {
    const root = componentRef.current;
    forceInlineColours(root);

    const options = {
      margin: 8,
      filename: `Purchase-Invoice-${invoiceNumber.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 3, 
        useCORS: true, 
        allowTaint: false, 
        logging: false, 
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const cloneRoot = clonedDoc.querySelector('.invoice-container');
          if (cloneRoot) {
            cloneRoot.style.all = 'initial';
            cloneRoot.style.display = 'block';
            cloneRoot.style.background = '#ffffff';
            cloneRoot.style.color = '#000000';
            cloneRoot.style.fontFamily = 'Arial, sans-serif';
            forceInlineColours(cloneRoot);
            
            const images = cloneRoot.querySelectorAll('img');
            images.forEach(img => {
              img.style.display = 'block';
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
            });
          }
        },
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(options).from(root).save()
      .then(() => {
        restoreInlineColours(root);
        setSaveMessage('✓ PDF saved');
        setTimeout(() => setSaveMessage(''), 2500);
      })
      .catch(() => restoreInlineColours(root));
  };

  const tdStyle = (rowIdx) => (rowIdx % 2 === 0 ? S.tdWhite : S.tdGrey);

  // Theme colors - INVOICE REMAINS SAME IN BOTH MODES
  // Only the background outside the invoice changes
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
    // Invoice always uses white/black regardless of mode
    invoiceBg: '#ffffff',
    invoiceText: '#000000',
    invoiceBorder: '#000000',
    invoiceAltBg: '#f5f5f5',
    buttonBg: isDarkMode ? '#3d3d3d' : '#ffffff',
    buttonText: isDarkMode ? '#ffffff' : '#000000',
    buttonBorder: isDarkMode ? '#555555' : '#dddddd',
    printBg: '#4CAF50',
    saveBg: '#2196F3',
  };

  return (
    <div className="invoice-page" style={{
      backgroundColor: theme.background,
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <div className="invoice-actions no-print" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '1rem',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
        borderBottom: isDarkMode ? '1px solid #444' : '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <button 
          onClick={() => navigate('/purchase/entry')} 
          className="back-btn" 
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            border: isDarkMode ? '1px solid #555' : '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = isDarkMode ? '#3d3d3d' : '#ffffff';
          }}
        >
          <ArrowLeft size={15} style={{ marginRight: 6 }} /> Back to Purchase Entry
        </button>
        <div className="action-btn-group" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/purchase/history')} 
            className="back-btn" 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000',
              border: isDarkMode ? '1px solid #555' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#3d3d3d' : '#ffffff';
            }}
          >
            <ClipboardList size={16} style={{ marginRight: 6 }} /> Purchase History
          </button>
          <button 
            onClick={handlePrint} 
            className="print-btn" 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
            }}
          >
            <Printer size={16} style={{ marginRight: 6 }} /> Print
          </button>
          <button 
            onClick={handleSavePDF} 
            className="save-btn" 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1976D2';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2196F3';
            }}
          >
            <FileText size={16} style={{ marginRight: 6 }} /> Save PDF
          </button>
        </div>
      </div>

      {saveMessage && <div className="save-message" style={{
        padding: '0.5rem 1rem',
        backgroundColor: saveMessage.includes('⚠️') ? '#ff9800' : '#4CAF50',
        color: 'white',
        textAlign: 'center',
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>{saveMessage}</div>}

      {/* INVOICE - ALWAYS WHITE BACKGROUND, BLACK TEXT - SAME IN BOTH MODES */}
      <div ref={componentRef} className="invoice-container" style={{
        maxWidth: '210mm',
        margin: '0 auto',
        borderRadius: '8px',
        boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div className="invoice-outer" style={{
          background: '#ffffff',
          color: '#000000',
          padding: '1rem',
          border: '2px solid #000000',
          borderRadius: '8px',
        }}>
          {/* Header with Logo and Title - INVOICE CENTERED */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '0.5rem 1rem', 
            borderBottom: '2px solid #000000',
            background: '#ffffff',
            color: '#000000'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15rem',
              minWidth: '130px'
            }}>
              <img 
                src={radnusLogo}
                alt="RADNUS" 
                style={{ 
                  height: '50px', 
                  width: 'auto',
                  maxWidth: '130px',
                  objectFit: 'contain',
                  display: 'block',
                  backgroundColor: 'transparent'
                }} 
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: 'bold',
              letterSpacing: '3px',
              color: '#000000',
              flex: 1,
              textAlign: 'center'
            }}>
              INVOICE
            </div>
            <div style={{ minWidth: '130px' }}></div>
          </div>

          {/* Buyer + Invoice meta */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #000000',
            background: '#ffffff'
          }}>
            <div style={{ width: '50%', padding: '0.5rem', borderRight: '1px solid #000000' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: 2, color: '#000000' }}>{COMPANY.name}</div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine1}</div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine2}</div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine3}</div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.stateLine}</div>
              <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: '#000000' }}>E-Mail : {COMPANY.email}</div>
            </div>
            <div style={{ width: '50%', padding: '0.5rem' }}>
              <table className="meta-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <tbody>
                  {[
                    ['Invoice No.', invoiceNumber],
                    ['Dated', fmtDate(invoiceDate)],
                    ['Supplier Invoice No. & Date.', purchase.supplierInvoiceNumber || '—'],
                    ['Other References', purchase.remarks || '—'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ 
                        border: '1px solid #000000',
                        padding: '0.25rem 0.35rem',
                        background: '#ffffff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: '#000000'
                      }}>{label}</td>
                      <td style={{ 
                        border: '1px solid #000000',
                        padding: '0.25rem 0.35rem',
                        background: '#ffffff',
                        color: '#000000'
                      }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consignee + Supplier */}
          <div style={{ 
            display: 'flex', 
            borderBottom: '1px solid #000000',
            background: '#ffffff'
          }}>
            <div style={{ width: '50%', padding: '0.5rem', borderRight: '1px solid #000000' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: 4, color: '#000000' }}>Consignee (Ship to)</div>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#000000' }}>{COMPANY.name}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine1}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine2}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.addressLine3}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>{COMPANY.stateLine}</div>
            </div>
            <div style={{ width: '50%', padding: '0.5rem' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: 4, color: '#000000' }}>Supplier (Bill from)</div>
              <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#000000' }}>{supplier?.name || '—'}</div>
              {supplierAddressLines.map((line, i) => (
                <div key={i} style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>{line}</div>
              ))}
              {supplier?.gstNo && (
                <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>GSTIN : {supplier.gstNo}</div>
              )}
              {supplier?.mobile && (
                <div style={{ fontSize: '0.78rem', lineHeight: 1.4, color: '#000000' }}>Mobile : {supplier.mobile}</div>
              )}
            </div>
          </div>

          {/* Items table */}
          <table className="items-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            margin: '0.5rem 0',
            background: '#ffffff'
          }}>
            <thead>
              <tr>
                {['SI No.', 'Description of Goods', 'Quantity', 'Rate', 'per', 'Disc. %', 'Amount'].map((h) => (
                  <th key={h} style={{ 
                    border: '1px solid #000000',
                    padding: '0.45rem 0.4rem',
                    background: '#f0f0f0',
                    color: '#000000',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    fontSize: '0.72rem',
                    letterSpacing: '0.6px',
                    textAlign: 'left'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr key={idx}>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem'
                    }}>{idx + 1}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem'
                    }}>{item.name}{item.sku ? ` (${item.sku})` : ''}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem'
                    }}>{item.quantity} {item.unit || 'nos'}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem',
                      textAlign: 'right'
                    }}>{fmtMoney(item.purchasePrice)}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem'
                    }}>{item.unit || 'nos'}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem',
                      textAlign: 'right'
                    }}>{item.discPercent || ''}</td>
                    <td style={{ 
                      border: '1px solid #000000',
                      padding: '0.3rem 0.35rem',
                      background: isEven ? '#ffffff' : '#f5f5f5',
                      color: '#000000',
                      verticalAlign: 'middle',
                      fontSize: '0.75rem',
                      textAlign: 'right'
                    }}>{fmtMoney(item.total ?? (item.quantity * item.purchasePrice))}</td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}></td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}>Total</td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}>{totalQty} nos</td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}></td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}></td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000'
                }}></td>
                <td style={{ 
                  border: '1px solid #000000',
                  padding: '0.3rem 0.35rem',
                  background: '#e8e8e8',
                  color: '#000000',
                  fontWeight: '700',
                  verticalAlign: 'middle',
                  fontSize: '0.75rem',
                  borderTop: '2px solid #000000',
                  textAlign: 'right'
                }}>₹ {fmtMoney(grandTotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div style={{ 
            padding: '0.5rem', 
            borderBottom: '1px solid #000000', 
            display: 'flex', 
            justifyContent: 'space-between',
            background: '#ffffff'
          }}>
            <div>
              <strong style={{ color: '#000000' }}>Amount Chargeable (in words)</strong>
              <br />
              <span style={{ color: '#000000' }}>{grandTotalWords}</span>
            </div>
            <div style={{ alignSelf: 'flex-start', fontStyle: 'italic', color: '#000000' }}>E. &amp; O.E</div>
          </div>

          {/* GSTIN + Signature */}
          <div style={{ 
            display: 'flex', 
            padding: '0.5rem', 
            borderBottom: '1px solid #000000',
            background: '#ffffff'
          }}>
            <div style={{ width: '60%', fontSize: '0.78rem', color: '#000000' }}>
              Company's GSTIN/UIN : {purchase.gstin || '—'}
            </div>
            <div style={{ width: '40%', textAlign: 'right' }}>
              <strong style={{ color: '#000000' }}>for {supplier?.name || 'SUPPLIER'}</strong>
              <div style={{ 
                marginTop: '2rem', 
                borderTop: '1px solid #000000', 
                width: '100%' 
              }}></div>
              <span style={{ color: '#000000' }}>Authorised Signatory</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            padding: '0.5rem', 
            fontSize: '0.7rem',
            background: '#ffffff',
            color: '#000000'
          }}>
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoicePage;