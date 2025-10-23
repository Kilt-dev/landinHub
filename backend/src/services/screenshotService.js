const puppeteer = require('puppeteer');
const s3CopyService = require('./s3CopyService');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

class ScreenshotService {
    /**
     * Generate screenshot from HTML content (NOT page_data)
     * This should receive actual HTML from S3, not page_data object
     */
    async generateScreenshot(htmlContent, marketplacePageId, retries = 3) {
        let browser = null;
        let page = null;

        try {
            console.log(`Generating screenshot for marketplace page ${marketplacePageId} (attempt ${4 - retries}/3)`);

            // Validate input - should be HTML string, not object
            if (typeof htmlContent !== 'string') {
                throw new Error('htmlContent must be a string (HTML), not an object. Use HTML from S3, not page_data.');
            }

            // Launch puppeteer
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security'
                ]
            });

            page = await browser.newPage();

            // Set viewport for better screenshot quality
            await page.setViewport({
                width: 1280,
                height: 1024,
                deviceScaleFactor: 1
            });

            // Block unnecessary resources to speed up loading
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                const resourceType = request.resourceType();
                // Block fonts and videos to speed up
                if (['font', 'media'].includes(resourceType)) {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            // Set content with better wait strategy
            await page.setContent(htmlContent, {
                waitUntil: ['load', 'networkidle2'], // networkidle2 is less strict than networkidle0
                timeout: 45000 // Increased timeout
            });

            // Wait for all images to load
            await page.evaluate(() => {
                return Promise.all(
                    Array.from(document.images)
                        .filter(img => !img.complete)
                        .map(img => new Promise((resolve) => {
                            img.onload = img.onerror = resolve;
                        }))
                );
            });

            // Additional wait for rendering
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Get full page height
            const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
            console.log(`Page height: ${bodyHeight}px`);

            // Take FULL PAGE screenshot (like templates)
            const screenshot = await page.screenshot({
                fullPage: true, // Capture entire page
                type: 'png',
                omitBackground: false
            });

            await browser.close();
            browser = null;

            // Upload to S3
            const screenshotUrl = await s3CopyService.uploadScreenshot(screenshot, marketplacePageId);
            console.log(`Screenshot generated successfully: ${screenshotUrl}`);

            return screenshotUrl;
        } catch (error) {
            console.error(`Screenshot generation error (attempt ${4 - retries}/3):`, error.message);

            // Clean up
            if (page && !page.isClosed()) {
                await page.close().catch(e => console.error('Error closing page:', e));
            }
            if (browser) {
                await browser.close().catch(e => console.error('Error closing browser:', e));
            }

            // Retry logic
            if (retries > 0) {
                console.log(`Retrying screenshot generation for ${marketplacePageId}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                return this.generateScreenshot(htmlContent, marketplacePageId, retries - 1);
            }

            // If all retries failed, throw error
            throw error;
        }
    }

    /**
     * Generate screenshot from S3 HTML file
     * This is the recommended method for marketplace pages
     */
    async generateScreenshotFromS3(s3Key, marketplacePageId) {
        try {
            console.log(`Fetching HTML from S3: ${s3Key}`);

            const s3Response = await s3.getObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key
            }).promise();

            const htmlContent = s3Response.Body.toString('utf-8');
            console.log(`HTML fetched successfully, length: ${htmlContent.length} bytes`);

            return await this.generateScreenshot(htmlContent, marketplacePageId);
        } catch (error) {
            console.error('Failed to generate screenshot from S3:', error.message);
            throw error;
        }
    }

}

module.exports = new ScreenshotService();