const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');
const Page = require('../models/Page');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');

// Cấu hình AWS SDK
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const route53 = new AWS.Route53();


// Browser pool với giới hạn page
const browserPool = {
    browser: null,
    activePages: 0,
    maxPages: 5
};

// Khởi tạo trình duyệt Puppeteer
const getBrowser = async () => {
    if (!browserPool.browser) {
        console.log('Launching Puppeteer browser');
        try {
            browserPool.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-extensions',
                    '--disable-plugins',
                ],
                timeout: 30000,
            });

            browserPool.browser.on('disconnected', () => {
                console.log('Browser disconnected, clearing pool');
                browserPool.browser = null;
                browserPool.activePages = 0;
            });
        } catch (err) {
            console.error('Failed to launch Puppeteer browser:', err.message);
            throw new Error('Không thể khởi động trình duyệt: ' + err.message);
        }
    }
    return browserPool.browser;
};

// Giải phóng page
const releasePage = async () => {
    browserPool.activePages = Math.max(0, browserPool.activePages - 1);
};

// Hàm chuẩn hóa S3 key từ file_path
const getS3KeyFromFilePath = (file_path, fileName = 'index.html') => {
    if (!file_path) return null;
    const bucketName = process.env.AWS_S3_BUCKET;
    let s3Key;

    if (file_path.includes('landinghub-iconic')) {
        s3Key = file_path.split('s3://landinghub-iconic/')[1];
    } else {
        s3Key = file_path.split(`s3://${bucketName}/`)[1];
    }

    // Đảm bảo s3Key kết thúc bằng fileName (thường là index.html)
    return s3Key.endsWith(fileName) ? s3Key : `${s3Key}/${fileName}`;
};

// Tối ưu hóa tạo screenshot
const generateScreenshot = async (htmlContent, pageId, isUrl = false) => {
    console.log('Generating screenshot for page:', pageId);

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Tăng kích thước viewport để phù hợp với thiết kế responsive
        await page.setViewport({
            width: 1280,
            height: 720,
            deviceScaleFactor: 1
        });

        if (isUrl) {
            await page.goto(htmlContent, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        } else {
            await page.setContent(htmlContent, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        }

        // Chờ thêm để đảm bảo tất cả tài nguyên được tải
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Tối ưu hóa kích thước ảnh chụp
        const screenshot = await page.screenshot({
            type: 'png',
            clip: {
                x: 0,
                y: 0,
                width: 1280,
                height: 720
            }
        });

        const screenshotKey = `screenshots/${pageId}.png`;
        await uploadToS3(screenshotKey, screenshot, 'image/png');

        const screenshotUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${screenshotKey}`;
        console.log('Screenshot generated successfully:', screenshotUrl);
        return screenshotUrl;

    } catch (err) {
        console.error('Screenshot generation failed:', err.message);
        return null;
    } finally {
        await page.close();
        await releasePage();
    }
};

// Tạo screenshot từ nội dung S3
const generateScreenshotFromS3 = async (s3Key, pageId) => {
    try {
        const s3Response = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        }).promise();

        const htmlContent = s3Response.Body.toString('utf-8');
        return await generateScreenshot(htmlContent, pageId, false);
    } catch (err) {
        console.error('Failed to generate screenshot from S3:', err.message);
        return null;
    }
};

// Upload file lên S3
const uploadToS3 = async (key, body, contentType) => {
    console.log(`Uploading to S3: ${key}`);
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000'
        };
        const result = await s3.upload(params).promise();
        console.log(`S3 upload successful: ${key}`);
        return result;
    } catch (err) {
        console.error(`S3 upload failed: ${key}`, err.message);
        throw new Error(`Lỗi khi upload lên S3: ${err.message}`);
    }
};

// Truy xuất nội dung từ S3
const getFromS3 = async (s3Key) => {
    try {
        console.log('Attempting to get S3 object with key:', s3Key);
        const s3Response = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        }).promise();

        return s3Response.Body.toString('utf-8');
    } catch (err) {
        console.error('Failed to get from S3:', s3Key, err.message);
        return null;
    }
};

// Validate HTML
const validateHTML = async (html) => {
    try {
        console.log('Validating HTML');
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.setContent(html);
        const content = await page.content();
        await page.close();
        return { isValid: true };
    } catch (err) {
        console.error('HTML validation failed:', err.message);
        return { isValid: false, error: err.message };
    }
};

/**
 * Lấy nội dung trang để edit
 * GET /api/pages/:id/content
 */

exports.getPageContent = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({
            _id: id,
            user_id: req.user.userId
        });

        if (!page) {
            return res.status(404).json({ error: 'Không tìm thấy page' });
        }

        let htmlContent = null;
        let pageData = null;

        // ========== CASE 1: Có page_data JSON - Ưu tiên trả về ==========
        if (page.page_data) {
            pageData = page.page_data;
            console.log('Returning pageData from database');
        }

        // ========== CASE 2: Lấy HTML từ S3 ==========
        if (page.file_path) {
            const s3Key = getS3KeyFromFilePath(page.file_path);
            console.log('Fetching HTML from S3:', s3Key);
            htmlContent = await getFromS3(s3Key);

            // Nếu không có pageData, try parse từ HTML
            if (!pageData && htmlContent) {
                // Try extract embedded JSON từ <script id="lpb-page-data">
                const pageDataMatch = htmlContent.match(
                    /<script type="application\/json" id="lpb-page-data">\s*([\s\S]*?)\s*<\/script>/
                );

                if (pageDataMatch) {
                    try {
                        pageData = JSON.parse(pageDataMatch[1]);
                        console.log('Extracted pageData from HTML');
                    } catch (e) {
                        console.warn('Failed to parse embedded pageData:', e.message);
                    }
                }
            }
        }

        // ========== CASE 3: Trang trống - Trả về empty structure ==========
        if (!pageData && !htmlContent) {
            console.log('Returning empty structure for page:', id);
            pageData = {
                canvas: {
                    width: 1200,
                    height: 'auto',
                    background: '#ffffff'
                },
                elements: [],
                meta: {
                    title: page.name,
                    description: page.description || ''
                }
            };
        }

        console.log('Successfully retrieved page content:', {
            hasPageData: !!pageData,
            hasHTML: !!htmlContent,
            htmlLength: htmlContent?.length || 0
        });

        return res.json({
            success: true,
            pageData: pageData,
            html: htmlContent || '',
            css: '',
            meta: {
                id: page._id,
                name: page.name,
                status: page.status,
                screenshot_url: page.screenshot_url
            }
        });

    } catch (err) {
        console.error('Lỗi lấy nội dung:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy nội dung landing page: ' + err.message
        });
    }
};

/**
 * Cập nhật trang - LƯU CẢ pageData VÀ HTML
 * PUT /api/pages/:id
 */
exports.updatePage = async (req, res) => {
    console.log('updatePage called with params:', req.params);

    if (!req.user || !req.user.userId) {
        console.error('Authentication error: No userId in req.user');
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;
    const { html, pageData } = req.body;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Validation error: Invalid page ID:', id);
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    if (!html && !pageData) {
        console.error('Validation error: Missing content');
        return res.status(400).json({
            error: 'Yêu cầu HTML hoặc pageData để cập nhật'
        });
    }

    try {
        const page = await Page.findOne({
            _id: id,
            user_id: req.user.userId
        });

        if (!page) {
            console.error('Page not found for id:', id, 'user:', req.user.userId);
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        // ========== VALIDATE HTML NẾU CÓ ==========
        if (html) {
            const validation = await validateHTML(html);
            if (!validation.isValid) {
                console.error('HTML validation failed:', validation.error);
                return res.status(400).json({
                    error: 'Mã HTML không hợp lệ: ' + validation.error
                });
            }
        }

        // ========== XÁC ĐỊNH S3 PATH ==========
        let s3Path;
        if (page.file_path) {
            s3Path = getS3KeyFromFilePath(page.file_path, '');
        } else {
            s3Path = `landinghub/${req.user.userId}/${Date.now()}`;
            page.file_path = `s3://${process.env.AWS_S3_BUCKET}/${s3Path}`;
            console.log('Created new file_path:', page.file_path);
        }

        // ========== UPLOAD HTML LÊN S3 ==========
        if (html) {
            const htmlKey = `${s3Path}/index.html`;
            console.log('Uploading HTML to S3:', htmlKey);
            await uploadToS3(htmlKey, html, 'text/html');
        }

        // ========== LƯU pageData VÀO DATABASE ==========
        if (pageData) {
            page.page_data = pageData;
            console.log('Updated pageData in database');
        }

        // ========== TẠO/UPDATE SCREENSHOT ==========
        let screenshotUrl = page.screenshot_url;
        if (html) {
            try {
                console.log('Generating screenshot for updated HTML...');
                const newScreenshotUrl = await generateScreenshot(html, id, false);
                if (newScreenshotUrl) {
                    screenshotUrl = newScreenshotUrl;
                    console.log('New screenshot URL:', screenshotUrl);
                }
            } catch (err) {
                console.warn('Screenshot generation failed:', err.message);
            }
        }

        page.screenshot_url = screenshotUrl;
        page.updated_at = new Date();
        await page.save();

        console.log('Page updated successfully:', page._id);

        res.json({
            success: true,
            message: 'Cập nhật trang thành công',
            page: {
                id: page._id.toString(),
                name: page.name,
                url: page.url,
                status: page.status,
                screenshot_url: screenshotUrl,
                updated_at: page.updated_at.toISOString()
            }
        });
    } catch (err) {
        console.error('Lỗi chỉnh sửa page:', err.message);
        res.status(500).json({
            error: 'Lỗi khi chỉnh sửa landing page: ' + err.message
        });
    }
};

exports.getPages = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
        }

        let userId;
        try {
            userId = new mongoose.Types.ObjectId(req.user.userId);
        } catch (err) {
            console.error('Invalid userId format:', req.user.userId, err);
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        const pages = await Page.find({ user_id: userId }).sort({ updated_at: -1 });
        const result = pages.map(page => ({
            id: page._id.toString(),
            name: page.name,
            url: page.url,
            status: page.status,
            statusColor: page.status === 'ĐÃ XUẤT BẢN' ? 'green' :
                page.status === 'CHƯA XUẤT BẢN' ? 'gray' :
                    page.status === 'ARCHIVED' ? 'blue' : 'red',
            lastUpdated: page.updated_at ? page.updated_at.toLocaleString('vi-VN') : null,
            views: page.views || 0,
            conversions: page.conversions || 0,
            revenue: page.revenue || '0đ',
            zalo_chatbot_script_id: page.zalo_chatbot_script_id || null,
            file_path: page.file_path || null,
            screenshot_url: page.screenshot_url || null,
            created_at: page.created_at ? page.created_at.toLocaleString('vi-VN') : null,
            updated_at: page.updated_at ? page.updated_at.toLocaleString('vi-VN') : null,
        }));

        res.json(result);
    } catch (err) {
        console.error('Lỗi xem danh sách:', err);
        res.status(500).json({ error: 'Lỗi khi xem danh sách landing page: ' + err.message });
    }
};

exports.getPage = async (req, res) => {
    console.log('getPage called with params:', req.params);

    if (!req.user || !req.user.userId) {
        console.error('Authentication error: No userId in req.user');
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Validation error: Invalid page ID:', id);
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        console.log('Finding page with id:', id, 'and user_id:', req.user.userId);
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            console.error('Page not found for id:', id, 'user:', req.user.userId);
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        let htmlContent = null;
        if (page.file_path) {
            const s3Key = getS3KeyFromFilePath(page.file_path);
            console.log('Constructed S3 key:', s3Key);
            htmlContent = await getFromS3(s3Key);
        }

        res.json({
            success: true,
            page: {
                id: page._id.toString(),
                name: page.name,
                url: page.url,
                description: page.description,
                status: page.status,
                statusColor: page.status === 'ĐÃ XUẤT BẢN' ? 'green' :
                    page.status === 'CHƯA XUẤT BẢN' ? 'gray' :
                        page.status === 'ARCHIVED' ? 'blue' : 'red',
                views: page.views || 0,
                conversions: page.conversions || 0,
                revenue: page.revenue || '0đ',
                zalo_chatbot_script_id: page.zalo_chatbot_script_id || null,
                file_path: page.file_path || null,
                screenshot_url: page.screenshot_url || null,
                created_at: page.created_at ? page.created_at.toISOString() : null,
                updated_at: page.updated_at ? page.updated_at.toISOString() : null,
                html: htmlContent || '',
            }
        });
    } catch (err) {
        console.error('Lỗi lấy page:', err.message);
        res.status(500).json({ error: 'Lỗi khi lấy landing page: ' + err.message });
    }
};

/**
 * Tạo landing page mới - Empty structure
 * POST /api/pages
 */
exports.createPage = async (req, res) => {
    console.log('createPage called with body:', req.body);

    if (!req.user || !req.user.userId) {
        console.error('Authentication error: No userId in req.user');
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { name, url, description, status = 'CHƯA XUẤT BẢN' } = req.body;

    if (!name) {
        console.error('Validation error: Missing name');
        return res.status(400).json({ error: 'Yêu cầu tên trang' });
    }

    try {
        const pageId = uuidv4();
        const timestamp = Date.now();
        const s3Path = `landinghub/${req.user.userId}/${timestamp}`;

        console.log('Creating new page:', { pageId, timestamp, s3Path });

        // ========== EMPTY PAGE DATA STRUCTURE ==========
        const emptyPageData = {
            canvas: {
                width: 1200,
                height: 'auto',
                background: '#ffffff'
            },
            elements: [],
            meta: {
                title: name,
                description: description || '',
                keywords: []
            }
        };

        // ========== TẠO MINIMAL EMPTY HTML ==========
        const emptyHTML = generateEmptyPageHTML(name, pageId, emptyPageData);

        // ========== UPLOAD LÊN S3 ==========
        console.log('Uploading empty HTML to S3:', `${s3Path}/index.html`);
        await uploadToS3(`${s3Path}/index.html`, emptyHTML, 'text/html');

        // ========== KHÔNG TẠO SCREENSHOT CHO EMPTY PAGE ==========
        // Screenshot sẽ được tạo khi user save lần đầu tiên
        const screenshotUrl = null;

        // ========== LƯU VÀO DATABASE ==========
        const currentDate = new Date();
        const page = new Page({
            _id: pageId,
            user_id: req.user.userId,
            name,
            url,
            description,
            status,
            file_path: `s3://${process.env.AWS_S3_BUCKET}/${s3Path}`,
            screenshot_url: screenshotUrl,
            page_data: emptyPageData, // LƯU JSON structure
            created_at: currentDate,
            updated_at: currentDate,
        });

        await page.save();
        console.log('Page created successfully:', page._id);

        res.status(201).json({
            success: true,
            message: 'Tạo trang mới thành công',
            page: {
                id: page._id.toString(),
                name: page.name,
                url: page.url,
                description: page.description,
                status: page.status,
                statusColor: 'gray',
                views: 0,
                conversions: 0,
                revenue: '0đ',
                file_path: page.file_path,
                screenshot_url: screenshotUrl,
                created_at: page.created_at.toISOString(),
                updated_at: page.updated_at.toISOString(),
                editUrl: `/create-landing?id=${pageId}`,
                previewUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}/index.html`
            }
        });
    } catch (err) {
        console.error('Lỗi tạo page:', err.message);
        res.status(500).json({
            error: 'Lỗi khi tạo landing page: ' + err.message
        });
    }
};

/**
 * Generate empty page HTML với embedded pageData
 * @param {string} name - Page name
 * @param {string} pageId - Page ID
 * @param {object} pageData - Empty page data structure
 * @returns {string} - Complete HTML
 */
const generateEmptyPageHTML = (name, pageId, pageData) => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${pageData.meta?.description || ''}">
    <title>${name}</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .lpb-empty-container {
            max-width: 600px;
            padding: 60px 40px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 15px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .lpb-empty-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .lpb-empty-icon svg {
            width: 50px;
            height: 50px;
            color: white;
        }
        
        .lpb-empty-title {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
        }
        
        .lpb-empty-subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .lpb-empty-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .lpb-empty-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        .lpb-empty-footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
        }
        
        .lpb-empty-footer a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        
        .lpb-empty-footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 640px) {
            .lpb-empty-container {
                margin: 20px;
                padding: 40px 24px;
            }
            
            .lpb-empty-title {
                font-size: 24px;
            }
            
            .lpb-empty-subtitle {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="lpb-empty-container">
        <div class="lpb-empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
        </div>
        
        <h1 class="lpb-empty-title">${name}</h1>
        <p class="lpb-empty-subtitle">
            Trang của bạn đã được tạo thành công! 🎉<br>
            Hãy bắt đầu thiết kế để tạo ra landing page tuyệt vời.
        </p>
        
        <a href="/create-landing?id=${pageId}" class="lpb-empty-button">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            Bắt đầu thiết kế
        </a>
        
        <div class="lpb-empty-footer">
            <p>
                Powered by <a href="https://landinghub.vn" target="_blank">LandingHub</a>
            </p>
        </div>
    </div>
    
    <!-- 
        ========================================
        EMBEDDED PAGE DATA (For Editor)
        ========================================
        This JSON structure is used by the editor
        to load and save the page configuration.
        Do not modify manually.
    -->
    <script type="application/json" id="lpb-page-data">
${JSON.stringify(pageData, null, 4)}
    </script>
    
    <!-- 
        Page Metadata
        ID: ${pageId}
        Created: ${new Date().toISOString()}
    -->
</body>
</html>`;
};


exports.autoSave = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { html, css, pageId } = req.body;
    if (!html && !css) {
        return res.status(400).json({ error: 'Không có nội dung để lưu' });
    }

    if (pageId && !pageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const draftKey = `draft_${req.user.userId}_${pageId || 'current'}`;
        const draftContent = {
            html: html || '',
            css: css || '',
            timestamp: new Date(),
            userId: req.user.userId
        };

        const tempPath = path.join(__dirname, '../temp', `${draftKey}.json`);
        await fs.mkdir(path.dirname(tempPath), { recursive: true }).catch(err => {
            console.error('Lỗi tạo thư mục temp:', err);
            throw err;
        });
        await fs.writeFile(tempPath, JSON.stringify(draftContent, null, 2));

        res.json({
            success: true,
            savedAt: new Date().toISOString(),
            message: 'Đã tự động lưu bản nháp'
        });
    } catch (err) {
        console.error('Auto save error:', err);
        res.status(500).json({ error: 'Lỗi khi tự động lưu: ' + err.message });
    }
};

exports.aiRefactor = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { html } = req.body;
    if (!html?.trim()) {
        return res.status(400).json({ error: 'Yêu cầu nội dung HTML để refactor' });
    }

    try {
        const refactorPrompt = `Cải thiện và tối ưu landing page HTML sau đây:

${html}

Yêu cầu refactor:
1. Cải thiện UI/UX design
2. Tối ưu responsive design
3. Thêm animations và micro-interactions
4. Cải thiện performance
5. Modern CSS techniques
6. Accessibility improvements

Trả về JSON format: {"html": "...", "css": "...", "js": "...", "improvements": ["..."]}`;

        const aiResponse = await callDeepSeekAPI(refactorPrompt, 3);
        let refactoredContent;
        try {
            const content = aiResponse.choices[0].message.content.trim();
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || [null, content];
            if (!jsonMatch[1]) throw new Error('Không tìm thấy JSON hợp lệ');
            refactoredContent = JSON.parse(jsonMatch[1]);
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr.message);
            return res.status(400).json({ error: 'AI refactor trả về format không hợp lệ' });
        }

        const { html: newHtml, css: newCss, js: newJs, improvements } = refactoredContent;
        const fullRefactoredContent = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refactored Landing Page</title>
    <style>${newCss || ''}</style>
</head>
<body>
    ${newHtml}
    ${newJs ? `<script>${newJs}</script>` : ''}
</body>
</html>`;

        const validation = await validateHTML(fullRefactoredContent);
        let thumbnailUrl = null;
        if (validation.isValid) {
            const browser = await getBrowser();
            const page = await browser.newPage();
            try {
                await page.setContent(fullRefactoredContent);
                const screenshotFilename = `refactor-${uuidv4()}.png`;
                const screenshotPath = await takeScreenshot(page, screenshotFilename);
                const screenshotBuffer = await fs.readFile(screenshotPath);
                const thumbnailKey = `temp/refactor-${uuidv4()}.png`;
                await uploadToS3(thumbnailKey, screenshotBuffer, 'image/png');
                thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
                await fs.unlink(screenshotPath).catch(err => console.warn('Không thể xóa file tạm:', err.message));
            } finally {
                await page.close();
                await releasePage();
            }
        }

        res.json({
            html: fullRefactoredContent,
            thumbnail: thumbnailUrl,
            improvements: improvements || [],
            isValid: validation.isValid,
            metadata: validation.metadata
        });
    } catch (err) {
        console.error('AI Refactor error:', err);
        res.status(500).json({ error: 'Lỗi khi AI refactor: ' + err.message });
    }
};

exports.savePage = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { html } = req.body;
    if (!html) {
        return res.status(400).json({ error: 'Yêu cầu nội dung HTML' });
    }

    try {
        const validation = await validateHTML(html);
        if (!validation.isValid) {
            return res.status(400).json({ error: 'Mã không hợp lệ: ' + validation.error });
        }

        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(html);
            const screenshotFilename = `screenshot-${uuidv4()}.png`;
            const screenshotPath = await takeScreenshot(page, screenshotFilename);

            const s3Path = `landinghub/${req.user.userId}/${Date.now()}`;
            await uploadToS3(`${s3Path}/index.html`, html, 'text/html');

            const screenshotBuffer = await fs.readFile(screenshotPath);
            await uploadToS3(`${s3Path}/screenshot.png`, screenshotBuffer, 'image/png');
            await fs.unlink(screenshotPath).catch(err => console.warn('Không thể xóa file tạm:', err.message));

            const newPage = new Page({
                _id: uuidv4(),
                user_id: req.user.userId,
                name: 'Landing Page Mới',
                file_path: `s3://${process.env.AWS_S3_BUCKET}/${s3Path}`,
                status: 'CHƯA XUẤT BẢN',
                created_at: new Date(),
                updated_at: new Date(),
            });
            await newPage.save();

            res.json({ success: true, page: newPage });
        } finally {
            await page.close();
            await releasePage();
        }
    } catch (err) {
        console.error('Lỗi lưu page:', err);
        res.status(500).json({ error: 'Lỗi khi lưu landing page: ' + err.message });
    }
};

exports.publishPage = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { id } = req.params;
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            return res.status(404).json({ error: 'Không tìm thấy page' });
        }

        const s3Path = page.file_path.split('s3://')[1];
        if (!s3Path) {
            return res.status(400).json({ error: 'Không tìm thấy đường dẫn S3' });
        }

        const subdomain = `${req.user.userId}-${id}.landinghub.vn`;
        const distribution = await cloudfront
            .createDistribution({
                DistributionConfig: {
                    CallerReference: `${req.user.userId}-${id}-${Date.now()}`,
                    Comment: `Landing page for ${subdomain}`,
                    Origins: {
                        Quantity: 1,
                        Items: [
                            {
                                Id: s3Path,
                                DomainName: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
                                S3OriginConfig: { OriginAccessIdentity: `origin-access-identity/cloudfront/${process.env.AWS_CLOUDFRONT_OAI_ID}` },
                            },
                        ],
                    },
                    DefaultCacheBehavior: {
                        TargetOriginId: s3Path,
                        ViewerProtocolPolicy: 'redirect-to-https',
                        MinTTL: 0,
                        AllowedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
                        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
                        ForwardedValues: { QueryString: false, Cookies: { Forward: 'none' } },
                    },
                    Enabled: true,
                    Aliases: { Quantity: 1, Items: [subdomain] },
                    ViewerCertificate: {
                        ACMCertificateArn: process.env.AWS_ACM_CERT_ARN,
                        SSLSupportMethod: 'sni-only',
                        MinimumProtocolVersion: 'TLSv1.2_2021',
                    },
                },
            })
            .promise();

        await route53
            .changeResourceRecordSets({
                HostedZoneId: process.env.AWS_HOSTED_ZONE_ID,
                ChangeBatch: {
                    Changes: [
                        {
                            Action: 'CREATE',
                            ResourceRecordSet: {
                                Name: subdomain,
                                Type: 'A',
                                AliasTarget: {
                                    HostedZoneId: 'Z2FDTNDATAQYW2',
                                    DNSName: distribution.Distribution.DomainName,
                                    EvaluateTargetHealth: false,
                                },
                            },
                        },
                    ],
                },
            })
            .promise();

        page.status = 'ĐÃ XUẤT BẢN';
        page.url = `https://${subdomain}`;
        page.cloudfrontDomain = distribution.Distribution.DomainName;
        page.updated_at = new Date();
        await page.save();

        res.json({ success: true, page });
    } catch (err) {
        console.error('Lỗi triển khai:', err);
        res.status(500).json({ error: 'Lỗi khi triển khai landing page: ' + err.message });
    }
};

exports.deletePage = async (req, res) => {
    console.log('deletePage called with params:', req.params);

    if (!req.user || !req.user.userId) {
        console.error('Authentication error: No userId in req.user');
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Validation error: Invalid page ID:', id);
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            console.error('Page not found for id:', id, 'user:', req.user.userId);
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        if (page.file_path) {
            const s3Key = getS3KeyFromFilePath(page.file_path);
            console.log('Deleting from S3:', s3Key);
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: s3Key,
                }).promise();
                console.log('S3 delete successful:', s3Key);
            } catch (err) {
                console.error('S3 delete failed:', s3Key, err.message);
            }
        }

        await page.deleteOne();
        console.log('Page deleted successfully:', id);

        res.json({ success: true });
    } catch (err) {
        console.error('Lỗi xóa page:', err.message);
        res.status(500).json({ error: 'Lỗi khi xóa landing page: ' + err.message });
    }
};

exports.regenerateScreenshot = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    const { id } = req.params;
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            return res.status(404).json({ error: 'Không tìm thấy page' });
        }

        if (!page.file_path) {
            return res.status(400).json({ error: 'Page chưa có HTML content' });
        }

        const s3Key = getS3KeyFromFilePath(page.file_path);
        const screenshotUrl = await generateScreenshotFromS3(s3Key, id);

        if (screenshotUrl) {
            page.screenshot_url = screenshotUrl;
            page.updated_at = new Date();
            await page.save();

            res.json({
                success: true,
                screenshot_url: screenshotUrl,
                message: 'Screenshot đã được tạo lại thành công'
            });
        } else {
            res.status(500).json({ error: 'Không thể tạo screenshot' });
        }
    } catch (err) {
        console.error('Lỗi tạo lại screenshot:', err);
        res.status(500).json({ error: 'Lỗi khi tạo lại screenshot: ' + err.message });
    }
};

exports.debugS3 = async (req, res) => {
    try {
        console.log('Listing S3 objects with prefix: landinghub/');

        const listParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Prefix: 'landinghub/',
            MaxKeys: 10
        };

        const listResult = await s3.listObjectsV2(listParams).promise();

        console.log('S3 Objects found:', listResult.Contents?.length || 0);
        console.log('Objects:', listResult.Contents?.map(obj => obj.Key) || []);

        res.json({
            bucket: process.env.AWS_S3_BUCKET,
            region: process.env.AWS_REGION,
            objectCount: listResult.Contents?.length || 0,
            objects: listResult.Contents?.map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified
            })) || []
        });

    } catch (error) {
        console.error('S3 Debug Error:', error.code, error.message);
        res.status(500).json({ error: error.message, code: error.code });
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    if (browserPool.browser) {
        await browserPool.browser.close().catch(err => console.error('Lỗi khi đóng browser:', err));
    }
    process.exit(0);
});

// Hàm gọi DeepSeek API
const callDeepSeekAPI = async (prompt, retries = 3) => {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY environment variable is missing');
    }
    for (let i = 0; i < retries; i++) {
        try {
            return await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 4000
            });
        } catch (err) {
            console.error(`DeepSeek API attempt ${i + 1} failed:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};
exports.regenerateScreenshots = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.' });
    }

    try {
        const pages = await Page.findPagesNeedingScreenshots().where({ user_id: req.user.userId });
        if (!pages.length) {
            return res.json({ success: true, message: 'Không có trang nào cần tạo lại ảnh chụp' });
        }

        const results = [];
        for (const page of pages) {
            try {
                if (!page.file_path) {
                    results.push({ pageId: page._id, error: 'Page chưa có HTML content' });
                    continue;
                }

                const s3Key = getS3KeyFromFilePath(page.file_path);
                const screenshotUrl = await generateScreenshotFromS3(s3Key, page._id);

                if (screenshotUrl) {
                    page.screenshot_url = screenshotUrl;
                    page.updated_at = new Date();
                    await page.save();
                    results.push({ pageId: page._id, screenshot_url: screenshotUrl });
                } else {
                    results.push({ pageId: page._id, error: 'Không thể tạo screenshot' });
                }
            } catch (err) {
                console.error(`Error regenerating screenshot for page ${page._id}:`, err.message);
                results.push({ pageId: page._id, error: err.message });
            }
        }

        res.json({
            success: true,
            message: 'Hoàn tất tạo lại ảnh chụp màn hình',
            results
        });
    } catch (err) {
        console.error('Lỗi tạo lại screenshots:', err);
        res.status(500).json({ error: 'Lỗi khi tạo lại screenshots: ' + err.message });
    }
};
