const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

// ─── Helper: generate a short unique booking reference ───────────────────────
// e.g. BME-A3F9K2
const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BME-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

// ─── POST /api/bookings ───────────────────────────────────────────────────────
// Create a booking — checks capacity, blocks duplicates, handles concurrency
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!eventId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'eventId is required' });
    }

    if (quantity < 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // ── 1. Check event exists and is approved ──────────────────────────────
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'This event is not available for booking' });
    }

    // ── 2. Duplicate booking prevention ───────────────────────────────────
    // Block if this user already has a confirmed booking for this event
    const existingBooking = await Booking.findOne({
      user: userId,
      event: eventId,
      status: 'confirmed'
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: 'You already have a confirmed booking for this event'
      });
    }

    // ── 3. Concurrent booking protection + capacity check ─────────────────
    // Uses findOneAndUpdate with a condition so the decrement only happens
    // if there are enough seats — this is atomic, no race condition possible
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        remainingCapacity: { $gte: quantity } // condition: must have enough seats
      },
      {
        $inc: { remainingCapacity: -quantity } // atomically decrement
      },
      {
        new: true,    // return the updated document
        session       // part of the transaction
      }
    );

    // If updatedEvent is null, the condition failed — seats ran out
    if (!updatedEvent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Not enough seats available. Only ${event.remainingCapacity} left.`
      });
    }

    // ── 4. Create the booking ──────────────────────────────────────────────
    // Generate a unique bookingRef — retry if collision (extremely rare)
    let bookingRef;
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateBookingRef();
      const exists = await Booking.findOne({ bookingRef: candidate }).session(session);
      if (!exists) {
        bookingRef = candidate;
        break;
      }
      attempts++;
    }

    if (!bookingRef) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Could not generate booking reference, try again' });
    }

    const booking = await Booking.create(
      [{
        event: eventId,
        user: userId,
        bookingRef,
        quantity,
        status: 'confirmed',
        pricePaid: event.price * quantity
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Populate event and user details for the response
    const populated = await Booking.findById(booking[0]._id)
      .populate('event', 'title date venue city price')
      .populate('user', 'name email');

    return res.status(201).json({
      message: 'Booking confirmed',
      booking: populated
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('createBooking error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/bookings ────────────────────────────────────────────────────────
// Get all bookings for the currently logged-in user
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title date venue city price status')
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({ bookings });

  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
// Cancel a booking and restore remainingCapacity on the event
const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(req.params.id).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Make sure this booking belongs to the logged-in user
    if (booking.user.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    // Can't cancel what's already cancelled
    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // ── Cancel the booking ─────────────────────────────────────────────────
    booking.status = 'cancelled';
    await booking.save({ session });

    // ── Restore capacity on the event ──────────────────────────────────────
    await Event.findByIdAndUpdate(
      booking.event,
      { $inc: { remainingCapacity: booking.quantity } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('cancelBooking error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── GET /api/bookings/event/:id ─────────────────────────────────────────────
// Get all bookings for a specific event — business owner only
const getBookingsForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Make sure the logged-in business user owns this event
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only view bookings for your own events'
      });
    }

    // fixed — only confirmed bookings in the count and list
    const bookings = await Booking.find({ event: req.params.id, status: 'confirmed' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      event: event.title,
      totalBookings: bookings.length,
      bookings
    });

  } catch (err) {
    console.error('getBookingsForEvent error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingsForEvent
};