require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccount.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function debugVideoData() {
  try {
    console.log('=== DEBUGGING VIDEO DATA STRUCTURE ===');
    
    const userId = 'X0IqcgoiqNm6OgOKKKT1';
    
    // Get YouTube analytics data
    const analyticsSnapshot = await db.collection('youtubeAnalytics')
      .where('userId', '==', userId)
      .get();
    
    if (analyticsSnapshot.empty) {
      console.log('❌ No YouTube analytics data found');
      return;
    }
    
    // Get the most recent document
    const sortedDocs = analyticsSnapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate() || new Date(0);
      const bTime = b.data().createdAt?.toDate() || new Date(0);
      return bTime - aTime;
    });
    
    const analyticsData = sortedDocs[0].data();
    
    console.log('\n=== RECENT VIDEOS DATA ===');
    console.log(`Total videos: ${analyticsData.recentVideos?.length || 0}`);
    
    if (analyticsData.recentVideos && analyticsData.recentVideos.length > 0) {
      console.log('\n=== FIRST VIDEO STRUCTURE ===');
      const firstVideo = analyticsData.recentVideos[0];
      console.log('Video properties:');
      Object.keys(firstVideo).forEach(key => {
        console.log(`  ${key}: ${firstVideo[key]}`);
      });
      
      console.log('\n=== ALL VIDEOS ===');
      analyticsData.recentVideos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   videoId: ${video.videoId}`);
        console.log(`   videoUrl: ${video.videoUrl || 'MISSING!'}`);
        console.log(`   viewCount: ${video.viewCount}`);
        console.log(`   publishedAt: ${video.publishedAt}`);
      });
      
      // Check if any videos are missing videoUrl
      const missingUrls = analyticsData.recentVideos.filter(video => !video.videoUrl);
      if (missingUrls.length > 0) {
        console.log(`\n❌ ${missingUrls.length} videos are missing videoUrl property!`);
        console.log('This is why the video popup is not working.');
      } else {
        console.log('\n✅ All videos have videoUrl property');
      }
    } else {
      console.log('No recent videos found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugVideoData();