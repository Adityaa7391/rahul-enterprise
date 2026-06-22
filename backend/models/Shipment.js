const mongoose = require('mongoose');
const TrackingEventSchema = new mongoose.Schema({
  status:      { type: String, required: true },
  location:    { type: String, required: true },
  description: { type: String },
  timestamp:   { type: Date, default: Date.now },
  gpsActive:   { type: Boolean, default: false },
  coordinates: { lat: { type: Number }, lng: { type: Number } },
  // True when this event was superseded by a correction made within
  // SUPERSEDE_WINDOW_MS of this event being created. Superseded events
  // stay in the database for audit purposes but are hidden from the
  // customer-facing tracking view.
  superseded:  { type: Boolean, default: false },
});
const ShipmentImageSchema = new mongoose.Schema({
  url:          { type: String, required: true },
  cloudinaryId: { type: String },
  originalName: { type: String },
  uploadedAt:   { type: Date, default: Date.now },
});
const ShipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String, required: true, unique: true,
    default: () => `RE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  },
  challanNumber: {
    type: String, required: true,
    default: () => `CH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  },
  sender:   { name: { type: String, required: true }, email: String, phone: String, address: String },
  receiver: { name: { type: String, required: true }, email: String, phone: String, address: String },
  origin:      { type: String, required: true },
  destination: { type: String, required: true },
  serviceType: {
    type: String,
    enum: ['Handcarry', 'Dedicated Vehicle', 'Surface Express', 'Air Cargo', 'Secure Cargo'],
    required: true
  },
  weight: Number, description: String,
  status: {
    type: String,
    enum: ['Booked','Picked Up','In Transit','Out for Delivery','Delivered','Failed','Returned'],
    default: 'Booked'
  },
  gpsEnabled:     { type: Boolean, default: false },
  gpsLastUpdate:  Date,
  gpsCoordinates: { lat: Number, lng: Number },
  trackingEvents: [TrackingEventSchema],
  podUploaded:  { type: Boolean, default: false },
  podUrl:       String,
  podEmailed:   { type: Boolean, default: false },
  podEmailedAt: Date,
  dispatchDate:         Date,
  expectedDeliveryDate: Date,
  deliveredAt:          Date,
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
  images: { type: [ShipmentImageSchema], default: [] },
}, {
  strict: false
});
ShipmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.serviceType === 'Dedicated Vehicle') this.gpsEnabled = true;
  if (this.status === 'Delivered' && !this.deliveredAt) this.deliveredAt = new Date();
  next();
});
module.exports = mongoose.model('Shipment', ShipmentSchema);
