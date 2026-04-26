const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyNotifications,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');

//gets get all notifs for loggedin user
router.get('/', protect, getMyNotifications);

//marks all as read 
router.patch('/read-all', protect, markAllRead);

//marks single notification as read
router.patch('/:id/read', protect, markOneRead);

module.exports = router;