// Debug script to test TikTok update directly
const axios = require('axios');

async function testTikTokUpdate() {
  try {
    console.log('=== DIRECT TIKTOK UPDATE TEST ===');
    
    // Test payload
    const payload = { tiktokUsername: 'testuser123' };
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Make request to backend
    const response = await axios.put('http://localhost:5000/api/influencer/test-user-id', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.log('=== ERROR DETAILS ===');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('Authentication error - this is expected with fake token');
    } else if (error.response?.status === 400) {
      console.log('Bad request - this might be our "No valid updates provided" error');
    }
  }
  
  console.log('=== END TEST ===');
}

testTikTokUpdate();