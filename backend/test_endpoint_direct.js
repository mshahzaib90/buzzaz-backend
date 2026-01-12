require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testEndpointDirect() {
  try {
    console.log('🔧 Testing Instagram detailed endpoint directly...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Create a valid token
    const token = jwt.sign(
      { 
        uid: userId,
        email: 'mdshahzaib222@gmail.com',
        role: 'influencer'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Token created');
    
    // Test the endpoint
    const response = await axios.get(`http://localhost:5000/api/influencer/${userId}/instagram/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
  
  process.exit(0);
}

testEndpointDirect();