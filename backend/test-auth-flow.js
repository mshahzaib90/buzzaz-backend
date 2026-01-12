require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing Registration...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: uniqueEmail,
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'influencer'
      });
      
      console.log('✅ Registration successful');
      console.log('   Status:', registerResponse.status);
      console.log('   Token received:', !!registerResponse.data.token);
      console.log('   User ID:', registerResponse.data.user?.uid);
      
      const token = registerResponse.data.token;
      
      // Test 2: Verify the token
      console.log('\n2. Testing Token Verification...');
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Token verification successful');
      console.log('   Status:', verifyResponse.status);
      console.log('   Valid:', verifyResponse.data.valid);
      console.log('   User role:', verifyResponse.data.user?.role);
      
      // Test 3: Login with the same credentials
      console.log('\n3. Testing Login...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: uniqueEmail,
        password: 'testpass123'
      });
      
      console.log('✅ Login successful');
      console.log('   Status:', loginResponse.status);
      console.log('   Token received:', !!loginResponse.data.token);
      console.log('   User role:', loginResponse.data.user?.role);
      
      // Test 4: Test protected endpoint
      console.log('\n4. Testing Protected Endpoint...');
      const protectedResponse = await axios.get(`${BASE_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      console.log('✅ Protected endpoint accessible');
      console.log('   Status:', protectedResponse.status);
      
    } catch (registerError) {
      if (registerError.response?.status === 400 && registerError.response?.data?.message === 'User already exists') {
        console.log('⚠️ User already exists, testing login instead...');
        
        // Test login with existing user
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'testpass123'
        });
        
        console.log('✅ Login with existing user successful');
        console.log('   Status:', loginResponse.status);
        console.log('   Token received:', !!loginResponse.data.token);
        
      } else {
        throw registerError;
      }
    }
    
    console.log('\n🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   Full error:', error.response?.data);
    
    // Additional debugging
    if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Server is not running or not accessible');
    }
  }
}

testAuthFlow();