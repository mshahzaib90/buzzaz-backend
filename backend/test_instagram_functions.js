const { admin, db } = require('./config/firebase');
const { categorizeInstagramPosts, getInstagramAnalytics } = require('./services/instagramService');

async function testInstagramFunctions() {
  try {
    console.log('🧪 Testing Instagram functions with cached data...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Get the cached Instagram data
    const cachedDoc = await db.collection('instagramDetailedData').doc(userId).get();
    
    if (!cachedDoc.exists) {
      console.log('❌ No cached Instagram data found');
      return;
    }
    
    const cachedData = cachedDoc.data();
    console.log('✅ Cached data retrieved');
    console.log('Posts count:', cachedData.posts?.length || 0);
    console.log('Reels count:', cachedData.reels?.length || 0);
    
    // Test categorizeInstagramPosts function
    console.log('\n🔍 Testing categorizeInstagramPosts function...');
    try {
      const categorizedPosts = categorizeInstagramPosts(cachedData.posts || []);
      console.log('✅ categorizeInstagramPosts succeeded');
      console.log('Categorized posts structure:', Object.keys(categorizedPosts));
    } catch (error) {
      console.error('❌ categorizeInstagramPosts failed:', error.message);
      console.error('Error stack:', error.stack);
      return;
    }
    
    // Test getInstagramAnalytics function
    console.log('\n🔍 Testing getInstagramAnalytics function...');
    try {
      const analytics = getInstagramAnalytics(cachedData);
      console.log('✅ getInstagramAnalytics succeeded');
      console.log('Analytics structure:', Object.keys(analytics));
      console.log('Total posts:', analytics.totalPosts);
      console.log('Total likes:', analytics.totalLikes);
    } catch (error) {
      console.error('❌ getInstagramAnalytics failed:', error.message);
      console.error('Error stack:', error.stack);
      return;
    }
    
    console.log('\n🎉 Both functions work correctly with cached data!');
    console.log('The error must be elsewhere in the endpoint logic.');
    
  } catch (error) {
    console.error('❌ Error testing Instagram functions:', error.message);
    console.error('Error stack:', error.stack);
  }
  
  process.exit(0);
}

testInstagramFunctions();