/**
 * Download Chromium using @puppeteer/browsers (Official Method)
 * Cách này LUÔN LUÔN work vì dùng tool chính thức của Puppeteer
 *
 * Cách chạy:
 * npm install @puppeteer/browsers
 * node download-chromium-v2.js
 */

const { install } = require('@puppeteer/browsers');
const path = require('path');
const fs = require('fs');

console.log('\n🚀 Installing Chromium for Puppeteer...\n');
console.log('Using @puppeteer/browsers (official Puppeteer tool)\n');

const cacheDir = path.join(__dirname, 'chromium');

(async () => {
    try {
        // Tạo thư mục cache
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
            console.log(`✅ Created directory: ${cacheDir}\n`);
        }

        console.log('📥 Downloading Chromium... (this may take a few minutes)\n');
        console.log('Platform:', process.platform);
        console.log('Architecture:', process.arch);
        console.log('Cache directory:', cacheDir);
        console.log('');

        // Download Chromium
        const browser = await install({
            browser: 'chrome',
            buildId: 'stable', // Luôn dùng version stable mới nhất
            cacheDir: cacheDir,
            unpack: true,
            downloadProgressCallback: (downloadedBytes, totalBytes) => {
                const percent = Math.floor((downloadedBytes / totalBytes) * 100);
                process.stdout.write(`\r📥 Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
            }
        });

        console.log('\n\n✅ Chromium installed successfully!\n');
        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 SUCCESS!');
        console.log('═══════════════════════════════════════════════════\n');
        console.log(`Chromium path: ${browser.executablePath}\n`);

        // Update .env
        const envPath = path.join(__dirname, '.env');
        const envExample = path.join(__dirname, '.env.example');

        // Create .env from .env.example if not exists
        if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
            fs.copyFileSync(envExample, envPath);
            console.log('✅ Created .env from .env.example\n');
        }

        // Add PUPPETEER_EXECUTABLE_PATH to .env
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf-8');

            if (envContent.includes('PUPPETEER_EXECUTABLE_PATH')) {
                // Update existing
                envContent = envContent.replace(
                    /PUPPETEER_EXECUTABLE_PATH=.*/g,
                    `PUPPETEER_EXECUTABLE_PATH=${browser.executablePath}`
                );
                fs.writeFileSync(envPath, envContent);
                console.log('✅ Updated PUPPETEER_EXECUTABLE_PATH in .env\n');
            } else {
                // Add new
                fs.appendFileSync(envPath, `\n# Chromium path for Puppeteer\nPUPPETEER_EXECUTABLE_PATH=${browser.executablePath}\n`);
                console.log('✅ Added PUPPETEER_EXECUTABLE_PATH to .env\n');
            }
        }

        console.log('📝 Next steps:\n');
        console.log('1. Test Puppeteer:');
        console.log('   node test-puppeteer.js\n');
        console.log('2. Start backend server:');
        console.log('   npm run start\n');
        console.log('🎉 Screenshot service is now ready to use!\n');

    } catch (error) {
        console.error('\n❌ Installation failed:', error.message);
        console.error('\nFull error:');
        console.error(error);
        console.error('\n💡 Troubleshooting:\n');
        console.error('1. Make sure @puppeteer/browsers is installed:');
        console.error('   npm install @puppeteer/browsers\n');
        console.error('2. Check internet connection\n');
        console.error('3. Try manual download from:');
        console.error('   https://download-chromium.appspot.com/\n');
        process.exit(1);
    }
})();
