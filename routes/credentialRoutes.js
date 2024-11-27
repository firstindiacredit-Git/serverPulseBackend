const express = require('express');
const router = express.Router();
const Credential = require('../models/Credential');
const Settings = require('../models/Settings');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all credentials (requires authentication and admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const credentials = await Credential.find();
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new credential
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const credential = new Credential({
    websiteName: req.body.websiteName,
    url: req.body.url,
    username: req.body.username,
    password: req.body.password,
    notes: req.body.notes
  });

  try {
    const newCredential = await credential.save();
    res.status(201).json(newCredential);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update credential
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const credential = await Credential.findById(req.params.id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    if (req.body.websiteName) credential.websiteName = req.body.websiteName;
    if (req.body.url) credential.url = req.body.url;
    if (req.body.username) credential.username = req.body.username;
    if (req.body.password) credential.password = req.body.password;
    if (req.body.notes !== undefined) credential.notes = req.body.notes;

    const updatedCredential = await credential.save();
    res.json(updatedCredential);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete credential
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const credential = await Credential.findById(req.params.id);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    await Credential.deleteOne({ _id: req.params.id });
    res.json({ message: 'Credential deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify locker PIN
router.post('/verify-pin', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOne() || new Settings();
    const isValid = req.body.pin === settings.lockerPin;
    res.json({ isValid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update locker PIN
router.put('/settings/pin', authenticateToken, isAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.lockerPin = req.body.pin;
    await settings.save();
    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
