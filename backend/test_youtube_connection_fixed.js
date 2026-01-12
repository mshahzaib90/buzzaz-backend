const axios = require('axios');

async function testYouTubeConnection() {
  try {
    console.log('Testing YouTube connection with fixed route...');
    
    // Test the YouTube connect endpoint with a test user ID
    const testUserId = 'test-user-123';
    const response = await axios.post(`http://localhost:5000/api/ugc/${testUserId}/youtube/connect`, {
      channelUrl: 'https://www.youtube.com/@MrBeast'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ YouTube connection successful!');
      console.log('Channel ID:', response.data.data.youtubeChannelId);
      console.log('Channel Title:', response.data.data.youtubeChannelTitle);
      console.log('Subscriber Count:', response.data.data.youtubeSubscriberCount);
      console.log('Recent Videos Count:', response.data.data.youtubeRecentVideos?.length || 0);
    } else {
      console.log('❌ YouTube connection failed:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing YouTube connection:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testYouTubeConnection();