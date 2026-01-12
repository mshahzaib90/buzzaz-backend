require('dotenv').config();
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { admin, db } = require('./config/firebase');

const app = express();
const port = 3001;

// Configure multer for debugging
const upload = multer();

const TEST_USER_ID = 'debug-multer-' + Date.now();

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
    { uid: userId, email: 'debug@example.com', role },
    process.env.JWT_SECRET,
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

// Debug route to test multer parsing
app.post('/debug-multer', upload.single('sampleContent'), (req, res) => {
  console.log('=== MULTER DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Body values:');
  Object.entries(req.body).forEach(([key, value]) => {
    console.log(`  ${key}: ${value} (type: ${typeof value})`);
  });
  
  res.json({
    success: true,
    body: req.body,
    file: req.file,
    bodyKeys: Object.keys(req.body)
  });
});

// Start debug server
app.listen(port, async () => {
  console.log(`Debug server running on port ${port}`);
  
  try {
    // Create test user
    await createTestUser();
    
    // Create JWT token
    const token = createTestToken(TEST_USER_ID, 'ugc_creator');
    
    // Prepare FormData exactly like frontend
    const formData = new FormData();
    formData.append('fullName', 'Test User');
    formData.append('email', 'debug@example.com');
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
    formData.append('sampleContent', JSON.stringify(['https://example.com/sample1']));
    formData.append('niche', JSON.stringify(['Beauty', 'Fashion']));
    formData.append('contentStyle', JSON.stringify(['Product Demo', 'Tutorial']));
    formData.append('languages', JSON.stringify(['English', 'Urdu']));
    
    console.log('Testing multer parsing...');
    
    // Test the debug endpoint
    const response = await axios.post(`http://localhost:${port}/debug-multer`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ SUCCESS: Multer parsed the form data!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR: Multer test failed');
    console.log('Error:', error.message);
    console.log('Response:', error.response?.data);
  } finally {
    await cleanupTestUser();
    process.exit(0);
  }
});