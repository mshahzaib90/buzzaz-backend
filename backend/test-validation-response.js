require('dotenv').config();
const { validateInstagramUsername } = require('./services/apifyService');

async function testValidationResponse() {
  try {
    console.log('=== TESTING VALIDATION RESPONSE FORMAT ===');
    console.log('Testing with username: kinzahashmi');
    
    const result = await validateInstagramUsername('kinzahashmi');
    
    console.log('\n=== VALIDATION RESULT ===');
    console.log('Type:', typeof result);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    console.log('\n=== CHECKING PROPERTIES ===');
    console.log('result.isValid:', result.isValid);
    console.log('result.profileData:', result.profileData ? 'exists' : 'missing');
    console.log('result.error:', result.error ? result.error : 'no error');
    
    // Simulate backend response format
    console.log('\n=== SIMULATED BACKEND RESPONSE ===');
    if (result.isValid) {
      const backendResponse = {
        success: true,
        message: 'Instagram profile validated successfully',
        profileData: result.profileData
      };
      console.log('Success response:', JSON.stringify(backendResponse, null, 2));
    } else {
      const backendResponse = {
        success: false,
        message: 'Instagram username validation failed',
        error: result.error
      };
      console.log('Error response:', JSON.stringify(backendResponse, null, 2));
    }
    
  } catch (error) {
    console.error('=== ERROR OCCURRED ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testValidationResponse();