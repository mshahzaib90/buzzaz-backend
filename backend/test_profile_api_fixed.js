const { db } = require('./config/firebase');

async function testProfileAPI() {
  try {
    console.log('=== Testing Profile API Fix ===');
    
    const userId = 'tl09djlz4oUysumQP0pc'; // Correct user ID from database
    console.log('Testing for user:', userId);
    
    // Test the backend logic directly (simulating the /influencer/profile endpoint)
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    
    if (!influencerDoc.exists) {
      console.log('❌ Influencer not found in database');
      return;
    }

    const influencerData = influencerDoc.data();
    console.log('✅ Profile data found:', JSON.stringify(influencerData, null, 2));
    
    // Get latest stats
    const statsSnapshot = await db.collection('influencers')
      .doc(userId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let latestStats = null;
    if (!statsSnapshot.empty) {
      latestStats = statsSnapshot.docs[0].data();
      console.log('✅ Found latest stats:', JSON.stringify(latestStats, null, 2));
    } else {
      console.log('⚠️ No stats found for user');
    }

    const response = {
      profile: {
        id: userId,
        ...influencerData
      },
      latestStats
    };
    
    console.log('✅ Complete API response would be:', JSON.stringify(response, null, 2));
    
    // Check profile completion
    const requiredFields = ['bio', 'niche', 'contentStyle', 'languages', 'reelPrice', 'storyPrice', 'eventPrice', 'multiplePlatformsPrice'];
    const missingFields = requiredFields.filter(field => !influencerData[field] || (Array.isArray(influencerData[field]) && influencerData[field].length === 0));
    
    if (missingFields.length === 0) {
      console.log('✅ Profile is 100% complete - onboarding message should NOT appear');
    } else {
      console.log('❌ Profile is missing fields:', missingFields);
      console.log('❌ Onboarding message WILL appear');
    }
    
  } catch (error) {
    console.error('❌ Error testing profile API:', error);
  }
}

testProfileAPI();