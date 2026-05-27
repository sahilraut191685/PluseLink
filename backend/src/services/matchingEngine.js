// src/services/matchingEngine.js — Donor scoring and matching algorithm
const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const { getCompatibleDonorGroups } = require('./bloodCompatibility');

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Find and score eligible donors for an emergency request
 * @param {Object} request — EmergencyRequest document
 * @returns {Object[]} Top 5 scored donors sorted descending
 */
async function findMatchingDonors(request) {
  const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);
  const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);

  // Step 1: Get IDs of donors already matched to active critical requests
  const activeRequests = await EmergencyRequest.find({
    status: 'active',
    urgency: 'critical',
    _id: { $ne: request._id },
  }).select('matchedDonors.donorId');

  const busyDonorIds = activeRequests.flatMap((r) =>
    r.matchedDonors
      .filter((d) => d.status === 'pending' || d.status === 'accepted')
      .map((d) => d.donorId)
  );

  // Step 2: Geospatial query for eligible donors
  let radiusKm = request.broadcastRadius || 10;
  let donors = await queryDonorsInRadius(
    request.location.coordinates,
    radiusKm,
    compatibleGroups,
    ninetyDaysAgo,
    busyDonorIds
  );

  // Step 3: Auto-expand radius if < 3 donors found
  if (donors.length < 3 && radiusKm < 25) {
    radiusKm = 25;
    donors = await queryDonorsInRadius(
      request.location.coordinates,
      radiusKm,
      compatibleGroups,
      ninetyDaysAgo,
      busyDonorIds
    );
  }

  // Step 4: Score each donor
  const scoredDonors = donors.map((donor) => {
    const distanceKm = donor.distance / 1000; // MongoDB returns meters
    const acceptanceRate = calculateAcceptanceRate(donor);

    const score =
      (1 / Math.max(distanceKm, 0.1)) * 40 + // Proximity score (cap at 0.1km to avoid infinity)
      (donor.available ? 30 : 0) +              // Availability bonus
      (donor.verifiedDonor ? 20 : 0) +          // Verification bonus
      acceptanceRate * 10;                       // History bonus

    return {
      donorId: donor._id,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      distance: distanceKm,
      distanceFormatted: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`,
      score: Math.round(score * 100) / 100,
      available: donor.available,
      verifiedDonor: donor.verifiedDonor,
      acceptanceRate: Math.round(acceptanceRate * 100),
      location: donor.location,
    };
  });

  // Step 5: Sort descending by score, return top 5
  scoredDonors.sort((a, b) => b.score - a.score);
  return scoredDonors.slice(0, 5);
}

/**
 * Query donors within a radius using MongoDB $geoNear aggregation
 */
async function queryDonorsInRadius(coordinates, radiusKm, compatibleGroups, ninetyDaysAgo, excludeIds) {
  return User.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance',
        maxDistance: radiusKm * 1000, // Convert km to meters
        spherical: true,
        query: {
          role: 'donor',
          available: true,
          bloodGroup: { $in: compatibleGroups },
          _id: { $nin: excludeIds },
          $or: [
            { lastDonationDate: null },
            { lastDonationDate: { $lt: ninetyDaysAgo } },
          ],
        },
      },
    },
  ]);
}

/**
 * Calculate a donor's acceptance rate from response history
 */
function calculateAcceptanceRate(donor) {
  if (!donor.responseHistory || donor.responseHistory.length === 0) return 0.5;
  const accepted = donor.responseHistory.filter((r) => r.accepted).length;
  return accepted / donor.responseHistory.length;
}

module.exports = { findMatchingDonors };
