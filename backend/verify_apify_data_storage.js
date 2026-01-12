const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function verifyApifyDataStorage() {
  try {
    console.log('=== VERIFYING APIFY DATA STORAGE ===');
    
    // Get all influencer profiles
    console.log('\n=== GETTING ALL INFLUENCER PROFILES ===');
    const influencersSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${influencersSnapshot.size} influencer profiles`);
    
    let profilesWithInstagram = 0;
    let profilesWithTikTok = 0;
    let profilesWithYouTube = 0;
    let profilesWithApifyData = 0;
    
    for (const doc of influencersSnapshot.docs) {
      const data = doc.data();
      const profileId = doc.id;
      
      console.log(`\n--- Profile: ${profileId} ---`);
      console.log(`Full Name: ${data.fullName || 'N/A'}`);
      console.log(`Created At: ${data.createdAt || 'N/A'}`);
      
      // Check Instagram data
      if (data.instagramUsername) {
        profilesWithInstagram++;
        console.log(`✅ Instagram: @${data.instagramUsername}`);
        console.log(`   Followers: ${data.followers || 0}`);
        console.log(`   Following: ${data.following || 0}`);
        console.log(`   Posts: ${data.postsCount || 0}`);
        console.log(`   Engagement Rate: ${data.engagementRate || 0}%`);
        console.log(`   Avatar URL: ${data.avatarUrl ? 'Yes' : 'No'}`);
        console.log(`   Verified: ${data.isVerified ? 'Yes' : 'No'}`);
        console.log(`   Private: ${data.isPrivate ? 'Yes' : 'No'}`);
        
        // Check if this looks like real APIFY data (not test data)
        if (data.followers > 0 && data.instagramUsername !== 'test_instagram_user') {
          profilesWithApifyData++;
          console.log(`   ✅ Has real APIFY data`);
        } else {
          console.log(`   ⚠️  Has test/default data`);
        }
      } else {
        console.log(`❌ No Instagram connection`);
      }
      
      // Check TikTok data
      if (data.tiktokUsername) {
        profilesWithTikTok++;
        console.log(`✅ TikTok: @${data.tiktokUsername}`);
        console.log(`   Followers: ${data.tiktokFollowers || 0}`);
        console.log(`   Following: ${data.tiktokFollowing || 0}`);
        console.log(`   Videos: ${data.tiktokVideosCount || 0}`);
        console.log(`   Total Likes: ${data.tiktokTotalLikes || 0}`);
        console.log(`   Engagement Rate: ${data.tiktokEngagementRate || 0}%`);
      } else {
        console.log(`❌ No TikTok connection`);
      }
      
      // Check YouTube data
      if (data.youtubeChannelId) {
        profilesWithYouTube++;
        console.log(`✅ YouTube: ${data.youtubeChannelTitle || 'N/A'}`);
        console.log(`   Channel ID: ${data.youtubeChannelId}`);
        console.log(`   Channel URL: ${data.youtubeChannelUrl || 'N/A'}`);
      } else {
        console.log(`❌ No YouTube connection`);
      }
      
      // Check for stats snapshots
      console.log(`\n--- Checking Stats Snapshots for ${profileId} ---`);
      const statsSnapshot = await db.collection('influencers')
        .doc(profileId)
        .collection('stats')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
      
      if (statsSnapshot.empty) {
        console.log(`❌ No stats snapshots found`);
      } else {
        console.log(`✅ Found ${statsSnapshot.size} stats snapshots`);
        statsSnapshot.docs.forEach((statDoc, index) => {
          const statData = statDoc.data();
          console.log(`   Snapshot ${index + 1}:`);
          console.log(`     Timestamp: ${statData.timestamp}`);
          console.log(`     Followers: ${statData.followers || 0}`);
          console.log(`     Posts: ${statData.postsCount || 0}`);
          console.log(`     Engagement: ${statData.engagementRate || 0}%`);
          console.log(`     Has Raw APIFY Response: ${statData.rawApifyResponse ? 'Yes' : 'No'}`);
        });
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Profiles: ${influencersSnapshot.size}`);
    console.log(`Profiles with Instagram: ${profilesWithInstagram}`);
    console.log(`Profiles with TikTok: ${profilesWithTikTok}`);
    console.log(`Profiles with YouTube: ${profilesWithYouTube}`);
    console.log(`Profiles with Real APIFY Data: ${profilesWithApifyData}`);
    
    console.log('\n=== CHECKING SPECIFIC USER PROFILE ===');
    const specificUserId = 'ikGacihCCEDUvZt93wbD'; // The user we fixed earlier
    const specificUserDoc = await db.collection('influencers').doc(specificUserId).get();
    
    if (specificUserDoc.exists) {
      const userData = specificUserDoc.data();
      console.log(`User ${specificUserId} profile:`);
      console.log(`Instagram: @${userData.instagramUsername}`);
      console.log(`Followers: ${userData.followers}`);
      console.log(`Following: ${userData.following}`);
      console.log(`Posts: ${userData.postsCount}`);
      console.log(`Last Synced: ${userData.lastSyncedAt}`);
      
      // Check if this matches our fix
      if (userData.instagramUsername === 'signupuser' && userData.followers === 2000) {
        console.log('✅ Profile shows the corrected data from our fix');
      } else {
        console.log('⚠️  Profile may not have the corrected data');
      }
    } else {
      console.log('❌ Specific user profile not found');
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (profilesWithApifyData === 0) {
      console.log('⚠️  No profiles have real APIFY data. This suggests:');
      console.log('   1. APIFY integration may not be working properly');
      console.log('   2. All profiles are using test/default data');
      console.log('   3. Social media connections during signup may not be saving APIFY responses');
    } else {
      console.log(`✅ ${profilesWithApifyData} profiles have real APIFY data`);
    }
    
    if (profilesWithInstagram > profilesWithApifyData) {
      console.log('⚠️  Some Instagram profiles lack real APIFY data');
      console.log('   Consider re-syncing these profiles with APIFY');
    }
    
  } catch (error) {
    console.error('❌ Error verifying APIFY data storage:', error);
  }
}

// Run the function
verifyApifyDataStorage()
  .then(() => {
    console.log('\n✅ Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });