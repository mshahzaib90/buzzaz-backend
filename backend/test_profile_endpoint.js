const jwt = require('jsonwebtoken');
const axios = require('axios');

// Test the new profile endpoint
async function testProfileEndpoint() {
    try {
        console.log('Testing the new /api/influencer/profile endpoint...\n');
        
        // Use the test user credentials
        const testUserEmail = 'test-youtube@example.com';
        const testUserId = 'kui7voXcFLJFlgHNFoPD';
        
        // Generate JWT token with correct secret
        const JWT_SECRET = 'buzzaz_super_secret_jwt_key_2024_production_ready';
        const token = jwt.sign(
            { uid: testUserId, email: testUserEmail },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('Generated token for test user:', testUserEmail);
        console.log('User ID:', testUserId);
        console.log('Token:', token.substring(0, 50) + '...\n');
        
        // Make API call to the new profile endpoint
        const response = await axios.get('http://localhost:5000/api/influencer/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ API call successful!');
        console.log('Status:', response.status);
        console.log('Response data:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if YouTube data is present
        if (response.data.youtubeChannelId) {
            console.log('\n✅ YouTube data found:');
            console.log('- Channel ID:', response.data.youtubeChannelId);
            console.log('- Channel Title:', response.data.youtubeChannelTitle);
            console.log('- Subscribers:', response.data.youtubeSubscribers);
            console.log('- Videos:', response.data.youtubeVideos);
        } else {
            console.log('\n❌ No YouTube data found in response');
        }
        
        // Check if Instagram data is present
        if (response.data.instagramUsername) {
            console.log('\n✅ Instagram data found:');
            console.log('- Username:', response.data.instagramUsername);
            console.log('- Followers:', response.data.instagramFollowers);
            console.log('- Posts:', response.data.instagramPosts);
        } else {
            console.log('\n❌ No Instagram data found in response');
        }
        
    } catch (error) {
        console.error('❌ Error testing profile endpoint:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testProfileEndpoint();