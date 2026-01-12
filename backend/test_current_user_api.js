const axios = require('axios');
const { admin, db } = require('./config/firebase');

async function testCurrentUserAPI() {
  try {
    console.log('=== TESTING CURRENT USER API ENDPOINT ===');
    
    // Get the current user ID
    const currentUserId = 'X0IqcgoiqNm6OgOKKKT1';
    console.log('Testing with current user ID:', currentUserId);
    
    // Create a custom token for authentication
    const customToken = await admin.auth().createCustomToken(currentUserId);
    console.log('Created custom token for authentication');
    
    // Test the API endpoint with authentication
    const response = await axios.get(`http://localhost:5000/api/influencer/${currentUserId}`, {
      headers: {
        'Authorization': `Bearer ${customToken}`
      }
    });
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Full Response Data:', JSON.stringify(response.data, null, 2));
    
    const profile = response.data.profile;
    const latestStats = response.data.latestStats;
    
    console.log('\n=== PROFILE DATA ANALYSIS ===');
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
    
    console.log('\n=== LATEST STATS ===');
    if (latestStats) {
      console.log('Stats Followers:', latestStats.followers);
      console.log('Stats Posts:', latestStats.postsCount);
      console.log('Stats Following:', latestStats.following);
    } else {
      console.log('No latest stats found');
    }
    
    console.log('\n=== DISPLAY CONDITIONS TEST ===');
    console.log('Instagram Display (username exists):', !!profile?.instagramUsername);
    console.log('YouTube Display (channelId exists):', !!profile?.youtubeChannelId);
    console.log('TikTok Display (username exists):', !!profile?.tiktokUsername);
    
    console.log('\n=== END TEST ===');
    process.exit(0);
    
  } catch (error) {
    console.error('Error testing API endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testCurrentUserAPI();