#!/bin/bash
# Setup Puppeteer với Chrome trên Production Server (EC2, VPS, etc.)
# Chạy script này trên server production của bạn

set -e

echo "🚀 Setting up Puppeteer with Chrome on Production Server"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS"
    exit 1
fi

echo "Detected OS: $OS"
echo ""

# Install Chrome based on OS
case $OS in
    ubuntu|debian)
        echo "📦 Installing Chrome on Ubuntu/Debian..."
        sudo apt-get update
        sudo apt-get install -y wget gnupg

        # Add Google Chrome repository
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
        sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'

        # Install Chrome
        sudo apt-get update
        sudo apt-get install -y google-chrome-stable

        # Install dependencies for Puppeteer
        sudo apt-get install -y \
            libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
            libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
            libxfixes3 libxrandr2 libgbm1 libasound2

        CHROME_PATH=$(which google-chrome-stable)
        ;;

    centos|rhel|amzn)
        echo "📦 Installing Chrome on CentOS/RHEL/Amazon Linux..."
        sudo yum install -y wget

        # Download and install Chrome
        wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
        sudo yum install -y ./google-chrome-stable_current_x86_64.rpm
        rm -f google-chrome-stable_current_x86_64.rpm

        # Install dependencies
        sudo yum install -y \
            alsa-lib atk cups-libs gtk3 libXcomposite libXcursor \
            libXdamage libXext libXi libXrandr libXScrnSaver \
            libXtst pango xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi \
            xorg-x11-fonts-cyrillic xorg-x11-fonts-misc \
            xorg-x11-fonts-Type1 xorg-x11-utils

        CHROME_PATH=$(which google-chrome-stable)
        ;;

    *)
        echo "❌ Unsupported OS: $OS"
        echo "Please install Chrome manually and set PUPPETEER_EXECUTABLE_PATH"
        exit 1
        ;;
esac

echo ""
echo "✅ Chrome installed at: $CHROME_PATH"

# Navigate to backend directory
cd "$(dirname "$0")"

# Update or create .env file
if [ -f .env ]; then
    echo "📝 Updating .env file..."
    if grep -q "PUPPETEER_EXECUTABLE_PATH" .env; then
        sed -i "s|PUPPETEER_EXECUTABLE_PATH=.*|PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH|" .env
    else
        echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" >> .env
    fi
else
    echo "📝 Creating .env file..."
    echo "PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH" > .env
fi

echo ""
echo "📦 Installing npm packages (skipping Chromium download)..."
PUPPETEER_SKIP_DOWNLOAD=true npm install

echo ""
echo "🧪 Testing Puppeteer..."
node test-puppeteer.js

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ SUCCESS! Puppeteer is ready to use!"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "Chrome path: $CHROME_PATH"
    echo "Configuration saved to .env"
    echo ""
    echo "You can now start your server with: npm start"
else
    echo ""
    echo "❌ Puppeteer test failed"
    echo "Please check the errors above"
fi
