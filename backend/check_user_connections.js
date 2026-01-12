const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://buzzaz-react-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function checkUserConnections() {
  try {
    console.log('=== CHECKING USER PLATFORM CONNECTIONS ===');
    
    // Get all influencer profiles to find yours
    const profilesSnapshot = await db.collection('influencers').get();
    
    console.log(`Found ${profilesSnapshot.size} total profiles in database`);
    console.log('\n=== PROFILE CONNECTIONS SUMMARY ===');
    
    profilesSnapshot.forEach(doc => {
      const data = doc.data();
      const hasInstagram = !!data.instagramUsername;
      const hasYouTube = !!data.youtubeChannelId;
      const hasTikTok = !!data.tiktokUsername;
      
      console.log(`\nProfile ID: ${doc.id}`);
      console.log(`Email: ${data.email || 'N/A'}`);
      console.log(`Full Name: ${data.fullName || 'N/A'}`);
      console.log(`Instagram: ${hasInstagram ? '✅ Connected (@' + data.instagramUsername + ')' : '❌ Not Connected'}`);
      console.log(`YouTube: ${hasYouTube ? '✅ Connected (' + data.youtubeChannelTitle + ')' : '❌ Not Connected'}`);
      console.log(`TikTok: ${hasTikTok ? '✅ Connected (@' + data.tiktokUsername + ')' : '❌ Not Connected'}`);
      
      // Show additional Instagram data if available
      if (hasInstagram) {
        console.log(`  - Followers: ${data.followers || 'N/A'}`);
        console.log(`  - Following: ${data.following || 'N/A'}`);
        console.log(`  - Posts: ${data.postsCount || 'N/A'}`);
      }
      
      // Show additional YouTube data if available
      if (hasYouTube) {
        console.log(`  - Channel ID: ${data.youtubeChannelId}`);
        console.log(`  - Channel URL: ${data.youtubeChannelUrl || 'N/A'}`);
      }
    });
    
    // Also check for stats data
    console.log('\n=== CHECKING STATS DATA ===');
    const statsSnapshot = await db.collection('stats').get();
    console.log(`Found ${statsSnapshot.size} stats records in database`);
    
    // Group stats by influencer ID
    const statsByInfluencer = {};
    statsSnapshot.forEach(doc => {
      const data = doc.data();
      const influencerId = data.influencerId;
      if (!statsByInfluencer[influencerId]) {
        statsByInfluencer[influencerId] = [];
      }
      statsByInfluencer[influencerId].push({
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        followers: data.followers,
        following: data.following,
        postsCount: data.postsCount,
        engagementRate: data.engagementRate
      });
    });
    
    // Show stats summary
    Object.keys(statsByInfluencer).forEach(influencerId => {
      const stats = statsByInfluencer[influencerId];
      const latestStats = stats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      
      console.log(`\nStats for Profile ${influencerId}:`);
      console.log(`  - Total stats records: ${stats.length}`);
      console.log(`  - Latest stats: Followers: ${latestStats.followers}, Posts: ${latestStats.postsCount}, Following: ${latestStats.following}`);
      console.log(`  - Latest update: ${latestStats.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error checking user connections:', error);
  }
}

checkUserConnections().then(() => {
  console.log('\n=== CHECK COMPLETED ===');
  process.exit(0);
}).catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});