const express = require('express');
const router = express.Router();

// Get sales summary
router.get('/sales-summary/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = req.db.collection('invoices')
      .where('businessId', '==', businessId);
    
    if (startDate && endDate) {
      query = query
        .where('invoiceDate', '>=', new Date(startDate))
        .where('invoiceDate', '<=', new Date(endDate));
    }
    
    const snapshot = await query.get();
    
    let totalSales = 0;
    let totalVat = 0;
    let paidInvoices = 0;
    let draftInvoices = 0;
    let invoiceCount = 0;
    
    snapshot.forEach(doc => {
      const invoice = doc.data();
      totalSales += invoice.totalAmount || 0;
      totalVat += invoice.vatAmount || 0;
      
      if (invoice.status === 'paid') paidInvoices++;
      if (invoice.status === 'draft') draftInvoices++;
      invoiceCount++;
    });
    
    res.json({
      success: true,
      summary: {
        totalSales,
        totalVat,
        paidInvoices,
        draftInvoices,
        invoiceCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get VAT report
router.get('/vat-report/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = req.db.collection('invoices')
      .where('businessId', '==', businessId)
      .where('status', '!=', 'draft');
    
    if (startDate && endDate) {
      query = query
        .where('invoiceDate', '>=', new Date(startDate))
        .where('invoiceDate', '<=', new Date(endDate));
    }
    
    const snapshot = await query.get();
    
    let vatCollected = 0;
    let vatExemptSales = 0;
    let vatableSales = 0;
    let invoiceCount = 0;
    
    snapshot.forEach(doc => {
      const invoice = doc.data();
      vatCollected += invoice.vatAmount || 0;
      invoiceCount++;
      
      // Count items
      invoice.items?.forEach(item => {
        if (item.vatExempt) {
          vatExemptSales += item.lineTotal;
        } else {
          vatableSales += item.lineTotal;
        }
      });
    });
    
    res.json({
      success: true,
      report: {
        period: {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A'
        },
        summary: {
          vatCollected,
          vatableSales,
          vatExemptSales,
          invoiceCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get reconciliation report
router.get('/reconciliation/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { period } = req.query;
    
    // Get internal sales from invoices
    let query = req.db.collection('invoices')
      .where('businessId', '==', businessId)
      .where('status', '!=', 'draft');
    
    if (period) {
      query = query.where('period', '==', period);
    }
    
    const invoicesSnapshot = await query.get();
    
    let internalSales = 0;
    invoicesSnapshot.forEach(doc => {
      internalSales += doc.data().totalAmount || 0;
    });
    
    // In a real implementation, this would fetch eTIMS data from the API
    // For now, we'll use a placeholder
    const etimsSales = 0; // Would be fetched from eTIMS API
    
    const difference = internalSales - etimsSales;
    
    res.json({
      success: true,
      reconciliation: {
        internalSales,
        etimsSales,
        difference,
        status: difference === 0 ? 'matched' : 'mismatch',
        lastChecked: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get daily summary
router.get('/daily-summary/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await req.db.collection('invoices')
      .where('businessId', '==', businessId)
      .where('invoiceDate', '>=', today)
      .where('status', '!=', 'draft')
      .get();
    
    let totalSales = 0;
    let totalVat = 0;
    let invoiceCount = 0;
    
    snapshot.forEach(doc => {
      const invoice = doc.data();
      totalSales += invoice.totalAmount || 0;
      totalVat += invoice.vatAmount || 0;
      invoiceCount++;
    });
    
    res.json({
      success: true,
      summary: {
        date: today.toISOString(),
        totalSales,
        totalVat,
        invoiceCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;