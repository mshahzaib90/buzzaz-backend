const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkTaeedJibreelData() {
  try {
    console.log('=== CHECKING FOR TAEED E JIBREEL CHANNEL DATA ===');
    
    // Check influencers collection for YouTube channel data
    const influencersSnapshot = await db.collection('influencers').get();
    let foundInInfluencers = false;
    
    console.log('Checking influencers collection...');
    influencersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.youtubeChannelTitle && data.youtubeChannelTitle.toLowerCase().includes('taeed')) {
        console.log('✅ Found in influencers collection:');
        console.log('  Document ID:', doc.id);
        console.log('  Channel Title:', data.youtubeChannelTitle);
        console.log('  Channel ID:', data.youtubeChannelId);
        console.log('  Subscribers:', data.youtubeSubscribers);
        console.log('  Videos:', data.youtubeVideos);
        console.log('  Views:', data.youtubeTotalViews);
        foundInInfluencers = true;
      }
    });
    
    // Check youtubeStats collection
    const youtubeStatsSnapshot = await db.collection('youtubeStats').get();
    let foundInStats = false;
    
    console.log('\nChecking youtubeStats collection...');
    youtubeStatsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.channelTitle && data.channelTitle.toLowerCase().includes('taeed')) {
        console.log('✅ Found in youtubeStats collection:');
        console.log('  Document ID:', doc.id);
        console.log('  Channel Title:', data.channelTitle);
        console.log('  Channel ID:', data.channelId);
        console.log('  Subscribers:', data.subscriberCount);
        console.log('  Videos:', data.videoCount);
        console.log('  Views:', data.viewCount);
        console.log('  Created At:', data.createdAt);
        foundInStats = true;
      }
    });
    
    if (!foundInInfluencers && !foundInStats) {
      console.log('❌ No data found for "Taeed e Jibreel" channel in Firebase');
      console.log('The channel data has not been saved yet.');
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkTaeedJibreelData().then(() => process.exit(0));