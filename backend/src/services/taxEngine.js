/**
 * Tax Engine Service
 * Calculates VAT and other tax obligations for Kenyan businesses
 *
 * Kenya VAT rates:
 * - Standard rate: 16% (effective from 1 Jan 2024, was 18%)
 * - Zero-rated: 0%
 * - Exempt: Not subject to VAT
 */

export const VAT_RATES = {
  STANDARD: 16.0,
  ZERO_RATED: 0.0,
  EXEMPT: 0.0,
};

export const TAX_TYPES = {
  VAT: 'vat',
  INCOME_TAX: 'income_tax',
  TURNOVER_TAX: 'turnover_tax',
  PAYE: 'paye',
  NSSF: 'nssf',
};

/**
 * Calculate VAT for a single amount (exclusive)
 * @param {number} amount - The taxable amount (exclusive of VAT)
 * @param {number} rate - VAT rate (default 16%)
 * @returns {number} VAT amount
 */
export function calculateVat(amount, rate = VAT_RATES.STANDARD) {
  return parseFloat((amount * rate / 100).toFixed(2));
}

/**
 * Calculate VAT exclusive amount from inclusive amount
 * @param {number} inclusiveAmount - Amount including VAT
 * @param {number} rate - VAT rate
 * @returns {number} VAT-exclusive amount
 */
export function exclusiveFromInclusive(inclusiveAmount, rate = VAT_RATES.STANDARD) {
  const exclusive = inclusiveAmount / (1 + rate / 100);
  return parseFloat(exclusive.toFixed(2));
}

/**
 * Calculate invoice totals
 * @param {Array} items - Array of line items
 * @returns {Object} - { subtotal, vat_amount, total_amount }
 */
export function calculateInvoiceTotals(items) {
  let subtotal = 0;
  let vatAmount = 0;

  for (const item of items) {
    const lineTotal = parseFloat((item.quantity * item.unit_price).toFixed(2));
    const itemVat = item.vat_exempt
      ? 0
      : calculateVat(lineTotal, item.vat_rate || VAT_RATES.STANDARD);

    subtotal += lineTotal;
    vatAmount += itemVat;
  }

  const totalAmount = parseFloat((subtotal + vatAmount).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    vat_amount: parseFloat(vatAmount.toFixed(2)),
    total_amount: totalAmount,
  };
}

/**
 * Calculate VAT liability: Output Tax - Input Tax
 * @param {Object} options
 * @param {number} options.outputTax - VAT collected from customers
 * @param {number} options.inputTax - VAT paid to suppliers
 * @returns {number} VAT payable (positive) or refundable (negative)
 */
export function calculateVatLiability({ outputTax = 0, inputTax = 0 }) {
  const liability = outputTax - inputTax;
  return parseFloat(liability.toFixed(2));
}

/**
 * Get tax period based on frequency
 * @param {string} frequency - 'monthly', 'quarterly', 'annual'
 * @param {Date} date
 * @returns {Object} - { period_start, period_end, period_label }
 */
export function getTaxPeriod(frequency, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (frequency) {
    case 'monthly':
      return {
        period_start: new Date(year, month - 1, 1),
        period_end: new Date(year, month, 0),
        period_label: `${year}-${String(month).padStart(2, '0')}`,
      };
    case 'quarterly': {
      const quarter = Math.floor((month - 1) / 3) + 1;
      const startMonth = (quarter - 1) * 3 + 1;
      return {
        period_start: new Date(year, startMonth - 1, 1),
        period_end: new Date(year, startMonth + 2, 0),
        period_label: `Q${quarter} ${year}`,
      };
    }
    case 'annual':
      return {
        period_start: new Date(year, 0, 1),
        period_end: new Date(year, 11, 31),
        period_label: `${year}`,
      };
    default:
      return {
        period_start: new Date(year, month - 1, 1),
        period_end: new Date(year, month, 0),
        period_label: `${year}-${String(month).padStart(2, '0')}`,
      };
  }
}

/**
 * Calculate tax summary for a business
 * @param {number} businessId
 * @param {Object} db - Database instance
 * @returns {Object} - Summary of tax obligations
 */
export async function calculateTaxSummary(businessId, db) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthLabel = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const outputTaxResult = await db.get(
    `SELECT COALESCE(SUM(vat_amount), 0) as total FROM invoices WHERE business_id = ? AND status IN ('issued', 'paid') AND strftime('%Y-%m', created_at) = ?`,
    [businessId, monthLabel]
  );

  const outputTax = outputTaxResult.total;
  const inputTax = outputTax * 0.5; // Simplified
  const vatLiability = calculateVatLiability({ outputTax, inputTax });

  return {
    output_tax: outputTax,
    input_tax: parseFloat(inputTax.toFixed(2)),
    vat_payable: vatLiability > 0 ? vatLiability : 0,
    vat_refundable: vatLiability < 0 ? Math.abs(vatLiability) : 0,
    net_vat: vatLiability,
    period: getTaxPeriod('monthly'),
  };
}

/**
 * Generate tax obligation records for upcoming periods
 */
export async function generateTaxObligations(businessId) {
  const now = new Date();
  const obligations = [];

  for (let i = 0; i < 3; i++) {
    const periodDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const { period_start, period_end, period_label } = getTaxPeriod('monthly', periodDate);

    const dueDate = new Date(period_end);
    dueDate.setDate(dueDate.getDate() + 5);

    obligations.push({
      business_id: businessId,
      tax_type: TAX_TYPES.VAT,
      period: period_label,
      period_start: period_start.toISOString().split('T')[0],
      period_end: period_end.toISOString().split('T')[0],
      calculated_amount: 0,
      due_date: dueDate.toISOString().split('T')[0],
    });
  }

  return obligations;
}

export default {
  VAT_RATES,
  TAX_TYPES,
  calculateVat,
  exclusiveFromInclusive,
  calculateInvoiceTotals,
  calculateVatLiability,
  getTaxPeriod,
  calculateTaxSummary,
  generateTaxObligations,
};
