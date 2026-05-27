// src/models/User.js — User schema with donor eligibility logic
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = ['donor', 'hospital', 'requester', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'donor' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    available: { type: Boolean, default: true },
    lastDonationDate: { type: Date, default: null },
    verifiedDonor: { type: Boolean, default: false },
    responseHistory: [
      {
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyRequest' },
        respondedAt: { type: Date, default: Date.now },
        accepted: { type: Boolean },
      },
    ],
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ bloodGroup: 1, available: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Check if donor is eligible to donate (90-day cooldown + available)
userSchema.methods.isEligibleToDonate = function () {
  if (!this.available) return false;
  if (!this.lastDonationDate) return true;
  const daysSinceLastDonation = (Date.now() - this.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastDonation > 90;
};

// Calculate acceptance rate from response history
userSchema.methods.getAcceptanceRate = function () {
  if (this.responseHistory.length === 0) return 0.5; // Default 50% for new donors
  const accepted = this.responseHistory.filter((r) => r.accepted).length;
  return accepted / this.responseHistory.length;
};

module.exports = mongoose.model('User', userSchema);
