const axios = require('axios');

async function testValidationAPI() {
  try {
    console.log('Testing validation API endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/influencer/validate-apify', {
      instagramUsername: 'testuser'
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth, but we want to see the error handling
      }
    });
    
    console.log('SUCCESS:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('API Error Response:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testValidationAPI();