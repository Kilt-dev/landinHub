import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Monitor, Globe, Lock, Maximize2, Settings
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../../../styles/ElementPropertiesPanel.css';

const COMMON_IFRAME_SOURCES = [
    {
        name: 'YouTube Video',
        placeholder: 'https://www.youtube.com/embed/VIDEO_ID',
        example: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        name: 'Google Maps',
        placeholder: 'https://www.google.com/maps/embed?pb=...',
        example: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3245676097956!2d106.68441631533464!3d10.786785792313986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1'
    },
    {
        name: 'Google Forms',
        placeholder: 'https://docs.google.com/forms/d/e/.../viewform?embedded=true',
        example: 'https://docs.google.com/forms/d/e/1FAIpQLSf.../viewform?embedded=true'
    },
    {
        name: 'Vimeo Video',
        placeholder: 'https://player.vimeo.com/video/VIDEO_ID',
        example: 'https://player.vimeo.com/video/123456789'
    }
];

const IframePropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle }) => {
    const [activeTab, setActiveTab] = useState('content');

    if (isCollapsed) {
        return (
            <div className="element-properties-panel-collapsed">
                <button onClick={onToggle} className="toggle-button" title="Mở thuộc tính">
                    <ChevronLeft size={18} />
                </button>
            </div>
        );
    }

    if (!selectedElement || !selectedElement.json || selectedElement.json.type !== 'iframe') {
        return (
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">Thuộc tính Iframe</h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="panel-empty">
                    <Monitor className="empty-icon" size={48} strokeWidth={1.5} />
                    <p className="empty-text">Chọn một iframe để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const { componentData = {}, styles = {}, size = {} } = selectedElement.json;

    const handleStyleChange = (property, value) => {
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                styles: { ...styles, [property]: value }
            }
        };
        onUpdateElement(updated);
    };

    const handleComponentDataChange = (key, value) => {
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                componentData: { ...componentData, [key]: value }
            }
        };
        onUpdateElement(updated);
    };

    const handleSizeChange = (dimension, value) => {
        const parsedValue = parseInt(value);
        if (isNaN(parsedValue) || parsedValue < 0) {
            toast.error('Kích thước phải là số dương');
            return;
        }
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                size: { ...size, [dimension]: parsedValue }
            }
        };
        onUpdateElement(updated);
    };

    const handleQuickSetSource = (example) => {
        handleComponentDataChange('src', example);
        toast.success('Đã cập nhật nguồn iframe!');
    };

    const renderContentTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title">
                    <Globe size={16} strokeWidth={1.5} />
                    Nguồn Iframe
                </h4>
                <div className="input-group">
                    <label className="input-label">URL (src)</label>
                    <input
                        type="text"
                        value={componentData.src || ''}
                        onChange={(e) => handleComponentDataChange('src', e.target.value)}
                        placeholder="https://www.youtube.com/embed/..."
                        className="input-field"
                    />
                    <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                        Nhập URL nhúng (embed URL) của video, map, form, v.v.
                    </small>

                    <label className="input-label" style={{ marginTop: '16px' }}>Tiêu đề</label>
                    <input
                        type="text"
                        value={componentData.title || 'Iframe'}
                        onChange={(e) => handleComponentDataChange('title', e.target.value)}
                        placeholder="Mô tả nội dung iframe"
                        className="input-field"
                    />
                </div>

                <h4 className="section-title" style={{ marginTop: '20px' }}>
                    <Monitor size={16} strokeWidth={1.5} />
                    Nguồn nhanh
                </h4>
                <div className="preset-grid">
                    {COMMON_IFRAME_SOURCES.map((source, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickSetSource(source.example)}
                            className="preset-btn"
                            title={source.placeholder}
                        >
                            {source.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Maximize2 size={16} strokeWidth={1.5} />
                    Kích thước
                </h4>
                <div className="input-group">
                    <div className="size-inputs">
                        <div className="size-input-item">
                            <label className="input-label">Chiều rộng</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={size.width || 560}
                                    onChange={(e) => handleSizeChange('width', e.target.value)}
                                    className="input-field"
                                />
                                <span className="input-unit">px</span>
                            </div>
                        </div>
                        <div className="size-input-item">
                            <label className="input-label">Chiều cao</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={size.height || 315}
                                    onChange={(e) => handleSizeChange('height', e.target.value)}
                                    className="input-field"
                                />
                                <span className="input-unit">px</span>
                            </div>
                        </div>
                    </div>

                    <div className="format-buttons" style={{ marginTop: '12px' }}>
                        <button
                            onClick={() => {
                                onUpdateElement({
                                    ...selectedElement,
                                    json: {
                                        ...selectedElement.json,
                                        size: { width: 560, height: 315 }
                                    }
                                });
                                toast.success('Đã đặt kích thước 16:9 (560x315)');
                            }}
                            className="format-btn"
                        >
                            16:9
                        </button>
                        <button
                            onClick={() => {
                                onUpdateElement({
                                    ...selectedElement,
                                    json: {
                                        ...selectedElement.json,
                                        size: { width: 640, height: 480 }
                                    }
                                });
                                toast.success('Đã đặt kích thước 4:3 (640x480)');
                            }}
                            className="format-btn"
                        >
                            4:3
                        </button>
                        <button
                            onClick={() => {
                                onUpdateElement({
                                    ...selectedElement,
                                    json: {
                                        ...selectedElement.json,
                                        size: { width: 400, height: 400 }
                                    }
                                });
                                toast.success('Đã đặt kích thước vuông (400x400)');
                            }}
                            className="format-btn"
                        >
                            1:1
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title">
                    <Lock size={16} strokeWidth={1.5} />
                    Quyền & Bảo mật
                </h4>
                <div className="input-group">
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="allowFullscreen"
                            checked={componentData.allowFullscreen ?? true}
                            onChange={(e) => handleComponentDataChange('allowFullscreen', e.target.checked)}
                        />
                        <label htmlFor="allowFullscreen" className="checkbox-label">
                            Cho phép toàn màn hình
                        </label>
                    </div>

                    <label className="input-label" style={{ marginTop: '16px' }}>
                        Allow (Permissions)
                    </label>
                    <input
                        type="text"
                        value={componentData.allow || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'}
                        onChange={(e) => handleComponentDataChange('allow', e.target.value)}
                        placeholder="accelerometer; autoplay; encrypted-media"
                        className="input-field"
                    />
                    <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                        Các quyền iframe được phép sử dụng (cách nhau bởi dấu chấm phẩy)
                    </small>

                    <label className="input-label" style={{ marginTop: '16px' }}>
                        Loading
                    </label>
                    <select
                        value={componentData.loading || 'lazy'}
                        onChange={(e) => handleComponentDataChange('loading', e.target.value)}
                        className="input-select"
                    >
                        <option value="lazy">Lazy (tải khi cần)</option>
                        <option value="eager">Eager (tải ngay)</option>
                    </select>

                    <label className="input-label" style={{ marginTop: '16px' }}>
                        Frame Border
                    </label>
                    <input
                        type="number"
                        value={componentData.frameBorder ?? 0}
                        onChange={(e) => handleComponentDataChange('frameBorder', parseInt(e.target.value))}
                        className="input-field"
                        min="0"
                        max="10"
                    />
                </div>
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Settings size={16} strokeWidth={1.5} />
                    Giao diện
                </h4>
                <div className="input-group">
                    <label className="input-label">Bo góc (Border Radius)</label>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={parseInt(styles.borderRadius) || 0}
                        onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                        className="input-range"
                    />
                    <span className="range-value">{parseInt(styles.borderRadius) || 0}px</span>

                    <div className="format-buttons">
                        {[0, 4, 8, 12, 16, 24].map(radius => (
                            <button
                                key={radius}
                                onClick={() => handleStyleChange('borderRadius', radius + 'px')}
                                className={`format-btn ${parseInt(styles.borderRadius) === radius ? 'active' : ''}`}
                            >
                                {radius}
                            </button>
                        ))}
                    </div>

                    <label className="input-label" style={{ marginTop: '16px' }}>Viền (Border)</label>
                    <input
                        type="text"
                        value={styles.border || 'none'}
                        onChange={(e) => handleStyleChange('border', e.target.value)}
                        placeholder="2px solid #e5e7eb"
                        className="input-field"
                    />

                    <label className="input-label">Đổ bóng (Box Shadow)</label>
                    <input
                        type="text"
                        value={styles.boxShadow || 'none'}
                        onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                        placeholder="0 4px 6px rgba(0,0,0,0.1)"
                        className="input-field"
                    />

                    <div className="format-buttons">
                        {[
                            { label: 'None', value: 'none' },
                            { label: 'S1', value: '0 2px 4px rgba(0,0,0,0.1)' },
                            { label: 'S2', value: '0 4px 8px rgba(0,0,0,0.15)' },
                            { label: 'S3', value: '0 8px 16px rgba(0,0,0,0.2)' }
                        ].map((shadow, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleStyleChange('boxShadow', shadow.value)}
                                className={`format-btn ${styles.boxShadow === shadow.value ? 'active' : ''}`}
                            >
                                {shadow.label}
                            </button>
                        ))}
                    </div>

                    <label className="input-label" style={{ marginTop: '16px' }}>Độ mờ (Opacity)</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={(parseFloat(styles.opacity) || 1) * 100}
                        onChange={(e) => handleStyleChange('opacity', (parseInt(e.target.value) / 100).toString())}
                        className="input-range"
                    />
                    <span className="range-value">{Math.round((parseFloat(styles.opacity) || 1) * 100)}%</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="element-properties-panel">
            <div className="panel-header">
                <h3 className="panel-title">
                    <Monitor size={18} />
                    Thuộc tính Iframe
                </h3>
                <button onClick={onToggle} className="toggle-button" title="Đóng">
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="panel-tabs">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                >
                    <Globe size={16} />
                    <span>Nội dung</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                >
                    <Settings size={16} />
                    <span>Cài đặt</span>
                </button>
            </div>

            {activeTab === 'content' && renderContentTab()}
            {activeTab === 'settings' && renderSettingsTab()}
        </div>
    );
};

export default IframePropertiesPanel;
