import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    Eye, EyeOff, Layers, GripVertical, Edit2, Trash2,
    Plus, X, ChevronDown, ChevronRight, Settings
} from 'lucide-react';
import '../../styles/PopupLayerManager.css';

const LAYER_ITEM_TYPE = 'POPUP_LAYER';

/**
 * Draggable Popup Layer Item
 */
const PopupLayerItem = ({ popup, index, onSelect, onToggleVisibility, onDelete, onMove, isSelected }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: LAYER_ITEM_TYPE,
        item: { id: popup.id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [popup.id, index]);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: LAYER_ITEM_TYPE,
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                onMove(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }), [index, onMove]);

    const handleToggleExpand = useCallback((e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const handleSelect = useCallback((e) => {
        e.stopPropagation();
        onSelect(popup.id);
    }, [popup.id, onSelect]);

    const handleToggleVisibility = useCallback((e) => {
        e.stopPropagation();
        onToggleVisibility(popup.id);
    }, [popup.id, onToggleVisibility]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        if (window.confirm(`Xóa popup "${popup.componentData?.title || popup.id}"?`)) {
            onDelete(popup.id);
        }
    }, [popup, onDelete]);

    const popupTitle = popup.componentData?.title || `Popup ${index + 1}`;
    const isVisible = popup.visible !== false;
    const zIndex = popup.position?.desktop?.z || 1001;

    return (
        <div
            ref={(node) => drag(drop(node))}
            className={`popup-layer-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'over' : ''}`}
            onClick={handleSelect}
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <div className="layer-item-header">
                <button
                    className="layer-item-expand"
                    onClick={handleToggleExpand}
                    title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="layer-item-drag" title="Kéo để sắp xếp">
                    <GripVertical size={14} />
                </div>

                <div className="layer-item-info">
                    <span className="layer-item-title">{popupTitle}</span>
                    <span className="layer-item-meta">z: {zIndex}</span>
                </div>

                <div className="layer-item-actions">
                    <button
                        className="layer-item-action"
                        onClick={handleToggleVisibility}
                        title={isVisible ? 'Ẩn popup' : 'Hiện popup'}
                    >
                        {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                        className="layer-item-action danger"
                        onClick={handleDelete}
                        title="Xóa popup"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="layer-item-details">
                    <div className="layer-detail-row">
                        <span className="layer-detail-label">ID:</span>
                        <span className="layer-detail-value">{popup.id}</span>
                    </div>
                    <div className="layer-detail-row">
                        <span className="layer-detail-label">Size:</span>
                        <span className="layer-detail-value">
                            {popup.size?.width || 600} × {popup.size?.height || 400}
                        </span>
                    </div>
                    <div className="layer-detail-row">
                        <span className="layer-detail-label">Position:</span>
                        <span className="layer-detail-value">
                            x: {popup.position?.desktop?.x || 0}, y: {popup.position?.desktop?.y || 0}
                        </span>
                    </div>
                    {popup.componentData?.trigger && (
                        <div className="layer-detail-row">
                            <span className="layer-detail-label">Trigger:</span>
                            <span className="layer-detail-value">{popup.componentData.trigger}</span>
                        </div>
                    )}
                    {popup.componentData?.delay && (
                        <div className="layer-detail-row">
                            <span className="layer-detail-label">Delay:</span>
                            <span className="layer-detail-value">{popup.componentData.delay}ms</span>
                        </div>
                    )}
                    <div className="layer-detail-row">
                        <span className="layer-detail-label">Children:</span>
                        <span className="layer-detail-value">{popup.children?.length || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Popup Layer Manager Component
 */
const PopupLayerManager = ({
    popups = [],
    selectedPopupId,
    onSelectPopup,
    onTogglePopupVisibility,
    onDeletePopup,
    onReorderPopups,
    onAddPopup,
    isCollapsed,
    onToggleCollapse,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPopups = useMemo(() => {
        if (!searchQuery.trim()) return popups;
        const query = searchQuery.toLowerCase();
        return popups.filter((popup) => {
            const title = popup.componentData?.title || '';
            const id = popup.id || '';
            return title.toLowerCase().includes(query) || id.toLowerCase().includes(query);
        });
    }, [popups, searchQuery]);

    const handleMove = useCallback((fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const newPopups = [...popups];
        const [movedPopup] = newPopups.splice(fromIndex, 1);
        newPopups.splice(toIndex, 0, movedPopup);

        // Update z-index based on new order (higher index = higher z-index)
        const reorderedPopups = newPopups.map((popup, index) => ({
            ...popup,
            position: {
                ...popup.position,
                desktop: { ...popup.position?.desktop, z: 1001 + index },
                tablet: { ...popup.position?.tablet, z: 1001 + index },
                mobile: { ...popup.position?.mobile, z: 1001 + index },
            },
        }));

        onReorderPopups(reorderedPopups);
    }, [popups, onReorderPopups]);

    const handleAddPopup = useCallback(() => {
        if (typeof onAddPopup === 'function') {
            onAddPopup();
        }
    }, [onAddPopup]);

    const handleToggleAll = useCallback(() => {
        const allVisible = popups.every((p) => p.visible !== false);
        popups.forEach((popup) => {
            if ((allVisible && popup.visible !== false) || (!allVisible && popup.visible === false)) {
                onTogglePopupVisibility(popup.id);
            }
        });
    }, [popups, onTogglePopupVisibility]);

    if (isCollapsed) {
        return (
            <div className="popup-layer-manager collapsed">
                <button
                    className="layer-manager-toggle"
                    onClick={onToggleCollapse}
                    title="Mở Popup Layers"
                >
                    <Layers size={18} />
                </button>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="popup-layer-manager">
                <div className="layer-manager-header">
                    <div className="layer-manager-title">
                        <Layers size={16} />
                        <span>Popup Layers</span>
                        <span className="layer-count">{popups.length}</span>
                    </div>
                    <button
                        className="layer-manager-toggle"
                        onClick={onToggleCollapse}
                        title="Thu gọn"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="layer-manager-toolbar">
                    <input
                        type="text"
                        className="layer-search-input"
                        placeholder="Tìm popup..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        className="layer-toolbar-btn"
                        onClick={handleToggleAll}
                        title="Bật/Tắt tất cả"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        className="layer-toolbar-btn primary"
                        onClick={handleAddPopup}
                        title="Thêm popup mới"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <div className="layer-manager-content">
                    {filteredPopups.length === 0 ? (
                        <div className="layer-manager-empty">
                            <Layers size={48} strokeWidth={1} />
                            <p>Chưa có popup nào</p>
                            <button className="layer-add-btn" onClick={handleAddPopup}>
                                <Plus size={16} />
                                Thêm Popup
                            </button>
                        </div>
                    ) : (
                        <div className="layer-manager-list">
                            {filteredPopups.map((popup, index) => (
                                <PopupLayerItem
                                    key={popup.id}
                                    popup={popup}
                                    index={index}
                                    isSelected={selectedPopupId === popup.id}
                                    onSelect={onSelectPopup}
                                    onToggleVisibility={onTogglePopupVisibility}
                                    onDelete={onDeletePopup}
                                    onMove={handleMove}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="layer-manager-footer">
                    <span className="layer-footer-text">
                        {popups.filter((p) => p.visible !== false).length} / {popups.length} đang hiển thị
                    </span>
                </div>
            </div>
        </DndProvider>
    );
};

export default PopupLayerManager;
