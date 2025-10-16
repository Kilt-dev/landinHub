const Template = require('../models/templateSchema');
const Page = require('../models/Page');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');

// Cấu hình AWS
AWS.config.update({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const s3 = new AWS.S3();

// Browser pool cho template screenshots
const browserPool = {
    browser: null,
    activePages: 0,
    maxPages: 5
};

// Khởi tạo browser
const getBrowser = async () => {
    if (!browserPool.browser) {
        console.log('Launching Puppeteer browser for templates');
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

const releasePage = async () => {
    browserPool.activePages = Math.max(0, browserPool.activePages - 1);
};

// Helper functions từ pageController
const getS3KeyFromFilePath = (file_path, fileName = 'index.html') => {
    if (!file_path) return null;
    const bucketName = process.env.AWS_S3_BUCKET;
    let s3Key;

    if (file_path.includes('landinghub-iconic')) {
        s3Key = file_path.split('s3://landinghub-iconic/')[1];
    } else {
        s3Key = file_path.split(`s3://${bucketName}/`)[1];
    }

    return s3Key.endsWith(fileName) ? s3Key : `${s3Key}/${fileName}`;
};

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

/**
 * Generate FULL PAGE screenshot (dài như A4) cho template
 * Sử dụng Puppeteer để capture toàn bộ chiều dài trang
 */
const generateTemplateScreenshot = async (htmlContent, templateId, isUrl = false) => {
    console.log('🖼️ Generating FULL PAGE screenshot for template:', templateId);

    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport rộng để capture full width
        await page.setViewport({
            width: 1280,
            height: 1024,
            deviceScaleFactor: 1
        });

        if (isUrl) {
            await page.goto(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
        } else {
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
        }

        // Chờ thêm để đảm bảo mọi thứ render xong
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get full page dimensions
        const bodyHandle = await page.$('body');
        const boundingBox = await bodyHandle.boundingBox();
        await bodyHandle.dispose();

        console.log('📏 Page dimensions:', {
            width: boundingBox.width,
            height: boundingBox.height
        });

        // Capture FULL PAGE screenshot (giống như chụp cả trang A4 dài)
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true, // ⭐ QUAN TRỌNG: Capture toàn bộ trang
            encoding: 'binary'
        });

        // Upload lên S3
        const screenshotKey = `templates/screenshots/${templateId}.png`;
        await uploadToS3(screenshotKey, screenshot, 'image/png');

        const screenshotUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${screenshotKey}`;
        console.log('✅ Full page screenshot generated:', screenshotUrl);
        return screenshotUrl;

    } catch (err) {
        console.error('❌ Screenshot generation failed:', err.message);
        return null;
    } finally {
        await page.close();
        await releasePage();
    }
};

/**
 * Extract pageData từ HTML
 * Parse embedded JSON hoặc parse DOM structure
 */
const extractPageDataFromHTML = (html, templateName, templateDescription) => {
    try {
        // TRY 1: Extract embedded pageData từ <script id="lpb-page-data">
        const pageDataMatch = html.match(
            /<script type="application\/json" id="lpb-page-data">\s*([\s\S]*?)\s*<\/script>/
        );

        if (pageDataMatch && pageDataMatch[1]) {
            try {
                const pageData = JSON.parse(pageDataMatch[1]);
                console.log('✅ Extracted embedded pageData from template HTML');

                // Validate structure
                if (pageData.canvas && Array.isArray(pageData.elements)) {
                    return {
                        canvas: {
                            width: pageData.canvas.width || 1200,
                            height: pageData.canvas.height || 'auto',
                            background: pageData.canvas.background || '#ffffff'
                        },
                        elements: pageData.elements || [],
                        meta: {
                            title: templateName,
                            description: templateDescription || pageData.meta?.description || '',
                            keywords: pageData.meta?.keywords || []
                        }
                    };
                }
            } catch (parseError) {
                console.warn('Failed to parse embedded pageData:', parseError.message);
            }
        }

        // TRY 2: Fallback - Parse cơ bản từ HTML structure
        console.log('⚠️ No embedded pageData found, creating basic structure');
        return {
            canvas: {
                width: 1200,
                height: 'auto',
                background: '#ffffff'
            },
            elements: [{
                id: `section-${Date.now()}`,
                type: 'section',
                position: {
                    desktop: { x: 0, y: 0 },
                    tablet: { x: 0, y: 0 },
                    mobile: { x: 0, y: 0 }
                },
                size: { width: 1200, height: 600 },
                styles: {
                    background: '#ffffff',
                    padding: '40px'
                },
                children: [],
                visible: true,
                locked: false
            }],
            meta: {
                title: templateName,
                description: templateDescription || '',
                keywords: []
            }
        };

    } catch (error) {
        console.error('Error extracting pageData from HTML:', error);
        return null;
    }
};

// ========== LẤY DANH SÁCH TEMPLATES (CÔNG KHAI) ==========
exports.getTemplates = async (req, res) => {
    try {
        const { category, is_premium, is_featured } = req.query;

        const query = { status: 'ACTIVE' };
        if (category) query.category = category;
        if (is_premium !== undefined) query.is_premium = is_premium === 'true';
        if (is_featured !== undefined) query.is_featured = is_featured === 'true';

        const templates = await Template.find(query)
            .sort({ usage_count: -1, created_at: -1 });

        const result = templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            description: template.description,
            category: template.category,
            thumbnail_url: template.thumbnail_url || template.screenshot_url,
            price: template.price,
            formatted_price: template.formatted_price,
            usage_count: template.usage_count,
            is_premium: template.is_premium,
            is_featured: template.is_featured,
            tags: template.tags || [],
            created_at: template.created_at ? template.created_at.toLocaleString('vi-VN') : null,
            updated_at: template.updated_at ? template.updated_at.toLocaleString('vi-VN') : null,
        }));

        res.json({
            success: true,
            count: result.length,
            templates: result
        });
    } catch (err) {
        console.error('Lỗi lấy danh sách template:', err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách template: ' + err.message });
    }
};

// ========== XEM TRƯỚC TEMPLATE (CÔNG KHAI) ==========
exports.previewTemplate = async (req, res) => {
    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'templateId không hợp lệ' });
    }

    try {
        const template = await Template.findOne({ _id: id, status: 'ACTIVE' });

        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy template' });
        }

        let htmlContent = null;
        let pageData = template.page_data; // ⭐ Ưu tiên lấy từ DB

        // Nếu không có pageData trong DB, lấy từ S3
        if (!pageData && template.file_path) {
            const s3Key = getS3KeyFromFilePath(template.file_path);
            console.log('Fetching template HTML from S3:', s3Key);
            htmlContent = await getFromS3(s3Key);

            if (htmlContent) {
                pageData = extractPageDataFromHTML(htmlContent, template.name, template.description);
            }
        } else if (template.file_path) {
            // Lấy HTML để preview
            const s3Key = getS3KeyFromFilePath(template.file_path);
            htmlContent = await getFromS3(s3Key);
        }

        // Fallback structure
        if (!pageData && !htmlContent) {
            pageData = {
                canvas: { width: 1200, height: 'auto', background: '#ffffff' },
                elements: [],
                meta: { title: template.name, description: template.description || '' }
            };
        }

        console.log('Template preview:', {
            hasPageData: !!pageData,
            hasHTML: !!htmlContent,
            elementsCount: pageData?.elements?.length || 0
        });

        return res.json({
            success: true,
            template: {
                id: template._id,
                name: template.name,
                description: template.description,
                category: template.category,
                price: template.price,
                thumbnail_url: template.thumbnail_url || template.screenshot_url,
                usage_count: template.usage_count,
                is_premium: template.is_premium,
                tags: template.tags
            },
            pageData: pageData,
            html: htmlContent || '',
            css: ''
        });

    } catch (err) {
        console.error('Lỗi xem trước template:', err);
        res.status(500).json({
            error: 'Lỗi khi xem trước template: ' + err.message
        });
    }
};

// ========== SỬ DỤNG TEMPLATE ĐỂ TẠO PAGE ==========
exports.useTemplate = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;
    const { name: customName, description: customDescription } = req.body;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'templateId không hợp lệ' });
    }

    try {
        const template = await Template.findOne({ _id: id, status: 'ACTIVE' });
        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy template' });
        }

        if (template.price > 0) {
            console.log(`Template ${id} có giá ${template.price}. Giả định đã mua.`);
        }

        // ========== LẤY pageData VÀ HTML TỪ TEMPLATE ==========
        let pageData = template.page_data; // ⭐ Ưu tiên từ DB
        let htmlContent = null;

        const templateS3Key = getS3KeyFromFilePath(template.file_path);
        htmlContent = await getFromS3(templateS3Key);

        if (!htmlContent) {
            return res.status(500).json({
                error: 'Không thể lấy nội dung template từ S3'
            });
        }

        console.log('📄 Template HTML loaded, length:', htmlContent.length);

        // Nếu không có pageData trong DB, extract từ HTML
        if (!pageData) {
            pageData = extractPageDataFromHTML(htmlContent, template.name, template.description);
        }

        if (!pageData) {
            console.error('❌ Failed to extract pageData from template');
            return res.status(500).json({
                error: 'Không thể parse cấu trúc template'
            });
        }

        // ========== UPDATE METADATA TRONG pageData ==========
        const pageName = customName || template.name;
        const pageDesc = customDescription || template.description;

        pageData = {
            ...pageData,
            meta: {
                ...pageData.meta,
                title: pageName,
                description: pageDesc
            }
        };

        console.log('✅ PageData ready:', {
            elementsCount: pageData.elements?.length || 0,
            canvasWidth: pageData.canvas?.width,
            metaTitle: pageData.meta?.title
        });

        // ========== TẠO PAGE MỚI ==========
        const pageId = uuidv4();
        const timestamp = Date.now();
        const s3Path = `landinghub/${req.user.userId}/${timestamp}`;

        // Thay thế template ID bằng page ID mới trong HTML
        htmlContent = htmlContent.replace(new RegExp(template._id, 'g'), pageId);

        // Cập nhật metadata trong HTML
        htmlContent = htmlContent.replace(
            /<title>.*?<\/title>/,
            `<title>${pageName}</title>`
        );
        htmlContent = htmlContent.replace(
            /<meta name="description" content=".*?">/,
            `<meta name="description" content="${pageDesc}">`
        );

        // Update embedded pageData trong HTML (nếu có)
        if (htmlContent.includes('id="lpb-page-data"')) {
            const updatedPageDataStr = JSON.stringify(pageData, null, 4);
            htmlContent = htmlContent.replace(
                /<script type="application\/json" id="lpb-page-data">\s*[\s\S]*?\s*<\/script>/,
                `<script type="application/json" id="lpb-page-data">\n${updatedPageDataStr}\n    </script>`
            );
        }

        // ========== UPLOAD HTML LÊN S3 ==========
        await uploadToS3(`${s3Path}/index.html`, htmlContent, 'text/html');
        console.log('✅ Uploaded page HTML to S3:', `${s3Path}/index.html`);

        // ========== COPY SCREENSHOT TỪ TEMPLATE ==========
        let screenshotUrl = template.thumbnail_url || template.screenshot_url;

        // ========== LƯU VÀO DATABASE ==========
        const currentDate = new Date();
        const page = new Page({
            _id: pageId,
            user_id: req.user.userId,
            name: pageName,
            url: null,
            description: pageDesc,
            status: 'CHƯA XUẤT BẢN',
            file_path: `s3://${process.env.AWS_S3_BUCKET}/${s3Path}`,
            screenshot_url: screenshotUrl,
            page_data: pageData, // ⭐ QUAN TRỌNG: LƯU pageData VÀO DB
            meta_title: pageName,
            meta_description: pageDesc,
            created_at: currentDate,
            updated_at: currentDate,
        });

        await page.save();

        // ========== INCREMENT USAGE COUNT ==========
        await template.incrementUsage();

        console.log('✅ Page created from template:', {
            pageId: page._id,
            templateId: template._id,
            elementsCount: pageData.elements?.length || 0,
            hasPageData: !!page.page_data
        });

        res.status(201).json({
            success: true,
            message: 'Tạo landing page từ template thành công',
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
                editUrl: `/create-landing?id=${pageId}`, // ⭐ ĐÚNG ROUTE
                previewUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}/index.html`
            }
        });
    } catch (err) {
        console.error('Lỗi sử dụng template:', err);
        res.status(500).json({
            error: 'Lỗi khi sử dụng template: ' + err.message
        });
    }
};

// ========== ADMIN: TẠO PRE-SIGNED URL ==========
exports.getPresignedUrl = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được upload template' });
    }

    try {
        const templateId = uuidv4();
        const s3Path = `templates/${templateId}/index.html`;

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Path,
            Expires: 300,
            ContentType: 'text/html',
        };

        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

        res.json({
            success: true,
            templateId,
            uploadUrl,
            s3Path: `s3://${process.env.AWS_S3_BUCKET}/${s3Path}`,
        });
    } catch (err) {
        console.error('Lỗi tạo pre-signed URL:', err);
        res.status(500).json({
            error: 'Lỗi khi tạo pre-signed URL: ' + err.message
        });
    }
};

// ========== ADMIN: LƯU METADATA TEMPLATE ==========
exports.saveTemplateMetadata = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được lưu template' });
    }

    const {
        templateId,
        name,
        description,
        category,
        price = 0,
        s3Path,
        thumbnail_url,
        tags = [],
        is_premium = false,
        is_featured = false
    } = req.body;

    if (!templateId || !name || !s3Path) {
        return res.status(400).json({
            error: 'Yêu cầu templateId, name và s3Path'
        });
    }

    try {
        const s3Key = getS3KeyFromFilePath(s3Path);
        const htmlContent = await getFromS3(s3Key);

        if (!htmlContent) {
            return res.status(400).json({
                error: 'Không thể lấy nội dung HTML từ S3'
            });
        }

        // ========== EXTRACT pageData TỪ HTML ==========
        const pageData = extractPageDataFromHTML(htmlContent, name, description);

        if (!pageData) {
            return res.status(500).json({
                error: 'Không thể extract pageData từ template HTML'
            });
        }

        // ========== TẠO SCREENSHOT FULL PAGE ==========
        console.log('🖼️ Generating full page screenshot for template...');
        let generatedScreenshot = null;
        try {
            generatedScreenshot = await generateTemplateScreenshot(htmlContent, templateId, false);
        } catch (err) {
            console.warn('⚠️ Screenshot generation failed:', err.message);
        }

        const finalThumbnail = generatedScreenshot || thumbnail_url || null;

        // ========== LƯU TEMPLATE ==========
        const template = new Template({
            _id: templateId,
            name,
            description,
            category: category || 'Thương mại điện tử',
            file_path: s3Path,
            thumbnail_url: finalThumbnail,
            screenshot_url: generatedScreenshot,
            page_data: pageData, // ⭐ LƯU pageData
            price,
            tags: Array.isArray(tags) ? tags : [],
            is_premium,
            is_featured,
            status: 'ACTIVE',
            usage_count: 0,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await template.save();
        console.log('✅ Template saved successfully:', template._id);

        res.status(201).json({
            success: true,
            message: 'Lưu template thành công',
            template: {
                id: template._id.toString(),
                name,
                description,
                category,
                file_path: template.file_path,
                thumbnail_url: template.thumbnail_url,
                screenshot_url: template.screenshot_url,
                price,
                tags: template.tags,
                is_premium,
                is_featured,
                hasPageData: !!template.page_data,
                elementsCount: template.page_data?.elements?.length || 0,
                created_at: template.created_at.toISOString(),
                updated_at: template.updated_at.toISOString(),
            },
        });
    } catch (err) {
        console.error('Lỗi lưu metadata template:', err);
        res.status(500).json({
            error: 'Lỗi khi lưu template: ' + err.message
        });
    }
};

// ========== ADMIN: CẬP NHẬT TEMPLATE ==========
exports.updateTemplate = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được cập nhật template' });
    }

    const { id } = req.params;
    const {
        name,
        description,
        category,
        price,
        thumbnail_url,
        tags,
        is_premium,
        is_featured,
        status
    } = req.body;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'templateId không hợp lệ' });
    }

    try {
        const template = await Template.findOne({ _id: id });
        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy template' });
        }

        // Update fields
        if (name) template.name = name;
        if (description !== undefined) template.description = description;
        if (category) template.category = category;
        if (price !== undefined) template.price = price;
        if (thumbnail_url !== undefined) template.thumbnail_url = thumbnail_url;
        if (tags !== undefined) template.tags = tags;
        if (is_premium !== undefined) template.is_premium = is_premium;
        if (is_featured !== undefined) template.is_featured = is_featured;
        if (status) template.status = status;

        template.updated_at = new Date();
        await template.save();

        res.json({
            success: true,
            message: 'Cập nhật template thành công',
            template: {
                id: template._id.toString(),
                name: template.name,
                description: template.description,
                category: template.category,
                price: template.price,
                thumbnail_url: template.thumbnail_url,
                tags: template.tags,
                is_premium: template.is_premium,
                is_featured: template.is_featured,
                status: template.status,
                updated_at: template.updated_at.toISOString()
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật template:', err);
        res.status(500).json({
            error: 'Lỗi khi cập nhật template: ' + err.message
        });
    }
};

// ========== ADMIN: TẠO LẠI SCREENSHOT CHO TEMPLATE ==========
exports.regenerateTemplateScreenshot = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được tạo lại screenshot' });
    }

    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'templateId không hợp lệ' });
    }

    try {
        const template = await Template.findOne({ _id: id });
        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy template' });
        }

        if (!template.file_path) {
            return res.status(400).json({ error: 'Template chưa có HTML content' });
        }

        const s3Key = getS3KeyFromFilePath(template.file_path);
        const htmlContent = await getFromS3(s3Key);

        if (!htmlContent) {
            return res.status(400).json({ error: 'Không thể lấy HTML từ S3' });
        }

        console.log('🖼️ Regenerating full page screenshot for template:', id);
        const screenshotUrl = await generateTemplateScreenshot(htmlContent, id, false);

        if (screenshotUrl) {
            template.screenshot_url = screenshotUrl;
            template.thumbnail_url = screenshotUrl; // Update thumbnail cũng
            template.updated_at = new Date();
            await template.save();

            res.json({
                success: true,
                screenshot_url: screenshotUrl,
                message: 'Screenshot đã được tạo lại thành công (full page)'
            });
        } else {
            res.status(500).json({ error: 'Không thể tạo screenshot' });
        }
    } catch (err) {
        console.error('Lỗi tạo lại screenshot template:', err);
        res.status(500).json({
            error: 'Lỗi khi tạo lại screenshot: ' + err.message
        });
    }
};

// ========== ADMIN: BATCH REGENERATE SCREENSHOTS CHO TẤT CẢ TEMPLATES ==========
exports.batchRegenerateScreenshots = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được tạo lại screenshots' });
    }

    try {
        const templates = await Template.find({
            status: 'ACTIVE',
            file_path: { $exists: true, $ne: null }
        });

        if (!templates.length) {
            return res.json({
                success: true,
                message: 'Không có template nào cần tạo lại screenshot'
            });
        }

        console.log(`🖼️ Starting batch screenshot generation for ${templates.length} templates`);

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const template of templates) {
            try {
                const s3Key = getS3KeyFromFilePath(template.file_path);
                const htmlContent = await getFromS3(s3Key);

                if (!htmlContent) {
                    results.push({
                        templateId: template._id,
                        name: template.name,
                        status: 'failed',
                        error: 'Không thể lấy HTML từ S3'
                    });
                    failCount++;
                    continue;
                }

                console.log(`📸 Processing template: ${template.name}`);
                const screenshotUrl = await generateTemplateScreenshot(htmlContent, template._id, false);

                if (screenshotUrl) {
                    template.screenshot_url = screenshotUrl;
                    template.thumbnail_url = screenshotUrl;
                    template.updated_at = new Date();
                    await template.save();

                    results.push({
                        templateId: template._id,
                        name: template.name,
                        status: 'success',
                        screenshot_url: screenshotUrl
                    });
                    successCount++;
                } else {
                    results.push({
                        templateId: template._id,
                        name: template.name,
                        status: 'failed',
                        error: 'Không thể tạo screenshot'
                    });
                    failCount++;
                }

                // Delay nhỏ giữa các template để tránh overload
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {
                console.error(`Error processing template ${template._id}:`, err.message);
                results.push({
                    templateId: template._id,
                    name: template.name,
                    status: 'failed',
                    error: err.message
                });
                failCount++;
            }
        }

        res.json({
            success: true,
            message: `Hoàn tất tạo lại screenshots: ${successCount} thành công, ${failCount} thất bại`,
            total: templates.length,
            successCount,
            failCount,
            results
        });
    } catch (err) {
        console.error('Lỗi batch regenerate screenshots:', err);
        res.status(500).json({
            error: 'Lỗi khi tạo lại screenshots: ' + err.message
        });
    }
};

// ========== ADMIN: XÓA TEMPLATE ==========
exports.deleteTemplate = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được xóa template' });
    }

    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'templateId không hợp lệ' });
    }

    try {
        const template = await Template.findOne({ _id: id });
        if (!template) {
            return res.status(404).json({ error: 'Không tìm thấy template' });
        }

        // Xóa HTML file từ S3
        if (template.file_path) {
            const s3Key = getS3KeyFromFilePath(template.file_path);
            console.log('Deleting template from S3:', s3Key);
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: s3Key,
                }).promise();
                console.log('✅ S3 HTML delete successful:', s3Key);
            } catch (err) {
                console.error('❌ S3 HTML delete failed:', s3Key, err.message);
            }
        }

        // Xóa thumbnail từ S3
        if (template.thumbnail_url && template.thumbnail_url.includes('amazonaws.com')) {
            const thumbnailKey = template.thumbnail_url.split('.com/')[1];
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: thumbnailKey,
                }).promise();
                console.log('✅ Thumbnail deleted:', thumbnailKey);
            } catch (err) {
                console.warn('⚠️ Failed to delete thumbnail:', err.message);
            }
        }

        // Xóa screenshot từ S3
        if (template.screenshot_url && template.screenshot_url.includes('amazonaws.com')) {
            const screenshotKey = template.screenshot_url.split('.com/')[1];
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: screenshotKey,
                }).promise();
                console.log('✅ Screenshot deleted:', screenshotKey);
            } catch (err) {
                console.warn('⚠️ Failed to delete screenshot:', err.message);
            }
        }

        await template.deleteOne();
        console.log('✅ Template deleted successfully:', id);

        res.json({
            success: true,
            message: 'Xóa template thành công'
        });
    } catch (err) {
        console.error('Lỗi xóa template:', err);
        res.status(500).json({
            error: 'Lỗi khi xóa template: ' + err.message
        });
    }
};

// ========== LẤY TEMPLATES THEO CATEGORY ==========
exports.getTemplatesByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const templates = await Template.findByCategory(category);

        const result = templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            description: template.description,
            category: template.category,
            thumbnail_url: template.thumbnail_url || template.screenshot_url,
            price: template.price,
            formatted_price: template.formatted_price,
            usage_count: template.usage_count,
            is_premium: template.is_premium,
            is_featured: template.is_featured,
            tags: template.tags || [],
            created_at: template.created_at ? template.created_at.toLocaleString('vi-VN') : null,
        }));

        res.json({
            success: true,
            category,
            count: result.length,
            templates: result
        });
    } catch (err) {
        console.error('Lỗi lấy templates theo category:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy templates: ' + err.message
        });
    }
};

// ========== LẤY FEATURED TEMPLATES ==========
exports.getFeaturedTemplates = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const templates = await Template.findFeaturedTemplates(limit);

        const result = templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            description: template.description,
            category: template.category,
            thumbnail_url: template.thumbnail_url || template.screenshot_url,
            price: template.price,
            formatted_price: template.formatted_price,
            usage_count: template.usage_count,
            is_premium: template.is_premium,
            is_featured: template.is_featured,
            tags: template.tags || [],
            created_at: template.created_at ? template.created_at.toLocaleString('vi-VN') : null,
        }));

        res.json({
            success: true,
            count: result.length,
            templates: result
        });
    } catch (err) {
        console.error('Lỗi lấy featured templates:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy featured templates: ' + err.message
        });
    }
};

// ========== SEARCH TEMPLATES ==========
exports.searchTemplates = async (req, res) => {
    try {
        const { q, category, min_price, max_price, tags } = req.query;

        const query = { status: 'ACTIVE' };

        // Text search
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range filter
        if (min_price !== undefined || max_price !== undefined) {
            query.price = {};
            if (min_price !== undefined) query.price.$gte = parseFloat(min_price);
            if (max_price !== undefined) query.price.$lte = parseFloat(max_price);
        }

        // Tags filter
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            query.tags = { $in: tagArray };
        }

        const templates = await Template.find(query)
            .sort({ usage_count: -1, created_at: -1 })
            .limit(50);

        const result = templates.map(template => ({
            id: template._id.toString(),
            name: template.name,
            description: template.description,
            category: template.category,
            thumbnail_url: template.thumbnail_url || template.screenshot_url,
            price: template.price,
            formatted_price: template.formatted_price,
            usage_count: template.usage_count,
            is_premium: template.is_premium,
            is_featured: template.is_featured,
            tags: template.tags || [],
            created_at: template.created_at ? template.created_at.toLocaleString('vi-VN') : null,
        }));

        res.json({
            success: true,
            query: { q, category, min_price, max_price, tags },
            count: result.length,
            templates: result
        });
    } catch (err) {
        console.error('Lỗi search templates:', err);
        res.status(500).json({
            error: 'Lỗi khi search templates: ' + err.message
        });
    }
};

// ========== GET TEMPLATE STATS (ADMIN) ==========
exports.getTemplateStats = async (req, res) => {
    if (!req.user || !req.user.userId || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ admin mới được xem thống kê' });
    }

    try {
        const totalTemplates = await Template.countDocuments({ status: 'ACTIVE' });
        const premiumTemplates = await Template.countDocuments({ status: 'ACTIVE', is_premium: true });
        const freeTemplates = await Template.countDocuments({ status: 'ACTIVE', is_premium: false });
        const featuredTemplates = await Template.countDocuments({ status: 'ACTIVE', is_featured: true });

        // Top used templates
        const topUsedTemplates = await Template.find({ status: 'ACTIVE' })
            .sort({ usage_count: -1 })
            .limit(5)
            .select('name usage_count category');

        // Category distribution
        const categoryStats = await Template.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Total usage
        const totalUsage = await Template.aggregate([
            { $match: { status: 'ACTIVE' } },
            { $group: { _id: null, totalUsage: { $sum: '$usage_count' } } }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalTemplates,
                premium: premiumTemplates,
                free: freeTemplates,
                featured: featuredTemplates,
                totalUsage: totalUsage[0]?.totalUsage || 0,
                topUsed: topUsedTemplates.map(t => ({
                    id: t._id,
                    name: t.name,
                    category: t.category,
                    usage_count: t.usage_count
                })),
                categoryDistribution: categoryStats.map(c => ({
                    category: c._id,
                    count: c.count
                }))
            }
        });
    } catch (err) {
        console.error('Lỗi lấy template stats:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy thống kê: ' + err.message
        });
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    if (browserPool.browser) {
        await browserPool.browser.close().catch(err =>
            console.error('Lỗi khi đóng browser:', err)
        );
    }
    process.exit(0);
});

module.exports = exports;