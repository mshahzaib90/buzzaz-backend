// Run this in the browser console on the UGC Dashboard page
// to debug YouTube connection authentication issues

console.log('🔍 YouTube Connection Authentication Debug');
console.log('==========================================');

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
        
        // Test YouTube connection API call
        console.log('\n2. Testing YouTube Connection API:');
        const testChannelUrl = '@MrBeast';
        
        fetch(`http://localhost:5000/api/ugc/${parsedUser.uid}/youtube/connect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channelUrl: testChannelUrl
            })
        })
        .then(response => {
            console.log('   YouTube API Response Status:', response.status);
            console.log('   YouTube API Response OK:', response.ok);
            return response.json();
        })
        .then(data => {
            console.log('   YouTube API Response Data:', data);
            if (data.success) {
                console.log('   ✅ YouTube connection successful!');
                console.log('   Channel:', data.channelData?.title);
                console.log('   Subscribers:', data.channelData?.subscriberCount);
            } else {
                console.log('   ❌ YouTube connection failed:', data.message);
            }
        })
        .catch(error => {
            console.log('   ❌ YouTube API Error:', error);
        });
        
    } catch (e) {
        console.log('   User data parse error:', e.message);
    }
} else {
    console.log('   ❌ No authentication data found');
    console.log('   Please log in to the application first');
}

console.log('\n3. Authentication Troubleshooting:');
console.log('   - If no token: User needs to log in');
console.log('   - If token exists but API fails: Token might be expired');
console.log('   - If 401 error: Authentication issue');
console.log('   - If 403 error: YouTube API quota/permissions issue');
console.log('   - If 500 error: Backend server issue');

console.log('\n4. Next Steps:');
console.log('   1. Make sure you are logged in to the dashboard');
console.log('   2. Check the Network tab for detailed error information');
console.log('   3. Try refreshing the page and logging in again');