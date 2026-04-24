const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// GET all approved events — PUBLIC
// router.get('/', async (req, res) => {
//   try {
//     const events = await Event.find({ status: 'approved' })
//       .populate('organizer', 'name email');
//     res.json(events);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const query = { status: 'approved', date: { $gte: now } };

    if (req.query.startDate) query.date.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.date.$lte = new Date(req.query.endDate);

    const events = await Event.find(query).populate('organizer', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/my — get events created by the logged-in business user
router.get('/my', protect, restrictTo('business'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single event by ID — PUBLIC
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create event — business only
router.post('/', protect, restrictTo('business'), async (req, res) => {
  try {
    const business = await require('../models/User').findById(req.user.id);
    if (!business.isApproved) {
      return res.status(403).json({ message: 'Your business account is pending admin approval. You cannot create events yet.' });
    }
    const { title, description, category, date, venue, city, totalCapacity, price } = req.body;
    const event = new Event({
      title,
      description,
      category,
      date,
      venue,
      city,
      totalCapacity,
      remainingCapacity: totalCapacity,
      price,
      organizer: req.user.id,
      status: 'pending',
    });
    await event.save();
    res.status(201).json({ message: 'Event created, awaiting admin approval', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH edit event — business only, must be owner
router.patch('/:id', protect, restrictTo('business'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }
    if (req.body.totalCapacity !== undefined) {
      const soldTickets = event.totalCapacity - event.remainingCapacity;
      if (req.body.totalCapacity < soldTickets) {
        return res.status(400).json({
          message: `Cannot reduce capacity below ${soldTickets} — that many tickets have already been sold`
        });
      }
      const capacityDiff = req.body.totalCapacity - event.totalCapacity;
      event.remainingCapacity = event.remainingCapacity + capacityDiff;
    }
    const allowed = ['title', 'description', 'category', 'date', 'venue', 'city', 'totalCapacity', 'price'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });
    await event.save();
    res.json({ message: 'Event updated', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE event — business only, must be owner
router.delete('/:id', protect, restrictTo('business'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH approve event — admin only
router.patch('/:id/approve', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event approved', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH reject event — admin only
router.patch('/:id/reject', protect, restrictTo('admin'), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event rejected', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;