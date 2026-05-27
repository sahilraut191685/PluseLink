// src/models/BloodBank.js — Blood bank with inventory schema
const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: { type: String, required: true },
    contactNumber: { type: String, required: true },
    inventory: {
      'A+': { type: Number, default: 0, min: 0 },
      'A-': { type: Number, default: 0, min: 0 },
      'B+': { type: Number, default: 0, min: 0 },
      'B-': { type: Number, default: 0, min: 0 },
      'AB+': { type: Number, default: 0, min: 0 },
      'AB-': { type: Number, default: 0, min: 0 },
      'O+': { type: Number, default: 0, min: 0 },
      'O-': { type: Number, default: 0, min: 0 },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
bloodBankSchema.index({ location: '2dsphere' });

// Total units across all blood groups
bloodBankSchema.virtual('totalUnits').get(function () {
  return Object.values(this.inventory).reduce((sum, val) => sum + val, 0);
});

bloodBankSchema.set('toJSON', { virtuals: true });
bloodBankSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
