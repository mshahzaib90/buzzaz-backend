const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramProfileData, saveInstagramReelData } = require('./services/firebaseService');

async function testRefreshEndpoint() {
  const userId = 'sx8gqxfSNZQvlHXq7BQI';
  const username = 'kainat_tahirr';
  
  console.log('=== TESTING REFRESH ENDPOINT FUNCTIONALITY ===');
  console.log(`User ID: ${userId}`);
  console.log(`Instagram Username: @${username}`);
  
  try {
    // Step 1: Scrape Instagram data using the complete dual-actor approach
    console.log('\n1. Scraping Instagram data with dual actors...');
    const instagramData = await scrapeInstagramComplete(`@${username}`);
    
    console.log(`Scraping result: ${instagramData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Profile data: ${instagramData.profile ? 'Available' : 'Not available'}`);
    console.log(`Reels data: ${instagramData.reels ? instagramData.reels.length + ' reels' : 'Not available'}`);
    
    if (instagramData.errors && instagramData.errors.length > 0) {
      console.log('Errors:', instagramData.errors);
    }
    
    if (!instagramData.success) {
      console.error('❌ Scraping failed, cannot proceed with refresh');
      return;
    }
    
    // Step 2: Save profile data if available
    if (instagramData.profile) {
      console.log('\n2. Saving profile data to Firebase...');
      await saveInstagramProfileData(userId, instagramData.profile);
      console.log('✅ Profile data saved successfully');
    }
    
    // Step 3: Save reels data if available
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log('\n3. Saving reels data to Firebase...');
      await saveInstagramReelData(userId, instagramData.reels);
      console.log(`✅ Reels data saved successfully (${instagramData.reels.length} reels)`);
      
      // Show sample reel data
      const firstReel = instagramData.reels[0];
      console.log('\nSample reel data:');
      console.log(`- Caption: ${firstReel.caption ? firstReel.caption.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`- Likes: ${firstReel.likesCount || 0}`);
      console.log(`- Comments: ${firstReel.commentsCount || 0}`);
      console.log(`- Video URL: ${firstReel.videoUrl ? 'Available' : 'N/A'}`);
      console.log(`- Display URL: ${firstReel.displayUrl ? 'Available' : 'N/A'}`);
    } else {
      console.log('\n3. No reels data to save');
    }
    
    // Step 4: Calculate and display analytics
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log('\n4. Analytics summary:');
      const totalLikes = instagramData.reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
      const totalComments = instagramData.reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
      const avgLikes = Math.round(totalLikes / instagramData.reels.length);
      const avgComments = Math.round(totalComments / instagramData.reels.length);
      
      console.log(`- Total likes: ${totalLikes.toLocaleString()}`);
      console.log(`- Total comments: ${totalComments.toLocaleString()}`);
      console.log(`- Average likes per reel: ${avgLikes.toLocaleString()}`);
      console.log(`- Average comments per reel: ${avgComments.toLocaleString()}`);
      
      if (instagramData.profile && instagramData.profile.followers) {
        const engagementRate = ((totalLikes + totalComments) / (instagramData.reels.length * instagramData.profile.followers)) * 100;
        console.log(`- Engagement rate: ${engagementRate.toFixed(2)}%`);
      }
    }
    
    console.log('\n=== REFRESH TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('❌ Refresh test failed:', error.message);
    console.error(error.stack);
  }
}

testRefreshEndpoint();