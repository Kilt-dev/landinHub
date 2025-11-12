import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for copy/paste operations in the editor
 */

export const useClipboard = (pageData, onAddElements) => {
    const [clipboard, setClipboard] = useState([]);

    /**
     * Copy selected elements to clipboard
     */
    const copyElements = useCallback((selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) {
            toast.warning('⚠️ Không có phần tử nào được chọn');
            return;
        }

        const elementsToCopy = pageData.elements.filter(el => selectedIds.includes(el.id));

        if (elementsToCopy.length === 0) {
            toast.error('❌ Không tìm thấy phần tử để copy');
            return;
        }

        // Deep clone to avoid reference issues
        const clonedElements = JSON.parse(JSON.stringify(elementsToCopy));

        setClipboard(clonedElements);

        toast.success(`📋 Đã copy ${clonedElements.length} phần tử`, {
            autoClose: 2000
        });

        return clonedElements;
    }, [pageData]);

    /**
     * Cut selected elements (copy + delete)
     */
    const cutElements = useCallback((selectedIds, onDelete) => {
        const copied = copyElements(selectedIds);
        if (copied && onDelete) {
            onDelete(selectedIds);
            toast.success(`✂️ Đã cắt ${copied.length} phần tử`);
        }
        return copied;
    }, [copyElements]);

    /**
     * Paste elements from clipboard
     */
    const pasteElements = useCallback((viewMode = 'desktop') => {
        if (!clipboard || clipboard.length === 0) {
            toast.warning('⚠️ Clipboard trống! Hãy copy phần tử trước');
            return null;
        }

        // Generate new IDs and offset positions
        const pastedElements = clipboard.map((el, index) => {
            const newId = `${el.type}-${Date.now()}-${index}`;

            // Offset position to avoid overlapping
            const offset = 20 * (index + 1);

            const newPosition = {};
            ['desktop', 'tablet', 'mobile'].forEach(mode => {
                if (el.position?.[mode]) {
                    newPosition[mode] = {
                        x: (el.position[mode].x || 0) + offset,
                        y: (el.position[mode].y || 0) + offset,
                        z: el.position[mode].z || 1
                    };
                }
            });

            // Deep clone children and update IDs
            const newChildren = el.children?.map((child, childIndex) => ({
                ...child,
                id: `${child.type}-${Date.now()}-${index}-${childIndex}`
            })) || [];

            return {
                ...el,
                id: newId,
                position: newPosition,
                children: newChildren,
                // Reset some properties
                visible: true,
                locked: false
            };
        });

        // Add pasted elements
        if (onAddElements) {
            onAddElements(pastedElements);
        }

        toast.success(`📌 Đã paste ${pastedElements.length} phần tử`, {
            autoClose: 2000
        });

        return pastedElements;
    }, [clipboard, onAddElements]);

    /**
     * Duplicate elements (copy + paste in one action)
     */
    const duplicateElements = useCallback((selectedIds, viewMode = 'desktop') => {
        const copied = copyElements(selectedIds);
        if (copied) {
            return pasteElements(viewMode);
        }
        return null;
    }, [copyElements, pasteElements]);

    /**
     * Clear clipboard
     */
    const clearClipboard = useCallback(() => {
        setClipboard([]);
        toast.info('🗑️ Đã xóa clipboard');
    }, []);

    /**
     * Get clipboard info
     */
    const getClipboardInfo = useCallback(() => {
        return {
            hasContent: clipboard.length > 0,
            count: clipboard.length,
            types: clipboard.map(el => el.type)
        };
    }, [clipboard]);

    return {
        clipboard,
        copyElements,
        cutElements,
        pasteElements,
        duplicateElements,
        clearClipboard,
        getClipboardInfo
    };
};
