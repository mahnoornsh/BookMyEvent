const { createBooking, cancelBooking } = require('../controllers/bookingController');

jest.mock('mongoose', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
  return {
    startSession: jest.fn().mockResolvedValue(mockSession),
    Schema: { Types: { ObjectId: String } },
  };
});

jest.mock('../models/Booking', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../models/Event', () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const Booking = require('../models/Booking');
const Event = require('../models/Event');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Booking Controller — createBooking', () => {

  beforeEach(() => jest.clearAllMocks());

  test('creates a booking successfully', async () => {
    const mockEvent = { _id: 'event123', status: 'approved', price: 500, remainingCapacity: 10 };
    Event.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockEvent) });
    Booking.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
    Event.findOneAndUpdate.mockReturnValue({ session: jest.fn().mockResolvedValue(mockEvent) });
    const mockBooking = [{ _id: 'booking123' }];
    Booking.create.mockResolvedValue(mockBooking);
    Booking.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'booking123', bookingRef: 'BME-ABC123' })
      })
    });

    const req = { body: { eventId: 'event123', quantity: 1 }, user: { id: 'user123' } };
    const res = mockRes();

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Booking confirmed',
    }));
  });

  test('blocks booking if event not found', async () => {
    Event.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

    const req = { body: { eventId: 'fakeid', quantity: 1 }, user: { id: 'user123' } };
    const res = mockRes();

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Event not found',
    }));
  });

  test('blocks duplicate booking', async () => {
    const mockEvent = { _id: 'event123', status: 'approved', price: 500, remainingCapacity: 10 };
    Event.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockEvent) });
    Booking.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'existing123' }) });

    const req = { body: { eventId: 'event123', quantity: 1 }, user: { id: 'user123' } };
    const res = mockRes();

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'You already have a confirmed booking for this event',
    }));
  });

  test('blocks booking when event is sold out', async () => {
    const mockEvent = { _id: 'event123', status: 'approved', price: 500, remainingCapacity: 0 };
    Event.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockEvent) });
    Booking.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
    Event.findOneAndUpdate.mockResolvedValue(null);

    const req = { body: { eventId: 'event123', quantity: 1 }, user: { id: 'user123' } };
    const res = mockRes();

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Not enough seats'),
    }));
  });

});

describe('Booking Controller — cancelBooking', () => {

  beforeEach(() => jest.clearAllMocks());

  test('cancels a booking successfully', async () => {
    const mockBooking = {
      _id: 'booking123',
      user: 'user123',
      event: 'event123',
      status: 'confirmed',
      quantity: 1,
      save: jest.fn().mockResolvedValue(true),
    };
    Booking.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockBooking) });
    Event.findByIdAndUpdate.mockReturnValue({ session: jest.fn().mockResolvedValue(true) });

    const req = { params: { id: 'booking123' }, user: { id: 'user123' } };
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Booking cancelled successfully',
    }));
  });

  test('blocks cancelling an already cancelled booking', async () => {
    const mockBooking = {
      _id: 'booking123',
      user: 'user123',
      status: 'cancelled',
    };
    Booking.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockBooking) });

    const req = { params: { id: 'booking123' }, user: { id: 'user123' } };
    const res = mockRes();

    await cancelBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Booking is already cancelled',
    }));
  });

});