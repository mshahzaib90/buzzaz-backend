require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function run() {
  try {
    // Use a known test influencer user from existing scripts
    const userId = 'kui7voXcFLJFlgHNFoPD';
    const email = 'test-youtube@example.com';

    // Prefer env secret, fallback to known test secret used in repo
    const JWT_SECRET = process.env.JWT_SECRET || 'buzzaz_super_secret_jwt_key_2024_production_ready';

    const token = jwt.sign(
      { uid: userId, email, role: 'influencer' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔄 Refreshing YouTube analytics for influencer:', userId);

    // Hit refresh endpoint
    const refreshRes = await axios.post(
      `http://localhost:5000/api/influencer/${userId}/youtube/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    console.log('✅ Refresh response:', refreshRes.status, refreshRes.data?.message || 'OK');

    // Fetch detailed analytics to verify recent videos titles
    const detailRes = await axios.get(
      `http://localhost:5000/api/influencer/${userId}/youtube/detailed`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 60000
      }
    );

    const videos = detailRes.data?.recentVideos || [];
    console.log(`🎥 Recent Videos (${videos.length}):`);
    videos.slice(0, 5).forEach((v, i) => {
      console.log(`${i + 1}. ${v.title || v.videoTitle || 'Untitled'}`);
    });

    console.log('📊 Data Source:', videos.some(v => /rick|surah|recitation/i.test(v.title || '')) ? 'Sample/Mock' : 'Likely Live');
    console.log('Done.');
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

run();