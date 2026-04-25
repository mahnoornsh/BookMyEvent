/**
 * admin.integration.test.js
 * Place this file at: backend/src/tests/admin.integration.test.js
 *
 * Requires a real MongoDB connection via MONGO_URI in your .env
 * Run with: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');           // ← correct path from src/tests/
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function registerAndLogin(role = 'user') {
  const email = `integration-admin-${role}-${Date.now()}@test.com`;
  await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email,
    password: 'password123',
  });
  await User.findOneAndUpdate({ email }, { role, isApproved: true });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return { token: loginRes.body.token, email };
}

// ── DB setup ──────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({ email: /integration-admin/ });
  await Event.deleteMany({ title: /Admin Integration Event/ });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {

  test('admin can fetch all users', async () => {
    const { token } = await registerAndLogin('admin');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('regular user cannot access admin users list', async () => {
    const { token } = await registerAndLogin('user');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/events', () => {

  test('admin can fetch all events (all statuses)', async () => {
    const { token } = await registerAndLogin('admin');
    const res = await request(app)
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {

  test('admin can fetch dashboard stats', async () => {
    const { token } = await registerAndLogin('admin');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalEvents');
    expect(res.body).toHaveProperty('totalBookings');
    expect(res.body).toHaveProperty('pendingEvents');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/businesses/:id/approve', () => {

  test('admin can approve a business account', async () => {
    const { token: adminToken } = await registerAndLogin('admin');

    // Create a pending business user
    const bizEmail = `integration-admin-biz-pending-${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({
      name: 'Pending Biz',
      email: bizEmail,
      password: 'password123',
    });
    await User.findOneAndUpdate({ email: bizEmail }, { role: 'business', isApproved: false });
    const biz = await User.findOne({ email: bizEmail });

    const res = await request(app)
      .patch(`/api/admin/businesses/${biz._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isApproved).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/users/:id/deactivate', () => {

  test('admin can deactivate a user', async () => {
    const { token: adminToken } = await registerAndLogin('admin');

    const targetEmail = `integration-admin-target-${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({
      name: 'Target User',
      email: targetEmail,
      password: 'password123',
    });
    const target = await User.findOne({ email: targetEmail });

    const res = await request(app)
      .patch(`/api/admin/users/${target._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isApproved).toBe(false);
  });

});