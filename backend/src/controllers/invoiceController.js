/**
 * Invoice Controller
 * Manages electronic invoices with eTIMS integration
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateInvoiceTotals, VAT_RATES } from '../services/taxEngine.js';
import { submitInvoiceToEtimis, retryEtimisSubmission, EITMS_STATUS } from '../services/etimsGateway.js';

function generateInvoiceNumber(businessId) {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return `INV-${year}-${String(month).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// @desc    Get all invoices for a business
// @route   GET /api/v1/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, status = '', customerId = '', search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT i.*, c.name as customer_name, c.email as customer_email
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.business_id = ?
  `;
  const params = [req.businessId];

  if (status) { query += ' AND i.status = ?'; params.push(status); }
  if (customerId) { query += ' AND i.customer_id = ?'; params.push(customerId); }
  if (search) { query += ' AND i.invoice_number LIKE ?'; params.push(`%${search}%`); }

  query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const invoices = await db.all(query, params);
  const countResult = await db.get('SELECT COUNT(*) as count FROM invoices WHERE business_id = ?', [req.businessId]);

  res.status(200).json({ success: true, count: invoices.length, total: countResult.count, data: invoices });
});

// @desc    Get single invoice with items
// @route   GET /api/v1/invoices/:id
// @access  Private
export const getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await db.get('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!invoice) { return next(new ApiError('Invoice not found', 404)); }

  const items = await db.all(`SELECT ii.*, p.name as product_name FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.id WHERE invoice_id = ?`, [req.params.id]);

  let customer = null;
  if (invoice.customer_id) {
    customer = await db.get('SELECT * FROM customers WHERE id = ?', [invoice.customer_id]);
  }

  res.status(200).json({ success: true, data: { ...invoice, customer, items } });
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices
// @access  Private
export const createInvoice = asyncHandler(async (req, res, next) => {
  const { customerId, invoiceDate, dueDate, items, notes, paymentMethod, submitToEtimis = false } = req.body;

  if (!items || items.length === 0) {
    return next(new ApiError('Invoice must have at least one item', 400));
  }

  const totals = calculateInvoiceTotals(items);
  const invoiceNumber = generateInvoiceNumber(req.businessId);
  const invoiceDateValue = invoiceDate || new Date().toISOString();
  const dueDateValue = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = await db.run(
    `INSERT INTO invoices (business_id, invoice_number, customer_id, invoice_date, due_date, status, subtotal, vat_amount, total_amount, balance, notes, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.businessId, invoiceNumber, customerId || null, invoiceDateValue, dueDateValue, 'draft', totals.subtotal, totals.vat_amount, totals.total_amount, totals.total_amount, notes || null, paymentMethod || null]
  );

  const invoiceId = result.lastID;

  // Create invoice items
  for (const item of items) {
    const lineTotal = parseFloat((item.quantity * item.unit_price).toFixed(2));
    const itemVat = item.vat_exempt
      ? 0
      : calculateInvoiceTotals([{ ...item, vat_rate: item.vat_rate || VAT_RATES.STANDARD }]).vat_amount;

    await db.run(
      `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, vat_rate, vat_amount, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, item.product_id || null, item.description || null, item.quantity, item.unit_price, item.vat_rate || VAT_RATES.STANDARD, itemVat, lineTotal]
    );

    // Update stock
    if (item.product_id) {
      await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND business_id = ?', [item.quantity, item.product_id, req.businessId]);
    }
  }

  const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
  const invoiceItems = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

  // Submit to eTIMS if requested
  if (submitToEtimis) {
    try {
      const etimsResult = await submitInvoiceToEtimis(invoice);
      if (etimsResult.success) {
        await db.run('UPDATE invoices SET etims_invoice_id = ?, etims_status = ?, status = ? WHERE id = ?',
          [etimsResult.etims_invoice_id, etimsResult.status, 'issued', invoiceId]);
        const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        return res.status(201).json({
          success: true, message: 'Invoice created and submitted to eTIMS',
          data: { ...updatedInvoice, items: invoiceItems }, etims: etimsResult,
        });
      } else {
        await db.run('UPDATE invoices SET etims_status = ? WHERE id = ?', [etimsResult.status, invoiceId]);
        const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
        return res.status(201).json({
          success: true, message: 'Invoice created but eTIMS submission failed. Will retry automatically.',
          data: { ...updatedInvoice, items: invoiceItems }, etims: etimsResult,
        });
      }
    } catch (error) {
      console.error('eTIMS submission error:', error);
    }
  }

  res.status(201).json({ success: true, message: 'Invoice created successfully', data: { ...invoice, items: invoiceItems } });
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:id
// @access  Private
export const updateInvoice = asyncHandler(async (req, res, next) => {
  const { status, notes, paymentMethod } = req.body;
  const invoice = await db.get('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!invoice) { return next(new ApiError('Invoice not found', 404)); }

  const fields = [];
  const values = [];
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes || null); }
  if (paymentMethod !== undefined) { fields.push('payment_method = ?'); values.push(paymentMethod || null); }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id, req.businessId);

  await db.run(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ? AND business_id = ?`, [...values]);

  // Auto-submit to eTIMS if status is 'issued' and not yet approved
  if (status === 'issued' && (!invoice.etims_status || invoice.etims_status === EITMS_STATUS.ERROR || invoice.etims_status === EITMS_STATUS.PENDING || invoice.etims_status === EITMS_STATUS.REJECTED)) {
    const etimsResult = await submitInvoiceToEtimis(invoice);
    if (etimsResult.success) {
      await db.run('UPDATE invoices SET etims_invoice_id = ?, etims_status = ?, status = ? WHERE id = ?',
        [etimsResult.etims_invoice_id, etimsResult.status, 'issued', req.params.id]);
    } else {
      await db.run('UPDATE invoices SET etims_status = ? WHERE id = ?', [etimsResult.status, req.params.id]);
    }
    const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    const items = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
    return res.status(200).json({
      success: true, message: 'Invoice updated and submitted to eTIMS',
      data: { ...updatedInvoice, items }, etims: etimsResult,
    });
  }

  const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  const items = await db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [req.params.id]);
  res.status(200).json({ success: true, message: 'Invoice updated successfully', data: { ...updatedInvoice, items } });
});

// @desc    Retry eTIMS submission
// @route   POST /api/v1/invoices/:id/retry-etims
// @access  Private
export const retryEtimis = asyncHandler(async (req, res, next) => {
  const invoice = await db.get('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!invoice) { return next(new ApiError('Invoice not found', 404)); }

  const etimsResult = await retryEtimisSubmission(invoice);
  if (etimsResult.success) {
    await db.run('UPDATE invoices SET etims_invoice_id = ?, etims_status = ?, status = ? WHERE id = ?',
      [etimsResult.etims_invoice_id, etimsResult.status, 'issued', req.params.id]);
  } else {
    await db.run('UPDATE invoices SET etims_status = ? WHERE id = ?', [etimsResult.status, req.params.id]);
  }

  const updatedInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  res.status(200).json({
    success: etimsResult.success,
    message: etimsResult.success ? 'eTIMS submission successful' : 'eTIMS submission failed',
    data: updatedInvoice, etims: etimsResult,
  });
});

// @desc    Delete invoice
// @route   DELETE /api/v1/invoices/:id
// @access  Private
export const deleteInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await db.get('SELECT * FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  if (!invoice) { return next(new ApiError('Invoice not found', 404)); }
  if (invoice.status === 'issued' && invoice.etims_status === 'approved') {
    return next(new ApiError('Cannot delete invoice already submitted to eTIMS', 400));
  }
  await db.run('DELETE FROM invoices WHERE id = ? AND business_id = ?', [req.params.id, req.businessId]);
  res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
});

// @desc    Get invoice statistics
// @route   GET /api/v1/invoices/stats
// @access  Private
export const getInvoiceStats = asyncHandler(async (req, res, next) => {
  const stats = await db.all(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(vat_amount), 0) as vat FROM invoices WHERE business_id = ? GROUP BY status`,
    [req.businessId]
  );

  const result = { total: 0, totalAmount: 0, totalVat: 0, byStatus: {} };
  for (const stat of stats) {
    result.byStatus[stat.status] = { count: stat.count, total: parseFloat(stat.total), vat: parseFloat(stat.vat) };
    result.total += stat.count;
    result.totalAmount += parseFloat(stat.total);
    result.totalVat += parseFloat(stat.vat);
  }
  res.status(200).json({ success: true, data: result });
});
