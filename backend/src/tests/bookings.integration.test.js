const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');           
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

//Helpers 
async function registerAndLogin(role = 'user') {
  const email = `integration-bookings-${role}-${Date.now()}@test.com`;
  await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email,
    password: 'password123',
  });
  if (role !== 'user') {
    await User.findOneAndUpdate({ email }, { role, isApproved: true });
  }
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return { token: loginRes.body.token, email };
}

//Creates an approved event via the DB directly (faster than the full flow)
async function createApprovedEvent(organizerId) {
  return Event.create({
    title: 'Bookings Integration Event',
    description: 'Test event for booking tests',
    category: 'music',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    venue: 'Test Venue',
    city: 'Karachi',
    totalCapacity: 10,
    remainingCapacity: 10,
    price: 100,
    organizer: organizerId,
    status: 'approved',
  });
}

//DB setup 
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Booking.deleteMany({});
  await Event.deleteMany({ title: 'Bookings Integration Event' });
  await User.deleteMany({ email: /integration-bookings/ });
});

describe('POST /api/bookings', () => {

  test('authenticated user can book an approved event', async () => {
    const { token: bizToken, email: bizEmail } = await registerAndLogin('business');
    const biz = await User.findOne({ email: bizEmail });
    const event = await createApprovedEvent(biz._id);

    const { token: userToken } = await registerAndLogin('user');

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: event._id, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('booking');
    expect(res.body.booking.status).toBe('confirmed');
  });

  test('unauthenticated request is rejected', async () => {
    const { email: bizEmail } = await registerAndLogin('business');
    const biz = await User.findOne({ email: bizEmail });
    const event = await createApprovedEvent(biz._id);

    const res = await request(app)
      .post('/api/bookings')
      .send({ eventId: event._id, quantity: 1 });

    expect(res.status).toBe(401);
  });

  test('blocks duplicate booking for the same event', async () => {
    const { token: bizToken, email: bizEmail } = await registerAndLogin('business');
    const biz = await User.findOne({ email: bizEmail });
    const event = await createApprovedEvent(biz._id);

    const { token: userToken } = await registerAndLogin('user');

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: event._id, quantity: 1 });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: event._id, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already have a confirmed booking|already booked/i);
  });

});

describe('GET /api/bookings', () => {

  test('user can fetch their own bookings', async () => {
    const { token: bizToken, email: bizEmail } = await registerAndLogin('business');
    const biz = await User.findOne({ email: bizEmail });
    const event = await createApprovedEvent(biz._id);

    const { token: userToken } = await registerAndLogin('user');
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: event._id, quantity: 1 });

    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // Controller may return an array directly or { bookings: [...] }
    const bookings = Array.isArray(res.body) ? res.body : (res.body.bookings || []);
    expect(bookings.length).toBeGreaterThanOrEqual(1);
  });

});

describe('PATCH /api/bookings/:id/cancel', () => {

  test('user can cancel their own booking', async () => {
    const { token: bizToken, email: bizEmail } = await registerAndLogin('business');
    const biz = await User.findOne({ email: bizEmail });
    const event = await createApprovedEvent(biz._id);

    const { token: userToken } = await registerAndLogin('user');
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId: event._id, quantity: 1 });

    const bookingId = bookRes.body.booking._id;

    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
  });

});