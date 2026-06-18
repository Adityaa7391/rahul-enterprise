import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import ChangePassword from './changepass';

const SERVICE_TYPES = ['Handcarry', 'Dedicated Vehicle', 'Surface Express', 'Air Cargo', 'Secure Cargo'];

const EMPTY_FORM = {
  cnNumber: '',
  challanNumber: '',
  origin: '',
  destination: '',
  serviceType: 'Surface Express',
  dispatchDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '',
};

const fmtDate = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d)) return '—';
  const dd  = String(d.getDate()).padStart(2, '0');
  const mmm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = (process.env.REACT_APP_API_URL || '').replace(/\/api$/, '');
  return `${base}${url}`;
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('shipments');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newShipment, setNewShipment] = useState(EMPTY_FORM);
  const [addMsg, setAddMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editShipment, setEditShipment] = useState(null);
  const [editMsg, setEditMsg] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [shipmentSearch, setShipmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [misSearch, setMisSearch] = useState('');
  const [misFilter, setMisFilter] = useState('all');

  const [viewImages, setViewImages] = useState(null);
  const [viewIndex, setViewIndex] = useState(0);

  // Upload Image modal
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [deletingImageId, setDeletingImageId] = useState(null);
  const uploadModalInputRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') { navigate('/client'); return; }
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchAll = async () => {
    try {
      const res = await API.get('/shipments?limit=1000');
      setShipments(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!uploadTarget) return;
    const fresh = shipments.find(s => s._id === uploadTarget._id);
    if (fresh) setUploadTarget(fresh);
  }, [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShipments = shipments.filter(s => {
    const d = s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '';
    return d === todayStr;
  });
  const todayStats = {
    total:     todayShipments.length,
    delivered: todayShipments.filter(s => s.status === 'Delivered').length,
    inTransit: todayShipments.filter(s => s.status === 'In Transit').length,
    dvActive:  todayShipments.filter(s => s.serviceType === 'Dedicated Vehicle').length,
    pending:   todayShipments.filter(s => ['Booked','Picked Up','In Transit','Out for Delivery'].includes(s.status)).length,
  };
  const allStats = {
    total:     shipments.length,
    delivered: shipments.filter(s => s.status === 'Delivered').length,
    inTransit: shipments.filter(s => s.status === 'In Transit').length,
    dvActive:  shipments.filter(s => s.serviceType === 'Dedicated Vehicle').length,
    pending:   shipments.filter(s => ['Booked','Picked Up','In Transit','Out for Delivery'].includes(s.status)).length,
  };

  const filteredShipments = shipments.filter(s => {
    const matchSearch = shipmentSearch.trim()
      ? (s.trackingId?.toLowerCase().includes(shipmentSearch.trim().toLowerCase()) ||
         s.challanNumber?.toLowerCase().includes(shipmentSearch.trim().toLowerCase()))
      : true;
    const matchStatus = statusFilter === 'all' ? true : s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getFilterCutoff = () => {
    const now = new Date(); now.setHours(0,0,0,0);
    if (misFilter === '7d')  { now.setDate(now.getDate() - 6);   return now; }
    if (misFilter === '30d') { now.setDate(now.getDate() - 29);  return now; }
    if (misFilter === '6m')  { now.setMonth(now.getMonth() - 6); return now; }
    return null;
  };
  const filterCutoff = getFilterCutoff();
  const allDelivered = shipments.filter(s => {
    if (s.status !== 'Delivered') return false;
    if (!filterCutoff) return true;
    const d = s.createdAt ? new Date(s.createdAt) : null;
    return d && d >= filterCutoff;
  });
  const filteredDelivered = misSearch.trim()
    ? allDelivered.filter(s =>
        s.trackingId?.toLowerCase().includes(misSearch.trim().toLowerCase()) ||
        s.challanNumber?.toLowerCase().includes(misSearch.trim().toLowerCase()))
    : allDelivered;
  const deliveredByDate = filteredDelivered.reduce((acc, s) => {
    const key = s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const deliveredDates = Object.keys(deliveredByDate).sort((a,b) => b.localeCompare(a));

  const resetAddForm = () => {
    setNewShipment(EMPTY_FORM);
    setShowAddForm(false);
    setAddMsg('');
  };

  const handleAddShipment = async () => {
    if (!newShipment.cnNumber || !newShipment.challanNumber || !newShipment.origin || !newShipment.destination) {
      setAddMsg('CN Number, Challan Number, Origin, and Destination are required.');
      return;
    }
    try {
      setUploading(true);
      setAddMsg('Creating shipment...');
      await API.post('/shipments', {
        trackingId:    newShipment.cnNumber.trim(),
        challanNumber: newShipment.challanNumber.trim(),
        origin:        newShipment.origin.trim(),
        destination:   newShipment.destination.trim(),
        serviceType:   newShipment.serviceType,
        bookingDate:   newShipment.dispatchDate,
        estimatedDelivery: newShipment.expectedDeliveryDate || undefined,
        sender:   { name: 'N/A', email: '' },
        receiver: { name: 'N/A', email: '' },
      });
      setAddMsg(`Shipment created: ${newShipment.cnNumber.trim()}.`);
      setNewShipment(EMPTY_FORM);
      setShowAddForm(false);
      fetchAll();
    } catch (e) {
      setAddMsg('Error: ' + (e.response?.data?.message || e.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteShipment = async (id, trackingId) => {
    if (!window.confirm(`Permanently delete "${trackingId}"? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await API.delete(`/shipments/${id}`);
      await fetchAll();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.message || e.message));
    } finally { setDeleting(false); }
  };

  const handleDeleteAllFiltered = async () => {
    const count = filteredShipments.length;
    if (count === 0) return;
    const label = statusFilter === 'all' ? 'ALL' : `all "${statusFilter}"`;
    if (!window.confirm(`WARNING: ${label} ${count} shipments will be permanently deleted. Are you sure?`)) return;
    if (!window.confirm(`CONFIRM: ${count} shipments will be deleted. This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await Promise.all(filteredShipments.map(s => API.delete(`/shipments/${s._id}`)));
      await fetchAll();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.message || e.message));
    } finally { setDeleting(false); }
  };

  const handleDeleteMisShipment = async (id, trackingId) => {
    if (!window.confirm(`Permanently delete "${trackingId}" from MIS? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await API.delete(`/shipments/${id}`);
      await fetchAll();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.message || e.message));
    } finally { setDeleting(false); }
  };

  const handleDeleteAllDelivered = async () => {
    const count = filteredDelivered.length;
    if (count === 0) return;
    const period = { all:'All Time', '7d':'Last 7 Days', '30d':'Last 30 Days', '6m':'Last 6 Months' }[misFilter];
    if (!window.confirm(`WARNING: ${period} — ${count} delivered shipments will be permanently deleted.`)) return;
    if (!window.confirm(`CONFIRM: ${count} delivered shipments will be deleted. This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await Promise.all(filteredDelivered.map(s => API.delete(`/shipments/${s._id}`)));
      await fetchAll();
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.message || e.message));
    } finally { setDeleting(false); }
  };

  const openEdit = (s) => {
    setEditShipment({
      _id:          s._id,
      cnNumber:     s.trackingId || '',
      challanNumber: s.challanNumber || '',
      origin:       s.origin || '',
      destination:  s.destination || '',
      serviceType:  s.serviceType || 'Surface Express',
      dispatchDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : todayStr,
      expectedDeliveryDate: s.estimatedDelivery ? new Date(s.estimatedDelivery).toISOString().split('T')[0] : '',
    });
    setEditMsg('');
    setEditSaving(false);
  };

  const handleEditSave = async () => {
    if (!editShipment.cnNumber || !editShipment.challanNumber || !editShipment.origin || !editShipment.destination) {
      setEditMsg('All fields are required.');
      return;
    }
    setEditSaving(true); setEditMsg('');
    try {
      await API.put(`/shipments/${editShipment._id}`, {
        trackingId:    editShipment.cnNumber.trim(),
        challanNumber: editShipment.challanNumber.trim(),
        origin:        editShipment.origin.trim(),
        destination:   editShipment.destination.trim(),
        serviceType:   editShipment.serviceType,
        bookingDate:   editShipment.dispatchDate,
        estimatedDelivery: editShipment.expectedDeliveryDate || undefined,
      });
      setEditMsg('Saved successfully.');
      setTimeout(() => { setEditShipment(null); fetchAll(); }, 700);
    } catch (e) {
      setEditMsg('Error: ' + (e.response?.data?.message || e.message));
      setEditSaving(false);
    }
  };

  const downloadExcel = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0,0,0,0);
    const yearData = shipments.filter(s => {
      if (s.status !== 'Delivered') return false;
      const d = s.createdAt ? new Date(s.createdAt) : null;
      return d && d >= oneYearAgo;
    }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const headers = ['CN Number','Challan Number','Dispatch Date','Expected Delivery','Origin','Destination','Service Type','Status'];
    const rows = yearData.map(s => [
      '\t'+(s.trackingId||''), '\t'+(s.challanNumber||''),
      fmtDate(s.createdAt), fmtDate(s.estimatedDelivery),
      s.origin||'', s.destination||'', s.serviceType||'', s.status||'',
    ]);
    const csv = [
      headers.map(h=>`"${h}"`).join(','),
      ...rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `MIS_Report_${fmtDate(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const updateShipmentStatus = async (id, status, location) => {
    try {
      await API.put(`/shipments/${id}/status`, {
        status, location: location || 'Hub',
        description: `Status updated to ${status}`,
      });
      fetchAll();
    } catch (e) { alert('Status update failed'); }
  };

  const openViewer = (s) => {
    const urls = (s.images || []).map(img => resolveImageUrl(img.url));
    if (urls.length === 0) return;
    setViewImages({ trackingId: s.trackingId, images: urls });
    setViewIndex(0);
  };

  const openUploadModal = (s) => {
    if (s.status !== 'Delivered') return;
    setUploadTarget(s);
    setUploadFile(null);
    setUploadMsg('');
    setDeletingImageId(null);
  };

  const closeUploadModal = () => {
    if (uploadFile?.preview) URL.revokeObjectURL(uploadFile.preview);
    setUploadTarget(null);
    setUploadFile(null);
    setUploadMsg('');
    setDeletingImageId(null);
  };

  const handleUploadFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (uploadFile?.preview) URL.revokeObjectURL(uploadFile.preview);
    setUploadFile({ file, preview: URL.createObjectURL(file), name: file.name });
    setUploadMsg('');
  };

  const handleUploadImageSubmit = async () => {
    if (!uploadTarget || !uploadFile) return;
    setUploadingImage(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('images', uploadFile.file);
      await API.post(`/shipments/${uploadTarget._id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadFile?.preview) URL.revokeObjectURL(uploadFile.preview);
      setUploadFile(null);
      setUploadMsg('Image uploaded successfully.');
      await fetchAll();
    } catch (e) {
      setUploadMsg('Error: ' + (e.response?.data?.message || e.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteUploadedImage = async (imageId) => {
    if (!uploadTarget) return;
    if (!window.confirm('Remove this image permanently?')) return;
    setDeletingImageId(imageId);
    try {
      await API.delete(`/shipments/${uploadTarget._id}/images/${imageId}`);
      setUploadMsg('Image removed.');
      await fetchAll();
    } catch (e) {
      setUploadMsg('Error: ' + (e.response?.data?.message || e.message));
    } finally {
      setDeletingImageId(null);
    }
  };

  // ── Styles ──
  const inputStyle = {
    padding:'0.7rem', border:'1px solid #e8e4dc', borderRadius:6,
    fontFamily:'inherit', fontSize:'0.85rem', outline:'none',
    background:'white', width:'100%', boxSizing:'border-box',
  };
  const labelStyle = {
    fontSize:'0.72rem', color:'#6b7280', textTransform:'uppercase',
    letterSpacing:0.5, fontWeight:600,
  };
  const searchStyle = {
    padding:'0.6rem 1rem 0.6rem 2.4rem', border:'1px solid #e8e4dc',
    borderRadius:8, fontFamily:'inherit', fontSize:'0.85rem',
    outline:'none', background:'white', width:220,
  };
  const statusColor = {
    'Delivered':'#22c55e','In Transit':'#f48c06','Out for Delivery':'#3b82f6',
    'Booked':'#9ca3af','Picked Up':'#e85d04','Failed':'#ef4444','Returned':'#8b5cf6',
  };
  const filterBtnStyle = (active) => ({
    padding:'0.4rem 0.9rem', borderRadius:6, fontSize:'0.78rem', fontWeight:600,
    cursor:'pointer', border: active ? '1px solid rgba(232,93,4,.5)' : '1px solid #e8e4dc',
    background: active ? 'rgba(232,93,4,.1)' : 'white',
    color: active ? '#e85d04' : '#6b7280', transition:'0.15s',
  });
  const deleteAllBtnStyle = {
    display:'flex', alignItems:'center', gap:'0.4rem',
    background: deleting ? '#9ca3af' : '#fee2e2',
    border:'1px solid #fca5a5', color: deleting ? 'white' : '#ef4444',
    padding:'0.5rem 1rem', borderRadius:6, cursor: deleting ? 'not-allowed' : 'pointer',
    fontWeight:700, fontSize:'0.8rem', whiteSpace:'nowrap',
  };

  const existingImages = uploadTarget?.images || [];
  const canUploadMore = existingImages.length < 1;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a1628', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#e85d04', fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem' }}>Loading Dashboard...</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f4f1ec', display:'flex', flexDirection:'column' }}>

      {/* Image Viewer Modal */}
      {viewImages && (
        <div onClick={() => setViewImages(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0a1628', borderRadius:14, padding:'1.5rem', maxWidth:740, width:'100%', maxHeight:'92vh', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'white', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.2rem' }}>
                {viewImages.trackingId} — Image {viewIndex + 1} / {viewImages.images.length}
              </span>
              <button onClick={() => setViewImages(null)} style={{ background:'transparent', border:'none', color:'#9ca3af', fontSize:'1.5rem', cursor:'pointer' }}>✕</button>
            </div>
            <img src={viewImages.images[viewIndex]} alt={`Shipment image ${viewIndex + 1}`}
              style={{ width:'100%', maxHeight:'66vh', objectFit:'contain', borderRadius:8, background:'#122040' }} />
            {viewImages.images.length > 1 && (
              <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
                {viewImages.images.map((img, i) => (
                  <img key={i} src={img} alt={`thumb-${i}`} onClick={() => setViewIndex(i)}
                    style={{ width:58, height:58, objectFit:'cover', borderRadius:6, cursor:'pointer',
                      border: i === viewIndex ? '2px solid #e85d04' : '2px solid transparent',
                      opacity: i === viewIndex ? 1 : 0.55, transition:'0.15s' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editShipment && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:14, padding:'2rem', width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'#0a1628', margin:0 }}>Edit Shipment</h3>
              <button onClick={() => setEditShipment(null)} style={{ background:'transparent', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#9ca3af' }}>✕</button>
            </div>
            {editMsg && (
              <div style={{ marginBottom:'1rem', padding:'0.7rem 1rem',
                background: editMsg.startsWith('Saved') ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                borderRadius:6, color: editMsg.startsWith('Saved') ? '#22c55e' : '#ef4444', fontSize:'0.83rem' }}>
                {editMsg}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['cnNumber','CN Number'],['challanNumber','Challan Number'],['origin','Origin City'],['destination','Destination City']].map(([k,lbl]) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                  <label style={labelStyle}>{lbl}</label>
                  <input value={editShipment[k]} onChange={e => setEditShipment({...editShipment,[k]:e.target.value})} style={inputStyle} />
                </div>
              ))}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                <label style={labelStyle}>Service Type</label>
                <select value={editShipment.serviceType} onChange={e => setEditShipment({...editShipment,serviceType:e.target.value})} style={inputStyle}>
                  {SERVICE_TYPES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                <label style={labelStyle}>Dispatch Date</label>
                <input type="date" value={editShipment.dispatchDate} onChange={e => setEditShipment({...editShipment,dispatchDate:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                <label style={labelStyle}>Expected Delivery Date</label>
                <input type="date" value={editShipment.expectedDeliveryDate} onChange={e => setEditShipment({...editShipment,expectedDeliveryDate:e.target.value})} style={inputStyle} min={editShipment.dispatchDate || undefined} />
              </div>
            </div>
            <div style={{ marginTop:'1.5rem', display:'flex', gap:'0.75rem' }}>
              <button onClick={handleEditSave} disabled={editSaving}
                style={{ background: editSaving ? '#9ca3af' : '#e85d04', color:'white', border:'none', padding:'0.65rem 1.4rem', borderRadius:4, cursor: editSaving ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditShipment(null)} style={{ background:'#f4f1ec', color:'#6b7280', border:'1px solid #e8e4dc', padding:'0.65rem 1.2rem', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {uploadTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:14, padding:'2rem', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
              <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'#0a1628', margin:0 }}>Shipment Image</h3>
              <button onClick={closeUploadModal} style={{ background:'transparent', border:'none', fontSize:'1.4rem', cursor:'pointer', color:'#9ca3af' }}>✕</button>
            </div>
            <div style={{ fontSize:'0.78rem', color:'#9ca3af', marginBottom:'1.4rem' }}>
              CN <span style={{ fontFamily:'monospace', color:'#0a1628', fontWeight:700 }}>{uploadTarget.trackingId}</span> — Delivered
            </div>

            {uploadMsg && (
              <div style={{ marginBottom:'1rem', padding:'0.7rem 1rem',
                background: uploadMsg.startsWith('Image uploaded') || uploadMsg.startsWith('Image removed') ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
                borderRadius:6,
                color: uploadMsg.startsWith('Image uploaded') || uploadMsg.startsWith('Image removed') ? '#22c55e' : '#ef4444',
                fontSize:'0.83rem' }}>
                {uploadMsg}
              </div>
            )}

            {existingImages.length > 0 && (
              <div style={{ marginBottom:'1.4rem' }}>
                <div style={{ fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.6rem' }}>
                  Uploaded Image
                </div>
                {existingImages.map(img => (
                  <div key={img._id} style={{ display:'flex', gap:'0.9rem', alignItems:'center', background:'#fafafa', border:'1px solid #e8e4dc', borderRadius:10, padding:'0.75rem', marginBottom:'0.5rem' }}>
                    <div
                      onClick={() => { setViewImages({ trackingId: uploadTarget.trackingId, images: [resolveImageUrl(img.url)] }); setViewIndex(0); }}
                      style={{ position:'relative', width:72, height:72, flexShrink:0, borderRadius:8, overflow:'hidden', border:'1px solid #e8e4dc', cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}
                      title="Click to preview">
                      <img src={resolveImageUrl(img.url)} alt="uploaded"
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.28)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}>
                        <span style={{ color:'white', fontSize:'1.1rem', pointerEvents:'none' }}>🔍</span>
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.8rem', color:'#0a1628', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {img.originalName || 'Shipment image'}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'#9ca3af', marginTop:2 }}>
                        Uploaded {img.uploadedAt ? fmtDate(img.uploadedAt) : '—'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUploadedImage(img._id)}
                      disabled={deletingImageId === img._id}
                      style={{ padding:'0.38rem 0.7rem', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:5,
                        fontSize:'0.72rem', fontWeight:600, color:'#ef4444',
                        cursor: deletingImageId === img._id ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
                        opacity: deletingImageId === img._id ? 0.6 : 1 }}>
                      {deletingImageId === img._id ? 'Removing...' : '🗑️ Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canUploadMore ? (
              <>
                <div style={{ fontSize:'0.72rem', color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:'0.6rem' }}>
                  {existingImages.length === 0 ? 'Upload Image' : 'Replace Image'}
                </div>

                {!uploadFile ? (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
                      if (file) { if (uploadFile?.preview) URL.revokeObjectURL(uploadFile.preview); setUploadFile({ file, preview: URL.createObjectURL(file), name: file.name }); setUploadMsg(''); }
                    }}
                    onClick={() => uploadModalInputRef.current?.click()}
                    style={{ border:'2px dashed #d4cfc4', borderRadius:10, padding:'1.8rem 1.5rem', textAlign:'center', cursor:'pointer', background:'#fafafa', transition:'border-color 0.2s, background 0.2s', userSelect:'none' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#e85d04'; e.currentTarget.style.background = '#fff8f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4cfc4'; e.currentTarget.style.background = '#fafafa'; }}
                  >
                    <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(232,93,4,.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.7rem' }}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="#e85d04">
                        <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
                      </svg>
                    </div>
                    <div style={{ fontSize:'0.84rem', color:'#374151', fontWeight:600, marginBottom:3 }}>
                      <span style={{ color:'#e85d04' }}>Click to upload</span> or drag and drop
                    </div>
                    <div style={{ fontSize:'0.73rem', color:'#9ca3af' }}>POD / delivery photo · JPG, PNG, WEBP</div>
                    <input ref={uploadModalInputRef} type="file" accept="image/*" onChange={handleUploadFileSelect} style={{ display:'none' }} />
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:'0.9rem', alignItems:'center', background:'#fafafa', border:'1px solid #e8e4dc', borderRadius:10, padding:'0.75rem' }}>
                    <div style={{ position:'relative', width:72, height:72, flexShrink:0, borderRadius:8, overflow:'hidden', border:'1px solid #e8e4dc', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                      <img src={uploadFile.preview} alt={uploadFile.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.83rem', color:'#0a1628', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{uploadFile.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:2 }}>{(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB</div>
                      <button onClick={() => uploadModalInputRef.current?.click()}
                        style={{ marginTop:6, padding:'0.25rem 0.6rem', background:'#f4f1ec', border:'1px solid #e8e4dc', borderRadius:4, fontSize:'0.7rem', color:'#6b7280', cursor:'pointer', fontWeight:600 }}>
                        Choose different image
                      </button>
                    </div>
                    <button onClick={() => { URL.revokeObjectURL(uploadFile.preview); setUploadFile(null); }}
                      style={{ padding:'0.38rem 0.7rem', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:5, fontSize:'0.72rem', fontWeight:600, color:'#ef4444', cursor:'pointer', whiteSpace:'nowrap' }}>
                      Remove
                    </button>
                    <input ref={uploadModalInputRef} type="file" accept="image/*" onChange={handleUploadFileSelect} style={{ display:'none' }} />
                  </div>
                )}

                <div style={{ marginTop:'1.2rem', display:'flex', gap:'0.75rem' }}>
                  <button onClick={handleUploadImageSubmit} disabled={!uploadFile || uploadingImage}
                    style={{ background: (!uploadFile || uploadingImage) ? '#9ca3af' : '#e85d04', color:'white', border:'none', padding:'0.65rem 1.4rem', borderRadius:4, cursor: (!uploadFile || uploadingImage) ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <button onClick={closeUploadModal} style={{ background:'#f4f1ec', color:'#6b7280', border:'1px solid #e8e4dc', padding:'0.65rem 1.2rem', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background:'#fff8f2', border:'1px solid rgba(232,93,4,.25)', borderRadius:8, padding:'0.9rem 1rem', fontSize:'0.82rem', color:'#92400e' }}>
                  Maximum 1 image per shipment. Remove the existing image to upload a new one.
                </div>
                <div style={{ marginTop:'1.2rem' }}>
                  <button onClick={closeUploadModal} style={{ background:'#f4f1ec', color:'#6b7280', border:'1px solid #e8e4dc', padding:'0.65rem 1.2rem', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{ background:'#0a1628', borderBottom:'3px solid #e85d04', padding:'0 2rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'white', letterSpacing:1 }}>
          Rahul <span style={{ color:'#e85d04' }}>Enterprise</span> — Admin
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ color:'#9ca3af', fontSize:'0.82rem' }}>👤 {user?.name}</span>
          <button onClick={() => { logout(); navigate('/'); }}
            style={{ background:'transparent', border:'1px solid rgba(255,255,255,.2)', color:'#ccc', padding:'0.4rem 1rem', borderRadius:4, cursor:'pointer', fontSize:'0.82rem' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1 }}>

        {/* Sidebar */}
        <div style={{ width:220, background:'#122040', padding:'1.5rem 1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {[
            { id:'shipments', label:'📦 Shipments' },
            { id:'mis',       label:'📊 MIS Reports' },
            { id:'settings',  label:'⚙️ Settings' },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ background: tab===item.id ? 'rgba(232,93,4,.2)' : 'transparent', border: tab===item.id ? '1px solid rgba(232,93,4,.4)' : '1px solid transparent', color: tab===item.id ? '#e85d04' : '#9ca3af', padding:'0.75rem 1rem', borderRadius:6, cursor:'pointer', fontSize:'0.85rem', fontWeight:500, textAlign:'left', transition:'0.2s' }}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex:1, padding:'2rem', overflowY:'auto' }}>

          {/* SHIPMENTS TAB */}
          {tab === 'shipments' && (
            <div>
              <div style={{ marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ fontSize:'0.72rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1 }}>
                  {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                </span>
                <span style={{ fontSize:'0.65rem', color:'#6b7280', background:'#e8e4dc', padding:'2px 7px', borderRadius:10 }}>Auto-refresh: 30s</span>
                {deleting && <span style={{ fontSize:'0.65rem', color:'#ef4444', background:'#fee2e2', padding:'2px 8px', borderRadius:10 }}>Deleting...</span>}
              </div>

              <div style={{ fontSize:'0.7rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:'0.5rem', fontWeight:600 }}>Today</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
                {[
                  ['Today Pickups',  todayStats.total,    '#e85d04'],
                  ['Delivered',      todayStats.delivered,'#22c55e'],
                  ['In Transit',     todayStats.inTransit,'#3b82f6'],
                  ['Dedicated Veh.', todayStats.dvActive, '#8b5cf6'],
                  ['Pending',        todayStats.pending,  '#f48c06'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:10, padding:'1rem' }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:c, lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:'0.68rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize:'0.7rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:'0.5rem', fontWeight:600 }}>Total (All Time)</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'0.75rem', marginBottom:'2rem' }}>
                {[
                  ['Total Shipments',allStats.total,    '#e85d04'],
                  ['Delivered',      allStats.delivered,'#22c55e'],
                  ['In Transit',     allStats.inTransit,'#3b82f6'],
                  ['Dedicated Veh.', allStats.dvActive, '#8b5cf6'],
                  ['Pending',        allStats.pending,  '#f48c06'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:10, padding:'1rem' }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:c, lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:'0.68rem', color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <div>
                  <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#0a1628', margin:0 }}>Shipments</h2>
                  <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{filteredShipments.length} shipment{filteredShipments.length!==1?'s':''} found</span>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }}>🔍</span>
                    <input placeholder="CN / Challan search..." value={shipmentSearch} onChange={e => setShipmentSearch(e.target.value)} style={searchStyle} />
                    {shipmentSearch && (
                      <button onClick={() => setShipmentSearch('')}
                        style={{ position:'absolute', right:'0.6rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'1rem' }}>✕</button>
                    )}
                  </div>
                  {filteredShipments.length > 0 && (
                    <button onClick={handleDeleteAllFiltered} disabled={deleting} style={deleteAllBtnStyle}>
                      🗑️ Delete All ({filteredShipments.length})
                    </button>
                  )}
                  <button onClick={() => { setShowAddForm(!showAddForm); setAddMsg(''); }}
                    style={{ background:'#e85d04', color:'white', border:'none', padding:'0.6rem 1.2rem', borderRadius:4, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', whiteSpace:'nowrap' }}>
                    + Add Shipment
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.2rem' }}>
                {['all','Booked','Picked Up','In Transit','Out for Delivery','Delivered','Failed','Returned'].map(st => (
                  <button key={st} onClick={() => setStatusFilter(st)} style={filterBtnStyle(statusFilter===st)}>
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>

              {addMsg && (
                <div style={{ marginBottom:'1rem', padding:'0.8rem 1rem',
                  background: addMsg.startsWith('Shipment') ? 'rgba(34,197,94,.1)' : addMsg.includes('...') ? 'rgba(59,130,246,.1)' : 'rgba(239,68,68,.1)',
                  border:`1px solid ${addMsg.startsWith('Shipment') ? 'rgba(34,197,94,.3)' : addMsg.includes('...') ? 'rgba(59,130,246,.3)' : 'rgba(239,68,68,.3)'}`,
                  borderRadius:6,
                  color: addMsg.startsWith('Shipment') ? '#22c55e' : addMsg.includes('...') ? '#3b82f6' : '#fca5a5',
                  fontSize:'0.85rem' }}>
                  {addMsg}
                </div>
              )}

              {showAddForm && (
                <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, padding:'1.5rem', marginBottom:'1.5rem' }}>
                  <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.4rem', color:'#0a1628', marginBottom:'1rem' }}>New Shipment</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem' }}>
                    {[
                      ['cnNumber','CN Number *','text','e.g. 067895'],
                      ['challanNumber','Challan Number *','text','e.g. 26-27/OS/DC-0054'],
                      ['origin','Origin City *','text','e.g. Kolkata'],
                      ['destination','Destination City *','text','e.g. Patna'],
                    ].map(([k,lbl,type,ph]) => (
                      <div key={k} style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                        <label style={labelStyle}>{lbl}</label>
                        <input placeholder={ph} type={type} value={newShipment[k]} onChange={e => setNewShipment({...newShipment,[k]:e.target.value})} style={inputStyle} />
                      </div>
                    ))}
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                      <label style={labelStyle}>Service Type</label>
                      <select value={newShipment.serviceType} onChange={e => setNewShipment({...newShipment,serviceType:e.target.value})} style={inputStyle}>
                        {SERVICE_TYPES.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                      <label style={labelStyle}>Dispatch Date *</label>
                      <input type="date" value={newShipment.dispatchDate} onChange={e => setNewShipment({...newShipment,dispatchDate:e.target.value})} style={inputStyle} />
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                      <label style={labelStyle}>Expected Delivery Date</label>
                      <input type="date" value={newShipment.expectedDeliveryDate} onChange={e => setNewShipment({...newShipment,expectedDeliveryDate:e.target.value})} style={inputStyle} min={newShipment.dispatchDate || undefined} />
                    </div>
                  </div>
                  <div style={{ marginTop:'1.2rem', display:'flex', gap:'0.75rem' }}>
                    <button onClick={handleAddShipment} disabled={uploading}
                      style={{ background: uploading ? '#9ca3af' : '#e85d04', color:'white', border:'none', padding:'0.65rem 1.4rem', borderRadius:4, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:'0.85rem' }}>
                      {uploading ? 'Creating...' : 'Create Shipment'}
                    </button>
                    <button onClick={resetAddForm}
                      style={{ background:'#f4f1ec', color:'#6b7280', border:'1px solid #e8e4dc', padding:'0.65rem 1.2rem', borderRadius:4, cursor:'pointer', fontSize:'0.85rem' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Shipments Table */}
              <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                    <thead>
                      <tr style={{ background:'#f4f1ec' }}>
                        {['CN Number','Challan No.','Dispatch Date','Exp. Delivery','Route','Service','Status','Actions'].map(h => (
                          <th key={h} style={{ padding:'0.9rem 1rem', textAlign:'left', fontWeight:700, color:'#0a1628', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((s,i) => (
                        <tr key={s._id} style={{ borderTop:'1px solid #f4f1ec', background: i%2===0 ? 'white' : '#fafafa' }}>

                          {/* CN Number + image thumbnail */}
                          <td style={{ padding:'0.8rem 1rem', fontFamily:'monospace', fontWeight:600, color:'#0a1628', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                              {s.trackingId}
                              {s.images?.length > 0 ? (
                                /* ── Professional image chip ── */
                                <button
                                  onClick={() => openViewer(s)}
                                  title="View delivery photo"
                                  style={{
                                    display:'inline-flex', alignItems:'center', gap:5,
                                    background:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.06))',
                                    border:'1px solid rgba(34,197,94,.35)',
                                    borderRadius:6, padding:'3px 8px 3px 4px',
                                    cursor:'pointer', transition:'all 0.15s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg,rgba(34,197,94,.22),rgba(34,197,94,.12))'; e.currentTarget.style.borderColor='rgba(34,197,94,.6)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.06))'; e.currentTarget.style.borderColor='rgba(34,197,94,.35)'; }}
                                >
                                  {/* Mini thumbnail */}
                                  <div style={{ width:20, height:20, borderRadius:3, overflow:'hidden', flexShrink:0, border:'1px solid rgba(34,197,94,.3)' }}>
                                    <img
                                      src={resolveImageUrl(s.images[0].url)}
                                      alt="thumb"
                                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                    />
                                  </div>
                                  <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#16a34a', letterSpacing:0.2 }}>
                                    POD
                                  </span>
                                  {/* Green dot */}
                                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block', flexShrink:0 }} />
                                </button>
                              ) : null}
                            </div>
                          </td>

                          <td style={{ padding:'0.8rem 1rem', fontFamily:'monospace', color:'#6b7280', whiteSpace:'nowrap' }}>{s.challanNumber||'—'}</td>
                          <td style={{ padding:'0.8rem 1rem', color:'#6b7280', whiteSpace:'nowrap' }}>{fmtDate(s.createdAt)}</td>

                          {/* Expected Delivery */}
                          <td style={{ padding:'0.8rem 1rem', whiteSpace:'nowrap' }}>
                            {s.estimatedDelivery ? (
                              <span style={{
                                display:'inline-flex', alignItems:'center', gap:4,
                                fontSize:'0.78rem', fontWeight:600,
                                color: new Date(s.estimatedDelivery) < new Date() && s.status !== 'Delivered' ? '#ef4444' : '#0a1628',
                              }}>
                                {new Date(s.estimatedDelivery) < new Date() && s.status !== 'Delivered' && (
                                  <span title="Overdue" style={{ fontSize:'0.7rem' }}>⚠️</span>
                                )}
                                {fmtDate(s.estimatedDelivery)}
                              </span>
                            ) : (
                              <span style={{ color:'#d1d5db', fontSize:'0.78rem' }}>—</span>
                            )}
                          </td>

                          <td style={{ padding:'0.8rem 1rem', color:'#6b7280', whiteSpace:'nowrap' }}>{s.origin} → {s.destination}</td>
                          <td style={{ padding:'0.8rem 1rem', color:'#6b7280', whiteSpace:'nowrap' }}>{s.serviceType}</td>
                          <td style={{ padding:'0.8rem 1rem', whiteSpace:'nowrap' }}>
                            <span style={{ background:`${statusColor[s.status]||'#9ca3af'}22`, color:statusColor[s.status]||'#9ca3af', padding:'3px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:700 }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding:'0.8rem 1rem' }}>
                            <div style={{ display:'flex', gap:'0.4rem', alignItems:'center' }}>
                              <select onChange={e => { if(e.target.value) updateShipmentStatus(s._id,e.target.value,s.destination); e.target.value=''; }} defaultValue=""
                                style={{ padding:'0.35rem 0.5rem', border:'1px solid #e8e4dc', borderRadius:4, fontSize:'0.72rem', cursor:'pointer', outline:'none', maxWidth:130 }}>
                                <option value="">Change Status</option>
                                {['Picked Up','In Transit','Out for Delivery','Delivered','Failed','Returned'].map(st=><option key={st}>{st}</option>)}
                              </select>

                              {/* ── Upload Image button ── */}
                              <button
                                onClick={() => openUploadModal(s)}
                                disabled={s.status !== 'Delivered'}
                                title={
                                  s.status !== 'Delivered'
                                    ? 'Available once status is Delivered'
                                    : s.images?.length > 0
                                      ? 'Manage delivery photo'
                                      : 'Upload delivery photo'
                                }
                                style={{
                                  display:'inline-flex', alignItems:'center', gap:4,
                                  padding:'0.35rem 0.55rem', borderRadius:4, fontSize:'0.72rem', fontWeight:600,
                                  whiteSpace:'nowrap', transition:'all 0.15s',
                                  background: s.status !== 'Delivered'
                                    ? '#f4f1ec'
                                    : s.images?.length > 0
                                      ? 'rgba(34,197,94,.12)'
                                      : 'rgba(232,93,4,.1)',
                                  border: s.status !== 'Delivered'
                                    ? '1px solid #e8e4dc'
                                    : s.images?.length > 0
                                      ? '1px solid rgba(34,197,94,.35)'
                                      : '1px solid rgba(232,93,4,.3)',
                                  color: s.status !== 'Delivered'
                                    ? '#c4bfb8'
                                    : s.images?.length > 0
                                      ? '#16a34a'
                                      : '#c2410c',
                                  cursor: s.status !== 'Delivered' ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {s.images?.length > 0 ? (
                                  <>
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                    </svg>
                                    POD
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                                    </svg>
                                    Upload
                                  </>
                                )}
                              </button>

                              <button onClick={() => openEdit(s)}
                                style={{ padding:'0.35rem 0.6rem', background:'#f4f1ec', border:'1px solid #e8e4dc', borderRadius:4, fontSize:'0.72rem', cursor:'pointer', color:'#0a1628', fontWeight:600 }}>
                                ✏️
                              </button>
                              <button onClick={() => handleDeleteShipment(s._id, s.trackingId)} disabled={deleting}
                                style={{ padding:'0.35rem 0.6rem', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:4, fontSize:'0.72rem', cursor: deleting ? 'not-allowed' : 'pointer', color:'#ef4444', fontWeight:600 }}>
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredShipments.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ padding:'2.5rem', textAlign:'center', color:'#6b7280' }}>
                            {shipmentSearch ? `No results for "${shipmentSearch}".` : statusFilter!=='all' ? `No "${statusFilter}" shipments found.` : 'No shipments found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MIS TAB */}
          {tab === 'mis' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.2rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <div>
                  <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#0a1628', margin:'0 0 0.3rem 0' }}>Delivered Shipments Report</h2>
                  <span style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{filteredDelivered.length} delivered shipments</span>
                </div>
                <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
                  {filteredDelivered.length > 0 && (
                    <button onClick={handleDeleteAllDelivered} disabled={deleting} style={deleteAllBtnStyle}>
                      🗑️ Delete All ({filteredDelivered.length})
                    </button>
                  )}
                  <button onClick={downloadExcel}
                    style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#16a34a', color:'white', border:'none', padding:'0.6rem 1.2rem', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', whiteSpace:'nowrap' }}>
                    📥 Download 1 Year Excel
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {[['7d','Last 7 Days'],['30d','Last 30 Days'],['6m','Last 6 Months'],['all','All Time']].map(([val,lbl]) => (
                    <button key={val} onClick={() => setMisFilter(val)} style={filterBtnStyle(misFilter===val)}>{lbl}</button>
                  ))}
                </div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'#9ca3af', pointerEvents:'none' }}>🔍</span>
                  <input placeholder="CN / Challan search..." value={misSearch} onChange={e => setMisSearch(e.target.value)} style={searchStyle} />
                  {misSearch && (
                    <button onClick={() => setMisSearch('')}
                      style={{ position:'absolute', right:'0.6rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'1rem' }}>✕</button>
                  )}
                </div>
              </div>

              {deliveredDates.length === 0 && (
                <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, padding:'2rem', textAlign:'center', color:'#6b7280' }}>
                  {misSearch ? `No results for "${misSearch}".` : 'No delivered shipments found in this period.'}
                </div>
              )}

              {deliveredDates.map(dateKey => {
                const group = deliveredByDate[dateKey];
                const displayDate = dateKey==='Unknown' ? 'Date Unknown'
                  : new Date(dateKey+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
                return (
                  <div key={dateKey} style={{ marginBottom:'2rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.1rem', color:'#0a1628' }}>{displayDate}</span>
                      <span style={{ background:'#22c55e22', color:'#22c55e', padding:'2px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700 }}>
                        {group.length} Delivered
                      </span>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete all ${group.length} shipments from ${displayDate}?`)) return;
                          try {
                            setDeleting(true);
                            await Promise.all(group.map(s => API.delete(`/shipments/${s._id}`)));
                            await fetchAll();
                          } catch(e) { alert('Delete failed'); }
                          finally { setDeleting(false); }
                        }}
                        disabled={deleting}
                        style={{ marginLeft:'auto', padding:'0.25rem 0.7rem', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:4, fontSize:'0.7rem', cursor: deleting ? 'not-allowed' : 'pointer', color:'#ef4444', fontWeight:600 }}>
                        🗑️ Delete This Day
                      </button>
                    </div>

                    <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:10, overflow:'hidden' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                        <thead>
                          <tr style={{ background:'#f4f1ec' }}>
                            {['CN Number','Challan No.','Dispatch Date','Exp. Delivery','Route','Service','Status','Delete'].map(h => (
                              <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontWeight:700, color:'#0a1628', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((s,i) => (
                            <tr key={s._id} style={{ borderTop:'1px solid #f4f1ec', background: i%2===0 ? 'white' : '#fafafa' }}>
                              <td style={{ padding:'0.75rem 1rem', fontFamily:'monospace', fontWeight:600, color:'#0a1628' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                  {s.trackingId}
                                  {s.images?.length > 0 && (
                                    <button
                                      onClick={() => openViewer(s)}
                                      title="View delivery photo"
                                      style={{
                                        display:'inline-flex', alignItems:'center', gap:5,
                                        background:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.06))',
                                        border:'1px solid rgba(34,197,94,.35)',
                                        borderRadius:6, padding:'3px 8px 3px 4px',
                                        cursor:'pointer',
                                      }}
                                    >
                                      <div style={{ width:20, height:20, borderRadius:3, overflow:'hidden', flexShrink:0, border:'1px solid rgba(34,197,94,.3)' }}>
                                        <img src={resolveImageUrl(s.images[0].url)} alt="thumb"
                                          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                                      </div>
                                      <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#16a34a' }}>POD</span>
                                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding:'0.75rem 1rem', fontFamily:'monospace', color:'#6b7280' }}>{s.challanNumber||'—'}</td>
                              <td style={{ padding:'0.75rem 1rem', color:'#6b7280', whiteSpace:'nowrap' }}>{fmtDate(s.createdAt)}</td>
                              <td style={{ padding:'0.75rem 1rem', whiteSpace:'nowrap' }}>
                                {s.estimatedDelivery
                                  ? <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#0a1628' }}>{fmtDate(s.estimatedDelivery)}</span>
                                  : <span style={{ color:'#d1d5db', fontSize:'0.78rem' }}>—</span>
                                }
                              </td>
                              <td style={{ padding:'0.75rem 1rem', color:'#6b7280', whiteSpace:'nowrap' }}>{s.origin} → {s.destination}</td>
                              <td style={{ padding:'0.75rem 1rem', color:'#6b7280' }}>{s.serviceType}</td>
                              <td style={{ padding:'0.75rem 1rem' }}>
                                <span style={{ background:'#22c55e22', color:'#22c55e', padding:'3px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:700 }}>Delivered</span>
                              </td>
                              <td style={{ padding:'0.75rem 1rem' }}>
                                <button onClick={() => handleDeleteMisShipment(s._id, s.trackingId)} disabled={deleting}
                                  style={{ padding:'0.3rem 0.6rem', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:4, fontSize:'0.7rem', cursor: deleting ? 'not-allowed' : 'pointer', color:'#ef4444', fontWeight:600 }}>
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && (
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#0a1628', marginBottom:'0.4rem' }}>Settings</h2>
              <p style={{ color:'#9ca3af', fontSize:'0.85rem', marginBottom:'2rem' }}>Admin account settings</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:'1.5rem', alignItems:'start' }}>
                <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, padding:'1.5rem' }}>
                  <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', color:'#0a1628', marginBottom:'1.2rem' }}>Account Info</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    {[['Name',user?.name],['Email',user?.email]].map(([lbl,val]) => (
                      <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0', borderBottom:'1px solid #f4f1ec' }}>
                        <span style={{ fontSize:'0.8rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>{lbl}</span>
                        <span style={{ fontSize:'0.85rem', color:'#0a1628', fontWeight:600 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'0.6rem 0' }}>
                      <span style={{ fontSize:'0.8rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>Role</span>
                      <span style={{ background:'rgba(232,93,4,.1)', color:'#e85d04', padding:'2px 10px', borderRadius:4, fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase' }}>{user?.role}</span>
                    </div>
                  </div>
                </div>
                <div style={{ background:'white', border:'1px solid #e8e4dc', borderRadius:12, padding:'1.5rem' }}>
                  <ChangePassword />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;