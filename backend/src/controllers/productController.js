/**
 * Product Controller
 * Manages products and services for SME businesses
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all products for a business
// @route   GET /api/v1/products
// @access  Private
export const getProducts = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 100, search = '', category = '' } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM products WHERE business_id = ?';
  const params = [req.businessId];

  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const products = await db.all(query, params);

  const countResult = await db.get(
    'SELECT COUNT(*) as count FROM products WHERE business_id = ?',
    [req.businessId]
  );

  res.status(200).json({
    success: true,
    count: products.length,
    total: countResult.count,
    data: products,
  });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
export const getProduct = asyncHandler(async (req, res, next) => {
  const product = await db.get(
    'SELECT * FROM products WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private
export const createProduct = asyncHandler(async (req, res, next) => {
  const {
    name, description, sku, unitOfMeasure, unitPrice, costPrice,
    stockQuantity, vatRate, vatExempt, category,
  } = req.body;

  if (!name) {
    return next(new ApiError('Product name is required', 400));
  }

  // Check if SKU already exists
  if (sku) {
    const existing = await db.get('SELECT id FROM products WHERE sku = ? AND business_id = ?', [sku, req.businessId]);
    if (existing) {
      return next(new ApiError('SKU already exists for this business', 400));
    }
  }

  const result = await db.run(
    `INSERT INTO products (business_id, name, description, sku, unit_of_measure, unit_price, cost_price, stock_quantity, vat_rate, vat_exempt, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.businessId, name, description || null, sku || null, unitOfMeasure || 'piece', unitPrice, costPrice || 0, stockQuantity || 0, vatRate || 16.0, vatExempt ? 1 : 0, category || null]
  );

  const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private
export const updateProduct = asyncHandler(async (req, res, next) => {
  const {
    name, description, sku, unitOfMeasure, unitPrice, costPrice,
    stockQuantity, vatRate, vatExempt, category,
  } = req.body;

  const existing = await db.get(
    'SELECT * FROM products WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!existing) {
    return next(new ApiError('Product not found', 404));
  }

  const fields = [];
  const values = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description || null); }
  if (sku !== undefined) { fields.push('sku = ?'); values.push(sku || null); }
  if (unitOfMeasure !== undefined) { fields.push('unit_of_measure = ?'); values.push(unitOfMeasure); }
  if (unitPrice !== undefined) { fields.push('unit_price = ?'); values.push(unitPrice); }
  if (costPrice !== undefined) { fields.push('cost_price = ?'); values.push(costPrice || 0); }
  if (stockQuantity !== undefined) { fields.push('stock_quantity = ?'); values.push(stockQuantity); }
  if (vatRate !== undefined) { fields.push('vat_rate = ?'); values.push(vatRate); }
  if (vatExempt !== undefined) { fields.push('vat_exempt = ?'); values.push(vatExempt ? 1 : 0); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category || null); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id, req.businessId);

  await db.run(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND business_id = ?`,
    [...values]
  );

  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await db.get(
    'SELECT * FROM products WHERE id = ? AND business_id = ?',
    [req.params.id, req.businessId]
  );

  if (!product) {
    return next(new ApiError('Product not found', 404));
  }

  // Check if product is used in invoice items
  const itemCount = await db.get(
    'SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?',
    [req.params.id]
  );

  if (itemCount.count > 0) {
    return next(new ApiError('Cannot delete product used in invoices', 400));
  }

  await db.run('DELETE FROM products WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});
