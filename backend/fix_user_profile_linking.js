const { admin, db } = require('./config/firebase');

async function fixUserProfileLinking() {
  try {
    console.log('=== FIXING USER PROFILE LINKING ===');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users:`);
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      });
      console.log(`User ID: ${doc.id}, Email: ${userData.email}, Role: ${userData.role}`);
    });
    
    // Get all influencer profiles
    const profilesSnapshot = await db.collection('influencers').get();
    console.log(`\nFound ${profilesSnapshot.size} influencer profiles:`);
    
    const profiles = [];
    profilesSnapshot.forEach(doc => {
      const profileData = doc.data();
      profiles.push({
        id: doc.id,
        fullName: profileData.fullName,
        email: profileData.email,
        instagramUsername: profileData.instagramUsername,
        youtubeChannelId: profileData.youtubeChannelId,
        tiktokUsername: profileData.tiktokUsername,
        createdAt: profileData.createdAt
      });
      console.log(`Profile ID: ${doc.id}, Name: ${profileData.fullName}, Instagram: ${profileData.instagramUsername || 'None'}`);
    });
    
    console.log('\n=== ANALYSIS ===');
    
    // Find profiles that don't have matching user IDs
    const orphanedProfiles = profiles.filter(profile => 
      !users.some(user => user.id === profile.id)
    );
    
    console.log(`Found ${orphanedProfiles.length} orphaned profiles (profiles without matching user IDs):`);
    orphanedProfiles.forEach(profile => {
      console.log(`- Profile ID: ${profile.id}, Name: ${profile.fullName}, Instagram: ${profile.instagramUsername || 'None'}`);
    });
    
    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => 
      user.role === 'influencer' && !profiles.some(profile => profile.id === user.id)
    );
    
    console.log(`\nFound ${usersWithoutProfiles.length} influencer users without profiles:`);
    usersWithoutProfiles.forEach(user => {
      console.log(`- User ID: ${user.id}, Email: ${user.email}`);
    });
    
    console.log('\n=== RECOMMENDATIONS ===');
    
    if (orphanedProfiles.length > 0 && usersWithoutProfiles.length > 0) {
      console.log('OPTION 1: Link existing profiles to users');
      console.log('You can manually link profiles to users based on email or name matching');
      
      console.log('\nOPTION 2: Create new profile for current user');
      console.log('Create a fresh profile for the current logged-in user');
      
      console.log('\nOPTION 3: Copy profile data to correct user ID');
      console.log('Copy the Instagram-connected profile data to the correct user ID');
    }
    
    // Show the most recent user (likely the current one)
    const mostRecentUser = users.sort((a, b) => 
      new Date(b.lastLoginAt || b.createdAt) - new Date(a.lastLoginAt || a.createdAt)
    )[0];
    
    console.log('\n=== MOST RECENT USER (LIKELY CURRENT) ===');
    console.log(`User ID: ${mostRecentUser.id}`);
    console.log(`Email: ${mostRecentUser.email}`);
    console.log(`Role: ${mostRecentUser.role}`);
    console.log(`Last Login: ${mostRecentUser.lastLoginAt || 'Never'}`);
    
    // Check if this user has a profile
    const hasProfile = profiles.some(profile => profile.id === mostRecentUser.id);
    console.log(`Has Profile: ${hasProfile ? 'Yes' : 'No'}`);
    
    if (!hasProfile && orphanedProfiles.length > 0) {
      console.log('\n=== SUGGESTED FIX ===');
      console.log(`Copy profile data from one of the orphaned profiles to user ${mostRecentUser.id}`);
      console.log('Available profiles to copy from:');
      orphanedProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.fullName} (Instagram: ${profile.instagramUsername || 'None'})`);
      });
    }
    
    console.log('\n=== END ANALYSIS ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserProfileLinking();