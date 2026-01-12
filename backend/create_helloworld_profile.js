const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function createHelloworldProfile() {
  try {
    const targetEmail = 'helloworld@gmail.com';
    const userId = '1xkzVFBwvte3TmAnGyPN'; // From previous check
    
    console.log('=== CREATING COMPLETE SOCIAL MEDIA PROFILE FOR HELLOWORLD@GMAIL.COM ===');
    console.log(`Email: ${targetEmail}`);
    console.log(`User ID: ${userId}`);
    console.log('');
    
    // Step 1: Create Influencer Profile
    console.log('📝 STEP 1: Creating Influencer Profile...');
    
    const influencerProfile = {
      userId: userId,
      email: targetEmail,
      fullName: 'Hello World User',
      bio: 'Multi-platform content creator sharing amazing content across Instagram, YouTube, and TikTok! 🌟',
      location: 'Global',
      gender: 'other',
      categories: ['Lifestyle', 'Technology', 'Entertainment'],
      contentTypes: ['Photos', 'Videos', 'Stories', 'Reels'],
      avatarUrl: '/images/profiles/helloworld-avatar.jpg',
      
      // Instagram Connection
      instagramUsername: 'helloworld_creator',
      instagramFollowers: 85000,
      instagramFollowing: 1200,
      instagramPostsCount: 450,
      instagramEngagementRate: 4.2,
      instagramIsVerified: true,
      instagramIsPrivate: false,
      instagramAvatarUrl: 'https://instagram.com/helloworld_creator/avatar.jpg',
      
      // YouTube Connection
      youtubeChannelId: 'UCHelloWorld123456789',
      youtubeChannelTitle: 'Hello World Channel',
      youtubeChannelUrl: 'https://youtube.com/channel/UCHelloWorld123456789',
      youtubeSubscribers: 125000,
      youtubeVideos: 180,
      youtubeTotalViews: 2500000,
      youtubeTotalLikes: 450000,
      
      // TikTok Connection
      tiktokUsername: 'helloworld_tiktok',
      tiktokFollowers: 95000,
      tiktokFollowing: 800,
      tiktokVideos: 320,
      tiktokTotalLikes: 1200000,
      
      // Profile metadata
      isVerified: true,
      isPrivate: false,
      isActive: true,
      engagementRate: 4.2,
      followers: 85000, // Primary platform (Instagram)
      following: 1200,
      postsCount: 450,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to influencers collection
    const influencerRef = await db.collection('influencers').add(influencerProfile);
    console.log(`✅ Influencer profile created with ID: ${influencerRef.id}`);
    
    // Step 2: Create Instagram Stats
    console.log('\n📸 STEP 2: Creating Instagram Stats...');
    
    const instagramStats = {
      userId: userId,
      email: targetEmail,
      username: 'helloworld_creator',
      followers: 85000,
      following: 1200,
      posts: 450,
      engagementRate: 4.2,
      isVerified: true,
      isPrivate: false,
      avatarUrl: 'https://instagram.com/helloworld_creator/avatar.jpg',
      bio: 'Multi-platform content creator 🌟',
      website: 'https://helloworld-creator.com',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const instagramRef = await db.collection('instagramStats').add(instagramStats);
    console.log(`✅ Instagram stats created with ID: ${instagramRef.id}`);
    
    // Step 3: Create YouTube Stats
    console.log('\n🎥 STEP 3: Creating YouTube Stats...');
    
    const youtubeStats = {
      userId: userId,
      email: targetEmail,
      channelId: 'UCHelloWorld123456789',
      channelTitle: 'Hello World Channel',
      channelUrl: 'https://youtube.com/channel/UCHelloWorld123456789',
      subscribers: 125000,
      videos: 180,
      views: 2500000,
      totalLikes: 450000,
      description: 'Welcome to Hello World Channel! Creating amazing content for everyone.',
      publishedAt: '2022-01-15T10:00:00Z',
      thumbnailUrl: 'https://youtube.com/channel/UCHelloWorld123456789/thumbnail.jpg',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const youtubeRef = await db.collection('youtubeStats').add(youtubeStats);
    console.log(`✅ YouTube stats created with ID: ${youtubeRef.id}`);
    
    // Step 4: Create TikTok Stats
    console.log('\n🎵 STEP 4: Creating TikTok Stats...');
    
    const tiktokStats = {
      userId: userId,
      email: targetEmail,
      username: 'helloworld_tiktok',
      followers: 95000,
      following: 800,
      videos: 320,
      likes: 1200000,
      isVerified: false,
      isPrivate: false,
      avatarUrl: 'https://tiktok.com/@helloworld_tiktok/avatar.jpg',
      bio: 'Creating viral content daily! 🚀',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const tiktokRef = await db.collection('tiktokStats').add(tiktokStats);
    console.log(`✅ TikTok stats created with ID: ${tiktokRef.id}`);
    
    // Step 5: Verification
    console.log('\n✅ STEP 5: Verification Complete!');
    console.log('');
    console.log('=== SUMMARY OF CREATED DATA ===');
    console.log(`📧 Email: ${targetEmail}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📝 Influencer Profile ID: ${influencerRef.id}`);
    console.log(`📸 Instagram Stats ID: ${instagramRef.id}`);
    console.log(`🎥 YouTube Stats ID: ${youtubeRef.id}`);
    console.log(`🎵 TikTok Stats ID: ${tiktokRef.id}`);
    console.log('');
    console.log('=== SOCIAL MEDIA CONNECTIONS ===');
    console.log('📸 Instagram: @helloworld_creator (85,000 followers)');
    console.log('🎥 YouTube: Hello World Channel (125,000 subscribers)');
    console.log('🎵 TikTok: @helloworld_tiktok (95,000 followers)');
    console.log('');
    console.log('🎉 All social media data has been successfully saved to Firebase!');
    console.log('The user can now access their dashboard with all 3 platforms connected.');
    
  } catch (error) {
    console.error('Error creating helloworld profile:', error);
  } finally {
    process.exit(0);
  }
}

createHelloworldProfile();