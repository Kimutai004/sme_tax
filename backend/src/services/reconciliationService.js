/**
 * Reconciliation Service
 * Compares internal business records with eTIMS data
 */

/**
 * Perform reconciliation for a business over a period
 * @param {number} businessId
 * @param {Object} db - Database instance
 * @param {string} periodLabel - e.g., "2024-01"
 * @returns {Object} - Reconciliation result
 */
export async function performReconciliation(businessId, db, periodLabel = null) {
  if (!periodLabel) {
    const now = new Date();
    periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Internal sales
  const internalSalesResult = await db.get(
    `SELECT COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(vat_amount), 0) as vat, COUNT(*) as count FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND status IN ('issued', 'paid')`,
    [businessId, periodLabel]
  );

  // eTIMS submitted sales
  const etimsSalesResult = await db.get(
    `SELECT COALESCE(SUM(total_amount), 0) as total, COALESCE(SUM(vat_amount), 0) as vat, COUNT(*) as count FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND etims_status = 'approved'`,
    [businessId, periodLabel]
  );

  const internalSales = internalSalesResult.total;
  const etimsSales = etimsSalesResult.total;
  const internalVat = internalSalesResult.vat;
  const etimsVat = etimsSalesResult.vat;
  const difference = parseFloat((internalSales - etimsSales).toFixed(2));
  const vatDifference = parseFloat((internalVat - etimsVat).toFixed(2));

  let status = 'matched';
  const discrepancies = [];

  if (Math.abs(difference) > 0.01) {
    status = 'discrepancy';
    discrepancies.push({
      type: 'sales_mismatch',
      internal_amount: internalSales,
      etims_amount: etimsSales,
      difference: difference,
    });
  }

  if (Math.abs(vatDifference) > 0.01) {
    status = 'discrepancy';
    discrepancies.push({
      type: 'vat_mismatch',
      internal_vat: internalVat,
      etims_vat: etimsVat,
      difference: vatDifference,
    });
  }

  // Invoices not yet transmitted to eTIMS
  const pendingInvoices = await db.all(
    `SELECT id, invoice_number, total_amount, created_at FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND etims_status IS NULL`,
    [businessId, periodLabel]
  );

  if (pendingInvoices.length > 0) {
    discrepancies.push({
      type: 'missing_etims_submissions',
      count: pendingInvoices.length,
      invoices: pendingInvoices,
    });
  }

  // Period start and end dates
  const [year, month] = periodLabel.split('-');
  const periodStart = `${year}-${month}-01`;
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const periodEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  await db.run(
    `INSERT INTO reconciliation (business_id, period, period_start, period_end, internal_sales, etims_sales, difference, status, last_checked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [businessId, periodLabel, periodStart, periodEnd, internalSales, etimsSales, difference, status, new Date().toISOString()]
  );

  const totalCount = await db.get(
    'SELECT COUNT(*) as count FROM invoices WHERE business_id = ? AND strftime(\'%Y-%m\', created_at) = ?',
    [businessId, periodLabel]
  );

  return {
    business_id: businessId,
    period: periodLabel,
    period_start: periodStart,
    period_end: periodEnd,
    internal_sales: internalSales,
    etims_sales: etimsSales,
    difference: difference,
    internal_vat: internalVat,
    etims_vat: etimsVat,
    vat_difference: vatDifference,
    status: status,
    total_invoices: totalCount.count,
    etims_submitted: etimsSalesResult.count,
    pending_submission: pendingInvoices.length,
    discrepancies: discrepancies,
  };
}

/**
 * Check for missing eTIMS submissions
 */
export async function checkMissingSubmissions(businessId, db) {
  return await db.all(
    `SELECT id, invoice_number, total_amount, created_at FROM invoices WHERE business_id = ? AND etims_status IS NULL AND status != 'cancelled'`,
    [businessId]
  );
}

/**
 * Get reconciliation history
 */
export async function getReconciliationHistory(businessId, db, limit = 10) {
  const results = await db.all(
    `SELECT * FROM reconciliation WHERE business_id = ? ORDER BY created_at DESC LIMIT ?`,
    [businessId, limit]
  );
  return results.map(r => ({
    ...r,
    internal_sales: parseFloat(r.internal_sales),
    etims_sales: parseFloat(r.etims_sales),
    difference: parseFloat(r.difference),
  }));
}

export default {
  performReconciliation,
  checkMissingSubmissions,
  getReconciliationHistory,
};
