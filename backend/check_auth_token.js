const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAuthToken() {
  try {
    console.log('=== CHECKING AUTH TOKEN ===');
    
    // This would normally come from the frontend's localStorage
    // For now, let's check what tokens might exist in the system
    
    // Let's check the users collection to see who has recent activity
    const usersSnapshot = await db.collection('users').get();
    
    console.log('All users in the system:');
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`\nUser ID: ${doc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`Last Login: ${userData.lastLogin || 'Never'}`);
      
      // Check if this user has an influencer profile
      checkUserInfluencerProfile(doc.id);
    });
    
  } catch (error) {
    console.error('Error checking auth token:', error);
  }
}

async function checkUserInfluencerProfile(userId) {
  try {
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    
    if (influencerDoc.exists) {
      const profileData = influencerDoc.data();
      console.log(`  -> Has influencer profile:`);
      console.log(`     Instagram: ${profileData.instagramUsername}`);
      console.log(`     Posts: ${profileData.postsCount}`);
      console.log(`     Followers: ${profileData.followers}`);
    } else {
      console.log(`  -> No influencer profile found`);
    }
  } catch (error) {
    console.log(`  -> Error checking profile: ${error.message}`);
  }
}

checkAuthToken();