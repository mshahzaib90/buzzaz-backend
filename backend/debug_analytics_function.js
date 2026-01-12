require('dotenv').config();
const { admin, db } = require('./config/firebase');
const { categorizeInstagramPosts, getInstagramAnalytics } = require('./services/instagramService');

async function debugAnalyticsFunction() {
  try {
    console.log('🔍 Testing analytics function...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Get the Instagram data
    const instagramDoc = await db.collection('instagramDetailedData').doc(userId).get();
    
    if (!instagramDoc.exists) {
      console.log('❌ No Instagram data found');
      return;
    }
    
    const cachedData = instagramDoc.data();
    console.log('✅ Instagram data found');
    console.log('Posts count:', cachedData.posts?.length || 0);
    
    // Test categorizeInstagramPosts
    console.log('\n🔄 Testing categorizeInstagramPosts...');
    try {
      const categorizedPosts = categorizeInstagramPosts(cachedData.posts || []);
      console.log('✅ categorizeInstagramPosts succeeded');
      console.log('Categorized posts:', Object.keys(categorizedPosts));
    } catch (error) {
      console.error('❌ categorizeInstagramPosts failed:', error.message);
    }
    
    // Test getInstagramAnalytics
    console.log('\n📊 Testing getInstagramAnalytics...');
    try {
      const analytics = getInstagramAnalytics(cachedData);
      console.log('✅ getInstagramAnalytics succeeded');
      console.log('Analytics keys:', Object.keys(analytics));
      
      // Check for undefined values in analytics
      for (const [key, value] of Object.entries(analytics)) {
        if (value === undefined) {
          console.log(`❌ UNDEFINED in analytics: ${key}`);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          console.log(`🔍 Checking object ${key}:`);
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue === undefined) {
              console.log(`❌ UNDEFINED in ${key}.${subKey}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ getInstagramAnalytics failed:', error.message);
      console.error('Error stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Error debugging analytics:', error.message);
  }
  
  process.exit(0);
}

debugAnalyticsFunction();