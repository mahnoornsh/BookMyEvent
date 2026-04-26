const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { createNotification } = require('./notificationController');

//generate a short unique booking reference 
const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BME-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

//POST /api/bookings
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

    //Check event exists and is approved 
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

    //Duplicate booking prevention 
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

    //Atomic capacity check + decrement
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, remainingCapacity: { $gte: quantity } },
      { $inc: { remainingCapacity: -quantity } },
      { new: true, session }
    );

    if (!updatedEvent) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Not enough seats available. Only ${event.remainingCapacity} left.`
      });
    }

    //Generate unique bookingRef
    let bookingRef;
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateBookingRef();
      const exists = await Booking.findOne({ bookingRef: candidate }).session(session);
      if (!exists) { bookingRef = candidate; break; }
      attempts++;
    }

    if (!bookingRef) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Could not generate booking reference, try again' });
    }

    //Create the booking
    const booking = await Booking.create(
      [{ event: eventId, user: userId, bookingRef, quantity, status: 'confirmed', pricePaid: event.price * quantity }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    //Send notifications (after transaction, non-blocking) 
    //Notify the user who booked 
    await createNotification(
      userId,
      `Your booking for "${event.title}" is confirmed! Ref: ${bookingRef}`
    );

    //Notify the business organizer 
    await createNotification(
      event.organizer,
      `New booking received for "${event.title}" — ${quantity} ticket${quantity > 1 ? 's' : ''} (Ref: ${bookingRef})`
    );

    const populated = await Booking.findById(booking[0]._id)
      .populate('event', 'title date venue city price')
      .populate('user', 'name email');

    return res.status(201).json({ message: 'Booking confirmed', booking: populated });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('createBooking error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//GET /api/bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('event', 'title date venue city price status')
      .sort({ createdAt: -1 });
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('getMyBookings error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//PATCH /api/bookings/:id/cancel
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

    if (booking.user.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save({ session });

    await Event.findByIdAndUpdate(
      booking.event,
      { $inc: { remainingCapacity: booking.quantity } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Notify the user of cancellation
    await createNotification(
      req.user.id,
      `Your booking (Ref: ${booking.bookingRef}) has been cancelled successfully.`
    );

    return res.status(200).json({ message: 'Booking cancelled successfully', booking });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('cancelBooking error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//GET /api/bookings/event/:id 
const getBookingsForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only view bookings for your own events' });
    }

    const bookings = await Booking.find({ event: req.params.id, status: 'confirmed' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ event: event.title, totalBookings: bookings.length, bookings });

  } catch (err) {
    console.error('getBookingsForEvent error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getBookingsForEvent };