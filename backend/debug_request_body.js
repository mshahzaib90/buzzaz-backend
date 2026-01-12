const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

// Create a test JWT token
function createTestToken() {
  const payload = {
    uid: 'test-user-123',
    email: 'test@example.com',
    role: 'ugc_creator'
  };
  
  return jwt.sign(payload, 'buzzaz_super_secret_jwt_key_2024_production_ready', { expiresIn: '1h' });
}

async function debugRequestBody() {
  try {
    console.log('🔍 Debugging UGC Request Body...\n');
    
    const token = createTestToken();
    console.log('✅ JWT Token created');
    
    // Create FormData with all required fields
    const formData = new FormData();
    formData.append('fullName', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('phoneNumber', '+1234567890');
    formData.append('city', 'New York');
    formData.append('country', 'USA');
    formData.append('dateOfBirth', '1990-01-01');
    formData.append('gender', 'male');
    formData.append('maritalStatus', 'single');
    formData.append('children', 'none');
    formData.append('bio', 'Test bio for UGC creator');
    formData.append('location', 'New York, USA');
    formData.append('sampleContentType', 'link');
    formData.append('sampleContent', JSON.stringify(['https://example.com/video1']));
    formData.append('faceOrFaceless', 'face');
    formData.append('niche', JSON.stringify(['lifestyle', 'tech']));
    formData.append('contentStyle', JSON.stringify(['casual', 'professional']));
    formData.append('languages', JSON.stringify(['English', 'Spanish']));
    
    console.log('📝 FormData created with all fields');
    
    // Log what we're sending
    console.log('\n📤 Request Details:');
    console.log('URL: http://localhost:5000/api/ugc/profile');
    console.log('Method: POST');
    console.log('Headers:', {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    });
    
    // Make the request
    const response = await axios.post('http://localhost:5000/api/ugc/profile', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.errors) {
        console.log('\nValidation Errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.msg}`);
        });
      }
    }
    
    console.log('Full Error:', error.message);
  }
}

// Run the debug
debugRequestBody();