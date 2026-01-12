require('dotenv').config();
const { fetchInstagramUserData } = require('./services/instagramService');
const { scrapeInstagramProfile, scrapeInstagramComplete } = require('./services/apifyService');

async function testInstagramScrapers() {
  try {
    console.log('=== Testing Instagram Scrapers ===\n');
    
    const testUsername = 'laibybaby';
    
    // Test 1: Instagram Service (Reel Scraper)
    console.log('🧪 Test 1: Instagram Service (Reel Scraper)');
    try {
      const reelData = await fetchInstagramUserData(testUsername, 5);
      console.log('✅ Reel scraper success:');
      console.log(`   Username: ${reelData.username}`);
      console.log(`   Success: ${reelData.success}`);
      console.log(`   Total Reels: ${reelData.totalReels}`);
      console.log(`   Reels Array Length: ${reelData.reels?.length}`);
      
      if (reelData.reels && reelData.reels.length > 0) {
        console.log('\n   📹 Sample Reel:');
        const firstReel = reelData.reels[0];
        console.log(`      Keys: ${Object.keys(firstReel).join(', ')}`);
        console.log(`      ID: ${firstReel.id || 'N/A'}`);
        console.log(`      Short Code: ${firstReel.shortcode || 'N/A'}`);
        console.log(`      Likes: ${firstReel.likesCount || 'N/A'}`);
        console.log(`      Comments: ${firstReel.commentsCount || 'N/A'}`);
      }
    } catch (error) {
      console.log('❌ Reel scraper failed:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Apify Service Profile Scraper
    console.log('🧪 Test 2: Apify Service (Profile Scraper)');
    try {
      const profileData = await scrapeInstagramProfile(testUsername);
      console.log('✅ Profile scraper success:');
      console.log(`   Username: ${profileData.username}`);
      console.log(`   Full Name: ${profileData.fullName}`);
      console.log(`   Followers: ${profileData.followers}`);
      console.log(`   Following: ${profileData.following}`);
      console.log(`   Posts: ${profileData.postsCount}`);
      console.log(`   Verified: ${profileData.isVerified}`);
    } catch (error) {
      console.log('❌ Profile scraper failed:');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Complete Instagram Scraper
    console.log('🧪 Test 3: Complete Instagram Scraper');
    try {
      const completeData = await scrapeInstagramComplete(testUsername);
      console.log('✅ Complete scraper result:');
      console.log(`   Username: ${completeData.username}`);
      console.log(`   Success: ${completeData.success}`);
      console.log(`   Has Profile: ${!!completeData.profile}`);
      console.log(`   Reels Count: ${completeData.reels?.length || 0}`);
      console.log(`   Errors: ${completeData.errors?.length || 0}`);
      
      if (completeData.errors && completeData.errors.length > 0) {
        console.log('\n   ⚠️ Errors:');
        completeData.errors.forEach((error, index) => {
          console.log(`      ${index + 1}. ${error}`);
        });
      }
      
      if (completeData.profile) {
        console.log('\n   📊 Profile Data:');
        console.log(`      Full Name: ${completeData.profile.fullName}`);
        console.log(`      Followers: ${completeData.profile.followers}`);
        console.log(`      Following: ${completeData.profile.following}`);
        console.log(`      Posts: ${completeData.profile.postsCount}`);
        console.log(`      Verified: ${completeData.profile.isVerified}`);
      }
      
      if (completeData.reels && completeData.reels.length > 0) {
        console.log('\n   🎬 Reels Data:');
        console.log(`      Total Reels: ${completeData.reels.length}`);
        const firstReel = completeData.reels[0];
        console.log(`      Sample Reel Keys: ${Object.keys(firstReel).join(', ')}`);
      }
      
    } catch (error) {
      console.log('❌ Complete scraper failed:');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testInstagramScrapers();