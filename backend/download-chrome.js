/**
 * Download Chrome using @puppeteer/browsers
 * Alternative method when Puppeteer's default download fails
 *
 * Usage: node download-chrome.js
 */

const { install } = require('@puppeteer/browsers');
const path = require('path');

console.log('\n🔍 Downloading Chrome using @puppeteer/browsers...\n');

(async () => {
    try {
        const cacheDir = path.join(__dirname, '.chrome');

        console.log('Installing Chrome...');
        console.log(`Cache directory: ${cacheDir}\n`);

        const browser = await install({
            browser: 'chrome',
            buildId: '142.0.7444.61', // Stable version matching puppeteer 24.21.0
            cacheDir: cacheDir,
        });

        console.log('\n✅ Chrome downloaded successfully!');
        console.log(`Executable path: ${browser.executablePath}\n`);
        console.log('═══════════════════════════════════════════════════');
        console.log('Next steps:');
        console.log('1. Add this to your .env file:');
        console.log(`   PUPPETEER_EXECUTABLE_PATH=${browser.executablePath}`);
        console.log('\n2. Run the test:');
        console.log('   node test-puppeteer.js');
        console.log('═══════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Download failed!');
        console.error('Error:', error.message);
        console.error('\nFull error:');
        console.error(error);
        console.error('\n📋 TROUBLESHOOTING:\n');
        console.error('1. Check your internet connection');
        console.error('2. Try again with a different Chrome version');
        console.error('3. Use the fallback API service instead (ScreenshotOne)\n');
        process.exit(1);
    }
})();
