// Debug script to check frontend token and API call
console.log('🔍 Debugging Frontend Token and API Call...');

// Check localStorage token
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('📋 Token Status:');
console.log('Token exists:', !!token);
console.log('Token length:', token ? token.length : 0);
console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');

console.log('\n👤 User Status:');
console.log('User exists:', !!user);
if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('User data:', userData);
    console.log('User ID (uid):', userData.uid);
    console.log('User email:', userData.email);
    console.log('User role:', userData.role);
  } catch (e) {
    console.log('Error parsing user data:', e);
  }
}

// Test API call directly
if (token && user) {
  const userData = JSON.parse(user);
  const apiUrl = `http://localhost:5000/api/ugc/profile/${userData.uid}`;
  
  console.log('\n🌐 Testing API Call:');
  console.log('API URL:', apiUrl);
  
  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('✅ API Response Success:');
    console.log('Profile data:', data);
  })
  .catch(error => {
    console.log('❌ API Response Error:');
    console.log('Error:', error);
  });
} else {
  console.log('\n❌ Cannot test API - missing token or user data');
}