const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Test UGC profile update
async function testUGCUpdate() {
  try {
    // Generate JWT token for the UGC user
    const userId = '48bIIVwgwoK2JumH3u6U';
    const payload = {
      uid: userId,
      email: 'ugc@gmailc.om',
      role: 'content_creator'
    };
    
    const secret = process.env.JWT_SECRET || 'buzzaz_super_secret_jwt_key_2024_production_ready';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    
    console.log('Generated token for user:', userId);
    
    // Test data for profile update
    const updateData = {
      fullName: 'Updated UGC Creator',
      bio: 'Updated bio for testing profile updates',
      location: 'Updated Location',
      phoneNumber: '+1234567890',
      categories: ['Fashion', 'Lifestyle'],
      contentTypes: ['Video', 'Photo'],
      priceRangeMin: 100,
      priceRangeMax: 500
    };
    
    // Make API call to update profile
    const response = await axios.put(
      `http://localhost:5000/api/ugc/profile/${userId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Update API Response Status:', response.status);
    console.log('Update API Response Data:', JSON.stringify(response.data, null, 2));
    
    // Verify the update by fetching the profile
    const getResponse = await axios.get(
      `http://localhost:5000/api/ugc/profile/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('\nVerification - Get Profile Response Status:', getResponse.status);
    console.log('Verification - Profile Data:', JSON.stringify(getResponse.data.profile, null, 2));
    
  } catch (error) {
    console.error('Error testing UGC update:', error.response?.data || error.message);
  }
}

testUGCUpdate();