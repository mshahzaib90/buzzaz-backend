const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function testProfileDirect() {
  try {
    console.log('=== TESTING DIRECT PROFILE ACCESS ===');
    
    // Get the user ID for new124@gmail.com
    const userId = 'ikGacihCCEDUvZt93wbD';
    
    console.log('Fetching profile for user ID:', userId);
    
    // Get the profile document
    const profileDoc = await db.collection('influencers').doc(userId).get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found');
      return;
    }
    
    const profileData = profileDoc.data();
    
    console.log('\n=== PROFILE DATA STRUCTURE ===');
    console.log(JSON.stringify(profileData, null, 2));
    
    console.log('\n=== INSTAGRAM FIELDS ANALYSIS ===');
    console.log('instagramUsername:', profileData.instagramUsername);
    console.log('followers:', profileData.followers);
    console.log('following:', profileData.following);
    console.log('postsCount:', profileData.postsCount);
    console.log('instagramFollowers:', profileData.instagramFollowers);
    console.log('instagramFollowing:', profileData.instagramFollowing);
    console.log('instagramPostsCount:', profileData.instagramPostsCount);
    
    console.log('\n=== YOUTUBE FIELDS ANALYSIS ===');
    console.log('youtubeChannelId:', profileData.youtubeChannelId);
    console.log('youtubeChannelTitle:', profileData.youtubeChannelTitle);
    console.log('youtubeChannelUrl:', profileData.youtubeChannelUrl);
    
    console.log('\n=== FRONTEND CONDITION SIMULATION ===');
    // Simulate the exact frontend conditions
    const hasInstagramUsername = !!profileData.instagramUsername;
    const hasFollowers = (profileData.followers || 0) > 0;
    const hasPosts = (profileData.postsCount || 0) > 0;
    const hasFollowing = (profileData.following || 0) > 0;
    const instagramCondition = hasInstagramUsername && (hasFollowers || hasPosts || hasFollowing);
    
    console.log('Has Instagram Username:', hasInstagramUsername, '(', profileData.instagramUsername, ')');
    console.log('Has Followers > 0:', hasFollowers, '(', profileData.followers, ')');
    console.log('Has Posts > 0:', hasPosts, '(', profileData.postsCount, ')');
    console.log('Has Following > 0:', hasFollowing, '(', profileData.following, ')');
    console.log('Instagram Display Condition Result:', instagramCondition);
    
    const hasYouTubeChannelId = !!profileData.youtubeChannelId;
    console.log('Has YouTube Channel ID:', hasYouTubeChannelId, '(', profileData.youtubeChannelId, ')');
    console.log('YouTube Display Condition Result:', hasYouTubeChannelId);
    
    // Check latest stats
    console.log('\n=== CHECKING LATEST STATS ===');
    const statsSnapshot = await db.collection('influencers')
      .doc(userId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!statsSnapshot.empty) {
      const latestStats = statsSnapshot.docs[0].data();
      console.log('Latest Stats:', JSON.stringify(latestStats, null, 2));
    } else {
      console.log('No stats found');
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testProfileDirect();