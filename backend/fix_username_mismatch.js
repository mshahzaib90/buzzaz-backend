const { admin, db } = require('./config/firebase');

async function fixUsernameMismatch() {
  try {
    console.log('=== FIXING USERNAME MISMATCH ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log(`Fixing user: ${userId}`);
    
    // Get the actual Instagram data
    console.log('\n1. Getting actual Instagram data...');
    const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
    const reelsDoc = await reelsRef.get();
    
    if (!reelsDoc.exists) {
      console.log('❌ No Instagram reels data found');
      return;
    }
    
    const reelsData = reelsDoc.data();
    const actualUsername = reelsData.username;
    console.log(`✅ Actual Instagram username in data: ${actualUsername}`);
    console.log(`   Total Reels: ${reelsData.totalReels}`);
    console.log(`   Reels Array Length: ${reelsData.reels?.length || 0}`);
    
    // Update users collection
    console.log('\n2. Updating users collection...');
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      instagramUsername: actualUsername,
      lastUpdated: new Date().toISOString()
    });
    console.log(`✅ Updated users collection with username: ${actualUsername}`);
    
    // Update influencers collection
    console.log('\n3. Updating influencers collection...');
    const influencerRef = db.collection('influencers').doc(userId);
    const influencerDoc = await influencerRef.get();
    
    if (influencerDoc.exists) {
      const currentData = influencerDoc.data();
      console.log(`   Current username: ${currentData.instagramUsername}`);
      console.log(`   Updating to: ${actualUsername}`);
      
      // Calculate analytics from reel data
      const totalLikes = reelsData.reels?.reduce((sum, reel) => sum + (reel.likesCount || 0), 0) || 0;
      const totalComments = reelsData.reels?.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0) || 0;
      const avgLikes = reelsData.reels?.length > 0 ? Math.round(totalLikes / reelsData.reels.length) : 0;
      
      await influencerRef.update({
        instagramUsername: actualUsername,
        followers: reelsData.analytics?.totalLikes || totalLikes || currentData.followers || 0,
        postsCount: reelsData.totalReels || currentData.postsCount || 0,
        engagementRate: reelsData.analytics?.engagementRate || 0,
        lastUpdated: new Date().toISOString()
      });
      console.log(`✅ Updated influencers collection with username: ${actualUsername}`);
      console.log(`   Followers: ${reelsData.analytics?.totalLikes || totalLikes}`);
      console.log(`   Posts Count: ${reelsData.totalReels}`);
    }
    
    // Verify the fix
    console.log('\n4. Verifying the fix...');
    const verifyUserDoc = await userRef.get();
    const verifyInfluencerDoc = await influencerRef.get();
    
    if (verifyUserDoc.exists) {
      const userData = verifyUserDoc.data();
      console.log(`✅ Users collection username: ${userData.instagramUsername}`);
    }
    
    if (verifyInfluencerDoc.exists) {
      const influencerData = verifyInfluencerDoc.data();
      console.log(`✅ Influencers collection username: ${influencerData.instagramUsername}`);
      console.log(`   Followers: ${influencerData.followers}`);
      console.log(`   Posts Count: ${influencerData.postsCount}`);
    }
    
    // Test API endpoint conditions
    console.log('\n5. Testing API endpoint conditions...');
    const hasInstagramUsername = !!(userData?.instagramUsername || influencerData?.instagramUsername);
    console.log(`Has Instagram username: ${hasInstagramUsername}`);
    console.log(`Username matches data: ${(userData?.instagramUsername || influencerData?.instagramUsername) === actualUsername}`);
    
    console.log('\n🎉 USERNAME MISMATCH FIXED!');
    console.log('The dashboard should now properly display the laibybaby reels data.');
    console.log('Try refreshing the dashboard to see the changes.');
    
  } catch (error) {
    console.error('❌ Error fixing username mismatch:', error);
  }
  
  process.exit(0);
}

fixUsernameMismatch();