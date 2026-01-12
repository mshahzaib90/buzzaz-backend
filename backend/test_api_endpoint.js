const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('=== TESTING API ENDPOINT ===');
    
    // Test with a known user ID that has Instagram data
    const userId = '6IRNpYjsHYuVM0D0oyLc'; // This user had Instagram data in our previous tests
    
    console.log('Testing with user ID:', userId);
    
    const response = await axios.get(`http://localhost:5000/api/influencer/${userId}`);
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    const profile = response.data.profile;
    const latestStats = response.data.latestStats;
    
    console.log('\n=== PROFILE DATA ===');
    console.log('Instagram Username:', profile?.instagramUsername);
    console.log('YouTube Channel ID:', profile?.youtubeChannelId);
    console.log('TikTok Username:', profile?.tiktokUsername);
    
    console.log('\n=== LATEST STATS ===');
    if (latestStats) {
      console.log('Followers:', latestStats.followers);
      console.log('Following:', latestStats.following);
      console.log('Posts Count:', latestStats.postsCount);
      console.log('Engagement Rate:', latestStats.engagementRate);
    } else {
      console.log('No latest stats found');
    }
    
    // Simulate the frontend merging logic
    const mergedData = {
      ...profile,
      followers: latestStats?.followers || profile?.followers || 0,
      following: latestStats?.following || profile?.following || 0,
      postsCount: latestStats?.postsCount || profile?.postsCount || 0,
      engagementRate: latestStats?.engagementRate || profile?.engagementRate || 0,
    };
    
    console.log('\n=== MERGED DATA (Frontend Simulation) ===');
    console.log('Instagram Username:', mergedData.instagramUsername);
    console.log('Followers:', mergedData.followers);
    console.log('Posts Count:', mergedData.postsCount);
    console.log('Following:', mergedData.following);
    console.log('YouTube Channel ID:', mergedData.youtubeChannelId);
    
    // Test the display conditions
    const hasInstagramUsername = !!mergedData.instagramUsername;
    const hasInstagramStats = (mergedData.followers > 0 || mergedData.postsCount > 0 || mergedData.following > 0);
    const shouldShowInstagram = hasInstagramUsername && hasInstagramStats;
    
    const hasYouTubeChannelId = !!mergedData.youtubeChannelId;
    
    console.log('\n=== DISPLAY CONDITION TESTS ===');
    console.log('Has Instagram username?', hasInstagramUsername);
    console.log('Has Instagram stats (followers > 0 || posts > 0 || following > 0)?', hasInstagramStats);
    console.log('Should show Instagram?', shouldShowInstagram);
    console.log('Has YouTube Channel ID?', hasYouTubeChannelId);
    console.log('Should show YouTube?', hasYouTubeChannelId);
    
    // Check data types
    console.log('\n=== DATA TYPE CHECKS ===');
    console.log('Type of followers:', typeof mergedData.followers, '- Value:', mergedData.followers);
    console.log('Type of postsCount:', typeof mergedData.postsCount, '- Value:', mergedData.postsCount);
    console.log('Type of following:', typeof mergedData.following, '- Value:', mergedData.following);
    
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPIEndpoint().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});