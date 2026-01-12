require('dotenv').config();
const { admin, db } = require('./config/firebase');

async function checkUserByEmail() {
  const emailArg = process.argv[2] || process.env.CHECK_EMAIL;
  const email = emailArg || 'muhammad.shahzaib@tamatos.com';
  console.log('=== CHECK USER BY EMAIL ===');
  console.log('Email:', email);

  try {
    // Find user document by email
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (usersSnapshot.empty) {
      console.log('❌ No user found in users collection for this email');
      // Also check influencer profiles by email
      const infByEmail = await db.collection('influencers').where('email', '==', email).get();
      if (infByEmail.empty) {
        console.log('❌ No influencer profile found by email');
      } else {
        console.log(`✅ Found ${infByEmail.size} influencer profile(s) by email:`);
        infByEmail.forEach(doc => {
          const data = doc.data();
          console.log(`- Profile ID: ${doc.id}, instagramUsername: ${data.instagramUsername || 'not set'}`);
        });
      }
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    console.log('✅ User found');
    console.log('User ID:', userId);
    console.log('Role:', userData.role);

    // Check influencer document by ID (this is what /user/profile-status and /influencer/profile use)
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    if (influencerDoc.exists) {
      const infData = influencerDoc.data();
      console.log('✅ Influencer profile EXISTS with matching ID');
      console.log('instagramUsername:', infData.instagramUsername || 'not set');
      console.log('followers:', infData.followers || 0);
      console.log('postsCount:', infData.postsCount || 0);
    } else {
      console.log('❌ No influencer profile document with ID equal to user ID');
      // Try to find a profile linked by userId field
      const linkedProfiles = await db.collection('influencers').where('userId', '==', userId).get();
      if (linkedProfiles.empty) {
        console.log('❌ No influencer profiles found with userId field matching');
      } else {
        console.log(`✅ Found ${linkedProfiles.size} influencer profile(s) linked by userId:`);
        linkedProfiles.forEach(doc => {
          const data = doc.data();
          console.log(`- Profile ID: ${doc.id}, instagramUsername: ${data.instagramUsername || 'not set'}`);
        });
        console.log('\nℹ️ Note: The app expects the influencer doc ID to equal the user ID. If linked by userId only, /influencer/profile will 404 and onboarding will be forced.');
      }
    }

    // Simulate profile-status logic
    const hasCompletedProfile = influencerDoc.exists;
    const requiresOnboarding = (userData.role === 'influencer' || userData.role === 'ugc_creator') && !hasCompletedProfile;
    console.log('\n=== PROFILE STATUS (simulated) ===');
    console.log('hasCompletedProfile:', hasCompletedProfile);
    console.log('requiresOnboarding:', requiresOnboarding);

  } catch (err) {
    console.error('Error checking user by email:', err);
  }
}

checkUserByEmail();