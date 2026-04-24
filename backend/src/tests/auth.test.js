const { register, login } = require('../controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── Mock the User model ───────────────────────────────────────────────────────
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require('../models/User');

// ── Mock bcrypt ───────────────────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');

// ── Mock jsonwebtoken ─────────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocktoken'),
}));

// ── Set JWT_SECRET env var ────────────────────────────────────────────────────
process.env.JWT_SECRET = 'testsecret';

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Controller — register', () => {

  beforeEach(() => jest.clearAllMocks());

  test('registers a new user successfully', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'user123',
      name: 'Test User',
      email: 'test@test.com',
      role: 'user',
      isApproved: false,
    });

    const req = { body: { name: 'Test User', email: 'test@test.com', password: 'test1234' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Registration successful',
      token: 'mocktoken',
    }));
  });

  test('blocks registration with duplicate email', async () => {
    User.findOne.mockResolvedValue({ email: 'test@test.com' });

    const req = { body: { name: 'Test', email: 'test@test.com', password: 'test1234' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Email already in use',
    }));
  });

  test('blocks registration with missing fields', async () => {
    const req = { body: { email: 'test@test.com' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Please fill in all fields',
    }));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Controller — login', () => {

  beforeEach(() => jest.clearAllMocks());

  test('logs in successfully with correct credentials', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      name: 'Test User',
      email: 'test@test.com',
      passwordHash: 'hashedpassword',
      role: 'user',
      isApproved: false,
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { email: 'test@test.com', password: 'test1234' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      token: 'mocktoken',
    }));
  });

  test('blocks login with wrong password', async () => {
    User.findOne.mockResolvedValue({
      _id: 'user123',
      passwordHash: 'hashedpassword',
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: 'test@test.com', password: 'wrongpassword' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid email or password',
    }));
  });

  test('blocks login with non-existent email', async () => {
    User.findOne.mockResolvedValue(null);

    const req = { body: { email: 'nobody@test.com', password: 'test1234' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid email or password',
    }));
  });

});