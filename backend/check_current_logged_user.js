const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCurrentLoggedUser() {
  try {
    console.log('=== CHECKING CURRENT LOGGED USER ===');
    
    // Get all users to see who might be logged in
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total users in the system:`);
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`\nUser ID: ${doc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`Created: ${userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt}`);
      console.log(`Last Login: ${userData.lastLogin?.toDate ? userData.lastLogin.toDate() : userData.lastLogin || 'Never'}`);
    });
    
    // Check influencer profiles to see which ones exist
    console.log('\n=== CHECKING INFLUENCER PROFILES ===');
    const influencersSnapshot = await db.collection('influencers').get();
    console.log(`Found ${influencersSnapshot.size} influencer profiles:`);
    
    influencersSnapshot.forEach(doc => {
      const profileData = doc.data();
      console.log(`\nProfile ID: ${doc.id}`);
      console.log(`Instagram Username: ${profileData.instagramUsername}`);
      console.log(`Posts Count: ${profileData.postsCount}`);
      console.log(`Followers: ${profileData.followers}`);
      console.log(`Following: ${profileData.following}`);
      console.log(`Created: ${profileData.createdAt?.toDate ? profileData.createdAt.toDate() : profileData.createdAt}`);
      console.log(`Updated: ${profileData.updatedAt?.toDate ? profileData.updatedAt.toDate() : profileData.updatedAt}`);
    });
    
    // Check if there's a specific user that might be the current one
    console.log('\n=== LOOKING FOR SPECIFIC USERS ===');
    
    // Check for bismakhannn user
    const bismakhannQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'bismakhannn')
      .get();
    
    if (!bismakhannQuery.empty) {
      console.log('\nFound bismakhannn profile:');
      bismakhannQuery.forEach(doc => {
        console.log(`Profile ID: ${doc.id}`);
        console.log(`Data:`, doc.data());
      });
    }
    
    // Check for safridiofficials user
    const safridQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'safridiofficials')
      .get();
    
    if (!safridQuery.empty) {
      console.log('\nFound safridiofficials profile:');
      safridQuery.forEach(doc => {
        console.log(`Profile ID: ${doc.id}`);
        console.log(`Data:`, doc.data());
      });
    }
    
  } catch (error) {
    console.error('Error checking current logged user:', error);
  }
}

checkCurrentLoggedUser();