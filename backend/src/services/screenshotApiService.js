const axios = require('axios');
const s3CopyService = require('./s3CopyService');

/**
 * Screenshot service using ScreenshotOne API
 * Free tier: 100 screenshots/month
 * Docs: https://screenshotone.com/docs
 */
class ScreenshotApiService {
    constructor() {
        // ScreenshotOne API key (get from: https://screenshotone.com/)
        // Free tier: 100 screenshots/month - no credit card required
        this.apiKey = process.env.SCREENSHOTONE_API_KEY || 'demo'; // 'demo' for testing
        this.baseUrl = 'https://api.screenshotone.com/take';
    }

    /**
     * Generate screenshot from HTML content using API
     * This is a fallback when Puppeteer fails
     */
    async generateScreenshot(htmlContent, marketplacePageId, retries = 2) {
        try {
            console.log(`📸 [API] Generating screenshot via ScreenshotOne for page ${marketplacePageId} (attempt ${3 - retries}/2)`);

            // Validate input
            if (typeof htmlContent !== 'string') {
                throw new Error('htmlContent must be a string (HTML)');
            }

            // ScreenshotOne API parameters
            const params = {
                access_key: this.apiKey,
                // Use 'html' parameter to render HTML directly
                html: htmlContent,
                // Screenshot options
                viewport_width: 1280,
                viewport_height: 1024,
                device_scale_factor: 1,
                format: 'png',
                full_page: true, // Capture full page like Puppeteer
                // Performance optimizations
                delay: 3, // Wait 3 seconds for rendering (like Puppeteer)
                block_ads: true,
                block_cookie_banners: true,
                block_trackers: true,
                // Timeout
                timeout: 45 // 45 seconds timeout
            };

            console.log(`📡 [API] Calling ScreenshotOne API...`);

            // Make API request
            const response = await axios.get(this.baseUrl, {
                params: params,
                responseType: 'arraybuffer', // Get binary data
                timeout: 50000 // 50 second timeout
            });

            console.log(`✅ [API] Screenshot received from ScreenshotOne`);

            // Upload to S3
            const screenshot = Buffer.from(response.data);
            const screenshotUrl = await s3CopyService.uploadScreenshot(screenshot, marketplacePageId);

            console.log(`✅ [API] Screenshot uploaded to S3: ${screenshotUrl}`);

            return screenshotUrl;
        } catch (error) {
            console.error(`❌ [API] Screenshot failed (attempt ${3 - retries}/2):`, error.message);

            // Retry logic
            if (retries > 0) {
                console.log(`🔄 [API] Retrying screenshot generation...`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                return this.generateScreenshot(htmlContent, marketplacePageId, retries - 1);
            }

            // All retries failed
            throw new Error(`ScreenshotOne API failed: ${error.message}`);
        }
    }

    /**
     * Generate screenshot from S3 HTML file using API
     */
    async generateScreenshotFromS3(s3Key, marketplacePageId) {
        try {
            console.log(`📥 [API] Fetching HTML from S3: ${s3Key}`);

            const AWS = require('aws-sdk');
            const s3 = new AWS.S3();

            const s3Response = await s3.getObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key
            }).promise();

            const htmlContent = s3Response.Body.toString('utf-8');
            console.log(`✅ [API] HTML fetched, length: ${htmlContent.length} bytes`);

            return await this.generateScreenshot(htmlContent, marketplacePageId);
        } catch (error) {
            console.error(`❌ [API] Failed to generate screenshot from S3:`, error.message);
            throw error;
        }
    }

    /**
     * Generate screenshot from URL (alternative method)
     * Use this if you have a publicly accessible URL
     */
    async generateScreenshotFromUrl(url, marketplacePageId) {
        try {
            console.log(`🌐 [API] Generating screenshot from URL: ${url}`);

            const params = {
                access_key: this.apiKey,
                url: url, // Use URL instead of HTML
                viewport_width: 1280,
                viewport_height: 1024,
                device_scale_factor: 1,
                format: 'png',
                full_page: true,
                delay: 3,
                block_ads: true,
                block_cookie_banners: true,
                block_trackers: true,
                timeout: 45
            };

            const response = await axios.get(this.baseUrl, {
                params: params,
                responseType: 'arraybuffer',
                timeout: 50000
            });

            const screenshot = Buffer.from(response.data);
            const screenshotUrl = await s3CopyService.uploadScreenshot(screenshot, marketplacePageId);

            console.log(`✅ [API] Screenshot from URL uploaded to S3: ${screenshotUrl}`);

            return screenshotUrl;
        } catch (error) {
            console.error(`❌ [API] Screenshot from URL failed:`, error.message);
            throw error;
        }
    }
}

module.exports = new ScreenshotApiService();
