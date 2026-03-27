const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // <-- import protect

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Test JWT-protected route
router.get('/protected', protect, (req, res) => {
  res.json({
    message: "Access granted ",
    user: req.user
  });
});

module.exports = router;
