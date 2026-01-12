const express = require('express');
const { getInstagramReelData, getInstagramProfileData } = require('./services/firebaseService');

async function testDirectAPI() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    
    console.log('Testing direct Instagram data retrieval...');
    console.log('User ID:', userId);
    
    // Test reel data retrieval
    console.log('\n--- Testing Reel Data ---');
    const reelResult = await getInstagramReelData(userId);
    console.log('Reel Result Success:', reelResult.success);
    console.log('Reel Result Message:', reelResult.message);
    console.log('Reel Data Count:', reelResult.data?.length || 0);
    
    if (reelResult.data && reelResult.data.length > 0) {
      console.log('First Reel:', {
        id: reelResult.data[0].id,
        username: reelResult.data[0].username,
        likesCount: reelResult.data[0].likesCount
      });
    }
    
    // Test profile data retrieval
    console.log('\n--- Testing Profile Data ---');
    const profileResult = await getInstagramProfileData(userId);
    console.log('Profile Result Success:', profileResult.success);
    console.log('Profile Result Message:', profileResult.message);
    
    if (profileResult.data) {
      console.log('Profile Data:', {
        username: profileResult.data.username,
        followers: profileResult.data.followers,
        following: profileResult.data.following,
        posts: profileResult.data.posts
      });
    }
    
    // Test combined analytics calculation
    if (reelResult.success && profileResult.success) {
      console.log('\n--- Testing Analytics Calculation ---');
      const reels = reelResult.data;
      const profile = profileResult.data;
      
      const totalLikes = reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
      const totalComments = reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
      const totalViews = reels.reduce((sum, reel) => sum + (reel.viewsCount || 0), 0);
      const totalPosts = reels.length;
      
      const engagementRate = profile.followers > 0 
        ? ((totalLikes + totalComments) / (totalPosts * profile.followers)) * 100 
        : 0;
      
      console.log('Analytics:', {
        totalPosts,
        totalLikes,
        totalComments,
        totalViews,
        engagementRate: engagementRate.toFixed(2) + '%'
      });
    }
    
  } catch (error) {
    console.error('Direct API Test Error:', error.message);
    console.error('Error Stack:', error.stack);
  }
}

testDirectAPI();