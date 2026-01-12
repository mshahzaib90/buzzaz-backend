// Debug script to check current authentication state
const fs = require('fs');
const path = require('path');

console.log('=== Current Authentication State Debug ===');

// Since we can't access localStorage from Node.js, let's create a browser script
const browserScript = `
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
            displayName: parsedUser.displayName,
            instagramUsername: parsedUser.instagramUsername
        });
    } catch (e) {
        console.log('   User data parse error:', e.message);
    }
}

// Test the Instagram API call that's failing
console.log('\\n2. Testing Instagram API Call:');
if (token && user) {
    try {
        const parsedUser = JSON.parse(user);
        const apiUrl = \`http://localhost:5000/api/influencer/\${parsedUser.uid}/instagram/detailed\`;
        
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': \`Bearer \${token}\`,
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
            if (data.profile) {
                console.log('   Profile found:', data.profile.username);
                console.log('   Reels count:', data.reels ? data.reels.length : 0);
            }
        })
        .catch(error => {
            console.log('   API Error:', error);
        });
    } catch (e) {
        console.log('   Error parsing user data:', e.message);
    }
} else {
    console.log('   No token or user available for API test');
}

console.log('\\n3. Authentication State:');
console.log('   Check the React DevTools for AuthContext state');
console.log('   Look for isAuthenticated, user, and token values');
`;

console.log('Browser script created. Copy and paste the following into your browser console:');
console.log('================================================================================');
console.log(browserScript);
console.log('================================================================================');

// Also save it to a file for easy access
fs.writeFileSync(path.join(__dirname, 'browser_auth_debug.js'), browserScript);
console.log('\\nScript also saved to browser_auth_debug.js');