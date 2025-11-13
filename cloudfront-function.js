/**
 * CloudFront Function: Subdomain Router
 *
 * Mục đích: Route các subdomain của landinghub.vn đến đúng folder trong S3
 *
 * VD:
 * - Request: https://mypage.landinghub.vn/
 * - CloudFront function rewrite URI: / → /mypage/index.html
 * - S3 serve: s3://landinghub-iconic/mypage/index.html
 *
 * Deploy guide:
 * 1. Vào AWS Console → CloudFront → Functions
 * 2. Create function: "landinghub-subdomain-router"
 * 3. Copy paste code này
 * 4. Test function với test events
 * 5. Publish function
 * 6. Associate với CloudFront distribution E3E6ZTC75HGQKN
 *    - Event type: Viewer Request
 *
 * Cost: ~$0.10 per 1 million requests (rẻ hơn Lambda@Edge 6x)
 */

function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    var uri = request.uri;

    // Extract subdomain from host
    // mypage.landinghub.vn → mypage
    // landinghub.vn → null
    var subdomain = null;
    var baseDomain = 'landinghub.vn';

    if (host.endsWith('.' + baseDomain)) {
        subdomain = host.substring(0, host.length - baseDomain.length - 1);
    }

    // If subdomain exists, rewrite URI to subdomain folder
    if (subdomain) {
        // Root request: / → /subdomain/index.html
        if (uri === '/' || uri === '') {
            request.uri = '/' + subdomain + '/index.html';
        }
        // Asset requests: /style.css → /subdomain/style.css
        else if (!uri.startsWith('/' + subdomain + '/')) {
            request.uri = '/' + subdomain + uri;
        }
    } else {
        // Base domain: landinghub.vn
        // Serve default landing page or redirect
        if (uri === '/' || uri === '') {
            request.uri = '/index.html';
        }
    }

    return request;
}

/**
 * Test Events:
 *
 * Test 1 - Subdomain root:
 * {
 *   "version": "1.0",
 *   "context": {
 *     "eventType": "viewer-request"
 *   },
 *   "viewer": {
 *     "ip": "1.2.3.4"
 *   },
 *   "request": {
 *     "method": "GET",
 *     "uri": "/",
 *     "headers": {
 *       "host": {
 *         "value": "mypage.landinghub.vn"
 *       }
 *     }
 *   }
 * }
 * Expected result: request.uri = "/mypage/index.html"
 *
 * Test 2 - Base domain:
 * {
 *   "version": "1.0",
 *   "context": {
 *     "eventType": "viewer-request"
 *   },
 *   "viewer": {
 *     "ip": "1.2.3.4"
 *   },
 *   "request": {
 *     "method": "GET",
 *     "uri": "/",
 *     "headers": {
 *       "host": {
 *         "value": "landinghub.vn"
 *       }
 *     }
 *   }
 * }
 * Expected result: request.uri = "/index.html"
 */
