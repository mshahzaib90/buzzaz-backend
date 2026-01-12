const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugCurrentUserProfile() {
  try {
    console.log('=== DEBUGGING CURRENT USER PROFILE ISSUE ===');
    
    // We found that there are 2 bismakhannn profiles:
    // ID: Lwb2si8ZmHLPSZoCpcMM (no associated user email found)
    // ID: lllGdq8BBRZQQOCIWuWC (mdshahzaib@gmail.com)
    
    const profile1Id = 'Lwb2si8ZmHLPSZoCpcMM';
    const profile2Id = 'lllGdq8BBRZQQOCIWuWC';
    
    console.log('\n=== PROFILE 1 ANALYSIS ===');
    console.log(`Profile ID: ${profile1Id}`);
    
    // Check if this ID exists in users collection
    const user1Doc = await db.collection('users').doc(profile1Id).get();
    if (user1Doc.exists) {
      const userData = user1Doc.data();
      console.log('✅ Has user account');
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
    } else {
      console.log('❌ No user account found');
    }
    
    // Check influencer profile
    const profile1Doc = await db.collection('influencers').doc(profile1Id).get();
    if (profile1Doc.exists) {
      const profileData = profile1Doc.data();
      console.log('✅ Has influencer profile');
      console.log(`Instagram: ${profileData.instagramUsername}`);
      console.log(`Posts: ${profileData.postsCount}`);
      console.log(`Followers: ${profileData.followers}`);
      console.log(`Created: ${profileData.createdAt}`);
    }
    
    console.log('\n=== PROFILE 2 ANALYSIS ===');
    console.log(`Profile ID: ${profile2Id}`);
    
    // Check if this ID exists in users collection
    const user2Doc = await db.collection('users').doc(profile2Id).get();
    if (user2Doc.exists) {
      const userData = user2Doc.data();
      console.log('✅ Has user account');
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
    } else {
      console.log('❌ No user account found');
    }
    
    // Check influencer profile
    const profile2Doc = await db.collection('influencers').doc(profile2Id).get();
    if (profile2Doc.exists) {
      const profileData = profile2Doc.data();
      console.log('✅ Has influencer profile');
      console.log(`Instagram: ${profileData.instagramUsername}`);
      console.log(`Posts: ${profileData.postsCount}`);
      console.log(`Followers: ${profileData.followers}`);
      console.log(`Created: ${profileData.createdAt}`);
    }
    
    console.log('\n=== IDENTIFYING THE ISSUE ===');
    
    // The issue is likely that:
    // 1. The frontend is authenticated as one user
    // 2. But that user's profile doesn't have the correct data
    // 3. Or there's a mismatch between user ID and profile ID
    
    console.log('Possible scenarios:');
    console.log('1. Frontend is authenticated as user without proper profile');
    console.log('2. Profile data is being overridden by fallback/default data');
    console.log('3. API is returning wrong profile for the authenticated user');
    
    console.log('\n=== CHECKING FOR SAFRIDIOFFICIALS SOURCE ===');
    
    // Let's check if safridiofficials appears anywhere in the database
    const allInfluencers = await db.collection('influencers').get();
    let foundSafrid = false;
    
    allInfluencers.forEach(doc => {
      const data = doc.data();
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes('safrid')) {
        foundSafrid = true;
        console.log(`Found safrid reference in profile ${doc.id}:`);
        console.log(`Instagram Username: ${data.instagramUsername}`);
        console.log(`Full Name: ${data.fullName}`);
        console.log(`Bio: ${data.bio}`);
      }
    });
    
    if (!foundSafrid) {
      console.log('❌ No safridiofficials data found in database');
      console.log('🔍 This confirms the data is coming from elsewhere:');
      console.log('   - Frontend hardcoded data');
      console.log('   - Browser localStorage/cache');
      console.log('   - APIFY service fallback data');
      console.log('   - Default component state');
    }
    
    console.log('\n=== RECOMMENDED DEBUGGING STEPS ===');
    console.log('1. Open browser developer tools on the dashboard');
    console.log('2. Check localStorage for any cached profile data');
    console.log('3. Check Network tab for API calls to /influencer/:id');
    console.log('4. Check Console for any logged user ID or profile data');
    console.log('5. Clear all browser data and try again');
    
    console.log('\n=== IMMEDIATE FIX ATTEMPT ===');
    console.log('Let\'s try to ensure the correct user has the correct profile...');
    
    // If profile1 has a user account but profile2 doesn't, we might need to swap
    const hasUser1 = user1Doc.exists;
    const hasUser2 = user2Doc.exists;
    
    if (hasUser1 && !hasUser2) {
      console.log('✅ Profile 1 has user account, Profile 2 doesn\'t');
      console.log('The issue might be that Profile 1 is the authenticated user');
      console.log('but the data shows it should be Profile 2');
    } else if (!hasUser1 && hasUser2) {
      console.log('✅ Profile 2 has user account, Profile 1 doesn\'t');
      console.log('Profile 2 should be the authenticated user');
    } else if (hasUser1 && hasUser2) {
      console.log('⚠️ Both profiles have user accounts - this is the problem!');
      console.log('We have duplicate data that needs to be consolidated');
    }
    
  } catch (error) {
    console.error('Error debugging current user profile:', error);
  }
}

debugCurrentUserProfile();