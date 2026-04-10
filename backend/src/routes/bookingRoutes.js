const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingsForEvent
} = require('../controllers/bookingController');

// POST /api/bookings — create a booking (any logged-in user)
router.post('/', protect, createBooking);

// GET /api/bookings — get all bookings for the logged-in user
router.get('/', protect, getMyBookings);

// PATCH /api/bookings/:id/cancel — cancel a booking (owner only, handled in controller)
router.patch('/:id/cancel', protect, cancelBooking);

// GET /api/bookings/event/:id — get all bookings for an event (business only)
router.get('/event/:id', protect, restrictTo('business', 'admin'), getBookingsForEvent);

module.exports = router;