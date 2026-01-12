const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixDashboardUserIssue() {
  try {
    console.log('=== FIXING DASHBOARD USER ISSUE ===');
    
    // Based on our investigation, we know:
    // 1. Dashboard shows @safridiofficials with 0 posts
    // 2. Backend has bismakhannn with 125 posts
    // 3. We need to find which user is currently authenticated
    
    console.log('\n=== STEP 1: FIND ALL USERS WITH PROFILES ===');
    const usersSnapshot = await db.collection('users').get();
    const influencersSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${usersSnapshot.size} users and ${influencersSnapshot.size} influencer profiles`);
    
    // Create a map of user emails to their profile data
    const userProfiles = new Map();
    
    // Get all users
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      userProfiles.set(doc.id, {
        userId: doc.id,
        email: userData.email,
        role: userData.role,
        displayName: userData.displayName,
        profile: null
      });
    });
    
    // Match with influencer profiles
    influencersSnapshot.forEach(doc => {
      const profileData = doc.data();
      if (userProfiles.has(doc.id)) {
        const userInfo = userProfiles.get(doc.id);
        userInfo.profile = {
          instagramUsername: profileData.instagramUsername,
          followers: profileData.followers,
          postsCount: profileData.postsCount,
          following: profileData.following
        };
      }
    });
    
    console.log('\n=== STEP 2: LIST ALL USER-PROFILE COMBINATIONS ===');
    for (const [userId, userInfo] of userProfiles) {
      if (userInfo.profile) {
        console.log(`User ID: ${userId}`);
        console.log(`  Email: ${userInfo.email}`);
        console.log(`  Role: ${userInfo.role}`);
        console.log(`  Instagram: @${userInfo.profile.instagramUsername}`);
        console.log(`  Posts: ${userInfo.profile.postsCount}`);
        console.log(`  Followers: ${userInfo.profile.followers}`);
        console.log('---');
      }
    }
    
    console.log('\n=== STEP 3: IDENTIFY THE ISSUE ===');
    
    // Find the user with bismakhannn profile (125 posts)
    let bismakhannUser = null;
    let safridUser = null;
    
    for (const [userId, userInfo] of userProfiles) {
      if (userInfo.profile) {
        if (userInfo.profile.instagramUsername === 'bismakhannn' && userInfo.profile.postsCount === 125) {
          bismakhannUser = { userId, ...userInfo };
        }
        if (userInfo.profile.instagramUsername === 'safridiofficials') {
          safridUser = { userId, ...userInfo };
        }
      }
    }
    
    if (bismakhannUser) {
      console.log('✅ Found bismakhannn user with 125 posts:');
      console.log(`  User ID: ${bismakhannUser.userId}`);
      console.log(`  Email: ${bismakhannUser.email}`);
    } else {
      console.log('❌ Could not find bismakhannn user with 125 posts');
    }
    
    if (safridUser) {
      console.log('✅ Found safridiofficials user:');
      console.log(`  User ID: ${safridUser.userId}`);
      console.log(`  Email: ${safridUser.email}`);
      console.log(`  Posts: ${safridUser.profile.postsCount}`);
    } else {
      console.log('❌ Could not find safridiofficials user');
    }
    
    console.log('\n=== STEP 4: CHECK AUTHENTICATION TOKENS ===');
    // Since we can't directly check the frontend token, let's look for clues
    // in the user data that might indicate which user should be authenticated
    
    // Look for recent activity or specific patterns
    const recentUsers = [];
    for (const [userId, userInfo] of userProfiles) {
      if (userInfo.email && userInfo.role === 'influencer') {
        recentUsers.push({
          userId,
          email: userInfo.email,
          profile: userInfo.profile
        });
      }
    }
    
    console.log('Recent influencer users:');
    recentUsers.forEach(user => {
      console.log(`  ${user.email} (${user.userId}) - Instagram: ${user.profile?.instagramUsername || 'None'}`);
    });
    
    console.log('\n=== STEP 5: PROPOSED SOLUTION ===');
    console.log('Based on the investigation:');
    console.log('1. The dashboard is showing data for the wrong user');
    console.log('2. We need to ensure the correct user is authenticated');
    console.log('3. The bismakhannn profile with 125 posts should be displayed');
    
    if (bismakhannUser) {
      console.log('\n=== RECOMMENDED ACTION ===');
      console.log(`The user with email "${bismakhannUser.email}" has the correct bismakhannn profile.`);
      console.log('To fix this issue:');
      console.log('1. Ensure this user is properly authenticated in the frontend');
      console.log('2. Check that the JWT token corresponds to this user ID');
      console.log('3. Verify the AuthContext is using the correct user data');
      
      // Let's also check if there are any duplicate profiles
      console.log('\n=== CHECKING FOR DUPLICATE PROFILES ===');
      const bismakhannProfiles = [];
      influencersSnapshot.forEach(doc => {
        const profileData = doc.data();
        if (profileData.instagramUsername === 'bismakhannn') {
          bismakhannProfiles.push({
            id: doc.id,
            postsCount: profileData.postsCount,
            followers: profileData.followers
          });
        }
      });
      
      console.log(`Found ${bismakhannProfiles.length} bismakhannn profiles:`);
      bismakhannProfiles.forEach(profile => {
        console.log(`  ID: ${profile.id}, Posts: ${profile.postsCount}, Followers: ${profile.followers}`);
      });
      
      if (bismakhannProfiles.length > 1) {
        console.log('⚠️  Multiple bismakhannn profiles found - this might be causing confusion');
      }
    }
    
  } catch (error) {
    console.error('Error fixing dashboard user issue:', error);
  }
}

fixDashboardUserIssue();