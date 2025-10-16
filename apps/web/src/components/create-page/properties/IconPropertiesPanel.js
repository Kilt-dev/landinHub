import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Star, Sparkles, Palette, Box, Sun, Zap, Code, MousePointer2, ArrowRight, Play, Heart, User, Circle, Image as ImageIcon, Upload, Trash2, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import { uploadImage, getPageImages, deleteImage, validateImageFile, compressImage } from '../../../utils/imageService';
import '../../../styles/ElementPropertiesPanel.css';
import ImageManagerModal from '../ImageManagerModal'; // Adjust path if needed

const ICON_PRESETS = [
  { name: 'Star', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' },
  { name: 'Heart', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' },
  { name: 'Arrow Right', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' },
  { name: 'Play', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' },
  { name: 'User', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' },
  { name: 'Facebook', imageUrl: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
  { name: 'Zalo', imageUrl: 'https://cdn-icons-png.flaticon.com/512/124/124034.png' },
  { name: 'Messenger', imageUrl: 'https://cdn-icons-png.flaticon.com/512/5968/5968850.png' },
];

const COLOR_PRESETS = [
  '#000000', '#ffffff', '#f3f4f6', '#1f2937', '#374151', '#667eea', '#764ba2', '#2563eb', '#3b82f6', '#06b6d4',
  '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#ef4444', '#dc2626', '#ec4899', '#a855f7', '#8b5cf6'
];

const HOVER_EFFECTS = [
  { name: 'None', value: 'none' },
  { name: 'Scale Up', value: 'scale', transform: 'scale(1.2)' },
  { name: 'Scale Down', value: 'scaleDown', transform: 'scale(0.9)' },
  { name: 'Rotate', value: 'rotate', transform: 'rotate(15deg)' },
  { name: 'Slide Right', value: 'slideRight', transform: 'translateX(5px)' },
  { name: 'Slide Up', value: 'slideUp', transform: 'translateY(-5px)' },
  { name: 'Pulse', value: 'pulse', animation: 'pulse 0.6s ease infinite' },
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

const GRADIENT_PRESETS = [
  { name: 'Không có', value: '' },
  { name: 'Tím - Hồng', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Xanh dương', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
  { name: 'Xanh lá', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
  { name: 'Cam - Vàng', value: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' },
  { name: 'Đỏ - Hồng', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
  { name: 'Cầu vồng', value: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)' }
];

const EVENT_TYPES = [
  { name: 'Không chọn', value: 'none' },
  { name: 'Mở URL', value: 'navigate' },
  { name: 'Gửi Form', value: 'submitForm' },
  { name: 'Gọi API', value: 'triggerApi' },
  { name: 'Mở Popup', value: 'openPopup' },
  { name: 'Đóng Popup', value: 'closePopup' },
  { name: 'Cuộn đến Section', value: 'scrollToSection' },
];

const IconPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle, allElements = [], pageId }) => {
  const [activeTab, setActiveTab] = useState('design');
  const [showSvgEditor, setShowSvgEditor] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Initialize editor based on element type
  useEffect(() => {
    if (selectedElement?.json?.componentData?.imageUrl) {
      setShowImageEditor(true);
      setShowSvgEditor(false);
    } else {
      setShowSvgEditor(true);
      setShowImageEditor(false);
    }
  }, [selectedElement]);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    try {
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.warn(`${file.name}: ${validation.error}`, { position: 'bottom-right' });
          continue;
        }
        const compressedFile = await compressImage(file);
        const response = await uploadImage(compressedFile, pageId, (progress) => {
          setProgress(progress);
        });
        if (response.success) {
          handleComponentDataChange('imageUrl', response.data.url);
          toast.success(`Tải lên ${file.name} thành công`, { position: 'bottom-right' });
        }
      }
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Lỗi tải ảnh: ${error.message}`, { position: 'bottom-right' });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Update styles
  const handleStyleChange = (property, value) => {
    const updated = {
      ...selectedElement,
      json: {
        ...selectedElement.json,
        styles: { ...styles, [property]: value },
      },
    };
    onUpdateElement(updated);
  };

  // Update component data
  const handleComponentDataChange = (key, value) => {
    const updated = {
      ...selectedElement,
      json: {
        ...selectedElement.json,
        componentData: {
          ...componentData,
          [key]: key === 'icon' ? DOMPurify.sanitize(value) : value,
          ...(key === 'imageUrl' ? { icon: undefined } : key === 'icon' ? { imageUrl: undefined } : {}),
        },
      },
    };
    onUpdateElement(updated);
  };

  // Update size
  const handleSizeChange = (dimension, value) => {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      toast.error('Kích thước phải là số dương', { position: 'bottom-right' });
      return;
    }
    const updated = {
      ...selectedElement,
      json: {
        ...selectedElement.json,
        size: { ...size, [dimension]: parsedValue },
      },
    };
    onUpdateElement(updated);
  };

  // Handle hover effects
  const handleHoverEffectChange = (effect) => {
    const hoverEffect = HOVER_EFFECTS.find(e => e.value === effect);
    const newStyles = { ...styles };
    if (!hoverEffect || effect === 'none') {
      delete newStyles[':hover'];
    } else {
      newStyles[':hover'] = { transform: hoverEffect.transform || 'none', animation: hoverEffect.animation || 'none' };
    }
    const updated = {
      ...selectedElement,
      json: { ...selectedElement.json, styles: newStyles },
    };
    onUpdateElement(updated);
  };

  // Handle event change for icon (similar to button)
  const handleEventChange = (eventType, property, value) => {
    const currentEvents = componentData.events || {};
    const updated = {
      ...selectedElement,
      json: {
        ...selectedElement.json,
        componentData: {
          ...componentData,
          events: {
            ...currentEvents,
            [eventType]: { ...(currentEvents[eventType] || {}), [property]: value }
          }
        }
      }
    };
    onUpdateElement(updated);
  };

  const { componentData = {}, styles = {}, size = {} } = selectedElement?.json || {};

  const popupElements = allElements.filter(el => el.type === 'popup');
  const sectionElements = allElements.filter(el => el.type === 'section');

  const handleImageSelect = (image) => {
    handleComponentDataChange('imageUrl', image.url);
    setShowUploadModal(false);
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

  if (isCollapsed) {
    return (
        <div className="element-properties-panel-collapsed">
          <button onClick={onToggle} className="toggle-button" title="Mở thuộc tính">
            <ChevronLeft size={18} />
          </button>
        </div>
    );
  }

  if (!selectedElement || !selectedElement.json || selectedElement.json.type !== 'icon') {
    return (
        <div className="element-properties-panel">
          <div className="panel-header">
            <h3 className="panel-title">Thuộc tính Icon</h3>
            <button onClick={onToggle} className="toggle-button" title="Đóng">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="panel-empty">
            <MousePointer className="empty-icon" size={48} strokeWidth={1.5} />
            <p className="empty-text">Chọn một icon để chỉnh sửa</p>
          </div>
        </div>
    );
  }

  const renderDesignTab = () => (
      <div className="panel-content">
        {/* Icon Type Selector */}
        <div className="panel-section">
          <h4 className="section-title">
            <Code size={16} strokeWidth={1.5} /> Loại Icon
          </h4>
          <div className="input-group">
            <select
                value={componentData.imageUrl ? 'image' : 'svg'}
                onChange={(e) => {
                  if (e.target.value === 'svg') {
                    setShowImageEditor(false);
                    setShowSvgEditor(true);
                    handleComponentDataChange('imageUrl', '');
                  } else {
                    setShowSvgEditor(false);
                    setShowImageEditor(true);
                    handleComponentDataChange('icon', '');
                  }
                }}
                className="input-select"
            >
              <option value="svg">SVG</option>
              <option value="image">Hình ảnh</option>
            </select>
          </div>
        </div>
        {/* SVG Editor */}
        {showSvgEditor && (
            <div className="panel-section">
              <div className="section-header">
                <h4 className="section-title">
                  <Code size={16} strokeWidth={1.5} /> Icon SVG
                </h4>
                <button onClick={() => setShowSvgEditor(!showSvgEditor)} className="toggle-editor-btn">
                  {showSvgEditor ? 'Ẩn Editor' : 'Sửa SVG'}
                </button>
              </div>
              {showSvgEditor && (
                  <div className="input-group">
                    <div className="svg-preview">
                      {componentData.icon ? (
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(componentData.icon) }} style={{ width: '64px', height: '64px', color: styles.color || '#000' }} />
                      ) : (
                          <Star size={32} color="#9ca3af" />
                      )}
                    </div>
                    <label className="input-label">Mã SVG</label>
                    <textarea value={componentData.icon || ''} onChange={(e) => handleComponentDataChange('icon', e.target.value)} placeholder="Dán mã SVG tại đây..." rows={8} className="input-field" />
                    <label className="input-label">Icon có sẵn</label>
                    <div className="icon-preset-grid">
                      {ICON_PRESETS.filter(preset => preset.icon).map((preset) => (
                          <button
                              key={preset.name}
                              onClick={() => handleComponentDataChange('icon', preset.icon)}
                              className={`preset-btn ${componentData.icon === preset.icon ? 'active' : ''}`}
                              title={preset.name}
                          >
                            <div dangerouslySetInnerHTML={{ __html: preset.icon }} />
                          </button>
                      ))}
                    </div>
                  </div>
              )}
            </div>
        )}
        {/* Image Editor */}
        {showImageEditor && (
            <div className="panel-section">
              <div className="section-header">
                <h4 className="section-title">
                  <ImageIcon size={16} strokeWidth={1.5} /> Hình ảnh
                </h4>
                <button onClick={() => setShowImageEditor(!showImageEditor)} className="toggle-editor-btn">
                  {showImageEditor ? 'Ẩn Editor' : 'Sửa Hình ảnh'}
                </button>
              </div>
              {showImageEditor && (
                  <div className="input-group">
                    <div className="image-preview">
                      {componentData.imageUrl ? (
                          <img src={componentData.imageUrl} alt={componentData.alt || 'Icon'} style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                      ) : (
                          <ImageIcon size={32} color="#9ca3af" />
                      )}
                    </div>
                    <button onClick={() => setShowUploadModal(true)} className="upload-btn">
                      <Upload size={16} /> Chọn từ thư viện
                    </button>
                    <label className="input-label">URL Hình ảnh</label>
                    <input
                        type="text"
                        value={componentData.imageUrl || ''}
                        onChange={(e) => handleComponentDataChange('imageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="input-field"
                    />
                    <label className="input-label">Văn bản thay thế (Alt Text)</label>
                    <input type="text" value={componentData.alt || ''} onChange={(e) => handleComponentDataChange('alt', e.target.value)} placeholder="Mô tả hình ảnh" className="input-field" />
                    <button onClick={() => fileInputRef.current?.click()} className="upload-btn">
                      <Upload size={16} /> Tải ảnh lên
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                    <label className="input-label">Hình ảnh có sẵn</label>
                    <div className="icon-preset-grid">
                      {ICON_PRESETS.filter(preset => preset.imageUrl).map((preset) => (
                          <button
                              key={preset.name}
                              onClick={() => handleComponentDataChange('imageUrl', preset.imageUrl)}
                              className={`preset-btn ${componentData.imageUrl === preset.imageUrl ? 'active' : ''}`}
                              title={preset.name}
                          >
                            <img src={preset.imageUrl} alt={preset.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                          </button>
                      ))}
                    </div>
                  </div>
              )}
            </div>
        )}
        {/* Màu sắc */}
        <div className="panel-section">
          <h4 className="section-title">
            <Palette size={16} strokeWidth={1.5} /> Màu sắc
          </h4>
          <div className="input-group">
            <div>
              <label className="input-label">Màu Icon</label>
              <div className="color-input-group">
                <input type="color" value={styles.color || '#000000'} onChange={(e) => handleStyleChange('color', e.target.value)} className="color-picker" disabled={componentData.imageUrl} />
                <input
                    type="text"
                    value={styles.color || '#000000'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        handleStyleChange('color', value);
                      } else {
                        toast.error('Vui lòng nhập mã màu hex hợp lệ (VD: #FFFFFF)', { position: 'bottom-right' });
                      }
                    }}
                    className="input-field"
                    placeholder="#000000"
                    disabled={componentData.imageUrl}
                />
              </div>
              <div className="color-preset-grid">
                {COLOR_PRESETS.map((color) => (
                    <div
                        key={color}
                        className={`color-preset-item ${styles.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => !componentData.imageUrl && handleStyleChange('color', color)}
                        title={color}
                    />
                ))}
              </div>
            </div>
            {/* Gradient */}
            <div>
              <label className="input-label">Gradient màu</label>
              <select value={styles.background && styles.WebkitBackgroundClip === 'text' ? styles.background : ''} onChange={(e) => applyGradientText(e.target.value)} className="input-select" disabled={componentData.imageUrl}>
                {GRADIENT_PRESETS.map(preset => (
                    <option key={preset.name} value={preset.value}>{preset.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Kích thước */}
        <div className="panel-section">
          <h4 className="section-title">
            <Box size={16} strokeWidth={1.5} /> Kích thước
          </h4>
          <div className="input-group">
            <div className="size-inputs">
              <div className="size-input-item">
                <label className="input-label">Chiều rộng</label>
                <div className="input-with-unit">
                  <input type="number" value={size.width || 50} onChange={(e) => handleSizeChange('width', e.target.value)} className="input-field" />
                  <span className="input-unit">px</span>
                </div>
              </div>
              <div className="size-input-item">
                <label className="input-label">Chiều cao</label>
                <div className="input-with-unit">
                  <input type="number" value={size.height || 50} onChange={(e) => handleSizeChange('height', e.target.value)} className="input-field" />
                  <span className="input-unit">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Hiệu ứng bóng */}
        <div className="panel-section">
          <h4 className="section-title">
            <Sun size={16} strokeWidth={1.5} /> Hiệu ứng
          </h4>
          <div className="input-group">
            <div>
              <label className="input-label">Đổ bóng (Drop Shadow)</label>
              <input type="text" value={styles.filter || ''} onChange={(e) => handleStyleChange('filter', e.target.value)} placeholder="drop-shadow(0 4px 8px rgba(0,0,0,0.2))" className="input-field" />
            </div>
            <div>
              <label className="input-label">Độ mờ (Opacity)</label>
              <input type="range" min="0" max="1" step="0.1" value={styles.opacity || 1} onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))} className="input-range" />
              <span className="range-value">{((styles.opacity || 1) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
  );

  const renderInteractionTab = () => {
    const onClickEvent = componentData.events?.onClick || {};
    const onHoverEvent = componentData.events?.onHover || {};

    return (
        <div className="panel-content">
          {/* Hover Effects */}
          <div className="panel-section">
            <h4 className="section-title">
              <MousePointer2 size={16} strokeWidth={1.5} /> Hiệu ứng Hover
            </h4>
            <div className="input-group">
              <select value={styles[':hover']?.transform ? HOVER_EFFECTS.find(e => e.transform === styles[':hover'].transform)?.value || 'none' : 'none'} onChange={(e) => handleHoverEffectChange(e.target.value)} className="input-select">
                {HOVER_EFFECTS.map((effect) => (
                    <option key={effect.value} value={effect.value}>
                      {effect.name}
                    </option>
                ))}
              </select>
            </div>
          </div>
          {/* Click Action */}
          <div className="panel-section">
            <h4 className="section-title">
              <Zap size={16} strokeWidth={1.5} /> Hành động khi Click
            </h4>
            <div className="input-group">
              <label className="input-label">Loại hành động</label>
              <select
                  value={onClickEvent.type || 'none'}
                  onChange={(e) => handleEventChange('onClick', 'type', e.target.value)}
                  className="input-select"
              >
                {EVENT_TYPES.map(event => (
                    <option key={event.value} value={event.value}>{event.name}</option>
                ))}
              </select>
              {onClickEvent.type === 'navigate' && (
                  <div>
                    <label className="input-label">URL</label>
                    <input
                        type="text"
                        value={onClickEvent.url || ''}
                        onChange={(e) => handleEventChange('onClick', 'url', e.target.value)}
                        placeholder="/page or https://..."
                        className="input-field"
                    />
                  </div>
              )}
              {(onClickEvent.type === 'submitForm' || onClickEvent.type === 'triggerApi') && (
                  <>
                    <div>
                      <label className="input-label">API URL</label>
                      <input
                          type="text"
                          value={onClickEvent.apiUrl || ''}
                          onChange={(e) => handleEventChange('onClick', 'apiUrl', e.target.value)}
                          placeholder="/api/endpoint"
                          className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">HTTP Method</label>
                      <select value={onClickEvent.method || 'POST'} onChange={(e) => handleEventChange('onClick', 'method', e.target.value)} className="input-select">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                  </>
              )}
              {onClickEvent.type === 'openPopup' && (
                  <div>
                    <label className="input-label">Chọn Popup</label>
                    <select value={onClickEvent.popupId || ''} onChange={(e) => handleEventChange('onClick', 'popupId', e.target.value)} className="input-select">
                      <option value="">-- Chọn popup --</option>
                      {popupElements.map(popup => (
                          <option key={popup.id} value={popup.id}>{popup.componentData?.title || popup.id}</option>
                      ))}
                    </select>
                  </div>
              )}
              {onClickEvent.type === 'closePopup' && (
                  <div>
                    <label className="input-label">Chọn Popup để đóng</label>
                    <select value={onClickEvent.popupId || ''} onChange={(e) => handleEventChange('onClick', 'popupId', e.target.value)} className="input-select">
                      <option value="">-- Chọn popup --</option>
                      {popupElements.map(popup => (
                          <option key={popup.id} value={popup.id}>{popup.componentData?.title || popup.id}</option>
                      ))}
                    </select>
                  </div>
              )}
              {onClickEvent.type === 'scrollToSection' && (
                  <>
                    <div>
                      <label className="input-label">Chọn Section</label>
                      <select value={onClickEvent.sectionId || ''} onChange={(e) => handleEventChange('onClick', 'sectionId', e.target.value)} className="input-select">
                        <option value="">-- Chọn section --</option>
                        {sectionElements.map(section => (
                            <option key={section.id} value={section.id}>{section.componentData?.title || section.id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="smooth-scroll" checked={onClickEvent.smooth !== false} onChange={(e) => handleEventChange('onClick', 'smooth', e.target.checked)} />
                      <label htmlFor="smooth-scroll" className="checkbox-label">Cuộn mượt</label>
                    </div>
                  </>
              )}
            </div>
          </div>
          {/* Animation */}
          <div className="panel-section">
            <h4 className="section-title">
              <Sparkles size={16} strokeWidth={1.5} /> Hoạt hình
            </h4>
            <div className="input-group">
              <label className="input-label">Loại hoạt hình</label>
              <select value={componentData.animation?.type || 'none'} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, type: e.target.value })} className="input-select">
                {ANIMATION_PRESETS.map((anim) => (
                    <option key={anim.value} value={anim.value}>
                      {anim.name}
                    </option>
                ))}
              </select>
              {componentData.animation?.type && componentData.animation.type !== 'none' && (
                  <>
                    <label className="input-label">Thời gian (ms)</label>
                    <input
                        type="range"
                        min="100"
                        max="5000"
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
                        max="5000"
                        step="100"
                        value={componentData.animation?.delay || 0}
                        onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, delay: parseInt(e.target.value) })}
                        className="input-range"
                    />
                    <span className="range-value">{componentData.animation?.delay || 0}ms</span>
                    <div className="checkbox-group">
                      <input type="checkbox" id="repeat" checked={componentData.animation?.repeat || false} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, repeat: e.target.checked })} />
                      <label htmlFor="repeat" className="checkbox-label"> Lặp lại hoạt hình </label>
                    </div>
                  </>
              )}
            </div>
          </div>
        </div>
    );
  };

  return (
      <div className="element-properties-panel">
        <div className="panel-header">
          <h3 className="panel-title">Thuộc tính Icon</h3>
          <button onClick={onToggle} className="toggle-button" title="Đóng">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="panel-tabs">
          <button onClick={() => setActiveTab('design')} className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}>
            <Palette size={16} />
            <span>Thiết kế</span>
          </button>
          <button onClick={() => setActiveTab('interaction')} className={`tab-button ${activeTab === 'interaction' ? 'active' : ''}`}>
            <Zap size={16} />
            <span>Tương tác</span>
          </button>
        </div>
        {activeTab === 'design' && renderDesignTab()}
        {activeTab === 'interaction' && renderInteractionTab()}
        <ImageManagerModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSelectImage={handleImageSelect} pageId={pageId} />
      </div>
  );
};

export default IconPropertiesPanel;