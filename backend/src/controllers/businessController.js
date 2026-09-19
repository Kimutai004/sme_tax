/**
 * Business Controller
 * Handles business profile management
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create business profile
// @route   POST /api/v1/business
// @access  Private
export const createBusiness = asyncHandler(async (req, res, next) => {
  const {
    name, kraPin, physicalAddress, postalAddress, email, phone,
    businessType, industry, vatRegistered, vatNumber, currency,
  } = req.body;

  const existing = await db.get('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
  if (existing) {
    return next(new ApiError('Business profile already exists. Use update instead.', 400));
  }

  const result = await db.run(
    `INSERT INTO businesses (user_id, name, kra_pin, physical_address, postal_address, email, phone, business_type, industry, vat_registered, vat_number, currency, etims_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, kraPin, physicalAddress || null, postalAddress || null, email || null, phone || null, businessType, industry, vatRegistered ? 1 : 0, vatNumber || null, currency || 'KES', 1]
  );

  const business = await db.get('SELECT * FROM businesses WHERE id = ?', [result.lastID]);

  res.status(201).json({ success: true, message: 'Business profile created successfully', business });
});

// @desc    Get business profile
// @route   GET /api/v1/business
// @access  Private
export const getBusiness = asyncHandler(async (req, res, next) => {
  const business = await db.get('SELECT * FROM businesses WHERE user_id = ?', [req.user.id]);
  if (!business) {
    return next(new ApiError('Business profile not found', 404));
  }
  res.status(200).json({ success: true, business });
});

// @desc    Update business profile
// @route   PUT /api/v1/business
// @access  Private
export const updateBusiness = asyncHandler(async (req, res, next) => {
  const {
    name, kraPin, physicalAddress, postalAddress, email, phone,
    businessType, industry, vatRegistered, vatNumber, currency,
  } = req.body;

  const fields = [];
  const values = [];
  if (name) { fields.push('name = ?'); values.push(name); }
  if (kraPin) { fields.push('kra_pin = ?'); values.push(kraPin); }
  if (physicalAddress !== undefined) { fields.push('physical_address = ?'); values.push(physicalAddress || null); }
  if (postalAddress !== undefined) { fields.push('postal_address = ?'); values.push(postalAddress || null); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
  if (businessType) { fields.push('business_type = ?'); values.push(businessType); }
  if (industry) { fields.push('industry = ?'); values.push(industry); }
  if (vatRegistered !== undefined) { fields.push('vat_registered = ?'); values.push(vatRegistered ? 1 : 0); }
  if (vatNumber !== undefined) { fields.push('vat_number = ?'); values.push(vatNumber || null); }
  if (currency) { fields.push('currency = ?'); values.push(currency); }

  if (fields.length === 0) {
    return next(new ApiError('No fields to update', 400));
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.user.id);

  await db.run(
    `UPDATE businesses SET ${fields.join(', ')} WHERE user_id = ?`,
    [...values]
  );

  const business = await db.get('SELECT * FROM businesses WHERE user_id = ?', [req.user.id]);
  res.status(200).json({ success: true, message: 'Business profile updated successfully', business });
});
