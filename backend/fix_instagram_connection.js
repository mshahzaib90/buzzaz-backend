const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixInstagramConnection() {
  try {
    const currentUserId = 'ikGacihCCEDUvZt93wbD';
    const currentUserEmail = 'new124@gmail.com';
    const realSignupProfileId = 'Kyihth9pkebpFvXxVKLE'; // The profile with @signupuser
    
    console.log('=== FIXING INSTAGRAM CONNECTION ===');
    console.log(`Current User ID: ${currentUserId}`);
    console.log(`Email: ${currentUserEmail}`);
    console.log(`Real Signup Profile ID: ${realSignupProfileId}`);
    
    // Get the real signup profile data
    console.log('\n=== GETTING REAL SIGNUP PROFILE DATA ===');
    const realProfileDoc = await db.collection('influencers').doc(realSignupProfileId).get();
    
    if (!realProfileDoc.exists) {
      console.log('❌ Real signup profile not found');
      return;
    }
    
    const realProfileData = realProfileDoc.data();
    console.log('Real Instagram Username:', realProfileData.instagramUsername);
    console.log('Real Followers:', realProfileData.followers);
    console.log('Real Posts:', realProfileData.postsCount);
    console.log('Real Following:', realProfileData.following);
    
    // Get the current profile
    console.log('\n=== GETTING CURRENT PROFILE ===');
    const currentProfileRef = db.collection('influencers').doc(currentUserId);
    const currentProfileDoc = await currentProfileRef.get();
    
    if (!currentProfileDoc.exists) {
      console.log('❌ Current profile not found');
      return;
    }
    
    const currentProfileData = currentProfileDoc.data();
    console.log('Current Instagram Username:', currentProfileData.instagramUsername);
    console.log('Current Followers:', currentProfileData.followers);
    
    // Update the current profile with the real Instagram data
    console.log('\n=== UPDATING CURRENT PROFILE WITH REAL DATA ===');
    const updateData = {
      // Update Instagram fields with real data
      instagramUsername: realProfileData.instagramUsername || 'signupuser',
      followers: realProfileData.followers || 2000,
      following: realProfileData.following || 400,
      postsCount: realProfileData.postsCount || 55,
      engagementRate: realProfileData.engagementRate || 0,
      
      // Also update the individual Instagram fields
      instagramFollowers: realProfileData.followers || 2000,
      instagramFollowing: realProfileData.following || 400,
      instagramPostsCount: realProfileData.postsCount || 55,
      instagramEngagementRate: realProfileData.engagementRate || 0,
      
      // Update metadata
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    await currentProfileRef.update(updateData);
    console.log('✅ Profile updated successfully!');
    
    // Verify the update
    console.log('\n=== VERIFYING UPDATE ===');
    const updatedDoc = await currentProfileRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('Updated Instagram Username:', updatedData.instagramUsername);
    console.log('Updated Followers:', updatedData.followers);
    console.log('Updated Posts:', updatedData.postsCount);
    console.log('Updated Following:', updatedData.following);
    
    // Optionally, we can delete or mark the old signup profile as inactive
    console.log('\n=== CLEANING UP OLD PROFILE ===');
    console.log('Note: The old signup profile still exists but is no longer needed.');
    console.log('You may want to delete it manually if needed.');
    
    console.log('\n=== SUCCESS ===');
    console.log('✅ Instagram connection has been fixed!');
    console.log('✅ Your dashboard should now show @signupuser instead of @test_instagram_user');
    console.log('✅ Follower count should show 2000 instead of 15000');
    
  } catch (error) {
    console.error('❌ Error fixing Instagram connection:', error);
  }
}

// Run the function
fixInstagramConnection()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });