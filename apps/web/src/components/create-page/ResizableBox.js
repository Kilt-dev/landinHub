import React, { useState } from 'react';

const ResizableBox = ({ bounds, onResize, zoomLevel, handleStyles }) => {
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = (e) => {
        e.stopPropagation();
        setIsResizing(true);
    };

    const handleMouseMove = (e) => {
        if (!isResizing) return;
        console.log('Resizing:', e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
                border: '2px dashed #2563eb',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div
                style={{
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    ...handleStyles?.topLeft,
                }}
                onMouseDown={handleMouseDown}
            />
            <div
                style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    ...handleStyles?.topRight,
                }}
                onMouseDown={handleMouseDown}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -4,
                    left: -4,
                    ...handleStyles?.bottomLeft,
                }}
                onMouseDown={handleMouseDown}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    ...handleStyles?.bottomRight,
                }}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

export default ResizableBox;