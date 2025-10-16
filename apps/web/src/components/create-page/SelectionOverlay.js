import React from 'react';

const SelectionOverlay = ({ element, onResize, zoomLevel, canvasBounds }) => {
    if (!element) return null;

    const { id, position, size } = element;

    // Kiểm tra xem position và size có hợp lệ không
    const posX = position?.desktop?.x || 0;
    const posY = position?.desktop?.y || 0;
    const width = size?.width || 200;
    const height = size?.height || 50;

    return (
        <div
            key={id}
            style={{
                position: 'absolute',
                transform: `translate(${posX}px, ${posY}px) scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                width: width,
                height: height,
                border: '2px solid #2563eb',
                pointerEvents: 'none',
                zIndex: 1000,
            }}
        >
            {/* Thêm các handle để resize nếu cần */}
            <div
                style={{
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    background: '#2563eb',
                    bottom: '-5px',
                    right: '-5px',
                    cursor: 'se-resize',
                    pointerEvents: 'auto',
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    // Xử lý sự kiện resize
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = width;
                    const startHeight = height;

                    const onMouseMove = (moveEvent) => {
                        const deltaX = (moveEvent.clientX - startX) / (zoomLevel / 100);
                        const deltaY = (moveEvent.clientY - startY) / (zoomLevel / 100);
                        const newWidth = Math.max(50, startWidth + deltaX);
                        const newHeight = Math.max(50, startHeight + deltaY);
                        onResize({ width: newWidth, height: newHeight });
                    };

                    const onMouseUp = () => {
                        window.removeEventListener('mousemove', onMouseMove);
                        window.removeEventListener('mouseup', onMouseUp);
                    };

                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }}
            />
        </div>
    );
};

export default SelectionOverlay;