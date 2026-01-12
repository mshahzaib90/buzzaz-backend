const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const { admin, db } = require('./config/firebase');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER_ID = 'debug-validation-test-user';

// Create test user
async function createTestUser() {
  try {
    const userData = {
      uid: TEST_USER_ID,
      email: 'debug-validation@example.com',
      role: 'ugc_creator',
      userType: 'ugc_creator',
      createdAt: new Date().toISOString()
    };
    
    await db.collection('users').doc(TEST_USER_ID).set(userData);
    console.log('Test user created successfully');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
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
    console.error('Error cleaning up test user:', error);
  }
}

// Test direct route access
async function testDirectRouteAccess() {
  console.log('Testing direct route access to identify validation source...');
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'ugc_creator');
    console.log('Test token created');
    
    // Test 1: Empty request to see what validation errors occur
    console.log('\n--- Test 1: Empty FormData ---');
    const emptyFormData = new FormData();
    
    try {
      const response = await axios.post(`${BASE_URL}/ugc/profile`, emptyFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...emptyFormData.getHeaders()
        }
      });
      console.log('Unexpected success with empty data');
    } catch (error) {
      console.log('Empty data validation errors:');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.msg || err.message} (${err.path})`);
        });
      }
    }
    
    // Test 2: Partial data to see which fields are validated
    console.log('\n--- Test 2: Partial FormData ---');
    const partialFormData = new FormData();
    partialFormData.append('fullName', 'Test User');
    partialFormData.append('email', 'test@example.com');
    
    try {
      const response = await axios.post(`${BASE_URL}/ugc/profile`, partialFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...partialFormData.getHeaders()
        }
      });
      console.log('Unexpected success with partial data');
    } catch (error) {
      console.log('Partial data validation errors:');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.msg || err.message} (${err.path})`);
        });
      }
    }
    
    // Test 3: Check if validation is coming from middleware or route handler
    console.log('\n--- Test 3: Raw request body inspection ---');
    const testFormData = new FormData();
    testFormData.append('test', 'value');
    
    try {
      const response = await axios.post(`${BASE_URL}/ugc/profile`, testFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...testFormData.getHeaders()
        }
      });
    } catch (error) {
      console.log('Raw request validation source analysis:');
      console.log('Status:', error.response?.status);
      console.log('Headers:', error.response?.headers);
      console.log('Error structure:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await cleanupTestUser();
  }
}

// Run the test
testDirectRouteAccess()
  .then(() => {
    console.log('\n✅ Route validation debug test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });