import express from 'express';
import {
  getDashboard, getSalesReport, getCustomerReport,
  runReconciliation, getReconciliationReport, getVatReturnReport
} from '../controllers/reportController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.get('/dashboard', getDashboard);
router.get('/sales', getSalesReport);
router.get('/customers', getCustomerReport);
router.post('/reconcile', runReconciliation);
router.get('/reconciliation', getReconciliationReport);
router.get('/vat-return', getVatReturnReport);

export default router;
