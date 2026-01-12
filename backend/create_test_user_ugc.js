const { admin, db } = require('./config/firebase');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

async function createTestUserAndProfile() {
  try {
    console.log('🔧 Creating test user and testing UGC profile...\n');
    
    const testUserId = 'test-ugc-user-' + Date.now();
    const testEmail = `test-ugc-${Date.now()}@example.com`;
    
    // Create test user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      uid: testUserId,
      email: testEmail,
      password: 'testpassword123',
      displayName: 'Test UGC User'
    });
    
    console.log('✅ Firebase Auth user created:', userRecord.uid);
    
    // Create user document in Firestore
    await db.collection('users').doc(testUserId).set({
      uid: testUserId,
      email: testEmail,
      displayName: 'Test UGC User',
      role: 'ugc_creator',
      userType: 'ugc_creator',
      createdAt: new Date().toISOString(),
      isActive: true
    });
    
    console.log('✅ Firestore user document created');
    
    // Create JWT token
    const token = jwt.sign(
      {
        uid: testUserId,
        email: testEmail,
        role: 'ugc_creator'
      },
      'buzzaz_super_secret_jwt_key_2024_production_ready',
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT token created');
    
    // Test the UGC profile creation
    const formData = new FormData();
    formData.append('fullName', 'John Doe');
    formData.append('email', testEmail);
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
    
    console.log('\n📤 Testing UGC profile creation...');
    
    const response = await axios.post('http://localhost:5000/api/ugc/profile', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('\n🎉 SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Clean up - delete the test user
    await admin.auth().deleteUser(testUserId);
    await db.collection('users').doc(testUserId).delete();
    await db.collection('ugc_creators').doc(testUserId).delete();
    
    console.log('\n🧹 Test user cleaned up');
    
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
    
    // Try to clean up even if there was an error
    try {
      if (testUserId) {
        await admin.auth().deleteUser(testUserId);
        await db.collection('users').doc(testUserId).delete();
        await db.collection('ugc_creators').doc(testUserId).delete();
        console.log('🧹 Cleanup completed');
      }
    } catch (cleanupError) {
      console.log('⚠️ Cleanup failed:', cleanupError.message);
    }
  }
}

// Run the test
createTestUserAndProfile();