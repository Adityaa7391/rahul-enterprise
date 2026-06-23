import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import API from '../utils/api';

/* ─── GLOBAL STYLES ─────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0 rgba(232,93,4,0.6); }
      70%  { box-shadow: 0 0 0 18px rgba(232,93,4,0); }
      100% { box-shadow: 0 0 0 0 rgba(232,93,4,0); }
    }
    @keyframes floatY {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-7px); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0);   opacity: 1; }
      to   { transform: translateX(100%); opacity: 0; }
    }
    @keyframes dotBlink {
      0%,100% { opacity: 1; }
      50%      { opacity: 0.25; }
    }

    .re-pulse-btn  { animation: pulseRing 2.2s infinite, floatY 3.2s ease-in-out infinite; }
    .re-fade-up    { animation: fadeInUp 0.4s ease both; }
    .re-slide-in   { animation: slideInRight 0.4s cubic-bezier(.22,.68,0,1.2) both; }
    .re-slide-out  { animation: slideOutRight 0.35s ease both; }
    .dot-blink     { animation: dotBlink 1.4s ease-in-out infinite; }
    .re-blink-dot  { animation: dotBlink 1.4s ease-in-out infinite; }

    .re-state { cursor:pointer; transition:filter .2s, opacity .3s; }
    .re-state:hover { filter:brightness(1.3); }
    .re-zone-card { transition: background .18s, transform .15s; }
    .re-zone-card:hover { background: rgba(255,255,255,.07) !important; transform: translateX(3px); }
    .re-zone-card.re-active { background: rgba(255,255,255,.09) !important; }

    .re-card-hover {
      transition: border-color .25s, transform .25s, box-shadow .25s;
    }
    .re-card-hover:hover {
      border-color: #e85d04 !important;
      transform: translateY(-4px);
      box-shadow: 0 14px 36px rgba(232,93,4,.12);
    }
    .re-why-card {
      transition: background .25s, border-color .25s, transform .25s;
    }
    .re-why-card:hover {
      background: rgba(232,93,4,.08) !important;
      border-color: rgba(232,93,4,.4) !important;
      transform: translateY(-3px);
    }

    /* ── CONTACT STYLES ── */
    .re-contact-input {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      color: white;
      font-family: inherit;
      font-size: 0.9rem;
      outline: none;
      margin-bottom: 1rem;
      transition: border-color 0.18s;
      appearance: none;
      -webkit-appearance: none;
      color-scheme: dark;
      box-sizing: border-box;
    }
    .re-contact-input:focus { border-color: rgba(232,93,4,0.6); }
    .re-contact-input::placeholder { color: #4b5563; }
    .re-contact-input option { background: #0d1f3c; color: white; }
    .re-contact-select-wrap { position: relative; margin-bottom: 1rem; }
    .re-contact-select-wrap .re-contact-input { margin-bottom: 0; padding-right: 2.5rem; cursor: pointer; }
    .re-contact-select-arrow {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      pointer-events: none;
    }
    .re-contact-submit {
      width: 100%; background: #e85d04; color: white; border: none;
      padding: 0.95rem; border-radius: 6px; font-weight: 700;
      font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
      font-family: inherit; letter-spacing: 0.3px;
    }
    .re-contact-submit:hover:not(:disabled) {
      background: #f48c06; transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(232,93,4,0.35);
    }
    .re-contact-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .re-contact-info-item {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 1.1rem 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      transition: border-color 0.2s;
    }
    .re-contact-info-item:hover { border-color: rgba(232,93,4,0.3); }
    .re-contact-info-icon {
      width: 42px; height: 42px; background: rgba(232,93,4,0.12);
      border-radius: 8px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; font-size: 1.1rem;
    }

    /* ── DOWNLOAD PDF BUTTON ── */
    .re-download-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.18);
      color: white; padding: 0.7rem; border-radius: 6px;
      font-weight: 600; font-size: 0.82rem; cursor: pointer;
      font-family: inherit; transition: all 0.2s; margin-top: 0.6rem;
    }
    .re-download-btn:hover:not(:disabled) {
      background: rgba(232,93,4,0.18); border-color: rgba(232,93,4,0.5);
    }
    .re-download-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    @media (max-width: 900px) {
      .hero-grid     { grid-template-columns: 1fr !important; }
      .two-col       { grid-template-columns: 1fr !important; gap: 2rem !important; }
      .three-col     { grid-template-columns: 1fr 1fr !important; }
      .why-grid      { grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
      .cover-grid    { grid-template-columns: 1fr !important; }
      .services-grid { grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
      .re-section    { padding: 3rem 1.25rem !important; }
      .hero-h1       { font-size: clamp(2.4rem,9vw,3.5rem) !important; }
      .stats-bar     { padding: 1.25rem !important; }
      .slide-panel   { width: min(92vw, 400px) !important; }
    }
    @media (max-width: 540px) {
      .three-col  { grid-template-columns: 1fr 1fr !important; }
      .why-grid   { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

/* ─── HELPERS ───────────────────────────────────────────────────── */
const Tag = ({ c }) => (
  <span style={{ display:'inline-block', color:'#e85d04', fontSize:'0.7rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:'0.75rem' }}>{c}</span>
);
const H2 = ({ c, light }) => (
  <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(2rem,4vw,3rem)', color: light?'white':'#0a1628', lineHeight:1.1, marginBottom:'1rem' }}>{c}</h2>
);
const Sub = ({ c, light }) => (
  <p style={{ color: light?'#9ca3af':'#6b7280', fontSize:'1rem', lineHeight:1.75, maxWidth:560 }}>{c}</p>
);

// Resolve a stored image URL to a full URL served by the backend
const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');
  return `${base}${url}`;
};

const fmtDateTime = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const fmtDateOnly = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
};

/* ─── PDF GENERATION (client-side, via jsPDF loaded from CDN) ──────
   Loads jsPDF only once and caches the promise so multiple buttons
   on the page don't each inject the script separately.
─────────────────────────────────────────────────────────────────── */
let jsPDFLoaderPromise = null;
const loadJsPDF = () => {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (jsPDFLoaderPromise) return jsPDFLoaderPromise;
  jsPDFLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-re-jspdf]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.jspdf.jsPDF));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    script.dataset.reJspdf = 'true';
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => reject(new Error('Failed to load PDF library.'));
    document.body.appendChild(script);
  });
  return jsPDFLoaderPromise;
};

// Fetch an image URL and convert it to a base64 data URL (needed for jsPDF embedding)
const imageUrlToDataURL = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), width: img.naturalWidth, height: img.naturalHeight });
    } catch (e) {
      resolve(null); // CORS or canvas tainted — skip embedding image, PDF still generates
    }
  };
  img.onerror = () => resolve(null);
  img.src = url;
});

/**
 * Builds and downloads a PDF containing every shipment detail
 * (the same data captured in the admin "Add Shipment" form)
 * plus the uploaded shipment image, if available.
 */
const generateShipmentPDF = async (shipment) => {
  const jsPDFCtor = await loadJsPDF();
  const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 56;

  // ── Header band ──
  doc.setFillColor(10, 22, 40); // #0a1628
  doc.rect(0, 0, pageWidth, 86, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Rahul Enterprise', marginX, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(232, 93, 4);
  doc.text('SHIPMENT INFORMATION SHEET', marginX, 60);
  doc.setTextColor(180, 190, 205);
  doc.setFontSize(8.5);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, marginX, 75);

  y = 116;
  doc.setTextColor(20, 20, 20);

  // ── Status badge ──
  const status = shipment.status || 'Booked';
  const statusColors = {
    'Delivered':[34,197,94], 'In Transit':[232,93,4], 'Out for Delivery':[59,130,246],
    'Picked Up':[244,140,6], 'Booked':[156,163,175], 'Failed':[239,68,68], 'Returned':[139,92,246],
  };
  const [r,g,b] = statusColors[status] || [156,163,175];
  doc.setFillColor(r,g,b);
  doc.roundedRect(marginX, y - 14, 110, 22, 4, 4, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(status.toUpperCase(), marginX + 55, y + 1, { align: 'center' });

  doc.setTextColor(20,20,20);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(shipment.trackingId || '—', pageWidth - marginX, y + 1, { align: 'right' });

  y += 36;
  doc.setDrawColor(225, 225, 225);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 26;

  // ── Detail rows helper ──
  const fieldRow = (label, value) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(label.toUpperCase(), marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(20, 20, 20);
    doc.text(String(value ?? '—'), marginX, y + 15);
    y += 38;
  };

  const twoColRow = (l1, v1, l2, v2) => {
    const colWidth = (pageWidth - marginX * 2) / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(l1.toUpperCase(), marginX, y);
    doc.text(l2.toUpperCase(), marginX + colWidth, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v1 ?? '—'), marginX, y + 15);
    doc.text(String(v2 ?? '—'), marginX + colWidth, y + 15);
    y += 38;
  };

  twoColRow('CN Number', shipment.trackingId, 'Challan Number', shipment.challanNumber);
  twoColRow('Origin', shipment.origin, 'Destination', shipment.destination);
  twoColRow('Service Type', shipment.serviceType, 'Booking Date', fmtDateTime(shipment.createdAt));
  if (shipment.weight) twoColRow('Weight', shipment.weight, 'GPS Enabled', shipment.gpsEnabled ? 'Yes' : 'No');
  if (shipment.description) fieldRow('Description', shipment.description);

  // ── Tracking history ──
  if (shipment.trackingEvents?.length) {
    y += 8;
    doc.setDrawColor(225, 225, 225);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(20, 20, 20);
    doc.text('Tracking History', marginX, y);
    y += 20;

    shipment.trackingEvents.forEach((ev) => {
      if (y > 740) { doc.addPage(); y = 56; }
      doc.setFillColor(34, 197, 94);
      doc.circle(marginX + 4, y - 3, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.text(`${ev.status} — ${ev.location || ''}`, marginX + 16, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(fmtDateTime(ev.timestamp), marginX + 16, y + 13);
      if (ev.description) {
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text(String(ev.description), marginX + 16, y + 25);
        y += 12;
      }
      y += 30;
    });
  }

  // ── Shipment image ──
  const firstImage = shipment.images?.[0];
  if (firstImage) {
    if (y > 560) { doc.addPage(); y = 56; }
    y += 10;
    doc.setDrawColor(225, 225, 225);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(20, 20, 20);
    doc.text('Shipment Image', marginX, y);
    y += 16;

    const result = await imageUrlToDataURL(resolveImageUrl(firstImage.url));
    if (result?.dataUrl) {
      const maxW = pageWidth - marginX * 2;
      const maxH = 320;
      let drawW = result.width;
      let drawH = result.height;
      const ratio = Math.min(maxW / drawW, maxH / drawH, 1);
      drawW *= ratio; drawH *= ratio;
      if (y + drawH > 800) { doc.addPage(); y = 56; }
      doc.addImage(result.dataUrl, 'JPEG', marginX, y, drawW, drawH);
      y += drawH + 16;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(150, 150, 150);
      doc.text('Image could not be embedded (load error).', marginX, y);
      y += 20;
    }
  }

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('Rahul Enterprise Logistics — Generated automatically from live tracking data.', marginX, 822);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, 822, { align: 'right' });
  }

  doc.save(`Shipment_${shipment.trackingId || 'Info'}.pdf`);
};

/**
 * Downloads the shipment's uploaded photo directly as an image file
 * (separate from the PDF info sheet). Fetches it as a blob so the
 * browser saves it rather than navigating to it.
 */
const downloadShipmentImage = async (shipment) => {
  const photo = shipment?.images?.[0];
  if (!photo) throw new Error('No image available for this shipment.');
  const url = resolveImageUrl(photo.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not fetch image.');
  const blob = await response.blob();

  // Preserve original extension where possible, default to jpg
  const extMatch = (photo.originalName || photo.url || '').match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `Shipment_${shipment.trackingId || 'Photo'}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

/**
 * Combined download actions shown inside every tracking result card:
 * - "Download Info (PDF)" — always available, full shipment info sheet
 * - "Download Photo" — only shown when the shipment has an uploaded image,
 *   downloads that exact photo as a standalone image file
 * Each button manages its own busy/error state independently.
 */
const DownloadActions = ({ shipment }) => {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState('');
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState('');

  const hasPhoto = !!shipment?.images?.[0];

  const handlePdfClick = async () => {
    if (!shipment) return;
    setPdfBusy(true); setPdfErr('');
    try {
      await generateShipmentPDF(shipment);
    } catch (e) {
      console.error('PDF generation failed:', e);
      setPdfErr('Could not generate PDF. Please try again.');
    } finally {
      setPdfBusy(false);
    }
  };

  const handlePhotoClick = async () => {
    if (!shipment) return;
    setImgBusy(true); setImgErr('');
    try {
      await downloadShipmentImage(shipment);
    } catch (e) {
      console.error('Image download failed:', e);
      setImgErr('Could not download photo. Please try again.');
    } finally {
      setImgBusy(false);
    }
  };

  return (
    <>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:'0.6rem' }}>
        

        {hasPhoto && (
          <button onClick={handlePhotoClick} disabled={imgBusy} className="re-download-btn" style={{ flex:'1 1 0', marginTop: 0 }}>
            {imgBusy ? (
              'Downloading…'
            ) : (
              <>
                <StatusIcon name="pod" size={15} color="currentColor" />
                Download POD
              </>
            )}
          </button>
        )}
      </div>
      {pdfErr && <div style={{ marginTop:6, fontSize:'0.72rem', color:'#fca5a5' }}>{pdfErr}</div>}
      {imgErr && <div style={{ marginTop:6, fontSize:'0.72rem', color:'#fca5a5' }}>{imgErr}</div>}
    </>
  );
};

/**
 * Professional, structured panel showing every shipment detail captured
 * in the admin "Add Shipment" form — CN/Challan numbers, route, service
 * type, dispatch & expected delivery dates — plus the uploaded shipment
 * photo, shown inline (not just downloadable) with a click-to-enlarge
 * lightbox. Reused across Hero and SlidingTracker so
 * every public tracking result looks consistent.
 */
const ShipmentDetailCard = ({ shipment, compact = false }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  if (!shipment) return null;

  const photo = shipment.images?.[0];
  const photoUrl = photo ? resolveImageUrl(photo.url) : null;

  const fields = [
    { label: 'CN Number', value: shipment.trackingId },
    { label: 'Challan Number', value: shipment.challanNumber },
    { label: 'Origin', value: shipment.origin },
    { label: 'Destination', value: shipment.destination },
    { label: 'Service Type', value: shipment.serviceType },
    { label: 'Dispatch Date', value: fmtDateOnly(shipment.createdAt) },
    { label: 'Expected Delivery', value: shipment.estimatedDelivery ? fmtDateOnly(shipment.estimatedDelivery) : 'To be updated' },
  ];

  const gap = compact ? 10 : 14;
  const fontSize = compact ? '0.74rem' : '0.8rem';
  const labelSize = compact ? '0.62rem' : '0.66rem';

  return (
    <>
      <div style={{
        marginTop: compact ? '0.85rem' : '1.1rem',
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10,
        padding: compact ? '0.9rem' : '1.15rem',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom: compact ? 10 : 14 }}>
          <svg viewBox="0 0 24 24" width={compact ? 13 : 14} height={compact ? 13 : 14} fill="#e85d04">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
          <span style={{ fontSize: compact ? '0.72rem' : '0.78rem', fontWeight:700, color:'white', letterSpacing:0.3 }}>Shipment Details</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap, marginBottom: photoUrl ? (compact ? 12 : 16) : 0 }}>
          {fields.map(f => (
            <div key={f.label}>
              <div style={{ fontSize: labelSize, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6, fontWeight:700, marginBottom:2 }}>
                {f.label}
              </div>
              <div style={{ fontSize, color:'#e5e7eb', fontWeight:600, wordBreak:'break-word' }}>
                {f.value || '—'}
              </div>
            </div>
          ))}
        </div>

        {photoUrl && (
          <div>
            <div style={{ fontSize: labelSize, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.6, fontWeight:700, marginBottom:6 }}>
              Shipment Photo
            </div>
            <div
              onClick={() => setLightboxOpen(true)}
              style={{
                position:'relative', borderRadius:8, overflow:'hidden',
                border:'1px solid rgba(255,255,255,0.12)', cursor:'zoom-in',
                maxWidth: compact ? 220 : 280, lineHeight:0,
              }}
            >
              <img src={photoUrl} alt="Shipment"
                style={{ width:'100%', display:'block', maxHeight: compact ? 160 : 200, objectFit:'cover', transition:'transform 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                background:'linear-gradient(transparent, rgba(0,0,0,0.65))',
                padding:'16px 8px 6px', display:'flex', alignItems:'center', gap:5,
              }}>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <span style={{ fontSize:'0.65rem', color:'white', fontWeight:600 }}>Click to enlarge</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && photoUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position:'fixed', inset:0, zIndex:3000,
            background:'rgba(5,12,24,0.92)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'90vh', position:'relative' }}>
            <img src={photoUrl} alt="Shipment full size"
              style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:10, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} />
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position:'absolute', top:-44, right:0, background:'rgba(255,255,255,0.1)',
                border:'none', color:'white', width:36, height:36, borderRadius:'50%',
                fontSize:'1.2rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              }}>
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── STEP PROGRESS TRACKER ─────────────────────────────────────── */
const StatusIcon = ({ name, size = 16, color = 'currentColor' }) => {
  const paths = {
    booked: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12l8.73-5.04 M12 22.08V12" />,
    transit: <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
    outForDelivery: <path d="M5 17h2.5a1.5 1.5 0 1 1-3 0H1V6a1 1 0 0 1 1-1h12v4 M14 9h4l3 3.5V17h-2.5a1.5 1.5 0 1 1-3 0H8 M1 10h7 M1 13h5" />,
    delivered: <path d="M9 12l2 2 4-4 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />,
    failed: <path d="M12 9v4 M12 16.5h.01 M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />,
    returned: <path d="M9 14L4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
    pod: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const STEPS = [
  { label: 'Booked',           icon: 'booked' },
  { label: 'In Transit',       icon: 'transit' },
  { label: 'Out for Delivery', icon: 'outForDelivery' },
  { label: 'Delivered',        icon: 'delivered' },
];

// Exception states that fall outside the normal forward progression.
// Each gets its own professional icon + color instead of joining the step line.
const EXCEPTION_STATUS_META = {
  'Failed':   { icon: 'failed',   color: '#ef4444', label: 'Delivery Failed' },
  'Returned': { icon: 'returned', color: '#a855f7', label: 'Returned to Sender' },
};

const stepIndex = (status) => {
  const map = { 'Booked': 0, 'In Transit': 1, 'Out for Delivery': 2, 'Delivered': 3 };
  if (map[status] !== undefined) return map[status];
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') && s.includes('out')) return 2;
  if (s.includes('deliver')) return 3;
  if (s.includes('transit')) return 1;
  if (s.includes('pick') || s.includes('book')) return 0;
  return -1;
};

const StepTracker = ({ status, dark = true }) => {
  const activeIdx = stepIndex(status);
  const textColor = dark ? '#9ca3af' : '#6b7280';
  const lineColor = dark ? 'rgba(255,255,255,0.12)' : '#e8e4dc';
  const exception = EXCEPTION_STATUS_META[status];

  // Failed / Returned are exceptions outside the normal progression —
  // show a dedicated banner instead of forcing them onto the step line.
  if (exception) {
    return (
      <div style={{
        marginTop: '1.25rem', marginBottom: '0.5rem',
        display: 'flex', alignItems: 'center', gap: 10,
        background: `${exception.color}14`, border: `1px solid ${exception.color}40`,
        borderRadius: 10, padding: '0.85rem 1rem',
      }}>
        <StatusIcon name={exception.icon} size={20} color={exception.color} />
        <span style={{ color: exception.color, fontWeight: 700, fontSize: '0.85rem' }}>{exception.label}</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        {STEPS.map(({ label, icon }, i) => {
          const done = i <= activeIdx;
          const isCurrent = i === activeIdx;
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              {i > 0 && (
                <div style={{
                  position: 'absolute', top: 14, left: '-50%', width: '100%', height: 2,
                  background: done ? '#22c55e' : lineColor, transition: 'background 0.3s', zIndex: 0,
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1, flexShrink: 0,
                color: done ? '#22c55e' : textColor,
                opacity: done ? 1 : 0.5,
                transition: 'color 0.3s, opacity 0.3s',
              }}>
                <StatusIcon name={icon} size={18} color="currentColor" />
              </div>
              <div style={{
                marginTop: 6, fontSize: '0.65rem', fontWeight: isCurrent ? 700 : 500,
                color: done ? (isCurrent ? '#22c55e' : (dark ? '#86efac' : '#16a34a')) : textColor,
                textAlign: 'center', lineHeight: 1.3, maxWidth: 64, transition: 'color 0.3s',
                display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
              }}>
                <StatusIcon name={icon} size={11} color="currentColor" />
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SLIDING TRACK PANEL
   ═══════════════════════════════════════════════════════════════ */
const SlidingTracker = () => {
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState('');
  const [tid, setTid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const openPanel = () => { setAnimate('in'); setOpen(true); setTimeout(() => inputRef.current?.focus(), 350); };
  const closePanel = () => { setAnimate('out'); setTimeout(() => setOpen(false), 350); };

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closePanel(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const statusColors = { 'Delivered':'#22c55e','In Transit':'#e85d04','Out for Delivery':'#3b82f6','Picked Up':'#f48c06','Booked':'#9ca3af','Failed':'#ef4444' };

  const handleTrack = async () => {
    if (!tid.trim()) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const { data } = await API.get(`/shipments/track/${tid.trim()}`);
      setResult(data.data);
    } catch(e) {
      setErr(e.response?.data?.message || 'Shipment not found. Please check the tracking ID.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <button
        onClick={openPanel}
        className="re-pulse-btn"
        style={{
          position:'fixed', right:'1.75rem', bottom:'1.75rem', zIndex:1200,
          background:'linear-gradient(135deg,#e85d04 0%,#f48c06 100%)',
          border:'none', borderRadius:50, padding:'0.9rem 1.5rem',
          display:'flex', alignItems:'center', gap:10,
          color:'white', fontWeight:700, fontSize:'0.88rem',
          cursor:'pointer', boxShadow:'0 8px 28px rgba(232,93,4,.4)',
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span style={{letterSpacing:'0.5px'}}>Track Shipment</span>
      </button>

      {open && (
        <div onClick={closePanel} style={{ position:'fixed', inset:0, background:'rgba(5,12,24,.55)', backdropFilter:'blur(3px)', zIndex:1300 }} />
      )}

      {open && (
        <div
          className={`slide-panel ${animate === 'in' ? 're-slide-in' : 're-slide-out'}`}
          style={{
            position:'fixed', top:0, right:0, bottom:0, zIndex:1400,
            width:420, background:'#0e1f3a',
            borderLeft:'1px solid rgba(255,255,255,.1)',
            boxShadow:'-20px 0 60px rgba(0,0,0,.5)',
            overflowY:'auto', padding:'2rem 1.75rem',
            display:'flex', flexDirection:'column', gap:'1.5rem',
          }}
        >
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'white', letterSpacing:'1px' }}>Track Shipment</div>
              <div style={{ fontSize:'0.78rem', color:'#6b7280', marginTop:2 }}>Rahul Enterprise — Live Tracker</div>
            </div>
            <button onClick={closePanel} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'white', width:36, height:36, borderRadius:'50%', fontSize:'1.2rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>

          <div>
            <label style={{ fontSize:'0.78rem', color:'#9ca3af', display:'block', marginBottom:'0.5rem', fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>Consignment Number</label>
            <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1.5px solid rgba(232,93,4,.5)' }}>
              <input
                ref={inputRef}
                value={tid}
                onChange={e => setTid(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                placeholder="e.g. 067895"
                style={{ flex:1, padding:'0.85rem 1rem', background:'rgba(255,255,255,.06)', border:'none', color:'white', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', minWidth:0 }}
              />
            </div>
            <button onClick={handleTrack} disabled={loading}
              style={{ marginTop:'0.75rem', width:'100%', background:'#e85d04', border:'none', padding:'0.9rem', borderRadius:6, color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', letterSpacing:'0.5px' }}>
              {loading ? 'Searching...' : '🔍   Track Now'}
            </button>
          </div>

          {err && (
            <div style={{ padding:'1rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, color:'#fca5a5', fontSize:'0.83rem' }}>{err}</div>
          )}

          {result && (
            <div className="re-fade-up" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(34,197,94,.25)', borderRadius:12, padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'0.75rem', flexWrap:'wrap' }}>
                <span style={{ background:`${statusColors[result.status] || '#9ca3af'}22`, color:statusColors[result.status] || '#9ca3af', fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:4, letterSpacing:1 }}>{(result.status||'').toUpperCase()}</span>
                <span style={{ fontFamily:'monospace', color:'white', fontWeight:600 }}>{result.trackingId}</span>
              </div>
              <div style={{ fontSize:'0.82rem', color:'#9ca3af', marginBottom:'0.5rem' }}>{result.origin} → {result.destination} · {result.serviceType}</div>
              <StepTracker status={result.status} dark={true} />
              <div style={{ marginTop:'1.25rem' }}>
                {result.trackingEvents?.map((ev, i) => (
                  <div key={i} style={{ display:'flex', gap:14, position:'relative' }}>
                    {i < result.trackingEvents.length-1 && <div style={{ position:'absolute', left:9, top:22, width:1, height:'calc(100%)', background:'rgba(255,255,255,.1)' }} />}
                    <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {i < result.trackingEvents.length-1 && <svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                    </div>
                    <div style={{ paddingBottom:18 }}>
                      <div style={{ fontSize:'0.84rem', fontWeight:600, color:'white' }}>{ev.status} — {ev.location}</div>
                      <div style={{ fontSize:'0.71rem', color:'#6b7280', marginTop:2 }}>{new Date(ev.timestamp).toLocaleString('en-IN')} {ev.gpsActive && '· GPS Active'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {result.gpsEnabled && (
                <div style={{ marginTop:'0.75rem', display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.74rem', fontWeight:600, color:'#22c55e', background:'rgba(34,197,94,.1)', padding:'5px 10px', borderRadius:4 }}>
                  <span className="dot-blink" style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                  GPS Active
                </div>
              )}
              <ShipmentDetailCard shipment={result} compact />
              <DownloadActions shipment={result} />
            </div>
          )}
        </div>
      )}
    </>
  );
};

/* ─── HERO ──────────────────────────────────────────────────────── */

const Hero = () => {
  const [tid, setTid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const statusColors = { 'Delivered':'#22c55e','In Transit':'#e85d04','Out for Delivery':'#3b82f6','Picked Up':'#f48c06','Booked':'#9ca3af','Failed':'#ef4444' };

  const handleTrack = async (id) => {
    const trackId = (id || tid).trim();
    if (!trackId) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const { data } = await API.get(`/shipments/track/${trackId}`);
      setResult(data.data);
    } catch(e) {
      setErr(e.response?.data?.message || 'Shipment not found. Please check the tracking ID.');
    } finally { setLoading(false); }
  };

  return (
    <section id="tracking" style={{ background:'#122040', minHeight:'88vh', display:'flex', alignItems:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:-100, top:-100, width:700, height:700, background:'radial-gradient(circle,rgba(232,93,4,.13) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div className="hero-grid" style={{ maxWidth:1200, margin:'0 auto', padding:'4rem 2rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center', width:'100%' }}>
        <div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.14)',
            borderRadius:30, padding:'0.45rem 1rem 0.45rem 0.6rem', marginBottom:'1.25rem',
          }}>
            <span style={{
              width:24, height:24, borderRadius:'50%', background:'rgba(232,93,4,.18)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="#e85d04"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 14.5L6 11l1.41-1.41L10.5 12.67l6.09-6.09L18 8l-7.5 7.5z"/></svg>
            </span>
            <span style={{ fontSize:'0.78rem', color:'#e5e7eb', fontWeight:500 }}>
              Trusted partner to <strong style={{ color:'white', fontWeight:700 }}>Wipro GE Healthcare</strong> for 15 years
            </span>
          </div>
          <Tag c="Rahul Enterprise Logistics" />
          <h1 className="hero-h1" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3rem,6vw,5rem)', color:'white', lineHeight:1.05, marginBottom:'1.5rem' }}>
            Move Smarter.<br />Track <span style={{ color:'#e85d04' }}>Every</span><br />Shipment.
          </h1>
          <p style={{ color:'#9ca3af', fontSize:'1.05rem', lineHeight:1.8, marginBottom:'2.5rem', maxWidth:480 }}>
            Rahul Enterprise delivers end-to-end cargo and courier solutions with real-time tracking, GPS-enabled DV services, and daily MIS intelligence.
          </p>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            <a href="#tracking" style={{ background:'#e85d04', color:'white', padding:'0.9rem 2rem', borderRadius:4, fontWeight:600, textDecoration:'none', fontSize:'0.95rem' }}>Track Shipment</a>
            <a href="#contact"  style={{ border:'1.5px solid rgba(255,255,255,.3)', color:'white', padding:'0.9rem 2rem', borderRadius:4, fontWeight:500, textDecoration:'none', fontSize:'0.95rem' }}>Request Quote</a>
          </div>
          <div className="stats-bar" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', padding:'2rem', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, marginTop:'2rem' }}>
            {[['15+','Years Exp.'],['250+','Cities'],['99.2%','On-Time']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.2rem', color:'#e85d04', lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:'0.7rem', color:'#6b7280', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'2rem', backdropFilter:'blur(4px)' }}>
          <div style={{ color:'white', fontWeight:600, marginBottom:'1.25rem' }}>📍 Live Shipment Tracker</div>
          <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1.5px solid rgba(232,93,4,.5)', marginBottom:'0.75rem' }}>
            <input
              value={tid}
              onChange={e => setTid(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              placeholder="Enter Tracking ID…"
              style={{ flex:1, padding:'0.8rem 1rem', background:'rgba(255,255,255,.06)', border:'none', color:'white', fontFamily:'inherit', fontSize:'0.9rem', outline:'none', minWidth:0 }}
            />
            <button onClick={() => handleTrack()} disabled={loading}
              style={{ background:'#e85d04', border:'none', padding:'0.8rem 1.2rem', cursor:'pointer', color:'white', fontWeight:600, fontSize:'0.88rem', whiteSpace:'nowrap' }}>
              {loading ? '…' : 'Track'}
            </button>
          </div>

          {err && (
            <div style={{ marginBottom:'0.75rem', padding:'0.75rem 1rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, color:'#fca5a5', fontSize:'0.8rem' }}>{err}</div>
          )}

          {result ? (
            <div className="re-fade-up" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(34,197,94,.25)', borderRadius:10, padding:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.5rem', flexWrap:'wrap' }}>
                <span style={{ background:`${statusColors[result.status]||'#9ca3af'}22`, color:statusColors[result.status]||'#9ca3af', fontSize:'0.68rem', fontWeight:700, padding:'3px 8px', borderRadius:4, letterSpacing:1 }}>
                  {(result.status||'').toUpperCase()}
                </span>
                <span style={{ fontFamily:'monospace', color:'white', fontWeight:600, fontSize:'0.82rem' }}>{result.trackingId}</span>
              </div>
              <div style={{ fontSize:'0.78rem', color:'#9ca3af', marginBottom:'0.25rem' }}>{result.origin} → {result.destination} · {result.serviceType}</div>
              <StepTracker status={result.status} dark={true} />
              <div style={{ marginTop:'1rem' }}>
                {result.trackingEvents?.map((ev, i) => (
                  <div key={i} style={{ display:'flex', gap:12, position:'relative' }}>
                    {i < result.trackingEvents.length-1 && (
                      <div style={{ position:'absolute', left:8, top:20, width:1, height:'calc(100%)', background:'rgba(255,255,255,.1)' }} />
                    )}
                    <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, marginTop:2, background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {i < result.trackingEvents.length-1 && (
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                      )}
                    </div>
                    <div style={{ paddingBottom:14 }}>
                      <div style={{ fontSize:'0.78rem', fontWeight:600, color:'white' }}>{ev.status} — {ev.location}</div>
                      <div style={{ fontSize:'0.68rem', color:'#6b7280', marginTop:2 }}>{new Date(ev.timestamp).toLocaleString('en-IN')} {ev.gpsActive && '· GPS'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {result.gpsEnabled && (
                <div style={{ marginTop:'0.5rem', display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.7rem', fontWeight:600, color:'#22c55e', background:'rgba(34,197,94,.1)', padding:'4px 8px', borderRadius:4 }}>
                  <span className="dot-blink" style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                  GPS Active
                </div>
              )}
              <ShipmentDetailCard shipment={result} compact />
              <DownloadActions shipment={result} />
              <button onClick={() => { setResult(null); setTid(''); setErr(''); }}
                style={{ marginTop:'0.75rem', background:'transparent', border:'1px solid rgba(255,255,255,.15)', color:'#9ca3af', padding:'5px 12px', borderRadius:4, fontSize:'0.72rem', cursor:'pointer', width:'100%' }}>
                ← Track Another
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};


/* ─── SERVICES ──────────────────────────────────────────────────── */
const SvcIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="#e85d04"><path d={d} /></svg>
);
const SERVICES = [
  { title:'Handcarry Services',     desc:'Person-to-person handcarry for time-critical and sensitive shipments.', d:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
  { title:'DV (Dedicated Vehicle)',  desc:'GPS-mandatory DV service with full digital enablement and live tracking.', d:'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' },
  { title:'Surface Express',         desc:'Pan-India road freight via Hub & Spoke network with on-time guarantee.', d:'M1 16h2c0 1.66 1.34 3 3 3s3-1.34 3-3h8c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-3c0-.55-.22-1.05-.59-1.41L21 9H17V7c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v9zm5 1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 10.5h3.5l1.5 2H17v-2z' },
  { title:'Air Cargo',               desc:'Priority air freight with next-day delivery to major metro cities.', d:'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z' },
  { title:'Secure Cargo',            desc:'High-value cargo handled with tamper-proof packaging and chain of custody.', d:'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4c1.4 0 2.5 1.1 2.5 2.5S13.4 10 12 10s-2.5-1.1-2.5-2.5S10.6 5 12 5zm5 9.58c0 2.91-2.09 5.63-5 6.32-2.91-.69-5-3.41-5-6.32V13.4c0-.41.22-.79.57-.99l4-2.22c.27-.15.59-.15.86 0l4 2.22c.35.2.57.58.57.99v1.18z' },
  { title:'E-Commerce Fulfillment',  desc:'Automated POD, return management and daily reporting for online sellers.', d:'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H16c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20.5 4H5.21L4.27 2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z' },
];

const Services = () => (
  <section id="services" className="re-section" style={{ background:'#f4f1ec', padding:'5rem 2rem' }}>
    <div style={{ maxWidth:1200, margin:'0 auto' }}>
      <Tag c="Our Services" />
      <H2 c="End-to-End Logistics Solutions" />
      <Sub c="From handcarry couriers to bulk surface freight, we cover every mode of cargo movement." />
      <div className="services-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1.5rem', marginTop:'3rem' }}>
        {SERVICES.map(s => (
          <div key={s.title} className="re-card-hover" style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, padding:'1.8rem', textAlign:'center' }}>
            <div style={{ width:56, height:56, background:'rgba(232,93,4,.1)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
              <SvcIcon d={s.d} />
            </div>
            <div style={{ fontWeight:700, marginBottom:'0.5rem', color:'#0a1628' }}>{s.title}</div>
            <div style={{ fontSize:'0.82rem', color:'#6b7280', lineHeight:1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── WHY CHOOSE US ─────────────────────────────────────────────── */
const WHY = [
  { icon:'⚡', title:'On-Time Delivery',       stat:'99.2%', statLabel:'On-Time Rate',     desc:'We track committed delivery dates relentlessly. Every delay costs our clients money — and we treat it that way.' },
  { icon:'📡', title:'Live GPS Every Shipment',  stat:'2 min', statLabel:'Update Interval',    desc:'All DV vehicles carry mandatory GPS devices with live location broadcast — so you always know where your cargo is.' },
  { icon:'🔒', title:'Tamper-Proof Security',    stat:'100%',  statLabel:'Sealed Consignments', desc:'Chain-of-custody documentation, tamper-evident seals, and digital POD at every handoff for zero ambiguity.' },
  { icon:'📊', title:'Daily MIS Intelligence',  stat:'24h',  statLabel:'Report Turnaround',  desc:'Automated daily MIS reports covering volumes, TAT, exceptions, and region-wise performance — straight to your inbox.' },
  { icon:'🌐', title:'East-India Network',        stat:'250+',  statLabel:'Cities Covered',     desc:'Hub & Spoke infrastructure spanning every major metro and tier-2 city, with rapid expansion underway in the North.' },
  { icon:'🤝', title:'Dedicated Account Manager', stat:'1:1',  statLabel:'Client Support',      desc:'Every client gets a named point of contact who owns your SLA — not a ticket queue.' },
];

const WhyChooseUs = () => (
  <section id="why" className="re-section" style={{ background:'#0a1628', padding:'5rem 2rem', position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', left:-200, top:-200, width:600, height:600, background:'radial-gradient(circle,rgba(232,93,4,.08) 0%,transparent 65%)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', right:-100, bottom:-100, width:400, height:400, background:'radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 65%)', pointerEvents:'none' }} />
    <div style={{ maxWidth:1200, margin:'0 auto', position:'relative' }}>
      <Tag c="Why Choose Us" />
      <H2 c={<>The Rahul Enterprise<br />Difference</>} light />
      <Sub c="We don't just move cargo — we move it with accountability, technology, and a relentless focus on on-time performance." light />
      <div className="why-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem', marginTop:'3rem' }}>
        {WHY.map(w => (
          <div key={w.title} className="re-why-card" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:14, padding:'1.75rem', cursor:'default' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
              <div style={{ width:52, height:52, background:'rgba(232,93,4,.12)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>{w.icon}</div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#e85d04', lineHeight:1 }}>{w.stat}</div>
                <div style={{ fontSize:'0.65rem', color:'#6b7280', letterSpacing:1, textTransform:'uppercase' }}>{w.statLabel}</div>
              </div>
            </div>
            <div style={{ fontWeight:700, color:'white', fontSize:'0.95rem', marginBottom:'0.5rem' }}>{w.title}</div>
            <div style={{ fontSize:'0.82rem', color:'#9ca3af', lineHeight:1.65 }}>{w.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:'3rem', background:'linear-gradient(135deg,rgba(232,93,4,.15),rgba(232,93,4,.05))', border:'1px solid rgba(232,93,4,.25)', borderRadius:14, padding:'2rem 2.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1.5rem' }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'white', lineHeight:1, marginBottom:6 }}>Ready to upgrade your logistics?</div>
          <div style={{ fontSize:'0.88rem', color:'#9ca3af' }}>Join 500+ businesses already running on Rahul Enterprise's Standard network.</div>
        </div>
        <a href="#contact" style={{ background:'#e85d04', color:'white', padding:'0.9rem 2.2rem', borderRadius:6, fontWeight:700, textDecoration:'none', fontSize:'0.9rem', whiteSpace:'nowrap' }}>Get a Free Quote →</a>
      </div>
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   COVERAGE SECTION
   ═══════════════════════════════════════════════════════════════ */
const CoverageSection = () => {
  // ── Simple state list shown on the right side of the map card ──
  const COVERAGE_STATES = [
    'West Bengal (Origin Hub)',
    'Bihar',
    'Odisha',
    'Jharkhand',
    'Assam',
    'Bhutan',
    'Arunachal Pradesh',
    'Nepal',
    'Nagaland',
    'Manipur',
    'Mizoram',
    'Meghalaya',
    'Tripura',
    'Sikkim',
  ];

  return (
    <section id="coverage" className="re-section" style={{ background:'#122040', padding:'5rem 2rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:-150, bottom:-100, width:500, height:500, background:'radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 65%)', pointerEvents:'none' }} />
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <Tag c="East India Coverage" />
        <H2 c={<>All Major Cities &<br />All Districts</>} light />
        <Sub c="Complete coverage across West Bengal, Bihar, Jharkhand, Odisha, Assam and the wider Northeast — every state, every city, door to door." light />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, padding:12, background:'#050e1a', borderRadius:16, marginTop:'3rem' }} className="cover-grid">

          {/* ── MAP IMAGE PANEL ── */}
          <div style={{ background:'#0b1a30', borderRadius:12, border:'1px solid rgba(255,255,255,.07)', overflow:'hidden', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 15px 9px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              <span className="re-blink-dot" style={{ width:7, height:7, borderRadius:'50%', background:'#e85d04', display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'#6b7280' }}>East India Logistics Network</span>
              <div style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, color:'#22c55e', background:'rgba(34,197,94,.1)', padding:'3px 9px', borderRadius:4 }}>
                <span className="re-blink-dot" style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                GPS Active
              </div>
            </div>
            <img src="/map3.jpeg" alt="India East Zone Coverage Map" style={{ width:'100%', display:'block', objectFit:'cover', objectPosition:'center top' }} />
          </div>

          {/* ── INFO PANEL ── */}
          <div style={{ background:'#0b1a30', borderRadius:12, border:'1px solid rgba(255,255,255,.07)', padding:15, display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
            <div style={{ fontSize:19, fontWeight:800, color:'white', lineHeight:1.15, paddingBottom:9, borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              EAST INDIA<br/>
              <span style={{ color:'#e85d04', fontSize:14, letterSpacing:1 }}>COVERAGE NETWORK</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {COVERAGE_STATES.map(state => (
                <div key={state}
                  style={{
                    display:'flex', alignItems:'center', gap:9,
                    padding:'9px 12px', borderRadius:8,
                    background:'rgba(255,255,255,.03)',
                    border:'1px solid rgba(255,255,255,.07)',
                  }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#e85d04', flexShrink:0 }} />
                  <span style={{ fontSize:12.5, fontWeight:600, color:'white' }}>{state}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:3 }}>
              {['Pan India Network','Door to Door','GPS Tracking','On-Time Delivery','Affordable Rates'].map(f => (
                <span key={f} style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'#ccc' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   CONTACT SECTION
   ═══════════════════════════════════════════════════════════════ */
const Contact = () => {
  const [form, setForm] = useState({ name:'', company:'', phone:'', email:'', service:'', message:'' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.name || !form.phone || !form.email || !form.service) { setStatus('error'); return; }
    setLoading(true); setStatus('');
    try {
      const templateParams = {
        from_name: form.name,
        company_name: form.company,
        phone_number: form.phone,
        reply_to: form.email,
        service_required: form.service,
        message: form.message,
      };
      await emailjs.send('service_xbkbp5c', 'template_ukznrm8', templateParams, 'fs5y1Qo9OC5vBhp9S');
      try { await API.post('/quotes', form); } catch(e) { console.warn('Backend logging skipped.'); }
      setStatus('success');
      setForm({ name:'', company:'', phone:'', email:'', service:'', message:'' });
    } catch(e) {
      console.error('EmailJS Error:', e);
      setStatus('error');
    } finally { setLoading(false); }
  };

  const contactDetails = [
    { icon:'📍', label:'Head Office',     lines:['6, Porabazar Lane, Kolkata, West Bengal 700 020 — India'] },
    { icon:'📞', label:'Phone / WhatsApp', lines:['+91 98314 99345', '+91 85219 29774', '+91 9163189573', '+91 8777432963'] },
    { icon:'✉️', label:'Email',            lines:['rahulenterprise123@gmail.com'] },
    { icon:'🕐', label:'Working Hours',    lines:['Mon – Sun: 24 Hours Service Available'] },
  ];

  return (
    <section id="contact" className="re-section" style={{ background:'#0a1628', padding:'5rem 2rem' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <Tag c="Get In Touch" />
        <H2 c={<>Request a Quote<br />or Get a Demo</>} light />
        <Sub c="Share your requirements and we'll send a full proposal with GE-standard compliance details." light />

        <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1.25fr', gap:'4rem', marginTop:'3rem' }}>

          {/* ── LEFT: Contact Details ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {contactDetails.map(({ icon, label, lines }) => (
              <div key={label} className="re-contact-info-item">
                <div className="re-contact-info-icon">{icon}</div>
                <div>
                  <div style={{ fontSize:'0.7rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:'1.5px', fontWeight:700, marginBottom:5 }}>{label}</div>
                  {lines.map(v => (
                    <div key={v} style={{ color:'#e5e7eb', fontSize:'0.88rem', lineHeight:1.6 }}>{v}</div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ marginTop:'0.5rem', background:'linear-gradient(135deg,rgba(232,93,4,0.12),rgba(232,93,4,0.05))', border:'1px solid rgba(232,93,4,0.2)', borderRadius:10, padding:'1.25rem 1.5rem' }}>
              <div style={{ fontSize:'0.78rem', color:'#9ca3af', marginBottom:6 }}>GSTIN Number:</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'white', lineHeight:1 }}>
                <span style={{ color:'#e85d04' }}>19ATEPR8464L1ZT</span>
              </div>
              <div style={{ fontSize:'0.78rem', color:'#6b7280', marginTop:6 }}>Goods and Services Tax.</div>
            </div>
          </div>

          {/* ── RIGHT: Contact Form ── */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:'2rem' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', color:'white', marginBottom:'1.5rem', letterSpacing:0.5 }}>Send a Request</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['name','Your Name *','Full Name'],['company','Company','Company Name']].map(([n,l,p]) => (
                <div key={n}>
                  <label style={{ fontSize:'0.75rem', color:'#9ca3af', display:'block', marginBottom:'0.4rem', fontWeight:600, letterSpacing:'0.5px' }}>{l}</label>
                  <input name={n} value={form[n]} onChange={onChange} placeholder={p} className="re-contact-input" />
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['phone','Phone *','+91 XXXXX XXXXX'],['email','Email *','your@email.com']].map(([n,l,p]) => (
                <div key={n}>
                  <label style={{ fontSize:'0.75rem', color:'#9ca3af', display:'block', marginBottom:'0.4rem', fontWeight:600, letterSpacing:'0.5px' }}>{l}</label>
                  <input name={n} value={form[n]} onChange={onChange} placeholder={p} className="re-contact-input" />
                </div>
              ))}
            </div>

            <label style={{ fontSize:'0.75rem', color:'#9ca3af', display:'block', marginBottom:'0.4rem', fontWeight:600, letterSpacing:'0.5px' }}>Service Required *</label>
            <div className="re-contact-select-wrap">
              <select name="service" value={form.service} onChange={onChange} className="re-contact-input">
                <option value="">Select a Service</option>
                {['Handcarry Services','DV (Door-to-Vehicle)','Surface Express','Air Cargo','MIS Reporting Setup','Full GE Standard Package'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <svg className="re-contact-select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="#9ca3af"><path d="M7 10l5 5 5-5z"/></svg>
            </div>

            <label style={{ fontSize:'0.75rem', color:'#9ca3af', display:'block', marginBottom:'0.4rem', fontWeight:600, letterSpacing:'0.5px' }}>Message / Requirements</label>
            <textarea name="message" value={form.message} onChange={onChange} placeholder="Describe your shipment volume, routes, and specific requirements…" className="re-contact-input" style={{ resize:'vertical', minHeight:100 }} />

            {status === 'success' && (
              <div style={{ marginBottom:'1rem', padding:'0.85rem 1rem', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:6, color:'#4ade80', fontSize:'0.84rem', display:'flex', alignItems:'center', gap:8 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#4ade80"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                Request sent! We'll contact you within 2 hours.
              </div>
            )}
            {status === 'error' && (
              <div style={{ marginBottom:'1rem', padding:'0.85rem 1rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, color:'#fca5a5', fontSize:'0.84rem', display:'flex', alignItems:'center', gap:8 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#fca5a5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Please fill all required fields correctly.
              </div>
            )}

            <button onClick={submit} disabled={loading} className="re-contact-submit">
              {loading ? 'Sending…' : 'Send Request for Quote →'}
            </button>
            <div style={{ textAlign:'center', marginTop:'0.85rem', fontSize:'0.74rem', color:'#374151' }}>
              No spam. Direct response from our logistics team.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── HOME PAGE ─────────────────────────────────────────────────── */
const Home = () => (
  <>
    <GlobalStyles />
    <Hero />
    <Services />
    <WhyChooseUs />
    <CoverageSection />
    <Contact />
    <SlidingTracker />
  </>
);

export default Home;
