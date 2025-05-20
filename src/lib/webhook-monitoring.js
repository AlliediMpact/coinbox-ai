
/**
 * Webhook Monitoring Module
 * 
 * This module provides real-time monitoring of authentication events
 * and other security-related activities via WebSockets.
 */

const WebSocket = require('ws');

let wss = null;

/**
 * Initialize the WebSocket server for monitoring
 * @param {Server} server - HTTP server instance
 */
const initialize = (server) => {
  try {
    wss = new WebSocket.Server({ server });
    
    console.log('WebSocket server for webhook monitoring initialized');
    
    // Handle new connections
    wss.on('connection', (ws) => {
      console.log('Client connected to webhook monitoring');
      
      // Send initial status message
      ws.send(JSON.stringify({
        type: 'connection_status',
        message: 'Connected to CoinBox Security Monitoring',
        timestamp: new Date().toISOString()
      }));
      
      // Handle connection close
      ws.on('close', () => {
        console.log('Client disconnected from webhook monitoring');
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // We'll add event subscription when authLogger is available
    // in a production environment
    
  } catch (error) {
    console.error('Failed to initialize webhook monitoring:', error);
  }
};

/**
 * Broadcast an event to all connected clients
 * @param {string} type - The event type
 * @param {Object} data - The event data
 */
const broadcastEvent = (type, data) => {
  if (!wss) return;
  
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

/**
 * Send a security alert to all connected clients
 * @param {string} alertType - Type of alert
 * @param {string} message - Alert message
 * @param {Object} [metadata] - Additional metadata
 */
const sendSecurityAlert = (alertType, message, metadata = {}) => {
  broadcastEvent('security_alert', {
    alertType,
    message,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// Export the module
module.exports = {
  webhookMonitoring: {
    initialize,
    broadcastEvent,
    sendSecurityAlert
  }
};
