const express = require('express');
const router = express.Router();

// Create customer
router.post('/', async (req, res, next) => {
  try {
    const { businessId, name, email, phone, physicalAddress, kraPin, customerType, creditLimit } = req.body;
    
    if (!businessId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and customer name are required'
      });
    }
    
    const customerData = {
      businessId,
      name,
      email: email || '',
      phone: phone || '',
      physicalAddress: physicalAddress || '',
      kraPin: kraPin || '',
      customerType: customerType || 'retail',
      creditLimit: creditLimit || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const customerRef = await req.db.collection('customers').add(customerData);
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'create_customer',
      resourceType: 'customer',
      resourceId: customerRef.id,
      details: { name, businessId },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      customer: {
        id: customerRef.id,
        ...customerData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get customers by business
router.get('/business/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    const snapshot = await req.db.collection('customers')
      .where('businessId', '==', businessId)
      .orderBy('name')
      .get();
    
    const customers = [];
    snapshot.forEach(doc => {
      const customer = doc.data();
      customer.id = doc.id;
      customers.push(customer);
    });
    
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    next(error);
  }
});

// Get customer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('customers').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    const customer = doc.data();
    customer.id = doc.id;
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.createdAt;
    updates.updatedAt = new Date();
    
    await req.db.collection('customers').doc(id).update(updates);
    
    const updatedDoc = await req.db.collection('customers').doc(id).get();
    const customer = updatedDoc.data();
    customer.id = updatedDoc.id;
    
    res.json({
      success: true,
      customer
    });
  } catch (error) {
    next(error);
  }
});

// Delete customer
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('customers').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;