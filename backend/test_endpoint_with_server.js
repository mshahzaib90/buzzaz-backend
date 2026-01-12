const express = require('express');
const cors = require('cors');
const { admin } = require('./config/firebase');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import the influencer routes
const influencerRoutes = require('./routes/influencer');

const app = express();
app.use(cors());
app.use(express.json());

// Use the influencer routes
app.use('/api/influencer', influencerRoutes);

async function testEndpointWithServer() {
  try {
    // Start the server
    const server = app.listen(3001, () => {
      console.log('Test server running on port 3001');
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a valid token
    const payload = {
      uid: 'sx8gqxfSNZQvlHXq7BQI',
      email: 'mdshahzaib@gmail.com',
      role: 'influencer'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Test the endpoint
    const axios = require('axios');
    const response = await axios.get('http://localhost:3001/api/influencer/sx8gqxfSNZQvlHXq7BQI/instagram/detailed', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n--- API Response ---');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('From Database:', response.data.fromDatabase);
    console.log('Profile Username:', response.data.profile?.username);
    console.log('Profile Followers:', response.data.profile?.followers);
    console.log('Reels Count:', response.data.reels?.length);
    console.log('Analytics:', response.data.analytics);

    // Close the server
    server.close();
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testEndpointWithServer();