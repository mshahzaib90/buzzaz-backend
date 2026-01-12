const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugDashboardNetwork() {
  console.log('=== DEBUGGING DASHBOARD NETWORK CALLS ===');
  
  try {
    // 1. Check all users and their roles
    console.log('\n1. ALL USERS IN SYSTEM:');
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`Created: ${userData.createdAt ? (userData.createdAt.toDate ? userData.createdAt.toDate() : userData.createdAt) : 'N/A'}`);
      console.log('---');
    });
    
    // 2. Check all influencer profiles
    console.log('\n2. ALL INFLUENCER PROFILES:');
    const influencersSnapshot = await db.collection('influencers').get();
    influencersSnapshot.forEach(doc => {
      const influencerData = doc.data();
      console.log(`Profile ID: ${doc.id}`);
      console.log(`User ID: ${influencerData.userId}`);
      console.log(`Instagram Username: ${influencerData.instagramUsername}`);
      console.log(`Posts Count: ${influencerData.postsCount}`);
      console.log(`Followers: ${influencerData.followers}`);
      console.log(`Following: ${influencerData.following}`);
      console.log('---');
    });
    
    // 3. Simulate the API call that dashboard makes
    console.log('\n3. SIMULATING DASHBOARD API CALLS:');
    
    // Get the user that should be logged in (mdshahzaib@gmail.com)
    const targetUserQuery = await db.collection('users')
      .where('email', '==', 'mdshahzaib@gmail.com')
      .get();
    
    if (!targetUserQuery.empty) {
      const targetUser = targetUserQuery.docs[0];
      const targetUserId = targetUser.id;
      const targetUserData = targetUser.data();
      
      console.log(`Target User ID: ${targetUserId}`);
      console.log(`Target User Email: ${targetUserData.email}`);
      console.log(`Target User Role: ${targetUserData.role}`);
      
      // Now get the influencer profile for this user
      const influencerQuery = await db.collection('influencers')
        .where('userId', '==', targetUserId)
        .get();
      
      if (!influencerQuery.empty) {
        const influencerDoc = influencerQuery.docs[0];
        const influencerData = influencerDoc.data();
        
        console.log('\nINFLUENCER PROFILE FOR TARGET USER:');
        console.log(`Profile ID: ${influencerDoc.id}`);
        console.log(`Instagram Username: ${influencerData.instagramUsername}`);
        console.log(`Posts Count: ${influencerData.postsCount}`);
        console.log(`Followers: ${influencerData.followers}`);
        console.log(`Following: ${influencerData.following}`);
        console.log(`Bio: ${influencerData.bio}`);
        console.log(`Full Name: ${influencerData.fullName}`);
        
        // Check for latest stats
        const statsQuery = await db.collection('influencers')
          .doc(influencerDoc.id)
          .collection('stats')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();
        
        if (!statsQuery.empty) {
          const latestStats = statsQuery.docs[0].data();
          console.log('\nLATEST STATS:');
          console.log(`Followers: ${latestStats.followers}`);
          console.log(`Following: ${latestStats.following}`);
          console.log(`Posts Count: ${latestStats.postsCount}`);
          console.log(`Timestamp: ${latestStats.timestamp ? (latestStats.timestamp.toDate ? latestStats.timestamp.toDate() : latestStats.timestamp) : 'N/A'}`);
        } else {
          console.log('\nNo stats found for this profile');
        }
        
      } else {
        console.log('No influencer profile found for target user!');
      }
    } else {
      console.log('Target user not found!');
    }
    
    // 4. Check for any cached or session data that might interfere
    console.log('\n4. CHECKING FOR POTENTIAL DATA CONFLICTS:');
    
    // Look for any profiles with safridiofficials
    const safridQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'safridiofficials')
      .get();
    
    if (!safridQuery.empty) {
      console.log('Found safridiofficials profiles:');
      safridQuery.forEach(doc => {
        console.log(`Profile ID: ${doc.id}`);
        console.log(`User ID: ${doc.data().userId}`);
        console.log(`Data:`, doc.data());
      });
    } else {
      console.log('No safridiofficials profiles found in database');
    }
    
    // Look for any profiles with 0 posts
    const zeroPostsQuery = await db.collection('influencers')
      .where('postsCount', '==', 0)
      .get();
    
    if (!zeroPostsQuery.empty) {
      console.log('\nProfiles with 0 posts:');
      zeroPostsQuery.forEach(doc => {
        const data = doc.data();
        console.log(`Profile ID: ${doc.id}`);
        console.log(`User ID: ${data.userId}`);
        console.log(`Instagram Username: ${data.instagramUsername}`);
        console.log(`Followers: ${data.followers}`);
      });
    } else {
      console.log('No profiles with 0 posts found');
    }
    
  } catch (error) {
    console.error('Error debugging dashboard network:', error);
  }
}

debugDashboardNetwork().then(() => {
  console.log('\n=== DASHBOARD NETWORK DEBUG COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});