require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function debugEndpointRouting() {
  try {
    console.log('🔧 Debugging endpoint routing...');
    
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
    
    // Test different endpoint variations
    const endpoints = [
      `/api/influencer/${userId}/instagram/detailed`,
      `/influencer/${userId}/instagram/detailed`,
      `/api/influencer/${userId}/instagram/refresh`,
      `/influencer/${userId}/instagram/refresh`
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      try {
        const response = await axios.get(`http://localhost:5000${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Success! Status: ${response.status}`);
        console.log('Response keys:', Object.keys(response.data));
        
      } catch (error) {
        console.log(`❌ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.error) {
          console.log('Error details:', error.response.data.error);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in debug script:', error.message);
  }
  
  process.exit(0);
}

debugEndpointRouting();