const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test users to create
const testUsers = [
  {
    email: 'brandtest@example.com',
    password: 'TestPassword123!',
    fullName: 'Brand Test User',
    role: 'brand'
  },
  {
    email: 'influencertest@example.com',
    password: 'TestPassword123!',
    fullName: 'Influencer Test User',
    role: 'influencer'
  }
];

async function createTestUsers() {
  console.log('=== CREATING TEST USERS FOR CHAT ENDPOINTS ===\n');
  
  for (const user of testUsers) {
    try {
      console.log(`Creating ${user.role} user: ${user.email}`);
      
      const response = await axios.post(`${BASE_URL}/auth/register`, user);
      
      if (response.status === 201) {
        console.log(`✅ ${user.role} user created successfully`);
        console.log(`   User ID: ${response.data.user.uid}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Role: ${response.data.user.role}\n`);
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  ${user.role} user already exists: ${user.email}\n`);
      } else {
        console.error(`❌ Failed to create ${user.role} user:`, error.response?.data || error.message);
        console.log('');
      }
    }
  }
  
  console.log('=== TEST USER CREATION COMPLETE ===');
}

createTestUsers().catch(console.error);