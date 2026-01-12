// Temporary test route to debug TikTok validation without authentication
const express = require('express');
const router = express.Router();

// Test route without authentication
router.put('/test-tiktok-validation', async (req, res) => {
  try {
    console.log('=== TEST TIKTOK VALIDATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    
    const allowedUpdates = [
      'fullName',
      'bio',
      'location',
      'categories',
      'contentTypes',
      'priceRangeMin',
      'priceRangeMax',
      'averageDeliveryTime',
      'phoneNumber',
      'city',
      'country',
      'languages',
      'maritalStatus',
      'children',
      'pricingTier',
      'deliverables',
      'deliveryProductBased',
      'deliveryNoProduct',
      'deliveryOutdoorShoot',
      'deliveryRevisions',
      // Social connections
      'instagramUsername',
      'youtubeChannelId',
      'youtubeChannelTitle',
      'youtubeChannelUrl',
      'tiktokUsername'
    ];
    
    console.log('Allowed updates:', allowedUpdates);
    console.log('Is tiktokUsername in allowedUpdates?', allowedUpdates.includes('tiktokUsername'));
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      console.log(`Checking key: "${key}", value: "${req.body[key]}", allowed: ${allowedUpdates.includes(key)}`);
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    console.log('Updates object after filtering:', JSON.stringify(updates, null, 2));
    console.log('Number of valid updates:', Object.keys(updates).length);
    
    if (Object.keys(updates).length === 0) {
      console.log('❌ RETURNING: No valid updates provided');
      return res.status(400).json({ message: 'No valid updates provided' });
    }
    
    console.log('✅ VALIDATION PASSED');
    res.json({ 
      message: 'Validation passed', 
      updates: updates,
      allowedUpdates: allowedUpdates
    });
    
  } catch (error) {
    console.error('Test validation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test UGC route without authentication
router.post('/test-ugc-json', async (req, res) => {
  try {
    console.log('=== TEST UGC JSON ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    
    // Mock user for testing
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'ugc_creator'
    };
    
    // Simulate the UGC profile creation logic
    const {
      fullName,
      email,
      phoneNumber,
      city,
      country,
      dateOfBirth,
      gender,
      maritalStatus,
      children,
      bio,
      location,
      sampleContentType,
      sampleContent,
      faceOrFaceless,
      niche,
      contentStyle,
      languages
    } = req.body;
    
    console.log('Extracted fields:', {
      fullName,
      email,
      phoneNumber,
      city,
      country,
      dateOfBirth,
      gender,
      maritalStatus,
      children,
      bio,
      location,
      sampleContent,
      sampleContentType,
      faceOrFaceless,
      niche,
      contentStyle,
      languages
    });
    
    // Parse JSON fields
    let parsedNiche, parsedContentStyle, parsedLanguages, parsedSampleContent;
    try {
      parsedNiche = typeof niche === 'string' ? JSON.parse(niche) : niche;
      parsedContentStyle = typeof contentStyle === 'string' ? JSON.parse(contentStyle) : contentStyle;
      parsedLanguages = typeof languages === 'string' ? JSON.parse(languages) : languages;
      parsedSampleContent = typeof sampleContent === 'string' ? JSON.parse(sampleContent) : sampleContent;
    } catch (parseError) {
      console.log('Parse error:', parseError.message);
      return res.status(400).json({ 
        errors: [{ msg: 'Invalid format for JSON fields' }] 
      });
    }
    
    console.log('Parsed fields:', {
      parsedNiche,
      parsedContentStyle,
      parsedLanguages,
      parsedSampleContent
    });
    
    // Create mock UGC data
    const ugcData = {
      userId: mockUser.uid,
      fullName,
      email,
      phoneNumber,
      city,
      country,
      dateOfBirth,
      gender,
      maritalStatus,
      children,
      bio,
      location,
      sampleContent: parsedSampleContent,
      sampleContentType,
      niche: parsedNiche,
      contentStyle: parsedContentStyle,
      faceOrFaceless,
      languages: parsedLanguages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    res.status(201).json({
      message: 'Test UGC profile creation successful',
      profile: ugcData
    });
    
  } catch (error) {
    console.error('Test UGC error:', error);
    res.status(500).json({ message: 'Test server error' });
  }
});

module.exports = router;