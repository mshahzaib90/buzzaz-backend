const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const pg = require('../services/db');
const { getInstagramDashboardData } = require('../services/postgresInstagram');

const router = express.Router();

// Get all brands for chat (influencers and UGC creators only)
router.get('/brands', authMiddleware, async (req, res) => {
  try {
    // Check if user is influencer or UGC creator
    const userRole = req.user.role;
    if (!['influencer', 'ugc_creator'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Only influencers and UGC creators can access this endpoint.' });
    }

    const result = await pg.query(
      'SELECT uid, email, display_name FROM users WHERE role = $1',
      ['brand']
    );
    const users = result.rows.map(r => ({
      id: r.uid,
      name: r.display_name || r.email || 'Unknown Brand',
      role: 'brand',
      avatar: null,
      email: r.email || null,
      companyName: null,
    }));

    res.json({ users });

  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'Server error while fetching brands' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    // Get user data from Postgres
    const userRes = await pg.query('SELECT uid, email, role, display_name, social_connections FROM users WHERE uid = $1 LIMIT 1', [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userRow = userRes.rows[0];

    // If influencer, also get instagram profile from Postgres
    let influencerProfile = null;
    if (userRow.role === 'influencer') {
      const profRes = await pg.query('SELECT * FROM instagram_profiles WHERE uid = $1 LIMIT 1', [userId]);
      if (profRes.rowCount > 0) {
        influencerProfile = profRes.rows[0];
      }
    }

    res.json({
      user: {
        uid: userRow.uid,
        email: userRow.email,
        role: userRow.role,
        displayName: userRow.display_name,
        socialConnections: userRow.social_connections || null,
      },
      influencerProfile,
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a campaign (brands only)
router.post('/campaigns', authMiddleware, requireRole('brand'), async (req, res) => {
  try {
    const { name, startDate, endDate, description, participants } = req.body;
    if (!name || !startDate || !endDate || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure table exists
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

    // Generate sequential campaign ID in format c-01, c-02, ... using a Postgres sequence
    const nextRes = await pg.query("SELECT COALESCE(MAX((regexp_replace(id,'[^0-9]','','g'))::int), 0) + 1 AS n FROM campaigns WHERE id LIKE 'c-%'");
    const id = `c-${String(nextRes.rows[0].n).padStart(2, '0')}`;
    const createdBy = req.user.uid;

    // Normalize participants to include status
    let participantList = [];
    if (Array.isArray(participants)) {
      participantList = participants.map(p => {
        if (typeof p === 'object' && p !== null) return { ...p, status: p.status || 'pending' };
        return { uid: p, status: 'pending' };
      });
    } else if (participants) {
      // Single participant or object
       if (typeof participants === 'object' && participants.ids) {
          // Legacy format { ids: [...] }
           participantList = participants.ids.map(uid => ({ uid, status: 'pending' }));
       } else {
           // Maybe just a single string ID?
           participantList = [{ uid: participants, status: 'pending' }];
       }
    }

      const payload = {
        id,
        name,
        description: description || '',
        start_date: startDate,
        end_date: endDate,
        created_by: createdBy,
        participants: JSON.stringify(participantList),
        estimated_budget: req.body.estimatedBudget || null,
        deliverables: req.body.deliverables || '',
        metadata: req.body.metadata ? JSON.stringify(req.body.metadata) : null
      };

    await pg.query(
      `INSERT INTO campaigns (id, name, description, start_date, end_date, created_by, participants, estimated_budget, deliverables, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [payload.id, payload.name, payload.description, payload.start_date, payload.end_date, payload.created_by, payload.participants, payload.estimated_budget, payload.deliverables, payload.metadata]
    );

    // Create notifications for invited participants
    for (const p of participantList) {
      if (p.uid) {
        await pg.query(
          `INSERT INTO notifications (recipient_id, sender_id, type, reference_id, message, status, action_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            p.uid,
            createdBy,
            'campaign_invite',
            id,
            `You are invited for campaign "${name}"`,
            'unread',
            'pending'
          ]
        );
      }
    }

    return res.json({ success: true, campaignId: id });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error while creating campaign' });
  }
});

    // List campaigns created by the current brand
    router.get('/campaigns', authMiddleware, requireRole('brand'), async (req, res) => {
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
        // Ensure columns exist for existing tables
        const ensureColumn = async (table, col, type) => {
          try {
            await pg.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`);
          } catch (e) {
            // Fallback for older Postgres or other errors
            try {
              await pg.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
            } catch (e2) {
              // Ignore if column already exists
            }
          }
        };
        await ensureColumn('campaigns', 'estimated_budget', 'NUMERIC');
        await ensureColumn('campaigns', 'deliverables', 'TEXT');
        await ensureColumn('campaigns', 'metadata', 'JSONB');

        const uid = req.user.uid;
        const result = await pg.query(
          'SELECT id, name, description, start_date, end_date, created_by, participants, created_at, estimated_budget, deliverables, metadata FROM campaigns WHERE created_by = $1 ORDER BY created_at DESC',
          [uid]
        );
        const campaigns = result.rows.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          startDate: r.start_date,
          endDate: r.end_date,
          createdBy: r.created_by,
          participants: r.participants,
          createdAt: r.created_at,
          estimatedBudget: r.estimated_budget,
          deliverables: r.deliverables,
          metadata: r.metadata
        }));
    
        // Enrich with participant details
        const allParticipantIds = new Set();
        campaigns.forEach(c => {
          const parts = typeof c.participants === 'string' ? JSON.parse(c.participants) : c.participants;
          const list = Array.isArray(parts) ? parts : (parts?.ids || []);
          list.forEach(p => {
            if (typeof p === 'string') allParticipantIds.add(p);
            else if (p && p.uid) allParticipantIds.add(p.uid);
          });
        });
    
        if (allParticipantIds.size > 0) {
          const detailsRes = await pg.query(
            `SELECT u.uid, u.display_name, u.email, u.role, ip.avatar_url
             FROM users u
             LEFT JOIN instagram_profiles ip ON u.uid = ip.uid
             WHERE u.uid = ANY($1)`,
            [[...allParticipantIds]]
          );
          const detailsMap = {};
          detailsRes.rows.forEach(r => {
            detailsMap[r.uid] = {
              id: r.uid,
              name: r.display_name || r.email,
              avatar: r.avatar_url,
              role: r.role
            };
          });
          
          campaigns.forEach(c => {
             const parts = typeof c.participants === 'string' ? JSON.parse(c.participants) : c.participants;
             const list = Array.isArray(parts) ? parts : (parts?.ids || []);
             c.participantDetails = list
               .map(p => {
                 const id = typeof p === 'string' ? p : p.uid;
                 const status = typeof p === 'string' ? 'pending' : (p.status || 'pending');
                 
                 const base = detailsMap[id];
                 if (!base) return null;
                 return { ...base, status };
               })
               .filter(Boolean);
          });
        }
    
        res.json({ campaigns });
      } catch (error) {
        console.error('List my campaigns error:', error);
        res.status(500).json({ message: 'Server error while fetching campaigns: ' + error.message });
      }
    });

// Update a campaign created by the current brand
router.put('/campaigns/:id', authMiddleware, requireRole('brand'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, description, participants } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }

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

    // Ensure campaign exists and belongs to current user
    const chk = await pg.query('SELECT id, created_by FROM campaigns WHERE id = $1 LIMIT 1', [id]);
    if (chk.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (chk.rows[0].created_by !== req.user.uid) {
      return res.status(403).json({ message: 'Not allowed to edit this campaign' });
    }

    const setParts = ['name = $1', 'description = $2', 'start_date = $3', 'end_date = $4', 'estimated_budget = $5', 'deliverables = $6'];
    const vals = [name, description || '', startDate, endDate, req.body.estimatedBudget || null, req.body.deliverables || ''];
    let paramIndex = 7;
    
    if (Array.isArray(participants)) {
      setParts.push(`participants = $${paramIndex}`);
      vals.push(JSON.stringify(participants));
      paramIndex++;
    }
    
    const q = `UPDATE campaigns SET ${setParts.join(', ')} WHERE id = $${paramIndex}`;
    vals.push(id);
    await pg.query(q, vals);
    res.json({ success: true, campaignId: id });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error while updating campaign' });
  }
});

router.get('/pricing/influencer/:userId', authMiddleware, requireRole('brand'), async (req, res) => {
  try {
    const { userId } = req.params;
    await pg.query('ALTER TABLE influencers ADD COLUMN IF NOT EXISTS pricing JSONB');
    const result = await pg.query('SELECT pricing FROM influencers WHERE uid = $1 LIMIT 1', [userId]);
    if (result.rowCount === 0) {
      return res.json({ pricing: {} });
    }
    const pricing = result.rows[0].pricing || {};
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching influencer pricing' });
  }
});

router.get('/pricing/ugc/:userId', authMiddleware, requireRole('brand'), async (req, res) => {
  try {
    const { userId } = req.params;
    await pg.query('ALTER TABLE ugc_creators ADD COLUMN IF NOT EXISTS pricing JSONB');
    const result = await pg.query('SELECT pricing FROM ugc_creators WHERE uid = $1 LIMIT 1', [userId]);
    if (result.rowCount === 0) {
      return res.json({ pricing: {} });
    }
    const pricing = result.rows[0].pricing || {};
    res.json({ pricing });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching UGC pricing' });
  }
});

// Update user profile (Postgres)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const allowedUpdates = ['email', 'isActive'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }
    const email = updates.email;
    const isActive = updates.isActive;
    if (typeof isActive !== 'undefined' && typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be boolean' });
    }
    if (typeof email !== 'undefined' && typeof email !== 'string') {
      return res.status(400).json({ message: 'email must be string' });
    }
    if (typeof email !== 'undefined' && typeof isActive !== 'undefined') {
      await pg.query('UPDATE users SET email = $1, is_active = $2 WHERE uid = $3', [email, isActive, userId]);
    } else if (typeof email !== 'undefined') {
      await pg.query('UPDATE users SET email = $1 WHERE uid = $2', [email, userId]);
    } else if (typeof isActive !== 'undefined') {
      await pg.query('UPDATE users SET is_active = $1 WHERE uid = $2', [isActive, userId]);
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user has completed profile setup
router.get('/profile-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    let hasCompletedProfile = false;

    if (userRole === 'influencer') {
      const profRes = await pg.query('SELECT uid FROM instagram_profiles WHERE uid = $1 LIMIT 1', [userId]);
      if (profRes.rowCount > 0) {
        hasCompletedProfile = true;
      } else {
        // Fallback: check detailed cache
        const detRes = await pg.query('SELECT uid FROM instagram_detailed_data WHERE uid = $1 LIMIT 1', [userId]);
        if (detRes.rowCount > 0) {
          hasCompletedProfile = true;
        }
      }
    } else if (userRole === 'ugc_creator') {
      // Check UGC profile completeness from Postgres
      const ugcRes = await pg.query(
        'SELECT email, full_name, bio, location, categories, content_types, pricing, original_json FROM ugc_creators WHERE uid = $1 LIMIT 1',
        [userId]
      );
      if (ugcRes.rowCount === 0) {
        hasCompletedProfile = false;
      } else {
        const r = ugcRes.rows[0] || {};
        const orig = r.original_json || {};
        const fullName = r.full_name || orig.fullName || null;
        const bio = r.bio || orig.bio || null;
        const location = r.location || orig.location || null;
        const niche = Array.isArray(r.categories) ? r.categories : (Array.isArray(orig.niche) ? orig.niche : []);
        const contentStyle = Array.isArray(r.content_types) ? r.content_types : (Array.isArray(orig.contentStyle) ? orig.contentStyle : []);
        const pricing = r.pricing || orig || {};
        const reelPrice = typeof pricing.reelPostPrice === 'number' ? pricing.reelPostPrice : (typeof orig.reelPostPrice === 'number' ? orig.reelPostPrice : null);
        const staticPrice = typeof pricing.staticPostPrice === 'number' ? pricing.staticPostPrice : (typeof orig.staticPostPrice === 'number' ? orig.staticPostPrice : null);
        const fieldsOk = [fullName, bio, location].every(v => typeof v === 'string' && v.trim() !== '');
        const arraysOk = Array.isArray(niche) && niche.length > 0 && Array.isArray(contentStyle) && contentStyle.length > 0;
        const pricesOk = typeof reelPrice === 'number' && reelPrice > 0 && typeof staticPrice === 'number' && staticPrice > 0;
        hasCompletedProfile = !!(fieldsOk && arraysOk && pricesOk);
      }
    } else {
      // Brands don't need additional profile setup
      hasCompletedProfile = true;
    }

    // Do not override onboarding in development. Influencers must complete wizard.

    res.json({
      hasCompletedProfile,
      role: userRole,
      requiresOnboarding: (userRole === 'influencer' || userRole === 'ugc_creator') && !hasCompletedProfile
    });

  } catch (error) {
    console.error('Profile status check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Choose final role for content creators (one-time post-login selection)
router.put('/role', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const currentRole = req.user.role;
    const { role: newRole } = req.body;

    // Only allow switching from 'content_creator' to an allowed creator subtype
    const allowedNewRoles = ['influencer', 'ugc_creator', 'ugc'];
    if (currentRole !== 'content_creator') {
      return res.status(400).json({ message: 'Role selection not allowed. Current role is not content_creator.' });
    }
    if (!allowedNewRoles.includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role selection. Choose influencer or ugc_creator.' });
    }

    // Map alias 'ugc' to actual role 'ugc_creator'
    const mappedRole = newRole === 'ugc' ? 'ugc_creator' : newRole;
    const userType = mappedRole === 'ugc_creator' ? 'ugc' : 'influencer';

    await pg.query(
      'UPDATE users SET role = $1 WHERE uid = $2',
      [mappedRole, userId]
    );

    res.json({
      message: 'Role updated successfully',
      uid: userId,
      role: mappedRole,
      userType
    });
  } catch (error) {
    console.error('Choose role error:', error);
    res.status(500).json({ message: 'Server error while selecting role' });
  }
});

module.exports = router;
