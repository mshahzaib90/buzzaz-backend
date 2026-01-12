const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./config/serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://buzzaz-react-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function checkCurrentProfileData() {
  try {
    console.log('=== CHECKING CURRENT PROFILE DATA ===');
    
    // Get the current user (mdshahzaib@gmail.com)
    const currentUserId = 'lllGdq8BBRZQQOCIWuWC';
    console.log('Current User ID:', currentUserId);
    
    // Get the profile document
    const profileRef = db.collection('influencers').doc(currentUserId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile document does not exist');
      return;
    }
    
    const profileData = profileDoc.data();
    console.log('\n=== PROFILE DATA ===');
    console.log('Full Name:', profileData.fullName);
    console.log('Email:', profileData.email);
    
    // Check Instagram fields
    console.log('\n=== INSTAGRAM FIELDS ===');
    console.log('instagramUsername:', profileData.instagramUsername);
    console.log('followers:', profileData.followers);
    console.log('following:', profileData.following);
    console.log('postsCount:', profileData.postsCount);
    
    // Check the dashboard display condition
    console.log('\n=== DASHBOARD DISPLAY CONDITION ===');
    const hasInstagramUsername = !!profileData.instagramUsername;
    const hasFollowers = (profileData.followers || 0) > 0;
    const hasPosts = (profileData.postsCount || 0) > 0;
    const hasFollowing = (profileData.following || 0) > 0;
    
    console.log('Has Instagram username?', hasInstagramUsername);
    console.log('Has followers > 0?', hasFollowers);
    console.log('Has posts > 0?', hasPosts);
    console.log('Has following > 0?', hasFollowing);
    
    const statsCondition = hasFollowers || hasPosts || hasFollowing;
    const finalCondition = hasInstagramUsername && statsCondition;
    
    console.log('Stats condition (followers > 0 || posts > 0 || following > 0):', statsCondition);
    console.log('Final condition (username && stats):', finalCondition);
    
    if (!finalCondition) {
      console.log('\n❌ PROBLEM IDENTIFIED:');
      if (!hasInstagramUsername) {
        console.log('- Missing Instagram username');
      }
      if (!statsCondition) {
        console.log('- All stats are 0 (followers, posts, following)');
      }
      console.log('This is why the dashboard shows "Instagram Not Connected"');
    } else {
      console.log('\n✅ Profile should display Instagram data correctly');
    }
    
    // Check additional Instagram fields
    console.log('\n=== ADDITIONAL INSTAGRAM FIELDS ===');
    console.log('instagramFollowers:', profileData.instagramFollowers);
    console.log('instagramFollowing:', profileData.instagramFollowing);
    console.log('instagramPostsCount:', profileData.instagramPostsCount);
    console.log('instagramFullName:', profileData.instagramFullName);
    console.log('instagramBio:', profileData.instagramBio);
    console.log('instagramProfilePicHd:', profileData.instagramProfilePicHd);
    
    // Check if we need to update the profile
    console.log('\n=== RECOMMENDATIONS ===');
    if (!hasInstagramUsername) {
      console.log('1. Set instagramUsername field');
    }
    if (!statsCondition) {
      console.log('2. Ensure at least one of followers, postsCount, or following is > 0');
    }
    
    console.log('\n=== CURRENT PROFILE SUMMARY ===');
    console.log(`Instagram Username: ${profileData.instagramUsername || 'NOT SET'}`);
    console.log(`Followers: ${profileData.followers || 0}`);
    console.log(`Posts: ${profileData.postsCount || 0}`);
    console.log(`Following: ${profileData.following || 0}`);
    console.log(`Will Display: ${finalCondition ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error checking profile data:', error);
  }
}

// Run the function
checkCurrentProfileData()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });