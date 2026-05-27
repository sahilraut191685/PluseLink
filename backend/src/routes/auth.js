// src/routes/auth.js — Authentication routes (register, login, refresh)
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth');

const router = express.Router();

// Cookie options for JWT tokens
const accessCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
};

// Generate tokens
function generateTokens(userId, role) {
  const accessToken = jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiry });
  const refreshToken = jwt.sign({ userId, role }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiry });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, bloodGroup, role, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        timestamp: new Date().toISOString(),
      });
    }

    // Create user (password hashing happens in pre-save hook)
    const user = new User({
      name,
      email,
      passwordHash: password,
      bloodGroup,
      role,
      location: location || { type: 'Point', coordinates: [73.8567, 18.5204] }, // Default: Pune center
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          bloodGroup: user.bloodGroup,
          role: user.role,
          location: user.location,
          available: user.available,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          bloodGroup: user.bloodGroup,
          role: user.role,
          location: user.location,
          available: user.available,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
        timestamp: new Date().toISOString(),
      });
    }

    const decoded = jwt.verify(token, env.jwtRefreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString(),
      });
    }

    // Rotate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions });

    res.json({
      success: true,
      data: { message: 'Tokens refreshed' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.jwtRefreshSecret);
        if (decoded) {
          await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
        }
      } catch {
        // Token invalid or expired — proceed with logout anyway
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
