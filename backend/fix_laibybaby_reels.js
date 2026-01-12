const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramReelData } = require('./services/firebaseService');
const { admin, db } = require('./config/firebase');

async function fixLaibybabyReels() {
  console.log('=== FIXING LAIBYBABY REEL DATA ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  try {
    // Step 1: Scrape fresh Instagram data for laibybaby
    console.log('1. Scraping fresh Instagram data for laibybaby...');
    const instagramData = await scrapeInstagramComplete(`@${username}`);
    
    console.log(`Scraping result: ${instagramData.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Profile data: ${instagramData.profile ? 'Available' : 'Not available'}`);
    console.log(`Reels data: ${instagramData.reels ? instagramData.reels.length + ' reels' : 'Not available'}`);
    
    if (instagramData.errors && instagramData.errors.length > 0) {
      console.log('Errors:', instagramData.errors);
    }
    
    if (!instagramData.success) {
      console.error('❌ Scraping failed, cannot proceed');
      return;
    }
    
    // Step 2: Check what we got
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log(`\n2. Found ${instagramData.reels.length} reels for ${username}`);
      
      // Show sample reel data
      const firstReel = instagramData.reels[0];
      console.log('Sample reel data:');
      console.log(`- ID: ${firstReel.id}`);
      console.log(`- Short Code: ${firstReel.shortCode}`);
      console.log(`- Caption: ${firstReel.caption ? firstReel.caption.substring(0, 100) + '...' : 'No caption'}`);
      console.log(`- Likes: ${firstReel.likesCount || 0}`);
      console.log(`- Comments: ${firstReel.commentsCount || 0}`);
      console.log(`- Owner Username: ${firstReel.ownerUsername}`);
      console.log(`- Video URL: ${firstReel.videoUrl ? 'Available' : 'Not available'}`);
      
      // Step 3: Save the correct reel data
      console.log('\n3. Saving reel data with correct username...');
      const saveResult = await saveInstagramReelData(userId, username, instagramData.reels);
      console.log('✅ Reel save result:', saveResult);
      
      // Step 4: Verify the save
      console.log('\n4. Verifying the saved data...');
      const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
      const reelsDoc = await reelsRef.get();
      
      if (reelsDoc.exists) {
        const savedReels = reelsDoc.data();
        console.log('✅ Verification successful!');
        console.log(`- Username: ${savedReels.username}`);
        console.log(`- Total Reels: ${savedReels.totalReels}`);
        console.log(`- Reels Array Length: ${savedReels.reels?.length || 0}`);
        console.log(`- Last Updated: ${savedReels.lastUpdated}`);
        
        if (savedReels.username === username) {
          console.log('✅ Username is now correct!');
          
          if (savedReels.reels && savedReels.reels.length > 0) {
            console.log(`✅ Reel data successfully saved: ${savedReels.reels.length} reels`);
            
            // Calculate analytics
            const totalLikes = savedReels.reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
            const totalComments = savedReels.reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
            
            console.log(`\n📊 ANALYTICS:`);
            console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
            console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
            console.log(`- Average Likes: ${Math.round(totalLikes / savedReels.reels.length).toLocaleString()}`);
            console.log(`- Average Comments: ${Math.round(totalComments / savedReels.reels.length).toLocaleString()}`);
          } else {
            console.log('❌ Reels array is still empty');
          }
        } else {
          console.log(`❌ Username still incorrect: ${savedReels.username}`);
        }
      } else {
        console.log('❌ Reels document not found after save');
      }
      
    } else {
      console.log('\n2. No reels data found in scraping result');
      
      // Still try to fix the username in the existing document
      console.log('3. Fixing username in existing reels document...');
      const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
      await reelsRef.update({
        username: username,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Username updated in existing document');
    }
    
    console.log('\n=== FIX COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Error details:', error);
  }
}

fixLaibybabyReels();