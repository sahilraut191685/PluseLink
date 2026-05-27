// src/routes/emergency.js — Emergency request CRUD + matching trigger
const express = require('express');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodBank = require('../models/BloodBank');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createEmergencySchema } = require('../validators/emergency');
const { findMatchingDonors } = require('../services/matchingEngine');
const { getCompatibleDonorGroups } = require('../services/bloodCompatibility');

const router = express.Router();

// POST /api/emergency — Create request + trigger matching
router.post('/', authenticate, validate(createEmergencySchema), async (req, res, next) => {
  try {
    const request = new EmergencyRequest({
      requesterId: req.user._id,
      ...req.body,
    });

    // Find nearby blood banks with compatible blood
    const compatibleGroups = getCompatibleDonorGroups(req.body.bloodGroup);
    const nearbyBanks = await BloodBank.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: req.body.location.coordinates },
          distanceField: 'distance',
          maxDistance: (req.body.broadcastRadius || 10) * 1000,
          spherical: true,
        },
      },
    ]);

    // Add blood bank options with available units of compatible blood
    request.bloodBankOptions = nearbyBanks.map((bank) => {
      const unitsAvailable = compatibleGroups.reduce((sum, group) => sum + (bank.inventory[group] || 0), 0);
      return {
        bankId: bank._id,
        distance: Math.round(bank.distance / 1000 * 10) / 10, // km, 1 decimal
        unitsAvailable,
      };
    });

    await request.save();

    // Run matching engine to find top donors
    const matchedDonors = await findMatchingDonors(request);

    // Add matched donors to request
    request.matchedDonors = matchedDonors.map((d) => ({
      donorId: d.donorId,
      status: 'pending',
      matchedAt: new Date(),
    }));
    await request.save();

    // Emit Socket.IO events to matched donors
    const io = req.app.get('io');
    if (io) {
      // Broadcast to each matched donor's room
      matchedDonors.forEach((donor) => {
        io.to(`donor_${donor.donorId}`).emit('new_emergency', {
          requestId: request._id,
          patientName: request.patientName,
          bloodGroup: request.bloodGroup,
          unitsNeeded: request.unitsNeeded,
          hospital: request.hospital,
          urgency: request.urgency,
          distance: donor.distanceFormatted,
          score: donor.score,
          location: request.location,
          createdAt: request.createdAt,
        });
      });

      // Notify admin room
      io.to('admin').emit('new_emergency', {
        requestId: request._id,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        urgency: request.urgency,
        matchedDonorCount: matchedDonors.length,
      });
    }

    // Populate for response
    await request.populate('matchedDonors.donorId', 'name bloodGroup');
    await request.populate('bloodBankOptions.bankId', 'name address');

    // Generate emergency alert message (SMS-safe)
    const alertMessage = {
      title: `🚨 ${request.urgency.toUpperCase()} Blood Need`,
      body: `${request.bloodGroup} blood needed at ${request.hospital}, Pune. ${request.unitsNeeded} unit(s) required. Respond now to save a life!`,
      urgency: request.urgency,
      bloodGroup: request.bloodGroup,
      location: request.location,
      expiresIn: request.urgency === 'critical' ? '30m' : '2h',
    };

    console.log('📢 Emergency Alert:', JSON.stringify(alertMessage, null, 2));

    res.status(201).json({
      success: true,
      data: {
        request,
        matchedDonors,
        alertMessage,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/active — All active requests (dashboard feed)
router.get('/active', async (req, res, next) => {
  try {
    const requests = await EmergencyRequest.find({
      status: { $in: ['active', 'partially_fulfilled'] },
    })
      .populate('requesterId', 'name')
      .populate('matchedDonors.donorId', 'name bloodGroup')
      .populate('bloodBankOptions.bankId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: requests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergency/:id — Get single request
router.get('/:id', async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate('requesterId', 'name email')
      .populate('matchedDonors.donorId', 'name bloodGroup location verifiedDonor')
      .populate('bloodBankOptions.bankId', 'name address contactNumber inventory');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/emergency/:id/cancel — Cancel a request
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Only requester or admin can cancel
    if (request.requesterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this request',
        timestamp: new Date().toISOString(),
      });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify all matched donors
    const io = req.app.get('io');
    if (io) {
      request.matchedDonors.forEach((donor) => {
        io.to(`donor_${donor.donorId}`).emit('request_cancelled', {
          requestId: request._id,
          message: 'Emergency request has been cancelled',
        });
      });
      io.to(`requester_${request.requesterId}`).emit('request_cancelled', {
        requestId: request._id,
      });
    }

    res.json({
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
