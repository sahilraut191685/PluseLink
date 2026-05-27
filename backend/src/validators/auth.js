// src/validators/auth.js — Zod schemas for authentication routes
const { z } = require('zod');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = ['donor', 'hospital', 'requester'];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bloodGroup: z.enum(BLOOD_GROUPS, { message: 'Invalid blood group' }),
  role: z.enum(ROLES, { message: 'Invalid role' }).default('donor'),
  location: z
    .object({
      type: z.literal('Point').default('Point'),
      coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]'),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  // Refresh token comes from httpOnly cookie, no body needed
});

module.exports = { registerSchema, loginSchema, refreshSchema };
