require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function debugDetailedEndpoint() {
  try {
    console.log('🔍 Debugging Instagram detailed endpoint...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    const baseURL = 'http://localhost:5000/api';
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
    console.log(`Making request to: ${baseURL}/influencer/${userId}/instagram/detailed`);
    
    const response = await axios.get(`${baseURL}/influencer/${userId}/instagram/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    
    if (response.data.profile) {
      console.log('Profile username:', response.data.profile.username);
      console.log('Profile followers:', response.data.profile.followers);
    }
    
    if (response.data.posts) {
      console.log('Posts structure:', Object.keys(response.data.posts));
    }
    
    if (response.data.analytics) {
      console.log('Analytics keys:', Object.keys(response.data.analytics));
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    
    if (error.response?.data) {
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    // Check if this is a network error
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Server is not running or not accessible');
    }
  }
}

debugDetailedEndpoint();