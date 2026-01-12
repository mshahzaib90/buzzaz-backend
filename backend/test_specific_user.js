const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://buzzaz-react-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function testSpecificUser() {
  try {
    console.log('=== TESTING SPECIFIC USER PROFILE ===');
    
    // Let's find a user with Instagram data
    const profilesSnapshot = await db.collection('influencers').get();
    
    let targetProfile = null;
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.instagramUsername && !targetProfile) {
        targetProfile = { id: doc.id, ...data };
      }
    });
    
    if (!targetProfile) {
      console.log('No profile with Instagram username found');
      return;
    }
    
    console.log('Found target profile:', targetProfile.id);
    console.log('Email:', targetProfile.email);
    console.log('Instagram Username:', targetProfile.instagramUsername);
    console.log('YouTube Channel ID:', targetProfile.youtubeChannelId);
    
    // Get latest stats for this profile
    const statsSnapshot = await db.collection('stats')
      .where('influencerId', '==', targetProfile.id)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!statsSnapshot.empty) {
      const latestStats = statsSnapshot.docs[0].data();
      console.log('Latest stats found:');
      console.log('- Followers:', latestStats.followers);
      console.log('- Following:', latestStats.following);
      console.log('- Posts Count:', latestStats.postsCount);
      console.log('- Engagement Rate:', latestStats.engagementRate);
      
      // Simulate the merging logic from frontend
      const mergedData = {
        ...targetProfile,
        followers: latestStats?.followers || targetProfile?.followers || 0,
        following: latestStats?.following || targetProfile?.following || 0,
        postsCount: latestStats?.postsCount || targetProfile?.postsCount || 0,
        engagementRate: latestStats?.engagementRate || targetProfile?.engagementRate || 0,
      };
      
      console.log('\n=== MERGED DATA SIMULATION ===');
      console.log('Instagram Username:', mergedData.instagramUsername);
      console.log('Followers:', mergedData.followers);
      console.log('Posts Count:', mergedData.postsCount);
      console.log('Following:', mergedData.following);
      
      // Test the display condition
      const hasInstagramUsername = !!mergedData.instagramUsername;
      const hasStats = (mergedData.followers > 0 || mergedData.postsCount > 0 || mergedData.following > 0);
      
      console.log('\n=== DISPLAY CONDITION TEST ===');
      console.log('Has Instagram username?', hasInstagramUsername);
      console.log('Has stats (followers > 0 || posts > 0 || following > 0)?', hasStats);
      console.log('Should show Instagram?', hasInstagramUsername && hasStats);
      
      // Test YouTube condition
      const hasYouTubeChannelId = !!mergedData.youtubeChannelId;
      console.log('Has YouTube Channel ID?', hasYouTubeChannelId);
      console.log('Should show YouTube?', hasYouTubeChannelId);
      
    } else {
      console.log('No stats found for this profile');
    }
    
  } catch (error) {
    console.error('Error testing specific user:', error);
  }
}

testSpecificUser().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});