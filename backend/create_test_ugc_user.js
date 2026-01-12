require('dotenv').config();
const axios = require('axios');

async function createTestUGCUser() {
  try {
    console.log('🔍 Creating Test UGC Creator User');
    console.log('=================================');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Register a new UGC creator user
    const userData = {
      email: 'test-ugc-creator@example.com',
      password: 'testpassword123',
      role: 'ugc_creator'
    };
    
    console.log('Registering new UGC creator user...');
    
    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, userData);
      
      console.log('✅ User registration successful!');
      console.log('User data:', {
        uid: registerResponse.data.user.uid,
        email: registerResponse.data.user.email,
        role: registerResponse.data.user.role
      });
      
      const token = registerResponse.data.token;
      const userId = registerResponse.data.user.uid;
      
      console.log('Token preview:', token.substring(0, 50) + '...');
      
      // Test YouTube connection with this new user
      console.log('\n🔍 Testing YouTube connection with new user...');
      
      const youtubeResponse = await axios.post(
        `${baseURL}/ugc/${userId}/youtube/connect`,
        { channelUrl: '@MrBeast' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ YouTube connection successful!');
      console.log('Response:', youtubeResponse.data);
      
      // Save credentials for frontend testing
      console.log('\n📝 Test Credentials for Frontend:');
      console.log('Email:', userData.email);
      console.log('Password:', userData.password);
      console.log('Token:', token);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('User already exists, trying to login...');
        
        // Try to login with existing user
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        
        console.log('✅ Login successful with existing user!');
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.uid;
        
        // Test YouTube connection
        console.log('\n🔍 Testing YouTube connection...');
        
        const youtubeResponse = await axios.post(
          `${baseURL}/ugc/${userId}/youtube/connect`,
          { channelUrl: '@MrBeast' },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ YouTube connection successful!');
        console.log('Response:', youtubeResponse.data);
        
        console.log('\n📝 Test Credentials for Frontend:');
        console.log('Email:', userData.email);
        console.log('Password:', userData.password);
        console.log('Token:', token);
        
      } else {
        console.log('❌ Registration error:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
          console.log('Validation errors:', error.response.data.errors);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

createTestUGCUser();