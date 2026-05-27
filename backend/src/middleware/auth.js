// src/middleware/auth.js — JWT authentication and role-based access control
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Verify JWT from httpOnly cookie and attach user to req
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.',
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based access control — use after authenticate middleware
 * @param  {...string} roles — Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Optional auth — sets req.user if token present, but doesn't block
 */
async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
    }
  } catch {
    // Token invalid — proceed without user
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
