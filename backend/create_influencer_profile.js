require('dotenv').config();
const { admin, db } = require('./config/firebase');

async function createInfluencerProfile() {
  try {
    console.log('🔧 Creating influencer profile for user...');
    
    const userId = '0ZPlyBVkHGHUEPRcxB2I';
    
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('❌ User not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ User found:', userData.email);
    
    // Check if influencer profile already exists
    const influencerDoc = await db.collection('influencers').doc(userId).get();
    if (influencerDoc.exists) {
      console.log('✅ Influencer profile already exists');
      return;
    }
    
    // Create basic influencer profile
    const influencerData = {
      // Basic info
      fullName: userData.fullName || userData.email.split('@')[0],
      email: userData.email,
      userId: userId,
      
      // Instagram info (will be populated when user connects Instagram)
      instagramUsername: '',
      followers: 0,
      following: 0,
      postsCount: 0,
      engagementRate: 0,
      
      // Profile completion
      bio: '',
      location: '',
      categories: [],
      contentTypes: [],
      priceRangeMin: 0,
      priceRangeMax: 0,
      
      // Status
      isActive: true,
      profileCompleted: false,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    };
    
    // Save influencer profile
    await db.collection('influencers').doc(userId).set(influencerData);
    console.log('✅ Influencer profile created successfully');
    
    // Update user role to influencer if not already
    if (userData.role !== 'influencer') {
      await db.collection('users').doc(userId).update({
        role: 'influencer'
      });
      console.log('✅ User role updated to influencer');
    }
    
    console.log('🎉 Setup complete! User can now access Instagram endpoints.');
    
  } catch (error) {
    console.error('❌ Error creating influencer profile:', error.message);
  }
  
  process.exit(0);
}

createInfluencerProfile();