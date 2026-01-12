const { admin, db } = require('./config/firebase');

const sampleInfluencers = [
  {
    id: 'influencer1',
    fullName: 'Sarah Johnson',
    instagramUsername: 'sarahjohnson_fit',
    bio: 'Fitness enthusiast and lifestyle blogger. Sharing my journey to inspire others to live their best life! 💪✨',
    location: 'Los Angeles, CA',
    gender: 'female',
    categories: ['Fitness', 'Lifestyle', 'Health'],
    contentTypes: ['Photos', 'Stories', 'Reels'],
    avatarUrl: '/images/profiles/placeholder.svg',
    followers: 125000,
    following: 850,
    postsCount: 1250,
    engagementRate: 0.045,
    isVerified: true,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'influencer2',
    fullName: 'Mike Chen',
    instagramUsername: 'mikechentech',
    bio: 'Tech reviewer and gadget enthusiast. Latest reviews and tech tips for everyone! 📱💻',
    location: 'San Francisco, CA',
    gender: 'male',
    categories: ['Technology', 'Reviews', 'Gaming'],
    contentTypes: ['Photos', 'Videos', 'Stories'],
    avatarUrl: '/images/profiles/placeholder.svg',
    followers: 89000,
    following: 420,
    postsCount: 890,
    engagementRate: 0.038,
    isVerified: false,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'influencer3',
    fullName: 'Emma Rodriguez',
    instagramUsername: 'emmasfashion',
    bio: 'Fashion stylist and beauty lover. Bringing you the latest trends and style inspiration! 👗💄',
    location: 'New York, NY',
    gender: 'female',
    categories: ['Fashion', 'Beauty', 'Lifestyle'],
    contentTypes: ['Photos', 'Stories', 'Reels'],
    avatarUrl: '/images/profiles/placeholder.svg',
    followers: 156000,
    following: 1200,
    postsCount: 2100,
    engagementRate: 0.052,
    isVerified: true,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'influencer4',
    fullName: 'David Park',
    instagramUsername: 'davidparkfood',
    bio: 'Food blogger and chef. Exploring the best cuisines around the world! 🍜🌮',
    location: 'Chicago, IL',
    gender: 'male',
    categories: ['Food', 'Travel', 'Lifestyle'],
    contentTypes: ['Photos', 'Stories', 'Videos'],
    avatarUrl: '/images/profiles/placeholder.svg',
    followers: 78000,
    following: 650,
    postsCount: 1450,
    engagementRate: 0.041,
    isVerified: false,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'influencer5',
    fullName: 'Lisa Thompson',
    instagramUsername: 'lisathompsonart',
    bio: 'Digital artist and creative director. Sharing my art journey and creative process! 🎨✨',
    location: 'Austin, TX',
    gender: 'female',
    categories: ['Art', 'Design', 'Creative'],
    contentTypes: ['Photos', 'Stories', 'Reels'],
    avatarUrl: '/images/profiles/placeholder.svg',
    followers: 45000,
    following: 380,
    postsCount: 680,
    engagementRate: 0.067,
    isVerified: false,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'influencer6',
    fullName: 'Alex Martinez',
    instagramUsername: 'alexmartineztravel',
    bio: 'Travel photographer and adventure seeker. Capturing the beauty of our world! 🌍📸',
    location: 'Miami, FL',
    gender: 'male',
    categories: ['Travel', 'Photography', 'Adventure'],
    contentTypes: ['Photos', 'Stories', 'Videos'],
    avatarUrl: '/images/profiles/alexmartineztravel.jpg',
    followers: 112000,
    following: 920,
    postsCount: 1850,
    engagementRate: 0.043,
    isVerified: true,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    isActive: true
  }
];

const seedInfluencers = async () => {
  try {
    console.log('Starting to seed influencer data...');
    
    const batch = db.batch();
    
    sampleInfluencers.forEach(influencer => {
      const { id, ...data } = influencer;
      const docRef = db.collection('influencers').doc(id);
      batch.set(docRef, data);
    });
    
    await batch.commit();
    
    console.log(`Successfully seeded ${sampleInfluencers.length} influencers`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding influencer data:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedInfluencers();