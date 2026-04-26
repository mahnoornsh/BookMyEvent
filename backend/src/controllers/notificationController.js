const Notification = require('../models/Notification');

//geta all notifs for logged-in user, newest first
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//marks a single notif as read
const markOneRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not your notification' });
    }
    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ message: 'Marked as read', notification });
  } catch (err) {
    console.error('markOneRead error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//marks all notifs for the loggedin user as read
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//create a notif (used by other controllers)
const createNotification = async (userId, message) => {
  try {
    await Notification.create({ user: userId, message });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

module.exports = {
  getMyNotifications,
  markOneRead,
  markAllRead,
  createNotification,
};