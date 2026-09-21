const express = require('express');
const router = express.Router();

// Create notification
router.post('/', async (req, res, next) => {
  try {
    const { userId, businessId, title, message, type, relatedId, relatedType } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'User ID, title, and message are required'
      });
    }
    
    const notificationData = {
      userId,
      businessId: businessId || null,
      title,
      message,
      type: type || 'info',
      read: 0,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      createdAt: new Date()
    };
    
    const notificationRef = await req.db.collection('notifications').add(notificationData);
    
    // Log activity
    await req.db.collection('activities').add({
      action: 'create_notification',
      resourceType: 'notification',
      resourceId: notificationRef.id,
      details: { title, userId },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      notification: {
        id: notificationRef.id,
        ...notificationData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get notifications for user
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const unreadOnly = req.query.unread === 'true';
    
    let query = req.db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    if (unreadOnly) {
      query = query.where('read', '==', 0);
    }
    
    const snapshot = await query.get();
    
    const notifications = [];
    snapshot.forEach(doc => {
      const notification = doc.data();
      notification.id = doc.id;
      notifications.push(notification);
    });
    
    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    next(error);
  }
});

// Get notification by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const doc = await req.db.collection('notifications').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    const notification = doc.data();
    notification.id = doc.id;
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('notifications').doc(id).update({
      read: 1,
      readAt: new Date()
    });
    
    const updatedDoc = await req.db.collection('notifications').doc(id).get();
    const notification = updatedDoc.data();
    notification.id = updatedDoc.id;
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/user/:userId/read-all', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await req.db.collection('notifications')
      .where('userId', '==', userId)
      .where('read', '==', 0)
      .get();
    
    const batch = req.db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: 1, readAt: new Date() });
    });
    await batch.commit();
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await req.db.collection('notifications').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;