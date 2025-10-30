import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, MousePointer,
    Settings, Palette, Zap, Clock, PlayCircle,
    ChevronDown, BarChart2, Star, TrendingUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import '../../../styles/ElementPropertiesPanel.css';

const COLOR_PRESETS = [
    '#000000', '#ffffff', '#f3f4f6', '#1f2937', '#374151',
    '#667eea', '#764ba2', '#2563eb', '#3b82f6', '#06b6d4',
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b',
    '#ef4444', '#dc2626', '#ec4899', '#a855f7', '#8b5cf6'
];

const AdvancedPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle }) => {
    const [activeTab, setActiveTab] = useState('content');

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
                    <p className="empty-text">Chọn một component để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const { type, componentData = {}, styles = {}, size = {} } = selectedElement.json;

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

    const handleNestedChange = (path, value) => {
        const keys = path.split('.');
        const updated = { ...selectedElement };
        let current = updated.json.componentData;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        onUpdateElement(updated);
    };

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

    const handleArrayItemChange = (arrayKey, index, itemKey, value) => {
        const items = [...(componentData[arrayKey] || [])];
        items[index] = { ...items[index], [itemKey]: value };
        handleComponentDataChange(arrayKey, items);
    };

    const addArrayItem = (arrayKey, defaultItem) => {
        const items = [...(componentData[arrayKey] || []), defaultItem];
        handleComponentDataChange(arrayKey, items);
        toast.success('Đã thêm item mới');
    };

    const removeArrayItem = (arrayKey, index) => {
        const items = (componentData[arrayKey] || []).filter((_, i) => i !== index);
        handleComponentDataChange(arrayKey, items);
        toast.success('Đã xóa item');
    };

    const getComponentIcon = () => {
        switch (type) {
            case 'countdown': return <Clock size={18} />;
            case 'carousel': return <PlayCircle size={18} />;
            case 'accordion': return <ChevronDown size={18} />;
            case 'tabs': return <Settings size={18} />;
            case 'progress': return <BarChart2 size={18} />;
            case 'rating': return <Star size={18} />;
            case 'social-proof':
            case 'social-proof-stats': return <TrendingUp size={18} />;
            default: return <Settings size={18} />;
        }
    };

    const getComponentName = () => {
        switch (type) {
            case 'countdown': return 'Đếm Ngược';
            case 'carousel': return 'Carousel';
            case 'accordion': return 'Accordion';
            case 'tabs': return 'Tabs';
            case 'progress': return 'Progress Bar';
            case 'rating': return 'Đánh Giá';
            case 'social-proof': return 'Social Proof';
            case 'social-proof-stats': return 'Social Stats';
            default: return 'Advanced Component';
        }
    };

    const renderCountdownProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Tiêu đề</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.title || ''}
                    onChange={(e) => handleComponentDataChange('title', e.target.value)}
                    placeholder="Countdown Timer"
                />
            </div>
            <div className="control-group">
                <label className="control-label">Ngày kết thúc</label>
                <input
                    type="datetime-local"
                    className="control-input"
                    value={componentData.targetDate ? new Date(componentData.targetDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleComponentDataChange('targetDate', new Date(e.target.value).toISOString())}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Nhãn Ngày</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.labels?.days || 'Ngày'}
                    onChange={(e) => handleNestedChange('labels.days', e.target.value)}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Nhãn Giờ</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.labels?.hours || 'Giờ'}
                    onChange={(e) => handleNestedChange('labels.hours', e.target.value)}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Nhãn Phút</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.labels?.minutes || 'Phút'}
                    onChange={(e) => handleNestedChange('labels.minutes', e.target.value)}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Nhãn Giây</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.labels?.seconds || 'Giây'}
                    onChange={(e) => handleNestedChange('labels.seconds', e.target.value)}
                />
            </div>
        </>
    );

    const renderCarouselProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Tiêu đề</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.title || ''}
                    onChange={(e) => handleComponentDataChange('title', e.target.value)}
                    placeholder="Carousel Title"
                />
            </div>
            <div className="control-group">
                <label className="control-label">Items ({(componentData.items || []).length})</label>
                {(componentData.items || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Item {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('items', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Tên"
                            value={item.name || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'name', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Role/Chức vụ"
                            value={item.role || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'role', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <textarea
                            className="control-input"
                            placeholder="Nội dung"
                            value={item.text || item.content || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'text', e.target.value)}
                            rows={3}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="url"
                            className="control-input"
                            placeholder="URL hình ảnh"
                            value={item.image || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'image', e.target.value)}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('items', { name: 'Khách hàng', role: 'CEO', text: 'Đánh giá tuyệt vời!', image: 'https://i.pravatar.cc/150' })}
                    className="control-button"
                >
                    + Thêm Item
                </button>
            </div>
        </>
    );

    const renderAccordionProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Tiêu đề</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.title || ''}
                    onChange={(e) => handleComponentDataChange('title', e.target.value)}
                    placeholder="FAQ"
                />
            </div>
            <div className="control-group">
                <label className="control-label">Items ({(componentData.items || []).length})</label>
                {(componentData.items || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Item {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('items', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Câu hỏi"
                            value={item.question || item.title || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'question', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <textarea
                            className="control-input"
                            placeholder="Câu trả lời"
                            value={item.answer || item.content || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'answer', e.target.value)}
                            rows={3}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('items', { question: 'Câu hỏi mới?', answer: 'Câu trả lời...' })}
                    className="control-button"
                >
                    + Thêm Câu Hỏi
                </button>
            </div>
        </>
    );

    const renderTabsProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Tiêu đề</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.title || ''}
                    onChange={(e) => handleComponentDataChange('title', e.target.value)}
                    placeholder="Pricing Plans"
                />
            </div>
            <div className="control-group">
                <label className="control-label">Tabs ({(componentData.tabs || []).length})</label>
                {(componentData.tabs || []).map((tab, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Tab {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('tabs', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Label tab"
                            value={tab.label || ''}
                            onChange={(e) => handleArrayItemChange('tabs', index, 'label', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <textarea
                            className="control-input"
                            placeholder="Nội dung (hoặc để trống nếu dùng pricing)"
                            value={tab.text || ''}
                            onChange={(e) => handleArrayItemChange('tabs', index, 'text', e.target.value)}
                            rows={3}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('tabs', { label: 'Tab mới', text: 'Nội dung tab...' })}
                    className="control-button"
                >
                    + Thêm Tab
                </button>
            </div>
        </>
    );

    const renderProgressProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Tiêu đề</label>
                <input
                    type="text"
                    className="control-input"
                    value={componentData.title || ''}
                    onChange={(e) => handleComponentDataChange('title', e.target.value)}
                    placeholder="Kỹ năng"
                />
            </div>
            <div className="control-group">
                <label className="control-label">
                    <input
                        type="checkbox"
                        checked={componentData.showPercentage !== false}
                        onChange={(e) => handleComponentDataChange('showPercentage', e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    Hiển thị phần trăm
                </label>
            </div>
            <div className="control-group">
                <label className="control-label">Items ({(componentData.items || []).length})</label>
                {(componentData.items || []).map((item, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Item {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('items', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Label"
                            value={item.label || ''}
                            onChange={(e) => handleArrayItemChange('items', index, 'label', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="number"
                            className="control-input"
                            placeholder="Giá trị (0-100)"
                            min="0"
                            max="100"
                            value={item.value || 0}
                            onChange={(e) => handleArrayItemChange('items', index, 'value', parseInt(e.target.value))}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="color"
                            className="control-input"
                            value={item.color || '#3b82f6'}
                            onChange={(e) => handleArrayItemChange('items', index, 'color', e.target.value)}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('items', { label: 'Kỹ năng mới', value: 50, color: '#3b82f6' })}
                    className="control-button"
                >
                    + Thêm Item
                </button>
            </div>
        </>
    );

    const renderRatingProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Đánh giá</label>
                <input
                    type="number"
                    className="control-input"
                    min="0"
                    max={componentData.maxRating || 5}
                    step="0.1"
                    value={componentData.rating || 0}
                    onChange={(e) => handleComponentDataChange('rating', parseFloat(e.target.value))}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Số sao tối đa</label>
                <input
                    type="number"
                    className="control-input"
                    min="1"
                    max="10"
                    value={componentData.maxRating || 5}
                    onChange={(e) => handleComponentDataChange('maxRating', parseInt(e.target.value))}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Số đánh giá</label>
                <input
                    type="number"
                    className="control-input"
                    min="0"
                    value={componentData.reviews || 0}
                    onChange={(e) => handleComponentDataChange('reviews', parseInt(e.target.value))}
                />
            </div>
            <div className="control-group">
                <label className="control-label">
                    <input
                        type="checkbox"
                        checked={componentData.showReviews !== false}
                        onChange={(e) => handleComponentDataChange('showReviews', e.target.checked)}
                        style={{ marginRight: '8px' }}
                    />
                    Hiển thị số đánh giá
                </label>
            </div>
            <div className="control-group">
                <label className="control-label">Màu sao</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {COLOR_PRESETS.map((color) => (
                        <div
                            key={color}
                            onClick={() => handleComponentDataChange('color', color)}
                            style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: color,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: componentData.color === color ? '3px solid #2563eb' : '1px solid #e5e7eb',
                            }}
                            title={color}
                        />
                    ))}
                </div>
            </div>
        </>
    );

    const renderSocialProofProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Interval (ms)</label>
                <input
                    type="number"
                    className="control-input"
                    min="1000"
                    step="1000"
                    value={componentData.interval || 5000}
                    onChange={(e) => handleComponentDataChange('interval', parseInt(e.target.value))}
                />
            </div>
            <div className="control-group">
                <label className="control-label">Notifications ({(componentData.notifications || []).length})</label>
                {(componentData.notifications || []).map((notif, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Notification {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('notifications', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Tên khách hàng"
                            value={notif.name || ''}
                            onChange={(e) => handleArrayItemChange('notifications', index, 'name', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Hành động (vừa mua, vừa đăng ký...)"
                            value={notif.action || ''}
                            onChange={(e) => handleArrayItemChange('notifications', index, 'action', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Sản phẩm"
                            value={notif.product || ''}
                            onChange={(e) => handleArrayItemChange('notifications', index, 'product', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Thời gian (5 phút trước...)"
                            value={notif.time || ''}
                            onChange={(e) => handleArrayItemChange('notifications', index, 'time', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="url"
                            className="control-input"
                            placeholder="Avatar URL"
                            value={notif.avatar || ''}
                            onChange={(e) => handleArrayItemChange('notifications', index, 'avatar', e.target.value)}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('notifications', {
                        name: 'Khách hàng',
                        action: 'vừa mua',
                        product: 'Sản phẩm',
                        time: '5 phút trước',
                        avatar: 'https://i.pravatar.cc/50'
                    })}
                    className="control-button"
                >
                    + Thêm Notification
                </button>
            </div>
        </>
    );

    const renderSocialProofStatsProperties = () => (
        <>
            <div className="control-group">
                <label className="control-label">Stats ({(componentData.stats || []).length})</label>
                {(componentData.stats || []).map((stat, index) => (
                    <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>Stat {index + 1}</strong>
                            <button
                                onClick={() => removeArrayItem('stats', index)}
                                className="control-button-danger"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                                Xóa
                            </button>
                        </div>
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Icon (emoji hoặc icon)"
                            value={stat.icon || ''}
                            onChange={(e) => handleArrayItemChange('stats', index, 'icon', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Giá trị (10,000+, 4.9/5...)"
                            value={stat.value || ''}
                            onChange={(e) => handleArrayItemChange('stats', index, 'value', e.target.value)}
                            style={{ marginBottom: '8px' }}
                        />
                        <input
                            type="text"
                            className="control-input"
                            placeholder="Label (Khách hàng, Đánh giá...)"
                            value={stat.label || ''}
                            onChange={(e) => handleArrayItemChange('stats', index, 'label', e.target.value)}
                        />
                    </div>
                ))}
                <button
                    onClick={() => addArrayItem('stats', { icon: '📊', value: '1000+', label: 'Metric' })}
                    className="control-button"
                >
                    + Thêm Stat
                </button>
            </div>
        </>
    );

    const renderContentTab = () => {
        switch (type) {
            case 'countdown': return renderCountdownProperties();
            case 'carousel': return renderCarouselProperties();
            case 'accordion': return renderAccordionProperties();
            case 'tabs': return renderTabsProperties();
            case 'progress': return renderProgressProperties();
            case 'rating': return renderRatingProperties();
            case 'social-proof': return renderSocialProofProperties();
            case 'social-proof-stats': return renderSocialProofStatsProperties();
            default:
                return (
                    <div className="control-group">
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            Không có properties cụ thể cho component này.
                        </p>
                    </div>
                );
        }
    };

    const renderDesignTab = () => (
        <>
            <div className="control-group">
                <label className="control-label">Kích thước</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Width</label>
                        <input
                            type="number"
                            className="control-input"
                            value={size.width || 600}
                            onChange={(e) => handleSizeChange('width', e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Height</label>
                        <input
                            type="number"
                            className="control-input"
                            value={size.height || 400}
                            onChange={(e) => handleSizeChange('height', e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="control-group">
                <label className="control-label">Background</label>
                <input
                    type="text"
                    className="control-input"
                    value={styles.background || styles.backgroundColor || ''}
                    onChange={(e) => handleStyleChange('background', e.target.value)}
                    placeholder="#ffffff hoặc gradient..."
                />
            </div>
            <div className="control-group">
                <label className="control-label">Border Radius</label>
                <input
                    type="text"
                    className="control-input"
                    value={styles.borderRadius || ''}
                    onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                    placeholder="0px, 8px, 16px..."
                />
            </div>
            <div className="control-group">
                <label className="control-label">Padding</label>
                <input
                    type="text"
                    className="control-input"
                    value={styles.padding || ''}
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    placeholder="20px"
                />
            </div>
            <div className="control-group">
                <label className="control-label">Box Shadow</label>
                <input
                    type="text"
                    className="control-input"
                    value={styles.boxShadow || ''}
                    onChange={(e) => handleStyleChange('boxShadow', e.target.value)}
                    placeholder="0 4px 6px rgba(0,0,0,0.1)"
                />
            </div>
        </>
    );

    return (
        <div className="properties-panel">
            <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getComponentIcon()}
                    <span style={{ fontWeight: 600 }}>{getComponentName()}</span>
                </div>
                <button onClick={onToggle} className="toggle-button" title="Đóng">
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="panel-tabs">
                <button
                    className={`panel-tab ${activeTab === 'content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('content')}
                >
                    <Settings size={16} />
                    <span>Nội dung</span>
                </button>
                <button
                    className={`panel-tab ${activeTab === 'design' ? 'active' : ''}`}
                    onClick={() => setActiveTab('design')}
                >
                    <Palette size={16} />
                    <span>Thiết kế</span>
                </button>
            </div>

            <div className="panel-content">
                {activeTab === 'content' && renderContentTab()}
                {activeTab === 'design' && renderDesignTab()}
            </div>
        </div>
    );
};

export default AdvancedPropertiesPanel;
