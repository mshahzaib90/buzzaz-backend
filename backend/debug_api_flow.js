const { db } = require('./config/firebase');
const { getInstagramReelData, getInstagramProfileData } = require('./services/firebaseService');

async function debugAPIFlow() {
  try {
    console.log('=== DEBUGGING COMPLETE API FLOW ===');
    
    const influencerId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log(`Testing with influencer ID: ${influencerId}`);
    
    // Step 1: Check influencers collection
    console.log('\n1. Checking influencers collection...');
    const docRef = db.collection('influencers').doc(influencerId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Influencer document not found');
      return;
    }
    
    const data = doc.data();
    console.log('✅ Influencer document found');
    console.log('Instagram Username:', data.instagramUsername);
    console.log('Followers:', data.followers);
    console.log('Posts Count:', data.postsCount);
    
    if (!data.instagramUsername) {
      console.log('❌ No Instagram username set');
      return;
    }
    
    // Step 2: Test Firebase service functions
    console.log('\n2. Testing Firebase service functions...');
    
    console.log('\n2a. Testing getInstagramReelData...');
    const reelResult = await getInstagramReelData(influencerId);
    console.log('Reel Result Success:', reelResult.success);
    console.log('Reel Result Message:', reelResult.message);
    
    if (reelResult.success && reelResult.data) {
      console.log('✅ Reel data retrieved:');
      console.log('Username:', reelResult.data.username);
      console.log('Total Reels:', reelResult.data.totalReels);
      console.log('Reels Array Length:', reelResult.data.reels?.length || 0);
      
      if (reelResult.data.reels && reelResult.data.reels.length > 0) {
        console.log('First Reel Sample:');
        const firstReel = reelResult.data.reels[0];
        console.log('- ID:', firstReel.id);
        console.log('- Likes:', firstReel.likesCount);
        console.log('- Comments:', firstReel.commentsCount);
      }
    } else {
      console.log('❌ No reel data returned');
    }
    
    console.log('\n2b. Testing getInstagramProfileData...');
    const profileResult = await getInstagramProfileData(influencerId);
    console.log('Profile Result Success:', profileResult.success);
    console.log('Profile Result Message:', profileResult.message);
    
    if (profileResult.success && profileResult.data) {
      console.log('✅ Profile data retrieved:');
      console.log('Username:', profileResult.data.username);
      console.log('Full Name:', profileResult.data.fullName);
      console.log('Followers:', profileResult.data.followers);
    } else {
      console.log('❌ No profile data returned');
    }
    
    // Step 3: Simulate API endpoint logic
    console.log('\n3. Simulating API endpoint logic...');
    
    const reelData = reelResult.data;
    const profileData = profileResult.data;
    
    const profile = profileData || {};
    const reels = reelData?.reels || [];
    
    console.log('Profile object keys:', Object.keys(profile));
    console.log('Reels array length after processing:', reels.length);
    console.log('Reels array type:', typeof reels);
    console.log('Is reels an array:', Array.isArray(reels));
    
    // Calculate analytics
    const totalLikes = reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
    const totalComments = reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
    const totalEngagement = totalLikes + totalComments;
    const avgLikes = reels.length > 0 ? Math.round(totalLikes / reels.length) : 0;
    const avgComments = reels.length > 0 ? Math.round(totalComments / reels.length) : 0;
    
    const followers = profile.followers || data.followers || 0;
    const engagementRate = followers > 0 && reels.length > 0 ? 
      ((totalEngagement / reels.length) / followers * 100).toFixed(2) : 0;
    
    console.log('\n📊 Calculated Analytics:');
    console.log('Total Likes:', totalLikes);
    console.log('Total Comments:', totalComments);
    console.log('Average Likes:', avgLikes);
    console.log('Average Comments:', avgComments);
    console.log('Engagement Rate:', engagementRate);
    
    // Final response structure
    const response = {
      success: true,
      fromDatabase: true,
      profile: {
        username: profile.username || data.instagramUsername,
        fullName: profile.fullName || data.fullName,
        followers: profile.followers || data.followers || 0,
        following: profile.following || 0,
        postsCount: profile.postsCount || 0,
        isVerified: profile.isVerified || false
      },
      reels: reels,
      analytics: {
        totalPosts: reels.length,
        totalLikes: totalLikes,
        totalComments: totalComments,
        averageLikes: avgLikes,
        averageComments: avgComments,
        engagementRate: parseFloat(engagementRate)
      },
      metadata: {
        totalReels: reels.length,
        lastUpdated: reelData?.lastUpdated || profile.lastUpdated
      }
    };
    
    console.log('\n🎯 Final Response Summary:');
    console.log('Profile Username:', response.profile.username);
    console.log('Profile Followers:', response.profile.followers);
    console.log('Reels Count:', response.reels.length);
    console.log('Analytics Total Posts:', response.analytics.totalPosts);
    console.log('Metadata Total Reels:', response.metadata.totalReels);
    
    console.log('\n=== DEBUG COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error in debug flow:', error);
  }
  
  process.exit(0);
}

debugAPIFlow();