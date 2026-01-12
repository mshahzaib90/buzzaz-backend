const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const pg = require('../services/db');

const router = express.Router();

// Get all influencers and UGC creators for chat (brands only)
router.get('/all', authMiddleware, requireRole(['brand', 'admin']), async (req, res) => {
  try {
    const infRes = await pg.query(
      `SELECT u.uid AS id,
              COALESCE(u.display_name, ip.full_name, u.email, 'Unknown') AS full_name,
              u.email AS email,
              ip.avatar_url AS avatar
       FROM instagram_profiles ip
       JOIN users u ON u.uid = ip.uid
       WHERE u.role = 'influencer'`
    );

    const ugcRes = await pg.query(
      `SELECT u.uid AS id,
              COALESCE(u.display_name, gc.full_name, u.email, 'Unknown') AS full_name,
              u.email AS email
       FROM ugc_creators gc
       JOIN users u ON u.uid = gc.uid
       WHERE u.role = 'ugc_creator'`
    );

    const influencers = infRes.rows.map(r => ({ id: r.id, fullName: r.full_name, email: r.email, role: 'influencer', avatar: r.avatar || null }));
    const ugcCreators = ugcRes.rows.map(r => ({ id: r.id, fullName: r.full_name, email: r.email, role: 'ugc_creator', avatar: null }));
    const users = [...influencers, ...ugcCreators];

    res.set('Cache-Control', 'no-store');
    res.json({ users });
  } catch (error) {
    console.error('Get all creators for chat error (PG):', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get list of influencers with filters and pagination
router.get('/', authMiddleware, requireRole(['brand', 'admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      minFollowers,
      maxFollowers,
      sortBy = 'followers',
      sortOrder = 'desc',
      type
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const rowsRes = await pg.query(
      `SELECT ip.uid AS id,
              COALESCE(u.display_name, ip.full_name, u.email) AS full_name,
              ip.username AS instagram_username,
              ip.bio,
              ip.avatar_url,
              COALESCE(ip.followers, 0) AS followers,
              COALESCE(ip.following, 0) AS following,
              COALESCE(ip.posts_count, 0) AS posts_count,
              ip.engagement_rate,
              ip.is_verified,
              ip.last_updated,
              inf.pricing
       FROM instagram_profiles ip
       JOIN users u ON u.uid = ip.uid
       LEFT JOIN influencers inf ON inf.uid = ip.uid`
    );

    // MOCK UGC DATA if requested or mixed
    // Ideally we should have a 'type' column or separate table for UGC creators
    // For now, let's inject some mock UGC creators if we are fetching the main list
    const mockUGC = [
        {
            id: 'ugc_1',
            full_name: 'Sarah UGC',
            instagram_username: 'sarah.ugc',
            bio: 'Creating authentic UGC content for brands | Lifestyle & Beauty',
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            followers: 12500,
            following: 450,
            posts_count: 320,
            engagement_rate: 4.5,
            is_verified: false,
            last_updated: new Date(),
            type: 'ugc',
            pricing: { reelPostPrice: 150, storyPrice: 50 }
        },
        {
            id: 'ugc_2',
            full_name: 'Mike Content',
            instagram_username: 'mike_creates',
            bio: 'Tech reviewer and UGC creator. Let me showcase your product!',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            followers: 8500,
            following: 200,
            posts_count: 150,
            engagement_rate: 6.2,
            is_verified: false,
            last_updated: new Date(),
            type: 'ugc',
            pricing: { reelPostPrice: 200, storyPrice: 80 }
        },
        {
            id: 'ugc_3',
            full_name: 'Emma Lifestyle',
            instagram_username: 'emma.life.ugc',
            bio: 'Aesthetic UGC for home & decor brands',
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
            followers: 5400,
            following: 890,
            posts_count: 410,
            engagement_rate: 3.8,
            is_verified: false,
            last_updated: new Date(),
            type: 'ugc',
            pricing: { reelPostPrice: 120, storyPrice: 40 }
        }
    ];

    let influencers = rowsRes.rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      instagramUsername: r.instagram_username,
      bio: r.bio,
      avatarUrl: r.avatar_url,
      location: null,
      followers: r.followers,
      following: r.following,
      postsCount: r.posts_count,
      engagementRate: r.engagement_rate,
      isVerified: r.is_verified,
      lastSyncedAt: r.last_updated,
      pricing: r.pricing || null,
      type: 'influencer' // Default type from DB
    }));

    // Merge mock UGC
    influencers = [...influencers, ...mockUGC.map(u => ({
        id: u.id,
        fullName: u.full_name,
        instagramUsername: u.instagram_username,
        bio: u.bio,
        avatarUrl: u.avatar_url,
        location: null,
        followers: u.followers,
        following: u.following,
        postsCount: u.posts_count,
        engagementRate: u.engagement_rate,
        isVerified: u.is_verified,
        lastSyncedAt: u.last_updated,
        pricing: u.pricing,
        type: 'ugc'
    }))];

    if (minFollowers) {
      const min = parseInt(minFollowers);
      influencers = influencers.filter(i => (i.followers || 0) >= min);
    }
    if (maxFollowers) {
      const max = parseInt(maxFollowers);
      influencers = influencers.filter(i => (i.followers || 0) <= max);
    }

    if (type && type !== 'all') {
      influencers = influencers.filter(i => i.type === type);
    }

    const validSortFields = ['followers', 'engagementRate', 'lastSyncedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'followers';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    influencers.sort((a, b) => {
      const aVal = a[sortField] || 0;
      const bVal = b[sortField] || 0;
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? -1 : 1;
    });

    const total = influencers.length;
    const paginatedInfluencers = influencers.slice(offset, offset + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.set('Cache-Control', 'no-store');
    res.json({
      influencers: paginatedInfluencers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        minFollowers,
        maxFollowers,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    });

  } catch (error) {
    console.error('Get influencers list error (PG):', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get filter options for the frontend
router.get('/filters', authMiddleware, requireRole(['brand', 'admin']), async (req, res) => {
  try {
    const resFollowers = await pg.query('SELECT followers FROM instagram_profiles WHERE followers IS NOT NULL');
    const followersArr = resFollowers.rows.map(r => r.followers);
    const followerRange = {
      min: followersArr.length ? Math.min(...followersArr) : 0,
      max: followersArr.length ? Math.max(...followersArr) : 0,
    };

    res.json({
      locations: [],
      categories: [],
      contentTypes: [],
      genders: [],
      followerRange,
    });
  } catch (error) {
    console.error('Get filter options error (PG):', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search influencers by name or username
router.get('/search', authMiddleware, requireRole(['brand', 'admin']), async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const limitNum = parseInt(limit);
    const term = `%${q.trim()}%`;

    const searchRes = await pg.query(
      `SELECT uid AS id, full_name, username AS instagram_username, avatar_url, followers
       FROM instagram_profiles
       WHERE (full_name ILIKE $1 OR username ILIKE $1)
       LIMIT $2`,
      [term, limitNum]
    );
    const results = searchRes.rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      instagramUsername: r.instagram_username,
      avatarUrl: r.avatar_url,
      followers: r.followers || 0,
    }));

    res.json({
      results,
      query: q,
      total: results.length,
    });

  } catch (error) {
    console.error('Search influencers error (PG):', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
