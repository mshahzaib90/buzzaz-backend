const { admin, db } = require('./config/firebase.js');

async function checkUserData() {
  try {
    console.log('🔍 Searching for user: mdshahzaib@gmail.com');
    console.log('='.repeat(60));

    // Search in users collection
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'mdshahzaib@gmail.com')
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No user found with email: mdshahzaib@gmail.com');
      
      // Let's also check all users to see what emails exist
      console.log('\n📋 Checking all users in database...');
      const allUsersSnapshot = await db.collection('users').get();
      console.log(`Total users found: ${allUsersSnapshot.size}`);
      
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`- User ID: ${doc.id}, Email: ${userData.email || 'No email'}`);
      });
      
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} user(s) with this email`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log('\n👤 USER DATA:');
      console.log('-'.repeat(40));
      console.log(`User ID: ${userId}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Role: ${userData.role}`);
      console.log(`Created: ${userData.createdAt?.toDate?.() || userData.createdAt}`);
      console.log(`Full Name: ${userData.fullName || 'Not set'}`);

      // Check for influencer profile
      console.log('\n📊 INFLUENCER PROFILE DATA:');
      console.log('-'.repeat(40));
      
      const profileSnapshot = await db.collection('influencers')
        .where('userId', '==', userId)
        .get();

      if (profileSnapshot.empty) {
        console.log('❌ No influencer profile found for this user');
      } else {
        profileSnapshot.forEach(profileDoc => {
          const profileData = profileDoc.data();
          console.log(`Profile ID: ${profileDoc.id}`);
          console.log(`Instagram Username: ${profileData.instagramUsername || 'Not set'}`);
          console.log(`Full Name: ${profileData.fullName || 'Not set'}`);
          console.log(`Bio: ${profileData.bio || 'Not set'}`);
          console.log(`Location: ${profileData.location || 'Not set'}`);
          console.log(`Categories: ${JSON.stringify(profileData.categories || [])}`);
          console.log(`Followers Count: ${profileData.followersCount || 'Not set'}`);
          console.log(`Following Count: ${profileData.followingCount || 'Not set'}`);
          console.log(`Posts Count: ${profileData.postsCount || 'Not set'}`);
          console.log(`Is Verified: ${profileData.isVerified || false}`);
          console.log(`Profile Created: ${profileData.createdAt?.toDate?.() || profileData.createdAt}`);
          console.log(`Last Updated: ${profileData.updatedAt?.toDate?.() || profileData.updatedAt}`);
        });
      }

      // Check for Instagram data
      console.log('\n📸 INSTAGRAM DATA:');
      console.log('-'.repeat(40));
      
      const instagramSnapshot = await db.collection('instagram_data')
        .where('userId', '==', userId)
        .get();

      if (instagramSnapshot.empty) {
        console.log('❌ No Instagram data found for this user');
      } else {
        console.log(`✅ Found ${instagramSnapshot.size} Instagram data record(s)`);
        
        instagramSnapshot.forEach(igDoc => {
          const igData = igDoc.data();
          console.log(`\nInstagram Record ID: ${igDoc.id}`);
          console.log(`Username: ${igData.username || 'Not set'}`);
          console.log(`Profile URL: ${igData.profileUrl || 'Not set'}`);
          console.log(`Bio: ${igData.bio || 'Not set'}`);
          console.log(`Followers: ${igData.followersCount || 'Not set'}`);
          console.log(`Following: ${igData.followingCount || 'Not set'}`);
          console.log(`Posts: ${igData.postsCount || 'Not set'}`);
          console.log(`Is Private: ${igData.isPrivate || false}`);
          console.log(`Is Verified: ${igData.isVerified || false}`);
          console.log(`Last Fetched: ${igData.lastFetched?.toDate?.() || igData.lastFetched}`);
          
          // Check reels data
          if (igData.reels && igData.reels.length > 0) {
            console.log(`\n🎬 REELS DATA (${igData.reels.length} reels):`);
            igData.reels.forEach((reel, index) => {
              console.log(`  Reel ${index + 1}:`);
              console.log(`    - ID: ${reel.id || 'No ID'}`);
              console.log(`    - URL: ${reel.url || 'No URL'}`);
              console.log(`    - Display URL: ${reel.displayUrl || 'No display URL'}`);
              console.log(`    - Caption: ${reel.caption ? reel.caption.substring(0, 100) + '...' : 'No caption'}`);
              console.log(`    - Likes: ${reel.likesCount || 0}`);
              console.log(`    - Comments: ${reel.commentsCount || 0}`);
              console.log(`    - Views: ${reel.videoViewCount || 0}`);
              console.log(`    - Timestamp: ${reel.timestamp || 'No timestamp'}`);
            });
          } else {
            console.log('❌ No reels data found');
          }
        });
      }

      // Check for any other collections that might contain user data
      console.log('\n🔍 CHECKING OTHER COLLECTIONS:');
      console.log('-'.repeat(40));
      
      // Check user_profiles collection
      const userProfilesSnapshot = await db.collection('user_profiles')
        .where('userId', '==', userId)
        .get();
      
      if (!userProfilesSnapshot.empty) {
        console.log(`✅ Found data in user_profiles collection (${userProfilesSnapshot.size} records)`);
        userProfilesSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`Profile ID: ${doc.id}`);
          console.log(`Instagram Username: ${data.instagramUsername || 'Not set'}`);
        });
      } else {
        console.log('❌ No data in user_profiles collection');
      }

      // Check social_connections collection
      const socialConnectionsSnapshot = await db.collection('social_connections')
        .where('userId', '==', userId)
        .get();
      
      if (!socialConnectionsSnapshot.empty) {
        console.log(`✅ Found data in social_connections collection (${socialConnectionsSnapshot.size} records)`);
        socialConnectionsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`Connection ID: ${doc.id}`);
          console.log(`Platform: ${data.platform || 'Not set'}`);
          console.log(`Username: ${data.username || 'Not set'}`);
        });
      } else {
        console.log('❌ No data in social_connections collection');
      }
    }

  } catch (error) {
    console.error('❌ Error checking user data:', error);
  }
}

checkUserData();