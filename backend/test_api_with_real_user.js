const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testAPIWithRealUser() {
  try {
    console.log('=== TESTING API WITH REAL USER ===');
    
    // The user ID that has YouTube data
    const userId = '4SIJSZdXKwQ3YCPdD0YM';
    const email = '1n1@1n1.com';
    const role = 'influencer';
    
    // Create a JWT token for this user
    const token = jwt.sign(
      { uid: userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Created token for user:', userId);
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Make API request
    const response = await axios.get(`http://localhost:5000/api/influencer/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Profile data:');
    console.log('- Instagram Username:', response.data.profile?.instagramUsername);
    console.log('- YouTube Channel ID:', response.data.profile?.youtubeChannelId);
    console.log('- YouTube Channel Title:', response.data.profile?.youtubeChannelTitle);
    console.log('- YouTube Channel URL:', response.data.profile?.youtubeChannelUrl);
    console.log('- YouTube Subscribers:', response.data.profile?.youtubeSubscribers);
    console.log('- YouTube Videos:', response.data.profile?.youtubeVideos);
    
    console.log('\nFull profile object keys:', Object.keys(response.data.profile || {}));
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testAPIWithRealUser();