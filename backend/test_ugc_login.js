require('dotenv').config();
const axios = require('axios');

async function testUGCLogin() {
  try {
    console.log('🔍 Testing UGC Creator Login');
    console.log('============================');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Try to login with one of the existing UGC users
    const testCredentials = [
      { email: 'ugc@gmailc.om', password: 'password123' },
      { email: 'ugc-new@gmail.com', password: 'password123' },
      { email: 'ugctest@example.com', password: 'password123' }
    ];
    
    for (const credentials of testCredentials) {
      console.log(`\nTrying to login with: ${credentials.email}`);
      
      try {
        const response = await axios.post(`${baseURL}/auth/login`, credentials);
        
        console.log('✅ Login successful!');
        console.log('User data:', {
          uid: response.data.user.uid,
          email: response.data.user.email,
          role: response.data.user.role
        });
        console.log('Token preview:', response.data.token.substring(0, 50) + '...');
        
        // Test YouTube connection with this token
        console.log('\n🔍 Testing YouTube connection...');
        const youtubeResponse = await axios.post(
          `${baseURL}/ugc/${response.data.user.uid}/youtube/connect`,
          { channelUrl: '@MrBeast' },
          {
            headers: {
              'Authorization': `Bearer ${response.data.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ YouTube connection successful!');
        console.log('Channel data:', youtubeResponse.data.channelData?.title);
        
        return; // Exit on first successful login
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('❌ Invalid credentials for this user');
        } else {
          console.log('❌ Login error:', error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log('\n❌ Could not login with any test credentials');
    console.log('💡 You may need to:');
    console.log('1. Register a new UGC creator user');
    console.log('2. Use the correct password for existing users');
    console.log('3. Check if the users are active');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUGCLogin();