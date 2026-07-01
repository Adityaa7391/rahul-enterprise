const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Shipment = require('../models/Shipment');

// ── Multer config — upload directly to Cloudinary (persists across deploys) ──
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `rahul-enterprise/shipments/${req.params.id}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  }),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only image files are allowed (jpg, png, webp, gif).'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB per file, max 1 file
});

// Canonical forward order of the delivery lifecycle.
const STATUS_ORDER = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

// Strips out superseded events so customers only see the cleaned-up
// timeline, AND sorts by lifecycle step order (not by timestamp).
//
// Why sort by STATUS_ORDER instead of timestamp: when the admin moves a
// shipment's status backward and then forward again, the event for the
// re-selected status gets its `timestamp` refreshed to "now" (see
// PUT /:id/status below). If we sorted by timestamp, that event would
// jump to the end of the list even though it belongs earlier in the
// sequence. Sorting by STATUS_ORDER guarantees the customer always sees
// a clean, step-wise progression — only the steps up to the current
// status, in the correct order, nothing extra.
const toCustomerView = (shipmentDoc) => {
  const obj = shipmentDoc.toObject ? shipmentDoc.toObject() : shipmentDoc;
  if (Array.isArray(obj.trackingEvents)) {
    obj.trackingEvents = obj.trackingEvents
      .filter(ev => !ev.superseded)
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }
  return obj;
};

// Recomputes which tracking events should be visible to customers based
// on the shipment's CURRENT status, not the order events were created in.
//
// Example: events were added Booked -> Picked Up -> In Transit -> Out for
// Delivery, then the admin sets status back to "Picked Up". This function
// marks the "In Transit" and "Out for Delivery" events as superseded so
// customers only see Booked -> Picked Up. If the admin later moves forward
// again (e.g. back to "In Transit"), any previously-superseded event that
// is still at or before the new status is un-hidden again, instead of
// creating a duplicate.
const recomputeVisibility = (shipment, newStatus) => {
  const newIdx = STATUS_ORDER.indexOf(newStatus);
  if (newIdx === -1) return;

  shipment.trackingEvents.forEach((ev) => {
    const evIdx = STATUS_ORDER.indexOf(ev.status);
    if (evIdx === -1) return; // leave any unrecognized status untouched
    ev.superseded = evIdx > newIdx;
  });
};

// ── GET /shipments/stats/summary ──
router.get('/stats/summary', async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const [total, delivered, inTransit, dvWithGps, pending] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Shipment.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'Delivered' }),
      Shipment.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, status: 'In Transit' }),
      Shipment.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, serviceType: 'Dedicated Vehicle', gpsEnabled: true }),
      Shipment.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['Booked','Picked Up','In Transit','Out for Delivery'] } }),
    ]);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: { total, delivered, inTransit, dvWithGps, pending } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /shipments/track/:trackingId ──
router.get('/track/:trackingId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingId: req.params.trackingId });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: toCustomerView(shipment) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /shipments?limit=1000 ──
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const shipments = await Shipment.find().sort({ createdAt: -1 }).limit(limit);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: shipments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /shipments/:id ──
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: shipment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /shipments — create new shipment ──
router.post('/', async (req, res) => {
  try {
    const {
      trackingId, challanNumber, origin, destination, serviceType,
      sender, receiver, weight, description,
      bookingDate, estimatedDelivery,
    } = req.body;

    if (!challanNumber) {
      return res.status(400).json({ success: false, message: 'Challan Number is required.' });
    }

    if (trackingId) {
      const existing = await Shipment.findOne({ trackingId });
      if (existing) return res.status(400).json({ success: false, message: `CN Number "${trackingId}" already exists.` });
    }

    let createdAtDate = new Date();
    if (bookingDate) {
      createdAtDate = new Date(bookingDate);
      const now = new Date();
      createdAtDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    }

    const shipmentData = {
      trackingId,
      challanNumber: challanNumber.trim(),
      origin,
      destination,
      serviceType,
      sender:   sender   || { name: 'N/A' },
      receiver: receiver || { name: 'N/A' },
      weight,
      description,
      status: 'Booked',
      images: [],
      createdAt: createdAtDate,
      updatedAt: new Date(),
      trackingEvents: [{
        status: 'Booked',
        location: origin || 'Origin',
        description: 'Shipment booked',
        timestamp: new Date(),
      }],
    };

    if (estimatedDelivery) shipmentData.estimatedDelivery = new Date(estimatedDelivery);
    if (serviceType === 'Dedicated Vehicle') shipmentData.gpsEnabled = true;

    const result = await Shipment.collection.insertOne(shipmentData);
    const saved  = await Shipment.findById(result.insertedId);

    console.log(`Shipment saved: ${trackingId} | createdAt: ${createdAtDate}`);
    res.status(201).json({ success: true, data: saved });
  } catch (e) {
    console.error('POST /shipments error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /shipments/:id/images — upload image to existing shipment ──
router.post('/:id/images', (req, res) => {
  upload.array('images', 1)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const shipment = await Shipment.findById(req.params.id);
      if (!shipment) {
        // Clean up uploaded files on Cloudinary if shipment not found
        if (req.files) req.files.forEach(f => cloudinary.uploader.destroy(f.filename).catch(() => {}));
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      // Build image records pointing to the Cloudinary URL
      const newImages = (req.files || []).map(file => ({
        url: file.path, // Cloudinary's secure URL
        cloudinaryId: file.filename, // needed to delete from Cloudinary later
        originalName: file.originalname,
        uploadedAt: new Date(),
      }));

      if (newImages.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid images received.' });
      }

      // Check total image limit (max 1 per shipment)
      const currentCount = shipment.images ? shipment.images.length : 0;
      const allowedCount = 1 - currentCount;
      if (allowedCount <= 0) {
        newImages.forEach(img => {
          cloudinary.uploader.destroy(img.cloudinaryId).catch(() => {});
        });
        return res.status(400).json({ success: false, message: 'Shipment already has 1 image (maximum).' });
      }

      const toSave = newImages.slice(0, allowedCount);

      const updated = await Shipment.findByIdAndUpdate(
        req.params.id,
        {
          $push: { images: { $each: toSave } },
          $set:  { updatedAt: new Date() },
        },
        { new: true }
      );

      console.log(`Images uploaded for shipment ${req.params.id}: ${toSave.length} file(s)`);
      res.status(201).json({ success: true, data: updated, uploaded: toSave.length });
    } catch (e) {
      console.error('POST /shipments/:id/images error:', e.message);
      res.status(500).json({ success: false, message: e.message });
    }
  });
});

// ── DELETE /shipments/:id/images/:imageId — remove a single image ──
router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const image = shipment.images.id(req.params.imageId);
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    // Delete file from Cloudinary
    if (image.cloudinaryId) {
      cloudinary.uploader.destroy(image.cloudinaryId).catch((err) => {
        console.warn('Could not delete image from Cloudinary:', err.message);
      });
    }

    await Shipment.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: { _id: req.params.imageId } }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    res.json({ success: true, message: 'Image deleted.' });
  } catch (e) {
    console.error('DELETE /shipments/:id/images/:imageId error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PUT /shipments/:id — edit shipment details ──
router.put('/:id', async (req, res) => {
  try {
    const {
      trackingId, challanNumber, origin, destination, serviceType,
      bookingDate, sender, receiver, weight, description, estimatedDelivery,
    } = req.body;

    const updateFields = {};
    if (trackingId)           updateFields.trackingId    = trackingId;
    if (challanNumber)        updateFields.challanNumber = challanNumber.trim();
    if (origin)               updateFields.origin        = origin;
    if (destination)          updateFields.destination   = destination;
    if (serviceType)          updateFields.serviceType   = serviceType;
    if (sender)               updateFields.sender        = sender;
    if (receiver)             updateFields.receiver      = receiver;
    if (weight !== undefined) updateFields.weight        = weight;
    if (description)          updateFields.description   = description;
    if (estimatedDelivery)    updateFields.estimatedDelivery = new Date(estimatedDelivery);
    if (serviceType === 'Dedicated Vehicle') updateFields.gpsEnabled = true;

    if (bookingDate) {
      const d = new Date(bookingDate);
      const now = new Date();
      d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      updateFields.createdAt = d;
    }

    updateFields.updatedAt = new Date();

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (e) {
    console.error('PUT /shipments/:id error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PUT /shipments/:id/status ──
router.put('/:id/status', async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const validStatuses = ['Booked','Picked Up','In Transit','Out for Delivery','Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const now = new Date();
    shipment.trackingEvents = shipment.trackingEvents || [];

    // If an event for this exact status already exists (e.g. admin moved
    // forward, then back, then forward again to the same step), don't
    // create a duplicate row — just refresh its details/timestamp.
    const existingEvent = shipment.trackingEvents.find(ev => ev.status === status);
    if (existingEvent) {
      existingEvent.location = location || existingEvent.location || 'Hub';
      existingEvent.description = description || existingEvent.description || `Status updated to ${status}`;
      existingEvent.timestamp = now;
    } else {
      shipment.trackingEvents.push({
        status,
        location: location || 'Hub',
        description: description || `Status updated to ${status}`,
        timestamp: now,
      });
    }

    // Hide every event that sits AFTER the newly-set status in the
    // normal lifecycle order, and un-hide everything at or before it.
    recomputeVisibility(shipment, status);

    shipment.status = status;
    shipment.updatedAt = now;
    if (status === 'Delivered') shipment.deliveredAt = now;

    await shipment.save();

    res.json({ success: true, data: shipment });
  } catch (e) {
    console.error('PUT /shipments/:id/status error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DELETE /shipments/:id — delete shipment and its images ──
router.delete('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    // Delete all images for this shipment from Cloudinary
    if (shipment.images && shipment.images.length > 0) {
      shipment.images.forEach(img => {
        if (img.cloudinaryId) {
          cloudinary.uploader.destroy(img.cloudinaryId).catch(() => {});
        }
      });
    }

    await Shipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
