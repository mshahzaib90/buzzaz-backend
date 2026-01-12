// Frontend Authentication Debug Script
// Run this in the browser console to check authentication state

console.log('🔍 Frontend Authentication Debug');
console.log('================================');

// Check localStorage for auth data
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('1. LocalStorage Auth Data:');
console.log('   Token exists:', !!token);
console.log('   Token length:', token ? token.length : 0);
console.log('   Token preview:', token ? token.substring(0, 50) + '...' : 'null');
console.log('   User exists:', !!user);

if (user) {
    try {
        const parsedUser = JSON.parse(user);
        console.log('   User data:', {
            uid: parsedUser.uid,
            email: parsedUser.email,
            role: parsedUser.role,
            displayName: parsedUser.displayName
        });
    } catch (e) {
        console.log('   User data parse error:', e.message);
    }
}

// Test API call manually
console.log('\n2. Testing API Call:');
if (token) {
    fetch('http://localhost:5000/api/chat/conversations', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('   API Response Status:', response.status);
        console.log('   API Response OK:', response.ok);
        return response.json();
    })
    .then(data => {
        console.log('   API Response Data:', data);
    })
    .catch(error => {
        console.log('   API Error:', error);
    });
} else {
    console.log('   No token available for API test');
}

// Check if user is logged in according to AuthContext
console.log('\n3. Authentication State:');
console.log('   Check the React DevTools for AuthContext state');
console.log('   Look for isAuthenticated, user, and token values');

console.log('\n4. Troubleshooting Steps:');
console.log('   - If no token: User needs to log in');
console.log('   - If token exists but API fails: Token might be expired');
console.log('   - If 401 error: Authentication issue');
console.log('   - If 403 error: Authorization/role issue');
console.log('   - If 500 error: Backend server issue');