// src/routes/map.js — Map data route for live map view
const express = require('express');
const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');

const router = express.Router();

// GET /api/map/data?lat=&lng=&radius=25
router.get('/data', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat) || 18.5204;
    const lng = parseFloat(req.query.lng) || 73.8567;
    const radiusKm = parseFloat(req.query.radius) || 25;

    // Fetch active emergencies
    const emergencies = await EmergencyRequest.find({
      status: { $in: ['active', 'partially_fulfilled'] },
    })
      .populate('requesterId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch available donors within radius
    const donors = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: {
            role: 'donor',
            available: true,
          },
        },
      },
      {
        $project: {
          name: 1,
          bloodGroup: 1,
          location: 1,
          verifiedDonor: 1,
          distance: 1,
        },
      },
      { $limit: 100 },
    ]);

    // Fetch nearby blood banks
    const banks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
        },
      },
      { $limit: 50 },
    ]);

    res.json({
      success: true,
      data: {
        emergencies: emergencies.map((e) => ({
          _id: e._id,
          patientName: e.patientName,
          bloodGroup: e.bloodGroup,
          unitsNeeded: e.unitsNeeded,
          hospital: e.hospital,
          urgency: e.urgency,
          status: e.status,
          location: e.location,
          matchedDonorCount: e.matchedDonors?.length || 0,
          requesterName: e.requesterId?.name || 'Unknown',
          createdAt: e.createdAt,
        })),
        donors: donors.map((d) => ({
          _id: d._id,
          name: d.name,
          bloodGroup: d.bloodGroup,
          location: d.location,
          verifiedDonor: d.verifiedDonor,
          distanceKm: Math.round((d.distance / 1000) * 10) / 10,
        })),
        banks: banks.map((b) => ({
          _id: b._id,
          name: b.name,
          address: b.address,
          contactNumber: b.contactNumber,
          location: b.location,
          inventory: b.inventory,
          totalUnits: Object.values(b.inventory || {}).reduce((s, v) => s + v, 0),
          distanceKm: Math.round((b.distance / 1000) * 10) / 10,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
