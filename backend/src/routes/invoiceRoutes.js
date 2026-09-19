import express from 'express';
import { body } from 'express-validator';
import {
  getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice,
  retryEtimis, getInvoiceStats
} from '../controllers/invoiceController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.route('/')
  .get(getInvoices)
  .post([
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.quantity').isNumeric().withMessage('Quantity must be a number'),
    body('items.*.unit_price').isNumeric().withMessage('Unit price must be a number'),
  ], createInvoice);

router.get('/stats', getInvoiceStats);

router.route('/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.post('/:id/retry-etims', retryEtimis);

export default router;
