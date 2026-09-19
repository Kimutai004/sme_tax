import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';

export const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sm_secret_key_change_in_production');
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError('Not authorized, token failed', 401));
  }
};

// Business context middleware - resolves business ID from user
export const setBusinessContext = async (req, res, next) => {
  if (!req.user) {
    return next(new ApiError('Not authorized', 401));
  }

  if (req.user.businessId) {
    req.businessId = req.user.businessId;
    return next();
  }

  // Look up business from database
  const business = await db.get('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
  req.businessId = business ? business.id : null;
  next();
};

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.code === 'SQLITE_CONSTRAINT') {
    const message = 'Duplicate field value entered';
    error = new ApiError(message, 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ApiError(message.join(', '), 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

export const notFound = (req, res, next) => {
  const error = new ApiError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

export default { protect, setBusinessContext, errorHandler, notFound };
