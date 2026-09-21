const express = require('express');
const router = express.Router();

// Create product
router.post('/', async (req, res, next) => {
  try {
    const { businessId, name, description, sku, unitOfMeasure, unitPrice, costPrice, stockQuantity, vatRate, vatExempt, category } = req.body;
    
    if (!businessId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and product name are required'
      });
    }
    
    const productData = {
      businessId,
      name,
      description: description || '',
      sku: sku || '',
      unitOfMeasure: unitOfMeasure || 'piece',
      unitPrice: unitPrice || 0,
      costPrice: costPrice || 0,
      stockQuantity: stockQuantity || 0,
      vatRate: vatRate || 16.0,
      vatExempt: vatExempt ? 1 : 0,
      category: category || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const productRef = await req.db.collection('products').add(productData);
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'create_product',
      resourceType: 'product',
      resourceId: productRef.id,
      details: { name, businessId },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      product: {
        id: productRef.id,
        ...productData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get products by business
router.get('/business/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    const snapshot = await req.db.collection('products')
      .where('businessId', '==', businessId)
      .orderBy('name')
      .get();
    
    const products = [];
    snapshot.forEach(doc => {
      const product = doc.data();
      product.id = doc.id;
      products.push(product);
    });
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('products').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    const product = doc.data();
    product.id = doc.id;
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.createdAt;
    updates.updatedAt = new Date();
    
    await req.db.collection('products').doc(id).update(updates);
    
    const updatedDoc = await req.db.collection('products').doc(id).get();
    const product = updatedDoc.data();
    product.id = updatedDoc.id;
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('products').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;