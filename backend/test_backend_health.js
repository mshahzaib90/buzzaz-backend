const axios = require('axios');
const assert = require('assert');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

async function testBackendHealth() {
    console.log('🔍 Testing Backend Server Health...\n');
    
    try {
        // Test 1: Health endpoint
        console.log('1. Testing /api/health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health endpoint working:', healthResponse.data);
        
        // Test 2: Chat conversations endpoint (should return 401 without auth)
        console.log('\n2. Testing /api/chat/conversations endpoint (expecting 401)...');
        try {
            const chatResponse = await axios.get(`${BASE_URL}/api/chat/conversations`);
            console.log('⚠️  Unexpected success (should be protected):', chatResponse.data);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Chat endpoint properly protected (401 Unauthorized)');
            } else {
                console.log('❌ Unexpected error:', error.response?.status, error.response?.data || error.message);
            }
        }
        
        // Test 3: Invalid login should return 401 with friendly message
        console.log('\n3. Testing invalid login (expecting 401 with message)...');
        try {
            const badEmail = `no-user-${Date.now()}@example.com`;
            await axios.post(`${BASE_URL}/api/auth/login`, {
                email: badEmail,
                password: 'wrong-password'
            });
            console.log('⚠️  Unexpected success for invalid login');
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message;
            console.log('   Status:', status);
            console.log('   Message:', message);
            assert.strictEqual(status, 401, 'Expected 401 Unauthorized for invalid credentials');
            assert.strictEqual(message, 'Invalid credentials, please try again', 'Expected standardized invalid credentials message');
            console.log('✅ Invalid login returns 401 with correct message');
        }

        // Test 4: Register a new user and login
        console.log('\n4. Testing register + login flow...');
        const email = `user-${Date.now()}@example.com`;
        const password = 'testpass123';
        const role = 'influencer';
        const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, { email, password, role });
        console.log('   Register status:', registerRes.status);
        assert.strictEqual(registerRes.status, 201, 'Expected 201 for successful registration');
        assert.ok(registerRes.data?.token, 'Registration should return a token');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
        console.log('   Login status:', loginRes.status);
        assert.strictEqual(loginRes.status, 200, 'Expected 200 for successful login');
        assert.ok(loginRes.data?.token, 'Login should return a token');

        // Test 5: Re-register same user should fail with 400
        console.log('\n5. Testing duplicate registration (expecting 400)...');
        try {
            await axios.post(`${BASE_URL}/api/auth/register`, { email, password, role });
            console.log('⚠️  Unexpected success for duplicate registration');
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message;
            console.log('   Status:', status);
            console.log('   Message:', message);
            assert.strictEqual(status, 400, 'Expected 400 for duplicate registration');
            assert.strictEqual(message, 'User already exists', 'Expected duplicate registration message');
            console.log('✅ Duplicate registration correctly rejected');
        }

        // Final connectivity summary
        console.log('\n✅ Backend server is running and authentication flow works');
        
    } catch (error) {
        console.log('❌ Backend server connection failed:');
        if (error.code === 'ECONNREFUSED') {
            console.log('   - Server is not running on port 5000');
            console.log('   - Check if "npm start" is running in backend directory');
        } else if (error.code === 'ENOTFOUND') {
            console.log('   - DNS resolution failed for localhost');
        } else {
            console.log('   - Error:', error.message);
        }
        
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Make sure backend server is running: npm start');
        console.log('   2. Check if port 5000 is available');
        console.log('   3. Verify .env file has correct PORT setting');
        console.log('   4. Check firewall settings');
    }
}

testBackendHealth();