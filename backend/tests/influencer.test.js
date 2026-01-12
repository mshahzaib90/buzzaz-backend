const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authMiddleware, requireRole } = require('../middleware/auth');
const influencerRouter = require('../routes/influencer');

// Mock Firebase
jest.mock('../config/firebase', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn()
    })
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

// Mock Apify Service
jest.mock('../services/apifyService', () => ({
  validateInstagramUsername: jest.fn(),
  scrapeInstagramProfile: jest.fn(),
  scrapeInstagramRecentPosts: jest.fn()
}));

const { db } = require('../config/firebase');
const { validateInstagramUsername } = require('../services/apifyService');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/influencer', influencerRouter);

describe('Influencer Profile Creation', () => {
  let mockToken;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'influencer'
    };

    mockToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');
  });

  describe('POST /api/influencer', () => {
    it('should create influencer profile successfully with valid data', async () => {
      // Mock Firebase operations
      const mockDoc = {
        exists: false
      };
      const mockSet = jest.fn().mockResolvedValue();
      const mockStatsSet = jest.fn().mockResolvedValue();

      db.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc),
          set: mockSet,
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              set: mockStatsSet
            }))
          }))
        }))
      });

      // Mock Instagram validation
      validateInstagramUsername.mockResolvedValue({
        isValid: true,
        profileData: {
          username: 'testuser',
          bio: 'Test bio',
          followers: 1000,
          following: 500,
          postsCount: 50,
          engagementRate: 3.5,
          avatarUrl: 'https://example.com/avatar.jpg',
          isVerified: false,
          isPrivate: false
        }
      });

      const profileData = {
        fullName: 'Test User',
        instagramUsername: 'testuser',
        bio: 'Test bio',
        location: 'Test City, Test Country',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle', 'fashion'],
        contentTypes: ['posts', 'stories'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        averageDeliveryTime: 3,
        phoneNumber: '+1234567890',
        city: 'Test City',
        country: 'Test Country',
        languages: ['English', 'Urdu'],
        maritalStatus: 'single',
        children: 'no',
        pricingTier: 'micro',
        deliverables: ['reel', 'story'],
        deliveryProductBased: '2-3 days',
        deliveryNoProduct: '1-2 days',
        deliveryOutdoorShoot: '3-5 days',
        deliveryRevisions: '1 revision included'
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Influencer profile created successfully');
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.fullName).toBe(profileData.fullName);
      expect(response.body.profile.instagramUsername).toBe('testuser');
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockStatsSet).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteData = {
        fullName: 'Test User'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return 400 if profile already exists', async () => {
      // Mock existing profile
      const mockDoc = {
        exists: true
      };

      db.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc)
        }))
      });

      const profileData = {
        fullName: 'Test User',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(profileData)
        .expect(400);

      expect(response.body.message).toBe('Influencer profile already exists');
    });

    it('should return 400 if Instagram validation fails', async () => {
      // Mock Firebase operations
      const mockDoc = {
        exists: false
      };

      db.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc)
        }))
      });

      // Mock failed Instagram validation
      validateInstagramUsername.mockResolvedValue({
        isValid: false,
        error: 'Instagram profile not found'
      });

      const profileData = {
        fullName: 'Test User',
        instagramUsername: 'nonexistentuser',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(profileData)
        .expect(400);

      expect(response.body.message).toBe('Instagram username validation failed');
      expect(response.body.error).toBe('Instagram profile not found');
    });

    it('should create profile without Instagram if no username provided', async () => {
      // Mock Firebase operations
      const mockDoc = {
        exists: false
      };
      const mockSet = jest.fn().mockResolvedValue();

      db.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockDoc),
          set: mockSet
        }))
      });

      const profileData = {
        fullName: 'Test User',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body.message).toBe('Influencer profile created successfully');
      expect(response.body.profile.instagramUsername).toBe('');
      expect(response.body.profile.followers).toBe(0);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(validateInstagramUsername).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization token provided', async () => {
      const profileData = {
        fullName: 'Test User',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .send(profileData)
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should return 403 if user does not have influencer role', async () => {
      const nonInfluencerUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        role: 'brand'
      };

      const nonInfluencerToken = jwt.sign(nonInfluencerUser, process.env.JWT_SECRET || 'test-secret');

      const profileData = {
        fullName: 'Test User',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${nonInfluencerToken}`)
        .send(profileData)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });

    it('should handle server errors gracefully', async () => {
      // Mock Firebase to throw an error
      db.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const profileData = {
        fullName: 'Test User',
        gender: 'prefer_not_to_say',
        categories: ['lifestyle'],
        contentTypes: ['posts'],
        priceRangeMin: 100,
        priceRangeMax: 1000
      };

      const response = await request(app)
        .post('/api/influencer')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(profileData)
        .expect(500);

      expect(response.body.message).toBe('Server error during profile creation');
    });
  });
});