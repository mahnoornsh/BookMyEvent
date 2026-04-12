import API from './axios';

// POST /api/bookings — create a booking
export const createBooking = (eventId, quantity) =>
  API.post('/bookings', { eventId, quantity });

// GET /api/bookings — get all bookings for logged-in user
export const getUserBookings = () => API.get('/bookings');

// PATCH /api/bookings/:id/cancel — cancel a booking
export const cancelBooking = (bookingId) =>
  API.patch(`/bookings/${bookingId}/cancel`);