// src/server.js — Express + Socket.IO entry point
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initializeSocket } = require('./socket/handler');

// Route imports
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const donorRoutes = require('./routes/donor');
const bankRoutes = require('./routes/banks');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const mapRoutes = require('./routes/map');

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ['https://pluse-link.vercel.app'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['https://pluse-link.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/map', mapRoutes);

// Stats endpoint for landing page
app.get('/api/stats', async (req, res, next) => {
  try {
    const User = require('./models/User');
    const EmergencyRequest = require('./models/EmergencyRequest');
    const BloodBank = require('./models/BloodBank');
    const [donorCount, activeEmergencies, bankCount, totalRequests] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      EmergencyRequest.countDocuments({ status: { $in: ['active', 'partially_fulfilled'] } }),
      BloodBank.countDocuments(),
      EmergencyRequest.countDocuments(),
    ]);
    res.json({ success: true, data: { donorCount, activeEmergencies, bankCount, totalRequests }, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

// Global error handler
app.use(errorHandler);

// Initialize Socket.IO
initializeSocket(io);

// Start server
async function start() {
  await connectDB();
  if (env.seedDb) {
    console.log('🌱 Seeding database...');
    const seed = require('./seed/seed');
    await seed();
  }
  server.listen(env.port, () => {
    console.log(`\n🚀 PulseLink API running on http://localhost:${env.port}`);
    console.log(`📡 Socket.IO ready for connections`);
    console.log(`🌐 Frontend expected at ${env.frontendUrl}\n`);
  });
}

start().catch((err) => { console.error('Failed to start server:', err); process.exit(1); });
