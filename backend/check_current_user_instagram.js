const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkCurrentUserInstagram() {
  try {
    const currentUserId = 'ikGacihCCEDUvZt93wbD';
    const currentUserEmail = 'new124@gmail.com';
    
    console.log('=== CHECKING CURRENT USER INSTAGRAM DATA ===');
    console.log(`User ID: ${currentUserId}`);
    console.log(`Email: ${currentUserEmail}`);
    
    // Get the current user's profile
    const profileRef = db.collection('influencers').doc(currentUserId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found for current user');
      return;
    }
    
    const profileData = profileDoc.data();
    
    console.log('\n=== PROFILE DATA ANALYSIS ===');
    console.log('Full Name:', profileData.fullName);
    console.log('Email:', profileData.email);
    console.log('Created At:', profileData.createdAt);
    console.log('Last Synced At:', profileData.lastSyncedAt);
    
    console.log('\n=== INSTAGRAM DATA ===');
    console.log('Instagram Username:', profileData.instagramUsername);
    console.log('Followers:', profileData.followers);
    console.log('Following:', profileData.following);
    console.log('Posts Count:', profileData.postsCount);
    console.log('Engagement Rate:', profileData.engagementRate);
    console.log('Is Verified:', profileData.isVerified);
    console.log('Is Private:', profileData.isPrivate);
    console.log('Avatar URL:', profileData.avatarUrl);
    
    // Check if there's an instagram object (nested structure)
    if (profileData.instagram) {
      console.log('\n=== NESTED INSTAGRAM OBJECT ===');
      console.log('Instagram Object:', JSON.stringify(profileData.instagram, null, 2));
    }
    
    console.log('\n=== YOUTUBE DATA ===');
    console.log('YouTube Channel ID:', profileData.youtubeChannelId);
    console.log('YouTube Channel Title:', profileData.youtubeChannelTitle);
    console.log('YouTube Channel URL:', profileData.youtubeChannelUrl);
    
    console.log('\n=== TIKTOK DATA ===');
    console.log('TikTok Username:', profileData.tiktokUsername);
    console.log('TikTok Followers:', profileData.tiktokFollowers);
    
    // Check if the Instagram username is the test one
    if (profileData.instagramUsername === 'test_instagram_user') {
      console.log('\n⚠️  WARNING: Profile shows test Instagram username!');
      console.log('This suggests the profile was created with test data, not real signup data.');
    }
    
    // Check for any other Instagram-related fields
    console.log('\n=== ALL INSTAGRAM-RELATED FIELDS ===');
    Object.keys(profileData).forEach(key => {
      if (key.toLowerCase().includes('instagram')) {
        console.log(`${key}:`, profileData[key]);
      }
    });
    
    console.log('\n=== CHECKING USER DOCUMENT ===');
    // Also check the user document to see if there's any Instagram data there
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User Role:', userData.role);
      console.log('User Type:', userData.userType);
      console.log('Role Chosen At:', userData.roleChosenAt);
      
      // Check for any Instagram data in user document
      Object.keys(userData).forEach(key => {
        if (key.toLowerCase().includes('instagram')) {
          console.log(`User ${key}:`, userData[key]);
        }
      });
    }
    
    console.log('\n=== END ANALYSIS ===');
    
  } catch (error) {
    console.error('❌ Error checking user Instagram data:', error);
  }
}

// Run the function
checkCurrentUserInstagram()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });