function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;
    var uri = request.uri;

    var subdomain = null;
    var baseDomain = 'landinghub.shop';

    // Tách subdomain nếu có
    if (host.endsWith('.' + baseDomain)) {
        subdomain = host.substring(0, host.length - baseDomain.length - 1);
    }

    // ✅ FIX: Nếu là file static (có extension), không rewrite
    var hasExtension = /\.[a-zA-Z0-9]+$/.test(uri);

    if (subdomain) {
        // Subdomain routing
        if (uri === '/' || uri === '') {
            request.uri = '/' + subdomain + '/index.html';
        }
        else if (!uri.startsWith('/' + subdomain + '/')) {
            request.uri = '/' + subdomain + uri;
        }
    } else {
        // Main domain routing
        if (uri === '/' || uri === '') {
            request.uri = '/index.html';
        }
        // ✅ FIX: Nếu request đến folder (không có extension), thêm /index.html
        else if (!hasExtension && !uri.endsWith('/')) {
            // Đây là SPA routing - serve index.html
            request.uri = '/index.html';
        }
        // ✅ Các file có extension (JS, CSS, PNG...) giữ nguyên URI
    }

    return request;
}
