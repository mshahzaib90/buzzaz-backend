const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addInstagramToCurrentUser() {
  try {
    const currentUserId = 'X0IqcgoiqNm6OgOKKKT1';
    const currentUserEmail = 'new@hello.com';
    
    console.log(`Adding Instagram connection to user: ${currentUserId} (${currentUserEmail})`);
    
    // Get the current user's profile
    const profileRef = db.collection('influencers').doc(currentUserId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found for current user');
      return;
    }
    
    const profileData = profileDoc.data();
    console.log('Current profile data:', {
      fullName: profileData.fullName,
      email: profileData.email,
      instagram: profileData.instagram || 'Not connected',
      tiktok: profileData.tiktok || 'Not connected',
      youtube: profileData.youtube || 'Not connected'
    });
    
    // Add Instagram connection with sample data
    const instagramData = {
      username: 'sample_user_instagram',
      userId: '12345678901234567', // Sample Instagram user ID
      followers: 5000,
      following: 500,
      posts: 150,
      isConnected: true,
      connectedAt: admin.firestore.Timestamp.now(),
      lastSynced: admin.firestore.Timestamp.now(),
      displayConditions: {
        showFollowers: true,
        showFollowing: true,
        showPosts: true,
        showEngagementRate: true,
        showRecentPosts: true
      }
    };
    
    // Update the profile with Instagram data
    await profileRef.update({
      instagram: instagramData,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    console.log('✅ Successfully added Instagram connection to user profile');
    console.log('Instagram data added:', {
      username: instagramData.username,
      followers: instagramData.followers,
      posts: instagramData.posts,
      isConnected: instagramData.isConnected
    });
    
    // Verify the update
    const updatedDoc = await profileRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION ===');
    console.log('Updated profile Instagram data:', updatedData.instagram);
    
  } catch (error) {
    console.error('❌ Error adding Instagram connection:', error);
  }
}

// Run the function
addInstagramToCurrentUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });