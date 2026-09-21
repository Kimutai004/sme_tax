const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Create invoice
router.post('/', async (req, res, next) => {
  try {
    const { businessId, customerId, invoiceDate, dueDate, items, notes, paymentMethod } = req.body;
    
    if (!businessId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Business ID and invoice items are required'
      });
    }
    
    // Calculate totals
    let subtotal = 0;
    let vatAmount = 0;
    
    const invoiceItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const itemVatRate = item.vatRate || 16.0;
      const itemVatAmount = (lineTotal * itemVatRate) / 100;
      
      subtotal += lineTotal;
      vatAmount += itemVatAmount;
      
      return {
        productId: item.productId || null,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: itemVatRate,
        vatAmount: itemVatAmount,
        lineTotal
      };
    });
    
    const totalAmount = subtotal + vatAmount;
    const balance = totalAmount;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const invoiceData = {
      businessId,
      invoiceNumber,
      customerId: customerId || null,
      invoiceDate: invoiceDate || new Date(),
      dueDate: dueDate || new Date(),
      status: 'draft',
      subtotal,
      vatAmount,
      totalAmount,
      amountPaid: 0,
      balance,
      notes: notes || '',
      paymentMethod: paymentMethod || '',
      etimsInvoiceId: null,
      etimsStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const invoiceRef = await req.db.collection('invoices').add(invoiceData);
    
    // Add invoice items
    for (const item of invoiceItems) {
      await req.db.collection('invoice_items').add({
        invoiceId: invoiceRef.id,
        ...item,
        createdAt: new Date()
      });
    }
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'create_invoice',
      resourceType: 'invoice',
      resourceId: invoiceRef.id,
      details: { invoiceNumber, businessId },
      createdAt: new Date()
    });
    
    // Get customer name if exists
    let customerName = '';
    if (customerId) {
      const customerDoc = await req.db.collection('customers').doc(customerId).get();
      if (customerDoc.exists) {
        customerName = customerDoc.data().name;
      }
    }
    
    res.status(201).json({
      success: true,
      invoice: {
        id: invoiceRef.id,
        ...invoiceData,
        customerName
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get invoices by business
router.get('/business/:businessId', async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const status = req.query.status;
    
    let query = req.db.collection('invoices')
      .where('businessId', '==', businessId)
      .orderBy('invoiceDate', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.get();
    
    const invoices = [];
    snapshot.forEach(async doc => {
      const invoice = doc.data();
      invoice.id = doc.id;
      
      // Get customer name
      if (invoice.customerId) {
        const customerDoc = await req.db.collection('customers').doc(invoice.customerId).get();
        invoice.customerName = customerDoc.exists ? customerDoc.data().name : '';
      }
      
      invoices.push(invoice);
    });
    
    res.json({
      success: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
});

// Get invoice by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('invoices').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const invoice = doc.data();
    invoice.id = doc.id;
    
    // Get invoice items
    const itemsSnapshot = await req.db.collection('invoice_items')
      .where('invoiceId', '==', id)
      .get();
    
    invoice.items = [];
    itemsSnapshot.forEach(itemDoc => {
      invoice.items.push(itemDoc.data());
    });
    
    // Get customer info
    if (invoice.customerId) {
      const customerDoc = await req.db.collection('customers').doc(invoice.customerId).get();
      invoice.customer = customerDoc.exists ? customerDoc.data() : null;
      invoice.customer.id = customerDoc.id;
    }
    
    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
});

// Update invoice
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.createdAt;
    updates.updatedAt = new Date();
    
    await req.db.collection('invoices').doc(id).update(updates);
    
    const updatedDoc = await req.db.collection('invoices').doc(id).get();
    const invoice = updatedDoc.data();
    invoice.id = updatedDoc.id;
    
    res.json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
});

// Add payment to invoice
router.post('/:id/payment', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid payment amount is required'
      });
    }
    
    const invoiceDoc = await req.db.collection('invoices').doc(id).get();
    if (!invoiceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const invoice = invoiceDoc.data();
    
    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const newBalance = invoice.totalAmount - newAmountPaid;
    
    await req.db.collection('invoices').doc(id).update({
      amountPaid: newAmountPaid,
      balance: newBalance > 0 ? newBalance : 0,
      status: newBalance <= 0 ? 'paid' : 'partial',
      paymentMethod: paymentMethod || invoice.paymentMethod,
      updatedAt: new Date()
    });
    
    // Log payment activity
    await req.db.collection('activities').add({
      action: 'invoice_payment',
      resourceType: 'invoice',
      resourceId: id,
      details: { amount, paymentMethod, invoiceNumber: invoice.invoiceNumber },
      createdAt: new Date()
    });
    
    const updatedDoc = await req.db.collection('invoices').doc(id).get();
    const updatedInvoice = updatedDoc.data();
    updatedInvoice.id = updatedDoc.id;
    
    res.json({
      success: true,
      invoice: updatedInvoice
    });
  } catch (error) {
    next(error);
  }
});

// Delete invoice
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete invoice items first
    await req.db.collection('invoice_items').where('invoiceId', '==', id).get()
      .then(snapshot => {
        Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
      });
    
    // Delete invoice
    await req.db.collection('invoices').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;