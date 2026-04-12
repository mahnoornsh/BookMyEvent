const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// GET all users — admin only
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH deactivate a user — admin only
router.patch('/users/:id/deactivate', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH approve business account — admin only
router.patch('/businesses/:id/approve', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Business account approved', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH reject business account — admin only
router.patch('/businesses/:id/reject', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Business account rejected', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET all events (all statuses) — admin only
router.get('/events', protect, restrictTo('admin'), async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET stats — admin only
router.get('/stats', protect, restrictTo('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments({ status: 'approved' });
    const totalBookings = await Booking.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const rejectedEvents = await Event.countDocuments({ status: 'rejected' });
    res.json({ totalUsers, totalEvents, totalBookings, pendingEvents, rejectedEvents });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;