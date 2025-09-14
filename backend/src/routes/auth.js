const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/User');
const {OAuth2Client} = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/register', [
    check('email', 'Invalid email').isEmail(),
    check('password', 'Password must be at least 6 chars').isLength({ min: 6 }),
    check('name', 'Name is required').notEmpty()
], authController.register);

router.post('/login', [
    check('email', 'Invalid email').isEmail(),
    check('password', 'Password is required').notEmpty()
], authController.login);

router.post('/google/callback', authController.googleCallback);

module.exports = router;