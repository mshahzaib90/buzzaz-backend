const { ApifyClient } = require('apify-client');
require('dotenv').config();

// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
  timeoutSecs: 60, // Increased timeout for better reliability
});

async function testDirectApifyReels() {
  console.log('=== TESTING DIRECT APIFY REEL SCRAPER FOR LAIBYBABY ===');
  
  const username = 'laibybaby';
  
  try {
    console.log(`1. Testing direct Apify call for @${username}...`);
    console.log(`Using APIFY_TOKEN: ${process.env.APIFY_TOKEN ? 'SET' : 'NOT SET'}`);
    
    // Prepare Actor input following the working example
    const input = {
      "username": [username],
      "resultsLimit": 20, // Get more reels to ensure we have data
      "includeSharesCount": false
    };

    console.log('Input:', JSON.stringify(input, null, 2));
    
    // Run the Actor and wait for it to finish using the working Actor ID
    console.log('Starting Apify actor run...');
    const run = await client.actor("xMc5Ga1oCONPmWJIa").call(input);
    console.log(`Actor run completed successfully!`);
    console.log(`- Run ID: ${run.id}`);
    console.log(`- Status: ${run.status}`);
    console.log(`- Started At: ${run.startedAt}`);
    console.log(`- Finished At: ${run.finishedAt}`);
    
    // Fetch Actor results from the run's dataset
    console.log('\n2. Fetching results from dataset...');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Dataset items fetched: ${items ? items.length : 0}`);
    
    if (!items || items.length === 0) {
      console.log('❌ No reel data returned from Apify');
      console.log('This could mean:');
      console.log('1. The username does not exist');
      console.log('2. The account is private');
      console.log('3. The account has no reels');
      console.log('4. Instagram is blocking the scraper');
      return;
    }

    console.log(`\n✅ SUCCESS: Found ${items.length} reels for ${username}!`);
    
    // Show detailed information about the first few reels
    console.log('\n📱 REEL DETAILS:');
    const reelsToShow = Math.min(5, items.length);
    
    for (let i = 0; i < reelsToShow; i++) {
      const reel = items[i];
      console.log(`\n${i + 1}. Reel ${i + 1}:`);
      console.log(`   - ID: ${reel.id}`);
      console.log(`   - Short Code: ${reel.shortCode}`);
      console.log(`   - URL: https://www.instagram.com/reel/${reel.shortCode}/`);
      console.log(`   - Video URL: ${reel.videoUrl ? 'Available' : 'Not available'}`);
      console.log(`   - Caption: ${reel.caption ? reel.caption.substring(0, 100) + '...' : 'No caption'}`);
      console.log(`   - Likes: ${reel.likesCount?.toLocaleString() || 0}`);
      console.log(`   - Comments: ${reel.commentsCount?.toLocaleString() || 0}`);
      console.log(`   - Views: ${reel.viewsCount?.toLocaleString() || 'N/A'}`);
      console.log(`   - Owner: ${reel.ownerUsername}`);
      console.log(`   - Timestamp: ${reel.timestamp ? new Date(reel.timestamp * 1000).toISOString() : 'N/A'}`);
      console.log(`   - Type: ${reel.type || 'reel'}`);
    }
    
    // Show all reel URLs
    console.log(`\n🔗 ALL ${items.length} REEL URLS:`);
    items.forEach((reel, index) => {
      console.log(`${index + 1}. https://www.instagram.com/reel/${reel.shortCode}/`);
    });
    
    // Calculate analytics
    const totalLikes = items.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
    const totalComments = items.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
    const totalViews = items.reduce((sum, reel) => sum + (reel.viewsCount || 0), 0);
    
    console.log(`\n📊 ANALYTICS:`);
    console.log(`- Total Reels: ${items.length}`);
    console.log(`- Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`- Total Comments: ${totalComments.toLocaleString()}`);
    console.log(`- Total Views: ${totalViews.toLocaleString()}`);
    console.log(`- Average Likes: ${Math.round(totalLikes / items.length).toLocaleString()}`);
    console.log(`- Average Comments: ${Math.round(totalComments / items.length).toLocaleString()}`);
    console.log(`- Average Views: ${totalViews > 0 ? Math.round(totalViews / items.length).toLocaleString() : 'N/A'}`);
    
    // Show data structure of first reel
    console.log(`\n🔍 FIRST REEL DATA STRUCTURE:`);
    const firstReel = items[0];
    console.log('Available fields:', Object.keys(firstReel).sort());
    
    console.log(`\n✅ DIRECT APIFY TEST SUCCESSFUL!`);
    console.log(`Found ${items.length} reels with complete data for ${username}`);
    
    return {
      success: true,
      reels: items,
      totalReels: items.length
    };
    
  } catch (error) {
    console.error('❌ Direct Apify test failed:', error.message);
    console.error('Error details:', error);
    
    return {
      success: false,
      error: error.message,
      reels: [],
      totalReels: 0
    };
  }
}

// Run the test
testDirectApifyReels();