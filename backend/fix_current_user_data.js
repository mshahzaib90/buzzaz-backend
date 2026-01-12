const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixCurrentUserData() {
  try {
    console.log('=== FIXING CURRENT USER DATA ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM';
    
    // Get current user data
    const currentUserDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (!currentUserDoc.exists) {
      console.log('❌ Current user not found');
      return;
    }
    
    const currentData = currentUserDoc.data();
    console.log('Current user data (test data):');
    console.log(`  Instagram: ${currentData.instagramUsername}`);
    console.log(`  Followers: ${currentData.followers}`);
    console.log(`  Following: ${currentData.following}`);
    console.log(`  Posts: ${currentData.postsCount}`);
    
    // Let's use one of the real connections - bismakhannn with good data
    const realConnectionData = {
      instagramUsername: 'bismakhannn',
      followers: 128265,
      following: 408,
      postsCount: 125,
      fullName: 'bismakhannn',
      instagramTotalLikes: 0, // Keep existing or set to 0
      engagementRate: currentData.engagementRate || 3.8,
      isActive: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Keep existing YouTube and TikTok data if any
    if (currentData.youtubeChannelId) {
      realConnectionData.youtubeChannelId = currentData.youtubeChannelId;
      realConnectionData.youtubeChannelTitle = currentData.youtubeChannelTitle;
      realConnectionData.youtubeChannelUrl = currentData.youtubeChannelUrl;
    }
    
    if (currentData.tiktokUsername) {
      realConnectionData.tiktokUsername = currentData.tiktokUsername;
      realConnectionData.tiktokFollowers = currentData.tiktokFollowers;
      realConnectionData.tiktokVideosCount = currentData.tiktokVideosCount;
      realConnectionData.tiktokEngagementRate = currentData.tiktokEngagementRate;
      realConnectionData.tiktokAvatarUrl = currentData.tiktokAvatarUrl;
      realConnectionData.tiktokFollowing = currentData.tiktokFollowing;
      realConnectionData.tiktokTotalShares = currentData.tiktokTotalShares;
      realConnectionData.tiktokTotalComments = currentData.tiktokTotalComments;
      realConnectionData.tiktokTotalViews = currentData.tiktokTotalViews;
      realConnectionData.tiktokTotalLikes = currentData.tiktokTotalLikes;
    }
    
    console.log('\n=== UPDATING WITH REAL DATA ===');
    console.log('New data:');
    console.log(`  Instagram: @${realConnectionData.instagramUsername}`);
    console.log(`  Followers: ${realConnectionData.followers.toLocaleString()}`);
    console.log(`  Following: ${realConnectionData.following.toLocaleString()}`);
    console.log(`  Posts: ${realConnectionData.postsCount}`);
    
    // Update the current user's profile
    await db.collection('influencers').doc(currentUserId).update(realConnectionData);
    
    console.log('✅ Current user profile updated successfully!');
    
    // Verify the update
    const updatedDoc = await db.collection('influencers').doc(currentUserId).get();
    const updatedData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION ===');
    console.log('Updated profile:');
    console.log(`  Instagram: @${updatedData.instagramUsername}`);
    console.log(`  Followers: ${updatedData.followers?.toLocaleString()}`);
    console.log(`  Following: ${updatedData.following?.toLocaleString()}`);
    console.log(`  Posts: ${updatedData.postsCount}`);
    console.log(`  Full Name: ${updatedData.fullName}`);
    
    console.log('\n🎉 Dashboard should now show real data instead of test data!');
    console.log('Please refresh the dashboard to see the changes.');
    
  } catch (error) {
    console.error('Error fixing current user data:', error);
  }
}

fixCurrentUserData();