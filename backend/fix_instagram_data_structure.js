  const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixInstagramDataStructure() {
  try {
    const currentUserId = 'X0IqcgoiqNm6OgOKKKT1';
    const currentUserEmail = 'new@hello.com';
    
    console.log(`Fixing Instagram data structure for user: ${currentUserId} (${currentUserEmail})`);
    
    // Get the current user's profile
    const profileRef = db.collection('influencers').doc(currentUserId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      console.log('❌ Profile not found for current user');
      return;
    }
    
    const profileData = profileDoc.data();
    console.log('Current profile Instagram data:', profileData.instagram);
    
    // Extract Instagram data and add the fields the frontend expects
    const instagramData = profileData.instagram;
    
    if (!instagramData || !instagramData.username) {
      console.log('❌ No Instagram data found to fix');
      return;
    }
    
    // Update the profile with the fields the frontend expects
    const updateData = {
      // Keep the existing instagram object
      instagram: instagramData,
      // Add the fields the frontend expects
      instagramUsername: instagramData.username,
      instagramUserId: instagramData.userId,
      followers: instagramData.followers,
      following: instagramData.following,
      postsCount: instagramData.posts,
      isPrivate: false,
      isVerified: false,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await profileRef.update(updateData);
    
    console.log('✅ Successfully updated Instagram data structure');
    console.log('Added frontend-compatible fields:', {
      instagramUsername: updateData.instagramUsername,
      instagramUserId: updateData.instagramUserId,
      followers: updateData.followers,
      following: updateData.following,
      postsCount: updateData.postsCount
    });
    
    // Verify the update
    const updatedDoc = await profileRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('\n=== VERIFICATION ===');
    console.log('instagramUsername:', updatedData.instagramUsername);
    console.log('followers:', updatedData.followers);
    console.log('postsCount:', updatedData.postsCount);
    console.log('following:', updatedData.following);
    console.log('Instagram object:', updatedData.instagram);
    
  } catch (error) {
    console.error('❌ Error fixing Instagram data structure:', error);
  }
}

// Run the function
fixInstagramDataStructure()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });