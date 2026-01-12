const pg = require('./db');
const { scrapeInstagramComplete } = require('./apifyService');
const { saveInstagramProfileData, saveInstagramReelData, updateInstagramConnection } = require('./postgresInstagram');

const syncInfluencerStats = async (options = {}) => {
  const { limit = 10, dryRun = false } = options;
  console.log(`Starting influencer stats sync (limit=${limit}, dryRun=${dryRun})...`);
  
  try {
    // Find influencers who need syncing (oldest updated first)
    // We join with users to ensure they are still active influencers
    const query = `
      SELECT p.uid, p.username 
      FROM instagram_profiles p
      JOIN users u ON u.uid = p.uid
      WHERE u.role IN ('influencer', 'content_creator', 'ugc_creator')
      AND u.is_active = TRUE
      ORDER BY p.last_updated ASC NULLS FIRST
      LIMIT $1
    `;
    
    const res = await pg.query(query, [limit]);
    
    if (res.rowCount === 0) {
      console.log('No influencers found to sync');
      return;
    }
    
    console.log(`Found ${res.rowCount} influencers to sync`);
    
    const syncPromises = [];
    
    for (const row of res.rows) {
      if (!dryRun) {
        syncPromises.push(syncSingleInfluencer(row.uid, row.username));
      }
    }

    const results = dryRun ? [] : await Promise.allSettled(syncPromises);
    
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        errorCount++;
        console.error(`Failed to sync influencer ${res.rows[index].username}:`, result.reason);
      }
    });

    console.log(`Influencer stats sync completed: ${successCount} successful, ${errorCount} failed (processed=${dryRun ? 0 : results.length})`);
    
  } catch (error) {
    console.error('Error in influencer stats sync:', error);
  }
};

const syncSingleInfluencer = async (userId, username) => {
  try {
    console.log(`Syncing ${username} (uid: ${userId})...`);
    
    // Use the complete scraper to get profile + reels
    const data = await scrapeInstagramComplete(username);
    
    if (!data || !data.success) {
      throw new Error(`Scraping failed for ${username}: ${data?.errors?.join(', ') || 'Unknown error'}`);
    }

    // Update Profile in Postgres
    if (data.profile) {
      await saveInstagramProfileData(userId, data.profile);
    }

    // Update Reels in Postgres
    if (Array.isArray(data.reels) && data.reels.length > 0) {
      await saveInstagramReelData(userId, data.username, data.reels);
    }
    
    // Update connection status/timestamp
    await updateInstagramConnection(userId, data.username, true);

    console.log(`Successfully synced stats for influencer ${userId} (${username})`);
    return { success: true, userId, username };
    
  } catch (error) {
    console.error(`Error syncing influencer ${userId} (${username}):`, error);
    throw error;
  }
};

module.exports = syncInfluencerStats;
