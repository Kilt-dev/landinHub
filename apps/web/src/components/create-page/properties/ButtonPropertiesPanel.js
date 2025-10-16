import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, MousePointer, Type, Zap, Sparkles, Palette, Box, Sun, Settings, Maximize } from 'lucide-react';
import '../../../styles/ElementPropertiesPanel.css';

const FONT_PRESETS = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: 'Open Sans, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
];

const FONT_WEIGHT_PRESETS = [
    { name: 'Light (300)', value: '300' },
    { name: 'Regular (400)', value: '400' },
    { name: 'Medium (500)', value: '500' },
    { name: 'Semibold (600)', value: '600' },
    { name: 'Bold (700)', value: '700' },
    { name: 'Extra Bold (800)', value: '800' },
];

const COLOR_PRESETS = ['#000000', '#ffffff', '#f3f4f6', '#1f2937', '#374151', '#667eea', '#764ba2', '#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#ef4444', '#dc2626', '#ec4899', '#a855f7', '#8b5cf6'];

const GRADIENT_PRESETS = [
    { name: 'Không có', value: '', preview: '#2563eb' },
    { name: 'Tím - Hồng', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Xanh dương', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)', preview: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
    { name: 'Xanh lá', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)', preview: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { name: 'Cam - Vàng', value: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)', preview: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' },
    { name: 'Đỏ - Hồng', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)', preview: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
    { name: 'Cầu vồng', value: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)', preview: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)' },
    { name: 'Đen xám', value: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)', preview: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)' },
    { name: 'Vàng gold', value: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', preview: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
];

const ANIMATION_PRESETS = [
    { name: 'Không chọn', value: 'none' },
    { name: 'bounce', value: 'bounce' },
    { name: 'pulse', value: 'pulse' },
    { name: 'shake', value: 'shake' },
    { name: 'fadeIn', value: 'fadeIn' },
    { name: 'zoomIn', value: 'zoomIn' },
    { name: 'slideInUp', value: 'slideInUp' },
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

const ButtonPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle, allElements = [] }) => {
    const [activeTab, setActiveTab] = useState('design');

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
                    <p className="empty-text">Chọn một button để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const { type, componentData = {}, styles = {}, size = {} } = selectedElement.json;

    if (type !== 'button') {
        return (
            <div className="element-properties-panel">
                <div className="panel-header">
                    <h3 className="panel-title">Không hỗ trợ</h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    const popupElements = allElements.filter(el => el.type === 'popup');
    const sectionElements = allElements.filter(el => el.type === 'section');

    const handleStyleChange = (property, value) => {
        onUpdateElement({
            ...selectedElement,
            json: { ...selectedElement.json, styles: { ...selectedElement.json.styles, [property]: value } }
        });
    };

    const handleComponentDataChange = (key, value) => {
        onUpdateElement({
            ...selectedElement,
            json: { ...selectedElement.json, componentData: { ...selectedElement.json.componentData, [key]: value } }
        });
    };

    const handleEventChange = (eventType, property, value) => {
        const currentEvents = componentData.events || {};
        if (property === 'popupId' && value) {
            const popupExists = allElements.some(el => el.id === value && el.type === 'popup');
            if (!popupExists) {
                alert('Popup không tồn tại!');
                return;
            }
        }
        if (property === 'sectionId' && value) {
            const sectionExists = allElements.some(el => el.id === value && el.type === 'section');
            if (!sectionExists) {
                alert('Section không tồn tại!');
                return;
            }
        }
        onUpdateElement({
            ...selectedElement,
            json: {
                ...selectedElement.json,
                componentData: {
                    ...selectedElement.json.componentData,
                    events: {
                        ...currentEvents,
                        [eventType]: { ...(currentEvents[eventType] || {}), [property]: value }
                    }
                }
            }
        });
    };

    const handleSizeChange = (dimension, value) => {
        onUpdateElement({
            ...selectedElement,
            json: { ...selectedElement.json, size: { ...selectedElement.json.size, [dimension]: parseInt(value) || 0 } }
        });
    };

    const applyGradient = (gradient) => {
        handleStyleChange('background', gradient || '#2563eb');
    };

    const renderDesignTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title"><Type size={16} strokeWidth={1.5} />Nội dung</h4>
                <div className="input-group">
                    <label className="input-label">Text hiển thị</label>
                    <textarea
                        value={componentData.content || ''}
                        onChange={(e) => handleComponentDataChange('content', e.target.value)}
                        placeholder="Nhập nội dung nút..."
                        className="input-field"
                        rows="2"
                        style={{ width: '100%', padding: '10px', fontSize: '14px', resize: 'vertical', fontFamily: styles.fontFamily || 'Arial, sans-serif' }}
                    />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Xem thêm →', 'Đăng ký ngay', 'Liên hệ'].map(text => (
                            <button
                                key={text}
                                onClick={() => handleComponentDataChange('content', text)}
                                style={{ padding: '6px 12px', fontSize: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="panel-section">
                <h4 className="section-title"><Type size={16} strokeWidth={1.5} />Kiểu chữ</h4>
                <div className="input-group">
                    <div>
                        <label className="input-label">Font chữ</label>
                        <select value={styles.fontFamily || 'Arial, sans-serif'} onChange={(e) => handleStyleChange('fontFamily', e.target.value)} className="input-select">
                            {FONT_PRESETS.map(font => (<option key={font.value} value={font.value}>{font.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Cỡ chữ</label>
                        <div className="input-with-unit">
                            <input type="number" value={parseInt(styles.fontSize) || 16} onChange={(e) => handleStyleChange('fontSize', e.target.value + 'px')} className="input-field" />
                            <span className="input-unit">px</span>
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Độ đậm</label>
                        <select value={styles.fontWeight || '600'} onChange={(e) => handleStyleChange('fontWeight', e.target.value)} className="input-select">
                            {FONT_WEIGHT_PRESETS.map(weight => (<option key={weight.value} value={weight.value}>{weight.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Màu chữ</label>
                        <div className="color-input-group">
                            <input type="color" value={styles.color || '#ffffff'} onChange={(e) => handleStyleChange('color', e.target.value)} className="color-picker" />
                            <input type="text" value={styles.color || '#ffffff'} onChange={(e) => handleStyleChange('color', e.target.value)} className="input-field" placeholder="#ffffff" />
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {['#ffffff', '#000000', '#1f2937', '#3b82f6', '#10b981', '#ef4444'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => handleStyleChange('color', color)}
                                    style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: color, border: styles.color === color ? '3px solid #3b82f6' : '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s' }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Căn chỉnh text</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[{ value: 'left', label: '← Trái' }, { value: 'center', label: '↔ Giữa' }, { value: 'right', label: 'Phải →' }].map(align => (
                                <button
                                    key={align.value}
                                    onClick={() => handleStyleChange('textAlign', align.value)}
                                    style={{ flex: 1, padding: '8px', fontSize: '12px', background: styles.textAlign === align.value ? '#3b82f6' : '#f3f4f6', color: styles.textAlign === align.value ? '#ffffff' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
                                >
                                    {align.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Chuyển đổi chữ</label>
                        <select value={styles.textTransform || 'none'} onChange={(e) => handleStyleChange('textTransform', e.target.value)} className="input-select">
                            <option value="none">Bình thường</option>
                            <option value="uppercase">CHỮ HOA</option>
                            <option value="lowercase">chữ thường</option>
                            <option value="capitalize">Viết Hoa Đầu Từ</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="panel-section">
                <h4 className="section-title"><Palette size={16} strokeWidth={1.5} />Màu sắc & Nền</h4>
                <div className="input-group">
                    <div>
                        <label className="input-label">Màu nền / Gradient</label>
                        <div className="color-input-group">
                            <input type="color" value={styles.background?.startsWith('#') ? styles.background : '#2563eb'} onChange={(e) => handleStyleChange('background', e.target.value)} className="color-picker" />
                            <input type="text" value={styles.background || '#2563eb'} onChange={(e) => handleStyleChange('background', e.target.value)} className="input-field" placeholder="#2563eb" />
                        </div>
                        <div className="color-preset-grid">
                            {COLOR_PRESETS.map(color => (
                                <div key={color} className={`color-preset-item ${styles.background === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => handleStyleChange('background', color)} title={color} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Gradient mẫu</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                            {GRADIENT_PRESETS.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => applyGradient(preset.value)}
                                    style={{
                                        height: '50px',
                                        borderRadius: '8px',
                                        background: preset.preview,
                                        border: styles.background === preset.value ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s'
                                    }}
                                    title={preset.name}
                                >
                                    <span style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: preset.name === 'Không có' ? '#000' : '#fff', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
                                        {preset.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="panel-section">
                <h4 className="section-title"><Box size={16} strokeWidth={1.5} />Viền & Bo góc</h4>
                <div className="input-group">
                    <div><label className="input-label">Viền (Border)</label><input type="text" value={styles.border || 'none'} onChange={(e) => handleStyleChange('border', e.target.value)} placeholder="2px solid #ffffff" className="input-field" /></div>
                    <div><label className="input-label">Bo góc</label><input type="range" min="0" max="50" step="1" value={parseInt(styles.borderRadius) || 8} onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')} className="input-range" /><span className="range-value">{parseInt(styles.borderRadius || 8)}px</span></div>
                    <div><label className="input-label">Padding</label><input type="text" value={styles.padding || '10px 20px'} onChange={(e) => handleStyleChange('padding', e.target.value)} placeholder="10px 20px" className="input-field" /></div>
                </div>
            </div>
            <div className="panel-section">
                <h4 className="section-title"><Sun size={16} strokeWidth={1.5} />Hiệu ứng bóng</h4>
                <div className="input-group">
                    <div><label className="input-label">Đổ bóng</label><input type="text" value={styles.boxShadow || 'none'} onChange={(e) => handleStyleChange('boxShadow', e.target.value)} placeholder="0 4px 6px rgba(0,0,0,0.1)" className="input-field" /><small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>Ví dụ: 0 4px 6px rgba(0,0,0,0.1)</small></div>
                    <div><label className="input-label">Đổ bóng chữ</label><input type="text" value={styles.textShadow || 'none'} onChange={(e) => handleStyleChange('textShadow', e.target.value)} placeholder="2px 2px 4px rgba(0,0,0,0.3)" className="input-field" /></div>
                </div>
            </div>
            <div className="panel-section">
                <h4 className="section-title"><Maximize size={16} strokeWidth={1.5} />Kích thước</h4>
                <div className="input-group">
                    <div className="size-inputs">
                        <div className="size-input-item"><label className="input-label">Width</label><input type="number" value={size.width || 160} onChange={(e) => handleSizeChange('width', e.target.value)} className="input-field" /></div>
                        <div className="size-input-item"><label className="input-label">Height</label><input type="number" value={size.height || 50} onChange={(e) => handleSizeChange('height', e.target.value)} className="input-field" /></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEventsTab = () => {
        const onClickEvent = componentData.events?.onClick || {};
        const onHoverEvent = componentData.events?.onHover || {};

        return (
            <div className="panel-content">
                <div className="panel-section">
                    <h4 className="section-title"><Zap size={16} strokeWidth={1.5} />Sự kiện Click</h4>
                    <div className="input-group">
                        <div><label className="input-label">Loại sự kiện</label><select value={onClickEvent.type || 'none'} onChange={(e) => handleEventChange('onClick', 'type', e.target.value)} className="input-select">{EVENT_TYPES.map(event => (<option key={event.value} value={event.value}>{event.name}</option>))}</select></div>
                        {onClickEvent.type === 'navigate' && (<div><label className="input-label">URL đích</label><input type="text" value={onClickEvent.url || ''} onChange={(e) => handleEventChange('onClick', 'url', e.target.value)} placeholder="https://example.com" className="input-field" /><div className="checkbox-group" style={{ marginTop: '8px' }}><input type="checkbox" id="open-new-tab" checked={onClickEvent.newTab || false} onChange={(e) => handleEventChange('onClick', 'newTab', e.target.checked)} /><label htmlFor="open-new-tab" className="checkbox-label">Mở tab mới</label></div></div>)}
                        {(onClickEvent.type === 'submitForm' || onClickEvent.type === 'triggerApi') && (<><div><label className="input-label">API URL</label><input type="text" value={onClickEvent.apiUrl || ''} onChange={(e) => handleEventChange('onClick', 'apiUrl', e.target.value)} placeholder="/api/submit" className="input-field" /></div><div><label className="input-label">HTTP Method</label><select value={onClickEvent.method || 'POST'} onChange={(e) => handleEventChange('onClick', 'method', e.target.value)} className="input-select"><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option></select></div></>)}
                        {onClickEvent.type === 'openPopup' && (<div><label className="input-label">Chọn Popup</label><select value={onClickEvent.popupId || ''} onChange={(e) => handleEventChange('onClick', 'popupId', e.target.value)} className="input-select"><option value="">-- Chọn popup --</option>{popupElements.map(popup => (<option key={popup.id} value={popup.id}>{popup.componentData?.title || popup.id}</option>))}</select></div>)}
                        {onClickEvent.type === 'closePopup' && (<div><label className="input-label">Chọn Popup để đóng</label><select value={onClickEvent.popupId || ''} onChange={(e) => handleEventChange('onClick', 'popupId', e.target.value)} className="input-select"><option value="">-- Chọn popup --</option>{popupElements.map(popup => (<option key={popup.id} value={popup.id}>{popup.componentData?.title || popup.id}</option>))}</select></div>)}
                        {onClickEvent.type === 'scrollToSection' && (<><div><label className="input-label">Chọn Section</label><select value={onClickEvent.sectionId || ''} onChange={(e) => handleEventChange('onClick', 'sectionId', e.target.value)} className="input-select"><option value="">-- Chọn section --</option>{sectionElements.map(section => (<option key={section.id} value={section.id}>{section.componentData?.title || section.id}</option>))}</select></div><div className="checkbox-group"><input type="checkbox" id="smooth-scroll" checked={onClickEvent.smooth !== false} onChange={(e) => handleEventChange('onClick', 'smooth', e.target.checked)} /><label htmlFor="smooth-scroll" className="checkbox-label">Cuộn mượt</label></div></>)}
                    </div>
                </div>
                <div className="panel-section">
                    <h4 className="section-title"><Settings size={16} strokeWidth={1.5} />Sự kiện Hover</h4>
                    <div className="input-group">
                        <div><label className="input-label">Class CSS khi hover</label><input type="text" value={onHoverEvent.className || ''} onChange={(e) => handleEventChange('onHover', 'className', e.target.value)} placeholder="hover-effect" className="input-field" /><small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>Để trống nếu không dùng</small></div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAnimationTab = () => (
        <div className="panel-content">
            <div className="panel-section">
                <h4 className="section-title"><Sparkles size={16} strokeWidth={1.5} />Hiệu ứng hiển thị</h4>
                <div className="input-group">
                    <div><label className="input-label">Hiệu ứng</label><select value={componentData.animation?.type || 'none'} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, type: e.target.value })} className="input-select">{ANIMATION_PRESETS.map(anim => (<option key={anim.value} value={anim.value}>{anim.name}</option>))}</select></div>
                    <div><label className="input-label">Thời gian (ms)</label><input type="range" min="100" max="3000" step="100" value={componentData.animation?.duration || 1000} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, duration: parseInt(e.target.value) })} className="input-range" /><span className="range-value">{componentData.animation?.duration || 1000}ms</span></div>
                    <div><label className="input-label">Độ trễ (ms)</label><input type="range" min="0" max="3000" step="100" value={componentData.animation?.delay || 0} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, delay: parseInt(e.target.value) })} className="input-range" /><span className="range-value">{componentData.animation?.delay || 0}ms</span></div>
                    <div className="checkbox-group"><input type="checkbox" id="repeat-animation" checked={componentData.animation?.repeat || false} onChange={(e) => handleComponentDataChange('animation', { ...componentData.animation, repeat: e.target.checked })} /><label htmlFor="repeat-animation" className="checkbox-label">Lặp lại hiệu ứng</label></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="element-properties-panel">
            <div className="panel-header">
                <input type="text" value={componentData.content || ''} onChange={(e) => handleComponentDataChange('content', e.target.value)} placeholder="Nội dung nút" className="panel-title-input" />
                <button onClick={onToggle} className="toggle-button" title="Đóng"><ChevronRight size={18} /></button>
            </div>
            <div className="panel-tabs">
                <button onClick={() => setActiveTab('design')} className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}><Palette size={16} /><span>Thiết kế</span></button>
                <button onClick={() => setActiveTab('events')} className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}><Zap size={16} /><span>Sự kiện</span></button>
                <button onClick={() => setActiveTab('animation')} className={`tab-button ${activeTab === 'animation' ? 'active' : ''}`}><Sparkles size={16} /><span>Hiệu ứng</span></button>
            </div>
            {activeTab === 'design' && renderDesignTab()}
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'animation' && renderAnimationTab()}
        </div>
    );
};

export default ButtonPropertiesPanel;