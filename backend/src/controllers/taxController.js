/**
 * Tax Controller
 * Manages tax obligations, VAT calculations, and compliance
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateTaxSummary, generateTaxObligations, getTaxPeriod, calculateVatLiability, TAX_TYPES } from '../services/taxEngine.js';

// @desc    Get tax dashboard summary
// @route   GET /api/v1/taxes/summary
// @access  Private
export const getTaxSummary = asyncHandler(async (req, res, next) => {
  const summary = await calculateTaxSummary(req.businessId, db);

  const obligations = await db.all(
    `SELECT * FROM tax_obligations WHERE business_id = ? AND status = 'pending' AND filed = 0 ORDER BY due_date ASC LIMIT 5`,
    [req.businessId]
  );

  const filedObligations = await db.all(
    `SELECT * FROM tax_obligations WHERE business_id = ? AND filed = 1 ORDER BY created_at DESC LIMIT 5`,
    [req.businessId]
  );

  res.status(200).json({
    success: true,
    data: {
      current_period: summary.period,
      output_tax: summary.output_tax,
      input_tax: summary.input_tax,
      vat_payable: summary.vat_payable,
      vat_refundable: summary.vat_refundable,
      net_vat: summary.net_vat,
      upcoming_obligations: obligations,
      recent_filings: filedObligations,
    },
  });
});

// @desc    Get all tax obligations
// @route   GET /api/v1/taxes/obligations
// @access  Private
export const getTaxObligations = asyncHandler(async (req, res, next) => {
  const { status = '', type = '' } = req.query;
  let query = 'SELECT * FROM tax_obligations WHERE business_id = ?';
  const params = [req.businessId];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (type) { query += ' AND tax_type = ?'; params.push(type); }
  query += ' ORDER BY due_date ASC';

  const obligations = await db.all(query, params);
  res.status(200).json({ success: true, count: obligations.length, data: obligations });
});

// @desc    Get single tax obligation
// @route   GET /api/v1/taxes/obligations/:id
// @access  Private
export const getTaxObligation = asyncHandler(async (req, res, next) => {
  const obligation = await db.get('SELECT * FROM tax_obligations WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!obligation) { return next(new ApiError('Tax obligation not found', 404)); }
  res.status(200).json({ success: true, data: obligation });
});

// @desc    Create tax obligation
// @route   POST /api/v1/taxes/obligations
// @access  Private
export const createTaxObligation = asyncHandler(async (req, res, next) => {
  const { taxType, period, calculatedAmount, dueDate } = req.body;
  const result = await db.run(
    `INSERT INTO tax_obligations (business_id, tax_type, period, calculated_amount, due_date) VALUES (?, ?, ?, ?, ?)`,
    [req.businessId, taxType || TAX_TYPES.VAT, period || '', calculatedAmount || 0, dueDate || null]
  );
  const obligation = await db.get('SELECT * FROM tax_obligations WHERE id = ?', [result.lastID]);
  res.status(201).json({ success: true, message: 'Tax obligation created', data: obligation });
});

// @desc    Mark tax obligation as filed
// @route   PUT /api/v1/taxes/obligations/:id/file
// @access  Private
export const fileTaxObligation = asyncHandler(async (req, res, next) => {
  const obligation = await db.get('SELECT * FROM tax_obligations WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!obligation) { return next(new ApiError('Tax obligation not found', 404)); }

  await db.run(`UPDATE tax_obligations SET status = 'filed', filed = 1, paid_amount = calculated_amount, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
  const updated = await db.get('SELECT * FROM tax_obligations WHERE id = ?', [req.params.id]);
  res.status(200).json({ success: true, message: 'Tax obligation marked as filed', data: updated });
});

// @desc    Generate tax obligations for next periods
// @route   POST /api/v1/taxes/generate-obligations
// @access  Private
export const generateObligations = asyncHandler(async (req, res, next) => {
  const obligations = await generateTaxObligations(req.businessId);
  const created = [];
  for (const obl of obligations) {
    const result = await db.run(
      `INSERT INTO tax_obligations (business_id, tax_type, period, period_start, period_end, calculated_amount, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [obl.business_id, obl.tax_type, obl.period, obl.period_start, obl.period_end, obl.calculated_amount, obl.due_date]
    );
    created.push(result.lastID);
  }
  res.status(201).json({ success: true, message: `${created.length} tax obligations generated`, data: created });
});

// @desc    Calculate VAT for a transaction
// @route   POST /api/v1/taxes/calculate
// @access  Private
export const calculateVat = asyncHandler(async (req, res, next) => {
  const { amount, vatRate = 16.0, vatExempt = false } = req.body;

  if (vatExempt) {
    return res.status(200).json({ success: true, data: { amount: parseFloat(amount.toFixed(2)), vat_amount: 0, vat_rate: 0, total: parseFloat(amount.toFixed(2)), exempt: true } });
  }

  const vatAmount = parseFloat((amount * vatRate / 100).toFixed(2));
  const total = parseFloat((amount + vatAmount).toFixed(2));

  res.status(200).json({ success: true, data: { amount: parseFloat(amount.toFixed(2)), vat_amount: vatAmount, vat_rate: vatRate, total: total, exempt: false } });
});
