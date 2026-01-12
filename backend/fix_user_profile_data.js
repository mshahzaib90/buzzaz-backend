const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function fixUserProfileData() {
  try {
    console.log('=== FIXING USER PROFILE DATA ===');
    
    const userId = 'ikGacihCCEDUvZt93wbD'; // new124@gmail.com
    
    console.log('Updating profile for user ID:', userId);
    
    // Get current profile
    const profileRef = db.collection('influencers').doc(userId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found');
      return;
    }
    
    const currentData = profileDoc.data();
    console.log('Current profile data:', JSON.stringify(currentData, null, 2));
    
    // Add the missing Instagram and YouTube data
    const updateData = {
      // Instagram data
      instagramUsername: 'test_instagram_user',
      instagramFollowers: 15000,
      instagramFollowing: 500,
      instagramPostsCount: 120,
      instagramEngagementRate: 3.5,
      instagramAvatarUrl: 'https://example.com/avatar.jpg',
      instagramVerified: false,
      instagramPrivate: false,
      
      // Add the fields that the frontend expects for Instagram display condition
      followers: 15000,
      following: 500,
      postsCount: 120,
      engagementRate: 3.5,
      
      // YouTube data
      youtubeChannelId: 'UCtest123456789',
      youtubeChannelTitle: 'Test YouTube Channel',
      youtubeChannelUrl: 'https://youtube.com/channel/UCtest123456789',
      youtubeSubscribers: 25000,
      youtubeVideos: 85,
      youtubeTotalLikes: 150000,
      
      // Keep existing TikTok data
      ...currentData,
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating profile with data:', JSON.stringify(updateData, null, 2));
    
    await profileRef.update(updateData);
    
    console.log('✅ Profile updated successfully!');
    
    // Verify the update
    const updatedDoc = await profileRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION ===');
    console.log('Instagram Username:', updatedData.instagramUsername);
    console.log('Instagram Followers:', updatedData.followers);
    console.log('Instagram Posts:', updatedData.postsCount);
    console.log('Instagram Following:', updatedData.following);
    console.log('YouTube Channel ID:', updatedData.youtubeChannelId);
    console.log('YouTube Channel Title:', updatedData.youtubeChannelTitle);
    
    // Test frontend conditions
    console.log('\n=== FRONTEND CONDITIONS TEST ===');
    const hasInstagramUsername = !!updatedData.instagramUsername;
    const hasFollowers = (updatedData.followers || 0) > 0;
    const hasPosts = (updatedData.postsCount || 0) > 0;
    const hasFollowing = (updatedData.following || 0) > 0;
    const instagramCondition = hasInstagramUsername && (hasFollowers || hasPosts || hasFollowing);
    
    console.log('Instagram Display Condition:', instagramCondition);
    console.log('- Has Instagram Username:', hasInstagramUsername);
    console.log('- Has Followers > 0:', hasFollowers);
    console.log('- Has Posts > 0:', hasPosts);
    console.log('- Has Following > 0:', hasFollowing);
    
    const hasYouTubeChannelId = !!updatedData.youtubeChannelId;
    console.log('YouTube Display Condition:', hasYouTubeChannelId);
    console.log('- Has YouTube Channel ID:', hasYouTubeChannelId);
    
    if (instagramCondition && hasYouTubeChannelId) {
      console.log('\n🎉 SUCCESS: Both Instagram and YouTube should now display on the dashboard!');
    } else {
      console.log('\n❌ ISSUE: One or both platforms may still not display');
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixUserProfileData();