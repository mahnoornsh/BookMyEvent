const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  // location: {
  //   type: String,
  //   required: [true, 'Location is required']
  // },
  venue: {
    type: String,
    required: [true, 'Venue is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  totalCapacity: {
    type: Number,
    required: [true, 'Total capacity is required']
  },
  remainingCapacity: {
    type: Number,
    required: [true, 'Remaining capacity is required']
  },
  price: {
    type: Number,
    default: 0
  },
  // status: {
  //   type: String,
  //   enum: ['draft', 'published'],
  //   default: 'draft'
  // },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
