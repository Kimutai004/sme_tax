/**
 * Notification Service
 * Generates and manages compliance alerts, reminders, and notifications
 */

import { TAX_TYPES, getTaxPeriod } from './taxEngine.js';

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  REMINDER: 'reminder',
  COMPLIANCE: 'compliance',
};

/**
 * Create a notification for a user/business
 */
export async function createNotification(db, {
  userId,
  businessId = null,
  title,
  message,
  type = NOTIFICATION_TYPES.INFO,
  relatedId = null,
  relatedType = null,
}) {
  const result = await db.run(
    `INSERT INTO notifications (user_id, business_id, title, message, type, related_id, related_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, businessId, title, message, type, relatedId, relatedType, new Date().toISOString()]
  );

  return { id: result.lastID, userId, businessId, title, message, type, relatedId, relatedType };
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(db, userId, limit = 20) {
  const results = await db.all(
    `SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return results;
}

/**
 * Get all notifications for a user
 */
export async function getAllNotifications(db, userId, limit = 50) {
  const results = await db.all(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  return results;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(db, notificationId, userId) {
  await db.run(
    `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(db, userId) {
  await db.run(
    `UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`,
    [userId]
  );
}

/**
 * Generate compliance reminders based on tax obligations
 */
export async function generateComplianceReminders(db, userId, businessId) {
  const reminders = [];

  // Check for upcoming VAT filing deadlines
  const now = new Date();
  const upcomingObligations = await db.all(
    `SELECT * FROM tax_obligations WHERE business_id = ? AND status = 'pending' AND due_date >= ? AND due_date <= ? AND filed = 0`,
    [businessId, now.toISOString().split('T')[0], new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
  );

  for (const obligation of upcomingObligations) {
    const dueDate = new Date(obligation.due_date);
    const daysUntilDue = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));

    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      reminders.push(await createNotification(db, {
        userId,
        businessId,
        title: 'VAT Filing Reminder',
        message: `${obligation.tax_type.toUpperCase()} filing for ${obligation.period} is due in ${daysUntilDue} day(s). Amount: KES ${obligation.calculated_amount.toLocaleString()}. File before ${dueDate.toLocaleDateString()}.`,
        type: NOTIFICATION_TYPES.REMINDER,
        relatedId: obligation.id,
        relatedType: 'tax_obligation',
      }));
    }
  }

  // Check for missing eTIMS submissions
  const { checkMissingSubmissions } = await import('./reconciliationService.js');
  const missing = await checkMissingSubmissions(businessId, db);

  if (missing.length > 0) {
    reminders.push(await createNotification(db, {
      userId,
      businessId,
      title: 'Missing eTIMS Submissions',
      message: `${missing.length} invoice(s) have not been submitted to eTIMS. Please transmit them to avoid compliance issues.`,
      type: NOTIFICATION_TYPES.WARNING,
      relatedType: 'invoice',
    }));
  }

  // Check for overdue obligations
  const overdueObligations = await db.all(
    `SELECT * FROM tax_obligations WHERE business_id = ? AND status = 'pending' AND due_date < ? AND filed = 0`,
    [businessId, now.toISOString().split('T')[0]]
  );

  for (const obligation of overdueObligations) {
    reminders.push(await createNotification(db, {
      userId,
      businessId,
      title: 'Overdue Tax Obligation',
      message: `${obligation.tax_type.toUpperCase()} for ${obligation.period} is overdue. Amount: KES ${obligation.calculated_amount.toLocaleString()}. File immediately to avoid penalties.`,
      type: NOTIFICATION_TYPES.ERROR,
      relatedId: obligation.id,
      relatedType: 'tax_obligation',
    }));
  }

  return reminders;
}

/**
 * Generate monthly tax summary notification
 */
export async function generateMonthlyTaxSummary(db, userId, businessId) {
  const now = new Date();
  const period = getTaxPeriod('monthly', now);

  const summary = await db.get(
    `SELECT 
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(vat_amount), 0) as total_vat,
      COUNT(*) as invoice_count
    FROM invoices WHERE business_id = ? AND strftime('%Y-%m', created_at) = ? AND status IN ('issued', 'paid')`,
    [businessId, `${period.period_label}`]
  );

  return await createNotification(db, {
    userId,
    businessId,
    title: 'Monthly Tax Summary',
    message: `Period ${period.period_label}: ${summary.invoice_count} invoices, KES ${summary.total_sales.toLocaleString()} sales, KES ${summary.total_vat.toLocaleString()} VAT on ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    type: NOTIFICATION_TYPES.COMPLIANCE,
  });
}

/**
 * Start scheduled jobs (runs daily)
 */
let jobInterval = null;

export function startScheduledJobs() {
  if (jobInterval) return;

  jobInterval = setInterval(async () => {
    try {
      const { db } = await import('./config/database.js');
      if (!db) {
        console.log('Database not initialized, skipping scheduled job');
        return;
      }

      // Get all active users with businesses
      const users = await db.all(
        `SELECT id as user_id, b.id as business_id FROM users u 
         JOIN businesses b ON u.id = b.user_id`
      );

      for (const user of users) {
        await generateComplianceReminders(db, user.user_id, user.business_id);
      }

      console.log(`[Scheduled Job] Checked ${users.length} businesses for compliance reminders`);
    } catch (err) {
      console.error('[Scheduled Job] Error:', err.message);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours

  console.log('[Notification Service] Scheduled jobs started');
}

export default {
  NOTIFICATION_TYPES,
  createNotification,
  getUnreadNotifications,
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  generateComplianceReminders,
  generateMonthlyTaxSummary,
  startScheduledJobs,
};
