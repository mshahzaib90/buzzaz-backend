const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAPIWithLogs() {
  try {
    console.log('=== TESTING API WITH SERVER LOGS ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    const apiUrl = `http://localhost:5000/api/influencer/${userId}/instagram/detailed`;
    
    // Generate JWT token with correct payload structure
    const JWT_SECRET = 'buzzaz_super_secret_jwt_key_2024_production_ready';
    const token = jwt.sign(
      { uid: userId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`Making API call to: ${apiUrl}`);
    console.log(`User ID: ${userId}`);
    console.log('Token generated successfully');
    
    // Add a delay to ensure server logs are captured
    console.log('\nMaking API request...');
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('\n✅ API Response received');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('From Database:', response.data.fromDatabase);
    
    const data = response.data;
    
    // Check what we actually received
    console.log('\n📊 Response Analysis:');
    console.log('Profile username:', data.profile?.username);
    console.log('Profile followers:', data.profile?.followers);
    console.log('Reels type:', typeof data.reels);
    console.log('Reels is array:', Array.isArray(data.reels));
    console.log('Reels length:', data.reels?.length || 0);
    console.log('Analytics total posts:', data.analytics?.totalPosts);
    console.log('Metadata total reels:', data.metadata?.totalReels);
    
    if (data.reels && data.reels.length > 0) {
      console.log('\n🎥 First reel data:');
      const firstReel = data.reels[0];
      console.log('ID:', firstReel.id);
      console.log('Likes:', firstReel.likesCount);
      console.log('Comments:', firstReel.commentsCount);
    } else {
      console.log('\n❌ No reels data in response');
    }
    
    // Log the full response structure for debugging
    console.log('\n🔍 Full Response Keys:', Object.keys(data));
    
    console.log('\n=== API TEST COMPLETED ===');
    console.log('Check the backend server logs for detailed processing information.');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('Backend server is not running or not accessible');
    }
  }
  
  process.exit(0);
}

testAPIWithLogs();