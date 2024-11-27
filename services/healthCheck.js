const axios = require('axios');
const Server = require('../models/Server');

function ensureHttpProtocol(url) {
  if (!url || typeof url !== 'string') return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`; // Default to https
  }
  return url;
}

function combineUrlAndEndpoint(url, endpoint) {
  if (!url) return '';
  
  url = ensureHttpProtocol(url.trim());
  
  // Remove trailing slash from URL and leading slash from endpoint
  url = url.replace(/\/$/, '');
  endpoint = endpoint ? endpoint.replace(/^\//, '') : '';
  
  // Combine URL and endpoint
  return endpoint ? `${url}/${endpoint}` : url;
}

const performHealthCheck = async (server) => {
  if (!server || !server.url) {
    return {
      status: 'error',
      error: 'Invalid server configuration',
      responseTime: 0
    };
  }

  const fullUrl = combineUrlAndEndpoint(server.url, server.endpoint);
  
  if (!fullUrl) {
    return {
      status: 'error',
      error: 'Invalid URL configuration',
      responseTime: 0
    };
  }
  
  try {
    const startTime = Date.now();
    const response = await axios.get(fullUrl, {
      timeout: 10000, // 10 second timeout
      validateStatus: false, // Don't throw on non-2xx responses
      headers: {
        'User-Agent': 'ServerPulse-HealthCheck/1.0'
      },
      // Bypass CORS
      proxy: false,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // Consider any response as online, since we're just checking connectivity
    const status = response ? 'online' : 'error';
    const error = null;

    return {
      status,
      responseTime,
      error,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message || 'Failed to connect to server',
      responseTime: 0,
      lastChecked: new Date()
    };
  }
};

const performHealthChecks = async () => {
  try {
    const servers = await Server.find({});
    for (const server of servers) {
      const result = await performHealthCheck(server);
      
      server.status = result.status;
      server.lastChecked = result.lastChecked;
      server.responseTime = result.responseTime;
      server.error = result.error;
      
      await server.save();
    }
  } catch (error) {
    console.error('Error performing health checks:', error);
  }
};

module.exports = {
  performHealthCheck,
  performHealthChecks
};
