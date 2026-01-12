require('dotenv').config();
const { admin, db } = require('./config/firebase');

async function inspectInstagramData() {
  try {
    console.log('🔍 Inspecting Instagram data structure...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Get the Instagram data
    const instagramDoc = await db.collection('instagramDetailedData').doc(userId).get();
    
    if (!instagramDoc.exists) {
      console.log('❌ No Instagram data found');
      return;
    }
    
    const data = instagramDoc.data();
    console.log('✅ Instagram data found');
    
    // Check the first post for undefined values
    if (data.posts && data.posts.length > 0) {
      console.log('\n📝 First post structure:');
      const firstPost = data.posts[0];
      console.log('Post keys:', Object.keys(firstPost));
      
      // Check each field for undefined values
      for (const [key, value] of Object.entries(firstPost)) {
        if (value === undefined) {
          console.log(`❌ UNDEFINED FIELD: ${key}`);
        } else if (value === null) {
          console.log(`⚠️  NULL FIELD: ${key}`);
        } else {
          console.log(`✅ ${key}: ${typeof value} (${Array.isArray(value) ? 'array' : typeof value})`);
        }
      }
      
      // Show the problematic displayUrl field specifically
      console.log('\n🔍 DisplayUrl field analysis:');
      console.log('displayUrl value:', firstPost.displayUrl);
      console.log('displayUrl type:', typeof firstPost.displayUrl);
      console.log('displayUrl === undefined:', firstPost.displayUrl === undefined);
    }
    
    // Check reels too
    if (data.reels && data.reels.length > 0) {
      console.log('\n🎬 First reel structure:');
      const firstReel = data.reels[0];
      console.log('Reel keys:', Object.keys(firstReel));
      
      for (const [key, value] of Object.entries(firstReel)) {
        if (value === undefined) {
          console.log(`❌ UNDEFINED FIELD: ${key}`);
        } else if (value === null) {
          console.log(`⚠️  NULL FIELD: ${key}`);
        } else {
          console.log(`✅ ${key}: ${typeof value}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error inspecting Instagram data:', error.message);
  }
  
  process.exit(0);
}

inspectInstagramData();