import express from 'express';
import { body } from 'express-validator';
import {
  getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer
} from '../controllers/customerController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.route('/')
  .get(getCustomers)
  .post([
    body('name').notEmpty().withMessage('Customer name is required'),
  ], createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
