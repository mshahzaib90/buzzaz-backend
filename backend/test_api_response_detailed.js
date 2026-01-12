const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAPIResponse() {
  try {
    console.log('=== TESTING API RESPONSE STRUCTURE ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    const apiUrl = `http://localhost:5000/api/influencer/${userId}/instagram/detailed`;
    
    // Generate JWT token with correct payload structure
    const JWT_SECRET = 'buzzaz_super_secret_jwt_key_2024_production_ready';
    const token = jwt.sign(
      { uid: userId }, // Use 'uid' instead of 'userId'
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`Testing API: ${apiUrl}`);
    console.log(`User ID: ${userId}`);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ API Response Status:', response.status);
    console.log('✅ API Response Success:', response.data.success);
    console.log('✅ From Database:', response.data.fromDatabase);
    
    const data = response.data;
    
    // Profile section
    console.log('\n📊 PROFILE SECTION:');
    console.log('Username:', data.profile?.username);
    console.log('Full Name:', data.profile?.fullName);
    console.log('Followers:', data.profile?.followers);
    console.log('Following:', data.profile?.following);
    console.log('Posts Count:', data.profile?.postsCount);
    console.log('Is Verified:', data.profile?.isVerified);
    console.log('Avatar URL:', data.profile?.avatarUrl ? 'Present' : 'Not present');
    
    // Reels section
    console.log('\n🎬 REELS SECTION:');
    console.log('Reels Array Type:', typeof data.reels);
    console.log('Reels Array Length:', data.reels?.length || 0);
    console.log('Is Array:', Array.isArray(data.reels));
    
    if (data.reels && data.reels.length > 0) {
      console.log('\n🎥 FIRST REEL SAMPLE:');
      const firstReel = data.reels[0];
      console.log('Reel ID:', firstReel.id);
      console.log('Reel URL:', firstReel.url);
      console.log('Caption:', firstReel.caption?.substring(0, 50) + '...');
      console.log('Likes Count:', firstReel.likesCount);
      console.log('Comments Count:', firstReel.commentsCount);
      console.log('Taken At:', firstReel.takenAt);
    }
    
    // Analytics section
    console.log('\n📈 ANALYTICS SECTION:');
    console.log('Total Posts:', data.analytics?.totalPosts);
    console.log('Total Likes:', data.analytics?.totalLikes);
    console.log('Total Comments:', data.analytics?.totalComments);
    console.log('Average Likes:', data.analytics?.averageLikes);
    console.log('Average Comments:', data.analytics?.averageComments);
    console.log('Engagement Rate:', data.analytics?.engagementRate);
    
    // Metadata section
    console.log('\n🔍 METADATA SECTION:');
    console.log('Total Reels:', data.metadata?.totalReels);
    console.log('Last Updated:', data.metadata?.lastUpdated);
    console.log('Actor IDs:', data.metadata?.actorIds);
    
    // Posts section (should be empty)
    console.log('\n📝 POSTS SECTION:');
    console.log('Posts Object:', typeof data.posts);
    console.log('Posts.posts Length:', data.posts?.posts?.length || 0);
    console.log('Posts.reels Length:', data.posts?.reels?.length || 0);
    console.log('Posts.videos Length:', data.posts?.videos?.length || 0);
    
    console.log('\n=== FULL RESPONSE STRUCTURE ===');
    console.log('Response Keys:', Object.keys(data));
    
    console.log('\n🎉 API TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
  
  process.exit(0);
}

testAPIResponse();