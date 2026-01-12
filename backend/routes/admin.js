const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const pg = require('../services/db');
const { saveInstagramProfileData } = require('../services/postgresInstagram');

const router = express.Router();

// Middleware to ensure only admins and support can access these routes
router.use(authMiddleware);
router.use(requireRole(['admin', 'support']));

// Get all users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role = '', status = '', search = '' } = req.query;
    const p = parseInt(page);
    const l = parseInt(limit);
    const offset = (p - 1) * l;
    const where = [];
    const vals = [];
    if (role) {
      vals.push(role);
      where.push(`role = $${vals.length}`);
    }
    if (status) {
      const isActive = status === 'active';
      vals.push(isActive);
      where.push(`is_active = $${vals.length}`);
    }
    if (search) {
      vals.push(`%${String(search).toLowerCase()}%`);
      const idx = vals.length;
      where.push(`(LOWER(email) LIKE $${idx} OR LOWER(display_name) LIKE $${idx} OR uid ILIKE $${idx})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRes = await pg.query(`SELECT COUNT(*)::int AS count FROM users ${whereSql}`, vals);
    const count = totalRes.rows[0]?.count || 0;
    const usersRes = await pg.query(
      `SELECT uid, email, role, display_name, is_active, created_at,
        COALESCE((social_connections->'sponsored'->>'active')::boolean, FALSE) AS is_sponsored
       FROM users ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
      [...vals, l, offset]
    );
    const users = usersRes.rows.map(r => ({
      uid: r.uid,
      email: r.email,
      role: r.role,
      fullName: r.display_name || null,
      isActive: r.is_active,
      isSponsored: r.is_sponsored,
      createdAt: r.created_at,
    }));
    const totalPages = Math.max(1, Math.ceil(count / l));
    return res.json({ users, pagination: { currentPage: p, totalPages, totalUsers: count, limit: l, hasNext: offset + users.length < count, hasPrev: p > 1 } });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRes = await pg.query('SELECT COUNT(*)::int AS count FROM users');
    const activeRes = await pg.query('SELECT COUNT(*)::int AS count FROM users WHERE is_active = TRUE');
    const sponsoredRes = await pg.query("SELECT COUNT(*)::int AS count FROM users WHERE COALESCE((social_connections->'sponsored'->>'active')::boolean, FALSE) = TRUE");
    const recentRes = await pg.query("SELECT COUNT(*)::int AS count FROM users WHERE created_at > NOW() - INTERVAL '30 days'");
    const roleRes = await pg.query('SELECT role, COUNT(*)::int AS count FROM users GROUP BY role');
    const map = { influencers: 0, ugcCreators: 0, seeders: 0, brands: 0, admins: 0 };
    for (const r of roleRes.rows) {
      if (r.role === 'influencer') map.influencers = r.count;
      else if (r.role === 'ugc_creator') map.ugcCreators = r.count;
      else if (r.role === 'seeder') map.seeders = r.count;
      else if (r.role === 'brand') map.brands = r.count;
      else if (r.role === 'admin') map.admins = r.count;
    }
    return res.json({
      totalUsers: totalRes.rows[0]?.count || 0,
      activeUsers: activeRes.rows[0]?.count || 0,
      sponsoredUsers: sponsoredRes.rows[0]?.count || 0,
      recentSignups: recentRes.rows[0]?.count || 0,
      usersByRole: map,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// List campaigns
router.get('/campaigns', async (req, res) => {
  console.log('GET /campaigns request received');
  try {
    console.log('User accessing campaigns:', req.user?.uid, req.user?.role);
    
    await pg.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_by TEXT NOT NULL,
        participants JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        estimated_budget NUMERIC,
        deliverables TEXT,
        metadata JSONB
      )
    `);
    // Ensure columns exist for existing tables
    await pg.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS estimated_budget NUMERIC');
    await pg.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deliverables TEXT');
    await pg.query('ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS metadata JSONB');

    const result = await pg.query(`
      SELECT c.id, c.name, c.description, c.start_date, c.end_date, c.created_by,
             u.email AS created_by_email, u.display_name AS created_by_name,
             c.participants, c.created_at, c.estimated_budget, c.deliverables, c.metadata
      FROM campaigns c
      LEFT JOIN users u ON u.uid = c.created_by
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    console.log('Campaigns fetched:', result.rowCount);
    
    const campaigns = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      startDate: r.start_date,
      endDate: r.end_date,
      createdBy: r.created_by,
      createdByEmail: r.created_by_email || null,
      createdByName: r.created_by_name || null,
      participants: r.participants,
      createdAt: r.created_at,
      estimatedBudget: r.estimated_budget,
      deliverables: r.deliverables,
      metadata: r.metadata
    }));
    res.json({ campaigns });
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ message: 'Server error while fetching campaigns' });
  }
});

// Create campaign by admin
router.post('/campaigns', async (req, res) => {
  try {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_by TEXT NOT NULL,
        participants JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        estimated_budget NUMERIC,
        deliverables TEXT
      )
    `);
    const { name, startDate, endDate, description, participants, estimatedBudget, deliverables } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    if (start > end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Ensure sequence exists and aligned with existing c-IDs
    try {
      await pg.query(`SELECT last_value FROM campaign_id_seq`);
    } catch (e) {
      await pg.query(`CREATE SEQUENCE campaign_id_seq START 1`);
    }
    const maxRes = await pg.query(
      `SELECT COALESCE(MAX((regexp_replace(id, '^c-', ''))::int), 0) AS max_num
       FROM campaigns
       WHERE id ~ '^c-\\d+$'`
    );
    const maxNum = maxRes.rows[0]?.max_num || 0;
    await pg.query(`SELECT setval('campaign_id_seq', $1)`, [maxNum]);
    const seqRes = await pg.query(`SELECT nextval('campaign_id_seq') AS seq`);
    const seq = seqRes.rows[0]?.seq || (maxNum + 1);
    const id = `c-${String(seq).padStart(2, '0')}`;
    const parts = Array.isArray(participants) ? { ids: participants } : { ids: [] };
    await pg.query(
      `INSERT INTO campaigns (id, name, description, start_date, end_date, created_by, participants, created_at, estimated_budget, deliverables)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)`,
      [id, name, description || '', startDate, endDate, uid, JSON.stringify(parts), estimatedBudget || null, deliverables || '']
    );
    const created = await pg.query(
      `SELECT c.id, c.name, c.description, c.start_date, c.end_date, c.created_by,
              u.email AS created_by_email, u.display_name AS created_by_name,
              c.participants, c.created_at, c.estimated_budget, c.deliverables
       FROM campaigns c
       LEFT JOIN users u ON u.uid = c.created_by
       WHERE c.id = $1 LIMIT 1`,
      [id]
    );
    const r = created.rows[0];
    return res.json({
      success: true,
      campaign: {
        id: r.id,
        name: r.name,
        description: r.description,
        startDate: r.start_date,
        endDate: r.end_date,
        createdBy: r.created_by,
        createdByEmail: r.created_by_email || null,
        createdByName: r.created_by_name || null,
        participants: r.participants,
        createdAt: r.created_at,
      }
    });
  } catch (error) {
    console.error('Admin create campaign error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ message: 'Server error while creating campaign', error: dev ? String(error?.message || error) : undefined });
  }
});

// Update campaign by admin
router.put('/campaigns/:id', async (req, res) => {
  try {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_by TEXT NOT NULL,
        participants JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const { id } = req.params;
    const { name, startDate, endDate, description, participants } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }
    const chk = await pg.query('SELECT id FROM campaigns WHERE id = $1 LIMIT 1', [id]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    const sets = ['name = $1', 'description = $2', 'start_date = $3', 'end_date = $4'];
    const vals = [name, description || '', startDate, endDate];
    if (Array.isArray(participants)) {
      sets.push('participants = $5');
      vals.push(JSON.stringify({ ids: participants }));
      vals.push(id);
      await pg.query(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = $6`, vals);
    } else {
      vals.push(id);
      await pg.query(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = $5`, vals);
    }
    res.json({ success: true, campaignId: id });
  } catch (error) {
    console.error('Admin update campaign error:', error);
    res.status(500).json({ message: 'Server error while updating campaign' });
  }
});

// Delete campaign by admin
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chk = await pg.query('SELECT id FROM campaigns WHERE id = $1 LIMIT 1', [id]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    await pg.query('DELETE FROM campaigns WHERE id = $1', [id]);
    res.json({ success: true, campaignId: id });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    res.status(500).json({ message: 'Server error while deleting campaign' });
  }
});


// Create a new user (influencer or UGC creator)
router.post(
  '/users',
  async (req, res) => {
    try {
      const { email, password, role, fullName } = req.body || {};
      const errs = [];
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
      if (!isEmail(email)) errs.push({ param: 'email', msg: 'Invalid email' });
      if (!String(password || '').trim() || String(password || '').length < 6) errs.push({ param: 'password', msg: 'Password must be at least 6 characters' });
      const allowed = ['influencer', 'ugc_creator', 'brand', 'seeder'];
      if (!allowed.includes(String(role || ''))) errs.push({ param: 'role', msg: 'Invalid role' });
      if (fullName && !String(fullName).trim()) errs.push({ param: 'fullName', msg: 'Full name cannot be empty' });
      if (errs.length) return res.status(400).json({ errors: errs });

      // Postgres-only: check for existing user by email

      // Check for existing user in Postgres by email
      const existingPg = await pg.query('SELECT uid FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
      if (existingPg.rowCount > 0) {
        return res.status(400).json({ message: 'Email already exists in database' });
      }

      // Generate a uid
      const uid = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Resolve password column for Postgres
      const colsRes = await pg.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name IN ('password','password_hash')"
      );
      const cols = colsRes.rows.map(r => r.column_name);
      const passwordCol = cols.includes('password') ? 'password' : (cols.includes('password_hash') ? 'password_hash' : null);
      if (!passwordCol) {
        return res.status(500).json({ message: 'Users table missing password column' });
      }

      // Insert into Postgres
      await pg.query(
        `INSERT INTO users (uid, email, role, display_name, ${passwordCol}, is_active, created_at) VALUES ($1, $2, $3, $4, $5, TRUE, NOW())`,
        [uid, email, role, fullName || null, hashedPassword]
      );

      

      // Optional: Prefill profile data from wizard fields when provided
      const profile = req.body.profile || null;
      let profileResult = null;

      const parseCsv = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(v => !!(String(v).trim()));
        return String(val)
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      };

      if (profile && role === 'influencer') {
        // Compose influencer profile for Postgres
        const city = profile.city || null;
        const country = profile.country || null;
        const location = profile.location || [city, country].filter(Boolean).join(', ') || null;
        const influencerData = {
          userId: uid,
          fullName: fullName || profile.fullName || null,
          email,
          phoneNumber: profile.phoneNumber || null,
          city,
          country,
          location,
          gender: profile.gender || null,
          dateOfBirth: profile.dateOfBirth || null,
          bio: profile.bio || null,
          instagramUsername: profile.instagramUsername || null,
          categories: parseCsv(profile.categories),
          contentTypes: parseCsv(profile.contentTypes),
          languages: parseCsv(profile.languages),
          pricingTier: profile.pricingTier || null,
          priceRangeMin: profile.priceRangeMin || null,
          priceRangeMax: profile.priceRangeMax || null,
          deliverables: parseCsv(profile.deliverables),
          averageDeliveryTime: profile.averageDeliveryTime || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };

        try {
          // Upsert minimal instagram_profiles row in Postgres so onboarding is considered complete
          await saveInstagramProfileData(uid, {
            username: influencerData.instagramUsername || null,
            fullName: influencerData.fullName || null,
            bio: influencerData.bio || null,
            followers: 0,
            following: 0,
            postsCount: 0,
            isVerified: false,
            isPrivate: false,
            avatarUrl: null,
            engagementRate: null,
          });
          profileResult = { role, collection: 'instagram_profiles', created: true };
        } catch (pfErr) {
          console.error('Failed to prefill influencer profile:', pfErr);
          profileResult = { role, collection: 'influencers', created: false, error: String(pfErr?.message || pfErr) };
        }
      } else if (profile && (role === 'ugc_creator' || role === 'seeder')) {
        // Compose UGC profile for Postgres
        const city = profile.city || null;
        const country = profile.country || null;
        const location = profile.location || [city, country].filter(Boolean).join(', ') || null;
        const sampleLinks = parseCsv(profile.sampleContentLinks);
        const ugcData = {
          userId: uid,
          fullName: fullName || profile.fullName || null,
          email,
          phoneNumber: profile.phoneNumber || null,
          city,
          country,
          dateOfBirth: profile.dateOfBirth || null,
          gender: profile.gender || null,
          maritalStatus: profile.maritalStatus || null,
          children: profile.children || null,
          bio: profile.bio || null,
          location,
          sampleContent: sampleLinks.length > 0 ? sampleLinks : null,
          sampleContentType: sampleLinks.length > 0 ? 'link' : null,
          niche: parseCsv(profile.niche),
          contentStyle: parseCsv(profile.contentStyle),
          faceOrFaceless: profile.faceOrFaceless || null,
          languages: parseCsv(profile.languages),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          totalProjects: 0,
          completedProjects: 0,
          activeProjects: 0,
          averageRating: 0,
          totalEarnings: 0
        };

        try {
          // Upsert minimal ugc_creators row in Postgres
          await pg.query(
            `INSERT INTO ugc_creators (
              uid, email, full_name, bio, location, categories, content_types,
              is_active, pricing, sample_content, created_at, updated_at, original_json
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,
              TRUE,$8::jsonb,$9::jsonb,NOW(),NOW(),$10::jsonb
            )
            ON CONFLICT (uid) DO UPDATE SET
              email = EXCLUDED.email,
              full_name = EXCLUDED.full_name,
              bio = EXCLUDED.bio,
              location = EXCLUDED.location,
              categories = EXCLUDED.categories,
              content_types = EXCLUDED.content_types,
              is_active = EXCLUDED.is_active,
              pricing = EXCLUDED.pricing,
              sample_content = EXCLUDED.sample_content,
              updated_at = EXCLUDED.updated_at,
              original_json = EXCLUDED.original_json`,
            [
              uid,
              email || null,
              ugcData.fullName || null,
              ugcData.bio || null,
              ugcData.location || null,
              Array.isArray(ugcData.niche) ? ugcData.niche : null,
              Array.isArray(ugcData.contentStyle) ? ugcData.contentStyle : null,
              null,
              ugcData.sampleContent ? JSON.stringify(ugcData.sampleContent) : null,
              JSON.stringify(ugcData)
            ]
          );
          profileResult = { role, collection: 'ugc_creators', created: true };
        } catch (pfErr) {
          console.error('Failed to prefill UGC profile:', pfErr);
          profileResult = { role, collection: 'ugc_creators', created: false, error: String(pfErr?.message || pfErr) };
        }
      }

      res.status(201).json({ message: 'User created', uid, profileResult });
    } catch (error) {
      console.error('Create user error:', error);
      const dev = process.env.NODE_ENV !== 'production';
      res.status(500).json({ message: 'Server error while creating user', error: dev ? String(error?.message || error) : undefined });
    }
  }
);

// Get detailed user information
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ures = await pg.query('SELECT uid, email, role, display_name, is_active, created_at, social_connections FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (ures.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const u = ures.rows[0];
    let profileData = null;
    if (u.role === 'influencer') {
      const ipRes = await pg.query('SELECT bio, avatar_url, username, followers, following, posts_count, engagement_rate, is_verified, is_private FROM instagram_profiles WHERE uid = $1 LIMIT 1', [userId]);
      const infRes = await pg.query('SELECT bio, location, niche, content_style FROM influencers WHERE uid = $1 LIMIT 1', [userId]);
      const ip = ipRes.rows[0] || {};
      const inf = infRes.rows[0] || {};
      profileData = {
        bio: ip.bio || inf.bio || null,
        location: inf.location || null,
        categories: inf.niche || [],
        content_types: inf.content_style || [],
        avatar_url: ip.avatar_url || null,
        username: ip.username || null,
        followers: ip.followers || 0,
        following: ip.following || 0,
        posts_count: ip.posts_count || 0,
        engagement_rate: ip.engagement_rate || null,
        is_verified: ip.is_verified || false,
        is_private: ip.is_private || false
      };
    } else if (u.role === 'ugc_creator' || u.role === 'seeder') {
      const gres = await pg.query('SELECT bio, location, categories, content_types FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
      if (gres.rowCount > 0) profileData = gres.rows[0];
    }
    return res.json({
      uid: u.uid,
      email: u.email,
      role: u.role,
      fullName: u.display_name || null,
      isActive: u.is_active,
      createdAt: u.created_at,
      profileData,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error while fetching user details' });
  }
});

// Update user status (activate/suspend)
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }
    const chk = await pg.query('SELECT uid FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    await pg.query('UPDATE users SET is_active = $1 WHERE uid = $2', [isActive, userId]);
    const action = isActive ? 'activated' : 'suspended';
    res.json({ message: `User ${action} successfully`, userId, isActive });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// Update user sponsor status
router.put('/users/:userId/sponsor', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isSponsored } = req.body;
    if (typeof isSponsored !== 'boolean') {
      return res.status(400).json({ message: 'isSponsored must be a boolean value' });
    }
    const chk = await pg.query('SELECT uid, role FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const role = chk.rows[0].role;
    if (!['influencer', 'ugc_creator', 'seeder'].includes(role)) {
      return res.status(400).json({ message: 'Only influencers and UGC creators can be sponsored' });
    }
    const now = new Date().toISOString();
    const payload = { sponsored: { active: !!isSponsored, updatedAt: now } };
    await pg.query(`UPDATE users SET social_connections = COALESCE(social_connections, '{}'::jsonb) || $2::jsonb WHERE uid = $1`, [userId, JSON.stringify(payload)]);
    const action = isSponsored ? 'added to' : 'removed from';
    res.json({ message: `User ${action} sponsored list successfully`, userId, isSponsored });
  } catch (error) {
    console.error('Update sponsor status error:', error);
    res.status(500).json({ message: 'Server error while updating sponsor status' });
  }
});

// Edit user profile
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, role, isActive } = req.body;
    if (!fullName || !email || !role) {
      return res.status(400).json({ message: 'Full name, email, and role are required' });
    }
    const validRoles = ['influencer', 'ugc_creator', 'seeder', 'brand', 'admin', 'support'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    const exists = await pg.query('SELECT uid, role FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (exists.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const dupe = await pg.query('SELECT uid FROM users WHERE LOWER(email) = LOWER($1) AND uid <> $2 LIMIT 1', [email, userId]);
    if (dupe.rowCount > 0) {
      return res.status(400).json({ message: 'Email is already in use by another user' });
    }
    await pg.query('UPDATE users SET display_name = $1, email = $2, role = $3, is_active = COALESCE($4, is_active) WHERE uid = $5', [fullName, email, role, typeof isActive === 'boolean' ? isActive : null, userId]);
    res.json({ message: 'User profile updated successfully', userId });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error while updating user profile' });
  }
});

// Change user password
router.put('/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const chk = await pg.query('SELECT uid FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const colsRes = await pg.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name IN ('password','password_hash')"
    );
    const cols = colsRes.rows.map(r => r.column_name);
    const passwordCol = cols.includes('password') ? 'password' : (cols.includes('password_hash') ? 'password_hash' : null);
    if (!passwordCol) {
      return res.status(500).json({ message: 'Users table missing password column' });
    }
    await pg.query(`UPDATE users SET ${passwordCol} = $1 WHERE uid = $2`, [hashedPassword, userId]);
    res.json({ message: 'Password updated successfully', userId });
  } catch (error) {
    const { userId } = req.params;
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userRes = await pg.query('SELECT uid, email, role, display_name FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userData = userRes.rows[0];
    if (userData.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    await pg.query('DELETE FROM users WHERE uid = $1', [userId]);
    res.json({ message: 'User deleted successfully', userId });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// Bulk delete users
router.post('/users/bulk-delete', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const ids = Array.from(new Set(userIds.map(String)));
    const found = await pg.query('SELECT uid, role FROM users WHERE uid = ANY($1)', [ids]);
    if (found.rowCount === 0) {
      return res.status(404).json({ message: 'No matching users found' });
    }

    const adminIds = found.rows.filter(r => r.role === 'admin').map(r => r.uid);
    const deletableIds = found.rows.filter(r => r.role !== 'admin').map(r => r.uid);

    let deletedCount = 0;
    if (deletableIds.length > 0) {
      const delRes = await pg.query('DELETE FROM users WHERE uid = ANY($1)', [deletableIds]);
      deletedCount = delRes.rowCount || 0;
    }

    res.json({ message: 'Bulk delete executed', deletedCount, skippedAdmins: adminIds });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ message: 'Server error while bulk deleting users' });
  }
});

// Get UGC pricing
router.get('/pricing/ugc/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pg.query('SELECT pricing FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    if (result.rowCount === 0) {
      try {
        const ures = await pg.query('SELECT uid, role FROM users WHERE uid = $1 LIMIT 1', [userId]);
        if (ures.rowCount === 0 || !['ugc_creator','seeder'].includes(ures.rows[0].role)) {
          return res.status(404).json({ message: 'UGC Creator not found' });
        }
        await pg.query(
          `INSERT INTO ugc_creators (
            uid, email, full_name, bio, location, categories, content_types,
            is_active, pricing, sample_content, created_at, updated_at, original_json
          ) VALUES (
            $1, NULL, NULL, NULL, NULL, NULL, NULL,
            TRUE, '{}'::jsonb, NULL, NOW(), NOW(), '{}'::jsonb
          )
          ON CONFLICT (uid) DO NOTHING`,
          [userId]
        );
        return res.json({ pricing: {} });
      } catch (e) {
        return res.status(500).json({ message: 'Server error while ensuring UGC profile' });
      }
    }
    const pricing = result.rows[0].pricing || {};
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching UGC pricing' });
  }
});

// Update UGC pricing
router.put('/pricing/ugc/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chk = await pg.query('SELECT uid FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    if (chk.rowCount === 0) {
      const ures = await pg.query('SELECT uid, role FROM users WHERE uid = $1 LIMIT 1', [userId]);
      if (ures.rowCount === 0 || !['ugc_creator','seeder'].includes(ures.rows[0].role)) {
        return res.status(404).json({ message: 'UGC Creator not found' });
      }
      await pg.query(
        `INSERT INTO ugc_creators (
          uid, email, full_name, bio, location, categories, content_types,
          is_active, pricing, sample_content, created_at, updated_at, original_json
        ) VALUES (
          $1, NULL, NULL, NULL, NULL, NULL, NULL,
          TRUE, '{}'::jsonb, NULL, NOW(), NOW(), '{}'::jsonb
        )
        ON CONFLICT (uid) DO NOTHING`,
        [userId]
      );
    }
    const fields = [
      'reelPostPrice','staticPostPrice','reelStaticComboPrice','storyVideoPrice','storyShoutoutPrice','storyUnboxingPrice','eventAttendancePrice','outdoorShootPrice','expressDeliveryCharge'
    ];
    const next = {};
    fields.forEach((f) => {
      const v = req.body[f];
      if (v !== undefined && v !== null && v !== '') {
        const num = parseFloat(v);
        if (!Number.isNaN(num) && num >= 0) next[f] = num;
      }
    });
    if (Object.keys(next).length === 0) {
      return res.status(400).json({ message: 'No valid pricing fields provided' });
    }
    await pg.query(`UPDATE ugc_creators SET pricing = COALESCE(pricing, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE uid = $1`, [userId, JSON.stringify(next)]);
    const result = await pg.query('SELECT pricing FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    res.json({ success: true, pricing: result.rows[0].pricing || {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating UGC pricing' });
  }
});

// Get Influencer pricing
router.get('/pricing/influencer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await pg.query('ALTER TABLE influencers ADD COLUMN IF NOT EXISTS pricing JSONB');
    const result = await pg.query('SELECT pricing FROM influencers WHERE uid = $1 LIMIT 1', [userId]);
    if (result.rowCount === 0) {
      try {
        const ures = await pg.query('SELECT uid, email, role, display_name FROM users WHERE uid = $1 LIMIT 1', [userId]);
        if (ures.rowCount === 0 || ures.rows[0].role !== 'influencer') {
          return res.status(404).json({ message: 'Influencer not found' });
        }
        const u = ures.rows[0];
        await pg.query(
          `INSERT INTO influencers (
            uid, email, full_name, bio, instagram_username, followers, following, posts_count,
            engagement_rate, is_verified, is_private, avatar_url, location, niche, content_style,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, NULL, NULL, 0, 0, 0,
            NULL, FALSE, FALSE, NULL, NULL, NULL, NULL,
            NOW(), NOW()
          )
          ON CONFLICT (uid) DO NOTHING`,
          [userId, u.email || null, u.display_name || null]
        );
        await pg.query(`UPDATE influencers SET pricing = COALESCE(pricing, '{}'::jsonb), updated_at = NOW() WHERE uid = $1`, [userId]);
        return res.json({ pricing: {} });
      } catch (e) {
        return res.status(500).json({ message: 'Server error while ensuring influencer profile' });
      }
    }
    const pricing = result.rows[0].pricing || {};
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching influencer pricing' });
  }
});

// Update Influencer pricing
router.put('/pricing/influencer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chk = await pg.query('SELECT uid FROM influencers WHERE uid = $1 LIMIT 1', [userId]);
    if (chk.rowCount === 0) {
      const ures = await pg.query('SELECT uid, email, role, display_name FROM users WHERE uid = $1 LIMIT 1', [userId]);
      if (ures.rowCount === 0 || ures.rows[0].role !== 'influencer') {
        return res.status(404).json({ message: 'Influencer not found' });
      }
      const u = ures.rows[0];
      await pg.query(
        `INSERT INTO influencers (
          uid, email, full_name, bio, instagram_username, followers, following, posts_count,
          engagement_rate, is_verified, is_private, avatar_url, location, niche, content_style,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, NULL, NULL, 0, 0, 0,
          NULL, FALSE, FALSE, NULL, NULL, NULL, NULL,
          NOW(), NOW()
        )
        ON CONFLICT (uid) DO NOTHING`,
        [userId, u.email || null, u.display_name || null]
      );
      await pg.query('ALTER TABLE influencers ADD COLUMN IF NOT EXISTS pricing JSONB');
    }
    await pg.query('ALTER TABLE influencers ADD COLUMN IF NOT EXISTS pricing JSONB');
    const fields = ['reelPostPrice','storyPrice','eventAttendancePrice','multiplePlatformsPrice'];
    const next = {};
    fields.forEach((f) => {
      const v = req.body[f];
      if (v !== undefined && v !== null && v !== '') {
        const num = parseFloat(v);
        if (!Number.isNaN(num) && num >= 0) next[f] = num;
      }
    });
    if (req.body.storyVideoPrice !== undefined && next.storyPrice === undefined) {
      const sv = parseFloat(req.body.storyVideoPrice);
      if (!Number.isNaN(sv) && sv >= 0) next.storyPrice = sv;
    }
    if (Object.keys(next).length === 0) {
      return res.status(400).json({ message: 'No valid pricing fields provided' });
    }
    await pg.query(`UPDATE influencers SET pricing = COALESCE(pricing, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE uid = $1`, [userId, JSON.stringify(next)]);
    const result = await pg.query('SELECT pricing FROM influencers WHERE uid = $1 LIMIT 1', [userId]);
    res.json({ success: true, pricing: result.rows[0].pricing || {} });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating influencer pricing' });
  }
});

module.exports = router;
