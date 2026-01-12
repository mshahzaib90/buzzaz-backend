const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log('Using JWT_SECRET:', JWT_SECRET);

const payload = {
  uid: 'sx8gqxfSNZQvlHXq7BQI',
  email: 'mdshahzaib@gmail.com',
  role: 'influencer'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
console.log('Generated token length:', token.length);
console.log('Generated token (part 1):', token.substring(0, 100));
console.log('Generated token (part 2):', token.substring(100, 200));
console.log('Generated token (part 3):', token.substring(200));

// Verify the token works
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Token verification successful:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}