const { admin } = require('./config/firebase');

async function fixUserProfileConnection() {
  try {
    console.log('=== FIXING USER PROFILE CONNECTION ===');
    
    // The influencer with YouTube data
    const influencerId = '4SIJSZdXKwQ3YCPdD0YM';
    
    // Get the influencer profile
    const influencerDoc = await admin.firestore().collection('influencers').doc(influencerId).get();
    
    if (!influencerDoc.exists) {
      console.log('Influencer profile not found');
      return;
    }
    
    const influencerData = influencerDoc.data();
    console.log('Found influencer with Instagram username:', influencerData.instagramUsername);
    console.log('YouTube Channel ID:', influencerData.youtubeChannelId);
    
    // Check if user document exists
    const userDoc = await admin.firestore().collection('users').doc(influencerId).get();
    
    if (userDoc.exists) {
      console.log('User document already exists');
      console.log('User data:', userDoc.data());
    } else {
      console.log('Creating user document for influencer...');
      
      // Create a user document for this influencer
      const userData = {
        email: 'byiramkhan@example.com', // Using Instagram username as base
        role: 'influencer',
        createdAt: new Date().toISOString(),
        isActive: true,
        // Note: No password since this is a fix for existing data
        lastLoginAt: new Date().toISOString()
      };
      
      await admin.firestore().collection('users').doc(influencerId).set(userData);
      console.log('User document created successfully');
    }
    
    // Now test the API endpoint
    console.log('\n=== TESTING API ENDPOINT ===');
    
    // Simulate the API call
    const profileResponse = {
      profile: influencerData,
      latestStats: null // No stats for now
    };
    
    console.log('Simulated API response:');
    console.log('- Instagram Username:', profileResponse.profile.instagramUsername);
    console.log('- YouTube Channel ID:', profileResponse.profile.youtubeChannelId);
    console.log('- YouTube Channel Title:', profileResponse.profile.youtubeChannelTitle);
    console.log('- YouTube Channel URL:', profileResponse.profile.youtubeChannelUrl);
    console.log('- YouTube Subscribers:', profileResponse.profile.youtubeSubscribers);
    console.log('- YouTube Videos:', profileResponse.profile.youtubeVideos);
    
  } catch (error) {
    console.error('Error fixing user profile connection:', error);
  }
}

fixUserProfileConnection();