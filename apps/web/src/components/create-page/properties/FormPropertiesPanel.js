import React, { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Plus, Trash2, GripVertical,
    Type, Mail, Phone, Calendar, Hash, CheckSquare, Circle,
    List, AlignLeft, Settings, Palette, Zap, Eye
} from 'lucide-react';
import '../../../styles/ElementPropertiesPanel.css';

// Field type configurations
const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'tel', label: 'Phone', icon: Phone },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'password', label: 'Password', icon: Type },
    { value: 'textarea', label: 'Textarea', icon: AlignLeft },
    { value: 'select', label: 'Select', icon: List },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'radio', label: 'Radio', icon: Circle },
];

const COLOR_PRESETS = [
    '#2563eb', '#3b82f6', '#06b6d4', '#10b981', '#22c55e',
    '#84cc16', '#eab308', '#f59e0b', '#ef4444', '#dc2626',
    '#ec4899', '#a855f7', '#8b5cf6', '#1f2937', '#374151'
];

const GRADIENT_PRESETS = [
    { name: 'None', value: '#2563eb' },
    { name: 'Purple-Pink', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Blue-Cyan', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
    { name: 'Green-Lime', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { name: 'Orange-Yellow', value: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' },
    { name: 'Red-Pink', value: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)' },
];

const FormPropertiesPanel = ({ selectedElement, onUpdateElement, isCollapsed, onToggle }) => {
    const [activeTab, setActiveTab] = useState('fields');
    const [expandedFieldIndex, setExpandedFieldIndex] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);

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
                    <h3 className="panel-title">Thuộc tính Form</h3>
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

    const addField = (fieldType = 'text') => {
        const newField = {
            type: fieldType,
            label: getDefaultLabel(fieldType),
            placeholder: getDefaultPlaceholder(fieldType),
            required: false,
            ...(fieldType === 'textarea' && { rows: 4 }),
            ...(fieldType === 'select' && {
                options: [
                    { value: '', label: '-- Chọn --' },
                    { value: 'option1', label: 'Tùy chọn 1' },
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
    };

    const removeField = (index) => {
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
            fieldToDuplicate.name = `${fieldToDuplicate.name}-copy-${Date.now()}`;
        }
        const updatedFields = [...fields];
        updatedFields.splice(index + 1, 0, fieldToDuplicate);
        updateFormData({ fields: updatedFields });
        setExpandedFieldIndex(index + 1);
    };

    // ==================== HELPER FUNCTIONS ====================

    const getDefaultLabel = (type) => {
        const labels = {
            text: 'Text Field',
            email: 'Email',
            tel: 'Phone Number',
            number: 'Number',
            date: 'Date',
            password: 'Password',
            textarea: 'Message',
            select: 'Select Option',
            checkbox: 'I agree',
            radio: 'Choose one',
        };
        return labels[type] || 'Field';
    };

    const getDefaultPlaceholder = (type) => {
        const placeholders = {
            text: 'Enter text...',
            email: 'email@example.com',
            tel: '+84 123 456 789',
            number: '0',
            date: 'dd/mm/yyyy',
            password: '••••••••',
            textarea: 'Enter your message...',
            select: 'Choose an option',
            checkbox: '',
            radio: '',
        };
        return placeholders[type] || 'Enter...';
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

    // ==================== DRAG & DROP HANDLERS ====================

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        moveField(draggedIndex, dropIndex);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // ==================== RENDER OPTION EDITOR ====================

    const renderOptionEditor = (field, fieldIndex) => {
        const options = field.options || [];

        const addOption = () => {
            const newOption = {
                value: `option${options.length + 1}`,
                label: `Option ${options.length + 1}`
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
            const updatedOptions = options.filter((_, i) => i !== optIndex);
            updateField(fieldIndex, { options: updatedOptions });
        };

        return (
            <div className="field-options-editor" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                        Options
                    </label>
                    <button
                        onClick={addOption}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                {options.map((option, optIndex) => (
                    <div
                        key={optIndex}
                        style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                            padding: '8px',
                            background: '#f9fafb',
                            borderRadius: '6px'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(optIndex, { label: e.target.value })}
                                placeholder="Label"
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: '13px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    marginBottom: '4px'
                                }}
                            />
                            <input
                                type="text"
                                value={option.value}
                                onChange={(e) => updateOption(optIndex, { value: e.target.value })}
                                placeholder="Value"
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: '13px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => removeOption(optIndex)}
                            style={{
                                padding: '4px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                height: 'fit-content'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    // ==================== RENDER TABS ====================

    const renderFieldsTab = () => (
        <div className="panel-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                    Form Fields ({fields.length})
                </h4>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => {
                            const fieldType = prompt('Enter field type (text, email, tel, number, date, password, textarea, select, checkbox, radio):', 'text');
                            if (fieldType && FIELD_TYPES.some(ft => ft.value === fieldType)) {
                                addField(fieldType);
                            } else if (fieldType) {
                                alert('Invalid field type');
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500'
                        }}
                    >
                        <Plus size={16} /> Add Field
                    </button>
                </div>
            </div>

            {fields.length === 0 ? (
                <div style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#9ca3af',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px dashed #e5e7eb'
                }}>
                    <AlignLeft size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No fields yet</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Click "Add Field" to start</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fields.map((field, index) => {
                        const isExpanded = expandedFieldIndex === index;
                        const FieldIcon = FIELD_TYPES.find(ft => ft.value === field.type)?.icon || Type;

                        return (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: draggedIndex === index ? '#f3f4f6' : '#fff',
                                    opacity: draggedIndex === index ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* Field Header */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        background: isExpanded ? '#f9fafb' : 'transparent'
                                    }}
                                    onClick={() => setExpandedFieldIndex(isExpanded ? null : index)}
                                >
                                    <GripVertical size={16} style={{ color: '#9ca3af', cursor: 'grab' }} />
                                    <FieldIcon size={16} style={{ color: '#6b7280' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                                            {field.label || getDefaultLabel(field.type)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                            {field.type}
                                            {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateField(index);
                                            }}
                                            style={{
                                                padding: '4px',
                                                background: '#f3f4f6',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: '#6b7280'
                                            }}
                                            title="Duplicate"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this field?')) {
                                                    removeField(index);
                                                }
                                            }}
                                            style={{
                                                padding: '4px',
                                                background: '#fef2f2',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: '#ef4444'
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
                                        padding: '12px',
                                        borderTop: '1px solid #e5e7eb',
                                        background: '#fafbfc'
                                    }}>
                                        {/* Field Type */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                                                Field Type
                                            </label>
                                            <select
                                                value={field.type}
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    const updates = { type: newType };

                                                    // Add type-specific defaults
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
                                                    padding: '8px',
                                                    fontSize: '13px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px',
                                                    background: '#fff'
                                                }}
                                            >
                                                {FIELD_TYPES.map(ft => (
                                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Label */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                                                Label
                                            </label>
                                            <input
                                                type="text"
                                                value={field.label || ''}
                                                onChange={(e) => updateField(index, { label: e.target.value })}
                                                placeholder="Field label"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    fontSize: '13px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        </div>

                                        {/* Placeholder (for input fields) */}
                                        {!['checkbox', 'radio'].includes(field.type) && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                                                    Placeholder
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                    placeholder="Field placeholder"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Textarea Rows */}
                                        {field.type === 'textarea' && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                                                    Rows
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="20"
                                                    value={field.rows || 4}
                                                    onChange={(e) => updateField(index, { rows: parseInt(e.target.value) || 4 })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Options (for select/radio) */}
                                        {(field.type === 'select' || field.type === 'radio') && renderOptionEditor(field, index)}

                                        {/* Required Checkbox */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={field.required || false}
                                                    onChange={(e) => updateField(index, { required: e.target.checked })}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <span style={{ fontSize: '13px', color: '#374151' }}>Required field</span>
                                            </label>
                                        </div>

                                        {/* Name (for checkbox/radio) */}
                                        {(field.type === 'checkbox' || field.type === 'radio') && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                                                    Name Attribute
                                                </label>
                                                <input
                                                    type="text"
                                                    value={field.name || ''}
                                                    onChange={(e) => updateField(index, { name: e.target.value })}
                                                    placeholder="field-name"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        fontSize: '13px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Move buttons */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <button
                                                onClick={() => moveField(index, index - 1)}
                                                disabled={index === 0}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    fontSize: '12px',
                                                    background: index === 0 ? '#f3f4f6' : '#fff',
                                                    color: index === 0 ? '#9ca3af' : '#374151',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    cursor: index === 0 ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                ↑ Move Up
                                            </button>
                                            <button
                                                onClick={() => moveField(index, index + 1)}
                                                disabled={index === fields.length - 1}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    fontSize: '12px',
                                                    background: index === fields.length - 1 ? '#f3f4f6' : '#fff',
                                                    color: index === fields.length - 1 ? '#9ca3af' : '#374151',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer'
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
                    placeholder="Enter form title"
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
                <label>Button Background</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {COLOR_PRESETS.map(color => (
                        <div
                            key={color}
                            onClick={() => updateFormData({ buttonBackground: color })}
                            style={{
                                width: '32px',
                                height: '32px',
                                background: color,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: formData.buttonBackground === color ? '2px solid #000' : '2px solid transparent'
                            }}
                        />
                    ))}
                </div>
                <input
                    type="text"
                    value={formData.buttonBackground || '#2563eb'}
                    onChange={(e) => updateFormData({ buttonBackground: e.target.value })}
                    placeholder="#2563eb"
                    style={{ marginTop: '8px' }}
                />
            </div>

            {/* Button Gradient */}
            <div className="property-group">
                <label>Button Gradient</label>
                <select
                    value={formData.buttonBackground || '#2563eb'}
                    onChange={(e) => updateFormData({ buttonBackground: e.target.value })}
                >
                    {GRADIENT_PRESETS.map(preset => (
                        <option key={preset.name} value={preset.value}>{preset.name}</option>
                    ))}
                </select>
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
                <label>Form Action URL</label>
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
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                    API endpoint to send form data
                </small>
            </div>

            {/* Form Method */}
            <div className="property-group">
                <label>Form Method</label>
                <select
                    value={formData.method || 'POST'}
                    onChange={(e) => updateFormData({ method: e.target.value })}
                >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                </select>
            </div>

            {/* Success Message */}
            <div className="property-group">
                <label>Success Message</label>
                <input
                    type="text"
                    value={formData.successMessage || ''}
                    onChange={(e) => updateFormData({ successMessage: e.target.value })}
                    placeholder="Thank you for your submission!"
                />
            </div>

            {/* Error Message */}
            <div className="property-group">
                <label>Error Message</label>
                <input
                    type="text"
                    value={formData.errorMessage || ''}
                    onChange={(e) => updateFormData({ errorMessage: e.target.value })}
                    placeholder="Something went wrong. Please try again."
                />
            </div>

            {/* Show Required Indicator */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.showRequiredIndicator !== false}
                        onChange={(e) => updateFormData({ showRequiredIndicator: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                    />
                    <span>Show Required (*) Indicators</span>
                </label>
            </div>

            {/* Enable Validation */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.enableValidation !== false}
                        onChange={(e) => updateFormData({ enableValidation: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                    />
                    <span>Enable HTML5 Validation</span>
                </label>
            </div>

            {/* Reset After Submit */}
            <div className="property-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={formData.resetAfterSubmit || false}
                        onChange={(e) => updateFormData({ resetAfterSubmit: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                    />
                    <span>Reset Form After Submit</span>
                </label>
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================

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
                    <AlignLeft size={14} />
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
