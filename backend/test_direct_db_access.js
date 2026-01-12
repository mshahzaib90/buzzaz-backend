const { admin, db } = require('./config/firebase');

async function testDirectDBAccess() {
  try {
    console.log('=== TESTING DIRECT DATABASE ACCESS ===');
    
    // Get the current user ID
    const currentUserId = 'X0IqcgoiqNm6OgOKKKT1';
    console.log('Testing with current user ID:', currentUserId);
    
    // Simulate the API endpoint logic
    console.log('\n=== FETCHING PROFILE DATA ===');
    const influencerDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (!influencerDoc.exists) {
      console.log('❌ Profile not found for user ID:', currentUserId);
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('✅ Found profile data');
    
    // Get latest stats
    console.log('\n=== FETCHING LATEST STATS ===');
    const statsSnapshot = await db.collection('influencers')
      .doc(currentUserId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let latestStats = null;
    if (!statsSnapshot.empty) {
      latestStats = statsSnapshot.docs[0].data();
      console.log('✅ Found latest stats');
    } else {
      console.log('❌ No stats found');
    }

    // Simulate the API response structure
    const apiResponse = {
      profile: {
        id: currentUserId,
        ...influencerData
      },
      latestStats
    };
    
    console.log('\n=== SIMULATED API RESPONSE ===');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n=== PROFILE FIELDS ANALYSIS ===');
    const profile = apiResponse.profile;
    console.log('Instagram Username:', profile?.instagramUsername);
    console.log('Instagram Followers:', profile?.followers);
    console.log('Instagram Posts:', profile?.postsCount);
    console.log('Instagram Following:', profile?.following);
    
    console.log('\nYouTube Channel ID:', profile?.youtubeChannelId);
    console.log('YouTube Channel Title:', profile?.youtubeChannelTitle);
    console.log('YouTube Channel URL:', profile?.youtubeChannelUrl);
    console.log('YouTube Subscribers:', profile?.youtubeSubscribers);
    
    console.log('\nTikTok Username:', profile?.tiktokUsername);
    console.log('TikTok Followers:', profile?.tiktokFollowers);
    
    console.log('\n=== DISPLAY CONDITIONS TEST ===');
    console.log('Instagram Display (username exists):', !!profile?.instagramUsername);
    console.log('YouTube Display (channelId exists):', !!profile?.youtubeChannelId);
    console.log('TikTok Display (username exists):', !!profile?.tiktokUsername);
    
    console.log('\n=== FRONTEND SIMULATION ===');
    // Simulate what the frontend should receive
    console.log('Frontend would receive profile object with:');
    console.log('- instagramUsername:', profile?.instagramUsername || 'undefined');
    console.log('- youtubeChannelId:', profile?.youtubeChannelId || 'undefined');
    console.log('- tiktokUsername:', profile?.tiktokUsername || 'undefined');
    
    console.log('\n=== END TEST ===');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testDirectDBAccess();