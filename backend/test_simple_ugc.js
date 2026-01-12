const axios = require('axios');
const jwt = require('jsonwebtoken');
const { admin } = require('./config/firebase');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-simple-ugc-' + Date.now();

// Create a test JWT token
function createTestToken(userId, role = 'content_creator') {
  return jwt.sign(
    { uid: userId, role: role },
    'buzzaz_super_secret_jwt_key_2024_production_ready',
    { expiresIn: '1h' }
  );
}

// Create test user in Firebase
async function createTestUser() {
  try {
    const userData = {
      email: `test-${TEST_USER_ID}@example.com`,
      role: 'content_creator',
      userType: 'content_creator',
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    await admin.firestore().collection('users').doc(TEST_USER_ID).set(userData);
    console.log('Test user created successfully');
    return userData;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

// Clean up test user
async function cleanupTestUser() {
  try {
    await admin.firestore().collection('users').doc(TEST_USER_ID).delete();
    await admin.firestore().collection('ugc_creators').doc(TEST_USER_ID).delete();
    console.log('Test user cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

// Test UGC form submission with JSON
async function testUGCFormSubmissionJSON() {
  console.log('Testing UGC form submission with JSON data...');
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'content_creator');
    console.log('Test token created');
    
    // Prepare JSON data
    const jsonData = {
      fullName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      city: 'Test City',
      country: 'Test Country',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      maritalStatus: 'Single',
      children: 'No',
      bio: 'This is a test bio for UGC creator profile',
      location: 'Test Location',
      sampleContentType: 'link',
      sampleContent: JSON.stringify(['https://example.com/sample1', 'https://example.com/sample2']),
      niche: JSON.stringify(['Beauty', 'Fashion']),
      contentStyle: JSON.stringify(['Product Demo', 'Tutorial']),
      faceOrFaceless: 'Face',
      languages: JSON.stringify(['English', 'Urdu'])
    };
    
    console.log('JSON data prepared:', JSON.stringify(jsonData, null, 2));
    
    // Make the request
    const response = await axios.post(`${BASE_URL}/ugc/profile`, jsonData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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
  } finally {
    await cleanupTestUser();
  }
}

// Run the test
async function runTests() {
  console.log('Starting Simple UGC Form Tests...\n');
  
  try {
    await testUGCFormSubmissionJSON();
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('\n✅ All tests completed!');
}

runTests();