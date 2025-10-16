import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronRight, ChevronLeft, Image as ImageIcon, Crop, Palette, Sparkles,
    Upload, Trash2, X, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadImage, getPageImages, getUserImages, deleteImage, validateImageFile, compressImage } from '../../../utils/imageService';
import ImageManagerModal from '../ImageManagerModal'; // Adjust path if needed
import '../../../styles/ElementPropertiesPanel.css';

const IMAGE_FIT_OPTIONS = [
    { name: 'Cover', value: 'cover' },
    { name: 'Contain', value: 'contain' },
    { name: 'Fill', value: 'fill' },
    { name: 'Scale Down', value: 'scale-down' },
    { name: 'None', value: 'none' },
];

const FILTER_PRESETS = [
    { name: 'Không có', value: 'none' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Blur', value: 'blur(5px)' },
    { name: 'Brightness', value: 'brightness(120%)' },
    { name: 'Contrast', value: 'contrast(120%)' },
    { name: 'Saturate', value: 'saturate(150%)' },
    { name: 'Hue Rotate', value: 'hue-rotate(90deg)' },
    { name: 'Invert', value: 'invert(100%)' },
];

const ANIMATION_PRESETS = [
    { name: 'Không chọn', value: 'none' },
    { name: 'bounce', value: 'bounce' },
    { name: 'flash', value: 'flash' },
    { name: 'pulse', value: 'pulse' },
    { name: 'rubberBand', value: 'rubberBand' },
    { name: 'shake', value: 'shake' },
    { name: 'swing', value: 'swing' },
    { name: 'tada', value: 'tada' },
    { name: 'wobble', value: 'wobble' },
    { name: 'bounceIn', value: 'bounceIn' },
    { name: 'bounceInDown', value: 'bounceInDown' },
    { name: 'bounceInLeft', value: 'bounceInLeft' },
    { name: 'bounceInRight', value: 'bounceInRight' },
    { name: 'bounceInUp', value: 'bounceInUp' },
    { name: 'fadeIn', value: 'fadeIn' },
    { name: 'fadeInDown', value: 'fadeInDown' },
    { name: 'fadeInLeft', value: 'fadeInLeft' },
    { name: 'fadeInRight', value: 'fadeInRight' },
    { name: 'fadeInUp', value: 'fadeInUp' },
    { name: 'slideInDown', value: 'slideInDown' },
    { name: 'slideInLeft', value: 'slideInLeft' },
    { name: 'slideInRight', value: 'slideInRight' },
    { name: 'slideInUp', value: 'slideInUp' },
    { name: 'zoomIn', value: 'zoomIn' },
    { name: 'zoomInDown', value: 'zoomInDown' },
    { name: 'zoomInLeft', value: 'zoomInLeft' },
    { name: 'zoomInRight', value: 'zoomInRight' },
    { name: 'zoomInUp', value: 'zoomInUp' }
];

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

const ImagePropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle, pageId }) => {
    const [activeTab, setActiveTab] = useState('image');
    const [showImageEditor, setShowImageEditor] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const fileInputRef = useRef(null);

    if (isCollapsed) {
        return (
            <div className="element-properties-panel-collapsed">
                <button onClick={onToggle} className="toggle-button" title="Mở thuộc tính">
                    <ChevronLeft size={18} />
                </button>
            </div>
        );
    }

    if (!selectedElement || !selectedElement.json || selectedElement.json.type !== 'image') {
        return (
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">Thuộc tính hình ảnh</h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="panel-empty">
                    <ImageIcon className="empty-icon" size={48} strokeWidth={1.5} />
                    <p className="empty-text">Chọn một hình ảnh để chỉnh sửa</p>
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

    const handleImageSelect = (image) => {
        handleComponentDataChange('src', image.url || 'https://via.placeholder.com/300x200?text=Image+Error');
        setShowUploadModal(false);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                const validation = validateImageFile(file);
                if (!validation.valid) {
                    toast.warn(`${file.name}: ${validation.error}`, { position: 'bottom-right' });
                    continue;
                }

                const compressedFile = await compressImage(file);
                const response = await uploadImage(compressedFile, pageId, (progress) => {
                    toast.info(`Đang tải lên ${file.name}: ${progress}%`, { autoClose: false, toastId: file.name });
                });

                if (response.success) {
                    handleComponentDataChange('src', response.data.url);
                    toast.success(`Tải lên ${file.name} thành công`, { position: 'bottom-right' });
                    setShowUploadModal(false);
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                toast.error(
                    error.message.includes('404')
                        ? 'Endpoint upload không tồn tại. Kiểm tra server tại http://localhost:5000/api/images/upload.'
                        : `Lỗi tải lên ${file.name}: ${error.message}`,
                    { position: 'bottom-right' }
                );
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderImageTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <div className="section-header">
                    <h4 className="section-title">
                        <ImageIcon size={16} strokeWidth={1.5} />
                        Nguồn hình ảnh
                    </h4>
                    <button
                        onClick={() => setShowImageEditor(!showImageEditor)}
                        className="toggle-editor-btn"
                    >
                        {showImageEditor ? 'Ẩn Editor' : 'Sửa Hình ảnh'}
                    </button>
                </div>

                {showImageEditor && (
                    <div className="input-group">
                        <div className="image-preview">
                            {componentData.src ? (
                                <img
                                    src={componentData.src}
                                    alt={componentData.alt || 'Image'}
                                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                                />
                            ) : (
                                <ImageIcon size={32} color="#9ca3af" />
                            )}
                        </div>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="upload-btn"
                        >
                            <Upload size={16} />
                            Chọn từ thư viện
                        </button>

                        <label className="input-label">URL Hình ảnh</label>
                        <input
                            type="text"
                            value={componentData.src || ''}
                            onChange={(e) => handleComponentDataChange('src', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="input-field"
                        />

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Crop size={16} strokeWidth={1.5} />
                    Cách hiển thị
                </h4>
                <div className="input-group">
                    <label className="input-label">Object Fit</label>
                    <select
                        value={styles.objectFit || 'cover'}
                        onChange={(e) => handleStyleChange('objectFit', e.target.value)}
                        className="input-select"
                    >
                        {IMAGE_FIT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.name}</option>
                        ))}
                    </select>

                    <label className="input-label">Object Position</label>
                    <input
                        type="text"
                        value={styles.objectPosition || 'center'}
                        onChange={(e) => handleStyleChange('objectPosition', e.target.value)}
                        placeholder="center / top / bottom / left / right"
                        className="input-field"
                    />

                    <div className="size-inputs">
                        <div className="size-input-item">
                            <label className="input-label">Chiều rộng</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={size.width || 200}
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
                                    value={size.height || 200}
                                    onChange={(e) => handleSizeChange('height', e.target.value)}
                                    className="input-field"
                                />
                                <span className="input-unit">px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Palette size={16} strokeWidth={1.5} />
                    Viền & Bo góc
                </h4>
                <div className="input-group">
                    <label className="input-label">Bo góc</label>
                    <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={parseInt(styles.borderRadius) || 0}
                        onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                        className="input-range"
                    />
                    <span className="range-value">{parseInt(styles.borderRadius) || 0}px</span>

                    <div className="format-buttons">
                        {[0, 8, 16, 24, 50, 100].map(radius => (
                            <button
                                key={radius}
                                onClick={() => handleStyleChange('borderRadius', radius === 100 ? '50%' : radius + 'px')}
                                className={`format-btn ${parseInt(styles.borderRadius) === radius || (radius === 100 && styles.borderRadius === '50%') ? 'active' : ''}`}
                            >
                                {radius === 100 ? '●' : radius}
                            </button>
                        ))}
                    </div>

                    <label className="input-label">Viền (Border)</label>
                    <input
                        type="text"
                        value={styles.border || 'none'}
                        onChange={(e) => handleStyleChange('border', e.target.value)}
                        placeholder="2px solid #e5e7eb"
                        className="input-field"
                    />

                    <label className="input-label">Đổ bóng</label>
                    <input
                        type="text"
                        value={styles.boxShadow || 'none'}
                        onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                        placeholder="0 4px 6px rgba(0,0,0,0.1)"
                        className="input-field"
                    />

                    <div className="format-buttons">
                        {['none', '0 2px 4px rgba(0,0,0,0.1)', '0 4px 8px rgba(0,0,0,0.15)', '0 8px 16px rgba(0,0,0,0.2)'].map((shadow, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleStyleChange('boxShadow', shadow)}
                                className={`format-btn ${styles.boxShadow === shadow ? 'active' : ''}`}
                            >
                                {idx === 0 ? 'None' : `S${idx}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEffectsTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title">
                    <Palette size={16} strokeWidth={1.5} />
                    Bộ lọc màu
                </h4>
                <div className="input-group">
                    <div className="preset-grid">
                        {FILTER_PRESETS.map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => handleStyleChange('filter', filter.value)}
                                className={`preset-btn ${styles.filter === filter.value ? 'active' : ''}`}
                            >
                                {filter.name}
                            </button>
                        ))}
                    </div>

                    <label className="input-label">Custom Filter</label>
                    <input
                        type="text"
                        value={styles.filter || 'none'}
                        onChange={(e) => handleStyleChange('filter', e.target.value)}
                        placeholder="brightness(120%) contrast(110%)"
                        className="input-field"
                    />
                </div>
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Palette size={16} strokeWidth={1.5} />
                    Biến đổi
                </h4>
                <div className="input-group">
                    <label className="input-label">Xoay</label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={parseInt(componentData.rotate) || 0}
                        onChange={(e) => {
                            handleComponentDataChange('rotate', e.target.value);
                            handleStyleChange('transform', `rotate(${e.target.value}deg)`);
                        }}
                        className="input-range"
                    />
                    <span className="range-value">{parseInt(componentData.rotate) || 0}°</span>

                    <label className="input-label">Scale</label>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={parseFloat(componentData.scale) || 1}
                        onChange={(e) => {
                            handleComponentDataChange('scale', e.target.value);
                            const rotate = componentData.rotate || 0;
                            handleStyleChange('transform', `rotate(${rotate}deg) scale(${e.target.value})`);
                        }}
                        className="input-range"
                    />
                    <span className="range-value">{parseFloat(componentData.scale) || 1}x</span>
                </div>
            </div>

            <div className="panel-section">
                <h4 className="section-title">
                    <Palette size={16} strokeWidth={1.5} />
                    Hiệu ứng Hover
                </h4>
                <div className="input-group">
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="hoverZoom"
                            checked={componentData.hoverZoom || false}
                            onChange={(e) => handleComponentDataChange('hoverZoom', e.target.checked)}
                        />
                        <label htmlFor="hoverZoom" className="checkbox-label">Phóng to khi hover</label>
                    </div>
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="hoverRotate"
                            checked={componentData.hoverRotate || false}
                            onChange={(e) => handleComponentDataChange('hoverRotate', e.target.checked)}
                        />
                        <label htmlFor="hoverRotate" className="checkbox-label">Xoay khi hover</label>
                    </div>
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="hoverGrayscale"
                            checked={componentData.hoverGrayscale || false}
                            onChange={(e) => handleComponentDataChange('hoverGrayscale', e.target.checked)}
                        />
                        <label htmlFor="hoverGrayscale" className="checkbox-label">Grayscale khi hover</label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAnimationTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title">
                    <Sparkles size={16} strokeWidth={1.5} />
                    Hiệu ứng xuất hiện
                </h4>
                <div className="input-group">
                    <label className="input-label">Kiểu animation</label>
                    <select
                        value={componentData.animation?.type || 'none'}
                        onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, type: e.target.value })}
                        className="input-select"
                    >
                        {ANIMATION_PRESETS.map(anim => (
                            <option key={anim.value} value={anim.value}>{anim.name}</option>
                        ))}
                    </select>

                    <label className="input-label">Thời gian (ms)</label>
                    <input
                        type="range"
                        min="100"
                        max="3000"
                        step="100"
                        value={componentData.animation?.duration || 1000}
                        onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, duration: parseInt(e.target.value) })}
                        className="input-range"
                    />
                    <span className="range-value">{componentData.animation?.duration || 1000}ms</span>

                    <label className="input-label">Độ trễ (ms)</label>
                    <input
                        type="range"
                        min="0"
                        max="3000"
                        step="100"
                        value={componentData.animation?.delay || 0}
                        onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, delay: parseInt(e.target.value) })}
                        className="input-range"
                    />
                    <span className="range-value">{componentData.animation?.delay || 0}ms</span>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="repeat-animation"
                            checked={componentData.animation?.repeat || false}
                            onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, repeat: e.target.checked })}
                        />
                        <label htmlFor="repeat-animation" className="checkbox-label">Lặp lại animation</label>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">Thuộc tính hình ảnh</h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="panel-tabs">
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
                    >
                        <ImageIcon size={16} />
                        <span>Hình ảnh</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('effects')}
                        className={`tab-button ${activeTab === 'effects' ? 'active' : ''}`}
                    >
                        <Palette size={16} />
                        <span>Hiệu ứng</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('animation')}
                        className={`tab-button ${activeTab === 'animation' ? 'active' : ''}`}
                    >
                        <Sparkles size={16} />
                        <span>Animation</span>
                    </button>
                </div>

                {activeTab === 'image' && renderImageTab()}
                {activeTab === 'effects' && renderEffectsTab()}
                {activeTab === 'animation' && renderAnimationTab()}
            </div>

            <ImageManagerModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSelectImage={handleImageSelect}
                pageId={pageId}
            />
        </>
    );
};

export default ImagePropertiesPanel;