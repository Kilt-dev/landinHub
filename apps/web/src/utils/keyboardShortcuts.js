/**
 * Keyboard Shortcuts Utility
 * Quản lý tất cả keyboard shortcuts cho builder
 */

export const SHORTCUTS = {
    // Undo/Redo
    UNDO: { key: 'z', ctrl: true, description: 'Hoàn tác' },
    REDO: { key: 'y', ctrl: true, description: 'Khôi phục' },
    REDO_ALT: { key: 'z', ctrl: true, shift: true, description: 'Khôi phục (Alt)' },

    // Edit
    COPY: { key: 'c', ctrl: true, description: 'Sao chép' },
    CUT: { key: 'x', ctrl: true, description: 'Cắt' },
    PASTE: { key: 'v', ctrl: true, description: 'Dán' },
    DUPLICATE: { key: 'd', ctrl: true, description: 'Nhân bản' },
    DELETE: { key: 'Delete', description: 'Xóa' },
    DELETE_ALT: { key: 'Backspace', description: 'Xóa (Alt)' },

    // Selection
    SELECT_ALL: { key: 'a', ctrl: true, description: 'Chọn tất cả' },
    DESELECT: { key: 'Escape', description: 'Bỏ chọn' },

    // Save
    SAVE: { key: 's', ctrl: true, description: 'Lưu' },

    // View
    PREVIEW: { key: 'p', ctrl: true, description: 'Xem trước' },
    TOGGLE_GRID: { key: 'g', ctrl: true, description: 'Bật/tắt lưới' },

    // Alignment
    ALIGN_LEFT: { key: 'ArrowLeft', ctrl: true, shift: true, description: 'Căn trái' },
    ALIGN_RIGHT: { key: 'ArrowRight', ctrl: true, shift: true, description: 'Căn phải' },
    ALIGN_TOP: { key: 'ArrowUp', ctrl: true, shift: true, description: 'Căn trên' },
    ALIGN_BOTTOM: { key: 'ArrowDown', ctrl: true, shift: true, description: 'Căn dưới' },
    ALIGN_CENTER_H: { key: 'h', ctrl: true, shift: true, description: 'Căn giữa ngang' },
    ALIGN_CENTER_V: { key: 'v', ctrl: true, shift: true, description: 'Căn giữa dọc' },

    // Move
    MOVE_UP: { key: 'ArrowUp', description: 'Di chuyển lên' },
    MOVE_DOWN: { key: 'ArrowDown', description: 'Di chuyển xuống' },
    MOVE_LEFT: { key: 'ArrowLeft', description: 'Di chuyển trái' },
    MOVE_RIGHT: { key: 'ArrowRight', description: 'Di chuyển phải' },

    // Zoom
    ZOOM_IN: { key: '+', ctrl: true, description: 'Phóng to' },
    ZOOM_OUT: { key: '-', ctrl: true, description: 'Thu nhỏ' },
    ZOOM_RESET: { key: '0', ctrl: true, description: 'Reset zoom' },
};

/**
 * Kiểm tra xem event có khớp với shortcut không
 */
export const matchesShortcut = (event, shortcut) => {
    const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

    return ctrlMatch && shiftMatch && altMatch && keyMatch;
};

/**
 * Hook để register keyboard shortcuts
 */
export const useKeyboardShortcuts = (callbacks) => {
    const handleKeyDown = (event) => {
        // Ignore shortcuts when typing in input/textarea
        const tagName = event.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || event.target.contentEditable === 'true') {
            // Allow Ctrl+S even in inputs
            if (matchesShortcut(event, SHORTCUTS.SAVE)) {
                event.preventDefault();
                callbacks.onSave?.();
                return;
            }
            return;
        }

        // Undo/Redo
        if (matchesShortcut(event, SHORTCUTS.UNDO)) {
            event.preventDefault();
            callbacks.onUndo?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.REDO) || matchesShortcut(event, SHORTCUTS.REDO_ALT)) {
            event.preventDefault();
            callbacks.onRedo?.();
            return;
        }

        // Edit
        if (matchesShortcut(event, SHORTCUTS.COPY)) {
            event.preventDefault();
            callbacks.onCopy?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.CUT)) {
            event.preventDefault();
            callbacks.onCut?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.PASTE)) {
            event.preventDefault();
            callbacks.onPaste?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.DUPLICATE)) {
            event.preventDefault();
            callbacks.onDuplicate?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.DELETE) || matchesShortcut(event, SHORTCUTS.DELETE_ALT)) {
            event.preventDefault();
            callbacks.onDelete?.();
            return;
        }

        // Selection
        if (matchesShortcut(event, SHORTCUTS.SELECT_ALL)) {
            event.preventDefault();
            callbacks.onSelectAll?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.DESELECT)) {
            event.preventDefault();
            callbacks.onDeselect?.();
            return;
        }

        // Save
        if (matchesShortcut(event, SHORTCUTS.SAVE)) {
            event.preventDefault();
            callbacks.onSave?.();
            return;
        }

        // Preview
        if (matchesShortcut(event, SHORTCUTS.PREVIEW)) {
            event.preventDefault();
            callbacks.onPreview?.();
            return;
        }

        // Grid
        if (matchesShortcut(event, SHORTCUTS.TOGGLE_GRID)) {
            event.preventDefault();
            callbacks.onToggleGrid?.();
            return;
        }

        // Alignment
        if (matchesShortcut(event, SHORTCUTS.ALIGN_LEFT)) {
            event.preventDefault();
            callbacks.onAlignLeft?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ALIGN_RIGHT)) {
            event.preventDefault();
            callbacks.onAlignRight?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ALIGN_TOP)) {
            event.preventDefault();
            callbacks.onAlignTop?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ALIGN_BOTTOM)) {
            event.preventDefault();
            callbacks.onAlignBottom?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ALIGN_CENTER_H)) {
            event.preventDefault();
            callbacks.onAlignCenterH?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ALIGN_CENTER_V)) {
            event.preventDefault();
            callbacks.onAlignCenterV?.();
            return;
        }

        // Move (only if no modifier keys)
        if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                callbacks.onMoveUp?.();
                return;
            }
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                callbacks.onMoveDown?.();
                return;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                callbacks.onMoveLeft?.();
                return;
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                callbacks.onMoveRight?.();
                return;
            }
        }

        // Zoom
        if (matchesShortcut(event, SHORTCUTS.ZOOM_IN)) {
            event.preventDefault();
            callbacks.onZoomIn?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ZOOM_OUT)) {
            event.preventDefault();
            callbacks.onZoomOut?.();
            return;
        }
        if (matchesShortcut(event, SHORTCUTS.ZOOM_RESET)) {
            event.preventDefault();
            callbacks.onZoomReset?.();
            return;
        }
    };

    return handleKeyDown;
};

export default {
    SHORTCUTS,
    matchesShortcut,
    useKeyboardShortcuts,
};
