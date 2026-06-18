const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Shipment = require('../models/Shipment');

// ── Multer config — save to /uploads/shipments/<shipmentId>/ ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'shipments', req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
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
    res.json({ success: true, data: shipment });
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
        // Clean up uploaded files if shipment not found
        if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      // Build image records pointing to the public URL path
      const newImages = (req.files || []).map(file => ({
        url: `/uploads/shipments/${req.params.id}/${file.filename}`,
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
          const filePath = path.join(__dirname, '..', img.url);
          fs.unlink(filePath, () => {});
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

    // Delete file from disk
    const filePath = path.join(__dirname, '..', image.url);
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.warn('Could not delete file from disk:', filePath);
    });

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
    const validStatuses = ['Booked','Picked Up','In Transit','Out for Delivery','Delivered','Failed','Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateFields = { status, updatedAt: new Date() };
    if (status === 'Delivered') updateFields.deliveredAt = new Date();

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateFields,
        $push: {
          trackingEvents: {
            status,
            location: location || 'Hub',
            description: description || `Status updated to ${status}`,
            timestamp: new Date(),
          }
        },
      },
      { new: true }
    );

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
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

    // Delete the image folder for this shipment from disk
    const imageDir = path.join(__dirname, '..', 'uploads', 'shipments', req.params.id);
    fs.rm(imageDir, { recursive: true, force: true }, (err) => {
      if (err) console.warn('Could not remove image folder:', imageDir);
    });

    await Shipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;