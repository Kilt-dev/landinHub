const AWS = require('aws-sdk');
const Deployment = require('../models/Deployment');
const Page = require('../models/Page');

// Configure AWS SDK with credentials from environment
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-southeast-1'
});

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const route53 = new AWS.Route53();
const acm = new AWS.ACM({ region: 'us-east-1' }); // ACM must be in us-east-1 for CloudFront

/**
 * Helper: Get S3 key from file_path
 * @param {string} file_path - S3 path like "s3://bucket-name/path/to/file"
 * @param {string} fileName - Optional file name (default: index.html)
 * @returns {string|null} - S3 key
 */
const getS3KeyFromFilePath = (file_path, fileName = 'index.html') => {
    if (!file_path) return null;
    const bucketName = process.env.AWS_S3_BUCKET;
    let s3Key;

    if (file_path.includes('landinghub-iconic')) {
        s3Key = file_path.split('s3://landinghub-iconic/')[1];
    } else {
        s3Key = file_path.split(`s3://${bucketName}/`)[1];
    }

    // Ensure s3Key ends with fileName
    return s3Key.endsWith(fileName) ? s3Key : `${s3Key}/${fileName}`;
};

/**
 * Helper: Get HTML content from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<string|null>} - HTML content or null if not found
 */
const getHTMLFromS3 = async (s3Key) => {
    try {
        console.log('Fetching HTML from S3:', s3Key);
        const s3Response = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        }).promise();

        const htmlContent = s3Response.Body.toString('utf-8');
        console.log(`Successfully fetched HTML from S3 (${htmlContent.length} bytes)`);
        return htmlContent;
    } catch (err) {
        console.error('Failed to get HTML from S3:', s3Key, err.message);
        return null;
    }
};

/**
 * Helper: Build HTML from page data
 * Generates complete HTML with embedded CSS/JS
 * IMPORTANT: API_URL must be the production backend URL for form submissions to work
 */
const buildHTML = async (pageData) => {
    const startTime = Date.now();

    try {
        // Get page components
        const components = pageData.page_data || [];

        // CRITICAL: Use production API URL for deployed pages
        // This must be accessible from CloudFront domains (check CORS!)
        const apiUrl = process.env.FRONTEND_URL || process.env.API_URL || 'http://localhost:5000';
        const backendUrl = process.env.API_URL || 'http://localhost:5000';

        // Escape special characters in JSON
        const escapeJSON = (str) => {
            return str
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
        };

        // Serialize components data
        const componentsJSON = JSON.stringify(components);

        // Basic HTML structure with full support for form submissions
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${(pageData.description || pageData.name || '').replace(/"/g, '&quot;')}">
    <meta name="keywords" content="landing page, ${(pageData.name || '').replace(/"/g, '&quot;')}">
    <meta name="author" content="Landing Hub">
    <title>${(pageData.name || 'Landing Page').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .landing-container {
            width: 100%;
            min-height: 100vh;
            position: relative;
        }

        /* Loading state */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-size: 18px;
            color: #666;
        }

        /* Form styles */
        form {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        form input,
        form textarea,
        form select {
            width: 100%;
            padding: 12px;
            margin-bottom: 16px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
        }

        form input:focus,
        form textarea:focus,
        form select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        form button[type="submit"] {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        form button[type="submit"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        form button[type="submit"]:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        /* Success/Error messages */
        .form-message {
            padding: 12px 20px;
            border-radius: 8px;
            margin: 16px 0;
            font-size: 14px;
            font-weight: 500;
        }

        .form-message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #10b981;
        }

        .form-message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #ef4444;
        }
    </style>
</head>
<body>
    <div id="root" class="landing-container">
        <div class="loading">Đang tải...</div>
    </div>

    <!-- React and ReactDOM from CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <script>
        // Configuration
        const CONFIG = {
            apiUrl: '${backendUrl}',
            pageId: '${pageData._id}',
            pageName: '${(pageData.name || '').replace(/'/g, "\\'")}',
            components: ${componentsJSON}
        };

        console.log('Landing Hub - Page loaded:', CONFIG.pageName);
        console.log('API URL:', CONFIG.apiUrl);
        console.log('Page ID:', CONFIG.pageId);

        /**
         * Enhanced Form Submission Handler
         * Submits form data to backend with metadata tracking
         */
        window.handleFormSubmit = async function(e, formId) {
            e.preventDefault();

            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');

            // Disable submit button
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang gửi...';
            }

            try {
                // Collect form data
                const formData = new FormData(form);
                const data = {};

                // Handle checkboxes and regular fields
                const checkboxes = new Set();
                form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    checkboxes.add(cb.name);
                });

                for (let [key, value] of formData.entries()) {
                    if (checkboxes.has(key)) {
                        if (!data[key]) {
                            data[key] = formData.getAll(key);
                        }
                    } else {
                        data[key] = value;
                    }
                }

                // Collect metadata for lead tracking
                const getDeviceType = () => {
                    const width = window.innerWidth;
                    if (width < 768) return 'mobile';
                    if (width < 1024) return 'tablet';
                    return 'desktop';
                };

                const getUtmParams = () => {
                    const urlParams = new URLSearchParams(window.location.search);
                    return {
                        utm_source: urlParams.get('utm_source'),
                        utm_medium: urlParams.get('utm_medium'),
                        utm_campaign: urlParams.get('utm_campaign'),
                        utm_term: urlParams.get('utm_term'),
                        utm_content: urlParams.get('utm_content'),
                    };
                };

                // Prepare submission payload
                const submissionData = {
                    page_id: CONFIG.pageId,
                    form_data: data,
                    metadata: {
                        device_type: getDeviceType(),
                        user_agent: navigator.userAgent,
                        screen_resolution: window.screen.width + 'x' + window.screen.height,
                        referrer: document.referrer || 'direct',
                        page_url: window.location.href,
                        submitted_at: new Date().toISOString(),
                        ...getUtmParams(),
                    }
                };

                console.log('Submitting form data:', submissionData);

                // Submit to backend
                const response = await fetch(CONFIG.apiUrl + '/api/forms/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(submissionData),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Show success message
                    showMessage('success', result.message || 'Gửi thành công! Cảm ơn bạn đã liên hệ.');

                    // Reset form
                    form.reset();

                    // Optional: Redirect or track conversion
                    if (window.gtag) {
                        gtag('event', 'form_submission', {
                            form_id: formId || 'contact_form',
                            page_id: CONFIG.pageId
                        });
                    }
                } else {
                    throw new Error(result.message || 'Gửi thất bại');
                }

            } catch (error) {
                console.error('Form submission error:', error);
                showMessage('error', 'Có lỗi xảy ra. Vui lòng thử lại sau. (' + error.message + ')');
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Gửi';
                }
            }
        };

        /**
         * Show success/error message
         */
        function showMessage(type, message) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'form-message ' + type;
            msgDiv.textContent = message;

            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(msgDiv, form.firstChild);

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    msgDiv.remove();
                }, 5000);
            } else {
                alert(message);
            }
        }

        /**
         * Render landing page components
         * TODO: Add full component rendering logic from helpers.js
         */
        function renderComponents() {
            const root = document.getElementById('root');

            if (!CONFIG.components || CONFIG.components.length === 0) {
                root.innerHTML = '<div style="padding: 40px; text-align: center;"><h1>' + CONFIG.pageName + '</h1><p>Trang đang được cập nhật...</p></div>';
                return;
            }

            // Basic rendering - will be enhanced with full component library
            root.innerHTML = '<div class="landing-container">' + CONFIG.components.map(comp => {
                // Placeholder rendering - needs full implementation
                return '<div>' + (comp.content || comp.text || '') + '</div>';
            }).join('') + '</div>';

            console.log('Components rendered:', CONFIG.components.length);
        }

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderComponents);
        } else {
            renderComponents();
        }
    </script>
</body>
</html>`;

        const buildTime = Date.now() - startTime;
        const buildSize = Buffer.byteLength(html, 'utf8');

        return {
            html,
            buildTime,
            buildSize
        };
    } catch (error) {
        throw new Error(`Build failed: ${error.message}`);
    }
};

/**
 * Helper: Upload HTML to S3
 */
const uploadToS3 = async (html, s3Path) => {
    const bucketName = process.env.AWS_S3_BUCKET || 'landing-hub-pages';
    // Use s3Path as subdomain or pageId for better organization
    const objectKey = `${s3Path}/index.html`;

    try {
        // Check if bucket exists, create if not
        try {
            await s3.headBucket({ Bucket: bucketName }).promise();
        } catch (error) {
            if (error.statusCode === 404) {
                await s3.createBucket({
                    Bucket: bucketName,
                    CreateBucketConfiguration: {
                        LocationConstraint: process.env.AWS_S3_REGION || 'ap-southeast-1'
                    }
                }).promise();

                // Make bucket public
                await s3.putBucketPolicy({
                    Bucket: bucketName,
                    Policy: JSON.stringify({
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Principal: '*',
                            Action: 's3:GetObject',
                            Resource: `arn:aws:s3:::${bucketName}/*`
                        }]
                    })
                }).promise();
            }
        }

        // Upload HTML
        await s3.putObject({
            Bucket: bucketName,
            Key: objectKey,
            Body: html,
            ContentType: 'text/html',
            CacheControl: 'max-age=300', // 5 minutes
        }).promise();

        const s3Url = `https://${bucketName}.s3.${process.env.AWS_S3_REGION || 'ap-southeast-1'}.amazonaws.com/${objectKey}`;

        return {
            bucketName,
            objectKey,
            s3Url
        };
    } catch (error) {
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

/**
 * Helper: Find or create CloudFront distribution
 */
const findOrCreateDistribution = async (bucketName, customDomain = null) => {
    try {
        // PRIORITY 1: Use existing CloudFront distribution from env if configured
        // This is for wildcard setups like *.landinghub.vn -> CloudFront
        if (process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID && process.env.AWS_CLOUDFRONT_DOMAIN) {
            console.log('Using existing CloudFront distribution from environment:', process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID);
            return {
                distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
                cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
                status: 'Deployed'
            };
        }

        const s3DomainName = `${bucketName}.s3.${process.env.AWS_S3_REGION || 'ap-southeast-1'}.amazonaws.com`;

        // PRIORITY 2: Check for existing distribution by S3 origin
        const distributions = await cloudfront.listDistributions({}).promise();
        let existingDist = null;

        if (distributions.DistributionList && distributions.DistributionList.Items) {
            existingDist = distributions.DistributionList.Items.find(
                dist => dist.Origins.Items[0].DomainName === s3DomainName
            );
        }

        if (existingDist) {
            return {
                distributionId: existingDist.Id,
                cloudFrontDomain: existingDist.DomainName,
                status: existingDist.Status
            };
        }

        // Create new distribution
        const aliases = customDomain ? [customDomain] : [];
        const certificateArn = customDomain ? process.env.AWS_ACM_CERTIFICATE_ARN : null;

        const params = {
            DistributionConfig: {
                CallerReference: `landing-hub-${Date.now()}`,
                Comment: 'Landing Hub Page Distribution',
                Enabled: true,
                Origins: {
                    Quantity: 1,
                    Items: [{
                        Id: 'S3Origin',
                        DomainName: s3DomainName,
                        S3OriginConfig: {
                            OriginAccessIdentity: ''
                        }
                    }]
                },
                DefaultCacheBehavior: {
                    TargetOriginId: 'S3Origin',
                    ViewerProtocolPolicy: 'redirect-to-https',
                    AllowedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    },
                    ForwardedValues: {
                        QueryString: false,
                        Cookies: { Forward: 'none' }
                    },
                    MinTTL: 0,
                    DefaultTTL: process.env.AWS_CLOUDFRONT_DEFAULT_TTL || 300,
                    MaxTTL: process.env.AWS_CLOUDFRONT_MAX_TTL || 86400,
                    Compress: true,
                    TrustedSigners: {
                        Enabled: false,
                        Quantity: 0
                    }
                },
                Aliases: {
                    Quantity: aliases.length,
                    Items: aliases
                },
                DefaultRootObject: 'index.html',
                PriceClass: process.env.AWS_CLOUDFRONT_PRICE_CLASS || 'PriceClass_100',
                ViewerCertificate: certificateArn ? {
                    ACMCertificateArn: certificateArn,
                    SSLSupportMethod: 'sni-only',
                    MinimumProtocolVersion: 'TLSv1.2_2021'
                } : {
                    CloudFrontDefaultCertificate: true
                }
            }
        };

        const result = await cloudfront.createDistribution(params).promise();

        return {
            distributionId: result.Distribution.Id,
            cloudFrontDomain: result.Distribution.DomainName,
            status: result.Distribution.Status
        };
    } catch (error) {
        throw new Error(`CloudFront creation failed: ${error.message}`);
    }
};

/**
 * Helper: Configure DNS with Route 53
 * Skip if wildcard DNS already exists (e.g., *.landinghub.vn)
 */
const configureDNS = async (customDomain, cloudFrontDomain) => {
    try {
        const hostedZoneId = process.env.AWS_ROUTE53_HOSTED_ZONE_ID;
        if (!hostedZoneId) {
            throw new Error('Route 53 Hosted Zone ID not configured');
        }

        // Check if wildcard DNS already exists
        const baseDomain = process.env.AWS_ROUTE53_BASE_DOMAIN;
        if (baseDomain && customDomain.endsWith(`.${baseDomain}`)) {
            console.log(`Subdomain ${customDomain} covered by wildcard *.${baseDomain} - skipping DNS creation`);
            return {
                success: true,
                hostedZoneId,
                skipped: true,
                reason: 'Wildcard DNS already configured'
            };
        }

        // Create or update A record for custom domains not covered by wildcard
        await route53.changeResourceRecordSets({
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
                Changes: [{
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                        Name: customDomain,
                        Type: 'A',
                        AliasTarget: {
                            HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront hosted zone ID (constant)
                            DNSName: cloudFrontDomain,
                            EvaluateTargetHealth: false
                        }
                    }
                }]
            }
        }).promise();

        return { success: true, hostedZoneId, skipped: false };
    } catch (error) {
        throw new Error(`Route 53 configuration failed: ${error.message}`);
    }
};

/**
 * Helper: Invalidate CloudFront cache
 */
const invalidateCache = async (distributionId) => {
    try {
        const result = await cloudfront.createInvalidation({
            DistributionId: distributionId,
            InvalidationBatch: {
                CallerReference: `invalidation-${Date.now()}`,
                Paths: {
                    Quantity: 1,
                    Items: ['/*']
                }
            }
        }).promise();

        return {
            invalidationId: result.Invalidation.Id,
            status: result.Invalidation.Status
        };
    } catch (error) {
        throw new Error(`Cache invalidation failed: ${error.message}`);
    }
};

/**
 * Main Deployment Endpoint
 * POST /api/deployment/:pageId/deploy
 */
exports.deployPage = async (req, res) => {
    const { pageId } = req.params;
    const { customDomain, subdomain } = req.body;
    const userId = req.user.id;

    try {
        // 1. Get page data
        const page = await Page.findOne({ _id: pageId, user_id: userId });
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        // 2. Find or create deployment record
        let deployment = await Deployment.findOne({ page_id: pageId });
        if (!deployment) {
            deployment = new Deployment({
                page_id: pageId,
                user_id: userId,
                status: 'deploying'
            });
        } else {
            deployment.updateStatus('deploying');
        }

        // Update domain settings
        deployment.use_custom_domain = !!customDomain;
        deployment.custom_domain = customDomain || null;

        // Auto-generate subdomain if not provided and base domain exists
        let finalSubdomain = subdomain;
        if (!subdomain && !customDomain && process.env.AWS_ROUTE53_BASE_DOMAIN) {
            // Use page slug or generate from pageId
            finalSubdomain = page.slug || pageId.substring(0, 8);
            console.log(`Auto-generated subdomain: ${finalSubdomain}`);
        }
        deployment.subdomain = finalSubdomain || null;

        await deployment.save();

        // 3. Get HTML - Try to fetch from S3 first, fallback to building
        deployment.addLog('Preparing HTML...');
        await deployment.save();

        let html, buildTime, buildSize;
        const startTime = Date.now();

        // Try to get existing HTML from S3 (already generated by frontend)
        if (page.file_path) {
            const s3Key = getS3KeyFromFilePath(page.file_path);
            if (s3Key) {
                console.log(`Attempting to fetch existing HTML from S3: ${s3Key}`);
                deployment.addLog(`Fetching existing HTML from S3...`);
                await deployment.save();

                html = await getHTMLFromS3(s3Key);

                if (html) {
                    buildTime = Date.now() - startTime;
                    buildSize = Buffer.byteLength(html, 'utf8');
                    console.log(`✅ Using existing HTML from S3 (${buildSize} bytes, ${buildTime}ms)`);
                    deployment.addLog(`✅ Using existing HTML (${(buildSize / 1024).toFixed(2)} KB)`);
                } else {
                    console.log('⚠️ Could not fetch HTML from S3, will build from scratch');
                }
            }
        }

        // Fallback: Build HTML if we couldn't get it from S3
        if (!html) {
            console.log('Building HTML from page data...');
            deployment.addLog('Building HTML from page data...');
            await deployment.save();

            const buildResult = await buildHTML(page);
            html = buildResult.html;
            buildTime = buildResult.buildTime;
            buildSize = buildResult.buildSize;
        }

        deployment.build_time = buildTime;
        deployment.build_size = buildSize;
        await deployment.save();

        // 4. Upload to S3
        deployment.addLog('Uploading to S3...');
        await deployment.save();

        // Use subdomain as S3 path for better organization
        const s3Path = finalSubdomain || pageId;
        const { bucketName, objectKey, s3Url } = await uploadToS3(html, s3Path);
        deployment.s3_bucket = bucketName;
        deployment.s3_object_key = objectKey;
        deployment.s3_url = s3Url;
        await deployment.save();

        // 5. Create/update CloudFront distribution
        deployment.addLog('Creating CloudFront distribution...');
        await deployment.save();

        // Construct final domain (custom domain or auto-generated subdomain)
        const finalDomain = customDomain ||
            (finalSubdomain ? `${finalSubdomain}.${process.env.AWS_ROUTE53_BASE_DOMAIN}` : null);

        const { distributionId, cloudFrontDomain, status } =
            await findOrCreateDistribution(bucketName, finalDomain);

        deployment.cloudfront_distribution_id = distributionId;
        deployment.cloudfront_domain = cloudFrontDomain;
        await deployment.save();

        // 6. Configure DNS if custom domain
        if (finalDomain) {
            deployment.addLog(`Configuring DNS for ${finalDomain}...`);
            await deployment.save();

            const { hostedZoneId } = await configureDNS(finalDomain, cloudFrontDomain);
            deployment.route53_hosted_zone_id = hostedZoneId;
            await deployment.save();
        }

        // 7. Invalidate cache
        deployment.addLog('Invalidating CloudFront cache...');
        await deployment.save();

        await invalidateCache(distributionId);

        // 8. Update final status
        deployment.updateStatus('deployed');
        deployment.deployed_url = finalDomain ? `https://${finalDomain}` : `https://${cloudFrontDomain}`;
        await deployment.save();

        // 9. Update Page model with deployed URL
        page.status = 'ĐÃ XUẤT BẢN';
        page.url = deployment.deployed_url;
        page.cloudfrontDomain = deployment.cloudfront_domain;
        page.updated_at = new Date();
        await page.save();

        // Return success response
        res.json({
            success: true,
            message: 'Deployment completed successfully',
            deployment: {
                status: deployment.status,
                url: deployment.deployed_url,
                cloudFrontDomain: deployment.cloudfront_domain,
                customDomain: deployment.custom_domain,
                subdomain: deployment.subdomain,
                lastDeployed: deployment.last_deployed,
                distributionId: deployment.cloudfront_distribution_id
            }
        });

    } catch (error) {
        console.error('Deployment error:', error);

        // Update deployment status to failed
        if (deployment) {
            deployment.updateStatus('failed', error.message);
            await deployment.save();
        }

        res.status(500).json({
            success: false,
            message: 'Deployment failed',
            error: error.message
        });
    }
};

/**
 * Get Deployment Info
 * GET /api/deployment/:pageId
 */
exports.getDeploymentInfo = async (req, res) => {
    const { pageId } = req.params;
    const userId = req.user.id;

    try {
        const deployment = await Deployment.findOne({ page_id: pageId, user_id: userId });

        if (!deployment) {
            return res.status(404).json({ message: 'No deployment found' });
        }

        res.json({
            status: deployment.status,
            url: deployment.deployed_url,
            cloudFrontDomain: deployment.cloudfront_domain,
            customDomain: deployment.custom_domain,
            subdomain: deployment.subdomain,
            distributionId: deployment.cloudfront_distribution_id,
            lastDeployed: deployment.last_deployed,
            deploymentCount: deployment.deployment_count,
            lastError: deployment.last_error,
            buildSize: deployment.build_size,
            buildTime: deployment.build_time,
            logs: deployment.logs.slice(-20) // Last 20 logs
        });
    } catch (error) {
        console.error('Error fetching deployment info:', error);
        res.status(500).json({ message: 'Failed to fetch deployment info', error: error.message });
    }
};

/**
 * Invalidate deployment cache manually
 * POST /api/deployment/:pageId/invalidate
 */
exports.invalidateDeployment = async (req, res) => {
    const { pageId } = req.params;
    const userId = req.user.id;

    try {
        const deployment = await Deployment.findOne({ page_id: pageId, user_id: userId });

        if (!deployment || !deployment.cloudfront_distribution_id) {
            return res.status(404).json({ message: 'No active deployment found' });
        }

        const result = await invalidateCache(deployment.cloudfront_distribution_id);

        deployment.addLog('Cache invalidated manually');
        await deployment.save();

        res.json({
            success: true,
            message: 'Cache invalidated successfully',
            invalidation: result
        });
    } catch (error) {
        console.error('Invalidation error:', error);
        res.status(500).json({ message: 'Failed to invalidate cache', error: error.message });
    }
};

/**
 * Delete deployment
 * DELETE /api/deployment/:pageId
 */
exports.deleteDeployment = async (req, res) => {
    const { pageId } = req.params;
    const userId = req.user.id;

    try {
        const deployment = await Deployment.findOne({ page_id: pageId, user_id: userId });

        if (!deployment) {
            return res.status(404).json({ message: 'No deployment found' });
        }

        // Optionally disable CloudFront distribution
        if (deployment.cloudfront_distribution_id) {
            try {
                const dist = await cloudfront.getDistribution({
                    Id: deployment.cloudfront_distribution_id
                }).promise();

                if (dist.Distribution.DistributionConfig.Enabled) {
                    const config = dist.Distribution.DistributionConfig;
                    config.Enabled = false;

                    await cloudfront.updateDistribution({
                        Id: deployment.cloudfront_distribution_id,
                        DistributionConfig: config,
                        IfMatch: dist.ETag
                    }).promise();
                }
            } catch (error) {
                console.warn('Failed to disable CloudFront distribution:', error.message);
            }
        }

        await Deployment.deleteOne({ _id: deployment._id });

        res.json({
            success: true,
            message: 'Deployment deleted successfully'
        });
    } catch (error) {
        console.error('Delete deployment error:', error);
        res.status(500).json({ message: 'Failed to delete deployment', error: error.message });
    }
};

/**
 * Test form submission for deployed page
 * POST /api/deployment/:pageId/test-form
 * Simulates end user submitting a form from deployed page
 */
exports.testFormSubmission = async (req, res) => {
    const { pageId } = req.params;
    const { form_data } = req.body;
    const userId = req.user.id;

    try {
        const deployment = await Deployment.findOne({ page_id: pageId, user_id: userId });

        if (!deployment) {
            return res.status(404).json({ message: 'No deployment found' });
        }

        if (deployment.status !== 'deployed') {
            return res.status(400).json({ message: 'Page not deployed yet' });
        }

        // Simulate form submission
        const submissionData = {
            page_id: pageId,
            form_data: form_data || {
                name: 'Test User',
                email: 'test@example.com',
                message: 'This is a test form submission'
            },
            metadata: {
                device_type: 'desktop',
                user_agent: 'Mozilla/5.0 (Test)',
                screen_resolution: '1920x1080',
                referrer: 'test',
                page_url: deployment.deployed_url,
                submitted_at: new Date().toISOString(),
                utm_source: 'test',
                utm_medium: 'api',
                utm_campaign: 'deployment_test'
            }
        };

        // Call form submission endpoint
        const axios = require('axios');
        const apiUrl = process.env.API_URL || 'http://localhost:5000';

        const response = await axios.post(`${apiUrl}/api/forms/submit`, submissionData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json({
            success: true,
            message: 'Test form submission completed',
            deployed_url: deployment.deployed_url,
            submission: response.data,
            test_data: submissionData
        });

    } catch (error) {
        console.error('Test form submission error:', error);
        res.status(500).json({
            message: 'Test form submission failed',
            error: error.message,
            details: error.response?.data || null
        });
    }
};
