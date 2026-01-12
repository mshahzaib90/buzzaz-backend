const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock Firebase config to satisfy auth middleware and Firestore writes
jest.mock('../config/firebase', () => {
  const getMockUserDoc = () => ({
    exists: true,
    data: () => ({ email: 'test@example.com', role: 'influencer' })
  });

  const mockUsersCollection = {
    doc: jest.fn(() => ({
      get: jest.fn().mockResolvedValue(getMockUserDoc())
    }))
  };

  // For influencer saves in the connect route
  const mockInfluencersCollection = {
    doc: jest.fn(() => ({
      set: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
      get: jest.fn()
    }))
  };

  const mockDb = {
    collection: jest.fn((name) => {
      if (name === 'users') return mockUsersCollection;
      if (name === 'influencers') return mockInfluencersCollection;
      if (name === 'youtubeAnalytics') {
        return {
          add: jest.fn().mockResolvedValue({ id: 'analytics-doc-id' })
        };
      }
      return {
        doc: jest.fn(() => ({ set: jest.fn().mockResolvedValue() }))
      };
    })
  };

  // Provide admin.firestore.FieldValue.serverTimestamp() used by the route
  const firestoreFn = () => mockDb;
  firestoreFn.FieldValue = { serverTimestamp: jest.fn(() => new Date()) };

  return {
    admin: {
      firestore: firestoreFn,
      auth: () => ({ verifyIdToken: jest.fn() })
    },
    db: mockDb
  };
});

// Mock YouTube service
jest.mock('../services/youtubeService', () => ({
  searchChannel: jest.fn(),
  getComprehensiveChannelData: jest.fn()
}));

const { authMiddleware } = require('../middleware/auth');
const influencerRouter = require('../routes/influencer');
const youtubeService = require('../services/youtubeService');

// Test app
const app = express();
app.use(express.json());
app.use('/api/influencer', influencerRouter);

describe('YouTube Connect Route', () => {
  let token;
  const influencerId = 'test-influencer-uid';

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ uid: influencerId, role: 'influencer' }, process.env.JWT_SECRET);
  });

  it('returns 400 when channelQuery is missing', async () => {
    const res = await request(app)
      .post(`/api/influencer/${influencerId}/youtube/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.message).toBe('Channel query is required');
    expect(youtubeService.searchChannel).not.toHaveBeenCalled();
  });

  it('returns 400 when client sends channelUrl instead of channelQuery (current behavior)', async () => {
    const res = await request(app)
      .post(`/api/influencer/${influencerId}/youtube/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send({ channelUrl: 'https://www.youtube.com/@islamicworld' })
      .expect(400);

    expect(res.body.message).toBe('Channel query is required');
    expect(youtubeService.searchChannel).not.toHaveBeenCalled();
  });

  it('connects and persists channel data when channelQuery is provided', async () => {
    // Arrange mocks
    youtubeService.searchChannel.mockResolvedValue({
      channelId: 'UC1234567890',
      channelTitle: 'Islamic world',
      channelUrl: 'https://www.youtube.com/@islamicworld'
    });

    youtubeService.getComprehensiveChannelData.mockResolvedValue({
      channelId: 'UC1234567890',
      channelTitle: 'Islamic world',
      subscriberCount: 637000,
      viewCount: 31391589,
      videoCount: 576,
      videos: [
        {
          videoId: 'dQw4w9WgXcQ',
          title: 'Surah Al-Kahf by Ala aqel | Beautiful Recitation',
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          iframeHtml: '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Surah Al-Kahf by Ala aqel | Beautiful Recitation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
        }
      ],
      analytics: {
        views: 310000,
        estimatedMinutesWatched: 62000,
        averageViewDuration: 720,
        subscribersGained: 1250,
        subscribersLost: 180,
        trafficSourceType: { youtube_search: 124000 },
        deviceType: { mobile: 186000 },
        country: { 'United States': 93000 },
        gender: { male: 186000, female: 124000 },
        ageGroup: { '25-34': 124000 }
      },
      lastUpdated: new Date().toISOString()
    });

    const res = await request(app)
      .post(`/api/influencer/${influencerId}/youtube/connect`)
      .set('Authorization', `Bearer ${token}`)
      .send({ channelQuery: '@islamicworld' })
      .expect(200);

    expect(youtubeService.searchChannel).toHaveBeenCalledWith('@islamicworld');
    expect(youtubeService.getComprehensiveChannelData).toHaveBeenCalledWith('UC1234567890');

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('YouTube channel connected successfully');

    expect(res.body.channelData).toMatchObject({
      channelId: 'UC1234567890',
      channelTitle: 'Islamic world',
      channelUrl: 'https://www.youtube.com/@islamicworld',
      subscriberCount: 637000,
      viewCount: 31391589,
      videoCount: 576
    });

    // Ensure we persisted recent videos & analytics into influencer doc (via mocked Firestore)
    expect(res.body.channelData.recentVideos.length).toBeGreaterThan(0);
    expect(res.body.channelData.analytics).toBeDefined();
  });
});