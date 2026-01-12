require('dotenv').config();
const jwt = require('jsonwebtoken');

const generateValidToken = () => {
  console.log('=== Generating Valid JWT Token ===');
  
  // User that has Instagram data
  const userId = 'sx8gqxfSNZQvlHXq7BQI';
  const email = 'muhammad.shahzaib@tamatos.com';
  const role = 'influencer';
  
  console.log('User ID:', userId);
  console.log('Email:', email);
  console.log('Role:', role);
  
  // Generate JWT token with proper payload structure
  const token = jwt.sign(
    { 
      uid: userId, 
      email: email, 
      role: role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('\n=== Generated Token ===');
  console.log('Token:', token);
  
  // Decode to verify
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('\n=== Token Payload ===');
  console.log('UID:', decoded.uid);
  console.log('Email:', decoded.email);
  console.log('Role:', decoded.role);
  console.log('Issued At:', new Date(decoded.iat * 1000));
  console.log('Expires At:', new Date(decoded.exp * 1000));
  
  console.log('\n=== Instructions ===');
  console.log('1. Copy the token above');
  console.log('2. Open browser console on the frontend');
  console.log('3. Run: localStorage.setItem("token", "' + token + '")');
  console.log('4. Run: localStorage.setItem("user", JSON.stringify({');
  console.log('     uid: "' + userId + '",');
  console.log('     email: "' + email + '",');
  console.log('     role: "' + role + '",');
  console.log('     instagramUsername: "laibybaby"');
  console.log('   }))');
  console.log('5. Refresh the page');
};

generateValidToken();