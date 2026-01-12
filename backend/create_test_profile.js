const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./config/serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

async function createTestProfile() {
  try {
    const userEmail = 'new124@gmail.com';
    console.log(`\n=== Creating Influencer Profile for ${userEmail} ===\n`);

    // Get user document
    const usersSnapshot = await db.collection('users').where('email', '==', userEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found in users collection');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`✅ User found with ID: ${userId}`);
    console.log(`📧 Email: ${userData.email}`);

    // Check if profile already exists
    const existingProfileSnapshot = await db.collection('influencers').where('userId', '==', userId).get();
    
    if (!existingProfileSnapshot.empty) {
      console.log('⚠️  Profile already exists, updating it...');
      const profileDoc = existingProfileSnapshot.docs[0];
      
      // Update existing profile with social media data
      await profileDoc.ref.update({
        // Instagram data
        instagramUsername: 'test_instagram_user',
        instagramFollowers: 15000,
        instagramFollowing: 500,
        instagramPostsCount: 120,
        instagramEngagementRate: 3.5,
        instagramIsVerified: false,
        instagramIsPrivate: false,
        instagramAvatarUrl: 'https://example.com/avatar.jpg',
        
        // YouTube data
        youtubeChannelId: 'UCtest123456789',
        youtubeChannelTitle: 'Test YouTube Channel',
        youtubeChannelUrl: 'https://youtube.com/channel/UCtest123456789',
        youtubeSubscribers: 25000,
        youtubeVideos: 85,
        youtubeTotalLikes: 150000,
        
        // TikTok data
        tiktokUsername: 'test_tiktok_user',
        tiktokFollowers: 30000,
        tiktokFollowing: 200,
        tiktokVideosCount: 95,
        tiktokTotalLikes: 500000,
        tiktokTotalViews: 2000000,
        
        // Update timestamp
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Profile updated successfully!');
    } else {
      // Create new profile
      const profileData = {
        userId: userId,
        email: userData.email,
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        fullName: `${userData.firstName || 'Test'} ${userData.lastName || 'User'}`,
        
        // Instagram data
        instagramUsername: 'test_instagram_user',
        instagramFollowers: 15000,
        instagramFollowing: 500,
        instagramPostsCount: 120,
        instagramEngagementRate: 3.5,
        instagramIsVerified: false,
        instagramIsPrivate: false,
        instagramAvatarUrl: 'https://example.com/avatar.jpg',
        
        // YouTube data
        youtubeChannelId: 'UCtest123456789',
        youtubeChannelTitle: 'Test YouTube Channel',
        youtubeChannelUrl: 'https://youtube.com/channel/UCtest123456789',
        youtubeSubscribers: 25000,
        youtubeVideos: 85,
        youtubeTotalLikes: 150000,
        
        // TikTok data
        tiktokUsername: 'test_tiktok_user',
        tiktokFollowers: 30000,
        tiktokFollowing: 200,
        tiktokVideosCount: 95,
        tiktokTotalLikes: 500000,
        tiktokTotalViews: 2000000,
        
        // Profile metadata
        bio: 'Test influencer profile with all social media platforms connected',
        location: 'Test City',
        categories: ['lifestyle', 'technology'],
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const profileRef = await db.collection('influencers').add(profileData);
      console.log('✅ New profile created successfully!');
      console.log(`📋 Profile ID: ${profileRef.id}`);
    }

    // Also update user role to influencer if not already set
    if (userData.role !== 'influencer') {
      await userDoc.ref.update({
        role: 'influencer',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ User role updated to influencer');
    }

    console.log('\n=== Profile Creation Summary ===');
    console.log('📸 Instagram: ✅ Connected (15K followers, 120 posts)');
    console.log('🎥 YouTube: ✅ Connected (25K subscribers, 85 videos)');
    console.log('🎵 TikTok: ✅ Connected (30K followers, 95 videos)');
    console.log('\n🎯 All platforms should now display on the dashboard!');

  } catch (error) {
    console.error('Error creating test profile:', error);
  } finally {
    process.exit(0);
  }
}

createTestProfile();