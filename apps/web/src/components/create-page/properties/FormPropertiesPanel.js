import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Plus, Trash2, GripVertical, Copy,
    Type, Mail, Phone, Calendar, Hash, CheckSquare, Circle,
    List, AlignLeft, Settings, Palette, Zap, Eye, Save, Code
} from 'lucide-react';
import '../../../styles/ElementPropertiesPanel.css';

// Field type configurations
const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type, placeholder: 'Enter text...' },
    { value: 'email', label: 'Email', icon: Mail, placeholder: 'email@example.com' },
    { value: 'tel', label: 'Phone', icon: Phone, placeholder: '+84 123 456 789' },
    { value: 'number', label: 'Number', icon: Hash, placeholder: '0' },
    { value: 'date', label: 'Date', icon: Calendar, placeholder: 'dd/mm/yyyy' },
    { value: 'password', label: 'Password', icon: Type, placeholder: '••••••••' },
    { value: 'textarea', label: 'Textarea', icon: AlignLeft, placeholder: 'Enter message...' },
    { value: 'select', label: 'Dropdown', icon: List, placeholder: 'Select an option' },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, placeholder: '' },
    { value: 'radio', label: 'Radio', icon: Circle, placeholder: '' },
];

const COLOR_PRESETS = [
    { color: '#2563eb', name: 'Blue' },
    { color: '#3b82f6', name: 'Light Blue' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#10b981', name: 'Green' },
    { color: '#22c55e', name: 'Lime' },
    { color: '#84cc16', name: 'Yellow Green' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#ef4444', name: 'Red' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#a855f7', name: 'Purple' },
    { color: '#8b5cf6', name: 'Violet' },
];

const GRADIENT_PRESETS = [
    { name: 'Blue Gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Ocean Gradient', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
    { name: 'Green Gradient', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { name: 'Sunset Gradient', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
    { name: 'Pink Gradient', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
    { name: 'Purple Gradient', value: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
];

const FormPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle }) => {
    const [activeTab, setActiveTab] = useState('fields');
    const [expandedFieldIndex, setExpandedFieldIndex] = useState(null);
    const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);

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
                    <h3 className="panel-title">
                        <Settings size={16} style={{ marginRight: '8px' }} />
                        Form Properties
                    </h3>
                    <button onClick={onToggle} className="toggle-button" title="Đóng">
                        <ChevronRight size={18} />
                    </button>
                </div>
                <div className="panel-empty">
                    <p>Chọn một form để chỉnh sửa</p>
                </div>
            </div>
        );
    }

    const formData = selectedElement.json.componentData || {};
    const fields = formData.fields || [];
    const styles = selectedElement.json.styles || {};

    // ==================== FIELD MANAGEMENT FUNCTIONS ====================

    const addField = (fieldType) => {
        const fieldConfig = FIELD_TYPES.find(ft => ft.value === fieldType);
        const newField = {
            type: fieldType,
            label: fieldConfig?.label || 'Field',
            placeholder: fieldConfig?.placeholder || 'Enter...',
            required: false,
            ...(fieldType === 'textarea' && { rows: 4 }),
            ...(fieldType === 'select' && {
                options: [
                    { value: '', label: '-- Chọn --' },
                    { value: 'option1', label: 'Tùy chọn 1' },
                    { value: 'option2', label: 'Tùy chọn 2' },
                ]
            }),
            ...(fieldType === 'radio' && {
                name: `radio-${Date.now()}`,
                options: [
                    { value: 'option1', label: 'Tùy chọn 1' },
                    { value: 'option2', label: 'Tùy chọn 2' },
                ]
            }),
        };

        const updatedFields = [...fields, newField];
        updateFormData({ fields: updatedFields });
        setExpandedFieldIndex(updatedFields.length - 1);
        setShowAddFieldMenu(false);
    };

    const removeField = (index) => {
        if (!window.confirm('Xóa field này?')) return;
        const updatedFields = fields.filter((_, i) => i !== index);
        updateFormData({ fields: updatedFields });
        if (expandedFieldIndex === index) {
            setExpandedFieldIndex(null);
        }
    };

    const updateField = (index, updates) => {
        const updatedFields = [...fields];
        updatedFields[index] = { ...updatedFields[index], ...updates };
        updateFormData({ fields: updatedFields });
    };

    const moveField = (fromIndex, toIndex) => {
        if (toIndex < 0 || toIndex >= fields.length) return;
        const updatedFields = [...fields];
        const [movedField] = updatedFields.splice(fromIndex, 1);
        updatedFields.splice(toIndex, 0, movedField);
        updateFormData({ fields: updatedFields });
        setExpandedFieldIndex(toIndex);
    };

    const duplicateField = (index) => {
        const fieldToDuplicate = { ...fields[index] };
        if (fieldToDuplicate.name) {
            fieldToDuplicate.name = `${fieldToDuplicate.name}-copy`;
        }
        const updatedFields = [...fields];
        updatedFields.splice(index + 1, 0, fieldToDuplicate);
        updateFormData({ fields: updatedFields });
        setExpandedFieldIndex(index + 1);
    };

    const updateFormData = (updates) => {
        const updatedElement = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                componentData: {
                    ...formData,
                    ...updates
                }
            }
        };
        onUpdateElement(updatedElement);
    };

    const updateStyles = (styleUpdates) => {
        const updatedElement = {
            ...selectedElement,
            json: {
                ...selectedElement.json,
                styles: {
                    ...styles,
                    ...styleUpdates
                }
            }
        };
        onUpdateElement(updatedElement);
    };

    // ==================== RENDER OPTION EDITOR ====================

    const renderOptionEditor = (field, fieldIndex) => {
        const options = field.options || [];

        const addOption = () => {
            const newOption = {
                value: `option${options.length}`,
                label: `Tùy chọn ${options.length}`
            };
            updateField(fieldIndex, {
                options: [...options, newOption]
            });
        };

        const updateOption = (optIndex, updates) => {
            const updatedOptions = [...options];
            updatedOptions[optIndex] = { ...updatedOptions[optIndex], ...updates };
            updateField(fieldIndex, { options: updatedOptions });
        };

        const removeOption = (optIndex) => {
            if (options.length <= 1) {
                alert('Phải có ít nhất 1 option!');
                return;
            }
            const updatedOptions = options.filter((_, i) => i !== optIndex);
            updateField(fieldIndex, { options: updatedOptions });
        };

        return (
            <div style={{ marginTop: '12px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                }}>
                    <label style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151'
                    }}>
                        Options
                    </label>
                    <button
                        onClick={addOption}
                        style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#059669'}
                        onMouseOut={(e) => e.target.style.background = '#10b981'}
                    >
                        <Plus size={12} /> Add Option
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((option, optIndex) => (
                        <div
                            key={optIndex}
                            style={{
                                display: 'flex',
                                gap: '6px',
                                padding: '10px',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}
                        >
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(optIndex, { label: e.target.value })}
                                    placeholder="Label hiển thị"
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        fontSize: '13px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={option.value}
                                    onChange={(e) => updateOption(optIndex, { value: e.target.value })}
                                    placeholder="Value gửi lên"
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        fontSize: '13px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        fontFamily: 'monospace',
                                        color: '#6b7280'
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => removeOption(optIndex)}
                                style={{
                                    padding: '8px',
                                    background: '#fef2f2',
                                    color: '#ef4444',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    height: 'fit-content',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#ef4444';
                                    e.target.style.color = '#fff';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = '#fef2f2';
                                    e.target.style.color = '#ef4444';
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // ==================== RENDER TABS ====================

    const renderFieldsTab = () => (
        <div className="panel-section">
            {/* Header with Add Button */}
            <div style={{
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <List size={16} />
                        Form Fields
                        <span style={{
                            background: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280'
                        }}>
                            {fields.length}
                        </span>
                    </h4>
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowAddFieldMenu(!showAddFieldMenu)}
                            style={{
                                padding: '8px 14px',
                                fontSize: '13px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#1d4ed8';
                                e.target.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = '#2563eb';
                                e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                            }}
                        >
                            <Plus size={16} /> Add Field
                        </button>

                        {/* Add Field Menu */}
                        {showAddFieldMenu && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    background: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                    zIndex: 1000,
                                    minWidth: '200px',
                                    overflow: 'hidden'
                                }}
                            >
                                {FIELD_TYPES.map(fieldType => {
                                    const Icon = fieldType.icon;
                                    return (
                                        <button
                                            key={fieldType.value}
                                            onClick={() => addField(fieldType.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                fontSize: '13px',
                                                background: '#fff',
                                                color: '#374151',
                                                border: 'none',
                                                borderBottom: '1px solid #f3f4f6',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                textAlign: 'left',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#f9fafb';
                                                e.target.style.color = '#2563eb';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = '#fff';
                                                e.target.style.color = '#374151';
                                            }}
                                        >
                                            <Icon size={16} />
                                            {fieldType.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#6b7280'
                }}>
                    Quản lý tất cả fields trong form của bạn
                </p>
            </div>

            {/* Empty State */}
            {fields.length === 0 ? (
                <div style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    borderRadius: '12px',
                    border: '2px dashed #d1d5db'
                }}>
                    <AlignLeft size={48} style={{ margin: '0 auto 16px', opacity: 0.3, strokeWidth: 1.5 }} />
                    <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#6b7280' }}>
                        Chưa có field nào
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                        Click "Add Field" để thêm field đầu tiên
                    </p>
                </div>
            ) : (
                // Field List
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {fields.map((field, index) => {
                        const isExpanded = expandedFieldIndex === index;
                        const fieldConfig = FIELD_TYPES.find(ft => ft.value === field.type);
                        const FieldIcon = fieldConfig?.icon || Type;

                        return (
                            <div
                                key={index}
                                style={{
                                    border: isExpanded ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    background: '#fff',
                                    boxShadow: isExpanded ? '0 4px 12px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* Field Header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '14px',
                                        cursor: 'pointer',
                                        background: isExpanded ? '#eff6ff' : 'transparent',
                                        borderTopLeftRadius: '10px',
                                        borderTopRightRadius: '10px'
                                    }}
                                    onClick={() => setExpandedFieldIndex(isExpanded ? null : index)}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isExpanded ? '#dbeafe' : '#f3f4f6',
                                        borderRadius: '8px',
                                        color: isExpanded ? '#2563eb' : '#6b7280'
                                    }}>
                                        <FieldIcon size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#111827',
                                            marginBottom: '2px'
                                        }}>
                                            {field.label || fieldConfig?.label || 'Field'}
                                            {field.required && (
                                                <span style={{
                                                    color: '#ef4444',
                                                    marginLeft: '4px',
                                                    fontSize: '16px'
                                                }}>*</span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            fontWeight: '500'
                                        }}>
                                            {fieldConfig?.label || field.type}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateField(index);
                                            }}
                                            style={{
                                                padding: '6px',
                                                background: '#f3f4f6',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: '#6b7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#e5e7eb';
                                                e.target.style.color = '#374151';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = '#f3f4f6';
                                                e.target.style.color = '#6b7280';
                                            }}
                                            title="Duplicate"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeField(index);
                                            }}
                                            style={{
                                                padding: '6px',
                                                background: '#fef2f2',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: '#ef4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = '#ef4444';
                                                e.target.style.color = '#fff';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = '#fef2f2';
                                                e.target.style.color = '#ef4444';
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Field Editor */}
                                {isExpanded && (
                                    <div style={{
                                        padding: '16px',
                                        borderTop: '1px solid #e5e7eb',
                                        background: '#fafbfc'
                                    }}>
                                        {/* Field Type */}
                                        <div className="property-group" style={{ marginBottom: '14px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '8px'
                                            }}>
                                                Field Type
                                            </label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    const updates = { type: newType };
                                                    if (newType === 'textarea' && !field.rows) {
                                                        updates.rows = 4;
                                                    }
                                                    if ((newType === 'select' || newType === 'radio') && !field.options) {
                                                        updates.options = [
                                                            { value: '', label: '-- Chọn --' },
                                                            { value: 'option1', label: 'Tùy chọn 1' }
                                                        ];
                                                    }
                                                    if (newType === 'radio' && !field.name) {
                                                        updates.name = `radio-${Date.now()}`;
                                                    }
                                                    updateField(index, updates);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: '13px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    background: '#fff',
                                                    outline: 'none'
                                                }}
                                            >
                                                {FIELD_TYPES.map(ft => (
                                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Label */}
                                        <div className="property-group" style={{ marginBottom: '14px' }}>
                                            <label style={{
                                                display: 'block',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#374151',
                                                marginBottom: '8px'
                                            }}>
                                                Label
                                            </label>
                                            <input
                                                type="text"
                                                value={field.label || ''}
                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                placeholder="Tên hiển thị"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    fontSize: '13px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        {/* Placeholder */}
                                        {!['checkbox', 'radio'].includes(field.type) && (
                                            <div className="property-group" style={{ marginBottom: '14px' }}>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    marginBottom: '8px'
                                                }}>
                                                    Placeholder
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                    placeholder="Text gợi ý"
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Textarea Rows */}
                                        {field.type === 'textarea' && (
                                            <div className="property-group" style={{ marginBottom: '14px' }}>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    marginBottom: '8px'
                                                }}>
                                                    Number of Rows
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="20"
                                                    value={field.rows || 4}
                                                    onChange={(e) => updateField(index, { rows: parseInt(e.target.value) || 4 })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Options Editor */}
                                        {(field.type === 'select' || field.type === 'radio') && renderOptionEditor(field, index)}

                                        {/* Required Toggle */}
                                        <div className="property-group" style={{ marginTop: '14px', marginBottom: '14px' }}>
                                            <label style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                padding: '10px',
                                                background: field.required ? '#dbeafe' : '#f9fafb',
                                                borderRadius: '8px',
                                                border: field.required ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                                                transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={field.required || false}
                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                <span style={{
                                                    fontSize: '13px',
                                                    color: '#374151',
                                                    fontWeight: '500'
                                                }}>
                                                    Required field (bắt buộc)
                                                </span>
                                            </label>
                                        </div>

                                        {/* Name Attribute */}
                                        {(field.type === 'checkbox' || field.type === 'radio') && (
                                            <div className="property-group" style={{ marginBottom: '14px' }}>
                                                <label style={{
                                                    display: 'block',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    marginBottom: '8px'
                                                }}>
                                                    Name Attribute
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.name || ''}
                                                    onChange={(e) => updateField(index, { name: e.target.value })}
                                                    placeholder="field-name"
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 12px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '8px',
                                                        outline: 'none',
                                                        fontFamily: 'monospace'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Move Buttons */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '16px',
                                            paddingTop: '16px',
                                            borderTop: '1px solid #e5e7eb'
                                        }}>
                                            <button
                                                onClick={() => moveField(index, index - 1)}
                                                disabled={index === 0}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    background: index === 0 ? '#f3f4f6' : '#fff',
                                                    color: index === 0 ? '#9ca3af' : '#374151',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ↑ Move Up
                                            </button>
                                            <button
                                                onClick={() => moveField(index, index + 1)}
                                                disabled={index === fields.length - 1}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    background: index === fields.length - 1 ? '#f3f4f6' : '#fff',
                                                    color: index === fields.length - 1 ? '#9ca3af' : '#374151',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                ↓ Move Down
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderDesignTab = () => (
        <div className="panel-section">
            {/* Form Title */}
            <div className="property-group">
                <label>Form Title</label>
                <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Enter form title..."
                />
            </div>

            {/* Layout Direction */}
            <div className="property-group">
                <label>Layout Direction</label>
                <select
                    value={formData.direction || 'column'}
                    onChange={(e) => updateFormData({ direction: e.target.value })}
                >
                    <option value="column">Vertical (Column)</option>
                    <option value="row">Horizontal (Row)</option>
                </select>
            </div>

            {/* Gap */}
            <div className="property-group">
                <label>Gap Between Fields</label>
                <input
                    type="text"
                    value={formData.gap || '16px'}
                    onChange={(e) => updateFormData({ gap: e.target.value })}
                    placeholder="16px"
                />
            </div>

            {/* Button Text */}
            <div className="property-group">
                <label>Submit Button Text</label>
                <input
                    type="text"
                    value={formData.buttonText || 'Submit'}
                    onChange={(e) => updateFormData({ buttonText: e.target.value })}
                    placeholder="Submit"
                />
            </div>

            {/* Button Background */}
            <div className="property-group">
                <label>Button Background Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', marginBottom: '8px' }}>
                    {COLOR_PRESETS.map(preset => (
                        <div
                            key={preset.color}
                            onClick={() => updateFormData({ buttonBackground: preset.color })}
                            title={preset.name}
                            style={{
                                width: '36px',
                                height: '36px',
                                background: preset.color,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: formData.buttonBackground === preset.color ? '3px solid #000' : '2px solid #e5e7eb',
                                transition: 'all 0.2s',
                                boxShadow: formData.buttonBackground === preset.color ? '0 4px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        />
                    ))}
                </div>
                <input
                    type="text"
                    value={formData.buttonBackground || '#2563eb'}
                    onChange={(e) => updateFormData({ buttonBackground: e.target.value })}
                    placeholder="#2563eb or gradient..."
                />
            </div>

            {/* Button Gradient */}
            <div className="property-group">
                <label>Button Gradient Presets</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {GRADIENT_PRESETS.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => updateFormData({ buttonBackground: preset.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: preset.value,
                                border: formData.buttonBackground === preset.value ? '2px solid #000' : '1px solid #e5e7eb',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: '600',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Button Text Color */}
            <div className="property-group">
                <label>Button Text Color</label>
                <input
                    type="text"
                    value={formData.buttonColor || '#fff'}
                    onChange={(e) => updateFormData({ buttonColor: e.target.value })}
                    placeholder="#fff"
                />
            </div>

            {/* Button Padding */}
            <div className="property-group">
                <label>Button Padding</label>
                <input
                    type="text"
                    value={formData.buttonPadding || '12px 24px'}
                    onChange={(e) => updateFormData({ buttonPadding: e.target.value })}
                    placeholder="12px 24px"
                />
            </div>

            {/* Button Border Radius */}
            <div className="property-group">
                <label>Button Border Radius</label>
                <input
                    type="text"
                    value={formData.buttonBorderRadius || '8px'}
                    onChange={(e) => updateFormData({ buttonBorderRadius: e.target.value })}
                    placeholder="8px"
                />
            </div>

            <div style={{
                height: '1px',
                background: '#e5e7eb',
                margin: '20px 0'
            }} />

            {/* Form Background */}
            <div className="property-group">
                <label>Form Background</label>
                <input
                    type="text"
                    value={styles.background || '#ffffff'}
                    onChange={(e) => updateStyles({ background: e.target.value })}
                    placeholder="#ffffff"
                />
            </div>

            {/* Form Padding */}
            <div className="property-group">
                <label>Form Padding</label>
                <input
                    type="text"
                    value={styles.padding || '32px'}
                    onChange={(e) => updateStyles({ padding: e.target.value })}
                    placeholder="32px"
                />
            </div>

            {/* Form Border Radius */}
            <div className="property-group">
                <label>Form Border Radius</label>
                <input
                    type="text"
                    value={styles.borderRadius || '16px'}
                    onChange={(e) => updateStyles({ borderRadius: e.target.value })}
                    placeholder="16px"
                />
            </div>

            {/* Form Shadow */}
            <div className="property-group">
                <label>Form Shadow</label>
                <select
                    value={styles.boxShadow || '0 4px 6px rgba(0, 0, 0, 0.1)'}
                    onChange={(e) => updateStyles({ boxShadow: e.target.value })}
                >
                    <option value="none">None</option>
                    <option value="0 1px 3px rgba(0, 0, 0, 0.1)">Small</option>
                    <option value="0 4px 6px rgba(0, 0, 0, 0.1)">Medium</option>
                    <option value="0 10px 25px rgba(0, 0, 0, 0.1)">Large</option>
                    <option value="0 20px 40px rgba(0, 0, 0, 0.15)">Extra Large</option>
                </select>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="panel-section">
            {/* Form Action */}
            <div className="property-group">
                <label>Form Action URL (API Endpoint)</label>
                <input
                    type="text"
                    value={formData.events?.onSubmit?.apiUrl || ''}
                    onChange={(e) => updateFormData({
                        events: {
                            ...formData.events,
                            onSubmit: {
                                type: 'submitForm',
                                apiUrl: e.target.value
                            }
                        }
                    })}
                    placeholder="/api/contact"
                />
                <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
                    URL để gửi form data (POST request)
                </small>
            </div>

            {/* Success Message */}
            <div className="property-group">
                <label>Success Message</label>
                <input
                    type="text"
                    value={formData.successMessage || ''}
                    onChange={(e) => updateFormData({ successMessage: e.target.value })}
                    placeholder="Cảm ơn bạn đã gửi thông tin!"
                />
            </div>

            {/* Error Message */}
            <div className="property-group">
                <label>Error Message</label>
                <input
                    type="text"
                    value={formData.errorMessage || ''}
                    onChange={(e) => updateFormData({ errorMessage: e.target.value })}
                    placeholder="Có lỗi xảy ra, vui lòng thử lại."
                />
            </div>

            <div style={{
                height: '1px',
                background: '#e5e7eb',
                margin: '20px 0'
            }} />

            {/* Enable Validation */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.enableValidation !== false}
                        onChange={(e) => updateFormData({ enableValidation: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Enable HTML5 Validation</span>
                </label>
                <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
                    Bật validation tự động cho email, số điện thoại, v.v.
                </small>
            </div>

            {/* Reset After Submit */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.resetAfterSubmit || false}
                        onChange={(e) => updateFormData({ resetAfterSubmit: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Reset Form After Submit</span>
                </label>
                <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
                    Xóa hết dữ liệu sau khi gửi thành công
                </small>
            </div>

            {/* Show Loading */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.showLoadingState !== false}
                        onChange={(e) => updateFormData({ showLoadingState: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Show Loading State</span>
                </label>
                <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontSize: '12px' }}>
                    Hiển thị trạng thái đang gửi khi submit
                </small>
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================

    // Click outside to close menu
    React.useEffect(() => {
        const handleClickOutside = () => setShowAddFieldMenu(false);
        if (showAddFieldMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showAddFieldMenu]);

    return (
        <div className="element-properties-panel">
            <div className="panel-header">
                <h3 className="panel-title">
                    <Settings size={16} style={{ marginRight: '8px' }} />
                    Form Properties
                </h3>
                <button onClick={onToggle} className="toggle-button" title="Close">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="panel-tabs">
                <button
                    className={`tab ${activeTab === 'fields' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fields')}
                >
                    <List size={14} />
                    Fields
                </button>
                <button
                    className={`tab ${activeTab === 'design' ? 'active' : ''}`}
                    onClick={() => setActiveTab('design')}
                >
                    <Palette size={14} />
                    Design
                </button>
                <button
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Zap size={14} />
                    Settings
                </button>
            </div>

            {/* Tab Content */}
            <div className="panel-content">
                {activeTab === 'fields' && renderFieldsTab()}
                {activeTab === 'design' && renderDesignTab()}
                {activeTab === 'settings' && renderSettingsTab()}
            </div>
        </div>
    );
};

export default FormPropertiesPanel;
