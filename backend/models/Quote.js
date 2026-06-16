const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  service: { type: String, required: true },
  message: { type: String },
  status: {
    type: String,
    enum: ['New', 'In Review', 'Quoted', 'Accepted', 'Rejected'],
    default: 'New'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quote', QuoteSchema);
