const express = require('express');
const router = express.Router();
const pg = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

// Initialize notifications table
const initTable = async () => {
  try {
    await pg.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_id TEXT NOT NULL,
        sender_id TEXT,
        type TEXT NOT NULL,
        reference_id TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread',
        action_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Error initializing notifications table:', err);
  }
};
initTable();

// Get notifications for the current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pg.query(
      'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.uid]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pg.query(
      'UPDATE notifications SET status = $1 WHERE id = $2 AND recipient_id = $3',
      ['read', id, req.user.uid]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept campaign invitation
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Notification ID
    
    // 1. Get the notification to find the campaign ID
    const notifRes = await pg.query(
      'SELECT * FROM notifications WHERE id = $1 AND recipient_id = $2',
      [id, req.user.uid]
    );
    
    if (notifRes.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const notification = notifRes.rows[0];
    if (notification.type !== 'campaign_invite') {
      return res.status(400).json({ message: 'Not a campaign invitation' });
    }
    
    const campaignId = notification.reference_id;
    
    // 2. Update campaign participants
    // We need to fetch the campaign, parse participants, update status, and save back
    const campRes = await pg.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (campRes.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campRes.rows[0];
    let participants = campaign.participants || [];
    
    // Handle both array of strings and array of objects
    // Convert to objects if they are strings
    participants = participants.map(p => {
      if (typeof p === 'string') return { uid: p, status: 'pending' };
      return p;
    });
    
    // Update status
    let updated = false;
    participants = participants.map(p => {
      if (p.uid === req.user.uid) {
        updated = true;
        return { ...p, status: 'accepted' };
      }
      return p;
    });
    
    if (!updated) {
        // If user wasn't in the list (weird), add them? No, that's security risk.
        // Maybe they were added as just a string ID and we converted it.
    }

    await pg.query(
      'UPDATE campaigns SET participants = $1 WHERE id = $2',
      [JSON.stringify(participants), campaignId]
    );
    
    // 3. Update notification action_status
    await pg.query(
      'UPDATE notifications SET action_status = $1, status = $2 WHERE id = $3',
      ['accepted', 'read', id]
    );
    
    // 4. Notify the Brand (Sender)
    if (notification.sender_id) {
        await pg.query(
            `INSERT INTO notifications (recipient_id, sender_id, type, reference_id, message, status, action_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                notification.sender_id, 
                req.user.uid, 
                'campaign_response', 
                campaignId, 
                `Influencer accepted your invitation for campaign "${campaign.name}"`, 
                'unread', 
                'none'
            ]
        );
    }
    
    res.json({ success: true, message: 'Invitation accepted' });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline campaign invitation
router.post('/:id/decline', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params; // Notification ID
    
    // 1. Get the notification
    const notifRes = await pg.query(
      'SELECT * FROM notifications WHERE id = $1 AND recipient_id = $2',
      [id, req.user.uid]
    );
    
    if (notifRes.rowCount === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    const notification = notifRes.rows[0];
    if (notification.type !== 'campaign_invite') {
      return res.status(400).json({ message: 'Not a campaign invitation' });
    }
    
    const campaignId = notification.reference_id;
    
    // 2. Update campaign participants
    const campRes = await pg.query('SELECT * FROM campaigns WHERE id = $1', [campaignId]);
    if (campRes.rowCount === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const campaign = campRes.rows[0];
    let participants = campaign.participants || [];
    
    participants = participants.map(p => {
      if (typeof p === 'string') return { uid: p, status: 'pending' };
      return p;
    });
    
    participants = participants.map(p => {
      if (p.uid === req.user.uid) {
        return { ...p, status: 'declined' };
      }
      return p;
    });

    await pg.query(
      'UPDATE campaigns SET participants = $1 WHERE id = $2',
      [JSON.stringify(participants), campaignId]
    );
    
    // 3. Update notification action_status
    await pg.query(
      'UPDATE notifications SET action_status = $1, status = $2 WHERE id = $3',
      ['declined', 'read', id]
    );
    
    // 4. Notify the Brand (Sender)
    if (notification.sender_id) {
        await pg.query(
            `INSERT INTO notifications (recipient_id, sender_id, type, reference_id, message, status, action_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                notification.sender_id, 
                req.user.uid, 
                'campaign_response', 
                campaignId, 
                `Influencer declined your invitation for campaign "${campaign.name}"`, 
                'unread', 
                'none'
            ]
        );
    }
    
    res.json({ success: true, message: 'Invitation declined' });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
