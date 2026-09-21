const express = require('express');
const router = express.Router();

// Create business
router.post('/', async (req, res, next) => {
  try {
    const { userId, name, kraPin, physicalAddress, postalAddress, email, phone, businessType, industry, vatRegistered, vatNumber, currency } = req.body;
    
    if (!userId || !name || !kraPin) {
      return res.status(400).json({
        success: false,
        error: 'User ID, business name, and KRA PIN are required'
      });
    }
    
    const businessData = {
      userId,
      name,
      kraPin,
      physicalAddress: physicalAddress || '',
      postalAddress: postalAddress || '',
      email: email || '',
      phone: phone || '',
      businessType: businessType || '',
      industry: industry || '',
      vatRegistered: vatRegistered ? 1 : 0,
      vatNumber: vatNumber || '',
      currency: currency || 'KES',
      etimsEnabled: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const businessRef = await req.db.collection('businesses').add(businessData);
    
    // Log activity
    await req.db.collection('activities').add({
      userId,
      action: 'create_business',
      resourceType: 'business',
      resourceId: businessRef.id,
      details: { name, kraPin },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      business: {
        id: businessRef.id,
        ...businessData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get business by user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await req.db.collection('businesses')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    const business = snapshot.docs[0].data();
    business.id = snapshot.docs[0].id;
    
    res.json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
});

// Get business by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('businesses').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    const business = doc.data();
    business.id = doc.id;
    
    res.json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
});

// Update business
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating these fields
    delete updates.userId;
    delete updates.createdAt;
    
    updates.updatedAt = new Date();
    
    await req.db.collection('businesses').doc(id).update(updates);
    
    // Log activity
    await req.db.collection('activities').add({
      userId: updates.updatedBy || 'system',
      action: 'update_business',
      resourceType: 'business',
      resourceId: id,
      details: { updates: Object.keys(updates) },
      createdAt: new Date()
    });
    
    const updatedDoc = await req.db.collection('businesses').doc(id).get();
    const business = updatedDoc.data();
    business.id = updatedDoc.id;
    
    res.json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
});

// Enable eTIMS for business
router.post('/:id/enable-etims', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('businesses').doc(id).update({
      etimsEnabled: 1,
      updatedAt: new Date()
    });
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'enable_etims',
      resourceType: 'business',
      resourceId: id,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'eTIMS enabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;