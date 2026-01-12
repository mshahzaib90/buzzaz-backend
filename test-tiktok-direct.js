// Direct test to simulate TikTok update request
const axios = require('axios');

async function testTikTokUpdate() {
  console.log('=== TESTING TIKTOK UPDATE DIRECTLY ===');
  
  try {
    // Test with a valid payload structure
    const payload = { tiktokUsername: 'testuser123' };
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    // Make request to the backend (this will fail auth but show us the validation)
    const response = await axios.put('http://localhost:5000/api/influencer/test-user-id', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('=== ERROR ANALYSIS ===');
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Full error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('✓ Authentication error (expected with invalid token)');
    } else if (error.response?.status === 400) {
      console.log('✗ Bad request error - this might be our validation issue');
      if (error.response?.data?.message === 'No valid updates provided') {
        console.log('✗ FOUND THE ISSUE: "No valid updates provided" error');
        console.log('This means the backend is not accepting tiktokUsername as a valid field');
      }
    } else {
      console.log('? Unexpected error status');
    }
  }
  
  console.log('=== END TEST ===');
}

// Test with empty payload
async function testEmptyPayload() {
  console.log('\n=== TESTING EMPTY PAYLOAD ===');
  
  try {
    const response = await axios.put('http://localhost:5000/api/influencer/test-user-id', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('Empty payload error:', error.response?.data?.message);
    if (error.response?.data?.message === 'No valid updates provided') {
      console.log('✓ Empty payload correctly returns "No valid updates provided"');
    }
  }
}

// Test with invalid field
async function testInvalidField() {
  console.log('\n=== TESTING INVALID FIELD ===');
  
  try {
    const payload = { invalidField: 'test' };
    const response = await axios.put('http://localhost:5000/api/influencer/test-user-id', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('Invalid field error:', error.response?.data?.message);
    if (error.response?.data?.message === 'No valid updates provided') {
      console.log('✓ Invalid field correctly returns "No valid updates provided"');
    }
  }
}

// Run all tests
async function runAllTests() {
  await testTikTokUpdate();
  await testEmptyPayload();
  await testInvalidField();
}

runAllTests();