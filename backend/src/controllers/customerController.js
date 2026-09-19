/**
 * Customer Controller
 * Manages customer records for SME businesses
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all customers for a business
// @route   GET /api/v1/customers
// @access  Private
export const getCustomers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM customers WHERE business_id = ?';
  const params = [req.businessId];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR kra_pin LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const customers = await db.all(query, params);

  const countResult = await db.get(
    'SELECT COUNT(*) as count FROM customers WHERE business_id = ?',
    [req.businessId]
  );

  res.status(200).json({
    success: true,
    count: customers.length,
    total: countResult.count,
    data: customers,
  });
});

// @desc    Get single customer
// @route   GET /api/v1/customers/:id
// @access  Private
export const getCustomer = asyncHandler(async (req, res, next) => {
  const customer = await db.get(
    'SELECT * FROM customers WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!customer) {
    return next(new ApiError('Customer not found', 404));
  }

  // Get customer's invoice history
  const invoices = await db.all(
    `SELECT id, invoice_number, invoice_date, total_amount, status FROM invoices WHERE customer_id = ? ORDER BY invoice_date DESC LIMIT 10`,
    [req.params.id]
  );

  res.status(200).json({
    success: true,
    data: {
      ...customer,
      invoice_history: invoices,
    },
  });
});

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private
export const createCustomer = asyncHandler(async (req, res, next) => {
  const {
    name, email, phone, physicalAddress, kraPin, customerType, creditLimit,
  } = req.body;

  if (!name) {
    return next(new ApiError('Customer name is required', 400));
  }

  const result = await db.run(
    `INSERT INTO customers (business_id, name, email, phone, physical_address, kra_pin, customer_type, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.businessId, name, email || null, phone || null, physicalAddress || null, kraPin || null, customerType || 'retail', creditLimit || 0]
  );

  const customer = await db.get('SELECT * FROM customers WHERE id = ?', [result.lastID]);

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer,
  });
});

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
export const updateCustomer = asyncHandler(async (req, res, next) => {
  const { name, email, phone, physicalAddress, kraPin, customerType, creditLimit } = req.body;

  const existing = await db.get(
    'SELECT * FROM customers WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!existing) {
    return next(new ApiError('Customer not found', 404));
  }

  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
  if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
  if (physicalAddress !== undefined) { fields.push('physical_address = ?'); values.push(physicalAddress || null); }
  if (kraPin !== undefined) { fields.push('kra_pin = ?'); values.push(kraPin || null); }
  if (customerType !== undefined) { fields.push('customer_type = ?'); values.push(customerType); }
  if (creditLimit !== undefined) { fields.push('credit_limit = ?'); values.push(creditLimit || 0); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id, req.businessId);

  await db.run(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND business_id = ?`,
    [...values]
  );

  const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: customer,
  });
});

// @desc    Delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
export const deleteCustomer = asyncHandler(async (req, res, next) => {
  const existing = await db.get(
    'SELECT * FROM customers WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!existing) {
    return next(new ApiError('Customer not found', 404));
  }

  // Check if customer has invoices
  const invoiceCount = await db.get(
    'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?',
    [req.params.id]
  );

  if (invoiceCount.count > 0) {
    return next(new ApiError('Cannot delete customer with existing invoices', 400));
  }

  await db.run('DELETE FROM customers WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
  });
});
