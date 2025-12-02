const puppeteer = require('puppeteer');
const s3CopyService = require('./s3CopyService');

class ScreenshotService {
    /**
     * Generate screenshot from page_data
     */
    async generateScreenshot(pageData, marketplacePageId) {
        let browser = null;

        try {
            // Convert page_data to HTML
            const html = this.pageDataToHTML(pageData);

            // Launch puppeteer
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });

            const page = await browser.newPage();

            // Set viewport
            await page.setViewport({
                width: 1200,
                height: 800,
                deviceScaleFactor: 2
            });

            // Set content
            await page.setContent(html, {
                waitUntil: ['networkidle0', 'load'],
                timeout: 30000
            });

            // Wait a bit for images to load
            await page.waitForTimeout(2000);

            // Get full page height
            const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

            // Take screenshot
            const screenshot = await page.screenshot({
                fullPage: true,
                type: 'png',
                omitBackground: false
            });

            await browser.close();

            // Upload to S3
            const screenshotUrl = await s3CopyService.uploadScreenshot(screenshot, marketplacePageId);

            return screenshotUrl;
        } catch (error) {
            if (browser) {
                await browser.close();
            }
            console.error('Screenshot generation error:', error);
            throw error;
        }
    }

    /**
     * Convert page_data to HTML
     */
    pageDataToHTML(pageData) {
        if (!pageData || !pageData.elements) {
            return '<html><body><h1>Empty Page</h1></body></html>';
        }

        const { canvas = {}, elements = [] } = pageData;
        const backgroundColor = canvas.background || '#ffffff';

        let htmlContent = '';

        // Convert elements to HTML
        elements.forEach(element => {
            htmlContent += this.elementToHTML(element);
        });

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: ${backgroundColor};
            min-height: 100vh;
        }
        .page-container {
            width: 100%;
            max-width: ${canvas.width || 1200}px;
            margin: 0 auto;
            position: relative;
        }
    </style>
</head>
<body>
    <div class="page-container">
        ${htmlContent}
    </div>
</body>
</html>
        `;
    }

    /**
     * Convert single element to HTML
     */
    elementToHTML(element) {
        if (!element.visible && element.visible !== undefined) {
            return '';
        }

        const styles = this.stylesToCSS(element.styles || {});
        const position = element.position?.desktop || {};

        let positionStyles = '';
        if (position.x !== undefined || position.y !== undefined) {
            positionStyles = `position: absolute; left: ${position.x || 0}px; top: ${position.y || 0}px;`;
        }

        const size = element.size || {};
        const sizeStyles = `width: ${size.width || 'auto'}; height: ${size.height || 'auto'};`;

        const allStyles = `${positionStyles} ${sizeStyles} ${styles}`;

        switch (element.type) {
            case 'heading':
                const level = element.componentData?.level || 1;
                return `<h${level} style="${allStyles}">${element.componentData?.text || ''}</h${level}>`;

            case 'paragraph':
                return `<p style="${allStyles}">${element.componentData?.text || ''}</p>`;

            case 'button':
                return `<button style="${allStyles}">${element.componentData?.text || 'Button'}</button>`;

            case 'image':
                const src = element.componentData?.src || '';
                const alt = element.componentData?.alt || '';
                return `<img src="${src}" alt="${alt}" style="${allStyles}" />`;

            case 'section':
                let childrenHTML = '';
                if (element.children && element.children.length > 0) {
                    childrenHTML = element.children.map(child => this.elementToHTML(child)).join('');
                }
                return `<div style="${allStyles}">${childrenHTML}</div>`;

            case 'form':
                return `<form style="${allStyles}">
                    <input type="email" placeholder="Email" style="width: 100%; padding: 10px; margin-bottom: 10px;" />
                    <button type="submit" style="width: 100%; padding: 10px;">Submit</button>
                </form>`;

            default:
                return `<div style="${allStyles}">${element.componentData?.text || ''}</div>`;
        }
    }

    /**
     * Convert styles object to CSS string
     */
    stylesToCSS(styles) {
        return Object.entries(styles)
            .map(([key, value]) => {
                // Convert camelCase to kebab-case
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value};`;
            })
            .join(' ');
    }
}

module.exports = new ScreenshotService();