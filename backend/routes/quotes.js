const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { protect, authorize } = require('../middleware/auth');

// @POST /api/quotes  (public)
router.post('/', async (req, res) => {
  try {
    const { name, company, phone, email, service, message } = req.body;
    if (!name || !phone || !email || !service) {
      return res.status(400).json({ success: false, message: 'Name, phone, email, and service are required' });
    }
    const quote = await Quote.create({ name, company, phone, email, service, message });
    res.status(201).json({ success: true, message: 'Your request has been submitted. We will contact you shortly!', data: quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/quotes  (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PUT /api/quotes/:id  (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
