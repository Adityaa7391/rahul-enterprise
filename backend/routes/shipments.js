const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');

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

// ── POST /shipments — save new shipment ──
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

    // Duplicate CN check
    if (trackingId) {
      const existing = await Shipment.findOne({ trackingId });
      if (existing) return res.status(400).json({ success: false, message: `CN Number "${trackingId}" already exists.` });
    }

    // Set createdAt from bookingDate
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

    // Use insertOne — this saves createdAt as-is without Mongoose defaults
    const result = await Shipment.collection.insertOne(shipmentData);
    const saved = await Shipment.findById(result.insertedId);

    console.log(`✅ Shipment saved: ${trackingId} | createdAt: ${createdAtDate}`);
    res.status(201).json({ success: true, data: saved });
  } catch (e) {
    console.error('❌ POST /shipments error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PUT /shipments/:id — edit shipment ──
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
    console.error('❌ PUT /shipments/:id error:', e.message);
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
    console.error('❌ PUT /shipments/:id/status error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DELETE /shipments/:id ──
router.delete('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;