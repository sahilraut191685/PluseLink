// src/routes/banks.js — Blood bank nearby search and inventory management
const express = require('express');
const BloodBank = require('../models/BloodBank');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/banks/nearby?lat=&lng=&radius=10
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const latitude = parseFloat(lat) || 18.5204;
    const longitude = parseFloat(lng) || 73.8567;
    const radiusKm = parseFloat(radius) || 10;

    const banks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },
      { $sort: { distance: 1 } },
    ]);

    // Convert distance to km
    const formatted = banks.map((b) => ({ ...b, distanceKm: Math.round((b.distance / 1000) * 10) / 10 }));

    res.json({ success: true, data: formatted, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// PATCH /api/banks/:id/inventory — Update blood stock
router.patch('/:id/inventory', authenticate, requireRole('hospital', 'admin'), async (req, res, next) => {
  try {
    const bank = await BloodBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ success: false, error: 'Blood bank not found', timestamp: new Date().toISOString() });

    const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const updates = req.body;

    for (const [group, units] of Object.entries(updates)) {
      if (validGroups.includes(group) && typeof units === 'number' && units >= 0) {
        bank.inventory[group] = units;
      }
    }
    bank.lastUpdated = new Date();
    await bank.save();

    const io = req.app.get('io');
    if (io) io.to('admin').emit('inventory_updated', { bankId: bank._id, name: bank.name, inventory: bank.inventory });

    res.json({ success: true, data: bank, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// GET /api/banks — All blood banks
router.get('/', async (req, res, next) => {
  try {
    const banks = await BloodBank.find().sort({ name: 1 });
    res.json({ success: true, data: banks, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

module.exports = router;
