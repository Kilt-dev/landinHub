const archiver = require('archiver');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

class ExportService {
    constructor() {
        this.tempDir = path.join(__dirname, '../../temp');
        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Export as HTML + Images (ZIP file)
     * @param {Object} marketplacePage - Marketplace page object
     * @param {Object} pageData - Page data (for metadata)
     * @param {String} s3FilePath - S3 path to HTML file (e.g., "s3://bucket/path/index.html")
     */
    async exportAsHTMLZip(marketplacePage, pageData, s3FilePath) {
        const exportId = uuidv4();
        const exportDir = path.join(this.tempDir, exportId);
        const zipPath = path.join(this.tempDir, `${exportId}.zip`);

        try {
            // Create export directory
            fs.mkdirSync(exportDir, { recursive: true });
            fs.mkdirSync(path.join(exportDir, 'images'), { recursive: true });

            // Lấy HTML từ S3
            let htmlContent;
            if (s3FilePath) {
                htmlContent = await this.getHTMLFromS3(s3FilePath);
            } else {
                // Fallback: generate from pageData (legacy)
                console.warn('No S3 path provided, using pageData fallback');
                htmlContent = this.generateHTMLFile(pageData, {});
            }

            // Extract image URLs from HTML
            const imageUrls = this.extractImageUrlsFromHTML(htmlContent);
            const imageMap = {};

            for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                const imageName = `image-${i + 1}${path.extname(url) || '.png'}`;
                const imagePath = path.join(exportDir, 'images', imageName);

                try {
                    await this.downloadImage(url, imagePath);
                    imageMap[url] = `./images/${imageName}`;
                } catch (err) {
                    console.error(`Failed to download image: ${url}`, err);
                }
            }

            // Replace image URLs with local paths
            let finalHTML = htmlContent;
            Object.entries(imageMap).forEach(([oldUrl, newPath]) => {
                finalHTML = finalHTML.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
            });

            fs.writeFileSync(path.join(exportDir, 'index.html'), finalHTML, 'utf8');

            // Create README
            const readme = this.generateReadme(marketplacePage);
            fs.writeFileSync(path.join(exportDir, 'README.md'), readme, 'utf8');

            // Create ZIP
            await this.createZip(exportDir, zipPath);

            // Cleanup export directory
            this.cleanupDirectory(exportDir);

            return zipPath;
        } catch (error) {
            // Cleanup on error
            if (fs.existsSync(exportDir)) {
                this.cleanupDirectory(exportDir);
            }
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }
            throw error;
        }
    }

    /**
     * Export as .iuhpage format (JSON with embedded data)
     * @param {Object} marketplacePage - Marketplace page object
     * @param {Object} pageData - Page data
     * @param {String} s3FilePath - S3 path to HTML file
     */
    async exportAsIUHPage(marketplacePage, pageData, s3FilePath) {
        const exportId = uuidv4();
        const filePath = path.join(this.tempDir, `${exportId}.iuhpage`);

        try {
            // Lấy HTML từ S3
            let htmlContent;
            if (s3FilePath) {
                htmlContent = await this.getHTMLFromS3(s3FilePath);
                // Ensure pageData is embedded in HTML
                htmlContent = this.embedPageDataInHTML(htmlContent, pageData);
            } else {
                // Fallback
                console.warn('No S3 path provided, using pageData fallback');
                htmlContent = this.generateHTMLFileWithEmbeddedData(pageData, {});
            }

            // Extract and download images as base64
            const imageUrls = this.extractImageUrlsFromHTML(htmlContent);
            const embeddedImages = {};

            for (const url of imageUrls) {
                try {
                    const base64 = await this.downloadImageAsBase64(url);
                    embeddedImages[url] = base64;
                } catch (err) {
                    console.error(`Failed to embed image: ${url}`, err);
                }
            }

            // Create .iuhpage structure
            const iuhpageData = {
                version: '1.0',
                format: 'iuhpage',
                metadata: {
                    title: marketplacePage.title,
                    description: marketplacePage.description,
                    category: marketplacePage.category,
                    tags: marketplacePage.tags || [],
                    exportedAt: new Date().toISOString(),
                    originalId: marketplacePage._id
                },
                pageData: pageData,
                htmlContent: htmlContent,  // HTML with embedded pageData
                embeddedImages: embeddedImages
            };

            // Write to file
            fs.writeFileSync(filePath, JSON.stringify(iuhpageData, null, 2), 'utf8');

            return filePath;
        } catch (error) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw error;
        }
    }

    /**
     * Embed pageData into HTML as a script tag
     * @param {string} html - HTML content
     * @param {Object} pageData - Page data to embed
     * @returns {string} HTML with embedded pageData
     */
    embedPageDataInHTML(html, pageData) {
        // Check if pageData is already embedded
        if (html.includes('<script type="application/json" id="lpb-page-data">')) {
            // Replace existing embedded data
            const regex = /<script type="application\/json" id="lpb-page-data">[\s\S]*?<\/script>/;
            const embeddedScript = `<script type="application/json" id="lpb-page-data">\n${JSON.stringify(pageData, null, 2)}\n    </script>`;
            return html.replace(regex, embeddedScript);
        } else {
            // Insert before </body>
            const embeddedScript = `\n    <!-- Embedded PageData for easy import -->\n    <script type="application/json" id="lpb-page-data">\n${JSON.stringify(pageData, null, 2)}\n    </script>\n</body>`;
            return html.replace('</body>', embeddedScript);
        }
    }

    /**
     * Generate HTML file with embedded pageData
     * @param {Object} pageData - Page data
     * @param {Object} imageMap - Image URL mappings
     * @returns {string} HTML content with embedded pageData
     */
    generateHTMLFileWithEmbeddedData(pageData, imageMap = {}) {
        const baseHTML = this.generateHTMLFile(pageData, imageMap);
        return this.embedPageDataInHTML(baseHTML, pageData);
    }

    /**
     * Extract image URLs from page_data
     */
    extractImageUrls(pageData) {
        const urls = new Set();

        const extractFromElement = (element) => {
            if (element.type === 'image' && element.componentData?.src) {
                urls.add(element.componentData.src);
            }

            if (element.styles?.backgroundImage) {
                const match = element.styles.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1]) {
                    urls.add(match[1]);
                }
            }

            if (element.children && Array.isArray(element.children)) {
                element.children.forEach(child => extractFromElement(child));
            }
        };

        if (pageData.elements && Array.isArray(pageData.elements)) {
            pageData.elements.forEach(element => extractFromElement(element));
        }

        return Array.from(urls);
    }

    /**
     * Get HTML from S3
     */
    async getHTMLFromS3(s3FilePath) {
        try {
            // Parse S3 path: s3://bucket/key
            const bucketName = process.env.AWS_S3_BUCKET;
            let s3Key;

            if (s3FilePath.includes('landinghub-iconic')) {
                s3Key = s3FilePath.split('s3://landinghub-iconic/')[1];
            } else {
                s3Key = s3FilePath.split(`s3://${bucketName}/`)[1];
            }

            // Ensure key ends with index.html
            if (!s3Key.endsWith('index.html')) {
                s3Key = `${s3Key}/index.html`;
            }

            console.log(`Fetching HTML from S3: ${s3Key}`);

            const s3Response = await s3.getObject({
                Bucket: bucketName,
                Key: s3Key
            }).promise();

            return s3Response.Body.toString('utf-8');
        } catch (error) {
            console.error('Error fetching HTML from S3:', error);
            throw new Error(`Failed to fetch HTML from S3: ${error.message}`);
        }
    }

    /**
     * Extract image URLs from HTML string
     */
    extractImageUrlsFromHTML(html) {
        const urls = new Set();

        // Match <img src="...">
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            if (match[1] && match[1].startsWith('http')) {
                urls.add(match[1]);
            }
        }

        // Match background-image: url(...)
        const bgRegex = /background-image:\s*url\(['"]?([^'"]+)['"]?\)/gi;
        while ((match = bgRegex.exec(html)) !== null) {
            if (match[1] && match[1].startsWith('http')) {
                urls.add(match[1]);
            }
        }

        return Array.from(urls);
    }

    /**
     * Download image to file
     */
    async downloadImage(url, outputPath) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    /**
     * Download image as base64
     */
    async downloadImageAsBase64(url) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
            timeout: 10000
        });

        const mimeType = response.headers['content-type'] || 'image/png';
        const base64 = Buffer.from(response.data).toString('base64');

        return `data:${mimeType};base64,${base64}`;
    }

    /**
     * Generate HTML file
     */
    generateHTMLFile(pageData, imageMap = {}) {
        const { canvas = {}, elements = [], meta = {} } = pageData;
        const backgroundColor = canvas.background || '#ffffff';

        // Update page_data with local image paths
        const updatedPageData = JSON.parse(JSON.stringify(pageData));
        this.updateImagePaths(updatedPageData, imageMap);

        const html = this.pageDataToHTML(updatedPageData);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${meta.description || ''}">
    <meta name="keywords" content="${(meta.keywords || []).join(', ')}">
    <title>${meta.title || 'Landing Page'}</title>
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
            max-width: ${canvas.width};
            margin: 0 auto;
            position: relative;
        }
        @media (max-width: 768px) {
            .page-container {
                max-width: 100%;
                padding: 0 15px;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        ${html}
    </div>
</body>
</html>`;
    }

    /**
     * Update image paths in page_data
     */
    updateImagePaths(pageData, imageMap) {
        const updateElement = (element) => {
            if (element.type === 'image' && element.componentData?.src) {
                const oldSrc = element.componentData.src;
                if (imageMap[oldSrc]) {
                    element.componentData.src = imageMap[oldSrc];
                }
            }

            if (element.styles?.backgroundImage) {
                const match = element.styles.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1] && imageMap[match[1]]) {
                    element.styles.backgroundImage = `url('${imageMap[match[1]]}')`;
                }
            }

            if (element.children && Array.isArray(element.children)) {
                element.children.forEach(child => updateElement(child));
            }
        };

        if (pageData.elements && Array.isArray(pageData.elements)) {
            pageData.elements.forEach(element => updateElement(element));
        }
    }

    /**
     * Convert page_data to HTML (fallback only - use HTML from S3 instead)
     */
    pageDataToHTML(pageData) {
        if (!pageData || !pageData.elements) {
            return '<h1>Empty Page</h1>';
        }

        // Simple conversion - không perfect như HTML gốc
        return pageData.elements.map(element => this.elementToHTML(element)).join('\n');
    }

    /**
     * Convert element to HTML (simple version for fallback)
     */
    elementToHTML(element) {
        if (!element.visible && element.visible !== undefined) {
            return '';
        }

        const text = element.componentData?.text || '';

        switch (element.type) {
            case 'heading':
                const level = element.componentData?.level || 1;
                return `<h${level}>${text}</h${level}>`;
            case 'paragraph':
                return `<p>${text}</p>`;
            case 'button':
                return `<button>${text}</button>`;
            case 'image':
                const src = element.componentData?.src || '';
                return `<img src="${src}" alt="${element.componentData?.alt || ''}" />`;
            case 'section':
                let childrenHTML = '';
                if (element.children && element.children.length > 0) {
                    childrenHTML = element.children.map(child => this.elementToHTML(child)).join('');
                }
                return `<div>${childrenHTML}</div>`;
            default:
                return `<div>${text}</div>`;
        }
    }

    /**
     * Generate README
     */
    generateReadme(marketplacePage) {
        return `# ${marketplacePage.title}

${marketplacePage.description}

## How to Use

1. Open \`index.html\` in your browser to preview
2. Customize the HTML/CSS as needed
3. Deploy to your hosting service

## Category
${marketplacePage.category}

## Tags
${(marketplacePage.tags || []).join(', ')}

## License
Personal use only. Redistribution prohibited.

---
Purchased from Landing Hub Marketplace
`;
    }

    /**
     * Create ZIP archive
     */
    createZip(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => resolve());
            archive.on('error', (err) => reject(err));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Cleanup directory
     */
    cleanupDirectory(dir) {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(file => {
                const filePath = path.join(dir, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    this.cleanupDirectory(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            });
            fs.rmdirSync(dir);
        }
    }

    /**
     * Cleanup temp file
     */
    cleanupTempFile(filePath) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = new ExportService();