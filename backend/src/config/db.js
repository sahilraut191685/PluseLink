// src/config/db.js — MongoDB connection with Atlas or in-memory support
const mongoose = require('mongoose');
const env = require('./env');

let mongoServer = null;

async function connectDB() {
  let uri = env.mongoUri;

  // Use mongodb-memory-server for zero-setup development
  if (uri === 'memory') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    console.log('📦 Using in-memory MongoDB');
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'pulselink',
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

module.exports = { connectDB, disconnectDB };
