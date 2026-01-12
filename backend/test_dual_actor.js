const { fetchInstagramUserData } = require('./services/instagramService');

async function testDualActorIntegration() {
  console.log('=== TESTING DUAL ACTOR INSTAGRAM INTEGRATION ===');
  
  try {
    // Test with a known Instagram username
    const testUsername = 'cristiano'; // Popular account for testing
    console.log(`Testing with username: ${testUsername}`);
    
    const result = await fetchInstagramUserData(testUsername, 5); // Limit to 5 posts for testing
    
    console.log('\n=== DUAL ACTOR RESULTS ===');
    console.log('Profile Data:');
    console.log(`- Username: ${result.username}`);
    console.log(`- Full Name: ${result.fullName}`);
    console.log(`- Followers: ${result.followers?.toLocaleString()}`);
    console.log(`- Posts Count: ${result.postsCount}`);
    console.log(`- Reels Count: ${result.reelsCount || 'N/A'}`);
    console.log(`- Is Verified: ${result.isVerified}`);
    
    console.log('\nContent Data:');
    console.log(`- Posts Array Length: ${result.posts?.length || 0}`);
    console.log(`- Reels Array Length: ${result.reels?.length || 0}`);
    
    console.log('\nMetadata:');
    console.log(`- Scraped At: ${result.scrapedAt}`);
    console.log(`- Actor IDs: ${JSON.stringify(result.actorIds)}`);
    
    if (result.posts?.length > 0) {
      console.log('\nSample Post:');
      const samplePost = result.posts[0];
      console.log(`- ID: ${samplePost.id}`);
      console.log(`- Type: ${samplePost.type}`);
      console.log(`- Likes: ${samplePost.likesCount}`);
      console.log(`- Comments: ${samplePost.commentsCount}`);
    }
    
    if (result.reels?.length > 0) {
      console.log('\nSample Reel:');
      const sampleReel = result.reels[0];
      console.log(`- ID: ${sampleReel.id}`);
      console.log(`- Type: ${sampleReel.type}`);
      console.log(`- Likes: ${sampleReel.likesCount}`);
      console.log(`- Comments: ${sampleReel.commentsCount}`);
      console.log(`- Duration: ${sampleReel.videoDuration || 'N/A'}s`);
    }
    
    console.log('\n✅ DUAL ACTOR INTEGRATION TEST COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('\n❌ DUAL ACTOR INTEGRATION TEST FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDualActorIntegration();