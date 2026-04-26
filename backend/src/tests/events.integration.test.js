const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');           
const User = require('../models/User');
const Event = require('../models/Event');

//Helpers 
//Register + login a business user and return their token
async function loginBusiness() {
  const email = `integration-events-biz-${Date.now()}@test.com`;
  await request(app).post('/api/auth/register').send({
    name: 'Biz User',
    email,
    password: 'password123',
    role: 'business',
  });
  //Manually set role + approval in DB (register endpoint defaults to 'user')
  await User.findOneAndUpdate({ email }, { role: 'business', isApproved: true });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return loginRes.body.token;
}

//Register + login an admin user and return their token 
async function loginAdmin() {
  const email = `integration-events-admin-${Date.now()}@test.com`;
  await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email,
    password: 'password123',
  });
  await User.findOneAndUpdate({ email }, { role: 'admin', isApproved: true });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return loginRes.body.token;
}

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const sampleEvent = {
  title: 'Integration Test Event',
  description: 'An event created by integration tests',
  category: 'music',
  date: futureDate,
  venue: 'Karachi Expo Centre',
  city: 'Karachi',
  totalCapacity: 100,
  price: 500,
};

//DB setup 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Event.deleteMany({ title: /Integration Test Event/ });
  await User.deleteMany({ email: /integration-events/ });
});

describe('GET /api/events', () => {

  test('returns an array of approved future events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});


describe('POST /api/events', () => {

  test('business user can create an event', async () => {
    const token = await loginBusiness();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleEvent);

    expect(res.status).toBe(201);
    expect(res.body.event).toHaveProperty('title', sampleEvent.title);
    expect(res.body.event.status).toBe('pending');
  });

  test('unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/events').send(sampleEvent);
    expect(res.status).toBe(401);
  });

  test('regular user cannot create an event', async () => {
    const email = `integration-events-user-${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ name: 'Regular', email, password: 'password123' });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleEvent);

    expect(res.status).toBe(403);
  });

});

describe('PATCH /api/events/:id', () => {

  test('business owner can edit their event', async () => {
    const token = await loginBusiness();
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleEvent);

    const eventId = createRes.body.event._id;

    const res = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Integration Title' });

    expect(res.status).toBe(200);
    expect(res.body.event.title).toBe('Updated Integration Title');
  });

  test('another business user cannot edit someone else\'s event', async () => {
    const token1 = await loginBusiness();
    const token2 = await loginBusiness();

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token1}`)
      .send(sampleEvent);

    const eventId = createRes.body.event._id;

    const res = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
  });

});

describe('PATCH /api/events/:id/approve', () => {

  test('admin can approve a pending event', async () => {
    const bizToken = await loginBusiness();
    const adminToken = await loginAdmin();

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${bizToken}`)
      .send(sampleEvent);

    const eventId = createRes.body.event._id;

    const res = await request(app)
      .patch(`/api/events/${eventId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.event.status).toBe('approved');
  });

});

describe('DELETE /api/events/:id', () => {

  test('business owner can delete their event', async () => {
    const token = await loginBusiness();
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleEvent);

    const eventId = createRes.body.event._id;

    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

});