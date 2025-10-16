// controllers/imageController.js
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Page = require('../models/Page');

// Cấu hình AWS S3
const s3 = new AWS.S3({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Debug S3 configuration
console.log('=== S3 Configuration Debug ===');
console.log('AWS_S3_BUCKET:', BUCKET_NAME);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('S3 Config Region:', s3.config.region);
console.log('=== End S3 Debug ===');

// Helper: Lấy S3 path từ file_path, đồng bộ với pageController.js
const getS3PathFromFilePath = (file_path) => {
    if (!file_path) return null;
    const bucketName = process.env.AWS_S3_BUCKET;
    let s3Path;

    if (file_path.includes('landinghub-iconic')) {
        s3Path = file_path.split('s3://landinghub-iconic/')[1];
    } else {
        s3Path = file_path.split(`s3://${bucketName}/`)[1];
    }

    return s3Path;
};

// Multer memory storage để xử lý ảnh với sharp trước khi upload
const memoryStorage = multer.memoryStorage();
const uploadToMemory = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Chỉ chấp nhận file ảnh: ${allowedTypes.join(', ')}`));
        }
    }
});

// Middleware để xử lý và upload ảnh đơn lên S3
const processAndUploadImage = async (req, res, next) => {
    console.log('processAndUploadImage called, file:', req.file);
    console.log('Request body:', req.body);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Không có file được tải lên'
        });
    }

    try {
        const userId = req.user?.userId;
        const pageId = req.body.pageId || req.params.pageId;
        const ext = '.webp'; // Chuyển đổi sang WebP để tối ưu kích thước
        const uniqueId = uuidv4();

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Không tìm thấy thông tin người dùng'
            });
        }

        // Xử lý ảnh với sharp
        const processedImage = await sharp(req.file.buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }) // Resize giữ tỷ lệ
            .webp({ quality: 80 }) // Chuyển sang WebP, chất lượng 80
            .toBuffer();

        // Tạo key cho S3
        let s3Key;
        if (pageId) {
            const page = await Page.findOne({ _id: pageId, user_id: userId });
            if (page && page.file_path) {
                const s3Path = getS3PathFromFilePath(page.file_path);
                s3Key = `${s3Path}/images/${uniqueId}${ext}`;
            } else {
                const timestamp = Date.now();
                s3Key = `landinghub/${userId}/${timestamp}/images/${uniqueId}${ext}`;
            }
        } else {
            const timestamp = Date.now();
            s3Key = `landinghub/${userId}/general/images/${uniqueId}${ext}`;
        }

        console.log('Uploading to S3 with key:', s3Key);

        // Upload ảnh đã xử lý lên S3
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: processedImage,
            ContentType: 'image/webp',
            ACL: 'public-read',
            Metadata: {
                originalName: req.file.originalname,
                uploadedBy: userId || 'anonymous',
                uploadedAt: new Date().toISOString(),
                pageId: pageId || 'general'
            }
        };

        const uploadResult = await s3.upload(uploadParams).promise();

        req.file = {
            ...req.file,
            location: uploadResult.Location,
            key: uploadResult.Key,
            bucket: uploadResult.Bucket,
            size: processedImage.length,
            mimetype: 'image/webp'
        };

        console.log('Image uploaded successfully:', uploadResult.Location);

        next();
    } catch (error) {
        console.error('Process and upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi xử lý và upload ảnh: ' + error.message
        });
    }
};

// Middleware để xử lý và upload nhiều ảnh lên S3
const processAndUploadMultipleImages = async (req, res, next) => {
    console.log('processAndUploadMultipleImages called, files:', req.files);
    console.log('Request body:', req.body);

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Không có file nào được tải lên'
        });
    }

    try {
        const userId = req.user?.userId;
        const pageId = req.body.pageId || req.params.pageId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Không tìm thấy thông tin người dùng'
            });
        }

        const processedFiles = [];
        for (const file of req.files) {
            const ext = '.webp';
            const uniqueId = uuidv4();

            // Xử lý ảnh với sharp
            const processedImage = await sharp(file.buffer)
                .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // Tạo key cho S3
            let s3Key;
            if (pageId) {
                const page = await Page.findOne({ _id: pageId, user_id: userId });
                if (page && page.file_path) {
                    const s3Path = getS3PathFromFilePath(page.file_path);
                    s3Key = `${s3Path}/images/${uniqueId}${ext}`;
                } else {
                    const timestamp = Date.now();
                    s3Key = `landinghub/${userId}/${timestamp}/images/${uniqueId}${ext}`;
                }
            } else {
                const timestamp = Date.now();
                s3Key = `landinghub/${userId}/general/images/${uniqueId}${ext}`;
            }

            console.log('Uploading to S3 with key:', s3Key);

            // Upload ảnh đã xử lý lên S3
            const uploadParams = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: processedImage,
                ContentType: 'image/webp',
                ACL: 'public-read',
                Metadata: {
                    originalName: file.originalname,
                    uploadedBy: userId || 'anonymous',
                    uploadedAt: new Date().toISOString(),
                    pageId: pageId || 'general'
                }
            };

            const uploadResult = await s3.upload(uploadParams).promise();

            processedFiles.push({
                ...file,
                location: uploadResult.Location,
                key: uploadResult.Key,
                bucket: uploadResult.Bucket,
                size: processedImage.length,
                mimetype: 'image/webp'
            });
        }

        req.files = processedFiles;
        console.log(`${processedFiles.length} images processed and uploaded`);

        next();
    } catch (error) {
        console.error('Process and upload multiple error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi xử lý và upload nhiều ảnh: ' + error.message
        });
    }
};

// Upload single image
exports.uploadSingle = [uploadToMemory.single('image'), processAndUploadImage];

// Upload multiple images
exports.uploadMultiple = [uploadToMemory.array('images', 10), processAndUploadMultipleImages];

// Controller: Upload single image
exports.uploadImage = async (req, res) => {
    console.log('uploadImage called, file:', req.file);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Không có file được tải lên'
            });
        }

        const imageData = {
            id: uuidv4(),
            url: req.file.location,
            key: req.file.key,
            name: path.basename(req.file.key),
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            bucket: req.file.bucket,
            uploadedAt: new Date()
        };

        console.log('Image uploaded successfully:', imageData.url);

        res.status(200).json({
            success: true,
            message: 'Upload ảnh thành công',
            data: imageData
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi upload ảnh: ' + error.message
        });
    }
};

// Controller: Upload multiple images
exports.uploadImages = async (req, res) => {
    console.log('uploadImages called, files:', req.files);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Không có file nào được tải lên'
            });
        }

        const imagesData = req.files.map(file => ({
            id: uuidv4(),
            url: file.location,
            key: file.key,
            name: path.basename(file.key),
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            bucket: file.bucket,
            uploadedAt: new Date()
        }));

        console.log(`${imagesData.length} images uploaded successfully`);

        res.status(200).json({
            success: true,
            message: `Upload ${imagesData.length} ảnh thành công`,
            data: imagesData
        });
    } catch (error) {
        console.error('Upload multiple error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi upload nhiều ảnh: ' + error.message
        });
    }
};

// Controller: Get images by pageId
exports.getPageImages = async (req, res) => {
    console.log('getPageImages called, pageId:', req.params.pageId);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    const { pageId } = req.params;

    try {
        // Validate pageId
        if (!pageId || !pageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return res.status(400).json({
                success: false,
                error: 'pageId không hợp lệ'
            });
        }

        // Find page
        const page = await Page.findOne({ _id: pageId, user_id: req.user.userId });
        if (!page || !page.file_path) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy page'
            });
        }

        // Get S3 path
        const s3Path = getS3PathFromFilePath(page.file_path);
        const imagesPrefix = `${s3Path}/images/`;

        console.log('Listing images with prefix:', imagesPrefix);

        // List objects in S3
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: imagesPrefix,
            MaxKeys: 100
        };

        const data = await s3.listObjectsV2(params).promise();

        const images = data.Contents
            ? data.Contents
                .filter(item => !item.Key.endsWith('/')) // Filter out folders
                .map(item => ({
                    id: uuidv4(),
                    key: item.Key,
                    url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
                    name: path.basename(item.Key),
                    size: item.Size,
                    lastModified: item.LastModified
                }))
            : [];

        console.log(`Found ${images.length} images for page ${pageId}`);

        res.status(200).json({
            success: true,
            data: images,
            count: images.length
        });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy danh sách ảnh: ' + error.message
        });
    }
};

// Controller: Get all user images
exports.getUserImages = async (req, res) => {
    console.log('getUserImages called');

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    try {
        const userId = req.user.userId;
        const prefix = `landinghub/${userId}/`;

        console.log('Listing user images with prefix:', prefix);

        const params = {
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            MaxKeys: 1000
        };

        const data = await s3.listObjectsV2(params).promise();

        const images = data.Contents
            ? data.Contents
                .filter(item => {
                    const key = item.Key;
                    return (
                        key.includes('/images/') &&
                        !key.endsWith('/') &&
                        /\.(jpg|jpeg|png|gif|webp)$/i.test(key)
                    );
                })
                .map(item => ({
                    id: uuidv4(),
                    key: item.Key,
                    url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
                    name: path.basename(item.Key),
                    size: item.Size,
                    lastModified: item.LastModified
                }))
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)) // Sort by newest first
            : [];

        console.log(`Found ${images.length} total images for user ${userId}`);

        res.status(200).json({
            success: true,
            data: images,
            count: images.length
        });
    } catch (error) {
        console.error('Get user images error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi lấy danh sách ảnh: ' + error.message
        });
    }
};

// Controller: Delete image
exports.deleteImage = async (req, res) => {
    console.log('deleteImage called, key:', req.params.key);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    const { key } = req.params;

    try {
        // Verify user owns this image
        if (!key.includes(`landinghub/${req.user.userId}/`)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền xóa ảnh này'
            });
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();

        console.log('Image deleted successfully:', key);

        res.status(200).json({
            success: true,
            message: 'Xóa ảnh thành công'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi xóa ảnh: ' + error.message
        });
    }
};

// Controller: Get presigned URL for direct upload
exports.getPresignedUrl = async (req, res) => {
    console.log('getPresignedUrl called, body:', req.body);

    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            success: false,
            error: 'Không tìm thấy thông tin người dùng'
        });
    }

    try {
        const { filename, filetype, pageId } = req.body;

        if (!filename || !filetype) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin filename hoặc filetype'
            });
        }

        const userId = req.user.userId;
        const uniqueId = uuidv4();
        const ext = path.extname(filename);

        let s3Key;
        if (pageId) {
            const page = await Page.findOne({ _id: pageId, user_id: userId });
            if (page && page.file_path) {
                const s3Path = getS3PathFromFilePath(page.file_path);
                s3Key = `${s3Path}/images/${uniqueId}${ext}`;
            } else {
                s3Key = `landinghub/${userId}/${Date.now()}/images/${uniqueId}${ext}`;
            }
        } else {
            s3Key = `landinghub/${userId}/general/images/${uniqueId}${ext}`;
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Expires: 300, // 5 phút
            ContentType: filetype,
            ACL: 'public-read'
        };

        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        console.log('Generated presigned URL:', uploadUrl);

        res.status(200).json({
            success: true,
            data: {
                uploadUrl,
                publicUrl,
                key: s3Key
            }
        });
    } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi tạo URL upload: ' + error.message
        });
    }
};

module.exports = exports;