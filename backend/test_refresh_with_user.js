const axios = require('axios');

async function testRefreshWithUser() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI'; // User with Instagram @kainat_tahirr
    
    console.log('Testing Instagram refresh for user:', userId);
    console.log('Instagram username: @kainat_tahirr');
    
    // Test the refresh endpoint
    const response = await axios.post(`http://localhost:5000/api/influencer/${userId}/instagram/refresh`, {}, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    console.log('✅ Refresh successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRefreshWithUser();