const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixUserProfileMapping() {
  try {
    console.log('=== FIXING USER PROFILE MAPPING ===');
    
    // Find the bismakhannn profile
    const bismakhannQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'bismakhannn')
      .get();
    
    if (bismakhannQuery.empty) {
      console.log('No bismakhannn profile found');
      return;
    }
    
    let bismakhannProfile = null;
    let bismakhannUserId = null;
    
    bismakhannQuery.forEach(doc => {
      bismakhannProfile = doc.data();
      bismakhannUserId = doc.id;
      console.log(`Found bismakhannn profile with ID: ${doc.id}`);
      console.log(`Posts Count: ${bismakhannProfile.postsCount}`);
      console.log(`Followers: ${bismakhannProfile.followers}`);
    });
    
    // Check if there's a user account for this profile
    const userDoc = await db.collection('users').doc(bismakhannUserId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`\nFound corresponding user account:`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`User ID: ${bismakhannUserId}`);
    } else {
      console.log(`\nNo user account found for profile ID: ${bismakhannUserId}`);
      
      // Let's check if there's a user with email that might match
      const usersSnapshot = await db.collection('users').get();
      console.log('\nLooking for potential matching users:');
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email && userData.email.includes('bismakhannn')) {
          console.log(`Potential match - User ID: ${doc.id}, Email: ${userData.email}`);
        }
      });
    }
    
    // Check for safridiofficials profile
    console.log('\n=== CHECKING SAFRIDIOFFICIALS PROFILE ===');
    const safridQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'safridiofficials')
      .get();
    
    if (!safridQuery.empty) {
      safridQuery.forEach(doc => {
        const profileData = doc.data();
        console.log(`Found safridiofficials profile with ID: ${doc.id}`);
        console.log(`Posts Count: ${profileData.postsCount}`);
        console.log(`Followers: ${profileData.followers}`);
      });
    } else {
      console.log('No safridiofficials profile found in influencers collection');
    }
    
    // Let's also check if there are any profiles with instagramUsername containing 'safrid'
    const allInfluencersSnapshot = await db.collection('influencers').get();
    console.log('\n=== ALL PROFILES WITH SAFRID IN USERNAME ===');
    
    allInfluencersSnapshot.forEach(doc => {
      const profileData = doc.data();
      if (profileData.instagramUsername && profileData.instagramUsername.includes('safrid')) {
        console.log(`Profile ID: ${doc.id}`);
        console.log(`Instagram Username: ${profileData.instagramUsername}`);
        console.log(`Posts Count: ${profileData.postsCount}`);
        console.log(`Followers: ${profileData.followers}`);
      }
    });
    
  } catch (error) {
    console.error('Error fixing user profile mapping:', error);
  }
}

fixUserProfileMapping();