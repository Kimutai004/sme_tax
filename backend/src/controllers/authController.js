/**
 * Auth Controller
 * Handles registration, login, and authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.business_id,
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'sm_secret_key_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser) {
    return next(new ApiError('User already registered with this email', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await db.run(
    'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, hashedPassword, phone || null, 'business_owner']
  );

  const user = await db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [result.lastID]);

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError('Please provide email and password', 400));
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return next(new ApiError('Invalid credentials', 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError('Invalid credentials', 401));
  }

  const business = await db.get('SELECT id, name FROM businesses WHERE user_id = ?', [user.id]);
  const token = generateToken({ ...user, business_id: business?.id });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      business: business ? { id: business.id, name: business.name } : null,
    },
  });
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
  const business = await db.get('SELECT * FROM businesses WHERE user_id = ?', [user.id]);

  res.status(200).json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, business: business || null },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;

  if (name) {
    await db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, req.user.id]);
  }
  if (phone !== undefined) {
    await db.run('UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [phone || null, req.user.id]);
  }

  const user = await db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]);

  res.status(200).json({ success: true, message: 'Profile updated successfully', user });
});

// @desc    Change password
// @route   PUT /api/v1/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new ApiError('Current password is incorrect', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, req.user.id]);

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});
