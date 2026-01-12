require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials (you may need to adjust these)// Test users for different roles (using working credentials)
const testUsers = {
  brand: {
    email: 'brandtest@example.com',
    password: 'TestPassword123!'
  },
  influencer: {
    email: 'influencertest@example.com',
    password: 'TestPassword123!'
  },
  ugc_creator: {
    email: 'ugctest@example.com',
    password: 'TestPassword123!'
  }
};

async function testChatEndpoints() {
  console.log('🧪 Testing Chat Endpoints');
  console.log('========================\n');

  try {
    // Test 1: Login as brand and test /influencers/all endpoint
    console.log('1. Testing Brand -> /influencers/all endpoint');
    console.log('-----------------------------------------------');
    
    try {
      const brandLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUsers.brand);
      const brandToken = brandLoginResponse.data.token;
      console.log('✅ Brand login successful');

      const influencersResponse = await axios.get(`${API_BASE_URL}/influencers/all`, {
        headers: { Authorization: `Bearer ${brandToken}` }
      });

      console.log(`✅ /influencers/all endpoint working - Found ${influencersResponse.data.users?.length || 0} users`);
      if (influencersResponse.data.users?.length > 0) {
        console.log('   Sample user:', {
          id: influencersResponse.data.users[0].id,
          name: influencersResponse.data.users[0].name,
          role: influencersResponse.data.users[0].role
        });
      }
    } catch (error) {
      console.log('❌ Brand test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n');

    // Test 2: Login as influencer and test /user/brands endpoint
    console.log('2. Testing Influencer -> /user/brands endpoint');
    console.log('----------------------------------------------');
    
    try {
      const influencerLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUsers.influencer);
      const influencerToken = influencerLoginResponse.data.token;
      console.log('✅ Influencer login successful');

      const brandsResponse = await axios.get(`${API_BASE_URL}/user/brands`, {
        headers: { Authorization: `Bearer ${influencerToken}` }
      });

      console.log(`✅ /user/brands endpoint working - Found ${brandsResponse.data.users?.length || 0} brands`);
      if (brandsResponse.data.users?.length > 0) {
        console.log('   Sample brand:', {
          id: brandsResponse.data.users[0].id,
          name: brandsResponse.data.users[0].name,
          role: brandsResponse.data.users[0].role
        });
      }
    } catch (error) {
      console.log('❌ Influencer test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n');

    // Test 3: Login as UGC creator and test /user/brands endpoint
    console.log('3. Testing UGC Creator -> /user/brands endpoint');
    console.log('-----------------------------------------------');
    
    try {
      const ugcLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUsers.ugc_creator);
      const ugcToken = ugcLoginResponse.data.token;
      console.log('✅ UGC Creator login successful');

      const brandsResponse = await axios.get(`${API_BASE_URL}/user/brands`, {
        headers: { Authorization: `Bearer ${ugcToken}` }
      });

      console.log(`✅ /user/brands endpoint working - Found ${brandsResponse.data.users?.length || 0} brands`);
      if (brandsResponse.data.users?.length > 0) {
        console.log('   Sample brand:', {
          id: brandsResponse.data.users[0].id,
          name: brandsResponse.data.users[0].name,
          role: brandsResponse.data.users[0].role
        });
      }
    } catch (error) {
      console.log('❌ UGC Creator test failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }

  console.log('\n🏁 Chat endpoints testing complete!');
}

// Run the test
testChatEndpoints();