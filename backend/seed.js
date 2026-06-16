// ─── seed.js ──────────────────────────────────────────────────────
// SAFE version — creates/updates admin user only
// Does NOT DELETE any shipment, MISReport, or data
// Run: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rahulenterprise123@gmail.com';
const ADMIN_PASS  = process.env.ADMIN_PASS  || '@#*rahul456';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    // ✅ NOTHING DELETED — only checking/creating/updating admin user
    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      user = await User.create({
        name:     'Rahul Admin',
        email:    ADMIN_EMAIL,
        password: ADMIN_PASS,
        company:  'Rahul Enterprise',
        phone:    '+919831499345',
        role:     'admin',
      });
      console.log('✅ Admin user created');
    } else {
      user.password = ADMIN_PASS;
      await user.save();
      console.log('✅ Admin password synced with .env');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔑 Login: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
    console.log('✅ All shipments and data are safe');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });