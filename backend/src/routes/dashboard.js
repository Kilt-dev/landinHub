const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/data', auth, getDashboardData);
module.exports = router;