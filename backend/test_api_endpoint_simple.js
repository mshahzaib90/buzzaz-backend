const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('=== TESTING API ENDPOINT ===');
    
    // Test the exact API endpoint the frontend is calling
    const userId = 'lllGdq8BBRZQQOCIWuWC';
    const apiUrl = `http://localhost:5000/api/influencer/${userId}`;
    
    console.log('API URL:', apiUrl);
    
    // Make the request without auth first to see if it's an auth issue
    try {
      const response = await axios.get(apiUrl);
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (authError) {
      console.log('Auth error (expected):', authError.response?.status);
      console.log('Auth error message:', authError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
  }
}

testAPIEndpoint();