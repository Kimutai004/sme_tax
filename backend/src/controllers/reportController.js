/**
 * Report Controller
 * Generates business performance insights and compliance reports
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateVatLiability } from '../services/taxEngine.js';
import { performReconciliation, getReconciliationHistory } from '../services/reconciliationService.js';

// @desc    Get dashboard summary
// @route   GET /api/v1/reports/dashboard
// @access  Private
export const getDashboard = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthLabel = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Monthly sales
  const monthlySales = await db.get(
    `SELECT COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(vat_amount), 0) as vat, COUNT(*) as count FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND status IN ('issued', 'paid')`,
    [req.businessId, monthLabel]
  );

  // Total customers
  const customerCount = await db.get(
    'SELECT COUNT(*) as count FROM customers WHERE business_id = ?',
    [req.businessId]
  );

  // Total products
  const productCount = await db.get(
    'SELECT COUNT(*) as count FROM products WHERE business_id = ?',
    [req.businessId]
  );

  // Outstanding invoices (not paid)
  const outstandingResult = await db.get(
    `SELECT COALESCE(SUM(balance), 0) as total FROM invoices WHERE business_id = ? AND status != 'cancelled' AND balance > 0`,
    [req.businessId]
  );

  // Recent invoices
  const recentInvoices = await db.all(
    `SELECT id, invoice_number, total_amount, status, created_at FROM invoices WHERE business_id = ? ORDER BY created_at DESC LIMIT 5`,
    [req.businessId]
  );

  // VAT liability
  const vatLiability = calculateVatLiability({
    outputTax: monthlySales.vat,
    inputTax: monthlySales.vat * 0.5,
  });

  // Upcoming obligations
  const upcomingObligations = await db.all(
    `SELECT * FROM tax_obligations WHERE business_id = ? AND status = 'pending' AND filed = 0 AND due_date >= ? ORDER BY due_date ASC LIMIT 3`,
    [req.businessId, now.toISOString().split('T')[0]]
  );

  // Unread notifications count
  const unreadNotifications = await db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    data: {
      monthly_sales: {
        total: parseFloat(monthlySales.total),
        vat: parseFloat(monthlySales.vat),
        count: monthlySales.count,
      },
      customer_count: customerCount.count,
      product_count: productCount.count,
      outstanding_balance: parseFloat(outstandingResult.total),
      vat_payable: vatLiability > 0 ? vatLiability : 0,
      recent_invoices: recentInvoices,
      upcoming_obligations: upcomingObligations,
      unread_notifications: unreadNotifications.count,
    },
  });
});

// @desc    Get sales report
// @route   GET /api/v1/reports/sales
// @access  Private
export const getSalesReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, groupBy = 'month' } = req.query;

  const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  let dateFormat;
  switch (groupBy) {
    case 'month': dateFormat = '%Y-%m'; break;
    case 'week': dateFormat = '%Y-W%W'; break;
    case 'day': dateFormat = '%Y-%m-%d'; break;
    default: dateFormat = '%Y-%m';
  }

  const results = await db.all(
    `SELECT 
      strftime('${dateFormat}', created_at) as period,
      COUNT(*) as invoice_count,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(vat_amount), 0) as total_vat,
      COALESCE(SUM(balance), 0) as outstanding
    FROM invoices 
    WHERE business_id = ? AND date(created_at) >= date(?) AND date(created_at) <= date(?) AND status IN ('issued', 'paid')
    GROUP BY period
    ORDER BY period ASC`,
    [req.businessId, start, end]
  );

  res.status(200).json({
    success: true,
    period_start: start,
    period_end: end,
    data: results.map(r => ({
      period: r.period,
      invoice_count: r.invoice_count,
      total_sales: parseFloat(r.total_sales),
      total_vat: parseFloat(r.total_vat),
      outstanding: parseFloat(r.outstanding),
    })),
  });
});

// @desc    Get customer report
// @route   GET /api/v1/reports/customers
// @access  Private
export const getCustomerReport = asyncHandler(async (req, res, next) => {
  const results = await db.all(
    `SELECT 
      c.id, c.name, c.email, c.phone,
      COUNT(i.id) as invoice_count,
      COALESCE(SUM(i.total_amount), 0) as total_purchased,
      COALESCE(SUM(i.balance), 0) as outstanding_balance
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE c.business_id = ?
    GROUP BY c.id
    ORDER BY total_purchased DESC
    LIMIT 20`,
    [req.businessId]
  );

  res.status(200).json({
    success: true,
    data: results.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      invoice_count: r.invoice_count,
      total_purchased: parseFloat(r.total_purchased),
      outstanding_balance: parseFloat(r.outstanding_balance),
    })),
  });
});

// @desc    Run reconciliation
// @route   POST /api/v1/reports/reconcile
// @access  Private
export const runReconciliation = asyncHandler(async (req, res, next) => {
  const { period } = req.body;
  const result = await performReconciliation(req.businessId, db, period);

  res.status(200).json({
    success: true,
    message: 'Reconciliation completed',
    data: result,
  });
});

// @desc    Get reconciliation history
// @route   GET /api/v1/reports/reconciliation
// @access  Private
export const getReconciliationReport = asyncHandler(async (req, res, next) => {
  const history = await getReconciliationHistory(req.businessId, db);

  res.status(200).json({
    success: true,
    data: history,
  });
});

// @desc    Get VAT return report
// @route   GET /api/v1/reports/vat-return
// @access  Private
export const getVatReturnReport = asyncHandler(async (req, res, next) => {
  const { period } = req.query;
  const periodLabel = period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const invoices = await db.all(
    `SELECT * FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND status IN ('issued', 'paid')`,
    [req.businessId, periodLabel]
  );

  let outputTax = 0;
  let totalSales = 0;
  let totalVatExclusive = 0;

  for (const inv of invoices) {
    outputTax += parseFloat(inv.vat_amount);
    totalSales += parseFloat(inv.total_amount);
    totalVatExclusive += parseFloat(inv.subtotal);
  }

  const inputTax = totalVatExclusive * 0.5 * 0.16; // Simplified
  const vatPayable = outputTax - inputTax;

  res.status(200).json({
    success: true,
    data: {
      period: periodLabel,
      total_sales: parseFloat(totalSales.toFixed(2)),
      vat_exclusive: parseFloat(totalVatExclusive.toFixed(2)),
      output_tax: parseFloat(outputTax.toFixed(2)),
      input_tax: parseFloat(inputTax.toFixed(2)),
      vat_payable: parseFloat(vatPayable.toFixed(2)),
      invoice_count: invoices.length,
    },
  });
});
