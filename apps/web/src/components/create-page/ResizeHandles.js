import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ResizeHandles.css';

/**
 * ResizeHandles Component
 * Provides 8 resize handles (4 corners + 4 edges) for resizing elements
 * Supports Shift key to maintain aspect ratio
 */
const ResizeHandles = ({
    elementId,
    currentSize,
    currentPosition,
    onResize,
    onResizeEnd,
    minWidth = 50,
    minHeight = 50,
    maxWidth = 2000,
    maxHeight = 2000,
    maintainAspectRatio = false,
    zoomLevel = 1
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [startSize, setStartSize] = useState(currentSize);
    const [startPosition, setStartPosition] = useState(currentPosition);
    const [startMousePos, setStartMousePos] = useState({ x: 0, y: 0 });
    const [shiftPressed, setShiftPressed] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(1);

    // Handle keyboard events for Shift key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') {
                setShiftPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Shift') {
                setShiftPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleMouseDown = useCallback((direction) => (e) => {
        e.stopPropagation();
        e.preventDefault();

        setIsResizing(true);
        setResizeDirection(direction);
        setStartSize(currentSize);
        setStartPosition(currentPosition);
        setStartMousePos({ x: e.clientX, y: e.clientY });

        // Calculate aspect ratio for maintaining proportions
        const ratio = currentSize.width / currentSize.height;
        setAspectRatio(ratio);
    }, [currentSize, currentPosition]);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing || !resizeDirection) return;

        e.stopPropagation();
        e.preventDefault();

        const deltaX = (e.clientX - startMousePos.x) / zoomLevel;
        const deltaY = (e.clientY - startMousePos.y) / zoomLevel;

        let newWidth = startSize.width;
        let newHeight = startSize.height;
        let newX = startPosition.x;
        let newY = startPosition.y;

        const shouldMaintainAspectRatio = maintainAspectRatio || shiftPressed;

        // Calculate new dimensions based on resize direction
        switch (resizeDirection) {
            case 'se': // Bottom-right corner
                newWidth = startSize.width + deltaX;
                newHeight = startSize.height + deltaY;
                if (shouldMaintainAspectRatio) {
                    newHeight = newWidth / aspectRatio;
                }
                break;

            case 'sw': // Bottom-left corner
                newWidth = startSize.width - deltaX;
                newHeight = startSize.height + deltaY;
                newX = startPosition.x + deltaX;
                if (shouldMaintainAspectRatio) {
                    newHeight = newWidth / aspectRatio;
                }
                break;

            case 'ne': // Top-right corner
                newWidth = startSize.width + deltaX;
                newHeight = startSize.height - deltaY;
                newY = startPosition.y + deltaY;
                if (shouldMaintainAspectRatio) {
                    newHeight = newWidth / aspectRatio;
                    newY = startPosition.y - (newHeight - startSize.height);
                }
                break;

            case 'nw': // Top-left corner
                newWidth = startSize.width - deltaX;
                newHeight = startSize.height - deltaY;
                newX = startPosition.x + deltaX;
                newY = startPosition.y + deltaY;
                if (shouldMaintainAspectRatio) {
                    newHeight = newWidth / aspectRatio;
                    newY = startPosition.y - (newHeight - startSize.height);
                }
                break;

            case 'e': // Right edge
                newWidth = startSize.width + deltaX;
                break;

            case 'w': // Left edge
                newWidth = startSize.width - deltaX;
                newX = startPosition.x + deltaX;
                break;

            case 'n': // Top edge
                newHeight = startSize.height - deltaY;
                newY = startPosition.y + deltaY;
                break;

            case 's': // Bottom edge
                newHeight = startSize.height + deltaY;
                break;

            default:
                break;
        }

        // Apply min/max constraints
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        // Adjust position if dimensions hit minimum while resizing from left/top
        if (resizeDirection.includes('w') && newWidth === minWidth) {
            newX = startPosition.x + (startSize.width - minWidth);
        }
        if (resizeDirection.includes('n') && newHeight === minHeight) {
            newY = startPosition.y + (startSize.height - minHeight);
        }

        // Call onResize callback
        if (onResize) {
            onResize({
                width: Math.round(newWidth),
                height: Math.round(newHeight),
                x: Math.round(newX),
                y: Math.round(newY)
            });
        }
    }, [
        isResizing,
        resizeDirection,
        startSize,
        startPosition,
        startMousePos,
        zoomLevel,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        maintainAspectRatio,
        shiftPressed,
        aspectRatio,
        onResize
    ]);

    const handleMouseUp = useCallback((e) => {
        if (isResizing) {
            e.stopPropagation();
            e.preventDefault();

            setIsResizing(false);
            setResizeDirection(null);

            if (onResizeEnd) {
                onResizeEnd();
            }
        }
    }, [isResizing, onResizeEnd]);

    // Attach global mouse move and mouse up listeners
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            // Change cursor globally during resize
            document.body.style.cursor = getCursorForDirection(resizeDirection);
            document.body.style.userSelect = 'none';

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp, resizeDirection]);

    const getCursorForDirection = (direction) => {
        const cursors = {
            'se': 'nwse-resize',
            'sw': 'nesw-resize',
            'ne': 'nesw-resize',
            'nw': 'nwse-resize',
            'e': 'ew-resize',
            'w': 'ew-resize',
            'n': 'ns-resize',
            's': 'ns-resize'
        };
        return cursors[direction] || 'default';
    };

    // Render 8 resize handles
    const handles = [
        { direction: 'nw', className: 'corner top-left', cursor: 'nwse-resize' },
        { direction: 'n', className: 'edge top', cursor: 'ns-resize' },
        { direction: 'ne', className: 'corner top-right', cursor: 'nesw-resize' },
        { direction: 'e', className: 'edge right', cursor: 'ew-resize' },
        { direction: 'se', className: 'corner bottom-right', cursor: 'nwse-resize' },
        { direction: 's', className: 'edge bottom', cursor: 'ns-resize' },
        { direction: 'sw', className: 'corner bottom-left', cursor: 'nesw-resize' },
        { direction: 'w', className: 'edge left', cursor: 'ew-resize' }
    ];

    return (
        <div className="resize-handles-container">
            {handles.map((handle) => (
                <div
                    key={handle.direction}
                    className={`resize-handle ${handle.className}`}
                    style={{ cursor: handle.cursor }}
                    onMouseDown={handleMouseDown(handle.direction)}
                />
            ))}

            {/* Show hint when Shift is pressed */}
            {shiftPressed && (
                <div className="resize-hint">
                    🔒 Aspect Ratio Locked
                </div>
            )}
        </div>
    );
};

ResizeHandles.propTypes = {
    elementId: PropTypes.string.isRequired,
    currentSize: PropTypes.shape({
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired
    }).isRequired,
    currentPosition: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired
    }).isRequired,
    onResize: PropTypes.func.isRequired,
    onResizeEnd: PropTypes.func,
    minWidth: PropTypes.number,
    minHeight: PropTypes.number,
    maxWidth: PropTypes.number,
    maxHeight: PropTypes.number,
    maintainAspectRatio: PropTypes.bool,
    zoomLevel: PropTypes.number
};

export default ResizeHandles;
