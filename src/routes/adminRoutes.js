const express = require('express');
const { createAdmin } = require('../controllers/adminController');
const router = express.Router();

// Hidden admin creation endpoint
router.post('/create-admin', createAdmin);

module.exports = router;
