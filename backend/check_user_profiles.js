const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserProfiles() {
  try {
    const currentUserEmail = 'new124@gmail.com';
    
    console.log('=== CHECKING ALL PROFILES FOR USER EMAIL ===');
    console.log(`Email: ${currentUserEmail}`);
    
    // Check users collection first
    console.log('\n=== USERS COLLECTION ===');
    const usersSnapshot = await db.collection('users').where('email', '==', currentUserEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with this email in users collection');
    } else {
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`User ID: ${doc.id}`);
        console.log(`Email: ${userData.email}`);
        console.log(`Role: ${userData.role}`);
        console.log(`User Type: ${userData.userType}`);
        console.log(`Created At: ${userData.createdAt}`);
        console.log(`Role Chosen At: ${userData.roleChosenAt}`);
      });
    }
    
    // Check influencers collection for profiles with this email
    console.log('\n=== INFLUENCER PROFILES WITH THIS EMAIL ===');
    const influencersSnapshot = await db.collection('influencers').where('email', '==', currentUserEmail).get();
    
    if (influencersSnapshot.empty) {
      console.log('❌ No influencer profiles found with this email');
    } else {
      influencersSnapshot.forEach(doc => {
        const profileData = doc.data();
        console.log(`\nProfile ID: ${doc.id}`);
        console.log(`Full Name: ${profileData.fullName}`);
        console.log(`Email: ${profileData.email}`);
        console.log(`Instagram Username: ${profileData.instagramUsername}`);
        console.log(`Created At: ${profileData.createdAt}`);
        console.log(`Last Synced At: ${profileData.lastSyncedAt}`);
      });
    }
    
    // Check all profiles that might belong to the current user ID
    console.log('\n=== CHECKING CURRENT USER ID PROFILE ===');
    const currentUserId = 'ikGacihCCEDUvZt93wbD';
    const currentProfileDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (currentProfileDoc.exists) {
      const profileData = currentProfileDoc.data();
      console.log(`Profile ID: ${currentUserId}`);
      console.log(`Full Name: ${profileData.fullName}`);
      console.log(`Email: ${profileData.email}`);
      console.log(`Instagram Username: ${profileData.instagramUsername}`);
      console.log(`Created At: ${profileData.createdAt}`);
      console.log(`User ID field: ${profileData.userId}`);
    } else {
      console.log('❌ No profile found for current user ID');
    }
    
    // Check the signupuser profile that was created around the same time
    console.log('\n=== CHECKING SIGNUPUSER PROFILE ===');
    const signupUserSnapshot = await db.collection('influencers').where('instagramUsername', '==', 'signupuser').get();
    
    if (!signupUserSnapshot.empty) {
      signupUserSnapshot.forEach(doc => {
        const profileData = doc.data();
        console.log(`Profile ID: ${doc.id}`);
        console.log(`Full Name: ${profileData.fullName}`);
        console.log(`Email: ${profileData.email}`);
        console.log(`Instagram Username: ${profileData.instagramUsername}`);
        console.log(`Followers: ${profileData.followers}`);
        console.log(`Posts: ${profileData.postsCount}`);
        console.log(`Following: ${profileData.following}`);
        console.log(`Created At: ${profileData.createdAt}`);
        console.log(`User ID field: ${profileData.userId}`);
      });
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log('It appears the profile creation process may have created test data instead of using the real Instagram connection from signup.');
    console.log('The @signupuser profile might be the real one that should be associated with this user.');
    
    console.log('\n=== END ANALYSIS ===');
    
  } catch (error) {
    console.error('❌ Error checking user profiles:', error);
  }
}

// Run the function
checkUserProfiles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });