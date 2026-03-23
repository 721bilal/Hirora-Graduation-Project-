const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// register user
router.post('/register', register);

// user login
router.post('/login', login);

module.exports = router;