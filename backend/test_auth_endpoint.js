const axios = require('axios');

async function testAuthEndpoint() {
  try {
    console.log('🔍 Testing Instagram detailed endpoint with authentication...');
    
    // Test without authentication first
    console.log('\n1. Testing WITHOUT authentication:');
    try {
      const response = await axios.get('http://localhost:5000/api/influencer/0ZPlyBVkHGHUEPRcxB2I/instagram/detailed');
      console.log('✅ Success (unexpected):', response.status);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test with a mock token
    console.log('\n2. Testing WITH mock authentication:');
    try {
      const response = await axios.get('http://localhost:5000/api/influencer/0ZPlyBVkHGHUEPRcxB2I/instagram/detailed', {
        headers: {
          'Authorization': 'Bearer mock-token-123'
        }
      });
      console.log('✅ Success:', response.status);
      console.log('Data keys:', Object.keys(response.data));
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test the endpoint structure
    console.log('\n3. Testing endpoint availability:');
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running:', response.status);
    } catch (error) {
      console.log('❌ Server issue:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

testAuthEndpoint();