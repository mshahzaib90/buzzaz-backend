const { admin, db } = require('./config/firebase');

async function testProfileAPI() {
  try {
    console.log('=== TESTING PROFILE API DATA ===');
    
    // Get the current user's profile data directly from Firebase
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    console.log('Testing with user ID:', currentUserId);
    
    // Simulate the API endpoint logic
    const influencerDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (!influencerDoc.exists) {
      console.log('Profile not found');
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('\n=== PROFILE DATA FROM FIREBASE ===');
    console.log('Instagram Username:', influencerData.instagramUsername);
    console.log('Posts Count in Profile:', influencerData.postsCount);
    console.log('Followers in Profile:', influencerData.followers);
    console.log('Following in Profile:', influencerData.following);
    
    // Get latest stats
    const statsSnapshot = await db.collection('influencers')
      .doc(currentUserId)
      .collection('stats')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let latestStats = null;
    if (!statsSnapshot.empty) {
      latestStats = statsSnapshot.docs[0].data();
      console.log('\n=== LATEST STATS DATA ===');
      console.log('Posts Count in Stats:', latestStats.postsCount);
      console.log('Followers in Stats:', latestStats.followers);
      console.log('Following in Stats:', latestStats.following);
    } else {
      console.log('\n=== NO STATS FOUND ===');
    }

    // Simulate the API response
    const apiResponse = {
      profile: {
        id: currentUserId,
        ...influencerData
      },
      latestStats
    };
    
    console.log('\n=== API RESPONSE SIMULATION ===');
    console.log('response.data.profile.postsCount:', apiResponse.profile.postsCount);
    console.log('response.data.latestStats?.postsCount:', apiResponse.latestStats?.postsCount);
    
    // Simulate the dashboard merging logic
    console.log('\n=== DASHBOARD MERGING LOGIC SIMULATION ===');
    const profileData = {
      ...apiResponse.profile,
      followers: apiResponse.profile?.followers || apiResponse.latestStats?.followers || 0,
      following: apiResponse.profile?.following || apiResponse.latestStats?.following || 0,
      postsCount: apiResponse.profile?.postsCount || apiResponse.latestStats?.postsCount || 0,
      engagementRate: apiResponse.profile?.engagementRate || apiResponse.latestStats?.engagementRate || 0,
      latestStats: apiResponse.latestStats
    };
    
    console.log('Final merged postsCount:', profileData.postsCount);
    console.log('Final merged followers:', profileData.followers);
    console.log('Final merged following:', profileData.following);
    
    // Check the logic step by step
    console.log('\n=== STEP BY STEP LOGIC ===');
    console.log('Step 1 - apiResponse.profile?.postsCount:', apiResponse.profile?.postsCount);
    console.log('Step 2 - apiResponse.latestStats?.postsCount:', apiResponse.latestStats?.postsCount);
    console.log('Step 3 - Final fallback (0):', 0);
    
    const result = apiResponse.profile?.postsCount || apiResponse.latestStats?.postsCount || 0;
    console.log('Final result:', result);
    
    // Check data types
    console.log('\n=== DATA TYPE ANALYSIS ===');
    console.log('Type of profile.postsCount:', typeof apiResponse.profile?.postsCount);
    console.log('Value of profile.postsCount:', apiResponse.profile?.postsCount);
    console.log('Is profile.postsCount truthy?', !!apiResponse.profile?.postsCount);
    console.log('Is profile.postsCount === 0?', apiResponse.profile?.postsCount === 0);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProfileAPI();