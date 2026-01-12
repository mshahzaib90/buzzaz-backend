const { admin, db } = require('./config/firebase');
const axios = require('axios');

async function testWithRealAuth() {
  try {
    console.log('Creating a test token for authentication...');
    
    // Create a custom token for testing
    const testUid = 'test-youtube-user';
    const customToken = await admin.auth().createCustomToken(testUid);
    
    console.log('Custom token created successfully');
    
    // Test the YouTube connection endpoint
    console.log('Testing YouTube connection endpoint...');
    
    const response = await axios.post(`http://localhost:5000/api/ugc/${testUid}/youtube/connect`, {
      channelQuery: 'https://www.youtube.com/watch?v=LQ5yl3LZi0Y&list=RDLQGyl3LZi0Y&start_radio=1'
    }, {
      headers: {
        'Authorization': `Bearer ${customToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Response:', response.data);
    
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error data:', error.response?.data);
    
    if (error.response?.status === 404) {
      console.log('❌ Route still not found - there may be a server configuration issue');
    } else if (error.response?.status === 401) {
      console.log('🔐 Authentication issue - but route exists');
    } else if (error.response?.status === 403) {
      console.log('🚫 Authorization issue - but route exists');
    } else {
      console.log('🤔 Other error - route likely exists but there\'s a different issue');
    }
  }
}

// Also test if the route pattern is correct
async function testRoutePattern() {
  try {
    console.log('\nTesting route pattern with different URLs...');
    
    const testUrls = [
      'http://localhost:5000/api/ugc/test-user/youtube/connect',
      'http://localhost:5000/api/ugc/test-user/youtube/refresh',
      'http://localhost:5000/api/ugc/browse'
    ];
    
    for (const url of testUrls) {
      try {
        const response = await axios.get(url, {
          headers: { 'Authorization': 'Bearer test' }
        });
        console.log(`✅ ${url} - exists`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${url} - not found`);
        } else {
          console.log(`✅ ${url} - exists (got ${error.response?.status})`);
        }
      }
    }
  } catch (error) {
    console.log('Error testing route patterns:', error.message);
  }
}

async function runTests() {
  await testRoutePattern();
  await testWithRealAuth();
}

runTests();