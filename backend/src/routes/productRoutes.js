import express from 'express';
import { body } from 'express-validator';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct
} from '../controllers/productController.js';
import { protect, setBusinessContext } from '../middleware/errorHandler.js';

const router = express.Router();

router.use(protect, setBusinessContext);

router.route('/')
  .get(getProducts)
  .post([
    body('name').notEmpty().withMessage('Product name is required'),
    body('unit_price').isNumeric().withMessage('Unit price must be a number'),
  ], createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
