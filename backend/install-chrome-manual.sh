#!/bin/bash
# Manual Chrome installation script for Linux
# This downloads Chrome binary directly

set -e

echo "🔍 Installing Chrome for Puppeteer..."

# Create directory for Chrome
CHROME_DIR="$HOME/.local/chrome"
mkdir -p "$CHROME_DIR"

echo "📥 Downloading Chrome binary..."

# Try different methods to get Chrome
if command -v wget &> /dev/null; then
    # Method 1: Download latest Chrome for Linux
    cd /tmp
    wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O chrome.deb 2>&1 || echo "wget download failed"

    if [ -f chrome.deb ]; then
        echo "📦 Extracting Chrome from .deb package..."
        ar x chrome.deb
        tar xf data.tar.xz

        # Move Chrome to our directory
        if [ -d opt/google/chrome ]; then
            cp -r opt/google/chrome/* "$CHROME_DIR/"
            CHROME_PATH="$CHROME_DIR/chrome"
            echo "✅ Chrome extracted successfully!"
            echo "Chrome path: $CHROME_PATH"

            # Update .env
            cd "$HOME/landing-hub/backend"
            if grep -q "PUPPETEER_EXECUTABLE_PATH" .env 2>/dev/null; then
                sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH|" .env
            else
                echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> .env
            fi

            echo ""
            echo "═══════════════════════════════════════"
            echo "✅ Chrome installed successfully!"
            echo "Path: $CHROME_PATH"
            echo "Updated .env file"
            echo ""
            echo "Next: Run test with: node test-puppeteer.js"
            echo "═══════════════════════════════════════"
            exit 0
        fi
    fi
fi

echo "❌ Failed to download Chrome"
echo ""
echo "Alternative: Use ScreenshotOne API fallback"
echo "Add to .env: SCREENSHOTONE_API_KEY=your_api_key"
exit 1
