const { admin } = require('./config/firebase');

async function debugUserStructure() {
  try {
    console.log('=== DEBUGGING USER STRUCTURE ===');
    
    // Get all users to see the structure
    const usersSnapshot = await admin.firestore().collection('users').limit(5).get();
    
    console.log('Total users found:', usersSnapshot.size);
    
    usersSnapshot.forEach((doc) => {
      console.log('\n--- User Document ---');
      console.log('Document ID:', doc.id);
      console.log('User data:', doc.data());
      console.log('Has uid field?', !!doc.data().uid);
      console.log('Has email field?', !!doc.data().email);
      console.log('Has role field?', !!doc.data().role);
    });
    
    // Also check influencer profiles to see how they reference users
    console.log('\n=== CHECKING INFLUENCER PROFILES ===');
    const influencersSnapshot = await admin.firestore().collection('influencers').limit(3).get();
    
    console.log('Total influencers found:', influencersSnapshot.size);
    
    influencersSnapshot.forEach((doc) => {
      console.log('\n--- Influencer Document ---');
      console.log('Document ID:', doc.id);
      const data = doc.data();
      console.log('User ID field:', data.userId);
      console.log('Has youtubeChannelId?', !!data.youtubeChannelId);
      console.log('YouTube Channel ID:', data.youtubeChannelId);
      console.log('Instagram Username:', data.instagramUsername);
    });
    
  } catch (error) {
    console.error('Error debugging user structure:', error);
  }
}

debugUserStructure();