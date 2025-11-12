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
 * Helper: Build HTML from page data
 * Generates complete HTML with embedded CSS/JS
 */
const buildHTML = async (pageData) => {
    const startTime = Date.now();

    try {
        // Get page components
        const components = pageData.page_data || [];

        // Basic HTML structure
        const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${pageData.description || pageData.name}">
    <title>${pageData.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .landing-container { width: 100%; min-height: 100vh; }
    </style>
</head>
<body>
    <div class="landing-container" id="root">
        <!-- Page content will be rendered by React -->
        <div style="padding: 40px; text-align: center;">
            <h1>${pageData.name}</h1>
            <p>${pageData.description || ''}</p>
        </div>
    </div>

    <!-- React and ReactDOM -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <script>
        // Page data
        const pageData = ${JSON.stringify(components)};

        // Form submission handler
        window.handleFormSubmit = async function(e, formId) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            // Submit to backend
            const response = await fetch('${process.env.API_URL || ''}/api/forms/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_id: '${pageData._id}',
                    form_data: data,
                    metadata: {
                        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
                        user_agent: navigator.userAgent,
                        submitted_at: new Date().toISOString()
                    }
                })
            });

            if (response.ok) {
                alert('Gửi thành công!');
                e.target.reset();
            } else {
                alert('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        };
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
const uploadToS3 = async (html, pageId) => {
    const bucketName = process.env.AWS_S3_BUCKET || 'landing-hub-pages';
    const objectKey = `pages/${pageId}/index.html`;

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
        const s3DomainName = `${bucketName}.s3.${process.env.AWS_S3_REGION || 'ap-southeast-1'}.amazonaws.com`;

        // Check for existing distribution
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
 */
const configureDNS = async (customDomain, cloudFrontDomain) => {
    try {
        const hostedZoneId = process.env.AWS_ROUTE53_HOSTED_ZONE_ID;
        if (!hostedZoneId) {
            throw new Error('Route 53 Hosted Zone ID not configured');
        }

        // Create or update A record
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

        return { success: true, hostedZoneId };
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
        deployment.subdomain = subdomain || null;

        await deployment.save();

        // 3. Build HTML
        deployment.addLog('Building HTML...');
        await deployment.save();

        const { html, buildTime, buildSize } = await buildHTML(page);
        deployment.build_time = buildTime;
        deployment.build_size = buildSize;
        await deployment.save();

        // 4. Upload to S3
        deployment.addLog('Uploading to S3...');
        await deployment.save();

        const { bucketName, objectKey, s3Url } = await uploadToS3(html, pageId);
        deployment.s3_bucket = bucketName;
        deployment.s3_object_key = objectKey;
        deployment.s3_url = s3Url;
        await deployment.save();

        // 5. Create/update CloudFront distribution
        deployment.addLog('Creating CloudFront distribution...');
        await deployment.save();

        const finalDomain = customDomain ||
            (subdomain ? `${subdomain}.${process.env.AWS_ROUTE53_BASE_DOMAIN}` : null);

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
