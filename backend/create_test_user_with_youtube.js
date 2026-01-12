const { admin } = require('./config/firebase');
const bcrypt = require('bcryptjs');

async function createTestUserWithYoutube() {
  try {
    console.log('=== CREATING TEST USER WITH YOUTUBE DATA ===');
    
    // Create a new user with a known email
    const testEmail = 'test-youtube@example.com';
    const testPassword = 'password123';
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    
    // Create user document
    const userRef = admin.firestore().collection('users').doc();
    const userId = userRef.id;
    
    const userData = {
      email: testEmail,
      password: hashedPassword,
      role: 'influencer',
      createdAt: new Date().toISOString(),
      isActive: true,
      lastLoginAt: new Date().toISOString()
    };
    
    await userRef.set(userData);
    console.log('Created user with ID:', userId);
    
    // Create influencer profile with YouTube data
    const influencerData = {
      fullName: 'Test YouTube User',
      instagramUsername: 'testyoutube',
      bio: 'Test user with YouTube channel',
      location: 'Test City',
      gender: 'prefer_not_to_say',
      categories: ['lifestyle'],
      contentTypes: ['posts'],
      priceRangeMin: 100,
      priceRangeMax: 1000,
      
      // YouTube data
      youtubeChannelId: 'UCsample123',
      youtubeChannelTitle: 'Sample YouTube Channel',
      youtubeChannelUrl: 'https://youtube.com/channel/UCsample123',
      youtubeSubscribers: 10000,
      youtubeVideos: 50,
      
      // Instagram data
      avatarUrl: '/images/profiles/placeholder.svg',
      followers: 5000,
      following: 500,
      postsCount: 100,
      engagementRate: 3.5,
      isVerified: false,
      isPrivate: false,
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    await admin.firestore().collection('influencers').doc(userId).set(influencerData);
    console.log('Created influencer profile with YouTube data');
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('User ID:', userId);
    
    console.log('\n=== YOUTUBE DATA ===');
    console.log('YouTube Channel ID:', influencerData.youtubeChannelId);
    console.log('YouTube Channel Title:', influencerData.youtubeChannelTitle);
    console.log('YouTube Channel URL:', influencerData.youtubeChannelUrl);
    console.log('YouTube Subscribers:', influencerData.youtubeSubscribers);
    console.log('YouTube Videos:', influencerData.youtubeVideos);
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUserWithYoutube();