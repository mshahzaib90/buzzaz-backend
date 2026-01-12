require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { admin, db } = require('./config/firebase');

async function testLoginFlow() {
  try {
    console.log('=== TESTING LOGIN FLOW ===');
    
    // Find a user with an influencer profile
    const usersSnapshot = await db.collection('users').where('role', '==', 'influencer').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('No influencer users found');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log('Found influencer user:', userId);
    console.log('Email:', userData.email);
    
    // Check if they have an influencer profile
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    
    if (!influencerDoc.exists) {
      console.log('User has no influencer profile');
      return;
    }
    
    console.log('User has influencer profile');
    
    // Generate a valid JWT token for this user
    const token = jwt.sign(
      { 
        uid: userId,
        email: userData.email,
        role: userData.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n=== GENERATED TOKEN ===');
    console.log('Token:', token);
    console.log('\n=== INSTRUCTIONS ===');
    console.log('1. Open browser developer tools (F12)');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Find localStorage for localhost:3000');
    console.log('4. Set these values:');
    console.log(`   token: ${token}`);
    console.log(`   user: ${JSON.stringify({
      uid: userId,
      email: userData.email,
      role: userData.role
    })}`);
    console.log('5. Refresh the page');
    
  } catch (error) {
    console.error('Error in test login flow:', error);
  }
}

testLoginFlow();