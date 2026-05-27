// src/routes/donor.js — Donor availability, alerts, and response routes
const express = require('express');
const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { toggleAvailabilitySchema, respondToEmergencySchema } = require('../validators/donor');

const router = express.Router();

// Haversine distance calculation (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// PATCH /api/donor/availability
router.patch('/availability', authenticate, requireRole('donor'), validate(toggleAvailabilitySchema), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { available: req.body.available }, { new: true }).select('-passwordHash -refreshToken');
    const io = req.app.get('io');
    if (io) io.to(`donor_${req.user._id}`).emit('availability_updated', { donorId: req.user._id, available: req.body.available });
    res.json({ success: true, data: user, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// GET /api/donor/alerts
router.get('/alerts', authenticate, requireRole('donor'), async (req, res, next) => {
  try {
    const alerts = await EmergencyRequest.find({ status: { $in: ['active', 'partially_fulfilled'] }, 'matchedDonors.donorId': req.user._id }).populate('requesterId', 'name').sort({ createdAt: -1 });
    const enrichedAlerts = alerts.map((alert) => {
      const donorMatch = alert.matchedDonors.find((d) => d.donorId.toString() === req.user._id.toString());
      return { ...alert.toJSON(), myStatus: donorMatch?.status || 'unknown', matchedAt: donorMatch?.matchedAt };
    });
    res.json({ success: true, data: enrichedAlerts, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// POST /api/donor/respond
router.post('/respond', authenticate, requireRole('donor'), validate(respondToEmergencySchema), async (req, res, next) => {
  try {
    const { requestId, accepted } = req.body;
    const request = await EmergencyRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Emergency request not found', timestamp: new Date().toISOString() });
    if (request.status === 'cancelled' || request.status === 'fulfilled') return res.status(400).json({ success: false, error: `Request is already ${request.status}`, timestamp: new Date().toISOString() });

    const donorMatch = request.matchedDonors.find((d) => d.donorId.toString() === req.user._id.toString());
    if (!donorMatch) return res.status(400).json({ success: false, error: 'You are not matched to this request', timestamp: new Date().toISOString() });

    donorMatch.status = accepted ? 'accepted' : 'rejected';
    await User.findByIdAndUpdate(req.user._id, { $push: { responseHistory: { requestId: request._id, respondedAt: new Date(), accepted } } });

    const acceptedCount = request.matchedDonors.filter((d) => d.status === 'accepted').length;
    if (acceptedCount >= request.unitsNeeded) { request.status = 'fulfilled'; request.fulfilledAt = new Date(); }
    else if (acceptedCount > 0) { request.status = 'partially_fulfilled'; }
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`requester_${request.requesterId}`).emit('donor_responded', { requestId: request._id, donorId: req.user._id, donorName: req.user.name, bloodGroup: req.user.bloodGroup, accepted, acceptedCount, unitsNeeded: request.unitsNeeded, status: request.status });
      if (request.status === 'fulfilled') {
        io.to(`requester_${request.requesterId}`).emit('request_fulfilled', { requestId: request._id, message: 'All units fulfilled!' });
        request.matchedDonors.forEach((d) => io.to(`donor_${d.donorId}`).emit('request_fulfilled', { requestId: request._id }));
        io.to('admin').emit('request_fulfilled', { requestId: request._id });
      }
      if (accepted) {
        const donor = await User.findById(req.user._id);
        if (donor?.location) {
          const [rLng, rLat] = request.location.coordinates;
          const [dLng, dLat] = donor.location.coordinates;
          const distKm = haversineDistance(rLat, rLng, dLat, dLng);
          io.to(`requester_${request.requesterId}`).emit('eta_update', { requestId: request._id, donorId: req.user._id, donorName: req.user.name, etaMinutes: Math.max(5, Math.round((distKm / 30) * 60)), distance: distKm.toFixed(1) });
        }
      }
    }
    res.json({ success: true, data: { requestId: request._id, status: request.status, accepted, acceptedCount, unitsNeeded: request.unitsNeeded }, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

module.exports = router;
