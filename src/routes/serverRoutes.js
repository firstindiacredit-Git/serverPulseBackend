const express = require('express');
const router = express.Router();
const Server = require('../models/Server');
const { performHealthCheck } = require('../services/healthCheck');
const axios = require('axios');

// Get all servers
router.get('/', async (req, res) => {
  try {
    const servers = await Server.find();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new server
router.post('/', async (req, res) => {
  const server = new Server({
    title: req.body.title,
    url: req.body.url,
    endpoint: req.body.endpoint,
    status: 'offline',
    lastChecked: new Date()
  });

  try {
    const newServer = await server.save();
    res.status(201).json(newServer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update server
router.put('/:id', async (req, res) => {
  try {
    const { title, url, endpoint } = req.body;
    
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Update fields if they exist in the request
    if (title) server.title = title;
    if (url) server.url = url;
    if (endpoint !== undefined) server.endpoint = endpoint;

    await server.save();
    res.json(server);
  } catch (error) {
    console.error('Server update error:', error);
    res.status(500).json({ message: 'Failed to update server', error: error.message });
  }
});

// Delete a server
router.delete('/:id', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    await server.deleteOne();
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific server
router.get('/:id', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    res.json(server);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Perform health check for a specific server
router.post('/:id/check', async (req, res) => {
  try {
    const server = await Server.findById(req.params.id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    const result = await performHealthCheck(server);
    
    server.status = result.status;
    server.lastChecked = result.lastChecked;
    server.responseTime = result.responseTime;
    server.error = result.error;
    await server.save();

    res.json(server);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ message: 'Failed to perform health check', error: error.message });
  }
});

// Check health of all servers
router.post('/check-all', async (req, res) => {
  try {
    const servers = await Server.find();
    const checkPromises = servers.map(async (server) => {
      try {
        const response = await axios.get(`${server.url}${server.endpoint}`, {
          timeout: 5000 // 5 second timeout
        });
        
        server.status = response.status >= 200 && response.status < 300 ? 'online' : 'offline';
        server.lastChecked = new Date();
        await server.save();
      } catch (error) {
        server.status = 'offline';
        server.lastChecked = new Date();
        await server.save();
      }
    });

    await Promise.all(checkPromises);
    res.json({ message: 'All servers checked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
