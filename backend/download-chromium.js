/**
 * Download Chromium for Puppeteer (Windows)
 * Chạy script này để tự động download Chromium portable
 *
 * Cách chạy:
 * node download-chromium.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 Downloading Chromium for Puppeteer...\n');

// Chromium version (stable)
const CHROMIUM_VERSION = '1181205'; // Update this to latest stable version
const PLATFORM = process.platform === 'win32' ? 'Win_x64' :
                 process.platform === 'darwin' ? 'Mac' :
                 'Linux_x64';

const DOWNLOAD_URL = `https://commondatastorage.googleapis.com/chromium-browser-snapshots/${PLATFORM}/${CHROMIUM_VERSION}/chrome-${PLATFORM === 'Win_x64' ? 'win' : PLATFORM === 'Mac' ? 'mac' : 'linux'}.zip`;

const CHROMIUM_DIR = path.join(__dirname, 'chromium');
const ZIP_FILE = path.join(CHROMIUM_DIR, 'chrome.zip');

// Create chromium directory
if (!fs.existsSync(CHROMIUM_DIR)) {
    fs.mkdirSync(CHROMIUM_DIR, { recursive: true });
    console.log(`✅ Created directory: ${CHROMIUM_DIR}\n`);
}

console.log(`📦 Platform: ${PLATFORM}`);
console.log(`📦 Version: ${CHROMIUM_VERSION}`);
console.log(`📦 Download URL: ${DOWNLOAD_URL}\n`);
console.log('⏳ Downloading Chromium... (this may take a few minutes)\n');

// Download file
const file = fs.createWriteStream(ZIP_FILE);

https.get(DOWNLOAD_URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Download failed: HTTP ${response.statusCode}`);
        console.error('\n💡 Try manual download:');
        console.error(`   1. Visit: https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html`);
        console.error(`   2. Navigate to: ${PLATFORM}/${CHROMIUM_VERSION}/`);
        console.error(`   3. Download chrome-*.zip`);
        console.error(`   4. Extract to: ${CHROMIUM_DIR}\n`);
        process.exit(1);
    }

    const totalBytes = parseInt(response.headers['content-length'], 10);
    let downloadedBytes = 0;
    let lastPercent = 0;

    response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const percent = Math.floor((downloadedBytes / totalBytes) * 100);

        if (percent > lastPercent) {
            process.stdout.write(`\r📥 Progress: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB / ${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
            lastPercent = percent;
        }
    });

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('\n\n✅ Download completed!\n');

        // Extract zip
        console.log('📦 Extracting Chromium...\n');

        try {
            if (process.platform === 'win32') {
                // Windows: Use PowerShell to extract
                execSync(`powershell -command "Expand-Archive -Path '${ZIP_FILE}' -DestinationPath '${CHROMIUM_DIR}' -Force"`, { stdio: 'inherit' });
            } else {
                // Linux/Mac: Use unzip
                execSync(`unzip -o "${ZIP_FILE}" -d "${CHROMIUM_DIR}"`, { stdio: 'inherit' });
            }

            console.log('\n✅ Extraction completed!\n');

            // Delete zip file
            fs.unlinkSync(ZIP_FILE);
            console.log('🧹 Cleaned up zip file\n');

            // Find Chrome executable
            let chromePath;
            if (process.platform === 'win32') {
                chromePath = path.join(CHROMIUM_DIR, 'chrome-win', 'chrome.exe');
            } else if (process.platform === 'darwin') {
                chromePath = path.join(CHROMIUM_DIR, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
            } else {
                chromePath = path.join(CHROMIUM_DIR, 'chrome-linux', 'chrome');
            }

            if (fs.existsSync(chromePath)) {
                console.log('═══════════════════════════════════════════════════');
                console.log('🎉 SUCCESS! Chromium installed successfully!');
                console.log('═══════════════════════════════════════════════════\n');
                console.log(`Chromium path: ${chromePath}\n`);
                console.log('📝 Next steps:\n');
                console.log('1. Add this line to your .env file:\n');
                console.log(`   PUPPETEER_EXECUTABLE_PATH=${chromePath}\n`);
                console.log('2. Restart your backend server:\n');
                console.log('   npm run start\n');
                console.log('3. Test Puppeteer:\n');
                console.log('   node test-puppeteer.js\n');

                // Auto-create .env entry
                const envPath = path.join(__dirname, '.env');
                const envExample = path.join(__dirname, '.env.example');

                if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
                    fs.copyFileSync(envExample, envPath);
                    console.log('✅ Created .env from .env.example\n');
                }

                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf-8');
                    if (!envContent.includes('PUPPETEER_EXECUTABLE_PATH')) {
                        fs.appendFileSync(envPath, `\n# Chromium path for Puppeteer\nPUPPETEER_EXECUTABLE_PATH=${chromePath}\n`);
                        console.log('✅ Added PUPPETEER_EXECUTABLE_PATH to .env\n');
                        console.log('🚀 You can now start the server with: npm run start\n');
                    } else {
                        console.log('⚠️  PUPPETEER_EXECUTABLE_PATH already exists in .env');
                        console.log('   Please update it manually to:\n');
                        console.log(`   PUPPETEER_EXECUTABLE_PATH=${chromePath}\n`);
                    }
                }

            } else {
                console.error(`❌ Chrome executable not found at: ${chromePath}`);
                console.error('   Please check the extracted files manually.\n');
            }

        } catch (error) {
            console.error('\n❌ Extraction failed:', error.message);
            console.error('\n💡 Manual extraction steps:');
            console.error(`   1. Extract ${ZIP_FILE} to ${CHROMIUM_DIR}`);
            console.error(`   2. Find chrome.exe (Windows) or chrome (Linux/Mac)`);
            console.error(`   3. Add path to .env: PUPPETEER_EXECUTABLE_PATH=<path>\n`);
        }
    });

}).on('error', (error) => {
    fs.unlinkSync(ZIP_FILE);
    console.error('\n❌ Download failed:', error.message);
    console.error('\n💡 Try manual download from:');
    console.error(`   https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html\n`);
    process.exit(1);
});
