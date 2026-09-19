import express from 'express';
import { body, query } from 'express-validator';
import {
  getTaxSummary, getTaxObligations, getTaxObligation, createTaxObligation,
  fileTaxObligation, generateObligations, calculateVat
} from '../controllers/taxController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.get('/summary', getTaxSummary);
router.get('/obligations', getTaxObligations);
router.get('/obligations/:id', getTaxObligation);
router.post('/obligations', [
  body('taxType').notEmpty().withMessage('Tax type is required'),
  body('calculatedAmount').isNumeric().withMessage('Amount must be a number'),
], createTaxObligation);
router.put('/obligations/:id/file', fileTaxObligation);
router.post('/generate-obligations', generateObligations);
router.post('/calculate', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
], calculateVat);

export default router;
