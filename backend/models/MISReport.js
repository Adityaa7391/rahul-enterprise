const mongoose = require('mongoose');

const MISReportSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  totalPickups: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  totalPending: { type: Number, default: 0 },
  totalFailed: { type: Number, default: 0 },
  dvMovements: { type: Number, default: 0 },
  dvGpsActive: { type: Number, default: 0 },
  handcarryCount: { type: Number, default: 0 },
  podUploaded: { type: Number, default: 0 },
  podPending: { type: Number, default: 0 },
  exceptions: { type: Number, default: 0 },
  onTimeRate: { type: Number, default: 0 },
  zoneBreakdown: [{
    zone: String,
    pickups: Number,
    deliveries: Number
  }],
  sentAt: { type: Date },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MISReport', MISReportSchema);
