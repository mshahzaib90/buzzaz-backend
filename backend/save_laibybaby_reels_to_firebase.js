const { ApifyClient } = require('apify-client');
const { saveInstagramReelData } = require('./services/firebaseService');
const { admin, db } = require('./config/firebase');
require('dotenv').config();

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
  timeoutSecs: 60,
});

async function saveLaibybabyReelsToFirebase() {
  console.log('=== FETCHING AND SAVING LAIBYBABY REELS TO FIREBASE ===');
  
  const userId = 'sx8gqxfSNZQvlHXq7BQI'; // mdshahzaib@gmail.com
  const username = 'laibybaby';
  
  try {
    console.log(`1. Fetching reels for @${username} from Apify...`);
    
    // Prepare Actor input
    const input = {
      "username": [username],
      "resultsLimit": 20, // Get recent 20 reels
      "includeSharesCount": false
    };

    console.log('Starting Apify actor run...');
    const run = await client.actor("xMc5Ga1oCONPmWJIa").call(input);
    console.log(`✅ Actor run completed: ${run.id}`);
    
    // Fetch results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`✅ Found ${items ? items.length : 0} reels`);
    
    if (!items || items.length === 0) {
      console.log('❌ No reel data returned from Apify');
      return;
    }

    // Process and clean the reel data
    const processedReels = items.map(reel => {
      // Handle timestamp safely
      let timestamp = null;
      if (reel.timestamp) {
        try {
          // Check if timestamp is already a valid date string or needs conversion
          if (typeof reel.timestamp === 'string') {
            timestamp = reel.timestamp;
          } else if (typeof reel.timestamp === 'number') {
            // Convert Unix timestamp to ISO string
            timestamp = new Date(reel.timestamp * 1000).toISOString();
          }
        } catch (error) {
          console.warn(`Invalid timestamp for reel ${reel.id}:`, reel.timestamp);
          timestamp = new Date().toISOString(); // Use current time as fallback
        }
      }
      
      return {
        id: reel.id,
        shortCode: reel.shortCode,
        url: `https://www.instagram.com/reel/${reel.shortCode}/`,
        videoUrl: reel.videoUrl || null,
        caption: reel.caption || '',
        likesCount: reel.likesCount || 0,
        commentsCount: reel.commentsCount || 0,
        viewsCount: reel.viewsCount || 0,
        ownerUsername: reel.ownerUsername || username,
        timestamp: timestamp,
        type: 'reel',
        isReel: true,
        // Additional fields that might be available
        displayUrl: reel.displayUrl || null,
        dimensions: {
          width: reel.width || 0,
          height: reel.height || 0
        },
        hashtags: reel.hashtags || [],
        mentions: reel.mentions || [],
        location: reel.location || null
      };
    });

    console.log(`\n2. Processed ${processedReels.length} reels`);
    
    // Show first few reels
    console.log('\n📱 RECENT 10 REELS:');
    const recentReels = processedReels.slice(0, 10);
    recentReels.forEach((reel, index) => {
      console.log(`${index + 1}. https://www.instagram.com/reel/${reel.shortCode}/`);
      console.log(`   - Likes: ${reel.likesCount.toLocaleString()}, Comments: ${reel.commentsCount.toLocaleString()}`);
      console.log(`   - Caption: ${reel.caption ? reel.caption.substring(0, 60) + '...' : 'No caption'}`);
    });
    
    // Calculate analytics
    const totalLikes = processedReels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
    const totalComments = processedReels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
    
    console.log(`\n📊 ANALYTICS:`);
    console.log(`- Total Reels: ${processedReels.length}`);
    console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
    console.log(`- Average Likes: ${Math.round(totalLikes / processedReels.length).toLocaleString()}`);
    console.log(`- Average Comments: ${Math.round(totalComments / processedReels.length).toLocaleString()}`);
    
    // Save to Firebase
    console.log(`\n3. Saving to Firebase...`);
    const saveResult = await saveInstagramReelData(userId, username, processedReels);
    console.log(`Save result: ${saveResult ? 'SUCCESS' : 'FAILED'}`);
    
    if (saveResult) {
      // Verify the save
      console.log(`\n4. Verifying saved data...`);
      const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
      const reelsDoc = await reelsRef.get();
      
      if (reelsDoc.exists) {
        const savedData = reelsDoc.data();
        console.log(`✅ VERIFICATION SUCCESSFUL:`);
        console.log(`- Username: ${savedData.username}`);
        console.log(`- Total Reels Saved: ${savedData.totalReels}`);
        console.log(`- Reels Array Length: ${savedData.reels?.length || 0}`);
        console.log(`- Last Updated: ${savedData.lastUpdated}`);
        
        if (savedData.reels && savedData.reels.length > 0) {
          console.log(`\n🔗 RECENT 10 REEL URLS SAVED IN FIREBASE:`);
          const savedRecentReels = savedData.reels.slice(0, 10);
          savedRecentReels.forEach((reel, index) => {
            console.log(`${index + 1}. https://www.instagram.com/reel/${reel.shortCode}/`);
          });
          
          console.log(`\n✅ SUCCESS: ${savedData.reels.length} reel URLs saved to Firebase for ${username}!`);
          console.log(`📍 Firebase Path: users/${userId}/instagram/reels`);
          
          // Show engagement stats for saved reels
          const savedTotalLikes = savedData.reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
          const savedTotalComments = savedData.reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
          
          console.log(`\n📈 SAVED DATA ANALYTICS:`);
          console.log(`- Total Likes: ${savedTotalLikes.toLocaleString()}`);
          console.log(`- Total Comments: ${savedTotalComments.toLocaleString()}`);
          console.log(`- Average Engagement: ${Math.round((savedTotalLikes + savedTotalComments) / savedData.reels.length).toLocaleString()}`);
          
        } else {
          console.log(`❌ No reels found in saved data`);
        }
      } else {
        console.log(`❌ Reels document not found after save`);
      }
    } else {
      console.log(`❌ Failed to save reels to Firebase`);
    }
    
    console.log(`\n=== PROCESS COMPLETED ===`);
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    console.error('Error details:', error);
  }
}

saveLaibybabyReelsToFirebase();