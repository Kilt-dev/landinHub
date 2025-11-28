const serverless = require('serverless-http');
const app = require('./src/app');

/**
 * AWS Lambda Handler with CORS Support
 *
 * Sử dụng serverless-http để wrap Express app
 * và tự động xử lý CORS cho mọi request
 */

// Wrap Express app với serverless-http
const handler = serverless(app, {
    // Binary media types để handle images, files
    binary: ['image/*', 'application/pdf', 'application/zip'],

    // Request/Response handling
    request: (request, event, context) => {
        // Log request để debug
        console.log('📡 Lambda Request:', {
            method: request.method,
            path: request.path,
            origin: request.headers.origin,
            headers: Object.keys(request.headers)
        });
    },

    response: (response, event, context) => {
        // Log response để debug
        console.log('📤 Lambda Response:', {
            statusCode: response.statusCode,
            headers: Object.keys(response.headers || {})
        });
    }
});

/**
 * Main Lambda Handler
 * Thêm CORS headers vào response nếu cần
 */
module.exports.handler = async (event, context) => {
    console.log('🚀 Lambda Event:', JSON.stringify({
        httpMethod: event.httpMethod || event.requestContext?.http?.method,
        path: event.path || event.rawPath,
        origin: event.headers?.origin || event.headers?.Origin,
        routeKey: event.requestContext?.routeKey
    }, null, 2));

    // Get origin từ request
    const origin = event.headers?.origin || event.headers?.Origin;

    // Allowed origins
    const allowedOrigins = [
        'https://landinghub.shop',
        'https://www.landinghub.shop',
        'https://api.landinghub.shop',
        'http://localhost:3000'
    ];

    // Check if origin is allowed
    const isAllowedOrigin = origin && (
        allowedOrigins.includes(origin) ||
        origin.includes('.cloudfront.net') ||
        origin.includes('.landinghub.shop')
    );

    const allowOrigin = isAllowedOrigin ? origin : 'https://landinghub.shop';

    // Handle OPTIONS preflight request
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    if (httpMethod === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight');

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Accept',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
                'Access-Control-Max-Age': '86400',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }

    try {
        // Forward request to Express app via serverless-http
        const response = await handler(event, context);

        // Ensure CORS headers are present in response
        if (!response.headers) {
            response.headers = {};
        }

        // Add/Override CORS headers
        response.headers['Access-Control-Allow-Origin'] = allowOrigin;
        response.headers['Access-Control-Allow-Credentials'] = 'true';
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Accept';
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';

        console.log('✅ Response with CORS headers:', {
            statusCode: response.statusCode,
            origin: response.headers['Access-Control-Allow-Origin']
        });

        return response;
    } catch (error) {
        console.error('❌ Lambda Error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Credentials': 'true'
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal Server Error',
                error: error.message
            })
        };
    }
};