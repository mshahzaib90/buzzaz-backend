const { admin, db } = require('./config/firebase');

async function addTikTokToTestUser() {
  try {
    console.log('Adding TikTok data to test user...\n');
    
    const testUserId = 'kui7voXcFLJFlgHNFoPD';
    const testUserEmail = 'test-youtube@example.com';
    
    console.log('Target user:', testUserEmail);
    console.log('User ID:', testUserId);
    
    // Get current profile data
    const profileDoc = await db.collection('influencers').doc(testUserId).get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found');
      return;
    }
    
    const currentData = profileDoc.data();
    console.log('\nCurrent profile data:');
    console.log('- Instagram:', currentData.instagramUsername || 'Not set');
    console.log('- YouTube:', currentData.youtubeChannelId || 'Not set');
    console.log('- TikTok:', currentData.tiktokUsername || 'Not set');
    
    // Add TikTok data
    const tiktokData = {
      // Basic TikTok fields
      tiktokUsername: 'testyoutube_tiktok',
      tiktokFollowers: 15000,
      tiktokFollowing: 300,
      tiktokVideosCount: 75,
      tiktokTotalLikes: 250000,
      tiktokTotalViews: 1500000,
      tiktokEngagementRate: 4.2,
      tiktokAvatarUrl: 'https://example.com/tiktok-avatar.jpg',
      
      // Enhanced TikTok fields
      tiktokFullName: 'Test YouTube TikTok',
      tiktokBio: 'Creating amazing TikTok content! 🎵',
      tiktokIsVerified: false,
      tiktokIsPrivate: false,
      
      // Update timestamp
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('\nAdding TikTok data:');
    console.log('- Username:', tiktokData.tiktokUsername);
    console.log('- Followers:', tiktokData.tiktokFollowers.toLocaleString());
    console.log('- Videos:', tiktokData.tiktokVideosCount);
    console.log('- Total Likes:', tiktokData.tiktokTotalLikes.toLocaleString());
    console.log('- Total Views:', tiktokData.tiktokTotalViews.toLocaleString());
    
    // Update the profile
    await db.collection('influencers').doc(testUserId).update(tiktokData);
    
    console.log('\n✅ TikTok data added successfully!');
    
    // Verify the update
    const updatedDoc = await db.collection('influencers').doc(testUserId).get();
    const updatedData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION ===');
    console.log('Instagram Data:');
    console.log(`  Username: ${updatedData.instagramUsername || 'Not set'}`);
    console.log(`  Followers: ${updatedData.followers || 0}`);
    
    console.log('\nYouTube Data:');
    console.log(`  Channel ID: ${updatedData.youtubeChannelId || 'Not set'}`);
    console.log(`  Subscribers: ${updatedData.youtubeSubscribers || 0}`);
    console.log(`  Videos: ${updatedData.youtubeVideos || 0}`);
    
    console.log('\nTikTok Data:');
    console.log(`  Username: ${updatedData.tiktokUsername || 'Not set'}`);
    console.log(`  Followers: ${updatedData.tiktokFollowers || 0}`);
    console.log(`  Videos: ${updatedData.tiktokVideosCount || 0}`);
    console.log(`  Total Likes: ${updatedData.tiktokTotalLikes || 0}`);
    console.log(`  Total Views: ${updatedData.tiktokTotalViews || 0}`);
    
    console.log('\n🎯 All three platforms should now display on the dashboard!');
    
  } catch (error) {
    console.error('Error adding TikTok data:', error);
  } finally {
    process.exit(0);
  }
}

addTikTokToTestUser();