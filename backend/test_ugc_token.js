const jwt = require('jsonwebtoken');
const { db } = require('./config/firebase');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'buzzaz_super_secret_jwt_key_2024_production_ready';

async function generateToken() {
  try {
    console.log('Starting token generation...');
    // Get the user document
    const userDoc = await db.collection('users').doc('48bIIVwgwoK2JumH3u6U').get();
    
    if (!userDoc.exists) {
      console.log('User not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('User data found:', {
      email: userData.email,
      role: userData.role,
      userType: userData.userType
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        uid: '48bIIVwgwoK2JumH3u6U',
        email: userData.email || 'ugc@gmailc.om',
        role: userData.role || 'ugc_creator'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\nGenerated token:', token);
    console.log('\nTo test the API, use this token in the Authorization header:');
    console.log('Authorization: Bearer ' + token);
    
    // Test the API call with the token
    const axios = require('axios');
    try {
      const response = await axios.get('http://localhost:5000/api/ugc/profile/48bIIVwgwoK2JumH3u6U', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('\nAPI Response Status:', response.status);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    } catch (apiError) {
      console.error('\nAPI Error:', apiError.response?.data || apiError.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateToken();