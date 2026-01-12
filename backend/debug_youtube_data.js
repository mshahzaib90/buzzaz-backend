const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugYouTubeData() {
  try {
    console.log('=== DEBUGGING YOUTUBE DATA ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    
    // Get current user profile
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (!currentUserDoc.exists) {
      console.log('❌ Current user not found');
      return;
    }
    
    const currentData = currentUserDoc.data();
    
    console.log('=== CURRENT USER PROFILE ===');
    console.log(`User ID: ${currentUserId}`);
    console.log(`Full Name: ${currentData.fullName}`);
    console.log(`Instagram: @${currentData.instagramUsername}`);
    console.log(`Followers: ${currentData.followers?.toLocaleString()}`);
    
    console.log('\n=== YOUTUBE FIELDS CHECK ===');
    console.log(`youtubeChannelId: ${currentData.youtubeChannelId || 'NOT SET'}`);
    console.log(`youtubeChannelTitle: ${currentData.youtubeChannelTitle || 'NOT SET'}`);
    console.log(`youtubeChannelUrl: ${currentData.youtubeChannelUrl || 'NOT SET'}`);
    
    // Check if YouTube data exists
    const hasYouTubeData = !!(currentData.youtubeChannelId);
    console.log(`\nHas YouTube Data: ${hasYouTubeData}`);
    
    if (!hasYouTubeData) {
      console.log('\n❌ NO YOUTUBE DATA FOUND');
      console.log('Looking for users with YouTube connections...');
      
      // Find users with YouTube data
      const influencersSnapshot = await db.collection('influencers').get();
      let usersWithYouTube = [];
      
      influencersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.youtubeChannelId && data.youtubeChannelTitle) {
          usersWithYouTube.push({
            userId: doc.id,
            fullName: data.fullName,
            instagramUsername: data.instagramUsername,
            youtubeChannelId: data.youtubeChannelId,
            youtubeChannelTitle: data.youtubeChannelTitle,
            youtubeChannelUrl: data.youtubeChannelUrl
          });
        }
      });
      
      console.log(`\n=== USERS WITH YOUTUBE DATA (${usersWithYouTube.length}) ===`);
      usersWithYouTube.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.userId}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Instagram: @${user.instagramUsername}`);
        console.log(`   YouTube Channel: ${user.youtubeChannelTitle}`);
        console.log(`   YouTube ID: ${user.youtubeChannelId}`);
        console.log(`   YouTube URL: ${user.youtubeChannelUrl}`);
      });
      
      if (usersWithYouTube.length > 0) {
        console.log('\n=== RECOMMENDATION ===');
        console.log('Copy YouTube data from one of these users to current user');
        console.log('Or guide user through YouTube connection wizard');
      }
    } else {
      console.log('\n✅ YOUTUBE DATA EXISTS');
      
      // Check YouTube stats collection
      console.log('\n=== CHECKING YOUTUBE STATS ===');
      const youtubeStatsSnapshot = await db.collection('youtubeStats')
        .where('userId', '==', currentUserId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (youtubeStatsSnapshot.empty) {
        console.log('❌ No YouTube stats found for current user');
      } else {
        const latestStats = youtubeStatsSnapshot.docs[0].data();
        console.log('✅ YouTube stats found:');
        console.log(`   Subscribers: ${latestStats.subscriberCount?.toLocaleString() || 'N/A'}`);
        console.log(`   Views: ${latestStats.viewCount?.toLocaleString() || 'N/A'}`);
        console.log(`   Videos: ${latestStats.videoCount?.toLocaleString() || 'N/A'}`);
        console.log(`   Created: ${latestStats.createdAt}`);
      }
    }
    
    // Check YouTube API configuration
    console.log('\n=== YOUTUBE API CHECK ===');
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    console.log(`YouTube API Key configured: ${youtubeApiKey ? 'YES' : 'NO'}`);
    
    if (youtubeApiKey) {
      console.log(`API Key length: ${youtubeApiKey.length} characters`);
      console.log(`API Key preview: ${youtubeApiKey.substring(0, 10)}...`);
    }
    
  } catch (error) {
    console.error('Error debugging YouTube data:', error);
  }
}

debugYouTubeData();