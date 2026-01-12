const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramReelData } = require('./services/firebaseService');
const { admin, db } = require('./config/firebase');

async function testApifyLaibybabyReels() {
  console.log('=== TESTING APIFY REEL SCRAPER FOR LAIBYBABY ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  try {
    console.log(`1. Testing Apify scraper for @${username}...`);
    
    // Test the Apify scraper directly
    const instagramData = await scrapeInstagramComplete(`@${username}`);
    
    console.log(`\n📊 SCRAPING RESULTS:`);
    console.log(`- Success: ${instagramData.success}`);
    console.log(`- Profile Available: ${instagramData.profile ? 'Yes' : 'No'}`);
    console.log(`- Reels Available: ${instagramData.reels ? 'Yes' : 'No'}`);
    console.log(`- Reels Count: ${instagramData.reels ? instagramData.reels.length : 0}`);
    
    if (instagramData.errors && instagramData.errors.length > 0) {
      console.log(`- Errors: ${instagramData.errors.length}`);
      instagramData.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (instagramData.profile) {
      console.log(`\n👤 PROFILE DATA:`);
      console.log(`- Username: ${instagramData.profile.username}`);
      console.log(`- Full Name: ${instagramData.profile.fullName}`);
      console.log(`- Followers: ${instagramData.profile.followersCount?.toLocaleString() || 'N/A'}`);
      console.log(`- Following: ${instagramData.profile.followingCount?.toLocaleString() || 'N/A'}`);
      console.log(`- Posts: ${instagramData.profile.postsCount?.toLocaleString() || 'N/A'}`);
      console.log(`- Bio: ${instagramData.profile.biography ? instagramData.profile.biography.substring(0, 100) + '...' : 'No bio'}`);
    }
    
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log(`\n🎬 REELS DATA (Found ${instagramData.reels.length} reels):`);
      
      // Get recent 10 reels (or all if less than 10)
      const recentReels = instagramData.reels.slice(0, 10);
      console.log(`\n📱 RECENT ${recentReels.length} REELS:`);
      
      recentReels.forEach((reel, index) => {
        console.log(`\n${index + 1}. Reel ID: ${reel.id}`);
        console.log(`   - Short Code: ${reel.shortCode}`);
        console.log(`   - URL: https://www.instagram.com/reel/${reel.shortCode}/`);
        console.log(`   - Video URL: ${reel.videoUrl || 'Not available'}`);
        console.log(`   - Caption: ${reel.caption ? reel.caption.substring(0, 80) + '...' : 'No caption'}`);
        console.log(`   - Likes: ${reel.likesCount?.toLocaleString() || 0}`);
        console.log(`   - Comments: ${reel.commentsCount?.toLocaleString() || 0}`);
        console.log(`   - Views: ${reel.viewsCount?.toLocaleString() || 'N/A'}`);
        console.log(`   - Owner: ${reel.ownerUsername}`);
        console.log(`   - Timestamp: ${reel.timestamp ? new Date(reel.timestamp * 1000).toISOString() : 'N/A'}`);
      });
      
      // Calculate analytics for recent reels
      const totalLikes = recentReels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
      const totalComments = recentReels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
      const totalViews = recentReels.reduce((sum, reel) => sum + (reel.viewsCount || 0), 0);
      
      console.log(`\n📈 ANALYTICS FOR RECENT ${recentReels.length} REELS:`);
      console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
      console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
      console.log(`- Total Views: ${totalViews.toLocaleString()}`);
      console.log(`- Average Likes: ${Math.round(totalLikes / recentReels.length).toLocaleString()}`);
      console.log(`- Average Comments: ${Math.round(totalComments / recentReels.length).toLocaleString()}`);
      console.log(`- Average Views: ${totalViews > 0 ? Math.round(totalViews / recentReels.length).toLocaleString() : 'N/A'}`);
      
      // Save to Firebase
      console.log(`\n💾 SAVING TO FIREBASE...`);
      const saveResult = await saveInstagramReelData(userId, username, instagramData.reels);
      console.log(`Save result: ${saveResult ? 'SUCCESS' : 'FAILED'}`);
      
      if (saveResult) {
        // Verify the save
        console.log(`\n✅ VERIFYING SAVED DATA...`);
        const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
        const reelsDoc = await reelsRef.get();
        
        if (reelsDoc.exists) {
          const savedData = reelsDoc.data();
          console.log(`- Username: ${savedData.username}`);
          console.log(`- Total Reels Saved: ${savedData.totalReels}`);
          console.log(`- Reels Array Length: ${savedData.reels?.length || 0}`);
          console.log(`- Last Updated: ${savedData.lastUpdated}`);
          
          if (savedData.reels && savedData.reels.length > 0) {
            console.log(`\n🔗 RECENT 10 REEL URLS IN FIREBASE:`);
            const savedRecentReels = savedData.reels.slice(0, 10);
            savedRecentReels.forEach((reel, index) => {
              console.log(`${index + 1}. https://www.instagram.com/reel/${reel.shortCode}/`);
            });
            
            console.log(`\n✅ SUCCESS: ${savedRecentReels.length} recent reel URLs saved to Firebase!`);
          } else {
            console.log(`❌ No reels found in saved data`);
          }
        } else {
          console.log(`❌ Reels document not found after save`);
        }
      }
      
    } else {
      console.log(`\n❌ NO REELS FOUND`);
      console.log(`This could mean:`);
      console.log(`1. The account has no reels`);
      console.log(`2. The account is private`);
      console.log(`3. Apify scraper couldn't access the reels`);
      console.log(`4. Rate limiting or blocking by Instagram`);
    }
    
    console.log(`\n=== TEST COMPLETED ===`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testApifyLaibybabyReels();