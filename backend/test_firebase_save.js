const admin = require('firebase-admin');
const { scrapeInstagramComplete } = require('./services/apifyService');
const { saveInstagramProfileData, saveInstagramReelData, getInstagramProfileData, getInstagramReelData } = require('./services/firebaseService');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function testFirebaseSave() {
  const userId = 'sx8gqxfSNZQvlHXq7BQI';
  const username = 'kainat_tahirr';
  
  console.log('=== TESTING FIREBASE SAVE FUNCTIONALITY ===');
  console.log(`User ID: ${userId}`);
  console.log(`Instagram Username: @${username}`);
  
  try {
    // Step 1: Scrape Instagram data
    console.log('\n1. Scraping Instagram data...');
    const instagramData = await scrapeInstagramComplete(`@${username}`);
    
    if (!instagramData.success) {
      console.error('Failed to scrape Instagram data:', instagramData.errors);
      return;
    }
    
    console.log(`✓ Scraped successfully - Profile: ${instagramData.profile ? '✓' : '✗'}, Reels: ${instagramData.reels.length}`);
    
    // Step 2: Save profile data to Firebase
    if (instagramData.profile) {
      console.log('\n2. Saving profile data to Firebase...');
      await saveInstagramProfileData(userId, instagramData.profile);
      console.log('✓ Profile data saved successfully');
    }
    
    // Step 3: Save reel data to Firebase
    if (instagramData.reels && instagramData.reels.length > 0) {
      console.log('\n3. Saving reel data to Firebase...');
      await saveInstagramReelData(userId, instagramData.reels);
      console.log(`✓ Reel data saved successfully (${instagramData.reels.length} reels)`);
    }
    
    // Step 4: Verify data was saved by reading it back
    console.log('\n4. Verifying saved data...');
    
    const savedProfile = await getInstagramProfileData(userId);
    const savedReels = await getInstagramReelData(userId);
    
    console.log(`✓ Profile data retrieved: ${savedProfile ? 'Yes' : 'No'}`);
    console.log(`✓ Reel data retrieved: ${savedReels ? savedReels.length + ' reels' : 'No'}`);
    
    if (savedProfile) {
      console.log('\nProfile fields:');
      console.log(`- Username: ${savedProfile.username}`);
      console.log(`- Full Name: ${savedProfile.fullName}`);
      console.log(`- Followers: ${savedProfile.followers}`);
      console.log(`- Posts: ${savedProfile.postsCount}`);
      console.log(`- Verified: ${savedProfile.isVerified}`);
      console.log(`- Business Account: ${savedProfile.isBusinessAccount}`);
    }
    
    if (savedReels && savedReels.length > 0) {
      console.log('\nFirst reel fields:');
      const firstReel = savedReels[0];
      console.log(`- Caption: ${firstReel.caption ? firstReel.caption.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`- Likes: ${firstReel.likesCount}`);
      console.log(`- Comments: ${firstReel.commentsCount}`);
      console.log(`- Video URL: ${firstReel.videoUrl ? 'Available' : 'N/A'}`);
      console.log(`- Display URL: ${firstReel.displayUrl ? 'Available' : 'N/A'}`);
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

testFirebaseSave();