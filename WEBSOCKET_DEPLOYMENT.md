# AWS API Gateway WebSocket Deployment Guide

This project uses **AWS API Gateway WebSocket** for real-time features instead of Socket.IO to support serverless architecture.

## Architecture

### Components

1. **AWS API Gateway WebSocket API** - Manages WebSocket connections
2. **AWS Lambda** - Handles WebSocket events ($connect, $disconnect, $default)
3. **AWS DynamoDB** - Stores active WebSocket connections
4. **API Gateway Management API** - Sends messages to connected clients

### Why Serverless WebSocket?

- ✅ **Scalable**: Auto-scales with traffic
- ✅ **Cost-effective**: Pay only for what you use
- ✅ **No server management**: Fully managed by AWS
- ✅ **Perfect for Lambda**: Works seamlessly with serverless backend

## Deployment

### Prerequisites

1. **AWS CLI** configured with credentials
2. **Serverless Framework** installed:
   ```bash
   npm install -g serverless
   ```

### Deploy WebSocket API

```bash
cd backend
serverless deploy --stage prod
```

This will:
- Create API Gateway WebSocket API
- Deploy 3 Lambda functions (connect, disconnect, default)
- Create DynamoDB table for connection management
- Output WebSocket URL

### Output

After deployment, you'll get:
```
WebSocketAPIUrl: wss://xxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
```

### Configure Environment Variables

Update your `.env` files:

**Backend (`backend/.env`)**:
```env
WEBSOCKET_API_ENDPOINT=wss://xxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
WEBSOCKET_CONNECTIONS_TABLE=landinghub-websocket-connections-prod
```

**Frontend (`apps/web/.env`)**:
```env
REACT_APP_WEBSOCKET_URL=wss://xxxxx.execute-api.ap-southeast-1.amazonaws.com/prod
```

## Architecture Details

### Lambda Functions

#### 1. `connect.handler` ($connect route)
- Validates JWT token from query parameters
- Saves connection to DynamoDB
- Returns 200 on success, 401 on auth failure

#### 2. `disconnect.handler` ($disconnect route)
- Removes connection from DynamoDB
- Cleanup on client disconnect

#### 3. `default.handler` ($default route)
- Handles all custom actions from clients
- Actions:
  - `dashboard:join` - Join dashboard room
  - `dashboard:leave` - Leave dashboard room
  - `dashboard:refresh` - Request data refresh
  - `chat:join_room` - Join chat room
  - `chat:leave_room` - Leave chat room
  - `ping` - Keepalive ping/pong

### DynamoDB Schema

**Table**: `landinghub-websocket-connections-{stage}`

```
connectionId (HASH KEY) - API Gateway connection ID
userId - User ID from JWT
userRole - 'admin' or 'user'
userName - User's name
userEmail - User's email
rooms - Array of joined rooms
connectedAt - ISO timestamp
ttl - TTL for auto-cleanup (24 hours)
```

**GSI**: `UserIdIndex` (userId as HASH KEY)

### Sending Messages

From backend code:

```javascript
const websocketService = require('./services/websocket/websocketService');

// Send to specific user
await websocketService.sendToUser('userId', 'order_delivered', {
    orderId: '123',
    amount: 50000
});

// Send to room
await websocketService.sendToRoom('dashboard_admin', 'dashboard:update', {
    type: 'new_order'
});

// Broadcast to all
await websocketService.broadcast('system_alert', {
    message: 'System maintenance in 5 minutes'
});
```

## Frontend Integration

### Connect to WebSocket

```javascript
import { initSocket, joinDashboard, onDashboardUpdate } from './utils/socket';

// Initialize connection
const socket = initSocket();

// Join dashboard room
joinDashboard();

// Listen for updates
const cleanup = onDashboardUpdate((data) => {
    console.log('Dashboard update:', data);
    // Refresh your data
});

// Cleanup on unmount
return () => cleanup();
```

### Message Format

All messages follow this structure:

```json
{
    "event": "dashboard:update",
    "data": {
        "type": "new_order",
        "orderId": "123"
    },
    "timestamp": "2025-01-17T10:30:00.000Z"
}
```

## Local Development

For local testing, use serverless-offline:

```bash
npm install --save-dev serverless-offline
serverless offline start
```

WebSocket will be available at: `ws://localhost:3001`

## Monitoring

### CloudWatch Logs

Lambda logs are available in CloudWatch:
- `/aws/lambda/landinghub-backend-prod-websocketConnect`
- `/aws/lambda/landinghub-backend-prod-websocketDisconnect`
- `/aws/lambda/landinghub-backend-prod-websocketDefault`

### DynamoDB Metrics

Monitor DynamoDB table:
- Read/Write capacity units
- Item count (active connections)
- TTL deletions

### API Gateway Metrics

Monitor WebSocket API:
- Connection count
- Message count
- Integration latency
- 4xx/5xx errors

## Cost Estimation

### WebSocket API
- Connection minutes: $0.25 per million
- Messages: $1.00 per million

### Lambda
- Invocations: $0.20 per million
- Duration: $0.0000166667 per GB-second

### DynamoDB
- On-demand pricing
- Reads: $0.25 per million
- Writes: $1.25 per million

**Example**: 1000 concurrent users, 10 messages/hour
- Monthly cost: ~$10-20

## Troubleshooting

### Connection Failed (401)

- Check JWT token is valid
- Verify token is passed in query parameter: `?token=xxx`
- Check JWT_SECRET matches between services

### Messages Not Received

- Verify connection is in DynamoDB table
- Check user has joined correct room
- Check Lambda logs for errors
- Verify WEBSOCKET_API_ENDPOINT is set correctly

### Stale Connections

- TTL is set to 24 hours
- Connections auto-cleanup after expiry
- API Gateway removes stale connections automatically

## Migration from Socket.IO

### What Changed

1. **Connection Method**:
   - Before: `io(url, { auth: { token } })`
   - After: `new WebSocket(url + '?token=' + token)`

2. **Events**:
   - Before: `socket.emit('event', data)`
   - After: `ws.send(JSON.stringify({ action: 'event', ...data }))`

3. **Listening**:
   - Before: `socket.on('event', callback)`
   - After: Custom event emitter (handled in `utils/socket.js`)

### Code Changes

All WebSocket code is abstracted in `apps/web/src/utils/socket.js`, so dashboard components don't need changes.

## Security

### Authentication

- JWT token required for all connections
- Token validated in $connect route
- Invalid tokens rejected with 401

### Authorization

- Room membership stored per connection
- Users can only join their own rooms
- Admins can join admin-only rooms

### Best Practices

1. Use HTTPS/WSS in production
2. Implement rate limiting
3. Validate all incoming messages
4. Sanitize data before broadcasting
5. Use TTL to cleanup old connections
6. Monitor for abuse patterns

## References

- [AWS API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Serverless WebSocket](https://www.serverless.com/framework/docs/providers/aws/events/websocket)
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
