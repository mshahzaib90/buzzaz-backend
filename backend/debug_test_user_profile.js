const { admin } = require('./config/firebase');

async function debugTestUserProfile() {
  try {
    console.log('=== DEBUGGING TEST USER PROFILE ===');
    
    // Find the test user by email
    const usersSnapshot = await admin.firestore().collection('users')
      .where('email', '==', 'test-youtube@example.com')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('No user found with email test-youtube@example.com');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log('User ID:', userId);
    console.log('User Data:', userData);
    
    // Check influencer profile
    const influencerDoc = await admin.firestore().collection('influencers').doc(userId).get();
    
    if (!influencerDoc.exists) {
      console.log('No influencer profile found for user ID:', userId);
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('\n=== INFLUENCER PROFILE DATA ===');
    console.log('Full Profile:', influencerData);
    
    console.log('\n=== YOUTUBE DATA ===');
    console.log('YouTube Channel ID:', influencerData.youtubeChannelId);
    console.log('YouTube Channel Title:', influencerData.youtubeChannelTitle);
    console.log('YouTube Channel URL:', influencerData.youtubeChannelUrl);
    console.log('YouTube Subscribers:', influencerData.youtubeSubscribers);
    console.log('YouTube Videos:', influencerData.youtubeVideos);
    
    console.log('\n=== INSTAGRAM DATA ===');
    console.log('Instagram Username:', influencerData.instagramUsername);
    console.log('Followers:', influencerData.followers);
    console.log('Following:', influencerData.following);
    console.log('Posts Count:', influencerData.postsCount);
    
  } catch (error) {
    console.error('Error debugging test user profile:', error);
  }
}

debugTestUserProfile();