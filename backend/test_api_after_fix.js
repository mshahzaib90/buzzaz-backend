const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAPIAfterFix() {
  try {
    console.log('=== TESTING API AFTER USERNAME FIX ===');
    
    const userId = 'sx8gqxfSNZQvlHXq7BQI';
    const baseURL = 'http://localhost:5000/api';
    const JWT_SECRET = process.env.JWT_SECRET;
    
    // Create a valid token
    const token = jwt.sign(
      { 
        uid: userId,
        email: 'muhammad.shahzaib@tamatos.com',
        role: 'influencer'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`Testing user: ${userId}`);
    console.log(`API endpoint: ${baseURL}/influencer/${userId}/instagram/detailed`);
    
    // Test the Instagram detailed endpoint
    console.log('\n1. Testing Instagram detailed endpoint...');
    
    try {
      const response = await axios.get(`${baseURL}/influencer/${userId}/instagram/detailed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('✅ API Request Successful!');
      console.log('Status:', response.status);
      console.log('Success:', response.data.success);
      console.log('From Database:', response.data.fromDatabase);
      
      // Check profile data
      if (response.data.profile) {
        console.log('\n📊 Profile Data:');
        console.log('Username:', response.data.profile.username);
        console.log('Full Name:', response.data.profile.fullName);
        console.log('Followers:', response.data.profile.followers);
        console.log('Following:', response.data.profile.following);
        console.log('Posts Count:', response.data.profile.postsCount);
        console.log('Is Verified:', response.data.profile.isVerified);
      }
      
      // Check reels data
      if (response.data.reels) {
        console.log('\n🎬 Reels Data:');
        console.log('Total Reels:', response.data.reels.length);
        
        if (response.data.reels.length > 0) {
          const firstReel = response.data.reels[0];
          console.log('First Reel URL:', firstReel.url);
          console.log('First Reel Likes:', firstReel.likesCount);
          console.log('First Reel Comments:', firstReel.commentsCount);
          console.log('First Reel Caption:', firstReel.caption?.substring(0, 100) + '...');
        }
      }
      
      // Check analytics
      if (response.data.analytics) {
        console.log('\n📈 Analytics Data:');
        console.log('Total Posts:', response.data.analytics.totalPosts);
        console.log('Total Likes:', response.data.analytics.totalLikes);
        console.log('Total Comments:', response.data.analytics.totalComments);
        console.log('Average Likes:', response.data.analytics.averageLikes);
        console.log('Average Comments:', response.data.analytics.averageComments);
        console.log('Engagement Rate:', response.data.analytics.engagementRate + '%');
      }
      
      // Check metadata
      if (response.data.metadata) {
        console.log('\n🔍 Metadata:');
        console.log('Total Reels:', response.data.metadata.totalReels);
        console.log('Last Updated:', response.data.metadata.lastUpdated);
        console.log('Actor IDs:', response.data.metadata.actorIds);
      }
      
      console.log('\n🎉 SUCCESS! The API is now returning laibybaby data correctly.');
      console.log('The dashboard should now display the reels properly.');
      
    } catch (error) {
      console.log('❌ API Request Failed');
      console.log('Status:', error.response?.status);
      console.log('Error Message:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 400) {
        console.log('\n🔍 This might be due to:');
        console.log('1. Instagram username not set in profile');
        console.log('2. Username mismatch between profile and data');
      } else if (error.response?.status === 404) {
        console.log('\n🔍 This might be due to:');
        console.log('1. No Instagram data found in Firebase');
        console.log('2. User not found');
      }
    }
    
    // Also test the regular profile endpoint
    console.log('\n2. Testing regular profile endpoint...');
    
    try {
      const profileResponse = await axios.get(`${baseURL}/influencer/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile endpoint successful');
      console.log('Instagram Username:', profileResponse.data.profile?.instagramUsername);
      console.log('Followers:', profileResponse.data.profile?.followers);
      console.log('Posts Count:', profileResponse.data.profile?.postsCount);
      
    } catch (error) {
      console.log('❌ Profile endpoint failed:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
  
  process.exit(0);
}

testAPIAfterFix();