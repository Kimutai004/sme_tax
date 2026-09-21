const express = require('express');
const router = express.Router();
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const auth = getAuth();
const db = getFirestore();

// Helper to create user in Firestore
async function createUserProfile(userId, data) {
  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  }, { merge: true });
  return userRef;
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone
    });
    
    // Create user profile in Firestore
    await createUserProfile(userRecord.uid, {
      name,
      email,
      phone: phone || '',
      role: 'business_owner',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Log activity
    await db.collection('activities').add({
      userId: userRecord.uid,
      action: 'register',
      resourceType: 'user',
      details: { email },
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: userRecord.uid,
        name,
        email,
        phone: phone || ''
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Verify credentials using Firebase Auth
    // Note: For production, you'd use Firebase Auth client SDK
    // This is a simplified server-side check
    const userRecord = await auth.getUserByEmail(email);
    
    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: {
        id: userRecord.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'business_owner'
      }
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    // Get user from Firebase Auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get user profile from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Get business if exists
    const businessSnapshot = await db.collection('businesses')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    let business = null;
    if (!businessSnapshot.empty) {
      business = businessSnapshot.docs[0].data();
      business.id = businessSnapshot.docs[0].id;
    }
    
    res.json({
      success: true,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'business_owner'
      },
      business
    });
  } catch (error) {
    next(error);
  }
});

// Logout (client-side token revocation, server just acknowledges)
router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;