const axios = require('axios');
const FormData = require('form-data');

async function testUGCBypassAuth() {
  try {
    console.log('🔍 Testing UGC route by bypassing authentication...\n');
    
    // Create a temporary route that bypasses auth for testing
    const testData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      city: 'New York',
      country: 'USA',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'single',
      children: 'none',
      bio: 'Test bio for UGC creator',
      location: 'New York, USA',
      sampleContentType: 'link',
      sampleContent: JSON.stringify(['https://example.com/video1']),
      faceOrFaceless: 'face',
      niche: JSON.stringify(['lifestyle', 'tech']),
      contentStyle: JSON.stringify(['casual', 'professional']),
      languages: JSON.stringify(['English', 'Spanish'])
    };
    
    console.log('📝 Test data prepared');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    // Try with JSON data first
    console.log('\n📤 Testing with JSON data...');
    
    const jsonResponse = await axios.post('http://localhost:5000/api/test/test-ugc-json', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ JSON Test SUCCESS!');
    console.log('Status:', jsonResponse.status);
    console.log('Response:', JSON.stringify(jsonResponse.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.errors) {
        console.log('\nValidation Errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.msg} (field: ${err.path})`);
        });
      }
    }
    
    console.log('Full Error:', error.message);
  }
}

// Run the test
testUGCBypassAuth();