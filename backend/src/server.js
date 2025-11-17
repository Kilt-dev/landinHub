const app = require('./app');
const http = require('http');
const server = http.createServer(app);

// ===== SERVERLESS WEBSOCKET (AWS API Gateway) =====
// Initialize WebSocket service for serverless architecture
const websocketService = require('./services/websocket/websocketService');
global._websocket = websocketService; // Make available globally for controllers/models

const PORT = process.env.PORT || 5000;
app.set('trust proxy', true);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket: Using AWS API Gateway WebSocket (serverless)`);

    if (process.env.WEBSOCKET_API_ENDPOINT) {
        console.log(`   Endpoint: ${process.env.WEBSOCKET_API_ENDPOINT}`);
        websocketService.initializeClient(process.env.WEBSOCKET_API_ENDPOINT);
    } else {
        console.warn('⚠️  WEBSOCKET_API_ENDPOINT not configured');
        console.warn('   Set WEBSOCKET_API_ENDPOINT to enable real-time features');
    }
});