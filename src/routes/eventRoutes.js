const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// GET all approved events — PUBLIC, no login needed
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single event by ID — PUBLIC, no login needed
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create event — PROTECTED, business accounts only
router.post('/', protect, restrictTo('business'), async (req, res) => {
  try {
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

module.exports = router;
