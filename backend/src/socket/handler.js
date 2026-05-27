// src/socket/handler.js — Socket.IO event handlers with room management
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function initializeSocket(io) {
  // JWT authentication middleware for Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('accessToken=')[1]?.split(';')[0];
      if (!token) {
        // Allow unauthenticated connections for public pages
        socket.userId = null;
        socket.userRole = null;
        return next();
      }
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      // Allow connection but without auth context
      socket.userId = null;
      socket.userRole = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId || 'anonymous'})`);

    // Join user-specific room
    socket.on('join_room', ({ role, userId }) => {
      const room = `${role}_${userId}`;
      socket.join(room);
      console.log(`📍 ${socket.id} joined room: ${room}`);
    });

    // Donor accepts emergency
    socket.on('donor_accept', ({ requestId, donorId }) => {
      console.log(`✅ Donor ${donorId} accepted request ${requestId}`);
      // Actual logic is handled via REST API — this is for real-time UI updates
    });

    // Donor rejects emergency
    socket.on('donor_reject', ({ requestId, donorId }) => {
      console.log(`❌ Donor ${donorId} rejected request ${requestId}`);
    });

    // Toggle donor availability
    socket.on('toggle_availability', ({ donorId, available }) => {
      console.log(`🔄 Donor ${donorId} availability: ${available}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initializeSocket };
