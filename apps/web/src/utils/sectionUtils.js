/**
 * Section Utilities
 * Helpers for managing section positioning and stacking
 */

/**
 * Tính toán vị trí Y tiếp theo cho section mới
 * LUÔN dùng desktop mode làm base, sau đó sync sang tablet/mobile
 */
export const calculateNextSectionY = (elements) => {
    const sections = elements.filter((el) => el.type === 'section');

    if (sections.length === 0) {
        return 0;
    }

    // Tìm section có Y cao nhất trong desktop mode
    let maxY = 0;
    sections.forEach((section) => {
        const y = section.position?.desktop?.y || 0;
        const height = section.size?.height || 400;
        const totalY = y + height;
        if (totalY > maxY) {
            maxY = totalY;
        }
    });

    return maxY;
};

/**
 * Sắp xếp lại tất cả sections theo thứ tự Y
 * Đảm bảo không có khoảng trống giữa các sections
 */
export const reorderSections = (elements) => {
    const sections = elements.filter((el) => el.type === 'section');
    const otherElements = elements.filter((el) => el.type !== 'section');

    // Sort sections by desktop Y position
    sections.sort((a, b) => {
        const aY = a.position?.desktop?.y || 0;
        const bY = b.position?.desktop?.y || 0;
        return aY - bY;
    });

    // Reassign Y positions - stack them without gaps
    let currentY = 0;
    const reorderedSections = sections.map((section) => {
        const height = section.size?.height || 400;
        const updatedSection = {
            ...section,
            position: {
                desktop: { x: 0, y: currentY, z: 1 },
                tablet: { x: 0, y: currentY, z: 1 },
                mobile: { x: 0, y: currentY, z: 1 },
            },
        };
        currentY += height;
        return updatedSection;
    });

    return [...reorderedSections, ...otherElements];
};

/**
 * Tính toán canvas height dựa trên tất cả sections
 */
export const calculateCanvasHeight = (elements) => {
    const sections = elements.filter((el) => el.type === 'section');

    if (sections.length === 0) {
        return 800; // Default height
    }

    let maxHeight = 0;
    sections.forEach((section) => {
        const y = section.position?.desktop?.y || 0;
        const height = section.size?.height || 400;
        const totalHeight = y + height;
        if (totalHeight > maxHeight) {
            maxHeight = totalHeight;
        }
    });

    return maxHeight + 100; // Add 100px padding
};

/**
 * Validate section position
 * Đảm bảo section có position hợp lệ cho tất cả modes
 */
export const validateSectionPosition = (section) => {
    const position = section.position || {};

    return {
        ...section,
        position: {
            desktop: position.desktop || { x: 0, y: 0, z: 1 },
            tablet: position.tablet || { x: 0, y: 0, z: 1 },
            mobile: position.mobile || { x: 0, y: 0, z: 1 },
        },
    };
};

/**
 * Move section up in stack
 */
export const moveSectionUp = (elements, sectionId) => {
    const sections = elements.filter((el) => el.type === 'section');
    const otherElements = elements.filter((el) => el.type !== 'section');

    // Sort by Y position
    sections.sort((a, b) => {
        const aY = a.position?.desktop?.y || 0;
        const bY = b.position?.desktop?.y || 0;
        return aY - bY;
    });

    const index = sections.findIndex((s) => s.id === sectionId);
    if (index <= 0) {
        return elements; // Already at top or not found
    }

    // Swap with previous section
    [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];

    // Reorder all sections
    let currentY = 0;
    const reorderedSections = sections.map((section) => {
        const height = section.size?.height || 400;
        const updated = {
            ...section,
            position: {
                desktop: { x: 0, y: currentY, z: 1 },
                tablet: { x: 0, y: currentY, z: 1 },
                mobile: { x: 0, y: currentY, z: 1 },
            },
        };
        currentY += height;
        return updated;
    });

    return [...reorderedSections, ...otherElements];
};

/**
 * Move section down in stack
 */
export const moveSectionDown = (elements, sectionId) => {
    const sections = elements.filter((el) => el.type === 'section');
    const otherElements = elements.filter((el) => el.type !== 'section');

    // Sort by Y position
    sections.sort((a, b) => {
        const aY = a.position?.desktop?.y || 0;
        const bY = b.position?.desktop?.y || 0;
        return aY - bY;
    });

    const index = sections.findIndex((s) => s.id === sectionId);
    if (index >= sections.length - 1 || index < 0) {
        return elements; // Already at bottom or not found
    }

    // Swap with next section
    [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];

    // Reorder all sections
    let currentY = 0;
    const reorderedSections = sections.map((section) => {
        const height = section.size?.height || 400;
        const updated = {
            ...section,
            position: {
                desktop: { x: 0, y: currentY, z: 1 },
                tablet: { x: 0, y: currentY, z: 1 },
                mobile: { x: 0, y: currentY, z: 1 },
            },
        };
        currentY += height;
        return updated;
    });

    return [...reorderedSections, ...otherElements];
};

/**
 * Delete section và reorder các sections còn lại
 */
export const deleteSection = (elements, sectionId) => {
    const filtered = elements.filter((el) => el.id !== sectionId);
    return reorderSections(filtered);
};

export default {
    calculateNextSectionY,
    reorderSections,
    calculateCanvasHeight,
    validateSectionPosition,
    moveSectionUp,
    moveSectionDown,
    deleteSection,
};
