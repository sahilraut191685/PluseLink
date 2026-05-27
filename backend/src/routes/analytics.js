// src/routes/analytics.js — Analytics dashboard data aggregations
const express = require('express');
const EmergencyRequest = require('../models/EmergencyRequest');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');

const router = express.Router();

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// GET /api/analytics — Full analytics payload
router.get('/', async (req, res, next) => {
  try {
    // ---- 1. Overview stats ----
    const [totalDonors, activeDonors, totalRequests, activeRequests, fulfilledRequests, cancelledRequests, bankCount] =
      await Promise.all([
        User.countDocuments({ role: 'donor' }),
        User.countDocuments({ role: 'donor', available: true }),
        EmergencyRequest.countDocuments(),
        EmergencyRequest.countDocuments({ status: { $in: ['active', 'partially_fulfilled'] } }),
        EmergencyRequest.countDocuments({ status: 'fulfilled' }),
        EmergencyRequest.countDocuments({ status: 'cancelled' }),
        BloodBank.countDocuments(),
      ]);

    const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

    // ---- 2. Requests by blood group ----
    const requestsByBloodGroup = await EmergencyRequest.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 }, totalUnits: { $sum: '$unitsNeeded' } } },
      { $sort: { count: -1 } },
    ]);
    // Ensure all blood groups present
    const bloodGroupDemand = BLOOD_GROUPS.map((bg) => {
      const found = requestsByBloodGroup.find((r) => r._id === bg);
      return { bloodGroup: bg, requests: found?.count || 0, units: found?.totalUnits || 0 };
    });

    // ---- 3. Requests by urgency ----
    const requestsByUrgency = await EmergencyRequest.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
    ]);
    const urgencyBreakdown = ['critical', 'urgent', 'standard'].map((u) => {
      const found = requestsByUrgency.find((r) => r._id === u);
      return { urgency: u, count: found?.count || 0 };
    });

    // ---- 4. Requests over time (last 30 days, grouped by day) ----
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const requestsOverTime = await EmergencyRequest.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with zeros
    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const found = requestsOverTime.find((r) => r._id === dateStr);
      timeline.push({
        date: dateStr,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        requests: found?.count || 0,
        fulfilled: found?.fulfilled || 0,
      });
    }

    // ---- 5. Average response time (time from request creation to first accepted donor) ----
    const responseTimes = await EmergencyRequest.aggregate([
      { $match: { 'matchedDonors.status': 'accepted' } },
      { $unwind: '$matchedDonors' },
      { $match: { 'matchedDonors.status': 'accepted' } },
      {
        $project: {
          responseTimeMs: { $subtract: ['$matchedDonors.matchedAt', '$createdAt'] },
          urgency: 1,
        },
      },
      {
        $group: {
          _id: '$urgency',
          avgResponseMs: { $avg: '$responseTimeMs' },
          count: { $sum: 1 },
        },
      },
    ]);
    const avgResponseByUrgency = ['critical', 'urgent', 'standard'].map((u) => {
      const found = responseTimes.find((r) => r._id === u);
      const avgMs = found?.avgResponseMs || 0;
      return {
        urgency: u,
        avgMinutes: Math.round(avgMs / 60000),
        responses: found?.count || 0,
      };
    });

    // ---- 6. Blood bank supply overview ----
    const banks = await BloodBank.find().select('name inventory');
    const supplyByGroup = BLOOD_GROUPS.map((bg) => {
      const totalUnits = banks.reduce((sum, bank) => sum + (bank.inventory[bg] || 0), 0);
      return { bloodGroup: bg, units: totalUnits };
    });

    // ---- 7. Top donors (by accepted responses) ----
    const topDonors = await User.aggregate([
      { $match: { role: 'donor' } },
      { $project: { name: 1, bloodGroup: 1, verifiedDonor: 1, accepted: { $size: { $filter: { input: { $ifNull: ['$responseHistory', []] }, cond: { $eq: ['$$this.accepted', true] } } } }, total: { $size: { $ifNull: ['$responseHistory', []] } } } },
      { $match: { accepted: { $gt: 0 } } },
      { $sort: { accepted: -1 } },
      { $limit: 10 },
    ]);

    // ---- 8. Requests by status ----
    const statusBreakdown = [
      { status: 'active', count: activeRequests, color: '#f59e0b' },
      { status: 'fulfilled', count: fulfilledRequests, color: '#22c55e' },
      { status: 'cancelled', count: cancelledRequests, color: '#ef4444' },
      { status: 'partially_fulfilled', count: totalRequests - activeRequests - fulfilledRequests - cancelledRequests, color: '#3b82f6' },
    ];

    res.json({
      success: true,
      data: {
        overview: {
          totalDonors,
          activeDonors,
          totalRequests,
          activeRequests,
          fulfilledRequests,
          cancelledRequests,
          bankCount,
          fulfillmentRate,
        },
        bloodGroupDemand,
        urgencyBreakdown,
        timeline,
        avgResponseByUrgency,
        supplyByGroup,
        topDonors,
        statusBreakdown,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
