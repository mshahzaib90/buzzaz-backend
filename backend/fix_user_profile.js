const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixUserProfile() {
  try {
    console.log('=== FIXING USER PROFILE ISSUE ===');
    
    const currentUserId = 'Lwb2si8ZmHLPSZoCpcMM'; // User currently logged in
    const dataUserId = 'ikGacihCCEDUvZt93wbD'; // User with the data
    
    console.log('\n=== OPTION 1: COPY PROFILE DATA TO CURRENT USER ===');
    
    // Get the profile data from the user who has it
    const sourceProfileDoc = await db.collection('influencers').doc(dataUserId).get();
    
    if (!sourceProfileDoc.exists) {
      console.log('❌ Source profile does not exist');
      return;
    }
    
    const sourceProfileData = sourceProfileDoc.data();
    console.log('✅ Found source profile data');
    console.log('Source profile:', {
      fullName: sourceProfileData.fullName,
      instagramUsername: sourceProfileData.instagramUsername,
      followers: sourceProfileData.followers,
      youtubeChannelId: sourceProfileData.youtubeChannelId
    });
    
    // Check if current user already has a profile
    const currentProfileDoc = await db.collection('influencers').doc(currentUserId).get();
    
    if (currentProfileDoc.exists) {
      console.log('⚠️ Current user already has a profile');
      const currentData = currentProfileDoc.data();
      console.log('Current profile:', {
        fullName: currentData.fullName,
        instagramUsername: currentData.instagramUsername,
        followers: currentData.followers
      });
      
      console.log('\n=== UPDATING EXISTING PROFILE ===');
      // Update the existing profile with the data
      await db.collection('influencers').doc(currentUserId).update({
        instagramUsername: sourceProfileData.instagramUsername,
        followers: sourceProfileData.followers || 0,
        following: sourceProfileData.following || 0,
        postsCount: sourceProfileData.postsCount || 0,
        engagementRate: sourceProfileData.engagementRate || 0,
        youtubeChannelId: sourceProfileData.youtubeChannelId,
        youtubeChannelTitle: sourceProfileData.youtubeChannelTitle,
        youtubeChannelUrl: sourceProfileData.youtubeChannelUrl,
        tiktokUsername: sourceProfileData.tiktokUsername,
        tiktokFollowers: sourceProfileData.tiktokFollowers,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Profile updated successfully');
      
    } else {
      console.log('✅ Current user has no profile, creating new one');
      
      // Create a new profile for the current user
      const newProfileData = {
        ...sourceProfileData,
        userId: currentUserId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('influencers').doc(currentUserId).set(newProfileData);
      console.log('✅ New profile created successfully');
    }
    
    // Copy stats history if it exists
    console.log('\n=== COPYING STATS HISTORY ===');
    const sourceStatsSnapshot = await db.collection('influencers')
      .doc(dataUserId)
      .collection('stats')
      .get();
    
    if (!sourceStatsSnapshot.empty) {
      console.log(`Found ${sourceStatsSnapshot.docs.length} stats records to copy`);
      
      const batch = db.batch();
      sourceStatsSnapshot.docs.forEach(doc => {
        const statsData = doc.data();
        const newStatsRef = db.collection('influencers')
          .doc(currentUserId)
          .collection('stats')
          .doc(doc.id);
        batch.set(newStatsRef, statsData);
      });
      
      await batch.commit();
      console.log('✅ Stats history copied successfully');
    } else {
      console.log('ℹ️ No stats history to copy');
    }
    
    // Verify the fix
    console.log('\n=== VERIFYING THE FIX ===');
    const verifyDoc = await db.collection('influencers').doc(currentUserId).get();
    if (verifyDoc.exists) {
      const verifyData = verifyDoc.data();
      console.log('✅ Verification successful');
      console.log('Current user now has:');
      console.log('- Instagram Username:', verifyData.instagramUsername);
      console.log('- Followers:', verifyData.followers);
      console.log('- YouTube Channel ID:', verifyData.youtubeChannelId);
      console.log('- TikTok Username:', verifyData.tiktokUsername);
    } else {
      console.log('❌ Verification failed - profile not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing user profile:', error);
  }
}

// Run the function
fixUserProfile()
  .then(() => {
    console.log('\n✅ User profile fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User profile fix failed:', error);
    process.exit(1);
  });