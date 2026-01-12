require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test YouTube connection endpoint
async function testYouTubeConnect() {
  try {
    // Create a test JWT token (you'll need to replace with actual user ID)
    const testUserId = 'test-user-id';
    const token = jwt.sign({ uid: testUserId }, process.env.JWT_SECRET);
    
    console.log('Testing YouTube connection...');
    console.log('JWT Secret present:', process.env.JWT_SECRET ? 'Yes' : 'No');
    console.log('YouTube API Key present:', process.env.YOUTUBE_API_KEY ? 'Yes' : 'No');
    
    const response = await axios.post(
      `http://localhost:5000/api/ugc/${testUserId}/youtube/connect`,
      {
        channelQuery: 'MrBeast'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ SUCCESS:', response.data);
    
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('Authentication failed - checking token...');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
      }
    }
  }
}

testYouTubeConnect();