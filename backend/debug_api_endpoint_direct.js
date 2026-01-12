const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('./config/firebase');
const { getInstagramReelData, getInstagramProfileData } = require('./services/firebaseService');

async function debugAPIEndpointDirect() {
  try {
    console.log('=== DEBUGGING API ENDPOINT DIRECTLY ===');
    
    const influencerId = 'sx8gqxfSNZQvlHXq7BQI';
    console.log(`Testing with influencer ID: ${influencerId}`);
    
    // Simulate the exact API endpoint logic
    console.log('\n1. Checking influencers collection...');
    const docRef = db.collection('influencers').doc(influencerId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Influencer not found');
      return;
    }
    
    const data = doc.data();
    console.log('✅ Influencer found');
    console.log('Instagram Username:', data.instagramUsername);
    
    if (!data.instagramUsername) {
      console.log('❌ Instagram username not connected');
      return;
    }
    
    console.log(`\n2. Loading Instagram data from database for: ${data.instagramUsername}`);
    
    // Call the Firebase service functions exactly as the API does
    console.log('\n3. Calling Firebase service functions...');
    const reelResult = await getInstagramReelData(influencerId);
    const profileResult = await getInstagramProfileData(influencerId);
    
    console.log('Reel Result Success:', reelResult.success);
    console.log('Profile Result Success:', profileResult.success);
    
    if (!reelResult.success && !profileResult.success) {
      console.log('❌ No Instagram data found in database');
      return;
    }
    
    const reelData = reelResult.data;
    const profileData = profileResult.data;
    
    console.log('\n4. Processing data...');
    console.log('Reel Data exists:', !!reelData);
    console.log('Profile Data exists:', !!profileData);
    
    if (reelData) {
      console.log('Reel Data username:', reelData.username);
      console.log('Reel Data totalReels:', reelData.totalReels);
      console.log('Reel Data reels array length:', reelData.reels?.length || 0);
    }
    
    if (profileData) {
      console.log('Profile Data username:', profileData.username);
      console.log('Profile Data followers:', profileData.followers);
    }
    
    // Use profile data if available, otherwise fall back to reel data or influencer data
    const profile = profileData || {};
    const reels = reelData?.reels || [];
    
    console.log('\n5. After processing...');
    console.log('Profile object type:', typeof profile);
    console.log('Profile object keys:', Object.keys(profile));
    console.log('Reels array type:', typeof reels);
    console.log('Reels array length:', reels.length);
    console.log('Is reels an array:', Array.isArray(reels));
    
    // Calculate analytics from reel data
    const totalLikes = reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
    const totalComments = reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
    const totalEngagement = totalLikes + totalComments;
    const avgLikes = reels.length > 0 ? Math.round(totalLikes / reels.length) : 0;
    const avgComments = reels.length > 0 ? Math.round(totalComments / reels.length) : 0;
    
    // Calculate engagement rate if profile data is available
    const followers = profile.followers || data.followers || 0;
    const engagementRate = followers > 0 && reels.length > 0 ? 
      ((totalEngagement / reels.length) / followers * 100).toFixed(2) : 0;
    
    console.log('\n6. Analytics calculation...');
    console.log('Total Likes:', totalLikes);
    console.log('Total Comments:', totalComments);
    console.log('Average Likes:', avgLikes);
    console.log('Followers for calculation:', followers);
    console.log('Engagement Rate:', engagementRate);
    
    // Build the response object exactly as the API does
    const response = {
      success: true,
      fromDatabase: true,
      profile: {
        username: profile.username || data.instagramUsername,
        fullName: profile.fullName || data.fullName,
        bio: profile.bio || data.bio,
        avatarUrl: profile.avatarUrl || data.avatarUrl,
        followers: profile.followers || data.followers || 0,
        following: profile.following || 0,
        postsCount: profile.postsCount || 0,
        isVerified: profile.isVerified || false,
        isPrivate: profile.isPrivate || false,
        businessCategoryName: profile.businessCategoryName || '',
        isBusinessAccount: profile.isBusinessAccount || false,
        lastUpdated: profile.lastUpdated
      },
      posts: { posts: [], reels: [], videos: [] },
      reels: reels,
      analytics: {
        totalPosts: reels.length,
        totalLikes: totalLikes,
        totalComments: totalComments,
        averageLikes: avgLikes,
        averageComments: avgComments,
        totalEngagement: totalEngagement,
        engagementRate: parseFloat(engagementRate)
      },
      metadata: {
        totalEngagement: totalEngagement,
        engagementRate: parseFloat(engagementRate),
        lastUpdated: reelData?.lastUpdated || profile.lastUpdated,
        scrapedAt: reelData?.createdAt || profile.createdAt,
        totalReels: reels.length,
        actorIds: reelData?.actorIds || ['instagram-reel-scraper']
      }
    };
    
    console.log('\n7. Final response structure...');
    console.log('Response success:', response.success);
    console.log('Response profile username:', response.profile.username);
    console.log('Response profile followers:', response.profile.followers);
    console.log('Response reels length:', response.reels.length);
    console.log('Response analytics totalPosts:', response.analytics.totalPosts);
    console.log('Response metadata totalReels:', response.metadata.totalReels);
    
    console.log('\n=== DIRECT DEBUG COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Error in direct debug:', error);
  }
  
  process.exit(0);
}

debugAPIEndpointDirect();