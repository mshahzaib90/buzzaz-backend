// Test script to verify TikTok validation using the test route
const axios = require('axios');

async function testTikTokValidation() {
  console.log('=== TESTING TIKTOK VALIDATION VIA TEST ROUTE ===');
  
  try {
    // Test with TikTok username
    const payload = { tiktokUsername: 'testuser123' };
    console.log('Testing payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.put('http://localhost:5000/api/test/test-tiktok-validation', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS - Response:', response.data);
    
  } catch (error) {
    console.log('❌ ERROR - Status:', error.response?.status);
    console.log('❌ ERROR - Message:', error.response?.data?.message);
    console.log('❌ ERROR - Full data:', error.response?.data);
    
    if (error.response?.data?.message === 'No valid updates provided') {
      console.log('🔍 FOUND THE ISSUE: TikTok username is being filtered out');
    }
  }
}

async function testEmptyPayload() {
  console.log('\n=== TESTING EMPTY PAYLOAD ===');
  
  try {
    const response = await axios.put('http://localhost:5000/api/test/test-tiktok-validation', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Unexpected success:', response.data);
    
  } catch (error) {
    console.log('Empty payload result:', error.response?.data?.message);
    if (error.response?.data?.message === 'No valid updates provided') {
      console.log('✅ Empty payload correctly filtered');
    }
  }
}

async function testValidField() {
  console.log('\n=== TESTING VALID FIELD (fullName) ===');
  
  try {
    const payload = { fullName: 'Test User' };
    const response = await axios.put('http://localhost:5000/api/test/test-tiktok-validation', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Valid field success:', response.data);
    
  } catch (error) {
    console.log('❌ Valid field error:', error.response?.data?.message);
  }
}

async function runAllTests() {
  await testTikTokValidation();
  await testEmptyPayload();
  await testValidField();
}

runAllTests();