const { admin, db } = require('./config/firebase');

async function addInstagramTestData() {
  try {
    console.log('🔍 Finding users in database...');
    
    // Get all users to see who needs Instagram data
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📊 Found ${usersSnapshot.size} users`);
    
    // Add Instagram data for each user that doesn't have it
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`\n👤 Processing user: ${userId}`);
      console.log(`📧 Email: ${userData.email}`);
      
      // Check if user already has Instagram data
      const existingData = await db.collection('instagramDetailedData').doc(userId).get();
      
      if (existingData.exists) {
        console.log('✅ User already has Instagram data');
        continue;
      }
      
      // Create comprehensive test Instagram data
      const testInstagramData = {
        profile: {
          username: userData.instagramUsername || `user_${userId.substring(0, 8)}`,
          fullName: userData.displayName || 'Test User',
          followers: Math.floor(Math.random() * 50000) + 10000, // Random followers 10k-60k
          following: Math.floor(Math.random() * 2000) + 500,    // Random following 500-2500
          postsCount: Math.floor(Math.random() * 200) + 50,     // Random posts 50-250
          biography: 'Content creator sharing lifestyle, fitness, and travel content 🌟',
          profilePicUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          isVerified: Math.random() > 0.8, // 20% chance of being verified
          isPrivate: false
        },
        posts: [
          {
            id: 'post1',
            shortcode: 'ABC123',
            caption: 'Beautiful sunset at the beach! 🌅 Perfect end to an amazing day. #sunset #beach #nature #photography',
            likesCount: Math.floor(Math.random() * 3000) + 500,
            commentsCount: Math.floor(Math.random() * 100) + 20,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            displayUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
            isVideo: false,
            category: 'lifestyle'
          },
          {
            id: 'post2',
            shortcode: 'DEF456',
            caption: 'New workout routine! 💪 Stay strong and healthy. Consistency is key! #fitness #workout #motivation #health',
            likesCount: Math.floor(Math.random() * 2500) + 400,
            commentsCount: Math.floor(Math.random() * 80) + 15,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            displayUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
            isVideo: false,
            category: 'fitness'
          },
          {
            id: 'post3',
            shortcode: 'GHI789',
            caption: 'Delicious homemade pasta 🍝 Recipe in my stories! Who else loves cooking? #food #cooking #pasta #homemade',
            likesCount: Math.floor(Math.random() * 4000) + 800,
            commentsCount: Math.floor(Math.random() * 120) + 30,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            displayUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=400&fit=crop',
            isVideo: false,
            category: 'food'
          },
          {
            id: 'post4',
            shortcode: 'JKL012',
            caption: 'Travel memories from last weekend 🎒 Already planning the next adventure! #travel #adventure #explore #wanderlust',
            likesCount: Math.floor(Math.random() * 3500) + 600,
            commentsCount: Math.floor(Math.random() * 90) + 25,
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            displayUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
            isVideo: false,
            category: 'travel'
          },
          {
            id: 'post5',
            shortcode: 'MNO345',
            caption: 'Behind the scenes of today\'s photoshoot 📸 Love creating content for you all! #bts #photoshoot #content #creative',
            likesCount: Math.floor(Math.random() * 2800) + 500,
            commentsCount: Math.floor(Math.random() * 70) + 18,
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            displayUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop',
            isVideo: false,
            category: 'lifestyle'
          }
        ],
        reels: [
          {
            id: 'reel1',
            shortcode: 'REEL123',
            caption: 'Quick morning routine ☀️ Start your day right! #morningroutine #productivity #lifestyle #motivation',
            likesCount: Math.floor(Math.random() * 8000) + 2000,
            commentsCount: Math.floor(Math.random() * 200) + 50,
            viewsCount: Math.floor(Math.random() * 100000) + 20000,
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            displayUrl: 'https://images.unsplash.com/photo-1611095790444-1dfa35e37b52?w=400&h=600&fit=crop',
            isVideo: true,
            category: 'lifestyle'
          },
          {
            id: 'reel2',
            shortcode: 'REEL456',
            caption: 'Travel tips for budget travelers 🎒 Save money while exploring! #travel #budgettravel #tips #backpacking',
            likesCount: Math.floor(Math.random() * 6500) + 1500,
            commentsCount: Math.floor(Math.random() * 150) + 40,
            viewsCount: Math.floor(Math.random() * 80000) + 15000,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            displayUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop',
            isVideo: true,
            category: 'travel'
          },
          {
            id: 'reel3',
            shortcode: 'REEL789',
            caption: '30-second workout you can do anywhere! 💪 No equipment needed #fitness #quickworkout #homeworkout #health',
            likesCount: Math.floor(Math.random() * 9500) + 2500,
            commentsCount: Math.floor(Math.random() * 180) + 60,
            viewsCount: Math.floor(Math.random() * 120000) + 25000,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            displayUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=600&fit=crop',
            isVideo: true,
            category: 'fitness'
          }
        ],
        analytics: {
          totalLikes: 0, // Will be calculated
          totalComments: 0, // Will be calculated
          totalViews: 0, // Will be calculated
          averageLikes: 0, // Will be calculated
          averageComments: 0, // Will be calculated
          engagementRate: 0, // Will be calculated
          topCategories: ['lifestyle', 'fitness', 'food', 'travel'],
          recentGrowth: {
            followers: Math.floor(Math.random() * 500) + 100, // Random growth 100-600
            posts: 8,
            engagement: Math.floor(Math.random() * 20) + 5 // Random engagement 5-25%
          }
        },
        metadata: {
          lastUpdated: admin.firestore.Timestamp.now(),
          dataSource: 'test_data_comprehensive',
          fetchedAt: admin.firestore.Timestamp.now(),
          postsAnalyzed: 5,
          reelsAnalyzed: 3
        }
      };
      
      // Calculate analytics
      const allContent = [...testInstagramData.posts, ...testInstagramData.reels];
      testInstagramData.analytics.totalLikes = allContent.reduce((sum, item) => sum + item.likesCount, 0);
      testInstagramData.analytics.totalComments = allContent.reduce((sum, item) => sum + item.commentsCount, 0);
      testInstagramData.analytics.totalViews = testInstagramData.reels.reduce((sum, reel) => sum + reel.viewsCount, 0);
      testInstagramData.analytics.averageLikes = Math.round(testInstagramData.analytics.totalLikes / allContent.length);
      testInstagramData.analytics.averageComments = Math.round(testInstagramData.analytics.totalComments / allContent.length);
      testInstagramData.analytics.engagementRate = Math.round(
        ((testInstagramData.analytics.totalLikes + testInstagramData.analytics.totalComments) / 
         (testInstagramData.profile.followers * allContent.length)) * 100 * 100
      ) / 100;
      
      // Save to instagramDetailedData collection
      await db.collection('instagramDetailedData').doc(userId).set(testInstagramData);
      
      // Update user profile with Instagram username if not set
      if (!userData.instagramUsername) {
        await db.collection('users').doc(userId).update({
          instagramUsername: testInstagramData.profile.username
        });
        console.log(`📝 Updated user with Instagram username: ${testInstagramData.profile.username}`);
      }
      
      console.log('✅ Test Instagram data added successfully!');
      console.log(`📊 Profile: ${testInstagramData.profile.followers} followers, ${testInstagramData.posts.length} posts, ${testInstagramData.reels.length} reels`);
      console.log(`💡 Engagement Rate: ${testInstagramData.analytics.engagementRate}%`);
    }
    
    console.log('\n🎉 All users now have Instagram data!');
    console.log('🔄 Refresh your dashboard to see the data.');
    
  } catch (error) {
    console.error('❌ Error adding test Instagram data:', error);
  }
}

// Run the script
addInstagramTestData().then(() => {
  console.log('✨ Script completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});