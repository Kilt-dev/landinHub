import api from '@landinghub/api';

/**
 * Upload single image to S3
 * @param {File} file - Image file to upload
 * @param {string} pageId - Optional page ID
 * @param {Function} onProgress - Progress callback
 */
export const uploadImage = async (file, pageId = null, onProgress) => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        if (pageId) {
            formData.append('pageId', pageId);
        }

        const response = await api.post('api/images/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            }
        });

        return response.data;
    } catch (error) {
        console.error('Upload image error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to upload image');
    }
};

/**
 * Upload multiple images to S3
 * @param {File[]} files - Array of image files
 * @param {string} pageId - Optional page ID
 * @param {Function} onProgress - Progress callback
 */
export const uploadMultipleImages = async (files, pageId = null, onProgress) => {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });
        if (pageId) {
            formData.append('pageId', pageId);
        }

        const response = await api.post('api/images/upload/multiple', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            }
        });

        return response.data;
    } catch (error) {
        console.error('Upload multiple images error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to upload images');
    }
};

/**
 * Get images by page ID
 * @param {string} pageId - Page ID
 */
export const getPageImages = async (pageId) => {
    try {
        const response = await api.get(`api/images/page/${pageId}`);
        return response.data;
    } catch (error) {
        console.error('Get page images error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to fetch page images');
    }
};

/**
 * Get all user's uploaded images
 */
export const getUserImages = async () => {
    try {
        const response = await api.get('api/images/user');
        return response.data;
    } catch (error) {
        console.error('Get user images error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to fetch images');
    }
};

/**
 * Delete image from S3
 * @param {string} key - S3 object key
 */
export const deleteImage = async (key) => {
    try {
        const response = await api.delete(`/api/images/${encodeURIComponent(key)}`);
        return response.data;
    } catch (error) {
        console.error('Delete image error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to delete image');
    }
};

/**
 * Get presigned URL for direct S3 upload
 * @param {string} filename - File name
 * @param {string} filetype - File MIME type
 * @param {string} pageId - Optional page ID
 */
export const getPresignedUrl = async (filename, filetype, pageId = null) => {
    try {
        const response = await api.post('/api/images/presigned-url', {
            filename,
            filetype,
            pageId
        });
        return response.data;
    } catch (error) {
        console.error('Get presigned URL error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || 'Failed to get presigned URL');
    }
};

/**
 * Upload image directly to S3 using presigned URL
 * @param {File} file - Image file
 * @param {string} pageId - Optional page ID
 * @param {Function} onProgress - Progress callback
 */
export const uploadImageDirect = async (file, pageId = null, onProgress) => {
    try {
        // Get presigned URL
        const presignedData = await getPresignedUrl(file.name, file.type, pageId);

        // Upload to S3 directly
        await fetch(presignedData.data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });

        return {
            success: true,
            data: {
                url: presignedData.data.publicUrl,
                key: presignedData.data.key,
                name: file.name
            }
        };
    } catch (error) {
        console.error('Direct upload error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error('Failed to upload image directly to S3');
    }
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 */
export const validateImageFile = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB`
        };
    }

    return { valid: true };
};

/**
 * Compress image before upload
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 */
export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Error compressing image'));
        };

        reader.onerror = () => reject(new Error('Error reading image file'));
    });
};