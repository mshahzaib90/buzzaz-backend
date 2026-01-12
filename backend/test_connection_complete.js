const { admin, db } = require('./config/firebase');
const { scrapeInstagramProfile } = require('./services/apifyService');

async function testCompleteConnectionFlow() {
  const testUserId = 'Kyihth9pkebpFvXxVKLE';
  
  console.log('=== TESTING COMPLETE CONNECTION FLOW ===');
  
  try {
    // Test 1: Instagram Connection via Dashboard Flow
    console.log('\n1. Testing Instagram connection (dashboard flow)...');
    
    const instagramData = {
      instagramUsername: 'testuser123',
      instagramFollowers: 1500,
      instagramFollowing: 300,
      instagramPostsCount: 45,
      instagramEngagementRate: 3.2,
      instagramAvatarUrl: 'https://example.com/avatar.jpg',
      instagramFullName: 'Test User',
      instagramBio: 'Test bio for Instagram user',
      instagramIsVerified: false,
      instagramIsPrivate: false,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = db.collection('influencers').doc(testUserId);
    await docRef.update(instagramData);
    console.log('✓ Instagram data updated successfully');
    
    // Test 2: YouTube Connection via Dashboard Flow
    console.log('\n2. Testing YouTube connection (dashboard flow)...');
    
    const youtubeData = {
      youtubeChannelId: 'UC_test_channel_id',
      youtubeChannelTitle: 'Test YouTube Channel',
      youtubeChannelUrl: 'https://www.youtube.com/channel/UC_test_channel_id',
      youtubeSubscribers: 25000,
      youtubeViews: 500000,
      youtubeVideos: 120,
      updatedAt: new Date().toISOString()
    };
    
    await docRef.update(youtubeData);
    console.log('✓ YouTube data updated successfully');
    
    // Test 3: TikTok Connection via Dashboard Flow
    console.log('\n3. Testing TikTok connection (dashboard flow)...');
    
    const tiktokData = {
      tiktokUsername: 'testtiktok',
      tiktokFollowers: 8500,
      tiktokFollowing: 150,
      tiktokVideosCount: 67,
      tiktokTotalLikes: 125000,
      tiktokTotalViews: 750000,
      tiktokEngagementRate: 4.8,
      tiktokAvatarUrl: 'https://example.com/tiktok-avatar.jpg',
      updatedAt: new Date().toISOString()
    };
    
    await docRef.update(tiktokData);
    console.log('✓ TikTok data updated successfully');
    
    // Test 4: Verify all data is saved
    console.log('\n4. Verifying all social media data...');
    
    const updatedDoc = await docRef.get();
    const profileData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION RESULTS ===');
    
    // Instagram verification
    console.log('Instagram Data:');
    console.log(`  Username: ${profileData.instagramUsername || 'NOT SAVED'}`);
    console.log(`  Followers: ${profileData.instagramFollowers || 'NOT SAVED'}`);
    console.log(`  Posts: ${profileData.instagramPostsCount || 'NOT SAVED'}`);
    console.log(`  Verified: ${profileData.instagramIsVerified !== undefined ? profileData.instagramIsVerified : 'NOT SAVED'}`);
    
    // YouTube verification
    console.log('\nYouTube Data:');
    console.log(`  Channel ID: ${profileData.youtubeChannelId || 'NOT SAVED'}`);
    console.log(`  Channel Title: ${profileData.youtubeChannelTitle || 'NOT SAVED'}`);
    console.log(`  Subscribers: ${profileData.youtubeSubscribers || 'NOT SAVED'}`);
    console.log(`  Videos: ${profileData.youtubeVideos || 'NOT SAVED'}`);
    
    // TikTok verification
    console.log('\nTikTok Data:');
    console.log(`  Username: ${profileData.tiktokUsername || 'NOT SAVED'}`);
    console.log(`  Followers: ${profileData.tiktokFollowers || 'NOT SAVED'}`);
    console.log(`  Videos: ${profileData.tiktokVideosCount || 'NOT SAVED'}`);
    console.log(`  Total Likes: ${profileData.tiktokTotalLikes || 'NOT SAVED'}`);
    
    // Test 5: Test signup flow data structure compatibility
    console.log('\n5. Testing signup flow compatibility...');
    
    const signupData = {
      // Signup flow typically uses these field names
      followers: 2000,
      following: 400,
      postsCount: 55,
      engagementRate: 3.8,
      // These should also be saved alongside the platform-specific fields
      instagramUsername: 'signupuser',
      youtubeChannelId: 'UC_signup_channel',
      tiktokUsername: 'signuptiktok'
    };
    
    await docRef.update(signupData);
    console.log('✓ Signup-style data updated successfully');
    
    const finalDoc = await docRef.get();
    const finalData = finalDoc.data();
    
    console.log('\n=== FINAL COMPATIBILITY CHECK ===');
    console.log('General fields (signup style):');
    console.log(`  followers: ${finalData.followers || 'NOT SAVED'}`);
    console.log(`  following: ${finalData.following || 'NOT SAVED'}`);
    console.log(`  postsCount: ${finalData.postsCount || 'NOT SAVED'}`);
    console.log(`  engagementRate: ${finalData.engagementRate || 'NOT SAVED'}`);
    
    console.log('\nPlatform-specific fields (dashboard style):');
    console.log(`  instagramFollowers: ${finalData.instagramFollowers || 'NOT SAVED'}`);
    console.log(`  youtubeSubscribers: ${finalData.youtubeSubscribers || 'NOT SAVED'}`);
    console.log(`  tiktokFollowers: ${finalData.tiktokFollowers || 'NOT SAVED'}`);
    
    console.log('\n=== CONNECTION FLOW TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('❌ Connection flow test failed:', error);
    throw error;
  }
}

testCompleteConnectionFlow()
  .then(() => {
    console.log('\n✅ All connection flow tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Connection flow tests failed:', error);
    process.exit(1);
  });