import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDrop, useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import SectionToolkit from './toolkitqick/SectionToolkit';
import { ItemTypes, getCanvasPosition, snapToGrid, getElementBounds, renderComponentContent } from './helpers';
import eventController from '../../utils/EventUtils';

/**
 * Reusable utility to generate locked styles for elements
 * @param {boolean} isLocked - Whether the element or componentData is locked
 * @returns {Object} CSS styles for locked state
 */
const getLockedStyles = (isLocked) =>
    useMemo(() => (isLocked ? { opacity: 0.7, cursor: 'not-allowed', pointerEvents: 'none' } : {}), [isLocked]);

/**
 * ChildElement component for rendering draggable child elements within sections or popups
 * @param {Object} props - Component props
 */
const ChildElement = React.memo(
    ({
         parentId,
         id,
         type,
         componentData = {},
         styles = {},
         isSelected,
         onSelectChild,
         position,
         size,
         viewMode,
         visible = true,
         locked = false,
         onDeleteChild,
     }) => {
        const dragRef = useRef(null);
        const [{ isDragging }, drag] = useDrag({
            type: ItemTypes.CHILD_ELEMENT,
            canDrag: () => !locked && !componentData.locked,
            item: () => {
                if (locked || componentData.locked) {
                    toast.warning('Child element đã bị khóa!');
                    return null;
                }
                return { childId: id, parentId, isExisting: true, position, size };
            },
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }, [id, parentId, position, size, locked, componentData.locked]);

        const handleClick = useCallback(
            (e) => {
                e.stopPropagation();
                if (typeof onSelectChild === 'function') {
                    onSelectChild(parentId, id);
                }
                if (componentData.events?.onClick) {
                    eventController.handleEvent(componentData.events.onClick, id, true);
                }
            },
            [parentId, id, onSelectChild, componentData.events]
        );

        const handleDelete = useCallback(
            (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (typeof onDeleteChild === 'function' && !locked && !componentData.locked) {
                    onDeleteChild(parentId, id, e);
                    toast.success('Đã xóa thành phần con!');
                } else {
                    toast.warn('Không thể xóa: Element bị khóa!');
                }
            },
            [parentId, id, onDeleteChild, locked, componentData.locked]
        );

        useEffect(() => {
            if (!locked && !componentData.locked) {
                drag(dragRef);
            }
        }, [drag, locked, componentData.locked]);

        if (!visible || componentData.visible === false) {
            return null;
        }

        const lockedStyles = getLockedStyles(locked || componentData.locked);
        const elementStyles = useMemo(
            () => ({
                position: 'absolute',
                left: position[viewMode]?.x || 0,
                top: position[viewMode]?.y || 0,
                width: size?.width || (type === 'gallery' ? 380 : type === 'icon' ? 50 : 200),
                height: size?.height || (type === 'gallery' ? 300 : type === 'icon' ? 50 : 50),
                zIndex: isDragging ? 1000 : position[viewMode]?.z || 10,
                cursor: locked || componentData.locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.5 : 1,
                ...styles,
                ...lockedStyles,
            }),
            [position, viewMode, size, type, isDragging, locked, componentData.locked, styles, lockedStyles]
        );

        const galleryStyles = useMemo(
            () => ({
                display: styles.display || 'grid',
                gridTemplateColumns: styles.gridTemplateColumns || 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: styles.gap || '10px',
                borderRadius: styles.borderRadius || '8px',
                ...styles,
            }),
            [styles]
        );

        const imageStyles = useMemo(
            () => ({
                width: '100%',
                height: '100%',
                objectFit: styles.objectFit || 'cover',
                objectPosition: styles.objectPosition || 'center',
                borderRadius: styles.borderRadius || '8px',
                border: styles.border || 'none',
                boxShadow: styles.boxShadow || 'none',
                filter: styles.filter || 'none',
            }),
            [styles]
        );

        return (
            <div
                className={`lpb-child-element ${isSelected ? 'lpb-child-element-selected' : ''} ${
                    isDragging ? 'lpb-child-element-dragging' : ''
                } ${locked || componentData.locked ? 'lpb-element-locked' : ''}`}
                style={elementStyles}
                onClick={handleClick}
            >
                <div ref={dragRef}>
                    {type === 'gallery' ? (
                        <div className="lpb-gallery" style={galleryStyles}>
                            {(componentData.images || []).map((imageUrl, index) => (
                                <img
                                    key={index}
                                    src={imageUrl || 'https://via.placeholder.com/150?text=Image+Error'}
                                    alt={`Gallery image ${index + 1}`}
                                    style={imageStyles}
                                    loading="lazy"
                                />
                            ))}
                            {(!componentData.images || componentData.images.length === 0) && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: '#9ca3af',
                                        textAlign: 'center',
                                    }}
                                >
                                    <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '8px' }} />
                                    <p>Chưa có ảnh trong thư viện</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        renderComponentContent(type, componentData, styles, [], true, onSelectChild, parentId, id)
                    )}
                </div>
                {(locked || componentData.locked) && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            zIndex: 10001,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            pointerEvents: 'none',
                        }}
                    >
                        <i className="fas fa-lock" />
                    </div>
                )}
                {isSelected && (
                    <button
                        onClick={handleDelete}
                        style={{
                            position: 'absolute',
                            top: '2px',
                            left: '2px',
                            zIndex: 10002,
                            borderRadius: '50%',
                            background: '#ff7b7b',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '16px',
                            cursor: 'pointer',
                            padding: '6px',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <i className="fas fa-trash-alt" />
                    </button>
                )}
            </div>
        );
    }
);

/**
 * Element component for rendering sections, popups, or other canvas elements
 * @param {Object} props - Component props
 */
const Element = React.memo(
    ({
         element,
         isSelected,
         onSelectElement,
         onUpdatePosition,
         viewMode,
         zoomLevel,
         gridSize,
         onContextMenu,
         canvasBounds,
         canvasRef,
         onSelectChild,
         selectedChildId,
         onAddChild,
         onUpdateChildPosition,
         onMoveChild,
         showGrid,
         setDragPreview,
         visibleElements = [],
         onCloseElement,
         onSaveTemplate,
         onToggleVisibility,
         onEditElement,
         onMoveElementUp,
         onMoveElementDown,
         onDeleteElement,
         onDeleteChild,
     }) => {
        // Destructure element props with defaults
        const {
            id,
            type,
            componentData = {},
            position = {},
            size = { width: viewMode === 'mobile' ? 375 : 1200, height: 400 },
            styles = {},
            children = [],
            visible = true,
            locked = false,
        } = element;

        // Hooks - All hooks are called at the top level to avoid Hook order issues
        const elementRef = useRef(null);
        const containerRef = useRef(null);
        const [{ isDragging }, drag, preview] = useDrag({
            type: ItemTypes.EXISTING_ELEMENT,
            canDrag: () => !locked && type !== 'section' && type !== 'popup',
            item: () => {
                if (locked) {
                    toast.warning('Element đã bị khóa!');
                    return null;
                }
                return { id, elementSize: size, elementPosition: position[viewMode] || { x: 0, y: 0 }, isExisting: true };
            },
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }, [id, size, position, viewMode, locked, type]);

        const snapPoints = useMemo(
            () => {
                const points = [
                    { x: 0, y: 0 },
                    { x: size.width, y: size.height },
                    { x: size.width / 2, y: size.height / 2 },
                ];
                children.forEach((child) => {
                    const bounds = getElementBounds(child);
                    points.push(
                        { x: bounds.left, y: bounds.top },
                        { x: bounds.right, y: bounds.bottom },
                        { x: bounds.centerX, y: bounds.centerY },
                    );
                });
                return points;
            },
            [size, children]
        );

        const [{ isOverContainer, canDropContainer }, dropSection] = useDrop({
            accept: [ItemTypes.ELEMENT, ItemTypes.CHILD_ELEMENT],
            canDrop: (item, monitor) => {
                if (type !== 'section' || componentData?.structure !== 'ladi-standard') return false;
                if (monitor.getItemType() === ItemTypes.CHILD_ELEMENT && item.parentId && item.parentId !== id) return false;
                return true;
            },
            drop: (item, monitor) => {
                if (!monitor.canDrop() || !containerRef.current) return { moved: false };
                const clientOffset = monitor.getClientOffset();
                if (!clientOffset) return { moved: false };
                const pos = getCanvasPosition(clientOffset.x, clientOffset.y, containerRef.current, zoomLevel);
                const snapped = snapToGrid(pos.x, pos.y, showGrid ? gridSize : Infinity, snapPoints);
                if (monitor.getItemType() === ItemTypes.ELEMENT) {
                    const newId = `${item.id}-${Date.now()}`;
                    const newChild = {
                        id: newId,
                        type: item.json.type,
                        componentData: item.json.componentData || {},
                        position: { [viewMode]: snapped, desktop: snapped, tablet: snapped, mobile: snapped },
                        size: item.json.size || (item.json.type === 'gallery' ? { width: 380, height: 300 } : { width: 200, height: 50 }),
                        styles: item.json.styles || {},
                        children: [],
                        visible: true,
                        locked: false,
                    };
                    onAddChild(id, newChild);
                    toast.success('Đã thêm thành phần con vào section!');
                    setDragPreview(null);
                    return { moved: true, newPosition: snapped };
                } else if (monitor.getItemType() === ItemTypes.CHILD_ELEMENT) {
                    if (item.parentId === id) {
                        onUpdateChildPosition(id, item.childId, snapped);
                        toast.success('Đã di chuyển thành phần con trong section!');
                    } else {
                        onMoveChild(item.parentId, item.childId, id, snapped);
                        toast.success('Đã di chuyển thành phần con sang section khác!');
                    }
                    setDragPreview(null);
                    return { moved: true, newPosition: snapped };
                }
                setDragPreview(null);
                return { moved: false };
            },
            collect: (monitor) => ({ isOverContainer: monitor.isOver(), canDropContainer: monitor.canDrop() }),
        }, [id, type, componentData, viewMode, zoomLevel, gridSize, showGrid, onAddChild, onUpdateChildPosition, onMoveChild]);

        const [{ isOverPopup, canDropPopup }, dropPopup] = useDrop({
            accept: [ItemTypes.ELEMENT, ItemTypes.CHILD_ELEMENT],
            canDrop: () => type === 'popup',
            drop: (item, monitor) => {
                if (!containerRef.current) return { moved: false };
                const clientOffset = monitor.getClientOffset();
                if (!clientOffset) return { moved: false };
                const pos = getCanvasPosition(clientOffset.x, clientOffset.y, containerRef.current, zoomLevel);
                const snapped = snapToGrid(pos.x, pos.y, showGrid ? gridSize : Infinity, snapPoints);
                if (monitor.getItemType() === ItemTypes.ELEMENT) {
                    const newId = `${item.id}-${Date.now()}`;
                    const newChild = {
                        id: newId,
                        type: item.json.type,
                        componentData: item.json.componentData || {},
                        position: { [viewMode]: snapped, desktop: snapped, tablet: snapped, mobile: snapped },
                        size: item.json.size || (item.json.type === 'gallery' ? { width: 380, height: 300 } : { width: 200, height: 50 }),
                        styles: item.json.styles || {},
                        children: [],
                        visible: true,
                        locked: false,
                    };
                    onAddChild(id, newChild);
                    toast.success('Đã thêm thành phần con vào popup!');
                    setDragPreview(null);
                    return { moved: true, newPosition: snapped };
                } else if (monitor.getItemType() === ItemTypes.CHILD_ELEMENT) {
                    if (item.parentId === id) {
                        onUpdateChildPosition(id, item.childId, snapped);
                        toast.success('Đã di chuyển thành phần con trong popup!');
                    } else {
                        onMoveChild(item.parentId, item.childId, id, snapped);
                        toast.success('Đã di chuyển thành phần con sang popup khác!');
                    }
                    setDragPreview(null);
                    return { moved: true, newPosition: snapped };
                }
                setDragPreview(null);
                return { moved: false };
            },
            collect: (monitor) => ({ isOverPopup: monitor.isOver(), canDropPopup: monitor.canDrop() }),
        }, [id, type, viewMode, zoomLevel, gridSize, showGrid, onAddChild, onUpdateChildPosition, onMoveChild]);

        const lockedStyles = getLockedStyles(locked);
        const animationStyles = useMemo(
            () => ({
                animation:
                    componentData.animation?.onLoad
                        ? `${componentData.animation.onLoad} ${componentData.animation?.duration || 1000}ms ease`
                        : componentData.animation?.type && type !== 'gallery'
                            ? `${componentData.animation.type} ${componentData.animation?.duration || 1000}ms ease ${componentData.animation?.delay || 0}ms ${componentData.animation?.repeat ? 'infinite' : ''}`
                            : 'none',
            }),
            [componentData.animation, type]
        );

        const commonElementStyles = useMemo(
            () => ({
                position: 'absolute',
                top: position[viewMode]?.y || 0,
                width: type === 'gallery' ? size?.width || 380 : viewMode === 'mobile' ? 375 : size?.width || 1200,
                height: type === 'gallery' ? size?.height || 300 : size?.height || 400,
                left: type === 'gallery' ? position[viewMode]?.x || 0 : '50%',
                transform: type !== 'gallery' ? 'translateX(-50%)' : 'none',
                zIndex: position[viewMode]?.z || 1,
                opacity: isDragging ? 0.5 : 1,
                cursor: locked ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                ...styles,
                ...lockedStyles,
                ...animationStyles,
            }),
            [position, viewMode, size, type, isDragging, locked, styles, lockedStyles, animationStyles]
        );

        const sectionStyles = useMemo(
            () => ({
                position: 'absolute',
                top: position[viewMode]?.y || 0,
                width: viewMode === 'mobile' ? '375px' : '1200px',
                height: size.height,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: position[viewMode]?.z || 1,
                userSelect: 'none',
                background: componentData.backgroundType === 'gradient' ? styles.background : 'none',
                border: styles.border || 'none',
                borderRadius: styles.borderRadius || '0px',
                boxShadow: styles.boxShadow || 'none',
                ...animationStyles,
                ...lockedStyles,
            }),
            [position, viewMode, size, componentData, styles, animationStyles, lockedStyles]
        );

        const popupStyles = useMemo(
            () => ({
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: viewMode === 'mobile' ? '90%' : size?.width || 600,
                maxWidth: viewMode === 'mobile' ? '90%' : '600px',
                minHeight: size?.height || 400,
                maxHeight: '90vh',
                zIndex: 1001,
                background: componentData.background || 'rgba(255, 255, 255, 0.95)',
                borderRadius: componentData.borderRadius || '12px',
                boxShadow: isSelected ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 3px #3b82f6' : '0 8px 32px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
                opacity: 1,
                transformOrigin: 'center',
                cursor: locked ? 'not-allowed' : 'default',
                ...styles,
                ...lockedStyles,
                ...animationStyles,
            }),
            [viewMode, size, componentData, isSelected, styles, lockedStyles, animationStyles]
        );

        const galleryStyles = useMemo(
            () => ({
                display: styles.display || 'grid',
                gridTemplateColumns: styles.gridTemplateColumns || 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: styles.gap || '10px',
                borderRadius: styles.borderRadius || '8px',
                ...styles,
            }),
            [styles]
        );

        const imageStyles = useMemo(
            () => ({
                width: '100%',
                height: '100%',
                objectFit: styles.objectFit || 'cover',
                objectPosition: styles.objectPosition || 'center',
                borderRadius: styles.borderRadius || '8px',
                border: styles.border || 'none',
                boxShadow: styles.boxShadow || 'none',
                filter: styles.filter || 'none',
            }),
            [styles]
        );

        // Effects
        useEffect(() => {
            preview(getEmptyImage(), { captureDraggingState: true });
        }, [preview]);

        useEffect(() => {
            if (type === 'section' && componentData?.structure === 'ladi-standard') {
                dropSection(containerRef);
            } else if (type === 'popup') {
                dropPopup(containerRef);
            }
        }, [dropSection, dropPopup, type, componentData]);

        // Event Handlers
        const handleMouseDown = useCallback(
            (e) => {
                if (locked) {
                    toast.warning('Element đã bị khóa!');
                    return;
                }
                if (!e.target.closest('button')) {
                    e.stopPropagation();
                    if (typeof onSelectElement === 'function') {
                        onSelectElement([id], e.ctrlKey);
                    }
                    onSelectChild(id, null);
                }
            },
            [id, locked, onSelectElement, onSelectChild]
        );

        const handleClick = useCallback(
            (e) => {
                e.stopPropagation();
                if (componentData.events?.onClick) {
                    eventController.handleEvent(componentData.events.onClick, id, true);
                }
            },
            [id, componentData.events]
        );

        const handleContextMenu = useCallback(
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(id, { x: e.clientX, y: e.clientY });
            },
            [id, onContextMenu]
        );

        // Render Logic
        if (!visible) {
            return null;
        }

        const isPopup = type === 'popup';
        const shouldShowElement = type === 'section' || isSelected || visibleElements.includes(id);
        if (isPopup && !shouldShowElement) {
            return null;
        }

        if (type === 'section' && componentData?.structure === 'ladi-standard') {
            return (
                <div
                    ref={elementRef}
                    data-element-id={id}
                    className={`lpb-canvas-element ${isSelected ? 'lpb-canvas-element-selected' : ''} ${locked ? 'lpb-element-locked' : ''}`}
                    style={sectionStyles}
                    onMouseDown={locked ? undefined : handleMouseDown}
                    onContextMenu={handleContextMenu}
                >
                    {locked && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '-18px',
                                right: '-18px',
                                zIndex: 10001,
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                pointerEvents: 'none',
                            }}
                        >
                            <i className="fas fa-lock" /> Section Locked
                        </div>
                    )}
                    <div className="ladi-section" style={{ width: '100%', height: '100%' }}>
                        <div
                            className="ladi-section-background"
                            style={{
                                backgroundColor: componentData.backgroundType === 'color' ? styles.backgroundColor || 'transparent' : 'none',
                                backgroundImage: componentData.backgroundType === 'image' && componentData.backgroundImage ? `url(${componentData.backgroundImage})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: styles.backgroundPosition || 'center',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 0,
                            }}
                        />
                        <div
                            className="ladi-overlay"
                            style={{
                                backgroundColor: componentData.overlayColor || 'transparent',
                                opacity: componentData.overlayOpacity || 0,
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 0,
                            }}
                        />
                        <div
                            ref={containerRef}
                            className={`ladi-container ${isOverContainer && canDropContainer ? 'lpb-child-element-hover' : ''}`}
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                padding: styles.padding || '20px',
                                width: '100%',
                                height: '100%',
                                border: isOverContainer && canDropContainer ? '2px dashed #2563eb' : 'none',
                            }}
                        >
                            {children.map((child) => (
                                <ChildElement
                                    key={child.id}
                                    parentId={id}
                                    id={child.id}
                                    type={child.type}
                                    componentData={child.componentData || {}}
                                    styles={child.styles || {}}
                                    position={child.position || {}}
                                    size={child.size || (child.type === 'gallery' ? { width: 380, height: 300 } : { width: 200, height: 50 })}
                                    visible={child.visible !== false}
                                    locked={child.locked || false}
                                    isSelected={selectedChildId === child.id}
                                    onSelectChild={onSelectChild}
                                    zoomLevel={zoomLevel}
                                    gridSize={gridSize}
                                    showGrid={showGrid}
                                    onUpdateChildPosition={onUpdateChildPosition}
                                    onMoveChild={onMoveChild}
                                    viewMode={viewMode}
                                    onDeleteChild={onDeleteChild}
                                />
                            ))}
                        </div>
                    </div>
                    {isSelected && (
                        <SectionToolkit
                            element={element}
                            position={{ x: 0, y: 0 }}
                            onEdit={() => onEditElement(id)}
                            onSaveTemplate={onSaveTemplate}
                            onMoveUp={() => onMoveElementUp(id)}
                            onMoveDown={() => onMoveElementDown(id)}
                            onToggleVisibility={() => onToggleVisibility(id)}
                            onDelete={() => onDeleteElement(id)}
                        />
                    )}
                </div>
            );
        }

        if (type === 'popup') {
            return (
                <>
                    <div
                        className="lpb-popup-backdrop"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1000,
                            pointerEvents: shouldShowElement ? 'auto' : 'none',
                            opacity: shouldShowElement ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onCloseElement === 'function') {
                                onCloseElement(id);
                                eventController.dispatch('element-close', { elementId: id });
                            }
                        }}
                    />
                    <div
                        ref={elementRef}
                        data-element-id={id}
                        className={`lpb-popup-container ${isSelected ? 'lpb-popup-selected' : ''} ${locked ? 'lpb-element-locked' : ''}`}
                        style={popupStyles}
                        onMouseDown={locked ? undefined : handleMouseDown}
                        onContextMenu={handleContextMenu}
                    >
                        <div
                            className="lpb-popup-header"
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                {componentData.title || 'Popup Title'}
                            </h3>
                            <button
                                className="lpb-popup-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof onCloseElement === 'function') {
                                        onCloseElement(id);
                                        eventController.dispatch('element-close', { elementId: id });
                                    }
                                }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                    color: '#6b7280',
                                }}
                            >
                                <i className="fas fa-times" style={{ fontSize: '14px' }} />
                            </button>
                        </div>
                        <div
                            ref={containerRef}
                            className={`lpb-popup-content ${isOverPopup && canDropPopup ? 'lpb-popup-dropzone-active' : ''}`}
                            style={{
                                position: 'relative',
                                flex: 1,
                                padding: componentData.padding || '20px',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                minHeight: '200px',
                                border: isOverPopup && canDropPopup ? '2px dashed #2563eb' : 'none',
                                background: isOverPopup && canDropPopup ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {children.length === 0 && (
                                <div
                                    className="lpb-popup-empty"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '200px',
                                        color: '#9ca3af',
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                    }}
                                >
                                    <i
                                        className="fas fa-hand-pointer"
                                        style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3, color: '#d1d5db' }}
                                    />
                                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>
                                        Kéo thả elements vào đây
                                    </p>
                                    <small style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        Popup có thể chứa bất kỳ element nào
                                    </small>
                                </div>
                            )}
                            {children.map((child) => (
                                <ChildElement
                                    key={child.id}
                                    parentId={id}
                                    id={child.id}
                                    type={child.type}
                                    componentData={child.componentData || {}}
                                    styles={child.styles || {}}
                                    position={child.position || {}}
                                    size={child.size || (child.type === 'gallery' ? { width: 380, height: 300 } : { width: 200, height: 50 })}
                                    visible={child.visible !== false}
                                    locked={child.locked || false}
                                    isSelected={selectedChildId === child.id}
                                    onSelectChild={onSelectChild}
                                    zoomLevel={zoomLevel}
                                    gridSize={gridSize}
                                    showGrid={showGrid}
                                    onUpdateChildPosition={onUpdateChildPosition}
                                    onMoveChild={onMoveChild}
                                    viewMode={viewMode}
                                    onDeleteChild={onDeleteChild}
                                />
                            ))}
                        </div>
                        {locked && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    zIndex: 10001,
                                    background: 'rgba(0,0,0,0.7)',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    pointerEvents: 'none',
                                }}
                            >
                                <i className="fas fa-lock" /> Locked
                            </div>
                        )}
                    </div>
                </>
            );
        }

        return (
            <div
                ref={(node) => {
                    elementRef.current = node;
                    if (!locked && type !== 'section' && type !== 'popup') {
                        drag(node);
                    }
                }}
                data-element-id={id}
                className={`lpb-canvas-element ${isSelected ? 'lpb-canvas-element-selected' : ''} ${isDragging ? 'lpb-canvas-element-dragging' : ''} ${locked ? 'lpb-element-locked' : ''}`}
                style={commonElementStyles}
                onMouseDown={locked ? undefined : handleMouseDown}
                onContextMenu={handleContextMenu}
                onClick={handleClick}
            >
                {locked && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            zIndex: 10001,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            pointerEvents: 'none',
                        }}
                    >
                        <i className="fas fa-lock" /> Locked
                    </div>
                )}
                {type === 'gallery' ? (
                    <div className="lpb-gallery" style={galleryStyles}>
                        {(componentData.images || []).map((imageUrl, index) => (
                            <img
                                key={index}
                                src={imageUrl || 'https://via.placeholder.com/150?text=Image+Error'}
                                alt={`Gallery image ${index + 1}`}
                                style={imageStyles}
                                loading="lazy"
                            />
                        ))}
                        {(!componentData.images || componentData.images.length === 0) && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                }}
                            >
                                <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '8px' }} />
                                <p>Chưa có ảnh trong thư viện</p>
                            </div>
                        )}
                    </div>
                ) : (
                    renderComponentContent(type, componentData, styles, children, true, onSelectChild, id)
                )}
            </div>
        );
    }
);

// PropTypes for ChildElement
ChildElement.propTypes = {
    parentId: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    componentData: PropTypes.shape({
        locked: PropTypes.bool,
        visible: PropTypes.bool,
        events: PropTypes.shape({
            onClick: PropTypes.object,
        }),
        images: PropTypes.arrayOf(PropTypes.string),
    }),
    styles: PropTypes.object,
    isSelected: PropTypes.bool.isRequired,
    onSelectChild: PropTypes.func.isRequired,
    position: PropTypes.object.isRequired,
    size: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
    }),
    viewMode: PropTypes.oneOf(['desktop', 'tablet', 'mobile']).isRequired,
    visible: PropTypes.bool,
    locked: PropTypes.bool,
    onDeleteChild: PropTypes.func.isRequired,
};

// PropTypes for Element
Element.propTypes = {
    element: PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        componentData: PropTypes.shape({
            structure: PropTypes.string,
            backgroundType: PropTypes.string,
            backgroundImage: PropTypes.string,
            backgroundColor: PropTypes.string,
            overlayColor: PropTypes.string,
            overlayOpacity: PropTypes.number,
            background: PropTypes.string,
            borderRadius: PropTypes.string,
            padding: PropTypes.string,
            animation: PropTypes.shape({
                onLoad: PropTypes.string,
                type: PropTypes.string,
                duration: PropTypes.number,
                delay: PropTypes.number,
                repeat: PropTypes.bool,
            }),
            events: PropTypes.shape({
                onClick: PropTypes.object,
            }),
            title: PropTypes.string,
        }),
        position: PropTypes.object,
        size: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
        }),
        styles: PropTypes.object,
        children: PropTypes.array,
        visible: PropTypes.bool,
        locked: PropTypes.bool,
    }).isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelectElement: PropTypes.func.isRequired,
    onUpdatePosition: PropTypes.func.isRequired,
    viewMode: PropTypes.oneOf(['desktop', 'tablet', 'mobile']).isRequired,
    zoomLevel: PropTypes.number.isRequired,
    gridSize: PropTypes.number.isRequired,
    onContextMenu: PropTypes.func.isRequired,
    canvasBounds: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    canvasRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    onSelectChild: PropTypes.func.isRequired,
    selectedChildId: PropTypes.string,
    onAddChild: PropTypes.func.isRequired,
    onUpdateChildPosition: PropTypes.func.isRequired,
    onMoveChild: PropTypes.func.isRequired,
    showGrid: PropTypes.bool.isRequired,
    setDragPreview: PropTypes.func.isRequired,
    visibleElements: PropTypes.arrayOf(PropTypes.string),
    onCloseElement: PropTypes.func.isRequired,
    onSaveTemplate: PropTypes.func.isRequired,
    onToggleVisibility: PropTypes.func.isRequired,
    onEditElement: PropTypes.func.isRequired,
    onMoveElementUp: PropTypes.func.isRequired,
    onMoveElementDown: PropTypes.func.isRequired,
    onDeleteElement: PropTypes.func.isRequired,
    onDeleteChild: PropTypes.func.isRequired,
};

export { ChildElement, Element };