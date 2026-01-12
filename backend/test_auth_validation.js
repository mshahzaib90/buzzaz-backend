const axios = require('axios');

async function testWithAuth() {
  try {
    console.log('=== TESTING INSTAGRAM VALIDATION WITH AUTHENTICATION ===');
    
    // First, create a test user
    console.log('1. Creating test user...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      email: uniqueEmail,
      password: 'testpass123',
      role: 'influencer'
    });
    
    console.log('   Test user created successfully');
    const token = registerResponse.data.token;
    
    // Now test Instagram validation with the token
    console.log('2. Testing Instagram validation with authentication...');
    const validationResponse = await axios.post('http://localhost:5000/api/influencer/validate-apify', {
      instagramUsername: 'laibybaby'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Validation successful!');
    console.log('   Response:', JSON.stringify(validationResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n=== AUTHENTICATION ISSUE DETECTED ===');
      console.log('This confirms the "Server error during validation" is due to missing authentication.');
      console.log('The user needs to be logged in to use the Instagram validation feature.');
    }
  }
}

testWithAuth();