const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkHelloworldComplete() {
  try {
    const targetEmail = 'helloworld@gmail.com';
    
    console.log('=== COMPLETE DATA CHECK FOR HELLOWORLD@GMAIL.COM ===');
    console.log(`Target Email: ${targetEmail}`);
    console.log('');
    
    // Check users collection
    console.log('=== USERS COLLECTION ===');
    const usersSnapshot = await db.collection('users').where('email', '==', targetEmail).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with this email');
    } else {
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`✅ User found!`);
        console.log(`User ID: ${doc.id}`);
        console.log(`Email: ${userData.email}`);
        console.log(`Name: ${userData.firstName} ${userData.lastName}`);
        console.log(`Role: ${userData.role}`);
        console.log(`User Type: ${userData.userType}`);
        console.log(`Created At: ${userData.createdAt}`);
      });
    }
    
    // Check influencers collection by email
    console.log('\n=== INFLUENCER PROFILES (by email) ===');
    const influencersByEmail = await db.collection('influencers').where('email', '==', targetEmail).get();
    
    if (influencersByEmail.empty) {
      console.log('❌ No influencer profiles found with this email');
    } else {
      influencersByEmail.forEach(doc => {
        const profileData = doc.data();
        console.log(`✅ Influencer Profile found!`);
        console.log(`Profile ID: ${doc.id}`);
        console.log(`Full Name: ${profileData.fullName}`);
        console.log(`Email: ${profileData.email}`);
        showSocialConnections(profileData);
      });
    }
    
    // Check influencers collection by userId (if user exists)
    if (!usersSnapshot.empty) {
      const userId = usersSnapshot.docs[0].id;
      console.log('\n=== INFLUENCER PROFILES (by userId) ===');
      const influencersByUserId = await db.collection('influencers').where('userId', '==', userId).get();
      
      if (influencersByUserId.empty) {
        console.log('❌ No influencer profiles found with this userId');
      } else {
        influencersByUserId.forEach(doc => {
          const profileData = doc.data();
          console.log(`✅ Influencer Profile found!`);
          console.log(`Profile ID: ${doc.id}`);
          console.log(`Full Name: ${profileData.fullName}`);
          console.log(`Email: ${profileData.email}`);
          showSocialConnections(profileData);
        });
      }
    }
    
    // Check all collections for any reference to this email
    console.log('\n=== SEARCHING ALL COLLECTIONS ===');
    
    // Check Instagram stats
    console.log('\n📸 INSTAGRAM STATS COLLECTION:');
    const instagramStats = await db.collection('instagramStats').get();
    let foundInstagram = false;
    instagramStats.forEach(doc => {
      const data = doc.data();
      if (data.email === targetEmail || data.userEmail === targetEmail) {
        foundInstagram = true;
        console.log(`✅ Instagram stats found: ${data.username || 'Unknown'}`);
        console.log(`  Followers: ${data.followers || 'N/A'}`);
        console.log(`  Following: ${data.following || 'N/A'}`);
        console.log(`  Posts: ${data.posts || 'N/A'}`);
      }
    });
    if (!foundInstagram) console.log('❌ No Instagram stats found');
    
    // Check YouTube stats
    console.log('\n🎥 YOUTUBE STATS COLLECTION:');
    const youtubeStats = await db.collection('youtubeStats').get();
    let foundYoutube = false;
    youtubeStats.forEach(doc => {
      const data = doc.data();
      if (data.email === targetEmail || data.userEmail === targetEmail) {
        foundYoutube = true;
        console.log(`✅ YouTube stats found: ${data.channelTitle || 'Unknown'}`);
        console.log(`  Subscribers: ${data.subscribers || 'N/A'}`);
        console.log(`  Views: ${data.views || 'N/A'}`);
        console.log(`  Videos: ${data.videos || 'N/A'}`);
      }
    });
    if (!foundYoutube) console.log('❌ No YouTube stats found');
    
    // Check TikTok stats
    console.log('\n🎵 TIKTOK STATS COLLECTION:');
    const tiktokStats = await db.collection('tiktokStats').get();
    let foundTiktok = false;
    tiktokStats.forEach(doc => {
      const data = doc.data();
      if (data.email === targetEmail || data.userEmail === targetEmail) {
        foundTiktok = true;
        console.log(`✅ TikTok stats found: ${data.username || 'Unknown'}`);
        console.log(`  Followers: ${data.followers || 'N/A'}`);
        console.log(`  Following: ${data.following || 'N/A'}`);
        console.log(`  Videos: ${data.videos || 'N/A'}`);
      }
    });
    if (!foundTiktok) console.log('❌ No TikTok stats found');
    
    console.log('\n=== SUMMARY ===');
    console.log(`Account: ${targetEmail}`);
    console.log(`User exists: ${!usersSnapshot.empty ? '✅' : '❌'}`);
    console.log(`Influencer profile: ${!influencersByEmail.empty ? '✅' : '❌'}`);
    console.log(`Instagram data: ${foundInstagram ? '✅' : '❌'}`);
    console.log(`YouTube data: ${foundYoutube ? '✅' : '❌'}`);
    console.log(`TikTok data: ${foundTiktok ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('Error checking helloworld account:', error);
  } finally {
    process.exit(0);
  }
}

function showSocialConnections(profileData) {
  // Instagram
  console.log(`\n📸 INSTAGRAM:`);
  if (profileData.instagramUsername) {
    console.log(`  ✅ Connected: @${profileData.instagramUsername}`);
    console.log(`  Followers: ${profileData.instagramFollowers || profileData.followers || 'N/A'}`);
    console.log(`  Following: ${profileData.instagramFollowing || profileData.following || 'N/A'}`);
    console.log(`  Posts: ${profileData.instagramPostsCount || profileData.postsCount || 'N/A'}`);
  } else {
    console.log(`  ❌ Not connected`);
  }
  
  // YouTube
  console.log(`\n🎥 YOUTUBE:`);
  if (profileData.youtubeChannelId) {
    console.log(`  ✅ Connected: ${profileData.youtubeChannelTitle || 'Unknown Channel'}`);
    console.log(`  Channel ID: ${profileData.youtubeChannelId}`);
    console.log(`  Subscribers: ${profileData.youtubeSubscribers || 'N/A'}`);
    console.log(`  Views: ${profileData.youtubeViews || 'N/A'}`);
    console.log(`  Videos: ${profileData.youtubeVideos || 'N/A'}`);
  } else {
    console.log(`  ❌ Not connected`);
  }
  
  // TikTok
  console.log(`\n🎵 TIKTOK:`);
  if (profileData.tiktokUsername) {
    console.log(`  ✅ Connected: @${profileData.tiktokUsername}`);
    console.log(`  Followers: ${profileData.tiktokFollowers || 'N/A'}`);
    console.log(`  Following: ${profileData.tiktokFollowing || 'N/A'}`);
    console.log(`  Videos: ${profileData.tiktokVideos || 'N/A'}`);
  } else {
    console.log(`  ❌ Not connected`);
  }
}

checkHelloworldComplete();