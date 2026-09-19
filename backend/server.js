import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './src/config/database.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import businessRoutes from './src/routes/businessRoutes.js';
import customerRoutes from './src/routes/customerRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import invoiceRoutes from './src/routes/invoiceRoutes.js';
import taxRoutes from './src/routes/taxRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { startScheduledJobs } from './src/services/notificationService.js';

dotenv.config();

// Initialize database
initializeDatabase();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'SME-TAX eTIMS Compliance API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/taxes', taxRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SME-TAX API server running on port ${PORT}`);
  startScheduledJobs();
});

export default app;
