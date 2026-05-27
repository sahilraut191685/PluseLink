// src/validators/emergency.js — Zod schemas for emergency routes
const { z } = require('zod');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['critical', 'urgent', 'standard'];

const createEmergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name is required').max(100),
  bloodGroup: z.enum(BLOOD_GROUPS, { message: 'Invalid blood group' }),
  unitsNeeded: z.number().int().min(1).max(20),
  hospital: z.string().min(2, 'Hospital name is required').max(200),
  location: z.object({
    type: z.literal('Point').default('Point'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]'),
  }),
  urgency: z.enum(URGENCY_LEVELS).default('urgent'),
  broadcastRadius: z.number().min(1).max(100).default(10),
  contactNumber: z.string().optional(),
});

module.exports = { createEmergencySchema };
