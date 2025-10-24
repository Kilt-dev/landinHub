const AWS = require('aws-sdk');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Cấu hình AWS - đồng nhất với pages.js
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3();

class S3CopyService {
    constructor() {
        this.bucket = process.env.AWS_S3_BUCKET;
    }

    /**
     * Copy page images to new marketplace folder
     */
    async copyPageImagesToMarketplace(pageData, marketplacePageId) {
        try {
            if (!pageData || !pageData.elements) {
                return { images: [], imageMap: {} };
            }

            const imageMap = {}; // old URL -> new URL
            const copiedImages = [];

            // Extract all image URLs from page_data
            const imageUrls = this.extractImageUrls(pageData);

            for (const oldUrl of imageUrls) {
                try {
                    const newUrl = await this.copyImageToMarketplace(oldUrl, marketplacePageId);
                    if (newUrl) {
                        imageMap[oldUrl] = newUrl;
                        copiedImages.push(newUrl);
                    }
                } catch (err) {
                    console.error(`Error copying image ${oldUrl}:`, err);
                }
            }

            return { images: copiedImages, imageMap };
        } catch (error) {
            console.error('Copy images error:', error);
            throw error;
        }
    }

    /**
     * Extract all image URLs from page_data
     */
    extractImageUrls(pageData) {
        const urls = new Set();

        const extractFromElement = (element) => {
            // Check for image in componentData
            if (element.type === 'image' && element.componentData?.src) {
                urls.add(element.componentData.src);
            }

            // Check for background image in styles
            if (element.styles?.backgroundImage) {
                const match = element.styles.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1]) {
                    urls.add(match[1]);
                }
            }

            // Recursively check children
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
     * Copy single image to marketplace folder - đồng nhất với pages.js
     */
    async copyImageToMarketplace(imageUrl, marketplacePageId) {
        try {
            // Check if it's S3 URL
            if (!imageUrl.includes('s3.amazonaws.com') && !imageUrl.includes(this.bucket)) {
                return imageUrl; // External URL, don't copy
            }

            // Extract S3 key from URL
            const oldKey = this.extractS3KeyFromUrl(imageUrl);
            if (!oldKey) return imageUrl;

            // Generate new key
            const extension = oldKey.split('.').pop();
            const newKey = `marketplace/${marketplacePageId}/images/${uuidv4()}.${extension}`;
            const region = process.env.AWS_REGION || 'us-east-1';

            // Copy object in S3 with cache control
            await s3.copyObject({
                Bucket: this.bucket,
                CopySource: `${this.bucket}/${oldKey}`,
                Key: newKey,
                ACL: 'public-read',
                CacheControl: 'public, max-age=31536000',
                MetadataDirective: 'REPLACE'
            }).promise();

            console.log(`Image copied successfully: ${oldKey} -> ${newKey}`);

            // Return new URL
            return `https://${this.bucket}.s3.${region}.amazonaws.com/${newKey}`;
        } catch (error) {
            console.error('Copy single image error:', error);
            return imageUrl; // Return original if copy fails
        }
    }

    /**
     * Extract S3 key from URL
     */
    extractS3KeyFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            return pathname.startsWith('/') ? pathname.substring(1) : pathname;
        } catch (error) {
            return null;
        }
    }

    /**
     * Update page_data with new image URLs
     */
    updatePageDataImages(pageData, imageMap) {
        const clonedData = JSON.parse(JSON.stringify(pageData));

        const updateElement = (element) => {
            // Update image src
            if (element.type === 'image' && element.componentData?.src) {
                const oldSrc = element.componentData.src;
                if (imageMap[oldSrc]) {
                    element.componentData.src = imageMap[oldSrc];
                }
            }

            // Update background image
            if (element.styles?.backgroundImage) {
                const match = element.styles.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match && match[1] && imageMap[match[1]]) {
                    element.styles.backgroundImage = `url('${imageMap[match[1]]}')`;
                }
            }

            // Update children
            if (element.children && Array.isArray(element.children)) {
                element.children.forEach(child => updateElement(child));
            }
        };

        if (clonedData.elements && Array.isArray(clonedData.elements)) {
            clonedData.elements.forEach(element => updateElement(element));
        }

        return clonedData;
    }

    /**
     * Upload screenshot to S3 - đồng nhất với pages.js
     */
    async uploadScreenshot(buffer, marketplacePageId) {
        try {
            const key = `marketplace/${marketplacePageId}/screenshot.png`;
            const region = process.env.AWS_REGION || 'us-east-1';

            const params = {
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: 'image/png',
                ACL: 'public-read',
                CacheControl: 'public, max-age=31536000'
            };

            const result = await s3.upload(params).promise();
            console.log(`Screenshot uploaded successfully: ${key}`);

            return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('Upload screenshot error:', error);
            throw error;
        }
    }

    /**
     * Delete marketplace folder
     */
    async deleteMarketplaceFolder(marketplacePageId) {
        try {
            const prefix = `marketplace/${marketplacePageId}/`;

            // List all objects with prefix
            const listedObjects = await s3.listObjectsV2({
                Bucket: this.bucket,
                Prefix: prefix
            }).promise();

            if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
                return;
            }

            // Delete all objects
            const deleteParams = {
                Bucket: this.bucket,
                Delete: {
                    Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
                }
            };

            await s3.deleteObjects(deleteParams).promise();

            // Handle pagination if needed
            if (listedObjects.IsTruncated) {
                await this.deleteMarketplaceFolder(marketplacePageId);
            }
        } catch (error) {
            console.error('Delete marketplace folder error:', error);
            throw error;
        }
    }
}

module.exports = new S3CopyService();