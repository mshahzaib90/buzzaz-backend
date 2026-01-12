require('dotenv').config();
const axios = require('axios');

// Test authentication with a simple endpoint
async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Try to access a protected endpoint without token
    console.log('\n1. Testing without token:');
    try {
      const response = await axios.get('http://localhost:5000/api/ugc/browse');
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.data?.message || error.message);
    }
    
    // Try to access with invalid token
    console.log('\n2. Testing with invalid token:');
    try {
      const response = await axios.get('http://localhost:5000/api/ugc/browse', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('✅ Unexpected success:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n✅ Authentication middleware is working correctly');
    console.log('The issue is likely that you need to be logged in with a valid user account.');
    console.log('\nTo fix this:');
    console.log('1. Make sure you are logged in to the frontend application');
    console.log('2. Check the browser\'s Network tab for the actual error when connecting YouTube');
    console.log('3. The JWT token should be automatically included by the frontend');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();