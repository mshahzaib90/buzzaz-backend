const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramReelData, saveInstagramProfileData } = require('./services/firebaseService');

async function testRefreshDirect() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI'; // User with Instagram @kainat_tahirr
    const username = 'kainat_tahirr';
    
    console.log('=== TESTING DIRECT INSTAGRAM REFRESH ===');
    console.log('User ID:', userId);
    console.log('Instagram username:', username);
    
    console.log('\n1. Fetching Instagram data from Apify actors...');
    const instagramData = await scrapeInstagramComplete(username);
    
    console.log('\n2. Instagram data received:');
    console.log('Success:', instagramData.success);
    console.log('Profile data available:', !!instagramData.profile);
    console.log('Reels count:', instagramData.reels?.length || 0);
    console.log('Errors:', instagramData.errors);
    
    if (instagramData.profile) {
      console.log('\n3. Profile data preview:');
      console.log('- Full name:', instagramData.profile.fullName);
      console.log('- Bio:', instagramData.profile.bio?.substring(0, 100) + '...');
      console.log('- Followers:', instagramData.profile.followers);
      console.log('- Following:', instagramData.profile.following);
      console.log('- Posts count:', instagramData.profile.postsCount);
      console.log('- Verified:', instagramData.profile.isVerified);
      console.log('- Business account:', instagramData.profile.isBusinessAccount);
    }
    
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log('\n4. Reels data preview (first 3):');
      instagramData.reels.slice(0, 3).forEach((reel, index) => {
        console.log(`   Reel ${index + 1}:`);
        console.log(`   - Caption: ${reel.caption?.substring(0, 50) || 'No caption'}...`);
        console.log(`   - Likes: ${reel.likesCount || 0}`);
        console.log(`   - Comments: ${reel.commentsCount || 0}`);
        console.log(`   - Timestamp: ${reel.timestamp}`);
        console.log(`   - Video URL: ${reel.videoUrl ? 'Available' : 'Not available'}`);
      });
    }
    
    console.log('\n5. Saving data to Firebase...');
    
    // Save reel data
    const recentReels = instagramData.reels ? instagramData.reels.slice(0, 10) : [];
    await saveInstagramReelData(userId, username, recentReels);
    console.log('✅ Reel data saved to Firebase');
    
    // Save profile data if available
    if (instagramData.profile) {
      await saveInstagramProfileData(userId, instagramData.profile);
      console.log('✅ Profile data saved to Firebase');
    }
    
    console.log('\n=== REFRESH TEST COMPLETED SUCCESSFULLY ===');
    console.log(`Saved ${recentReels.length} reels and ${instagramData.profile ? '1' : '0'} profile to Firebase`);
    
  } catch (error) {
    console.error('\n❌ REFRESH TEST FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRefreshDirect();