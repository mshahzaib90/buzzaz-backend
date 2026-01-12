const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixProfileLinking() {
  console.log('=== FIXING PROFILE LINKING ===');
  
  try {
    // 1. Find the target user
    const targetUserQuery = await db.collection('users')
      .where('email', '==', 'mdshahzaib@gmail.com')
      .get();
    
    if (targetUserQuery.empty) {
      console.log('Target user not found!');
      return;
    }
    
    const targetUser = targetUserQuery.docs[0];
    const targetUserId = targetUser.id;
    const targetUserData = targetUser.data();
    
    console.log(`Found target user: ${targetUserId} (${targetUserData.email})`);
    
    // 2. Find all bismakhannn profiles
    const bismakhannQuery = await db.collection('influencers')
      .where('instagramUsername', '==', 'bismakhannn')
      .get();
    
    console.log(`Found ${bismakhannQuery.size} bismakhannn profiles`);
    
    if (bismakhannQuery.empty) {
      console.log('No bismakhannn profiles found!');
      return;
    }
    
    // 3. Display all bismakhannn profiles
    let correctProfile = null;
    let duplicateProfiles = [];
    
    bismakhannQuery.forEach(doc => {
      const profileData = doc.data();
      console.log(`\nProfile ID: ${doc.id}`);
      console.log(`Current User ID: ${profileData.userId}`);
      console.log(`Instagram Username: ${profileData.instagramUsername}`);
      console.log(`Posts Count: ${profileData.postsCount}`);
      console.log(`Followers: ${profileData.followers}`);
      console.log(`Following: ${profileData.following}`);
      console.log(`Bio: ${profileData.bio}`);
      console.log(`Full Name: ${profileData.fullName}`);
      
      // Choose the profile with the most complete data
      if (!correctProfile || (profileData.postsCount > 0 && profileData.followers > 0)) {
        if (correctProfile) {
          duplicateProfiles.push(correctProfile);
        }
        correctProfile = { id: doc.id, data: profileData };
      } else {
        duplicateProfiles.push({ id: doc.id, data: profileData });
      }
    });
    
    if (!correctProfile) {
      console.log('No suitable profile found to link!');
      return;
    }
    
    console.log(`\nSelected profile to link: ${correctProfile.id}`);
    console.log(`Duplicate profiles to handle: ${duplicateProfiles.length}`);
    
    // 4. Update the correct profile to link it to the target user
    console.log('\n=== LINKING PROFILE TO USER ===');
    await db.collection('influencers').doc(correctProfile.id).update({
      userId: targetUserId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Successfully linked profile ${correctProfile.id} to user ${targetUserId}`);
    
    // 5. Handle duplicate profiles
    console.log('\n=== HANDLING DUPLICATE PROFILES ===');
    for (const duplicate of duplicateProfiles) {
      console.log(`Duplicate profile: ${duplicate.id}`);
      console.log(`Current userId: ${duplicate.data.userId}`);
      
      // If the duplicate has no userId or is linked to a non-existent user, we can safely remove it
      if (!duplicate.data.userId || duplicate.data.userId === 'undefined') {
        console.log(`Removing orphaned duplicate profile: ${duplicate.id}`);
        await db.collection('influencers').doc(duplicate.id).delete();
        console.log(`Deleted duplicate profile: ${duplicate.id}`);
      } else {
        // Check if the linked user exists
        try {
          const linkedUserDoc = await db.collection('users').doc(duplicate.data.userId).get();
          if (!linkedUserDoc.exists) {
            console.log(`Removing duplicate profile with non-existent user: ${duplicate.id}`);
            await db.collection('influencers').doc(duplicate.id).delete();
            console.log(`Deleted duplicate profile: ${duplicate.id}`);
          } else {
            console.log(`Keeping duplicate profile ${duplicate.id} as it's linked to existing user ${duplicate.data.userId}`);
          }
        } catch (error) {
          console.log(`Error checking user for duplicate profile ${duplicate.id}:`, error.message);
        }
      }
    }
    
    // 6. Verify the fix
    console.log('\n=== VERIFYING THE FIX ===');
    const verifyQuery = await db.collection('influencers')
      .where('userId', '==', targetUserId)
      .get();
    
    if (!verifyQuery.empty) {
      const linkedProfile = verifyQuery.docs[0];
      const linkedData = linkedProfile.data();
      console.log('✅ SUCCESS! Profile linked successfully:');
      console.log(`Profile ID: ${linkedProfile.id}`);
      console.log(`User ID: ${linkedData.userId}`);
      console.log(`Instagram Username: ${linkedData.instagramUsername}`);
      console.log(`Posts Count: ${linkedData.postsCount}`);
      console.log(`Followers: ${linkedData.followers}`);
    } else {
      console.log('❌ FAILED! No profile found for target user after linking');
    }
    
  } catch (error) {
    console.error('Error fixing profile linking:', error);
  }
}

fixProfileLinking().then(() => {
  console.log('\n=== PROFILE LINKING FIX COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});