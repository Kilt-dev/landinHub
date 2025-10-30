/**
 * Auto-sizing Utilities
 * Tự động tính toán size dựa trên nội dung của element
 */

/**
 * Tính toán width/height cho text elements (heading, paragraph)
 */
export const calculateTextSize = (text, styles = {}, type = 'paragraph') => {
    if (!text) {
        return type === 'heading'
            ? { width: 200, height: 40 }
            : { width: 200, height: 60 };
    }

    // Create temporary element to measure
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'nowrap';
    tempDiv.style.fontSize = styles.fontSize || (type === 'heading' ? '24px' : '16px');
    tempDiv.style.fontWeight = styles.fontWeight || (type === 'heading' ? 'bold' : 'normal');
    tempDiv.style.fontFamily = styles.fontFamily || 'Arial, sans-serif';
    tempDiv.style.padding = styles.padding || '0';
    tempDiv.textContent = text;

    document.body.appendChild(tempDiv);
    const width = Math.ceil(tempDiv.offsetWidth);
    const height = Math.ceil(tempDiv.offsetHeight);
    document.body.removeChild(tempDiv);

    // Add padding
    const paddingX = parsePadding(styles.paddingLeft) + parsePadding(styles.paddingRight);
    const paddingY = parsePadding(styles.paddingTop) + parsePadding(styles.paddingBottom);

    return {
        width: Math.max(width + paddingX + 20, 100), // Min 100px
        height: Math.max(height + paddingY + 10, 30)  // Min 30px
    };
};

/**
 * Tính toán size cho button dựa trên text
 */
export const calculateButtonSize = (text, styles = {}) => {
    if (!text) {
        return { width: 120, height: 40 };
    }

    const tempButton = document.createElement('button');
    tempButton.style.position = 'absolute';
    tempButton.style.visibility = 'hidden';
    tempButton.style.fontSize = styles.fontSize || '16px';
    tempButton.style.fontWeight = styles.fontWeight || '600';
    tempButton.style.fontFamily = styles.fontFamily || 'Arial, sans-serif';
    tempButton.style.padding = styles.padding || '12px 24px';
    tempButton.style.border = styles.border || 'none';
    tempButton.textContent = text;

    document.body.appendChild(tempButton);
    const width = Math.ceil(tempButton.offsetWidth);
    const height = Math.ceil(tempButton.offsetHeight);
    document.body.removeChild(tempButton);

    return {
        width: Math.max(width + 20, 100),  // Min 100px
        height: Math.max(height + 4, 40)   // Min 40px
    };
};

/**
 * Tính toán size cho image dựa trên aspect ratio
 */
export const calculateImageSize = (imageSrc, currentWidth, currentHeight, maintainAspectRatio = true) => {
    if (!imageSrc) {
        return { width: 300, height: 200 };
    }

    // If we have current dimensions and want to maintain ratio
    if (maintainAspectRatio && currentWidth && currentHeight) {
        return { width: currentWidth, height: currentHeight };
    }

    // Default fallback
    return { width: currentWidth || 300, height: currentHeight || 200 };
};

/**
 * Load image and get natural dimensions
 */
export const loadImageDimensions = (imageSrc) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight
            });
        };
        img.onerror = reject;
        img.src = imageSrc;
    });
};

/**
 * Tính toán size cho form dựa trên số lượng fields
 */
export const calculateFormSize = (fields = [], orientation = 'vertical') => {
    if (!fields || fields.length === 0) {
        return { width: 400, height: 300 };
    }

    const fieldHeight = 80; // Height per field (label + input + spacing)
    const buttonHeight = 50;
    const padding = 32;

    if (orientation === 'vertical') {
        const width = 400;
        const height = (fields.length * fieldHeight) + buttonHeight + padding;
        return {
            width: Math.max(width, 300),
            height: Math.max(height, 200)
        };
    } else {
        // Horizontal layout
        const width = Math.min(fields.length * 200, 800);
        const height = fieldHeight + buttonHeight + padding;
        return {
            width: Math.max(width, 400),
            height: Math.max(height, 150)
        };
    }
};

/**
 * Tính toán size cho gallery dựa trên số images và columns
 */
export const calculateGallerySize = (images = [], columns = 3, gap = 16) => {
    if (!images || images.length === 0) {
        return { width: 600, height: 400 };
    }

    const imageWidth = 150; // Base image width
    const imageHeight = 150; // Base image height
    const rows = Math.ceil(images.length / columns);

    const width = (imageWidth * columns) + (gap * (columns - 1)) + 32; // +32 for padding
    const height = (imageHeight * rows) + (gap * (rows - 1)) + 32;

    return {
        width: Math.max(width, 300),
        height: Math.max(height, 200)
    };
};

/**
 * Tính toán size cho icon
 */
export const calculateIconSize = (iconSize = 'medium') => {
    const sizes = {
        small: { width: 32, height: 32 },
        medium: { width: 48, height: 48 },
        large: { width: 64, height: 64 },
        xlarge: { width: 96, height: 96 }
    };

    return sizes[iconSize] || sizes.medium;
};

/**
 * Parse padding string to number
 */
const parsePadding = (padding) => {
    if (!padding) return 0;
    if (typeof padding === 'number') return padding;
    const match = String(padding).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

/**
 * Auto-size element dựa trên type và content
 */
export const autoSizeElement = async (element) => {
    const { type, componentData = {}, styles = {}, size = {} } = element;

    let calculatedSize = { ...size };

    switch (type) {
        case 'heading':
            calculatedSize = calculateTextSize(
                componentData.text || componentData.content || 'Heading',
                styles,
                'heading'
            );
            break;

        case 'paragraph':
            // For multi-line text, we need a different approach
            const text = componentData.text || componentData.content || 'Paragraph text';
            const maxWidth = size.width || 400;

            // Create temp element with max-width to calculate wrapped height
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.width = maxWidth + 'px';
            tempDiv.style.fontSize = styles.fontSize || '16px';
            tempDiv.style.fontFamily = styles.fontFamily || 'Arial, sans-serif';
            tempDiv.style.lineHeight = styles.lineHeight || '1.6';
            tempDiv.style.padding = styles.padding || '8px';
            tempDiv.textContent = text;

            document.body.appendChild(tempDiv);
            calculatedSize = {
                width: maxWidth,
                height: Math.max(Math.ceil(tempDiv.offsetHeight), 60)
            };
            document.body.removeChild(tempDiv);
            break;

        case 'button':
            calculatedSize = calculateButtonSize(
                componentData.text || componentData.label || 'Button',
                styles
            );
            break;

        case 'image':
            if (componentData.src || componentData.url) {
                try {
                    const imgDimensions = await loadImageDimensions(componentData.src || componentData.url);
                    // Scale to reasonable size while maintaining aspect ratio
                    const maxWidth = 600;
                    const maxHeight = 400;

                    let width = imgDimensions.width;
                    let height = imgDimensions.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width = (maxHeight / height) * width;
                        height = maxHeight;
                    }

                    calculatedSize = {
                        width: Math.round(width),
                        height: Math.round(height)
                    };
                } catch (error) {
                    calculatedSize = { width: 300, height: 200 };
                }
            }
            break;

        case 'form':
            calculatedSize = calculateFormSize(
                componentData.fields || [],
                componentData.orientation || 'vertical'
            );
            break;

        case 'gallery':
            calculatedSize = calculateGallerySize(
                componentData.images || [],
                componentData.columns || 3,
                parsePadding(componentData.gap) || 16
            );
            break;

        case 'icon':
            calculatedSize = calculateIconSize(componentData.size || 'medium');
            break;

        case 'video':
            // Video maintains 16:9 aspect ratio by default
            const videoWidth = size.width || 640;
            calculatedSize = {
                width: videoWidth,
                height: Math.round(videoWidth * (9 / 16))
            };
            break;

        default:
            // Keep existing size
            calculatedSize = size;
            break;
    }

    return calculatedSize;
};

/**
 * Batch auto-size multiple elements
 */
export const autoSizeElements = async (elements) => {
    const promises = elements.map(async (element) => {
        const calculatedSize = await autoSizeElement(element);
        return {
            ...element,
            size: calculatedSize
        };
    });

    return Promise.all(promises);
};

/**
 * Check if element should auto-resize on content change
 */
export const shouldAutoResize = (elementType) => {
    const autoResizeTypes = ['heading', 'paragraph', 'button', 'icon', 'form', 'gallery'];
    return autoResizeTypes.includes(elementType);
};

export default {
    calculateTextSize,
    calculateButtonSize,
    calculateImageSize,
    loadImageDimensions,
    calculateFormSize,
    calculateGallerySize,
    calculateIconSize,
    autoSizeElement,
    autoSizeElements,
    shouldAutoResize
};
