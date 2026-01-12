const { admin } = require('./config/firebase');

async function debugSpecificUser() {
  try {
    console.log('=== DEBUGGING SPECIFIC USER WITH YOUTUBE DATA ===');
    
    // The influencer with YouTube data has ID: 4SIJSZdXKwQ3YCPdD0YM
    const influencerId = '4SIJSZdXKwQ3YCPdD0YM';
    
    // Check if there's a matching user document
    const userDoc = await admin.firestore().collection('users').doc(influencerId).get();
    
    console.log('User document exists?', userDoc.exists);
    if (userDoc.exists) {
      console.log('User data:', userDoc.data());
    }
    
    // Get the influencer profile
    const influencerDoc = await admin.firestore().collection('influencers').doc(influencerId).get();
    
    console.log('Influencer document exists?', influencerDoc.exists);
    if (influencerDoc.exists) {
      const data = influencerDoc.data();
      console.log('Influencer data:');
      console.log('- Instagram Username:', data.instagramUsername);
      console.log('- YouTube Channel ID:', data.youtubeChannelId);
      console.log('- YouTube Channel Title:', data.youtubeChannelTitle);
      console.log('- YouTube Channel URL:', data.youtubeChannelUrl);
      console.log('- YouTube Subscribers:', data.youtubeSubscribers);
      console.log('- YouTube Videos:', data.youtubeVideos);
    }
    
    // Check all users to see which one might be the current logged-in user
    console.log('\n=== CHECKING ALL USERS FOR RECENT LOGIN ===');
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.lastLoginAt) {
        console.log(`User ${doc.id} (${data.email}) last login: ${data.lastLoginAt}`);
      }
    });
    
  } catch (error) {
    console.error('Error debugging specific user:', error);
  }
}

debugSpecificUser();