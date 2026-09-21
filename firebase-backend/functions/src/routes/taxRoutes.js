const express = require('express');
const router = express.Router();

// Create tax obligation
router.post('/', async (req, res, next) => {
  try {
    const { businessId, taxType, period, periodStart, periodEnd, calculatedAmount, dueDate } = req.body;
    
    if (!businessId || !taxType || !calculatedAmount) {
      return res.status(400).json({
        success: false,
        error: 'Business ID, tax type, and calculated amount are required'
      });
    }
    
    const obligationData = {
      businessId,
      taxType,
      period,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      calculatedAmount,
      paidAmount: 0,
      status: 'pending',
      dueDate: dueDate || null,
      filed: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const obligationRef = await req.db.collection('tax_obligations').add(obligationData);
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'create_tax_obligation',
      resourceType: 'tax_obligation',
      resourceId: obligationRef.id,
      details: { taxType, businessId },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      obligation: {
        id: obligationRef.id,
        ...obligationData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get tax obligations by business
router.get('/business/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    const snapshot = await req.db.collection('tax_obligations')
      .where('businessId', '==', businessId)
      .orderBy('periodEnd', 'desc')
      .get();
    
    const obligations = [];
    snapshot.forEach(doc => {
      const obligation = doc.data();
      obligation.id = doc.id;
      obligations.push(obligation);
    });
    
    res.json({
      success: true,
      obligations
    });
  } catch (error) {
    next(error);
  }
});

// Get obligation by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('tax_obligations').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax obligation not found'
      });
    }
    
    const obligation = doc.data();
    obligation.id = doc.id;
    
    res.json({
      success: true,
      obligation
    });
  } catch (error) {
    next(error);
  }
});

// Update obligation
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.createdAt;
    updates.updatedAt = new Date();
    
    await req.db.collection('tax_obligations').doc(id).update(updates);
    
    const updatedDoc = await req.db.collection('tax_obligations').doc(id).get();
    const obligation = updatedDoc.data();
    obligation.id = updatedDoc.id;
    
    res.json({
      success: true,
      obligation
    });
  } catch (error) {
    next(error);
  }
});

// Mark as filed
router.post('/:id/file', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('tax_obligations').doc(id).update({
      filed: 1,
      status: 'filed',
      updatedAt: new Date()
    });
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'file_tax_obligation',
      resourceType: 'tax_obligation',
      resourceId: id,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Tax obligation filed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Record payment
router.post('/:id/payment', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment amount is required'
      });
    }
    
    const doc = await req.db.collection('tax_obligations').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Tax obligation not found'
      });
    }
    
    const obligation = doc.data();
    const newPaidAmount = (obligation.paidAmount || 0) + amount;
    
    await req.db.collection('tax_obligations').doc(id).update({
      paidAmount: newPaidAmount,
      status: newPaidAmount >= obligation.calculatedAmount ? 'paid' : 'partial',
      updatedAt: new Date()
    });
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'tax_payment',
      resourceType: 'tax_obligation',
      resourceId: id,
      details: { amount },
      createdAt: new Date()
    });
    
    const updatedDoc = await req.db.collection('tax_obligations').doc(id).get();
    const updatedObligation = updatedDoc.data();
    updatedObligation.id = updatedDoc.id;
    
    res.json({
      success: true,
      obligation: updatedObligation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;