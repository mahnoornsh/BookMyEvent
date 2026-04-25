/**
 * auth.integration.test.js
 * Place this file at: backend/src/tests/auth.integration.test.js
 *
 * Requires a real MongoDB connection via MONGO_URI in your .env
 * Run with: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');           // ← correct path from src/tests/
const User = require('../models/User');

// ── DB setup ──────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Clean up test users before each test so emails don't clash
beforeEach(async () => {
  await User.deleteMany({ email: /integration-auth-test/ });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {

  test('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Tester',
        email: 'integration-auth-test-1@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toMatch(/registration successful/i);
  });

  test('blocks duplicate email registration', async () => {
    const payload = {
      name: 'Dup User',
      email: 'integration-auth-test-dup@test.com',
      password: 'password123',
    };
    await request(app).post('/api/auth/register').send(payload);
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email already in use/i);
  });

  test('blocks registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'integration-auth-test-missing@test.com' });

    expect(res.status).toBe(400);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  const email = 'integration-auth-test-login@test.com';
  const password = 'password123';

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test User',
      email,
      password,
    });
  });

  test('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.message).toMatch(/login successful/i);
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-integration@test.com', password });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

});