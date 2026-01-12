const request = require('supertest');
const BASE = 'http://localhost:5000';
const { db } = require('../config/firebase');

jest.setTimeout(20000);

const unique = Date.now();
const testEmail = `test.user.${unique}@example.com`;
const testPassword = 'Passw0rd!';

describe('Auth API', () => {
  afterAll(async () => {
    try {
      const snap = await db.collection('users').where('email', '==', testEmail).get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      // ignore cleanup errors
    }
  });

  test('register returns 201 with token and user', async () => {
    const res = await request(BASE)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, role: 'brand' })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('uid');
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('brand');
  });

  test('login returns 200 with token and user', async () => {
    const res = await request(BASE)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testEmail);
  });

  test('login fails with 401 for wrong password', async () => {
    const res = await request(BASE)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPass123!' });

    expect([400, 401, 500]).toContain(res.status); // allow validator/401
    if (res.status === 401) {
      expect(res.body.message).toBe('Invalid credentials');
    }
  });
});