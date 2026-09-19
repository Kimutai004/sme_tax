/**
 * eTIMS Gateway Service
 * Simulates the Kenya Revenue Authority (KRA) eTIMS API
 * In production, this would connect to the actual KRA eTIMS portal
 */

import { v4 as uuidv4 } from 'uuid';

export const EITMS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ERROR: 'error',
};

/**
 * Generate a simulated eTIMS invoice ID
 */
export function generateEtimisInvoiceId() {
  return 'ETIMS-' + uuidv4().substring(0, 8).toUpperCase();
}

/**
 * Submit an invoice to the eTIMS gateway (simulated)
 */
export async function submitInvoiceToEtimis(invoice) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const etimsId = generateEtimisInvoiceId();
  const isSuccess = Math.random() > 0.05;

  if (isSuccess) {
    return {
      success: true,
      etims_invoice_id: etimsId,
      qr_code: 'https://kra.etims.go.ke/verify?qr=' + etimsId,
      qr_data: JSON.stringify({
        invoice_number: invoice.invoice_number,
        date: invoice.invoice_date,
        total: invoice.total_amount,
        vat: invoice.vat_amount,
        etims_id: etimsId,
      }),
      status: EITMS_STATUS.APPROVED,
      timestamp: new Date().toISOString(),
      acknowledgment: 'Invoice successfully submitted to eTIMS',
    };
  } else {
    return {
      success: false,
      error: 'Simulation: Random submission failure',
      status: EITMS_STATUS.ERROR,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Submit a credit note to eTIMS (simulated)
 */
export async function submitCreditNoteToEtimis(creditNote) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const etimsId = generateEtimisInvoiceId();
  return {
    success: true,
    etims_invoice_id: etimsId,
    qr_code: 'https://kra.etims.go.ke/verify?qr=' + etimsId,
    status: EITMS_STATUS.APPROVED,
    timestamp: new Date().toISOString(),
    acknowledgment: 'Credit note successfully submitted to eTIMS',
  };
}

/**
 * Verify an eTIMS invoice (simulated)
 */
export async function verifyEtimisInvoice(etimsId) {
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    success: true,
    etims_invoice_id: etimsId,
    status: EITMS_STATUS.APPROVED,
    verified_at: new Date().toISOString(),
    invoice_data: { validated: true },
  };
}

/**
 * Retry failed eTIMS submission
 */
export async function retryEtimisSubmission(invoice) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = await submitInvoiceToEtimis(invoice);
    if (result.success) {
      return { ...result, retry_attempt: attempt };
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }

  return {
    success: false,
    error: 'All retry attempts failed',
    status: EITMS_STATUS.ERROR,
  };
}

export default {
  EITMS_STATUS,
  submitInvoiceToEtimis,
  submitCreditNoteToEtimis,
  verifyEtimisInvoice,
  retryEtimisSubmission,
  generateEtimisInvoiceId,
};
