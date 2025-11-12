import React, { useState, useCallback } from 'react';
import { Smartphone, Tablet, Monitor, Eye, Maximize2, RotateCw } from 'lucide-react';
import { toast } from 'react-toastify';
import './ResponsiveToolbarEnhanced.css';

/**
 * Enhanced Responsive Toolbar with Mobile Preview
 */

const BREAKPOINTS = {
    desktop: { width: 1200, label: 'Desktop', icon: Monitor, color: '#2563eb' },
    tablet: { width: 768, label: 'Tablet', icon: Tablet, color: '#f59e0b' },
    mobile: { width: 375, label: 'Mobile', icon: Smartphone, color: '#10b981' }
};

const ResponsiveToolbarEnhanced = ({
    viewMode,
    onViewModeChange,
    onShowMobilePreview,
    pageData,
    zoomLevel,
    onZoomChange
}) => {
    const [showDeviceInfo, setShowDeviceInfo] = useState(false);

    const handleModeChange = useCallback((mode) => {
        onViewModeChange(mode);

        const config = BREAKPOINTS[mode];
        toast.info(
            <div>
                <strong>{config.label}</strong>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {config.width}px · {pageData.elements.length} elements
                </div>
            </div>,
            { icon: React.createElement(config.icon, { size: 20 }) }
        );
    }, [onViewModeChange, pageData]);

    const handleFitToScreen = useCallback(() => {
        if (onZoomChange) {
            onZoomChange(100);
            toast.info('🔍 Zoom reset to 100%');
        }
    }, [onZoomChange]);

    const currentConfig = BREAKPOINTS[viewMode];

    return (
        <div className="responsive-toolbar-enhanced">
            {/* Left section: View mode buttons */}
            <div className="toolbar-section">
                <div className="view-mode-group">
                    {Object.entries(BREAKPOINTS).map(([mode, config]) => {
                        const Icon = config.icon;
                        const isActive = viewMode === mode;

                        return (
                            <button
                                key={mode}
                                className={`view-mode-btn ${isActive ? 'active' : ''}`}
                                onClick={() => handleModeChange(mode)}
                                style={{
                                    '--mode-color': config.color
                                }}
                                title={`${config.label} (${config.width}px)`}
                            >
                                <Icon className="mode-icon" size={18} />
                                <span className="mode-label">{config.label}</span>
                                <span className="mode-width">{config.width}px</span>
                            </button>
                        );
                    })}
                </div>

                {/* Sync indicator */}
                <div className="sync-indicator">
                    <RotateCw size={14} />
                    <span>Auto-sync</span>
                </div>
            </div>

            {/* Center section: Current view info */}
            <div className="toolbar-section toolbar-center">
                <div className="current-view-info">
                    <span className="view-label">Đang xem:</span>
                    <span className="view-name" style={{ color: currentConfig.color }}>
                        {currentConfig.label}
                    </span>
                    <span className="view-dim">{currentConfig.width}px</span>
                </div>

                {viewMode === 'mobile' && (
                    <div className="mobile-tips">
                        <span className="tip-icon">💡</span>
                        <span className="tip-text">Kiểm tra touch targets ≥ 44×44px</span>
                    </div>
                )}
            </div>

            {/* Right section: Actions */}
            <div className="toolbar-section toolbar-actions">
                {/* Mobile preview button - only show when not in mobile mode */}
                {viewMode !== 'mobile' && (
                    <button
                        className="toolbar-action-btn preview-btn"
                        onClick={onShowMobilePreview}
                        title="Xem preview mobile"
                    >
                        <Smartphone size={16} />
                        <span>Mobile Preview</span>
                    </button>
                )}

                {/* Fit to screen */}
                <button
                    className="toolbar-action-btn"
                    onClick={handleFitToScreen}
                    title="Fit to screen (100%)"
                >
                    <Maximize2 size={16} />
                    <span className="zoom-text">{zoomLevel}%</span>
                </button>

                {/* Device info toggle */}
                <button
                    className={`toolbar-action-btn ${showDeviceInfo ? 'active' : ''}`}
                    onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                    title="Thông tin thiết bị"
                >
                    <Eye size={16} />
                </button>
            </div>

            {/* Device info panel (collapsible) */}
            {showDeviceInfo && (
                <div className="device-info-panel">
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Viewport</span>
                            <span className="info-value">{currentConfig.width}px</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Zoom</span>
                            <span className="info-value">{zoomLevel}%</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Elements</span>
                            <span className="info-value">{pageData.elements.length}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Sections</span>
                            <span className="info-value">
                                {pageData.elements.filter(el => el.type === 'section').length}
                            </span>
                        </div>
                    </div>

                    {/* Mobile-specific warnings */}
                    {viewMode === 'mobile' && (
                        <div className="mobile-warnings">
                            <h4>Checklist Mobile:</h4>
                            <ul>
                                <li>✓ Text size ≥ 16px</li>
                                <li>✓ Button height ≥ 44px</li>
                                <li>✓ Spacing giữa elements</li>
                                <li>✓ Images responsive</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResponsiveToolbarEnhanced;
