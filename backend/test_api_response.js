const axios = require('axios');

async function testAPIResponse() {
  try {
    console.log('=== TESTING API RESPONSE FOR new124@gmail.com ===');
    
    // Test with the actual user ID for new124@gmail.com
    const userId = 'ikGacihCCEDUvZt93wbD';
    
    console.log('Testing API endpoint for user ID:', userId);
    
    const response = await axios.get(`http://localhost:5000/api/influencer/${userId}`);
    
    console.log('=== API RESPONSE STATUS ===');
    console.log('Status:', response.status);
    
    console.log('\n=== FULL API RESPONSE ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    const profile = response.data.profile;
    const latestStats = response.data.latestStats;
    
    console.log('\n=== PROFILE FIELDS ANALYSIS ===');
    console.log('Instagram Username:', profile?.instagramUsername);
    console.log('Instagram Followers (profile):', profile?.followers);
    console.log('Instagram Following (profile):', profile?.following);
    console.log('Instagram Posts (profile):', profile?.postsCount);
    console.log('Instagram Followers (instagramFollowers):', profile?.instagramFollowers);
    console.log('Instagram Following (instagramFollowing):', profile?.instagramFollowing);
    console.log('Instagram Posts (instagramPostsCount):', profile?.instagramPostsCount);
    
    console.log('\nYouTube Channel ID:', profile?.youtubeChannelId);
    console.log('YouTube Channel Title:', profile?.youtubeChannelTitle);
    console.log('YouTube Channel URL:', profile?.youtubeChannelUrl);
    
    console.log('\n=== LATEST STATS ANALYSIS ===');
    if (latestStats) {
      console.log('Stats Followers:', latestStats.followers);
      console.log('Stats Following:', latestStats.following);
      console.log('Stats Posts Count:', latestStats.postsCount);
    } else {
      console.log('No latest stats found');
    }
    
    console.log('\n=== FRONTEND CONDITION SIMULATION ===');
    // Simulate the frontend condition
    const hasInstagramUsername = !!profile?.instagramUsername;
    const hasFollowers = (profile?.followers || 0) > 0;
    const hasPosts = (profile?.postsCount || 0) > 0;
    const hasFollowing = (profile?.following || 0) > 0;
    const instagramCondition = hasInstagramUsername && (hasFollowers || hasPosts || hasFollowing);
    
    console.log('Has Instagram Username:', hasInstagramUsername);
    console.log('Has Followers > 0:', hasFollowers);
    console.log('Has Posts > 0:', hasPosts);
    console.log('Has Following > 0:', hasFollowing);
    console.log('Instagram Display Condition Result:', instagramCondition);
    
    const hasYouTubeChannelId = !!profile?.youtubeChannelId;
    console.log('Has YouTube Channel ID:', hasYouTubeChannelId);
    console.log('YouTube Display Condition Result:', hasYouTubeChannelId);
    
  } catch (error) {
    console.error('=== API TEST ERROR ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testAPIResponse();