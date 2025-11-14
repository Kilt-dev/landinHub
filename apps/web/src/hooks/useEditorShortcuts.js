import { useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for editor keyboard shortcuts
 * Comprehensive keyboard shortcuts for Landing Page Builder
 */

export const useEditorShortcuts = ({
    selectedIds = [],
    pageData,
    onUndo,
    onRedo,
    onSave,
    onCopy,
    onPaste,
    onDuplicate,
    onDelete,
    onSelectAll,
    onDeselect,
    canUndo,
    canRedo,
    disabled = false
}) => {
    const handleKeyDown = useCallback((e) => {
        if (disabled) return;

        const { ctrlKey, metaKey, shiftKey, key, code } = e;
        const isMod = ctrlKey || metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)

        // Prevent default for editor shortcuts
        const shouldPreventDefault = () => {
            if (
                (isMod && ['z', 'y', 'c', 'v', 'd', 's', 'a'].includes(key.toLowerCase())) ||
                ['Delete', 'Backspace', 'Escape'].includes(key)
            ) {
                // Don't prevent if user is typing in input/textarea
                const activeElement = document.activeElement;
                if (
                    activeElement &&
                    (activeElement.tagName === 'INPUT' ||
                        activeElement.tagName === 'TEXTAREA' ||
                        activeElement.isContentEditable)
                ) {
                    return false;
                }
                return true;
            }
            return false;
        };

        if (shouldPreventDefault()) {
            e.preventDefault();
            e.stopPropagation();
        }

        // ========== UNDO/REDO ==========
        if (isMod && key.toLowerCase() === 'z' && !shiftKey) {
            if (canUndo) {
                onUndo?.();
            } else {
                toast.info('Không thể hoàn tác thêm');
            }
            return;
        }

        if ((isMod && key.toLowerCase() === 'y') || (isMod && shiftKey && key.toLowerCase() === 'z')) {
            if (canRedo) {
                onRedo?.();
            } else {
                toast.info('Không thể làm lại thêm');
            }
            return;
        }

        // ========== SAVE ==========
        if (isMod && key.toLowerCase() === 's') {
            toast.info('Đang lưu...');
            onSave?.();
            return;
        }

        // ========== SELECT ALL ==========
        if (isMod && key.toLowerCase() === 'a') {
            if (pageData?.elements?.length > 0) {
                onSelectAll?.(pageData.elements.map(el => el.id));
                toast.success(`Đã chọn ${pageData.elements.length} phần tử`);
            }
            return;
        }

        // ========== COPY ==========
        if (isMod && key.toLowerCase() === 'c' && selectedIds.length > 0) {
            onCopy?.(selectedIds);
            toast.success(`Đã copy ${selectedIds.length} phần tử`);
            return;
        }

        // ========== PASTE ==========
        if (isMod && key.toLowerCase() === 'v') {
            onPaste?.();
            return;
        }

        // ========== DUPLICATE ==========
        if (isMod && key.toLowerCase() === 'd' && selectedIds.length > 0) {
            onDuplicate?.(selectedIds);
            toast.success(`Đã nhân bản ${selectedIds.length} phần tử`);
            return;
        }

        // ========== DELETE ==========
        if ((key === 'Delete' || key === 'Backspace') && selectedIds.length > 0) {
            // Confirm if deleting multiple elements
            if (selectedIds.length > 3) {
                if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} phần tử?`)) {
                    return;
                }
            }
            onDelete?.(selectedIds);
            toast.success(`Đã xóa ${selectedIds.length} phần tử`);
            return;
        }

        // ========== DESELECT ==========
        if (key === 'Escape') {
            if (selectedIds.length > 0) {
                onDeselect?.();
                toast.info('Đã bỏ chọn');
            }
            return;
        }

        // ========== ARROW KEYS (Move elements) ==========
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) && selectedIds.length > 0) {
            // This will be handled by Canvas component for precise movement
            // We just prevent default here
            return;
        }

    }, [
        disabled,
        selectedIds,
        pageData,
        onUndo,
        onRedo,
        onSave,
        onCopy,
        onPaste,
        onDuplicate,
        onDelete,
        onSelectAll,
        onDeselect,
        canUndo,
        canRedo
    ]);

    useEffect(() => {
        if (disabled) return;

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, disabled]);

    // Return shortcut info for help modal
    const shortcuts = [
        { keys: ['Ctrl/Cmd', 'Z'], description: 'Hoàn tác' },
        { keys: ['Ctrl/Cmd', 'Y'], description: 'Làm lại' },
        { keys: ['Ctrl/Cmd', 'S'], description: 'Lưu trang' },
        { keys: ['Ctrl/Cmd', 'A'], description: 'Chọn tất cả' },
        { keys: ['Ctrl/Cmd', 'C'], description: 'Copy phần tử' },
        { keys: ['Ctrl/Cmd', 'V'], description: 'Paste phần tử' },
        { keys: ['Ctrl/Cmd', 'D'], description: 'Nhân bản phần tử' },
        { keys: ['Delete'], description: 'Xóa phần tử' },
        { keys: ['Esc'], description: 'Bỏ chọn' },
        { keys: ['Arrow Keys'], description: 'Di chuyển phần tử' }
    ];

    return { shortcuts };
};
