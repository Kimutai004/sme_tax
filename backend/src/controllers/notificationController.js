/**
 * Notification Controller
 * Manages user notifications and compliance alerts
 */

import { db } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getUnreadNotifications,
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  generateComplianceReminders,
  generateMonthlyTaxSummary,
} from '../services/notificationService.js';

// @desc    Get unread notifications
// @route   GET /api/v1/notifications/unread
// @access  Private
export const getUnread = asyncHandler(async (req, res, next) => {
  const notifications = await getUnreadNotifications(db, req.user.id);
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

// @desc    Get all notifications
// @route   GET /api/v1/notifications
// @access  Private
export const getAll = asyncHandler(async (req, res, next) => {
  const { limit = 50 } = req.query;
  const notifications = await getAllNotifications(db, req.user.id, parseInt(limit));
  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
export const markRead = asyncHandler(async (req, res, next) => {
  const notification = await db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!notification) {
    return next(new ApiError('Notification not found', 404));
  }

  await markNotificationRead(db, req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
export const markAllRead = asyncHandler(async (req, res, next) => {
  await markAllNotificationsRead(db, req.user.id);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Generate compliance reminders
// @route   POST /api/v1/notifications/generate-reminders
// @access  Private
export const generateReminders = asyncHandler(async (req, res, next) => {
  const business = await db.get('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
  if (!business) {
    return next(new ApiError('Business profile not found', 404));
  }

  const reminders = await generateComplianceReminders(db, req.user.id, business.id);
  res.status(200).json({ success: true, count: reminders.length, data: reminders });
});

// @desc    Generate monthly tax summary
// @route   POST /api/v1/notifications/generate-summary
// @access  Private
export const generateSummary = asyncHandler(async (req, res, next) => {
  const business = await db.get('SELECT id FROM businesses WHERE user_id = ?', [req.user.id]);
  if (!business) {
    return next(new ApiError('Business profile not found', 404));
  }

  const summary = await generateMonthlyTaxSummary(db, req.user.id, business.id);
  res.status(200).json({ success: true, data: summary });
});
