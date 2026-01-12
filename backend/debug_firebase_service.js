const { getInstagramReelData, getInstagramProfileData } = require('./services/firebaseService');

async function debugFirebaseService() {
  try {
    console.log('=== DEBUGGING FIREBASE SERVICE FUNCTIONS ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log(`Testing with user ID: ${userId}`);
    
    // Test getInstagramReelData function
    console.log('\n1. Testing getInstagramReelData function...');
    
    try {
      const reelResult = await getInstagramReelData(userId);
      console.log('Reel Result Success:', reelResult.success);
      console.log('Reel Result Message:', reelResult.message);
      
      if (reelResult.success && reelResult.data) {
        console.log('✅ Reel data found:');
        console.log('Username:', reelResult.data.username);
        console.log('Total Reels:', reelResult.data.totalReels);
        console.log('Reels Array Length:', reelResult.data.reels?.length || 0);
        console.log('Analytics:', reelResult.data.analytics ? 'Present' : 'Not present');
        console.log('Last Updated:', reelResult.data.lastUpdated);
      } else {
        console.log('❌ No reel data returned');
      }
    } catch (error) {
      console.log('❌ Error in getInstagramReelData:', error.message);
    }
    
    // Test getInstagramProfileData function
    console.log('\n2. Testing getInstagramProfileData function...');
    
    try {
      const profileResult = await getInstagramProfileData(userId);
      console.log('Profile Result Success:', profileResult.success);
      console.log('Profile Result Message:', profileResult.message);
      
      if (profileResult.success && profileResult.data) {
        console.log('✅ Profile data found:');
        console.log('Username:', profileResult.data.username);
        console.log('Full Name:', profileResult.data.fullName);
        console.log('Followers:', profileResult.data.followers);
        console.log('Following:', profileResult.data.following);
        console.log('Posts Count:', profileResult.data.postsCount);
      } else {
        console.log('❌ No profile data returned');
      }
    } catch (error) {
      console.log('❌ Error in getInstagramProfileData:', error.message);
    }
    
    // Direct Firebase check
    console.log('\n3. Direct Firebase check...');
    const { db } = require('./config/firebase');
    
    // Check reels document directly
    const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsRef.get();
    
    if (reelsDoc.exists) {
      const reelsData = reelsDoc.data();
      console.log('✅ Direct Firebase check - Reels document exists:');
      console.log('Username:', reelsData.username);
      console.log('Total Reels:', reelsData.totalReels);
      console.log('Reels Array Length:', reelsData.reels?.length || 0);
      console.log('Document Keys:', Object.keys(reelsData));
    } else {
      console.log('❌ Direct Firebase check - No reels document found');
    }
    
    // Check profile document directly
    const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
    const profileDoc = await profileRef.get();
    
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      console.log('✅ Direct Firebase check - Profile document exists:');
      console.log('Username:', profileData.username);
      console.log('Full Name:', profileData.fullName);
      console.log('Followers:', profileData.followers);
      console.log('Document Keys:', Object.keys(profileData));
    } else {
      console.log('❌ Direct Firebase check - No profile document found');
    }
    
    console.log('\n=== DEBUG COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error debugging Firebase service:', error);
  }
  
  process.exit(0);
}

debugFirebaseService();