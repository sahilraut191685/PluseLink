// src/models/EmergencyRequest.js — Emergency blood request schema
const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['critical', 'urgent', 'standard'];
const REQUEST_STATUSES = ['active', 'partially_fulfilled', 'fulfilled', 'cancelled'];
const DONOR_MATCH_STATUSES = ['pending', 'accepted', 'rejected', 'donated'];

const emergencyRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true, trim: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    unitsNeeded: { type: Number, required: true, min: 1, max: 20 },
    hospital: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    urgency: { type: String, enum: URGENCY_LEVELS, required: true, default: 'urgent' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'active' },
    matchedDonors: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: DONOR_MATCH_STATUSES, default: 'pending' },
        matchedAt: { type: Date, default: Date.now },
      },
    ],
    bloodBankOptions: [
      {
        bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
        distance: Number,
        unitsAvailable: Number,
      },
    ],
    broadcastRadius: { type: Number, default: 10 }, // km
    fulfilledAt: { type: Date, default: null },
    contactNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
emergencyRequestSchema.index({ location: '2dsphere' });
emergencyRequestSchema.index({ status: 1 });
emergencyRequestSchema.index({ bloodGroup: 1, status: 1 });

// Virtual: how many units are fulfilled
emergencyRequestSchema.virtual('unitsFulfilled').get(function () {
  return this.matchedDonors.filter((d) => d.status === 'accepted' || d.status === 'donated').length;
});

// Virtual: fulfillment percentage
emergencyRequestSchema.virtual('fulfillmentPercentage').get(function () {
  const fulfilled = this.matchedDonors.filter((d) => d.status === 'accepted' || d.status === 'donated').length;
  return Math.min(100, Math.round((fulfilled / this.unitsNeeded) * 100));
});

emergencyRequestSchema.set('toJSON', { virtuals: true });
emergencyRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
