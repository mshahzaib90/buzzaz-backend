const axios = require('axios');

async function testCurrentUser() {
  try {
    console.log('=== TESTING CURRENT USER API ===');
    
    // Test with different user IDs from our database
    const userIds = [
      'maaz safder',
      'wVLd8AtdoNZGlNx1XSxk', // asdasd with Instagram
      'wWqud9tZPdjQTcacqjoo'  // bismakhannn with Instagram
    ];
    
    for (const userId of userIds) {
      console.log(`\n--- Testing User ID: ${userId} ---`);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/influencer/${userId}`, {
          headers: {
            'Authorization': 'Bearer test-token' // This might fail due to auth, but let's see
          }
        });
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
        const profile = response.data.profile;
        console.log('Instagram Username:', profile?.instagramUsername);
        console.log('YouTube Channel ID:', profile?.youtubeChannelId);
        console.log('TikTok Username:', profile?.tiktokUsername);
        
      } catch (error) {
        console.log('Error for user', userId, ':', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n=== END TEST ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCurrentUser();