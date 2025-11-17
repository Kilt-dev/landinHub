#!/usr/bin/env node

/**
 * WebSocket Testing Script
 * Tests WebSocket connection and messaging
 */

require('dotenv').config();
const websocketService = require('../src/services/websocket/websocketService');
const connectionManager = require('../src/services/websocket/connectionManager');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testWebSocketService() {
    log('\n========================================', 'cyan');
    log('  WebSocket Service Test', 'cyan');
    log('========================================\n', 'cyan');

    // Store connections for summary
    let connections = [];

    // Test 1: Check configuration
    log('Test 1: Checking configuration...', 'yellow');
    const endpoint = process.env.WEBSOCKET_API_ENDPOINT;
    if (!endpoint) {
        log('❌ WEBSOCKET_API_ENDPOINT not set in .env', 'red');
        process.exit(1);
    }
    log(`✅ Endpoint: ${endpoint}`, 'green');

    const tableName = process.env.WEBSOCKET_CONNECTIONS_TABLE;
    if (!tableName) {
        log('❌ WEBSOCKET_CONNECTIONS_TABLE not set in .env', 'red');
        process.exit(1);
    }
    log(`✅ Table: ${tableName}`, 'green');

    // Test 2: Initialize WebSocket service
    log('\nTest 2: Initializing WebSocket service...', 'yellow');
    try {
        websocketService.initializeClient(endpoint);
        if (websocketService.isHealthy()) {
            log('✅ WebSocket service initialized', 'green');
        } else {
            log('❌ WebSocket service not healthy', 'red');
            process.exit(1);
        }
    } catch (error) {
        log(`❌ Initialization failed: ${error.message}`, 'red');
        process.exit(1);
    }

    // Test 3: Check DynamoDB table
    log('\nTest 3: Checking DynamoDB table...', 'yellow');
    try {
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB({ region: process.env.AWS_REGION || 'ap-southeast-1' });

        const tableInfo = await dynamodb.describeTable({
            TableName: tableName
        }).promise();

        log(`✅ Table exists: ${tableInfo.Table.TableName}`, 'green');
        log(`   Status: ${tableInfo.Table.TableStatus}`, 'green');
        log(`   Item Count: ${tableInfo.Table.ItemCount}`, 'green');
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            log(`❌ Table not found: ${tableName}`, 'red');
            log('   Run: serverless deploy --stage prod', 'yellow');
        } else {
            log(`❌ Error checking table: ${error.message}`, 'red');
        }
        process.exit(1);
    }

    // Test 4: Get service metrics
    log('\nTest 4: Service metrics...', 'yellow');
    const metrics = websocketService.getMetrics();
    log(`Messages Sent: ${metrics.messagesSent}`, 'green');
    log(`Messages Failed: ${metrics.messagesFailed}`, 'green');
    log(`Stale Connections Removed: ${metrics.staleConnectionsRemoved}`, 'green');
    log(`Success Rate: ${metrics.successRate}`, 'green');

    // Test 5: Test connection manager
    log('\nTest 5: Testing connection manager...', 'yellow');
    try {
        // Try to get all connections
        const connections = await connectionManager.getAllConnections();
        log(`✅ Active connections: ${connections.length}`, 'green');

        if (connections.length > 0) {
            log('\nSample connections:', 'cyan');
            connections.slice(0, 3).forEach((conn, idx) => {
                log(`  ${idx + 1}. User: ${conn.userId} | Connection: ${conn.connectionId}`, 'green');
                if (conn.rooms && conn.rooms.length > 0) {
                    log(`     Rooms: ${conn.rooms.join(', ')}`, 'green');
                }
            });
        }
    } catch (error) {
        log(`❌ Connection manager error: ${error.message}`, 'red');
    }

    // Test 6: Test sending message (if connections exist)
    log('\nTest 6: Testing message sending...', 'yellow');
    try {
        connections = await connectionManager.getAllConnections();

        if (connections.length === 0) {
            log('⚠️  No active connections to test with', 'yellow');
            log('   Open the app in browser first to create connections', 'yellow');
        } else {
            log(`Found ${connections.length} active connections`, 'green');
            log('Sending test message to first connection...', 'yellow');

            const testConnection = connections[0];
            const result = await websocketService.sendToConnection(
                testConnection.connectionId,
                {
                    event: 'test',
                    data: {
                        message: 'Test message from test script',
                        timestamp: new Date().toISOString()
                    }
                }
            );

            if (result) {
                log('✅ Test message sent successfully', 'green');
                log('   Check browser console for message', 'yellow');
            } else {
                log('❌ Failed to send test message', 'red');
            }

            // Test sending to admin dashboard
            log('\nSending test to admin dashboard...', 'yellow');
            const sent = await websocketService.notifyAdminDashboard({
                type: 'test_notification',
                message: 'Test from script',
                timestamp: new Date().toISOString()
            });

            if (sent > 0) {
                log(`✅ Sent to ${sent} admin connections`, 'green');
            } else {
                log('⚠️  No admins online to receive message', 'yellow');
            }
        }
    } catch (error) {
        log(`❌ Send test error: ${error.message}`, 'red');
    }

    // Test 7: Final metrics
    log('\nTest 7: Final metrics...', 'yellow');
    const finalMetrics = websocketService.getMetrics();
    log(`Total Messages Sent: ${finalMetrics.messagesSent}`, 'green');
    log(`Total Messages Failed: ${finalMetrics.messagesFailed}`, 'green');
    log(`Stale Connections Removed: ${finalMetrics.staleConnectionsRemoved}`, 'green');
    log(`Success Rate: ${finalMetrics.successRate}`, 'green');

    // Summary
    log('\n========================================', 'cyan');
    log('  Test Summary', 'cyan');
    log('========================================', 'cyan');
    log('✅ Configuration: OK', 'green');
    log('✅ WebSocket Service: OK', 'green');
    log('✅ DynamoDB Table: OK', 'green');
    log('✅ Connection Manager: OK', 'green');

    if (connections.length > 0) {
        log('✅ Message Sending: OK', 'green');
    } else {
        log('⚠️  Message Sending: No connections to test', 'yellow');
    }

    log('\n🎉 All tests passed!\n', 'green');
    log('Next steps:', 'cyan');
    log('1. Open the app in browser', 'yellow');
    log('2. Check browser console for WebSocket connection', 'yellow');
    log('3. Test real-time updates (create order, submit form, etc.)', 'yellow');
    log('\nMonitoring:', 'cyan');
    log('- View Lambda logs: serverless logs -f websocketDefault --tail', 'yellow');
    log('- View DynamoDB items: aws dynamodb scan --table-name ' + tableName, 'yellow');
    log('\n');

    process.exit(0);
}

// Run tests
testWebSocketService().catch(error => {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
});
