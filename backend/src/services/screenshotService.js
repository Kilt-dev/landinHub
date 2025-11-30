// const puppeteer = require('puppeteer'); // Lazy load when needed
const s3CopyService = require('./s3CopyService');
const AWS = require('aws-sdk');
const screenshotApiService = require('./screenshotApiService'); // Fallback API service

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

            // Lazy load puppeteer only when needed
            const puppeteer = require('puppeteer');

            console.log('Launching Puppeteer browser');

            // Launch puppeteer with better error handling
            try {
                browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-web-security',
                        '--disable-gpu'
                    ]
                });
            } catch (launchError) {
                console.error('Failed to launch Puppeteer browser:', launchError.message);

                // If Chrome not found, try with system Chrome
                if (launchError.message.includes('Could not find Chrome')) {
                    console.log('Attempting to use system Chrome...');

                    // Try common Chrome paths
                    const chromePaths = [
                        '/usr/bin/google-chrome',
                        '/usr/bin/chromium-browser',
                        '/usr/bin/chromium',
                        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                    ];

                    let chromeFound = false;
                    for (const chromePath of chromePaths) {
                        try {
                            const fs = require('fs');
                            if (fs.existsSync(chromePath)) {
                                console.log(`Found Chrome at: ${chromePath}`);
                                browser = await puppeteer.launch({
                                    executablePath: chromePath,
                                    headless: 'new',
                                    args: [
                                        '--no-sandbox',
                                        '--disable-setuid-sandbox',
                                        '--disable-dev-shm-usage',
                                        '--disable-web-security',
                                        '--disable-gpu'
                                    ]
                                });
                                chromeFound = true;
                                break;
                            }
                        } catch (e) {
                            continue;
                        }
                    }

                    if (!chromeFound) {
                        throw new Error('Không thể khởi động trình duyệt: ' + launchError.message);
                    }
                } else {
                    throw new Error('Không thể khởi động trình duyệt: ' + launchError.message);
                }
            }

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

            // If all Puppeteer retries failed, fallback to API service
            console.log(`⚠️  Puppeteer failed after all retries. Attempting fallback to ScreenshotOne API...`);
            try {
                const screenshotUrl = await screenshotApiService.generateScreenshot(htmlContent, marketplacePageId);
                console.log(`✅ Fallback successful! Screenshot generated via API: ${screenshotUrl}`);
                return screenshotUrl;
            } catch (apiError) {
                console.error(`❌ API fallback also failed:`, apiError.message);
                throw new Error(`Both Puppeteer and API failed. Puppeteer: ${error.message}, API: ${apiError.message}`);
            }
        }
    }

    /**
     * Generate screenshot from S3 HTML file
     * This is the recommended method for marketplace pages
     * Will try Puppeteer first, then fallback to API if needed
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

            // Try Puppeteer first (with automatic API fallback if it fails)
            return await this.generateScreenshot(htmlContent, marketplacePageId);
        } catch (error) {
            console.error('Failed to generate screenshot from S3:', error.message);
            throw error;
        }
    }

}

module.exports = new ScreenshotService();