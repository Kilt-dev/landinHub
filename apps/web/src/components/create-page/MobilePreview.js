import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import './MobilePreview.css';

/**
 * Mobile Preview Component
 * Shows realistic mobile device preview with controls
 */

const DEVICE_PRESETS = {
    iphone13: {
        name: 'iPhone 13',
        width: 390,
        height: 844,
        ratio: 390 / 844
    },
    iphone13mini: {
        name: 'iPhone 13 Mini',
        width: 375,
        height: 812,
        ratio: 375 / 812
    },
    pixel5: {
        name: 'Google Pixel 5',
        width: 393,
        height: 851,
        ratio: 393 / 851
    },
    galaxyS21: {
        name: 'Samsung Galaxy S21',
        width: 384,
        height: 854,
        ratio: 384 / 854
    },
    default: {
        name: 'Mobile (375px)',
        width: 375,
        height: 667,
        ratio: 375 / 667
    }
};

const MobilePreview = ({
    pageData,
    onClose,
    onEditElement,
    renderHTML
}) => {
    const [device, setDevice] = useState('default');
    const [orientation, setOrientation] = useState('portrait'); // portrait | landscape
    const [scale, setScale] = useState(1);
    const [showGrid, setShowGrid] = useState(false);
    const [showSafeArea, setShowSafeArea] = useState(true);

    const currentDevice = DEVICE_PRESETS[device];

    // Calculate scale to fit in viewport
    useEffect(() => {
        const calculateFitScale = () => {
            const viewportWidth = window.innerWidth - 400; // Sidebar space
            const viewportHeight = window.innerHeight - 200; // Header/footer space

            const deviceWidth = orientation === 'portrait' ? currentDevice.width : currentDevice.height;
            const deviceHeight = orientation === 'portrait' ? currentDevice.height : currentDevice.width;

            const scaleX = viewportWidth / deviceWidth;
            const scaleY = viewportHeight / deviceHeight;

            const fitScale = Math.min(scaleX, scaleY, 1); // Max 1x (100%)
            setScale(fitScale);
        };

        calculateFitScale();
        window.addEventListener('resize', calculateFitScale);
        return () => window.removeEventListener('resize', calculateFitScale);
    }, [device, orientation, currentDevice]);

    const handleDeviceChange = useCallback((deviceId) => {
        setDevice(deviceId);
        toast.info(`📱 Chuyển sang ${DEVICE_PRESETS[deviceId].name}`);
    }, []);

    const toggleOrientation = useCallback(() => {
        setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
        toast.info(orientation === 'portrait' ? '🔄 Chế độ ngang' : '🔄 Chế độ dọc');
    }, [orientation]);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.1, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.1, 0.3));
    }, []);

    const handleZoomReset = useCallback(() => {
        setScale(1);
    }, []);

    const deviceWidth = orientation === 'portrait' ? currentDevice.width : currentDevice.height;
    const deviceHeight = orientation === 'portrait' ? currentDevice.height : currentDevice.width;

    return (
        <div className="mobile-preview-overlay">
            <div className="mobile-preview-container">
                {/* Header with controls */}
                <div className="mobile-preview-header">
                    <div className="preview-header-left">
                        <h3>📱 Mobile Preview</h3>
                        <span className="device-info">
                            {currentDevice.name} · {deviceWidth}×{deviceHeight}px
                        </span>
                    </div>

                    <div className="preview-header-controls">
                        {/* Device selector */}
                        <select
                            className="device-selector"
                            value={device}
                            onChange={(e) => handleDeviceChange(e.target.value)}
                        >
                            {Object.entries(DEVICE_PRESETS).map(([id, preset]) => (
                                <option key={id} value={id}>{preset.name}</option>
                            ))}
                        </select>

                        {/* Orientation toggle */}
                        <button
                            className="preview-btn"
                            onClick={toggleOrientation}
                            title={orientation === 'portrait' ? 'Xoay ngang' : 'Xoay dọc'}
                        >
                            <i className={`fas fa-mobile-alt ${orientation === 'landscape' ? 'fa-rotate-90' : ''}`}></i>
                        </button>

                        {/* Zoom controls */}
                        <div className="zoom-controls">
                            <button className="preview-btn" onClick={handleZoomOut} title="Thu nhỏ">
                                <i className="fas fa-search-minus"></i>
                            </button>
                            <span className="zoom-level">{Math.round(scale * 100)}%</span>
                            <button className="preview-btn" onClick={handleZoomIn} title="Phóng to">
                                <i className="fas fa-search-plus"></i>
                            </button>
                            <button className="preview-btn" onClick={handleZoomReset} title="Reset zoom">
                                <i className="fas fa-redo"></i>
                            </button>
                        </div>

                        {/* Grid toggle */}
                        <button
                            className={`preview-btn ${showGrid ? 'active' : ''}`}
                            onClick={() => setShowGrid(!showGrid)}
                            title="Hiện/ẩn lưới"
                        >
                            <i className="fas fa-th"></i>
                        </button>

                        {/* Safe area toggle */}
                        <button
                            className={`preview-btn ${showSafeArea ? 'active' : ''}`}
                            onClick={() => setShowSafeArea(!showSafeArea)}
                            title="Vùng an toàn"
                        >
                            <i className="fas fa-crop"></i>
                        </button>

                        {/* Close */}
                        <button className="preview-btn close-btn" onClick={onClose} title="Đóng">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Device frame */}
                <div className="mobile-preview-body">
                    <div
                        className={`device-frame ${orientation}`}
                        style={{
                            transform: `scale(${scale})`,
                            width: `${deviceWidth}px`,
                            height: `${deviceHeight}px`
                        }}
                    >
                        {/* Device notch (for iPhone) */}
                        {device.startsWith('iphone') && orientation === 'portrait' && (
                            <div className="device-notch"></div>
                        )}

                        {/* Safe area guides */}
                        {showSafeArea && (
                            <>
                                <div className="safe-area-top"></div>
                                <div className="safe-area-bottom"></div>
                            </>
                        )}

                        {/* Grid overlay */}
                        {showGrid && (
                            <div className="grid-overlay">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="grid-line"></div>
                                ))}
                            </div>
                        )}

                        {/* Actual content */}
                        <div className="device-screen">
                            <div
                                className="mobile-content"
                                dangerouslySetInnerHTML={{ __html: renderHTML(pageData, 'mobile') }}
                            />
                        </div>

                        {/* Home indicator (for newer iPhones) */}
                        {device.startsWith('iphone') && orientation === 'portrait' && (
                            <div className="home-indicator"></div>
                        )}
                    </div>
                </div>

                {/* Footer with tips */}
                <div className="mobile-preview-footer">
                    <div className="preview-tips">
                        <i className="fas fa-lightbulb"></i>
                        <span>
                            💡 Tips: Kiểm tra text size, button spacing, và image scaling trên mobile
                        </span>
                    </div>

                    <div className="preview-actions">
                        <button className="preview-action-btn">
                            <i className="fas fa-download"></i>
                            Tải ảnh
                        </button>
                        <button className="preview-action-btn primary">
                            <i className="fas fa-external-link-alt"></i>
                            Mở tab mới
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobilePreview;
