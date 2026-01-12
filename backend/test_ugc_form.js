const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const { admin } = require('./config/firebase');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'test-ugc-user-' + Date.now();

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

// Test UGC form submission
async function testUGCFormSubmission() {
  console.log('Testing UGC form submission with authentication...');
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'content_creator');
    console.log('Test token created');
    
    // Prepare form data
    const formData = new FormData();
    formData.append('fullName', 'Test User');
    formData.append('email', 'test@example.com');
    formData.append('phoneNumber', '1234567890');
    formData.append('city', 'Test City');
    formData.append('country', 'Test Country');
    formData.append('dateOfBirth', '1990-01-01');
    formData.append('gender', 'Male');
    formData.append('maritalStatus', 'Single');
    formData.append('children', 'No');
    formData.append('bio', 'This is a test bio for UGC creator profile');
    formData.append('location', 'Test Location');
    formData.append('sampleContentType', 'link');
    formData.append('sampleContent', JSON.stringify(['https://example.com/sample1', 'https://example.com/sample2']));
    formData.append('niche', JSON.stringify(['Beauty', 'Fashion']));
    formData.append('contentStyle', JSON.stringify(['Product Demo', 'Tutorial']));
    formData.append('faceOrFaceless', 'Face');
    formData.append('languages', JSON.stringify(['English', 'Urdu']));
    
    console.log('Form data prepared with all required fields');
    
    // Make the request
    const response = await axios.post(`${BASE_URL}/ugc/profile`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
    
    // Additional debugging
    if (error.response?.data?.errors) {
      console.log('\nValidation Errors:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.msg || err.message}`);
      });
    }
  } finally {
    // Clean up
    await cleanupTestUser();
  }
}

// Test with missing fields to verify validation
async function testValidationErrors() {
  console.log('\nTesting validation with missing fields...');
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'content_creator');
    
    // Prepare incomplete form data (missing required fields)
    const formData = new FormData();
    formData.append('fullName', 'Test User');
    // Missing phoneNumber, city, country, etc.
    formData.append('bio', 'Test bio');
    
    const response = await axios.post(`${BASE_URL}/ugc/profile`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('❌ UNEXPECTED: Request should have failed with validation errors');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ SUCCESS: Validation working correctly');
      console.log('Validation errors found:', error.response.data.errors?.length || 0);
      if (error.response.data.errors) {
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.msg || err.message}`);
        });
      }
    } else {
      console.log('❌ UNEXPECTED ERROR:', error.message);
    }
  } finally {
    // Clean up
    await cleanupTestUser();
  }
}

// Run tests
async function runTests() {
  console.log('Starting UGC Form Tests...\n');
  
  try {
    await testUGCFormSubmission();
    await testValidationErrors();
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests
runTests();