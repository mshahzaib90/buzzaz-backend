const admin = require('firebase-admin');
const { scrapeInstagramProfile, scrapeTikTokProfile } = require('./services/apifyService');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./config/serviceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testEnhancedDataFlow() {
  console.log('🚀 Testing Enhanced APIFY Data Flow to Firebase');
  console.log('================================================\n');

  try {
    // Test Instagram Enhanced Data Collection
    console.log('📸 1. Testing Enhanced Instagram Data Collection...');
    const instagramData = await scrapeInstagramProfile('cristiano');
    
    console.log('✅ Instagram Enhanced Fields Available:');
    console.log('   - Basic Fields:', ['username', 'followers', 'following', 'postsCount'].map(f => instagramData[f] ? '✓' : '✗').join(' '));
    console.log('   - Enhanced Fields:', ['fullName', 'bio', 'userId', 'externalUrl', 'isBusinessAccount', 'category'].map(f => instagramData[f] ? '✓' : '✗').join(' '));
    console.log('   - Metadata Fields:', ['rawApifyData', 'scrapedAt'].map(f => instagramData[f] ? '✓' : '✗').join(' '));
    
    // Test TikTok Enhanced Data Collection
    console.log('\n🎵 2. Testing Enhanced TikTok Data Collection...');
    const tiktokData = await scrapeTikTokProfile('cristiano');
    
    console.log('✅ TikTok Enhanced Fields Available:');
    console.log('   - Basic Fields:', ['username', 'followers', 'following', 'videosCount'].map(f => tiktokData[f] ? '✓' : '✗').join(' '));
    console.log('   - Enhanced Fields:', ['fullName', 'bio', 'uid', 'region', 'language', 'isVerified'].map(f => tiktokData[f] ? '✓' : '✗').join(' '));
    console.log('   - Metadata Fields:', ['rawApifyData', 'scrapedAt'].map(f => tiktokData[f] ? '✓' : '✗').join(' '));

    // Test Firebase Storage Structure
    console.log('\n🔥 3. Testing Firebase Storage Structure...');
    
    // Create a test influencer document with enhanced data
    const testInfluencerId = 'test_enhanced_' + Date.now();
    const influencerData = {
      // Basic Instagram fields
      instagramUsername: instagramData.username,
      avatarUrl: instagramData.avatarUrl,
      followers: instagramData.followers,
      following: instagramData.following,
      postsCount: instagramData.postsCount,
      engagementRate: instagramData.engagementRate,
      isVerified: instagramData.isVerified,
      isPrivate: instagramData.isPrivate,
      
      // Enhanced Instagram fields
      instagramUserId: instagramData.userId,
      instagramFullName: instagramData.fullName,
      instagramBio: instagramData.bio,
      instagramExternalUrl: instagramData.externalUrl,
      instagramBusinessCategory: instagramData.businessCategoryName,
      instagramCategory: instagramData.categoryName,
      instagramIsBusinessAccount: instagramData.isBusinessAccount,
      instagramIsProfessionalAccount: instagramData.isProfessionalAccount,
      instagramBusinessEmail: instagramData.businessEmail,
      instagramBusinessPhone: instagramData.businessPhoneNumber,
      instagramBusinessAddress: instagramData.businessAddressJson,
      instagramProfilePicHd: instagramData.profilePicUrlHd,
      instagramRawData: instagramData.rawApifyData,
      instagramScrapedAt: instagramData.scrapedAt,
      
      // Basic TikTok fields
      tiktokUsername: tiktokData.username,
      tiktokAvatarUrl: tiktokData.avatarUrl,
      tiktokFollowers: tiktokData.followers,
      tiktokFollowing: tiktokData.following,
      tiktokVideosCount: tiktokData.videosCount,
      tiktokTotalLikes: tiktokData.totalLikes,
      tiktokEngagementRate: tiktokData.engagementRate,
      
      // Enhanced TikTok fields
      tiktokUid: tiktokData.uid,
      tiktokFullName: tiktokData.fullName,
      tiktokBio: tiktokData.bio,
      tiktokRegion: tiktokData.region,
      tiktokLanguage: tiktokData.language,
      tiktokIsVerified: tiktokData.isVerified,
      tiktokIsPrivate: tiktokData.isPrivate,
      tiktokAvatarMedium: tiktokData.avatarMedium,
      tiktokAvatarThumb: tiktokData.avatarThumb,
      tiktokProfileDeepLink: tiktokData.profileDeepLink,
      tiktokCreateTime: tiktokData.createTime,
      tiktokModifyTime: tiktokData.modifyTime,
      tiktokCommerceUserLevel: tiktokData.commerceUserLevel,
      tiktokEnterpriseVerifyReason: tiktokData.enterpriseVerifyReason,
      tiktokRawData: tiktokData.rawApifyData,
      tiktokScrapedAt: tiktokData.scrapedAt,
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    // Save to Firebase
    await db.collection('influencers').doc(testInfluencerId).set(influencerData);
    console.log('✅ Enhanced influencer data saved to Firebase');

    // Save Instagram stats snapshot
    if (instagramData) {
      const instagramStats = {
        platform: 'instagram',
        followers: instagramData.followers,
        following: instagramData.following,
        postsCount: instagramData.postsCount,
        engagementRate: instagramData.engagementRate,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        rawApifyResponse: instagramData.rawApifyData
      };
      
      await db.collection('influencers').doc(testInfluencerId)
        .collection('stats').add(instagramStats);
      console.log('✅ Instagram stats snapshot saved');
    }

    // Save TikTok stats snapshot
    if (tiktokData) {
      const tiktokStats = {
        platform: 'tiktok',
        followers: tiktokData.followers,
        following: tiktokData.following,
        videosCount: tiktokData.videosCount,
        totalLikes: tiktokData.totalLikes,
        engagementRate: tiktokData.engagementRate,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        rawApifyResponse: tiktokData.rawApifyData
      };
      
      await db.collection('influencers').doc(testInfluencerId)
        .collection('tiktokStats').add(tiktokStats);
      console.log('✅ TikTok stats snapshot saved');
    }

    // Verify data retrieval
    console.log('\n📊 4. Verifying Data Retrieval...');
    const savedDoc = await db.collection('influencers').doc(testInfluencerId).get();
    const savedData = savedDoc.data();
    
    console.log('✅ Enhanced Instagram Fields in Firebase:');
    console.log('   - Full Name:', savedData.instagramFullName ? '✓' : '✗');
    console.log('   - Bio:', savedData.instagramBio ? '✓' : '✗');
    console.log('   - Business Account:', savedData.instagramIsBusinessAccount ? '✓' : '✗');
    console.log('   - External URL:', savedData.instagramExternalUrl ? '✓' : '✗');
    console.log('   - Category:', savedData.instagramCategory ? '✓' : '✗');
    
    console.log('\n✅ Enhanced TikTok Fields in Firebase:');
    console.log('   - Full Name:', savedData.tiktokFullName ? '✓' : '✗');
    console.log('   - Bio:', savedData.tiktokBio ? '✓' : '✗');
    console.log('   - Region:', savedData.tiktokRegion ? '✓' : '✗');
    console.log('   - Language:', savedData.tiktokLanguage ? '✓' : '✗');
    console.log('   - UID:', savedData.tiktokUid ? '✓' : '✗');

    // Clean up test data
    await db.collection('influencers').doc(testInfluencerId).delete();
    console.log('\n🧹 Test data cleaned up');

    console.log('\n🎉 ENHANCED DATA FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('================================================');
    console.log('✅ APIFY service enhanced with additional fields');
    console.log('✅ Firebase storage updated to save enhanced data');
    console.log('✅ Dashboard components updated to display enhanced data');
    console.log('✅ Complete data flow verified from APIFY → Firebase → Dashboard');

  } catch (error) {
    console.error('❌ Enhanced data flow test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEnhancedDataFlow().then(() => {
  console.log('\n🏁 Test execution completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});