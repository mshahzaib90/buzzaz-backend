const express = require('express');
const { getInstagramReelData, getInstagramProfileData } = require('./services/firebaseService');

// Simulate the Instagram detailed endpoint logic without authentication
async function testInstagramDetailedLogic() {
  try {
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    
    console.log('Testing Instagram detailed endpoint logic...');
    console.log('User ID:', userId);
    
    // Get Instagram reel data
    const reelResult = await getInstagramReelData(userId);
    console.log('\n--- Reel Data Result ---');
    console.log('Success:', reelResult.success);
    console.log('Message:', reelResult.message);
    console.log('Data count:', reelResult.data?.length || 0);
    
    // Get Instagram profile data
    const profileResult = await getInstagramProfileData(userId);
    console.log('\n--- Profile Data Result ---');
    console.log('Success:', profileResult.success);
    console.log('Message:', profileResult.message);
    console.log('Profile data:', profileResult.data);
    
    // Check if both are successful
    if (!reelResult.success || !profileResult.success) {
      console.log('\n--- API Response (No Data) ---');
      console.log({
        success: false,
        message: 'No Instagram data found. Please refresh your Instagram data first.',
        fromDatabase: false
      });
      return;
    }
    
    // Calculate analytics (same logic as in the endpoint)
    const reels = reelResult.data;
    const profile = profileResult.data;
    
    const totalLikes = reels.reduce((sum, reel) => sum + (reel.likesCount || 0), 0);
    const totalComments = reels.reduce((sum, reel) => sum + (reel.commentsCount || 0), 0);
    const totalViews = reels.reduce((sum, reel) => sum + (reel.viewsCount || 0), 0);
    const totalPosts = reels.length;
    
    const engagementRate = profile.followers > 0 
      ? ((totalLikes + totalComments) / (totalPosts * profile.followers)) * 100 
      : 0;
    
    const analytics = {
      totalPosts,
      totalLikes,
      totalComments,
      totalViews,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      averageLikes: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
      averageComments: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0
    };
    
    // Construct the final response
    const response = {
      success: true,
      message: 'Instagram data retrieved successfully',
      fromDatabase: true,
      profile,
      reels,
      analytics
    };
    
    console.log('\n--- Final API Response ---');
    console.log('Success:', response.success);
    console.log('From Database:', response.fromDatabase);
    console.log('Profile Username:', response.profile?.username);
    console.log('Profile Followers:', response.profile?.followers);
    console.log('Reels Count:', response.reels?.length);
    console.log('Analytics:', response.analytics);
    
  } catch (error) {
    console.error('Error in Instagram detailed logic:', error.message);
    console.error('Stack:', error.stack);
  }
}

testInstagramDetailedLogic();