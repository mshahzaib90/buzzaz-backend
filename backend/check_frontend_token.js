require('dotenv').config();
const jwt = require('jsonwebtoken');
const { admin } = require('./config/firebase');

async function checkFrontendToken() {
  try {
    console.log('🔍 Checking frontend authentication token...');
    
    // Check if JWT_SECRET is set
    console.log('\n1. Environment check:');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    
    // Get all users to see what tokens should look like
    console.log('\n2. Getting users from Firebase:');
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firebase');
      return;
    }
    
    const firstUser = usersSnapshot.docs[0];
    const userData = firstUser.data();
    console.log('✅ Sample user found:');
    console.log('  - UID:', firstUser.id);
    console.log('  - Email:', userData.email);
    console.log('  - Role:', userData.role);
    
    // Create a valid token for this user
    console.log('\n3. Creating valid token:');
    const tokenPayload = {
      uid: firstUser.id,
      email: userData.email,
      role: userData.role
    };
    
    const validToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Valid token created (first 50 chars):', validToken.substring(0, 50) + '...');
    
    // Test token verification
    console.log('\n4. Testing token verification:');
    try {
      const decoded = jwt.verify(validToken, process.env.JWT_SECRET);
      console.log('✅ Token verification successful');
      console.log('  - Decoded UID:', decoded.uid);
      console.log('  - Decoded email:', decoded.email);
      console.log('  - Decoded role:', decoded.role);
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
    }
    
    // Test the Instagram endpoint with this valid token
    console.log('\n5. Testing Instagram endpoint with valid token:');
    const axios = require('axios');
    
    try {
      const response = await axios.get(`http://localhost:5000/api/influencer/${firstUser.id}/instagram/detailed`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      });
      console.log('✅ Instagram endpoint success:', response.status);
      console.log('  - Response keys:', Object.keys(response.data));
    } catch (endpointError) {
      console.log('❌ Instagram endpoint error:', endpointError.response?.status, endpointError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
  
  process.exit(0);
}

checkFrontendToken();