// src/seed/seed.js — Mock data seeder for Pune demo scenario
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const EmergencyRequest = require('../models/EmergencyRequest');

// Pune center: [73.8567, 18.5204]
const PUNE_CENTER = [73.8567, 18.5204];

// Helper: random offset within km radius
function offsetCoords(center, maxKm) {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((center[1] * Math.PI) / 180);
  const dLat = (Math.random() - 0.5) * 2 * (maxKm / kmPerDegLat);
  const dLng = (Math.random() - 0.5) * 2 * (maxKm / kmPerDegLng);
  return [center[0] + dLng, center[1] + dLat];
}

const bloodBanksData = [
  {
    name: 'Sahyadri Blood Bank',
    address: 'Plot No. 30, Erandwane, Karve Road, Pune 411004',
    contactNumber: '+91 20 2543 0600',
    coordinates: [73.8290, 18.5074],
    inventory: { 'A+': 12, 'A-': 3, 'B+': 15, 'B-': 2, 'AB+': 6, 'AB-': 1, 'O+': 18, 'O-': 4 },
  },
  {
    name: 'Jankalyan Blood Bank',
    address: 'Jankalyan Nagar, Bibwewadi, Pune 411037',
    contactNumber: '+91 20 2422 1100',
    coordinates: [73.8700, 18.4800],
    inventory: { 'A+': 8, 'A-': 2, 'B+': 10, 'B-': 1, 'AB+': 4, 'AB-': 0, 'O+': 14, 'O-': 2 },
  },
  {
    name: 'Sassoon Hospital Blood Bank',
    address: 'Sassoon Road, Near Pune Railway Station, Pune 411001',
    contactNumber: '+91 20 2612 0255',
    coordinates: [73.8750, 18.5300],
    inventory: { 'A+': 20, 'A-': 5, 'B+': 22, 'B-': 3, 'AB+': 8, 'AB-': 2, 'O+': 25, 'O-': 6 },
  },
];

const donorsData = [
  { name: 'Aarav Patel', email: 'aarav@demo.com', bloodGroup: 'O-', coords: offsetCoords(PUNE_CENTER, 5), verified: true },
  { name: 'Priya Sharma', email: 'priya@demo.com', bloodGroup: 'O-', coords: offsetCoords(PUNE_CENTER, 8), verified: true },
  { name: 'Rohan Deshmukh', email: 'rohan@demo.com', bloodGroup: 'O+', coords: offsetCoords(PUNE_CENTER, 3), verified: true },
  { name: 'Sneha Kulkarni', email: 'sneha@demo.com', bloodGroup: 'A+', coords: offsetCoords(PUNE_CENTER, 6), verified: false },
  { name: 'Vikram Joshi', email: 'vikram@demo.com', bloodGroup: 'B+', coords: offsetCoords(PUNE_CENTER, 10), verified: true },
  { name: 'Anjali Mehta', email: 'anjali@demo.com', bloodGroup: 'AB+', coords: offsetCoords(PUNE_CENTER, 4), verified: false },
  { name: 'Karan Singh', email: 'karan@demo.com', bloodGroup: 'O-', coords: offsetCoords(PUNE_CENTER, 12), verified: true },
  { name: 'Meera Nair', email: 'meera@demo.com', bloodGroup: 'A-', coords: offsetCoords(PUNE_CENTER, 7), verified: true },
  { name: 'Arjun Reddy', email: 'arjun@demo.com', bloodGroup: 'B-', coords: offsetCoords(PUNE_CENTER, 9), verified: false },
  { name: 'Divya Gupta', email: 'divya@demo.com', bloodGroup: 'O+', coords: offsetCoords(PUNE_CENTER, 2), verified: true },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await User.deleteMany({});
  await BloodBank.deleteMany({});
  await EmergencyRequest.deleteMany({});
  console.log('🗑️ Cleared existing data');

  // Seed blood banks
  const banks = await BloodBank.insertMany(
    bloodBanksData.map((b) => ({
      name: b.name,
      address: b.address,
      contactNumber: b.contactNumber,
      location: { type: 'Point', coordinates: b.coordinates },
      inventory: b.inventory,
      lastUpdated: new Date(),
    }))
  );
  console.log(`🏥 Seeded ${banks.length} blood banks`);

  // Seed donors (password: "password123" for all)
  const donors = [];
  for (const d of donorsData) {
    const user = new User({
      name: d.name,
      email: d.email,
      passwordHash: 'password123', // pre-save hook will hash
      bloodGroup: d.bloodGroup,
      role: 'donor',
      location: { type: 'Point', coordinates: d.coords },
      available: true,
      verifiedDonor: d.verified,
      lastDonationDate: d.verified ? new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) : null, // 120 days ago
    });
    await user.save();
    donors.push(user);
  }
  console.log(`👥 Seeded ${donors.length} donors`);

  // Seed a requester
  const requester = new User({
    name: 'Dr. Amit Patil',
    email: 'requester@demo.com',
    passwordHash: 'password123',
    bloodGroup: 'A+',
    role: 'requester',
    location: { type: 'Point', coordinates: PUNE_CENTER },
  });
  await requester.save();
  console.log('👤 Seeded requester: requester@demo.com');

  // Seed a hospital user
  const hospital = new User({
    name: 'Sahyadri Hospital',
    email: 'hospital@demo.com',
    passwordHash: 'password123',
    bloodGroup: 'O+',
    role: 'hospital',
    location: { type: 'Point', coordinates: [73.8290, 18.5074] },
  });
  await hospital.save();
  console.log('🏥 Seeded hospital: hospital@demo.com');

  // Seed active O- emergency
  const oNegDonors = donors.filter((d) => d.bloodGroup === 'O-');
  const emergency = new EmergencyRequest({
    requesterId: requester._id,
    patientName: 'Rahul Sharma',
    bloodGroup: 'O-',
    unitsNeeded: 2,
    hospital: 'Sahyadri Hospital, Pune',
    location: { type: 'Point', coordinates: [73.8290, 18.5074] },
    urgency: 'critical',
    status: 'active',
    broadcastRadius: 10,
    matchedDonors: oNegDonors.slice(0, 3).map((d) => ({
      donorId: d._id,
      status: 'pending',
      matchedAt: new Date(),
    })),
    bloodBankOptions: banks.map((b, i) => ({
      bankId: b._id,
      distance: [2.5, 5.1, 3.8][i],
      unitsAvailable: b.inventory['O-'],
    })),
  });
  await emergency.save();
  console.log('🚨 Seeded active O- emergency request');

  console.log('\n✅ Seed complete! Demo credentials:');
  console.log('   Donor:     aarav@demo.com / password123');
  console.log('   Requester: requester@demo.com / password123');
  console.log('   Hospital:  hospital@demo.com / password123');
}

// Run directly — connect + seed + disconnect
if (require.main === module) {
  (async () => {
    await connectDB();
    await seed();
    await disconnectDB();
    process.exit(0);
  })().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = seed;
