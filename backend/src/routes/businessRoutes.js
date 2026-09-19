import express from 'express';
import { body } from 'express-validator';
import { createBusiness, getBusiness, updateBusiness } from '../controllers/businessController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.route('/')
  .post([
    body('name').notEmpty().withMessage('Business name is required'),
    body('kra_pin').notEmpty().withMessage('KRA PIN is required'),
  ], createBusiness)
  .get(getBusiness)
  .put(updateBusiness);

export default router;
