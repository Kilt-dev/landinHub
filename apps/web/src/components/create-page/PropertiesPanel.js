import React, { useState, useRef } from 'react';
import {
    ChevronRight, ChevronLeft, MousePointer,
    Palette, Zap, Upload, Settings, Trash2, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import ImageManagerModal from './ImageManagerModal'; // Adjust path as needed
import '../../styles/PropertiesPanel.css';

// Định nghĩa các hằng số (tương tự ElementPropertiesPanel để nhất quán)
const COLOR_PRESETS = [
    '#000000', '#ffffff', '#f3f4f6', '#1f2937', '#374151',
    '#667eea', '#764ba2', '#2563eb', '#3b82f6', '#06b6d4',
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b',
    '#ef4444', '#dc2626', '#ec4899', '#a855f7', '#8b5cf6'
];

const GRADIENT_PRESETS = [
    { name: 'Không có', value: '' },
    { name: 'Tím - Hồng', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Xanh dương', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
    { name: 'Xanh lá', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { name: 'Cam - Vàng', value: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' },
    { name: 'Đỏ - Hồng', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
    { name: 'Cầu vồng', value: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)' }
];

const BACKGROUND_SIZE_PRESETS = [
    { name: 'Tự động', value: 'auto' },
    { name: 'Phủ kín', value: 'cover' },
    { name: 'Chứa', value: 'contain' },
    { name: '100% 100%', value: '100% 100%' }
];

const BORDER_RADIUS_PRESETS = [
    { name: 'Không', value: '0px' },
    { name: 'Nhỏ', value: '4px' },
    { name: 'Vừa', value: '8px' },
    { name: 'Lớn', value: '16px' },
    { name: 'Tròn', value: '9999px' }
];

const BOX_SHADOW_PRESETS = [
    { name: 'Không', value: 'none' },
    { name: 'Nhẹ', value: '0 1px 3px rgba(0,0,0,0.12)' },
    { name: 'Vừa', value: '0 4px 6px rgba(0,0,0,0.1)' },
    { name: 'Đậm', value: '0 10px 15px rgba(0,0,0,0.1)' }
];

const PADDING_PRESETS = [
    { name: 'Không', value: '0' },
    { name: 'Nhỏ', value: '8px' },
    { name: 'Vừa', value: '16px' },
    { name: 'Lớn', value: '24px' }
];

const PropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle, pageId }) => {
    const [activeTab, setActiveTab] = useState('design');
    const [imagePreview, setImagePreview] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const fileInputRef = useRef(null);

    if (isCollapsed) {
        return (
            <div className="properties-panel-collapsed">
                <button onClick={onToggle} className="toggle-button" title="Mở thuộc tính">
                    <ChevronLeft size={18} />
                </button>
            </div>
        );
    }

    if (!selectedElement || !selectedElement.json) {
        return (
            <div className="properties-panel">
                <div className="panel-header">
                    <input
                        type="text"
                        value=""
                        placeholder="Thuộc tính"
                        disabled
                        className="panel-title-input"
                    />
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="panel-empty">
                    <MousePointer className="empty-icon" size={48} strokeWidth={1.5} />
                    <p className="empty-text">Chọn một section, element hoặc popup để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const { type, componentData = {}, styles = {}, size = {}, position = {} } = selectedElement.json;

    const handleStyleChange = (property, value) => {
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                styles: {
                    ...selectedElement.json.styles,
                    [property]: value,
                },
            },
        };
        onUpdateElement(updated);
    };

    const handleComponentDataChange = (key, value) => {
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                componentData: {
                    ...selectedElement.json.componentData,
                    [key]: value,
                },
            },
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
                size: {
                    ...selectedElement.json.size,
                    [dimension]: parsedValue,
                },
            },
        };
        onUpdateElement(updated);
    };

    const handlePositionChange = (property, value) => {
        const parsedValue = parseInt(value);
        if (isNaN(parsedValue)) {
            toast.error('Vị trí phải là số');
            return;
        }
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                position: {
                    ...selectedElement.json.position,
                    [property]: parsedValue,
                },
            },
        };
        onUpdateElement(updated);
    };
    const handleImageSelect = (image) => {
        if (!image?.url) {
            toast.error('URL ảnh không hợp lệ');
            return;
        }
        console.log('Selected Image:', image); // Debug
        setImagePreview(image.url);
        handleComponentDataChange('backgroundImage', image.url);
        handleComponentDataChange('backgroundType', 'image');
        handleStyleChange('backgroundImage', `url(${image.url})`);
        handleStyleChange('backgroundSize', 'cover');
        handleStyleChange('backgroundPosition', 'center');
        handleStyleChange('background', 'none');
        handleStyleChange('backgroundColor', 'transparent'); // Đảm bảo không bị ghi đè
        onUpdateElement({
            ...selectedElement,
            json: {
                ...selectedElement.json,
                styles: {
                    ...selectedElement.json.styles,
                    backgroundImage: `url(${image.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    background: 'none',
                    backgroundColor: 'transparent',
                },
                componentData: {
                    ...selectedElement.json.componentData,
                    backgroundImage: image.url,
                    backgroundType: 'image',
                },
            },
        });
        toast.success('Đã chọn ảnh!');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                console.log('Data URL:', reader.result); // Debug
                setImagePreview(reader.result);
                handleComponentDataChange('backgroundImage', reader.result);
                handleComponentDataChange('backgroundType', 'image');
                handleStyleChange('backgroundImage', `url(${reader.result})`);
                handleStyleChange('backgroundSize', 'cover');
                handleStyleChange('backgroundPosition', 'center');
                handleStyleChange('background', 'none');
                handleStyleChange('backgroundColor', 'transparent');
                onUpdateElement({
                    ...selectedElement,
                    json: {
                        ...selectedElement.json,
                        styles: {
                            ...selectedElement.json.styles,
                            backgroundImage: `url(${reader.result})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            background: 'none',
                            backgroundColor: 'transparent',
                        },
                        componentData: {
                            ...selectedElement.json.componentData,
                            backgroundImage: reader.result,
                            backgroundType: 'image',
                        },
                    },
                });
                toast.success('Đã tải ảnh lên thành công!');
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };



    const handleImageRemove = () => {
        setImagePreview(null);
        handleComponentDataChange('backgroundImage', '');
        handleStyleChange('backgroundImage', 'none');
        handleStyleChange('backgroundSize', 'auto');
        handleStyleChange('backgroundPosition', 'center');
        toast.success('Đã xóa ảnh nền!');
    };

    const renderDesignTab = () => {
        const isSection = type === 'section';
        const isPopup = type === 'popup';
        const isText = type === 'text';
        const isButton = type === 'button';
        const isLine = type === 'line';

        return (
            <div className="panel-section">
                <h4 className="section-title">
                    <Palette size={16} strokeWidth={1.5} />
                    Thiết kế
                </h4>
                <div className="input-group">
                    {(isSection || isPopup) && (
                        <>
                            <div>
                                <label className="input-label">Loại nền</label>
                                <select
                                    value={componentData.backgroundType || 'color'}
                                    onChange={(e) => handleComponentDataChange('backgroundType', e.target.value)}
                                    className="input-select"
                                >
                                    <option value="color">Màu đơn</option>
                                    <option value="image">Hình ảnh</option>
                                    <option value="gradient">Gradient</option>
                                </select>
                            </div>

                            {componentData.backgroundType === 'color' && (
                                <div>
                                    <label className="input-label">Màu nền</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={styles.backgroundColor || '#ffffff'}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                            className="color-picker"
                                        />
                                        <input
                                            type="text"
                                            value={styles.backgroundColor || '#ffffff'}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                            className="input-field"
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                    <div className="color-preset-grid">
                                        {COLOR_PRESETS.map((color) => (
                                            <div
                                                key={color}
                                                className={`color-preset-item ${styles.backgroundColor === color ? 'active' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleStyleChange('backgroundColor', color)}
                                                title={color}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {componentData.backgroundType === 'image' && (
                                <>
                                    <div>
                                        <label className="input-label">Ảnh nền</label>
                                        <div className="image-list">
                                            {(imagePreview || componentData.backgroundImage) && (
                                                <div className="image-item">
                                                    <img
                                                        src={imagePreview || componentData.backgroundImage}
                                                        alt="Background Preview"
                                                        onError={(e) => (e.target.src = 'https://via.placeholder.com/64?text=Image+Error')}
                                                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                                                    />
                                                    <button
                                                        onClick={handleImageRemove}
                                                        className="remove-image-btn"
                                                        title="Xóa ảnh nền"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            {!(imagePreview || componentData.backgroundImage) && (
                                                <div className="no-images">
                                                    <ImageIcon size={32} color="#9ca3af" />
                                                    <p>Chưa có ảnh nền</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="upload-btn"
                                        >
                                            <Upload size={16} />
                                            Chọn từ thư viện
                                        </button>

                                        <label className="upload-btn">
                                            <Upload size={16} />
                                            Tải ảnh lên
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        <label className="input-label">Thêm ảnh bằng URL</label>
                                        <input
                                            type="text"
                                            value=""
                                            onChange={(e) => {
                                                const url = e.target.value.trim();
                                                if (url) {
                                                    handleImageSelect({ url });
                                                    e.target.value = '';
                                                }
                                            }}
                                            placeholder="https://example.com/image.jpg"
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="input-label">Kích thước ảnh</label>
                                        <div className="preset-buttons">
                                            {BACKGROUND_SIZE_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.value}
                                                    onClick={() => handleStyleChange('backgroundSize', preset.value)}
                                                    className={`preset-btn ${styles.backgroundSize === preset.value ? 'active' : ''}`}
                                                >
                                                    {preset.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label">Vị trí ảnh nền</label>
                                        <select
                                            value={styles.backgroundPosition || 'center'}
                                            onChange={(e) => handleStyleChange('backgroundPosition', e.target.value)}
                                            className="input-select"
                                        >
                                            <option value="center">Giữa</option>
                                            <option value="top">Trên</option>
                                            <option value="bottom">Dưới</option>
                                            <option value="left">Trái</option>
                                            <option value="right">Phải</option>
                                            <option value="top left">Trên trái</option>
                                            <option value="top right">Trên phải</option>
                                            <option value="bottom left">Dưới trái</option>
                                            <option value="bottom right">Dưới phải</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {componentData.backgroundType === 'gradient' && (
                                <div>
                                    <label className="input-label">Gradient</label>
                                    <div className="gradient-preset-grid">
                                        {GRADIENT_PRESETS.map((gradient, idx) => (
                                            <div
                                                key={idx}
                                                className={`gradient-preset-item ${styles.background === gradient.value ? 'active' : ''}`}
                                                style={{ background: gradient.value }}
                                                onClick={() => handleStyleChange('background', gradient.value)}
                                                title={gradient.name}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={styles.background || 'linear-gradient(90deg, #667eea, #764ba2)'}
                                        onChange={(e) => handleStyleChange('background', e.target.value)}
                                        className="input-field"
                                        placeholder="linear-gradient(90deg, #667eea, #764ba2)"
                                        style={{ marginTop: '8px' }}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="input-label">Lớp phủ (Overlay)</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={componentData.overlayColor || '#000000'}
                                        onChange={(e) => handleComponentDataChange('overlayColor', e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={componentData.overlayColor || '#000000'}
                                        onChange={(e) => handleComponentDataChange('overlayColor', e.target.value)}
                                        className="input-field"
                                        placeholder="#000000"
                                    />
                                </div>
                                <label className="input-label">Độ mờ lớp phủ</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={componentData.overlayOpacity || 0}
                                    onChange={(e) => handleComponentDataChange('overlayOpacity', parseFloat(e.target.value))}
                                    className="input-range"
                                />
                                <span className="range-value">{(componentData.overlayOpacity || 0).toFixed(1)}</span>
                            </div>

                            <div>
                                <label className="input-label">Bo góc (Border Radius)</label>
                                <div className="preset-buttons">
                                    {BORDER_RADIUS_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => handleStyleChange('borderRadius', preset.value)}
                                            className={`preset-btn ${styles.borderRadius === preset.value ? 'active' : ''}`}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Đổ bóng (Box Shadow)</label>
                                <div className="preset-buttons-vertical">
                                    {BOX_SHADOW_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => handleStyleChange('boxShadow', preset.value)}
                                            className={`preset-btn ${styles.boxShadow === preset.value ? 'active' : ''}`}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Padding</label>
                                <div className="preset-buttons">
                                    {PADDING_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => handleStyleChange('padding', preset.value)}
                                            className={`preset-btn ${styles.padding === preset.value ? 'active' : ''}`}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Chiều cao</label>
                                <input
                                    type="range"
                                    min="100"
                                    max="1000"
                                    step="10"
                                    value={parseInt(size.height) || 400}
                                    onChange={(e) => handleSizeChange('height', e.target.value)}
                                    className="input-range"
                                />
                                <span className="range-value">{parseInt(size.height) || 400}px</span>
                            </div>

                            {isPopup && (
                                <div>
                                    <label className="input-label">Chiều rộng</label>
                                    <input
                                        type="range"
                                        min="300"
                                        max="1200"
                                        step="10"
                                        value={parseInt(size.width) || 600}
                                        onChange={(e) => handleSizeChange('width', e.target.value)}
                                        className="input-range"
                                    />
                                    <span className="range-value">{parseInt(size.width) || 600}px</span>
                                </div>
                            )}
                        </>
                    )}

                    {isText && (
                        <>
                            <div>
                                <label className="input-label">Nội dung</label>
                                <textarea
                                    value={componentData.content || ''}
                                    onChange={(e) => handleComponentDataChange('content', e.target.value)}
                                    placeholder="Nhập nội dung văn bản..."
                                    rows={4}
                                    className="input-field"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label className="input-label">Màu chữ</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={styles.color || '#000000'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={styles.color || '#000000'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                        className="input-field"
                                        placeholder="#000000"
                                    />
                                </div>
                                <div className="color-preset-grid">
                                    {COLOR_PRESETS.map((color) => (
                                        <div
                                            key={color}
                                            className={`color-preset-item ${styles.color === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleStyleChange('color', color)}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Kích thước chữ</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="72"
                                    step="1"
                                    value={parseInt(styles.fontSize) || 16}
                                    onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                                    className="input-range"
                                />
                                <span className="range-value">{parseInt(styles.fontSize) || 16}px</span>
                            </div>
                        </>
                    )}

                    {isButton && (
                        <>
                            <div>
                                <label className="input-label">Nội dung</label>
                                <input
                                    type="text"
                                    value={componentData.content || ''}
                                    onChange={(e) => handleComponentDataChange('content', e.target.value)}
                                    placeholder="Nhập nội dung nút..."
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="input-label">Màu nền</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={styles.backgroundColor || '#2563eb'}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={styles.backgroundColor || '#2563eb'}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        className="input-field"
                                        placeholder="#2563eb"
                                    />
                                </div>
                                <div className="color-preset-grid">
                                    {COLOR_PRESETS.map((color) => (
                                        <div
                                            key={color}
                                            className={`color-preset-item ${styles.backgroundColor === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleStyleChange('backgroundColor', color)}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Màu chữ</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={styles.color || '#ffffff'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={styles.color || '#ffffff'}
                                        onChange={(e) => handleStyleChange('color', e.target.value)}
                                        className="input-field"
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {isLine && (
                        <>
                            <div>
                                <label className="input-label">Màu đường</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        value={styles.backgroundColor || '#000000'}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={styles.backgroundColor || '#000000'}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        className="input-field"
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Độ dày</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={parseInt(styles.height) || 2}
                                    onChange={(e) => handleStyleChange('height', `${e.target.value}px`)}
                                    className="input-range"
                                />
                                <span className="range-value">{parseInt(styles.height) || 2}px</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderAnimationTab = () => {
        return (
            <div className="panel-section">
                <h4 className="section-title">
                    <Zap size={16} strokeWidth={1.5} />
                    Hiệu ứng
                </h4>
                <div className="input-group">
                    <div>
                        <label className="input-label">Hiệu ứng</label>
                        <select
                            value={componentData.animation?.type || 'none'}
                            onChange={(e) =>
                                handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    type: e.target.value,
                                })
                            }
                            className="input-select"
                        >
                            <option value="none">Không chọn</option>
                            <option value="fadeIn">Fade In</option>
                            <option value="slideInUp">Slide In Up</option>
                            <option value="zoomIn">Zoom In</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Thời gian (ms)</label>
                        <input
                            type="range"
                            min="100"
                            max="3000"
                            step="100"
                            value={componentData.animation?.duration || 1000}
                            onChange={(e) =>
                                handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    duration: parseInt(e.target.value),
                                })
                            }
                            className="input-range"
                        />
                        <span className="range-value">{componentData.animation?.duration || 1000}ms</span>
                    </div>
                    <div>
                        <label className="input-label">Độ trễ (ms)</label>
                        <input
                            type="range"
                            min="0"
                            max="3000"
                            step="100"
                            value={componentData.animation?.delay || 0}
                            onChange={(e) =>
                                handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    delay: parseInt(e.target.value),
                                })
                            }
                            className="input-range"
                        />
                        <span className="range-value">{componentData.animation?.delay || 0}ms</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderAdvancedTab = () => {
        return (
            <div className="panel-section">
                <h4 className="section-title">
                    <Settings size={16} strokeWidth={1.5} />
                    Nâng cao
                </h4>
                <div className="input-group">
                    <div>
                        <label className="input-label">Vị trí X</label>
                        <input
                            type="number"
                            value={position.x || 0}
                            onChange={(e) => handlePositionChange('x', e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="input-label">Vị trí Y</label>
                        <input
                            type="number"
                            value={position.y || 0}
                            onChange={(e) => handlePositionChange('y', e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="input-label">Z-Index</label>
                        <input
                            type="number"
                            value={styles.zIndex || 0}
                            onChange={(e) => handleStyleChange('zIndex', parseInt(e.target.value))}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="properties-panel">
                <div className="panel-header">
                    <input
                        type="text"
                        value={componentData.title || ''}
                        onChange={(e) => handleComponentDataChange('title', e.target.value)}
                        className="panel-title-input"
                        placeholder={`Tên ${type === 'section' ? 'Section' : type === 'popup' ? 'Popup' : 'Element'}`}
                    />
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="panel-tabs">
                    <button
                        className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}
                        onClick={() => setActiveTab('design')}
                    >
                        Thiết kế
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'animation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('animation')}
                    >
                        Hiệu ứng
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advanced')}
                    >
                        Nâng cao
                    </button>
                </div>

                <div className="panel-content">
                    {activeTab === 'design' && renderDesignTab()}
                    {activeTab === 'animation' && renderAnimationTab()}
                    {activeTab === 'advanced' && renderAdvancedTab()}
                </div>
            </div>

            {(type === 'section' || type === 'popup') && (
                <ImageManagerModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onSelectImage={handleImageSelect}
                    pageId={pageId}
                />
            )}
        </>
    );
};

export default PropertiesPanel;