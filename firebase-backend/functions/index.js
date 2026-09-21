const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Import route handlers
const authRoutes = require('./src/routes/authRoutes');
const businessRoutes = require('./src/routes/businessRoutes');
const customerRoutes = require('././src/routes/customerRoutes');
const productRoutes = require('./src/routes/productRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const taxRoutes = require('./src/routes/taxRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add Firestore instance to request
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'SME-TAX eTIMS Compliance API (Firebase)',
    version: '2.0.0',
    status: 'running',
    database: 'Firebase Firestore'
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/taxes', taxRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Export as Firebase Cloud Function
exports.api = functions.https.onRequest(app);

// Log activities to Firestore
exports.logActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const activity = {
    userId: context.auth.uid,
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await db.collection('activities').add(activity);
  
  return { success: true, activityId: 'logged' };
});