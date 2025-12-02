/**
 * Test Puppeteer Installation
 * Chạy file này để kiểm tra Puppeteer có hoạt động không
 *
 * Cách chạy:
 * node test-puppeteer.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

console.log('\n🔍 Testing Puppeteer Installation...\n');

(async () => {
    let browser = null;

    try {
        console.log('Step 1: Launching Puppeteer browser...');

        // Thử launch với config mặc định
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });
            console.log('✅ Puppeteer launched successfully with default Chromium!\n');
        } catch (launchError) {
            console.error('❌ Default launch failed:', launchError.message);
            console.log('\n🔄 Trying system Chrome...\n');

            // Thử tìm Chrome hệ thống (Windows)
            const chromePaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.PUPPETEER_EXECUTABLE_PATH, // Từ .env
                '/usr/bin/google-chrome', // Linux
                '/usr/bin/chromium-browser',
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // Mac
            ].filter(Boolean);

            let chromeFound = false;
            for (const chromePath of chromePaths) {
                if (fs.existsSync(chromePath)) {
                    console.log(`✅ Found Chrome at: ${chromePath}`);
                    try {
                        browser = await puppeteer.launch({
                            executablePath: chromePath,
                            headless: 'new',
                            args: [
                                '--no-sandbox',
                                '--disable-setuid-sandbox',
                                '--disable-dev-shm-usage',
                                '--disable-gpu'
                            ]
                        });
                        console.log('✅ Puppeteer launched successfully with system Chrome!\n');
                        chromeFound = true;
                        break;
                    } catch (e) {
                        console.error(`❌ Failed to launch with ${chromePath}:`, e.message);
                    }
                }
            }

            if (!chromeFound) {
                throw new Error('Could not find Chrome. Please install Chrome or set PUPPETEER_EXECUTABLE_PATH in .env');
            }
        }

        console.log('Step 2: Creating new page...');
        const page = await browser.newPage();
        console.log('✅ Page created\n');

        console.log('Step 3: Setting viewport...');
        await page.setViewport({ width: 1280, height: 1024 });
        console.log('✅ Viewport set to 1280x1024\n');

        console.log('Step 4: Setting HTML content...');
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .card {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                        text-align: center;
                    }
                    h1 {
                        color: #667eea;
                        margin: 0 0 20px 0;
                    }
                    p {
                        color: #666;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>✅ Puppeteer Works!</h1>
                    <p>Screenshot test successful</p>
                    <p style="margin-top: 10px; font-size: 14px; color: #999;">
                        ${new Date().toLocaleString()}
                    </p>
                </div>
            </body>
            </html>
        `, { waitUntil: 'load' });
        console.log('✅ HTML content loaded\n');

        console.log('Step 5: Taking screenshot...');
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });
        console.log(`✅ Screenshot captured: ${screenshot.length} bytes\n`);

        // Save screenshot to file
        const filename = `test-screenshot-${Date.now()}.png`;
        fs.writeFileSync(filename, screenshot);
        console.log(`✅ Screenshot saved to: ${filename}\n`);

        console.log('Step 6: Closing browser...');
        await browser.close();
        console.log('✅ Browser closed\n');

        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 TEST PASSED! Puppeteer is working correctly!');
        console.log('═══════════════════════════════════════════════════\n');
        console.log(`Screenshot file: ${filename}`);
        console.log('You can now use Puppeteer for screenshot generation.\n');

        process.exit(0);

    } catch (error) {
        console.error('\n═══════════════════════════════════════════════════');
        console.error('❌ TEST FAILED!');
        console.error('═══════════════════════════════════════════════════\n');
        console.error('Error:', error.message);
        console.error('\nFull error details:');
        console.error(error);
        console.error('\n📋 TROUBLESHOOTING STEPS:\n');
        console.error('1. Make sure Puppeteer is installed:');
        console.error('   npm install puppeteer@latest\n');
        console.error('2. If download fails, try with mirror:');
        console.error('   set PUPPETEER_DOWNLOAD_HOST=https://storage.googleapis.com');
        console.error('   npm install puppeteer@latest --force\n');
        console.error('3. Install Chrome browser:');
        console.error('   https://www.google.com/chrome/\n');
        console.error('4. Set Chrome path in .env:');
        console.error('   PUPPETEER_EXECUTABLE_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n');
        console.error('5. Read detailed guide:');
        console.error('   backend/FIX_PUPPETEER_WINDOWS.md\n');

        if (browser) {
            await browser.close().catch(() => {});
        }

        process.exit(1);
    }
})();
