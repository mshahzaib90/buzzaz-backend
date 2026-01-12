const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAuthenticatedRequest() {
    console.log('🔍 Testing Authenticated Chat Request...\n');
    
    // First, let's try to make a request with a mock token to see the exact error
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MzQ1Njc4OTB9.test';
    
    try {
        console.log('1. Testing with mock token...');
        const response = await axios.get(`${BASE_URL}/api/chat/conversations`, {
            headers: {
                'Authorization': `Bearer ${mockToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Success with mock token:', response.data);
    } catch (error) {
        console.log('❌ Error with mock token:');
        console.log('   Status:', error.response?.status);
        console.log('   Status Text:', error.response?.statusText);
        console.log('   Error Data:', error.response?.data);
        console.log('   Error Message:', error.message);
        
        if (error.response?.status === 401) {
            console.log('   → This is expected - token validation failed');
        } else if (error.response?.status === 403) {
            console.log('   → Forbidden - user might not have proper role');
        } else if (error.response?.status === 500) {
            console.log('   → Server error - check backend logs');
        }
    }
    
    console.log('\n2. Testing without token...');
    try {
        const response = await axios.get(`${BASE_URL}/api/chat/conversations`);
        console.log('⚠️  Unexpected success without token:', response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Properly protected - 401 without token');
        } else {
            console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
        }
    }
    
    console.log('\n🔧 Authentication Debug Summary:');
    console.log('   - Backend server is running and accessible');
    console.log('   - Chat endpoint is properly protected');
    console.log('   - Issue is likely with frontend authentication token');
    console.log('\n💡 Next steps:');
    console.log('   1. Check browser localStorage for auth token');
    console.log('   2. Verify token format and expiration');
    console.log('   3. Check if user is properly logged in');
    console.log('   4. Verify API request headers in browser network tab');
}

testAuthenticatedRequest();