const { admin, db } = require('./config/firebase');

async function checkInstagramDataDetailed() {
  try {
    console.log('=== Checking Instagram Data for mdshahzaib@gmail.com ===\n');
    
    // First, find the user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'mdshahzaib@gmail.com')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with email: mdshahzaib@gmail.com');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('✅ User found:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Full Name: ${userData.fullName || 'Not set'}`);
    console.log(`   Created: ${userData.createdAt || 'Not set'}\n`);
    
    // Check Instagram profile data in users/{userId}/instagram/profile
    console.log('🔍 Checking Instagram Profile Data...');
    try {
      const profileRef = db.collection('users').doc(userId).collection('instagram').doc('profile');
      const profileDoc = await profileRef.get();
      
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        console.log('✅ Instagram Profile Data Found:');
        console.log(`   Username: ${profileData.username}`);
        console.log(`   Full Name: ${profileData.fullName}`);
        console.log(`   Bio: ${profileData.bio}`);
        console.log(`   Followers: ${profileData.followers}`);
        console.log(`   Following: ${profileData.following}`);
        console.log(`   Posts Count: ${profileData.postsCount}`);
        console.log(`   Is Verified: ${profileData.isVerified}`);
        console.log(`   Avatar URL: ${profileData.avatarUrl}`);
        console.log(`   Last Updated: ${profileData.lastUpdated}`);
        console.log(`   Created At: ${profileData.createdAt}\n`);
      } else {
        console.log('❌ No Instagram profile data found in users/{userId}/instagram/profile\n');
      }
    } catch (error) {
      console.log(`❌ Error checking Instagram profile: ${error.message}\n`);
    }
    
    // Check Instagram reels data in users/{userId}/instagram/reels
    console.log('🔍 Checking Instagram Reels Data...');
    try {
      const reelsRef = db.collection('users').doc(userId).collection('instagram').doc('reels');
      const reelsDoc = await reelsRef.get();
      
      if (reelsDoc.exists) {
        const reelsData = reelsDoc.data();
        console.log('✅ Instagram Reels Data Found:');
        console.log(`   Username: ${reelsData.username}`);
        console.log(`   Total Reels: ${reelsData.totalReels}`);
        console.log(`   Reels Array Length: ${reelsData.reels?.length || 0}`);
        console.log(`   Last Updated: ${reelsData.lastUpdated}`);
        console.log(`   Created At: ${reelsData.createdAt}`);
        
        if (reelsData.reels && reelsData.reels.length > 0) {
          console.log('\n   📹 Sample Reel Data (first reel):');
          const firstReel = reelsData.reels[0];
          console.log(`      ID: ${firstReel.id}`);
          console.log(`      Short Code: ${firstReel.shortCode}`);
          console.log(`      Caption: ${firstReel.caption?.substring(0, 100)}...`);
          console.log(`      Likes: ${firstReel.likesCount}`);
          console.log(`      Comments: ${firstReel.commentsCount}`);
          console.log(`      URL: ${firstReel.url}`);
          console.log(`      Video Duration: ${firstReel.videoDuration}`);
        }
        console.log('');
      } else {
        console.log('❌ No Instagram reels data found in users/{userId}/instagram/reels\n');
      }
    } catch (error) {
      console.log(`❌ Error checking Instagram reels: ${error.message}\n`);
    }
    
    // Check if there's any data in the influencers collection
    console.log('🔍 Checking Influencers Collection...');
    try {
      const influencerRef = db.collection('influencers').doc(userId);
      const influencerDoc = await influencerRef.get();
      
      if (influencerDoc.exists) {
        const influencerData = influencerDoc.data();
        console.log('✅ Influencer Data Found:');
        console.log(`   Instagram Username: ${influencerData.instagramUsername || 'Not set'}`);
        console.log(`   Full Name: ${influencerData.fullName || 'Not set'}`);
        console.log(`   Bio: ${influencerData.bio || 'Not set'}`);
        console.log(`   Followers: ${influencerData.followers || 0}`);
        console.log(`   Following: ${influencerData.following || 0}`);
        console.log(`   Posts Count: ${influencerData.postsCount || 0}`);
        console.log(`   Last Synced: ${influencerData.lastSyncedAt || 'Not set'}\n`);
      } else {
        console.log('❌ No data found in influencers collection\n');
      }
    } catch (error) {
      console.log(`❌ Error checking influencers collection: ${error.message}\n`);
    }
    
    // Check instagramDetailedData collection (legacy)
    console.log('🔍 Checking instagramDetailedData Collection...');
    try {
      const detailedRef = db.collection('instagramDetailedData').doc(userId);
      const detailedDoc = await detailedRef.get();
      
      if (detailedDoc.exists) {
        const detailedData = detailedDoc.data();
        console.log('✅ Instagram Detailed Data Found:');
        console.log(`   Profile Username: ${detailedData.profile?.username || 'Not set'}`);
        console.log(`   Profile Followers: ${detailedData.profile?.followers || 0}`);
        console.log(`   Reels Count: ${detailedData.reels?.length || 0}`);
        console.log(`   Cached At: ${detailedData.metadata?.cachedAt || 'Not set'}`);
        console.log(`   Data Source: ${detailedData.metadata?.dataSource || 'Not set'}\n`);
      } else {
        console.log('❌ No data found in instagramDetailedData collection\n');
      }
    } catch (error) {
      console.log(`❌ Error checking instagramDetailedData collection: ${error.message}\n`);
    }
    
    console.log('=== Check Complete ===');
    
  } catch (error) {
    console.error('Error during detailed check:', error);
  } finally {
    process.exit(0);
  }
}

checkInstagramDataDetailed();