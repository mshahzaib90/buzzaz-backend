const { admin, db } = require('./config/firebase');

async function findInstagramProfiles() {
  try {
    console.log('=== FINDING INSTAGRAM CONNECTED PROFILES ===');
    
    // Get all profiles with Instagram usernames
    const profilesSnapshot = await db.collection('influencers')
      .where('instagramUsername', '!=', '')
      .get();
    
    console.log(`Found ${profilesSnapshot.size} profiles with Instagram connections:`);
    
    const instagramProfiles = [];
    profilesSnapshot.forEach(doc => {
      const profileData = doc.data();
      instagramProfiles.push({
        id: doc.id,
        fullName: profileData.fullName,
        email: profileData.email,
        instagramUsername: profileData.instagramUsername,
        followers: profileData.followers,
        postsCount: profileData.postsCount,
        following: profileData.following,
        createdAt: profileData.createdAt,
        lastSyncedAt: profileData.lastSyncedAt
      });
    });
    
    // Sort by creation date (most recent first)
    instagramProfiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    instagramProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profile ID: ${profile.id}`);
      console.log(`   Full Name: ${profile.fullName || 'N/A'}`);
      console.log(`   Email: ${profile.email || 'N/A'}`);
      console.log(`   Instagram: @${profile.instagramUsername}`);
      console.log(`   Followers: ${profile.followers || 0}`);
      console.log(`   Posts: ${profile.postsCount || 0}`);
      console.log(`   Following: ${profile.following || 0}`);
      console.log(`   Created: ${profile.createdAt}`);
      console.log(`   Last Synced: ${profile.lastSyncedAt || 'Never'}`);
    });
    
    // Check if any of these profiles might belong to the current user
    console.log('\n=== ANALYSIS ===');
    console.log('Current user ID: X0IqcgoiqNm6OgOKKKT1');
    console.log('Current user email: new@hello.com');
    
    const possibleMatches = instagramProfiles.filter(profile => 
      profile.email === 'new@hello.com' || 
      profile.fullName?.toLowerCase().includes('new') ||
      profile.id === 'X0IqcgoiqNm6OgOKKKT1'
    );
    
    if (possibleMatches.length > 0) {
      console.log('\nPossible matches for current user:');
      possibleMatches.forEach(profile => {
        console.log(`- ${profile.id}: @${profile.instagramUsername} (${profile.fullName})`);
      });
    } else {
      console.log('\nNo obvious matches found for current user.');
      console.log('The Instagram connection might have been lost or failed during signup.');
    }
    
    // Show the most recent Instagram profiles (likely recent signups)
    console.log('\n=== MOST RECENT INSTAGRAM PROFILES ===');
    const recentProfiles = instagramProfiles.slice(0, 3);
    recentProfiles.forEach(profile => {
      console.log(`${profile.id}: @${profile.instagramUsername} (Created: ${profile.createdAt})`);
    });
    
    console.log('\n=== END ANALYSIS ===');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findInstagramProfiles();