const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testAPIWithTestUser() {
  try {
    console.log('=== TESTING API WITH TEST USER ===');
    
    const userId = 'kui7voXcFLJFlgHNFoPD'; // Test user ID
    const email = 'test-youtube@example.com';
    
    // Create JWT token
    const token = jwt.sign(
      { uid: userId, email: email, role: 'influencer' },
      'buzzaz_super_secret_jwt_key_2024_production_ready',
      { expiresIn: '24h' }
    );
    
    console.log('Created token for user:', userId);
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Test the API endpoint
    const response = await axios.get('http://localhost:5000/api/influencer/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    const profile = response.data;
    
    console.log('\n=== PROFILE FIELDS ===');
    console.log('Instagram Username:', profile.instagramUsername);
    console.log('Followers:', profile.followers);
    console.log('Following:', profile.following);
    console.log('Posts Count:', profile.postsCount);
    
    console.log('\n=== YOUTUBE FIELDS ===');
    console.log('YouTube Channel ID:', profile.youtubeChannelId);
    console.log('YouTube Channel Title:', profile.youtubeChannelTitle);
    console.log('YouTube Channel URL:', profile.youtubeChannelUrl);
    console.log('YouTube Subscribers:', profile.youtubeSubscribers);
    console.log('YouTube Videos:', profile.youtubeVideos);
    
    console.log('\n=== ALL PROFILE KEYS ===');
    console.log('Available keys:', Object.keys(profile));
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testAPIWithTestUser();