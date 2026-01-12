const axios = require('axios');

// Test the YouTube connection with a valid user ID
async function testYouTubeConnection() {
  try {
    console.log('Testing YouTube connection with fixed user ID...');
    
    // First, let's test with a known user ID
    // You'll need to replace this with an actual user ID from your system
    const testUserId = 'test-user-id'; // This should be a real user ID
    
    const response = await axios.post(`http://localhost:5000/api/ugc/${testUserId}/youtube/connect`, {
      channelQuery: 'https://www.youtube.com/watch?v=LQ5yl3LZi0Y&list=RDLQGyl3LZi0Y&start_radio=1'
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth, but we can see if the route exists
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('✅ Route exists! (Got 401 Unauthorized as expected)');
    } else if (error.response?.status === 404) {
      console.log('❌ Route not found - there\'s still an issue');
    } else {
      console.log('🤔 Unexpected error:', error.response?.data);
    }
  }
}

// Test with undefined user ID to see what happens
async function testWithUndefinedUserId() {
  try {
    console.log('\nTesting with undefined user ID (simulating the original bug)...');
    
    const response = await axios.post(`http://localhost:5000/api/ugc/undefined/youtube/connect`, {
      channelQuery: 'https://www.youtube.com/watch?v=test'
    }, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 404 && error.response?.data?.message === 'Route not found') {
      console.log('✅ Confirmed: undefined user ID causes "Route not found" error');
    }
  }
}

async function runTests() {
  await testYouTubeConnection();
  await testWithUndefinedUserId();
}

runTests();