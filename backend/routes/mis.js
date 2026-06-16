const express = require('express');
const router = express.Router();
const MISReport = require('../models/MISReport');
const Shipment = require('../models/Shipment');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/mis  (admin) - get all MIS reports
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const reports = await MISReport.find().sort({ date: -1 }).limit(30);
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/mis/generate  (admin) - generate today's report
router.get('/generate', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [pickups, deliveries, pending, failed, dvMovements, dvGps, handcarry, podUploaded] = await Promise.all([
      Shipment.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ status: 'Delivered', deliveredAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ status: { $in: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery'] } }),
      Shipment.countDocuments({ status: 'Failed', updatedAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ serviceType: 'DV', createdAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ serviceType: 'DV', gpsEnabled: true, createdAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ serviceType: 'Handcarry', createdAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ podUploaded: true, updatedAt: { $gte: today, $lt: tomorrow } }),
    ]);

    const total = pickups || 1;
    const report = await MISReport.findOneAndUpdate(
      { date: today },
      {
        date: today,
        totalPickups: pickups,
        totalDeliveries: deliveries,
        totalPending: pending,
        totalFailed: failed,
        dvMovements,
        dvGpsActive: dvGps,
        handcarryCount: handcarry,
        podUploaded,
        podPending: deliveries - podUploaded > 0 ? deliveries - podUploaded : 0,
        onTimeRate: Math.round((deliveries / total) * 100),
        sentAt: new Date(),
        emailSent: false
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
