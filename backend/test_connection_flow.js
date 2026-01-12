const axios = require('axios');

async function testInstagramConnectionFlow() {
  try {
    console.log('=== TESTING INSTAGRAM CONNECTION FLOW ===');
    
    const baseURL = 'http://localhost:5000/api';
    const testUserId = 'Kyihth9pkebpFvXxVKLE';
    const testUsername = 'sample_influencer';
    
    console.log('1. Testing server connectivity...');
    try {
      const healthCheck = await axios.get(`${baseURL}/health`, { timeout: 5000 });
      console.log('✅ Server is accessible');
    } catch (healthError) {
      console.log('❌ Server connectivity issue:', healthError.message);
    }
    
    console.log('2. Testing Instagram validation endpoint...');
    try {
      const validationResponse = await axios.post(`${baseURL}/influencer/validate-apify`, {
        instagramUsername: testUsername
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Validation response:', validationResponse.data);
    } catch (validationError) {
      console.log('❌ Validation error:', validationError.response?.status, validationError.response?.data?.message || validationError.message);
    }
    
    console.log('3. Testing profile update endpoint...');
    try {
      const updateResponse = await axios.put(`${baseURL}/influencer/${testUserId}`, {
        instagramUsername: testUsername,
        followers: 1500,
        following: 300,
        postsCount: 45,
        engagementRate: 3.2
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Update response:', updateResponse.data);
    } catch (updateError) {
      console.log('❌ Update error:', updateError.response?.status, updateError.response?.data?.message || updateError.message);
    }
    
    console.log('=== ENDPOINT ACCESSIBILITY TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInstagramConnectionFlow();