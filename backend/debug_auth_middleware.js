const jwt = require('jsonwebtoken');
const { admin } = require('./config/firebase');
require('dotenv').config();

async function debugAuthMiddleware() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJzeDhncXhmU05aUXZsSFhxN0JRSSIsImVtYWlsIjoibWRzaGFoemFpYkBnbWFpbC5jb20iLCJyb2xlIjoiaW5mbHVlbmNlciIsImlhdCI6MTc2MTY0MjAwOCwiZXhwIjoxNzYxNzI4NDA4fQ.k903kodcNmjgr7kNZgpO9zcsudWnmQlD1EA';
    const JWT_SECRET = process.env.JWT_SECRET;
    
    console.log('JWT_SECRET:', JWT_SECRET);
    console.log('Token length:', token.length);
    
    // Step 1: Verify JWT token
    console.log('\n--- Step 1: JWT Verification ---');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('JWT verification successful:', decoded);
      
      // Step 2: Check user in Firebase
      console.log('\n--- Step 2: Firebase User Check ---');
      const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
      
      if (!userDoc.exists) {
        console.log('User not found in Firebase users collection');
      } else {
        const userData = userDoc.data();
        console.log('User found in Firebase:', userData);
        
        const user = {
          uid: decoded.uid,
          ...userData
        };
        console.log('Final user object:', user);
      }
      
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      console.error('JWT error details:', jwtError);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugAuthMiddleware();