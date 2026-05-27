// src/validators/donor.js — Zod schemas for donor routes
const { z } = require('zod');

const toggleAvailabilitySchema = z.object({
  available: z.boolean(),
});

const respondToEmergencySchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  accepted: z.boolean(),
});

module.exports = { toggleAvailabilitySchema, respondToEmergencySchema };
