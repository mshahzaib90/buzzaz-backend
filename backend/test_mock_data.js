// Test script to verify dashboard display with mock dual actor data
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock dual actor Instagram data
const mockInstagramData = {
  username: 'test_user',
  fullName: 'Test User',
  followers: 125000,
  following: 850,
  postsCount: 245,
  reelsCount: 89,
  isVerified: true,
  profilePicUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  bio: 'Test Instagram account for dual actor integration',
  posts: [
    {
      id: 'post_1',
      type: 'GraphImage',
      shortCode: 'ABC123',
      caption: 'Test post caption #test',
      likesCount: 1250,
      commentsCount: 45,
      timestamp: new Date().toISOString(),
      displayUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      isVideo: false
    },
    {
      id: 'post_2',
      type: 'GraphSidecar',
      shortCode: 'DEF456',
      caption: 'Another test post with multiple images',
      likesCount: 890,
      commentsCount: 23,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      displayUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
      isVideo: false
    }
  ],
  reels: [
    {
      id: 'reel_1',
      type: 'GraphVideo',
      shortCode: 'GHI789',
      caption: 'Test reel caption #reels #viral',
      likesCount: 5600,
      commentsCount: 234,
      timestamp: new Date().toISOString(),
      displayUrl: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=600&fit=crop',
      isVideo: true,
      videoDuration: 15.5,
      playCount: 12500
    },
    {
      id: 'reel_2',
      type: 'GraphVideo',
      shortCode: 'JKL012',
      caption: 'Another test reel',
      likesCount: 3200,
      commentsCount: 156,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      displayUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop',
      isVideo: true,
      videoDuration: 22.3,
      playCount: 8900
    }
  ],
  metadata: {
    scrapedAt: new Date().toISOString(),
    totalPosts: 245,
    totalReels: 89,
    actorIds: {
      profileScraper: 'apify/instagram-scraper',
      reelScraper: 'apify/instagram-reel-scraper'
    }
  },
  analytics: {
    avgLikesPerPost: 1070,
    avgCommentsPerPost: 34,
    engagementRate: 2.8,
    topHashtags: ['#test', '#reels', '#viral']
  }
};

// Mock endpoint to simulate the enhanced Instagram data
app.get('/api/influencer/:id/instagram-detailed', (req, res) => {
  console.log('Mock Instagram detailed data requested for influencer:', req.params.id);
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      success: true,
      data: mockInstagramData
    });
  }, 500);
});

// Mock validation endpoint
app.post('/api/influencer/validate-apify', (req, res) => {
  const { username } = req.body;
  console.log('Mock Instagram validation requested for username:', username);
  
  setTimeout(() => {
    res.json({
      success: true,
      profileData: {
        username: username,
        fullName: `${username} Full Name`,
        followers: Math.floor(Math.random() * 100000) + 10000,
        following: Math.floor(Math.random() * 1000) + 100,
        postsCount: Math.floor(Math.random() * 500) + 50,
        reelsCount: Math.floor(Math.random() * 100) + 10,
        isVerified: Math.random() > 0.5,
        profilePicUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        bio: `Mock bio for ${username}`,
        totalPosts: Math.floor(Math.random() * 500) + 50,
        totalReels: Math.floor(Math.random() * 100) + 10,
        actorIds: {
          profileScraper: 'apify/instagram-scraper',
          reelScraper: 'apify/instagram-reel-scraper'
        }
      }
    });
  }, 800);
});

const PORT = 5001; // Different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET http://localhost:${PORT}/api/influencer/:id/instagram-detailed`);
  console.log(`- POST http://localhost:${PORT}/api/influencer/validate-apify`);
  console.log('\nMock data structure includes:');
  console.log('- Separate posts and reels arrays');
  console.log('- Enhanced metadata with actor IDs');
  console.log('- Reels count and additional metrics');
  console.log('- Compatible with dual actor dashboard display');
});