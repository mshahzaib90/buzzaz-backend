require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const { admin, db } = require('./config/firebase');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'debug-frontend-ugc-' + Date.now();

// Create test user in Firebase
async function createTestUser() {
  const userData = {
    email: 'debug@example.com',
    role: 'ugc_creator',
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  await db.collection('users').doc(TEST_USER_ID).set(userData);
  console.log('Test user created successfully');
}

// Create JWT token
function createTestToken(userId, role) {
  return jwt.sign(
    { uid: userId, role: role },
    'buzzaz_super_secret_jwt_key_2024_production_ready',
    { expiresIn: '1h' }
  );
}

// Clean up test user
async function cleanupTestUser() {
  try {
    await db.collection('users').doc(TEST_USER_ID).delete();
    console.log('Test user cleaned up successfully');
  } catch (error) {
    console.log('Error cleaning up test user:', error.message);
  }
}

// Test UGC form submission exactly like frontend
async function testFrontendUGCSubmission() {
  console.log('Testing UGC form submission exactly like frontend...');
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'ugc_creator');
    console.log('Test token created');
    
    // Prepare FormData exactly like frontend
    const formData = new FormData();
    formData.append('fullName', 'Test User');
    formData.append('email', 'debug@example.com'); // Use logged-in user's email
    formData.append('phoneNumber', '1234567890');
    formData.append('city', 'Test City');
    formData.append('country', 'Test Country');
    formData.append('location', 'Test Location');
    formData.append('dateOfBirth', '1990-01-01');
    formData.append('gender', 'male');
    formData.append('maritalStatus', 'single');
    formData.append('children', 'No');
    formData.append('bio', 'This is a test bio for UGC creator profile');
    formData.append('sampleContentType', 'link');
    formData.append('faceOrFaceless', 'Face');
    
    // Handle sample content (link)
    const validLinks = ['https://example.com/sample1', 'https://example.com/sample2'];
    formData.append('sampleContent', JSON.stringify(validLinks));
    
    // Convert arrays to JSON strings for FormData
    formData.append('niche', JSON.stringify(['Beauty', 'Fashion']));
    formData.append('contentStyle', JSON.stringify(['Product Demo', 'Tutorial']));
    formData.append('languages', JSON.stringify(['English', 'Urdu']));
    
    console.log('FormData prepared with all required fields');
    
    // Make the request with proper headers
    const response = await axios.post(`${BASE_URL}/ugc/profile`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ SUCCESS: UGC profile created successfully!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR: UGC form submission failed');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Full Error:', error.message);
    
    if (error.response?.data?.errors) {
      console.log('\nValidation Errors:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.msg || err.message}`);
      });
    }
  } finally {
    await cleanupTestUser();
  }
}

// Run the test
testFrontendUGCSubmission()
  .then(() => {
    console.log('\n✅ Frontend debug test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });