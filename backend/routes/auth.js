const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ─── Email Transporter ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS
  },
  // Required for Gmail
  tls: { rejectUnauthorized: false }
});

// ─── POST /api/auth/register ──────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, company, phone });
    const token = user.getSignedJwtToken();
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────
// Fix: Fetch user from DB and use matchPassword()
// Do not depend on process.env.ADMIN_PASS — it resets on server restart
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rahulenterprise123@gmail.com';

    // Only allow admin email
    if (email !== ADMIN_EMAIL)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Fetch user from DB and compare against password hash
    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Admin user not found in DB' });

    // matchPassword() uses bcrypt compare — not env variable
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = user.getSignedJwtToken();
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rahulenterprise123@gmail.com';

    if (email !== ADMIN_EMAIL)
      return res.status(404).json({ success: false, message: 'No account found with this email' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found in DB' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Verify email connection before sending
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('Email transporter verify failed:', verifyErr.message);
      // Clear token on failure
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: `Could not connect to email server: ${verifyErr.message}`
      });
    }

    await transporter.sendMail({
      from: `"Rahul Enterprise" <${process.env.EMAIL_FROM}>`,
      to: ADMIN_EMAIL,
      subject: 'Password Reset Request — Rahul Enterprise',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0a1628;color:white;padding:2rem;border-radius:12px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
            <div style="width:36px;height:36px;background:#e85d04;border-radius:6px;display:flex;align-items:center;justify-content:center">
              <span style="color:white;font-weight:bold;font-size:1rem">R</span>
            </div>
            <span style="font-size:1.2rem;font-weight:bold;color:white">
              Rahul <span style="color:#e85d04">Enterprise</span>
            </span>
          </div>
          <h2 style="color:#e85d04;margin-bottom:0.5rem">Password Reset Request</h2>
          <p style="color:#d1d5db;margin-bottom:1.5rem">
            You have requested to reset your admin account password.
            Click the button below to proceed:
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;background:#e85d04;color:white;padding:0.85rem 2rem;border-radius:6px;text-decoration:none;font-weight:bold;font-size:1rem;margin-bottom:1.5rem">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:0.82rem;margin-bottom:0.5rem">
            ⏱ This link is valid for <strong>15 minutes</strong> only.
          </p>
          <p style="color:#9ca3af;font-size:0.82rem">
            If you did not make this request, please ignore this email. Your password remains safe.
          </p>
          <hr style="border-color:rgba(255,255,255,.1);margin-top:2rem"/>
          <p style="color:#6b7280;font-size:0.75rem;text-align:center">
            © ${new Date().getFullYear()} Rahul Enterprise. All rights reserved.
          </p>
        </div>
      `
    });

    res.json({ success: true, message: 'Reset link sent to your email' });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    } catch (_) {}
    res.status(500).json({ success: false, message: `Email could not be sent: ${err.message}` });
  }
});

// ─── POST /api/auth/reset-password/:token ────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });

    // Password will be saved to DB as a bcrypt hash
    // Do not update process.env.ADMIN_PASS — it resets on server restart anyway
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.getSignedJwtToken();
    res.json({ success: true, message: 'Password reset successful', token });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/change-password ──────────────────────────────
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();
    res.json({ success: true, message: 'Password changed successfully!', token });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;