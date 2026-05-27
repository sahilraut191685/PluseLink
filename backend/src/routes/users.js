// src/routes/users.js — User profile routes
const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -refreshToken');
    res.json({ success: true, data: user, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bloodGroup', 'location', 'available'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-passwordHash -refreshToken');
    res.json({ success: true, data: user, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

module.exports = router;
