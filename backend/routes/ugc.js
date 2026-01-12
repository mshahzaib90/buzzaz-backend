const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const pg = require('../services/db');
const upload = require('../middleware/upload');
const { uploadBufferToBlob } = require('../services/blob');
const youtubeService = require('../services/youtubeService');

const router = express.Router();

router.post('/profile', 
  authMiddleware, 
  requireRole('ugc_creator'),
  upload.single('sampleContent'),
  async (req, res) => {
  try {
    const userId = req.user.uid;
    let sampleContentValue = '';
    if (req.body.sampleContentType === 'upload' && req.file) {
      const { url } = await uploadBufferToBlob(req.file.buffer, req.file.mimetype, req.file.originalname || 'sampleContent');
      sampleContentValue = url;
    } else if (req.body.sampleContentType === 'link') {
      try {
        const links = typeof req.body.sampleContent === 'string' ? JSON.parse(req.body.sampleContent) : req.body.sampleContent;
        sampleContentValue = Array.isArray(links) ? links : [links];
      } catch (error) {
        return res.status(400).json({ errors: [{ msg: 'Invalid format for sample content links' }] });
      }
    }
    if (!sampleContentValue || (Array.isArray(sampleContentValue) && sampleContentValue.length === 0)) {
      return res.status(400).json({ errors: [{ msg: 'Sample content is required (either file upload or links)' }] });
    }
    let parsedNiche, parsedContentStyle, parsedLanguages;
    try {
      parsedNiche = typeof req.body.niche === 'string' ? JSON.parse(req.body.niche) : req.body.niche;
      parsedContentStyle = typeof req.body.contentStyle === 'string' ? JSON.parse(req.body.contentStyle) : req.body.contentStyle;
      parsedLanguages = typeof req.body.languages === 'string' ? JSON.parse(req.body.languages) : req.body.languages;
    } catch (error) {
      return res.status(400).json({ errors: [{ msg: 'Invalid format for niche, content style, or languages' }] });
    }
    const { fullName, email, phoneNumber, city, country, dateOfBirth, gender, maritalStatus, children, bio, location, sampleContentType, faceOrFaceless } = req.body;
    const exists = await pg.query('SELECT uid FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    if (exists.rowCount > 0) {
      return res.status(400).json({ message: 'UGC Creator profile already exists' });
    }
    const originalJson = {
      userId,
      fullName: fullName || null,
      email: email || null,
      phoneNumber: phoneNumber || null,
      city: city || null,
      country: country || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      maritalStatus: maritalStatus || null,
      children: children || null,
      bio: bio || null,
      location: location || null,
      sampleContent: sampleContentValue,
      sampleContentType: sampleContentType || null,
      niche: parsedNiche || [],
      contentStyle: parsedContentStyle || [],
      faceOrFaceless: faceOrFaceless || null,
      languages: parsedLanguages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      averageRating: 0,
      totalEarnings: 0
    };
    await pg.query(
      `INSERT INTO ugc_creators (uid, email, full_name, bio, location, categories, content_types, is_active, pricing, sample_content, created_at, updated_at, original_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8::jsonb,$9::jsonb,NOW(),NOW(),$10::jsonb)`,
      [
        userId,
        email || null,
        fullName || null,
        bio || null,
        location || null,
        Array.isArray(parsedNiche) ? parsedNiche : null,
        Array.isArray(parsedContentStyle) ? parsedContentStyle : null,
        null,
        JSON.stringify(sampleContentValue || null),
        JSON.stringify(originalJson)
      ]
    );
    await pg.query("UPDATE users SET role = 'ugc_creator' WHERE uid = $1 AND role = 'content_creator'", [userId]);
    res.status(201).json({ message: 'UGC Creator profile created successfully', profile: originalJson });
  } catch (error) {
    res.status(500).json({ message: 'Server error during profile creation' });
  }
});

// Get UGC Creator profile
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pg.query(
      `SELECT uc.uid, uc.email, uc.full_name, uc.bio, uc.location, uc.categories, uc.content_types, uc.is_active, uc.pricing, uc.sample_content, uc.created_at, uc.updated_at, uc.original_json,
              u.display_name AS user_display_name
       FROM ugc_creators uc
       LEFT JOIN users u ON u.uid = uc.uid
       WHERE uc.uid = $1 LIMIT 1`,
      [userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'UGC Creator profile not found' });
    }
    const r = result.rows[0];
    const orig = r.original_json || {};
    const profileData = {
      userId: r.uid,
      fullName: r.user_display_name || r.full_name || orig.fullName || null,
      email: r.email || orig.email || null,
      phoneNumber: orig.phoneNumber || null,
      city: orig.city || null,
      country: orig.country || null,
      dateOfBirth: orig.dateOfBirth || null,
      gender: orig.gender || null,
      maritalStatus: orig.maritalStatus || null,
      children: orig.children || null,
      bio: r.bio || orig.bio || null,
      location: r.location || orig.location || null,
      sampleContent: r.sample_content || orig.sampleContent || null,
      sampleContentType: orig.sampleContentType || null,
      niche: r.categories || orig.niche || [],
      contentStyle: r.content_types || orig.contentStyle || [],
      faceOrFaceless: orig.faceOrFaceless || null,
      languages: orig.languages || [],
      createdAt: r.created_at || orig.createdAt || new Date().toISOString(),
      updatedAt: r.updated_at || orig.updatedAt || new Date().toISOString(),
      isActive: typeof r.is_active === 'boolean' ? r.is_active : (typeof orig.isActive === 'boolean' ? orig.isActive : true),
      totalProjects: orig.totalProjects || 0,
      completedProjects: orig.completedProjects || 0,
      activeProjects: orig.activeProjects || 0,
      averageRating: orig.averageRating || 0,
      totalEarnings: orig.totalEarnings || 0
    };

    const latestStats = {
      totalProjects: profileData.totalProjects,
      completedProjects: profileData.completedProjects,
      activeProjects: profileData.activeProjects,
      averageRating: profileData.averageRating,
      totalEarnings: profileData.totalEarnings
    };

    res.set('Cache-Control', 'no-store');
    res.json({ profile: profileData, latestStats });
  } catch (error) {
    console.error('Get UGC Creator profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to parse JSON strings from FormData
const parseFormDataArrays = (req, res, next) => {
  // Parse JSON strings for array fields when using FormData
  const arrayFields = ['categories', 'contentTypes', 'niche', 'contentStyle', 'languages'];
  
  arrayFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        console.log(`Failed to parse ${field} as JSON:`, req.body[field]);
      }
    }
  });
  
  next();
};

// Update UGC Creator profile
router.put('/profile/:userId', 
  authMiddleware, 
  upload.single('sampleContent'),
  parseFormDataArrays,
  [
    body('fullName').optional().notEmpty(),
    body('bio').optional().notEmpty(),
    body('location').optional().notEmpty(),
    body('categories').optional().isArray({ min: 1 }),
    body('contentTypes').optional().isArray({ min: 1 }),
    body('reelPostPrice').optional().isFloat({ min: 0.01 }),
    body('staticPostPrice').optional().isFloat({ min: 0.01 }),
    body('reelStaticComboPrice').optional().isFloat({ min: 0.01 }),
    body('storyVideoPrice').optional().isFloat({ min: 0.01 }),
    body('storyShoutoutPrice').optional().isFloat({ min: 0.01 }),
    body('storyUnboxingPrice').optional().isFloat({ min: 0.01 }),
    body('eventAttendancePrice').optional().isFloat({ min: 0.01 }),
    body('outdoorShootPrice').optional().isFloat({ min: 0.01 }),
    body('expressDeliveryCharge').optional().isFloat({ min: 0.01 }),
    body('productBasedDelivery').optional().isString(),
    body('noProductDelivery').optional().isString(),
    body('expressDelivery').optional().isString(),
    body('outdoorEventDelivery').optional().isString(),
    body('revisionsDelivery').optional().isString()
  ], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { userId } = req.params;
    const requestingUserId = req.user.uid;
    if (userId !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    const exists = await pg.query('SELECT uid FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    const updateData = { ...req.body };
    if (req.body.sampleContentType === 'upload' && req.file) {
      const { url } = await uploadBufferToBlob(req.file.buffer, req.file.mimetype, req.file.originalname || 'sampleContent');
      updateData.sampleContent = url;
    } else if (req.body.sampleContentType === 'upload' && !req.file) {
      delete updateData.sampleContent;
    } else if (req.body.sampleContentType === 'link' && req.body.sampleContent) {
      try {
        const links = typeof req.body.sampleContent === 'string' ? JSON.parse(req.body.sampleContent) : req.body.sampleContent;
        updateData.sampleContent = Array.isArray(links) ? links : [links];
      } catch (error) {
        updateData.sampleContent = req.body.sampleContent;
      }
    }
    if (updateData.categories) {
      updateData.niche = updateData.categories;
      delete updateData.categories;
    }
    if (updateData.contentTypes) {
      updateData.contentStyle = updateData.contentTypes;
      delete updateData.contentTypes;
    }
    const pricingFields = [
      'reelPostPrice','staticPostPrice','reelStaticComboPrice','storyVideoPrice','storyShoutoutPrice','storyUnboxingPrice','eventAttendancePrice','outdoorShootPrice','expressDeliveryCharge'
    ];
    const pricing = {};
    pricingFields.forEach(f => { if (updateData[f]) pricing[f] = parseFloat(updateData[f]); });
    const origUpdate = { ...updateData, updatedAt: new Date().toISOString() };
    if (exists.rowCount === 0) {
      await pg.query(
        `INSERT INTO ugc_creators (uid, email, full_name, bio, location, categories, content_types, is_active, pricing, sample_content, created_at, updated_at, original_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8::jsonb,$9::jsonb,NOW(),NOW(),$10::jsonb)`,
        [
          userId,
          updateData.email || null,
          updateData.fullName || null,
          updateData.bio || null,
          updateData.location || null,
          Array.isArray(updateData.niche) ? updateData.niche : null,
          Array.isArray(updateData.contentStyle) ? updateData.contentStyle : null,
          Object.keys(pricing).length ? JSON.stringify(pricing) : null,
          updateData.sampleContent ? JSON.stringify(updateData.sampleContent) : null,
          JSON.stringify({ ...origUpdate, createdAt: new Date().toISOString(), isActive: true })
        ]
      );
      return res.json({ message: 'Profile created successfully', profile: origUpdate });
    }
    await pg.query(
      `UPDATE ugc_creators SET 
        email = COALESCE($2,email),
        full_name = COALESCE($3,full_name),
        bio = COALESCE($4,bio),
        location = COALESCE($5,location),
        categories = COALESCE($6, categories),
        content_types = COALESCE($7, content_types),
        pricing = COALESCE($8::jsonb,pricing),
        sample_content = COALESCE($9::jsonb,sample_content),
        updated_at = NOW(),
        original_json = COALESCE(original_json::jsonb, '{}'::jsonb) || $10::jsonb
      WHERE uid = $1`,
      [
        userId,
        updateData.email || null,
        updateData.fullName || null,
        updateData.bio || null,
        updateData.location || null,
        Array.isArray(updateData.niche) ? updateData.niche : null,
        Array.isArray(updateData.contentStyle) ? updateData.contentStyle : null,
        Object.keys(pricing).length ? JSON.stringify(pricing) : null,
        updateData.sampleContent ? JSON.stringify(updateData.sampleContent) : null,
        JSON.stringify(origUpdate)
      ]
    );
    const resGet = await pg.query('SELECT uid, email, full_name, bio, location, categories, content_types, sample_content, updated_at, original_json FROM ugc_creators WHERE uid = $1', [userId]);
    const r = resGet.rows[0];
    const merged = r.original_json || {};
    const profile = {
      userId: r.uid,
      fullName: r.full_name || merged.fullName || null,
      email: r.email || merged.email || null,
      bio: r.bio || merged.bio || null,
      location: r.location || merged.location || null,
      sampleContent: r.sample_content || merged.sampleContent || null,
      niche: r.categories || merged.niche || [],
      contentStyle: r.content_types || merged.contentStyle || [],
      updatedAt: r.updated_at || merged.updatedAt || new Date().toISOString()
    };
    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('UGC profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Get UGC Creator stats history (mock endpoint for now)
router.get('/stats/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pg.query('SELECT uid FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'UGC Creator profile not found' });
    }
    const statsHistory = [
      { month: 'Jan', projects: 2, earnings: 500 },
      { month: 'Feb', projects: 3, earnings: 750 },
      { month: 'Mar', projects: 4, earnings: 1000 },
      { month: 'Apr', projects: 3, earnings: 800 },
      { month: 'May', projects: 5, earnings: 1200 },
      { month: 'Jun', projects: 4, earnings: 950 }
    ];
    res.json(statsHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all UGC Creators (for brands to browse)
router.get('/browse', authMiddleware, async (req, res) => {
  try {
    const { categories, contentTypes, minPrice, maxPrice, location, page = 1, limit = 10 } = req.query;
    const result = await pg.query('SELECT uid, email, full_name, bio, location, categories, content_types, is_active, pricing, sample_content, original_json FROM ugc_creators WHERE is_active = TRUE');
    let creators = result.rows.map(r => {
      const data = r.original_json || {};
      return {
        id: r.uid,
        email: r.email || data.email || null,
        fullName: r.full_name || data.fullName || null,
        bio: r.bio || data.bio || null,
        location: r.location || data.location || null,
        niche: r.categories || data.niche || [],
        contentStyle: r.content_types || data.contentStyle || [],
        pricing: r.pricing || null,
        sampleContent: r.sample_content || data.sampleContent || null,
        isActive: r.is_active === true
      };
    });
    if (categories) {
      const categoryArray = categories.split(',').map(s => s.trim()).filter(Boolean);
      creators = creators.filter(c => Array.isArray(c.niche) && c.niche.some(x => categoryArray.includes(x)));
    }
    if (contentTypes) {
      const typeArray = contentTypes.split(',').map(s => s.trim()).filter(Boolean);
      creators = creators.filter(c => Array.isArray(c.contentStyle) && c.contentStyle.some(x => typeArray.includes(x)));
    }
    if (location) {
      creators = creators.filter(c => String(c.location || '').toLowerCase() === String(location).toLowerCase());
    }
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const pricingFields = ['reelPostPrice','staticPostPrice','reelStaticComboPrice','storyVideoPrice','storyShoutoutPrice','storyUnboxingPrice','eventAttendancePrice','outdoorShootPrice'];
      creators = creators.filter(c => {
        const p = c.pricing || {};
        const hasMatch = pricingFields.some(f => typeof p[f] === 'number' && p[f] >= min && p[f] <= max);
        const oldMin = c.priceRangeMin;
        const oldMax = c.priceRangeMax;
        const hasOld = typeof oldMin === 'number' && typeof oldMax === 'number' && !(oldMax < min || oldMin > max);
        return hasMatch || hasOld;
      });
    }
    const p = parseInt(page);
    const l = parseInt(limit);
    const startIndex = (p - 1) * l;
    const endIndex = startIndex + l;
    const paginatedCreators = creators.slice(startIndex, endIndex);
    res.json({ creators: paginatedCreators, totalCount: creators.length, currentPage: p, totalPages: Math.ceil(creators.length / l) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// YouTube Analytics Endpoints for UGC Creators

// Refresh YouTube data and analytics
router.post('/:id/youtube/refresh', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.uid;
    if (id !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to refresh this profile' });
    }
    const lastRes = await pg.query("SELECT channel_id FROM youtube_analytics WHERE uid = $1 AND user_type = 'ugc_creator' ORDER BY created_at DESC LIMIT 1", [id]);
    const channelId = lastRes.rows[0]?.channel_id;
    if (!channelId) {
      return res.status(400).json({ message: 'YouTube channel not connected' });
    }
    const youtubeData = await youtubeService.getComprehensiveChannelData(channelId);
    await pg.query(
      `INSERT INTO youtube_analytics (uid, channel_id, channel_title, channel_url, user_type, subscriber_count, view_count, video_count, analytics)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        youtubeData.channelId || channelId,
        youtubeData.channelTitle || null,
        youtubeData.channelUrl || null,
        'ugc_creator',
        youtubeData.subscriberCount || 0,
        youtubeData.viewCount || 0,
        youtubeData.videoCount || 0,
        JSON.stringify(youtubeData.analytics || {})
      ]
    );
    res.json({ success: true, message: 'YouTube data refreshed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to refresh YouTube data', error: error.message });
  }
});

// Get detailed YouTube analytics
router.get('/:id/youtube/detailed', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.uid;
    if (id !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to access this profile' });
    }
    const ares = await pg.query("SELECT channel_id, channel_title, subscriber_count, view_count, video_count, analytics, created_at FROM youtube_analytics WHERE uid = $1 AND user_type = 'ugc_creator' ORDER BY created_at DESC LIMIT 1", [id]);
    if (ares.rowCount === 0) {
      return res.status(404).json({ message: 'No YouTube analytics data found. Please refresh data first.', shouldRefresh: true });
    }
    const row = ares.rows[0];
    const responseData = {
      channelInfo: {
        channelId: row.channel_id,
        channelTitle: row.channel_title,
        subscriberCount: row.subscriber_count,
        viewCount: row.view_count,
        videoCount: row.video_count
      },
      analytics: row.analytics || {},
      recentVideos: [],
      lastUpdated: row.created_at,
      createdAt: row.created_at
    };
    res.json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch YouTube analytics', error: error.message });
  }
});

// Search and connect YouTube channel
router.post('/:id/youtube/connect', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { channelQuery } = req.body;
    const requestingUserId = req.user.uid;
    if (id !== requestingUserId) {
      return res.status(403).json({ message: 'Unauthorized to update this profile' });
    }
    if (!channelQuery || String(channelQuery).trim() === '') {
      return res.status(400).json({ message: 'Channel query is required' });
    }
    let rawQuery = String(channelQuery).trim();
    rawQuery = rawQuery.replace(/^https:\/\//, 'https://').replace(/^https:\//, 'https://').replace(/^http:\/\//, 'http://').replace(/^http:\//, 'http://');
    const isUrl = /youtube\.com\//i.test(rawQuery);
    const isChannelId = /^UC[A-Za-z0-9_-]+$/.test(rawQuery);
    const hasAt = rawQuery.startsWith('@');
    const looksLikeHandleToken = /^[A-Za-z0-9._-]+$/.test(rawQuery);
    const normalizedQuery = isUrl || isChannelId || hasAt ? rawQuery : (looksLikeHandleToken ? `@${rawQuery}` : rawQuery);
    const resolved = await youtubeService.searchChannel(normalizedQuery);
    const data = await youtubeService.getComprehensiveChannelData(resolved.channelId);
    const channelId = data.channelId || resolved.channelId || null;
    const channelTitle = resolved.channelTitle || data.channelTitle || null;
    const channelUrl = (resolved.channelUrl || data.channelUrl || normalizedQuery)
      .replace(/^https:\/\//, 'https://')
      .replace(/^https:\//, 'https://')
      .replace(/^http:\/\//, 'http://')
      .replace(/^http:\//, 'http://');
    await pg.query(
      `INSERT INTO youtube_analytics (uid, channel_id, channel_title, channel_url, user_type, subscriber_count, view_count, video_count, analytics)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        channelId,
        channelTitle,
        channelUrl,
        'ugc_creator',
        data.subscriberCount || 0,
        data.viewCount || 0,
        data.videoCount || 0,
        JSON.stringify(data.analytics || {})
      ]
    );
    res.json({
      success: true,
      message: 'YouTube channel connected successfully',
      data: {
        channelId,
        channelTitle,
        channelUrl,
        subscriberCount: data.subscriberCount || 0,
        viewCount: data.viewCount || 0,
        videoCount: data.videoCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to connect YouTube channel', error: error.message });
  }
});

module.exports = router;
