import React, { useState, useRef } from 'react';
import {
    ChevronRight, ChevronLeft, MousePointer,
    Type, Zap, Sparkles, Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Palette, Box, Sun, Droplet, Image as ImageIcon, Upload, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import ImageManagerModal from '../ImageManagerModal'; // Adjust path if needed
import '../../../styles/ElementPropertiesPanel.css';

const FONT_PRESETS = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Raleway', value: 'Raleway, sans-serif' },
    { name: 'Playfair Display', value: 'Playfair Display, serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Dancing Script', value: "'Dancing Script', cursive" },
    { name: 'Pacifico', value: "'Pacifico', cursive" },
    { name: 'Lobster', value: "'Lobster', cursive" }
];

const FONT_WEIGHT_PRESETS = [
    { name: 'Thin (100)', value: '100' },
    { name: 'Extra Light (200)', value: '200' },
    { name: 'Light (300)', value: '300' },
    { name: 'Regular (400)', value: '400' },
    { name: 'Medium (500)', value: '500' },
    { name: 'Semibold (600)', value: '600' },
    { name: 'Bold (700)', value: '700' },
    { name: 'Extra Bold (800)', value: '800' },
    { name: 'Black (900)', value: '900' }
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

const TEXT_SHADOW_PRESETS = [
    { name: 'Không có', value: 'none' },
    { name: 'Nhẹ', value: '1px 1px 2px rgba(0,0,0,0.1)' },
    { name: 'Vừa', value: '2px 2px 4px rgba(0,0,0,0.2)' },
    { name: 'Đậm', value: '3px 3px 6px rgba(0,0,0,0.3)' },
    { name: 'Neon Xanh', value: '0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 30px #06b6d4' },
    { name: 'Neon Hồng', value: '0 0 10px #ec4899, 0 0 20px #ec4899, 0 0 30px #ec4899' },
    { name: '3D Đỏ', value: '1px 1px 0 #dc2626, 2px 2px 0 #b91c1c, 3px 3px 0 #991b1b' },
    { name: '3D Xanh', value: '1px 1px 0 #2563eb, 2px 2px 0 #1e40af, 3px 3px 0 #1e3a8a' }
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

const ElementPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle, pageId }) => {
    const [activeTab, setActiveTab] = useState('design');
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

    if (!selectedElement || !selectedElement.json) {
        return (
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">Thuộc tính</h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="panel-empty">
                    <MousePointer className="empty-icon" size={48} strokeWidth={1.5} />
                    <p className="empty-text">Chọn một element để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const { type, componentData = {}, styles = {}, size = {} } = selectedElement.json;
    const isHeading = type === 'heading';
    const isParagraph = type === 'paragraph';
    const isGallery = type === 'gallery';

    if (!isHeading && !isParagraph && !isGallery) {
        return (
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h4 className="panel-title">Không hỗ trợ</h4>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    const handleStyleChange = (property, value) => {
        const updated = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                styles: {
                    ...styles,
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
                    ...componentData,
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
                    ...size,
                    [dimension]: parsedValue,
                },
            },
        };
        onUpdateElement(updated);
    };

    const toggleFontStyle = (property, value) => {
        const currentValue = styles[property];
        handleStyleChange(property, currentValue === value ? 'normal' : value);
    };

    const applyGradientText = (gradient) => {
        if (gradient) {
            handleStyleChange('background', gradient);
            handleStyleChange('WebkitBackgroundClip', 'text');
            handleStyleChange('WebkitTextFillColor', 'transparent');
        } else {
            handleStyleChange('background', 'transparent');
            handleStyleChange('WebkitBackgroundClip', 'initial');
            handleStyleChange('WebkitTextFillColor', 'initial');
        }
    };

    const handleImageSelect = (image) => {
        if (!image?.url) {
            toast.error('URL ảnh không hợp lệ');
            return;
        }
        const isValidUrl = /^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)$/i.test(image.url);
        if (!isValidUrl) {
            toast.error('URL phải là định dạng ảnh hợp lệ (png, jpg, jpeg, gif, webp)');
            return;
        }
        const newImages = [...(componentData.images || []), image.url];
        handleComponentDataChange('images', newImages);
        toast.success('Đã thêm ảnh vào thư viện!');
        setShowUploadModal(false);
    };

    const handleImageRemove = (index) => {
        const newImages = (componentData.images || []).filter((_, i) => i !== index);
        handleComponentDataChange('images', newImages);
        toast.success('Đã xóa ảnh khỏi thư viện!');
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = [...(componentData.images || [])];
        for (const file of files) {
            try {
                if (!window.imageService) {
                    throw new Error('ImageService không được khởi tạo. Kiểm tra cấu hình server.');
                }

                const validation = window.imageService.validateImageFile(file);
                if (!validation.valid) {
                    toast.warn(`${file.name}: ${validation.error}`, { position: 'bottom-right' });
                    continue;
                }

                const compressedFile = await window.imageService.compressImage(file);
                const response = await window.imageService.uploadImage(compressedFile, pageId, (progress) => {
                    toast.info(`Đang tải lên ${file.name}: ${progress}%`, { autoClose: false, toastId: file.name });
                });

                if (response.success && response.data?.url) {
                    newImages.push(response.data.url);
                    toast.success(`Tải lên ${file.name} thành công`, { position: 'bottom-right' });
                } else {
                    throw new Error('Không nhận được URL ảnh từ server');
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                });
                toast.error(
                    error.message.includes('404')
                        ? 'Endpoint upload không tồn tại. Kiểm tra server tại http://localhost:5000/api/images/upload.'
                        : `Lỗi tải lên ${file.name}: ${error.message}`,
                    { position: 'bottom-right' }
                );
            }
        }

        if (newImages.length > componentData.images?.length) {
            handleComponentDataChange('images', newImages);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const renderDesignTab = () => {
        if (isGallery) {
            return (
                <div className="panel-content">
                    <div className="panel-section">
                        <div className="section-header">
                            <h4 className="section-title">
                                <ImageIcon size={16} strokeWidth={1.5} />
                                Quản lý ảnh
                            </h4>
                            <button
                                onClick={() => setShowImageEditor(!showImageEditor)}
                                className="toggle-editor-btn"
                            >
                                {showImageEditor ? 'Ẩn' : 'Hiện'} Editor
                            </button>
                        </div>

                        {showImageEditor && (
                            <div className="input-group">
                                <div className="image-list">
                                    {(componentData.images || []).map((imageUrl, index) => (
                                        <div key={index} className="image-item">
                                            <img
                                                src={imageUrl}
                                                alt={`Gallery image ${index + 1}`}
                                                onError={(e) => (e.target.src = 'https://via.placeholder.com/64?text=Image+Error')}
                                                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                            <button
                                                onClick={() => handleImageRemove(index)}
                                                className="remove-image-btn"
                                                title="Xóa ảnh"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!componentData.images || componentData.images.length === 0) && (
                                        <div className="no-images">
                                            <ImageIcon size={32} color="#9ca3af" />
                                            <p>Chưa có ảnh nào trong thư viện</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="upload-btn"
                                >
                                    <Upload size={16} />
                                    Thêm từ thư viện
                                </button>

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

                                <label className="upload-btn">
                                    <Upload size={16} />
                                    Tải ảnh lên
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                <div>
                                    <label className="input-label">Kiểu hiển thị</label>
                                    <select
                                        value={styles.display || 'grid'}
                                        onChange={(e) => handleStyleChange('display', e.target.value)}
                                        className="input-select"
                                    >
                                        <option value="grid">Grid</option>
                                        <option value="flex">Flex (Carousel)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="input-label">Khoảng cách (Gap)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={parseInt(styles.gap) || 10}
                                        onChange={(e) => handleStyleChange('gap', e.target.value + 'px')}
                                        className="input-range"
                                    />
                                    <span className="range-value">{parseInt(styles.gap || 10)}px</span>
                                </div>

                                <div>
                                    <label className="input-label">Bo góc ảnh</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="1"
                                        value={parseInt(styles.borderRadius) || 8}
                                        onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                                        className="input-range"
                                    />
                                    <span className="range-value">{parseInt(styles.borderRadius || 8)}px</span>
                                </div>

                                <div>
                                    <label className="input-label">Kích thước</label>
                                    <div className="size-inputs">
                                        <div className="size-input-item">
                                            <label className="input-label">W</label>
                                            <input
                                                type="number"
                                                value={size.width || 380}
                                                onChange={(e) => handleSizeChange('width', e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                        <div className="size-input-item">
                                            <label className="input-label">H</label>
                                            <input
                                                type="number"
                                                value={size.height || 300}
                                                onChange={(e) => handleSizeChange('height', e.target.value)}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="panel-content">
                <div className="panel-section">
                    <h4 className="section-title">
                        <Type size={16} strokeWidth={1.5} />
                        Nội dung
                    </h4>
                    <div className="input-group">
                        <textarea
                            value={componentData.content || ''}
                            onChange={(e) => handleComponentDataChange('content', e.target.value)}
                            placeholder={isHeading ? 'Nhập tiêu đề...' : 'Nhập nội dung đoạn văn...'}
                            rows={isHeading ? 2 : 4}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                <div className="panel-section">
                    <h4 className="section-title">
                        <Type size={16} strokeWidth={1.5} />
                        Font chữ
                    </h4>

                    <div className="input-group">
                        <div>
                            <label className="input-label">Kiểu chữ</label>
                            <select
                                value={styles.fontFamily || 'Arial, sans-serif'}
                                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                                className="input-select"
                            >
                                {FONT_PRESETS.map(font => (
                                    <option key={font.value} value={font.value}>{font.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Cỡ chữ</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={parseInt(styles.fontSize) || 16}
                                    onChange={(e) => handleStyleChange('fontSize', e.target.value + 'px')}
                                    className="input-field"
                                />
                                <span className="input-unit">px</span>
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Độ đậm</label>
                            <select
                                value={styles.fontWeight || '400'}
                                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                                className="input-select"
                            >
                                {FONT_WEIGHT_PRESETS.map(weight => (
                                    <option key={weight.value} value={weight.value}>{weight.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Định dạng</label>
                            <div className="format-buttons">
                                <button
                                    onClick={() => toggleFontStyle('fontWeight', 'bold')}
                                    className={`format-btn ${(styles.fontWeight === 'bold' || styles.fontWeight === '700') ? 'active' : ''}`}
                                    title="Bold"
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    onClick={() => toggleFontStyle('fontStyle', 'italic')}
                                    className={`format-btn ${styles.fontStyle === 'italic' ? 'active' : ''}`}
                                    title="Italic"
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    onClick={() => toggleFontStyle('textDecoration', 'underline')}
                                    className={`format-btn ${styles.textDecoration === 'underline' ? 'active' : ''}`}
                                    title="Underline"
                                >
                                    <Underline size={16} />
                                </button>
                                <button
                                    onClick={() => handleStyleChange('textTransform', styles.textTransform === 'uppercase' ? 'none' : 'uppercase')}
                                    className={`format-btn ${styles.textTransform === 'uppercase' ? 'active' : ''}`}
                                    title="Uppercase"
                                >
                                    <span style={{ fontSize: '11px', fontWeight: '700' }}>TT</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Căn chỉnh</label>
                            <div className="format-buttons">
                                <button
                                    onClick={() => handleStyleChange('textAlign', 'left')}
                                    className={`format-btn ${styles.textAlign === 'left' ? 'active' : ''}`}
                                    title="Căn trái"
                                >
                                    <AlignLeft size={16} />
                                </button>
                                <button
                                    onClick={() => handleStyleChange('textAlign', 'center')}
                                    className={`format-btn ${styles.textAlign === 'center' ? 'active' : ''}`}
                                    title="Căn giữa"
                                >
                                    <AlignCenter size={16} />
                                </button>
                                <button
                                    onClick={() => handleStyleChange('textAlign', 'right')}
                                    className={`format-btn ${styles.textAlign === 'right' ? 'active' : ''}`}
                                    title="Căn phải"
                                >
                                    <AlignRight size={16} />
                                </button>
                                <button
                                    onClick={() => handleStyleChange('textAlign', 'justify')}
                                    className={`format-btn ${styles.textAlign === 'justify' ? 'active' : ''}`}
                                    title="Căn đều"
                                >
                                    <AlignJustify size={16} />
                                </button>
                            </div>
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
                                {COLOR_PRESETS.map(color => (
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
                            <label className="input-label">Khoảng cách dòng</label>
                            <input
                                type="range"
                                min="0.8"
                                max="3"
                                step="0.1"
                                value={parseFloat(styles.lineHeight) || 1.5}
                                onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                                className="input-range"
                            />
                            <span className="range-value">{parseFloat(styles.lineHeight || 1.5).toFixed(1)}</span>
                        </div>

                        <div>
                            <label className="input-label">Khoảng cách chữ</label>
                            <input
                                type="range"
                                min="-5"
                                max="20"
                                step="0.5"
                                value={parseFloat(styles.letterSpacing) || 0}
                                onChange={(e) => handleStyleChange('letterSpacing', e.target.value + 'px')}
                                className="input-range"
                            />
                            <span className="range-value">{parseFloat(styles.letterSpacing || 0).toFixed(1)}px</span>
                        </div>
                    </div>
                </div>

                <div className="panel-section">
                    <h4 className="section-title">
                        <Palette size={16} strokeWidth={1.5} />
                        Màu sắc
                    </h4>

                    <div className="input-group">
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
                                {COLOR_PRESETS.map(color => (
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
                            <label className="input-label">Gradient chữ</label>
                            <select
                                value={styles.background && styles.WebkitBackgroundClip === 'text' ? styles.background : ''}
                                onChange={(e) => applyGradientText(e.target.value)}
                                className="input-select"
                            >
                                {GRADIENT_PRESETS.map(preset => (
                                    <option key={preset.name} value={preset.value}>{preset.name}</option>
                                ))}
                            </select>
                        </div>

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
                                    value={styles.backgroundColor || 'transparent'}
                                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                    className="input-field"
                                    placeholder="transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel-section">
                    <h4 className="section-title">
                        <Sun size={16} strokeWidth={1.5} />
                        Hiệu ứng bóng
                    </h4>

                    <div className="input-group">
                        <div>
                            <label className="input-label">Mẫu đổ bóng</label>
                            <select
                                value={styles.textShadow || 'none'}
                                onChange={(e) => handleStyleChange('textShadow', e.target.value)}
                                className="input-select"
                            >
                                {TEXT_SHADOW_PRESETS.map(preset => (
                                    <option key={preset.name} value={preset.value}>{preset.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Tùy chỉnh đổ bóng</label>
                            <input
                                type="text"
                                value={styles.textShadow === 'none' ? '' : styles.textShadow || ''}
                                onChange={(e) => handleStyleChange('textShadow', e.target.value || 'none')}
                                placeholder="2px 2px 4px rgba(0,0,0,0.3)"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Viền chữ (stroke)</label>
                            <input
                                type="text"
                                value={styles.WebkitTextStroke || ''}
                                onChange={(e) => {
                                    handleStyleChange('WebkitTextStroke', e.target.value);
                                    handleStyleChange('textStroke', e.target.value);
                                }}
                                placeholder="2px #000000"
                                className="input-field"
                            />
                            <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                Ví dụ: 2px #000000
                            </small>
                        </div>
                    </div>
                </div>

                <div className="panel-section">
                    <h4 className="section-title">
                        <Box size={16} strokeWidth={1.5} />
                        Khung & Padding
                    </h4>

                    <div className="input-group">
                        <div>
                            <label className="input-label">Padding</label>
                            <input
                                type="text"
                                value={styles.padding || '0'}
                                onChange={(e) => handleStyleChange('padding', e.target.value)}
                                placeholder="10px hoặc 10px 20px"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Viền (Border)</label>
                            <input
                                type="text"
                                value={styles.border || 'none'}
                                onChange={(e) => handleStyleChange('border', e.target.value)}
                                placeholder="2px solid #000000"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Viền trái</label>
                            <input
                                type="text"
                                value={styles.borderLeft || 'none'}
                                onChange={(e) => handleStyleChange('borderLeft', e.target.value)}
                                placeholder="4px solid #2563eb"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="input-label">Bo góc</label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={parseInt(styles.borderRadius) || 0}
                                onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                                className="input-range"
                            />
                            <span className="range-value">{parseInt(styles.borderRadius || 0)}px</span>
                        </div>

                        <div>
                            <label className="input-label">Đổ bóng khung</label>
                            <input
                                type="text"
                                value={styles.boxShadow || 'none'}
                                onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                                placeholder="0 4px 6px rgba(0,0,0,0.1)"
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                <div className="panel-section">
                    <h4 className="section-title">Kích thước</h4>
                    <div className="input-group">
                        <div className="size-inputs">
                            <div className="size-input-item">
                                <label className="input-label">W</label>
                                <input
                                    type="number"
                                    value={size.width || 400}
                                    onChange={(e) => handleSizeChange('width', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="size-input-item">
                                <label className="input-label">H</label>
                                <input
                                    type="number"
                                    value={size.height || 80}
                                    onChange={(e) => handleSizeChange('height', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAnimationTab = () => {
        if (isGallery) {
            return (
                <div className="panel-content">
                    <div className="panel-section">
                        <h4 className="section-title">
                            <Sparkles size={16} strokeWidth={1.5} />
                            Hiệu ứng hiển thị
                        </h4>
                        <div className="input-group">
                            <div>
                                <label className="input-label">Hiệu ứng</label>
                                <select
                                    value={componentData.animation?.type || 'none'}
                                    onChange={(e) => handleComponentDataChange('animation', {
                                        ...componentData.animation,
                                        type: e.target.value
                                    })}
                                    className="input-select"
                                >
                                    {ANIMATION_PRESETS.map(anim => (
                                        <option key={anim.value} value={anim.value}>{anim.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="input-label">Thời gian (ms)</label>
                                <input
                                    type="range"
                                    min="100"
                                    max="5000"
                                    step="100"
                                    value={componentData.animation?.duration || 1000}
                                    onChange={(e) => handleComponentDataChange('animation', {
                                        ...componentData.animation,
                                        duration: parseInt(e.target.value)
                                    })}
                                    className="input-range"
                                />
                                <span className="range-value">{componentData.animation?.duration || 1000}ms</span>
                            </div>

                            <div>
                                <label className="input-label">Độ trễ (ms)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    step="100"
                                    value={componentData.animation?.delay || 0}
                                    onChange={(e) => handleComponentDataChange('animation', {
                                        ...componentData.animation,
                                        delay: parseInt(e.target.value)
                                    })}
                                    className="input-range"
                                />
                                <span className="range-value">{componentData.animation?.delay || 0}ms</span>
                            </div>

                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="repeat-animation"
                                    checked={componentData.animation?.repeat || false}
                                    onChange={(e) => handleComponentDataChange('animation', {
                                        ...componentData.animation,
                                        repeat: e.target.checked
                                    })}
                                />
                                <label htmlFor="repeat-animation" className="checkbox-label">
                                    Lặp lại hiệu ứng
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="panel-content">
                <div className="panel-section">
                    <h4 className="section-title">
                        <Sparkles size={16} strokeWidth={1.5} />
                        Hiệu ứng hiển thị
                    </h4>

                    <div className="input-group">
                        <div>
                            <label className="input-label">Hiệu ứng</label>
                            <select
                                value={componentData.animation?.type || 'none'}
                                onChange={(e) => handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    type: e.target.value
                                })}
                                className="input-select"
                            >
                                {ANIMATION_PRESETS.map(anim => (
                                    <option key={anim.value} value={anim.value}>{anim.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="input-label">Thời gian (ms)</label>
                            <input
                                type="range"
                                min="100"
                                max="5000"
                                step="100"
                                value={componentData.animation?.duration || 1000}
                                onChange={(e) => handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    duration: parseInt(e.target.value)
                                })}
                                className="input-range"
                            />
                            <span className="range-value">{componentData.animation?.duration || 1000}ms</span>
                        </div>

                        <div>
                            <label className="input-label">Độ trễ (ms)</label>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                step="100"
                                value={componentData.animation?.delay || 0}
                                onChange={(e) => handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    delay: parseInt(e.target.value)
                                })}
                                className="input-range"
                            />
                            <span className="range-value">{componentData.animation?.delay || 0}ms</span>
                        </div>

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="repeat-animation"
                                checked={componentData.animation?.repeat || false}
                                onChange={(e) => handleComponentDataChange('animation', {
                                    ...componentData.animation,
                                    repeat: e.target.checked
                                })}
                            />
                            <label htmlFor="repeat-animation" className="checkbox-label">
                                Lặp lại hiệu ứng
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">
                        {isGallery ? 'Quản lý thư mục ảnh' : isHeading ? 'Thuộc tính tiêu đề' : 'Thuộc tính đoạn văn'}
                    </h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="panel-tabs">
                    <button
                        onClick={() => setActiveTab('design')}
                        className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}
                    >
                        <Type size={16} />
                        <span>{isGallery ? 'Ảnh' : 'Thiết kế'}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('animation')}
                        className={`tab-button ${activeTab === 'animation' ? 'active' : ''}`}
                    >
                        <Sparkles size={16} />
                        <span>Hiệu ứng</span>
                    </button>
                </div>

                {activeTab === 'design' && renderDesignTab()}
                {activeTab === 'animation' && renderAnimationTab()}
            </div>

            {isGallery && (
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

export default ElementPropertiesPanel;