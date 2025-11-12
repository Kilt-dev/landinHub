import React, { useState } from 'react';
import './FormPropertiesPanel.css';
import { getDefaultFormConfig } from '../../../utils/formSubmissionHandler';

/**
 * Form Properties Panel
 * Advanced form builder similar to LadiPage
 * Allows drag-drop field management, field customization, and submission settings
 */
const FormPropertiesPanel = ({ element, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'design', 'settings'
    const [expandedField, setExpandedField] = useState(null);

    const config = { ...getDefaultFormConfig(), ...(element.componentData || {}) };

    // Update config
    const updateConfig = (updates) => {
        onUpdate({
            ...element,
            componentData: {
                ...config,
                ...updates
            }
        });
    };

    // Add new field
    const handleAddField = (fieldType = 'text') => {
        const fieldTypes = {
            text: { name: 'text_field', type: 'text', placeholder: 'Nhập text', label: 'Text Field' },
            email: { name: 'email', type: 'email', placeholder: 'Email', label: 'Email' },
            tel: { name: 'phone', type: 'tel', placeholder: 'Số điện thoại', label: 'Số điện thoại' },
            number: { name: 'number', type: 'number', placeholder: 'Nhập số', label: 'Number' },
            textarea: { name: 'message', type: 'textarea', placeholder: 'Nội dung', label: 'Textarea', rows: 4 },
            select: { name: 'select', type: 'select', label: 'Select', options: ['Option 1', 'Option 2', 'Option 3'] },
            checkbox: { name: 'checkbox', type: 'checkbox', label: 'Checkbox' },
            radio: { name: 'radio', type: 'radio', label: 'Radio', options: ['Option 1', 'Option 2'] },
            date: { name: 'date', type: 'date', placeholder: 'Chọn ngày', label: 'Date' },
            time: { name: 'time', type: 'time', placeholder: 'Chọn giờ', label: 'Time' },
            file: { name: 'file', type: 'file', label: 'Upload File' }
        };

        const newField = {
            ...fieldTypes[fieldType],
            required: false,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px'
        };

        updateConfig({
            fields: [...(config.fields || []), newField]
        });

        // Auto-expand new field
        setExpandedField(config.fields?.length || 0);
    };

    // Update field
    const handleUpdateField = (index, updates) => {
        const newFields = [...(config.fields || [])];
        newFields[index] = { ...newFields[index], ...updates };
        updateConfig({ fields: newFields });
    };

    // Delete field
    const handleDeleteField = (index) => {
        if (window.confirm('Bạn có chắc muốn xóa field này?')) {
            const newFields = config.fields.filter((_, i) => i !== index);
            updateConfig({ fields: newFields });
            setExpandedField(null);
        }
    };

    // Reorder fields
    const handleMoveField = (index, direction) => {
        const newFields = [...(config.fields || [])];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newFields.length) return;

        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];

        updateConfig({ fields: newFields });
        setExpandedField(targetIndex);
    };

    // Duplicate field
    const handleDuplicateField = (index) => {
        const fieldToDuplicate = config.fields[index];
        const newField = {
            ...fieldToDuplicate,
            name: `${fieldToDuplicate.name}_copy`
        };

        const newFields = [...config.fields];
        newFields.splice(index + 1, 0, newField);

        updateConfig({ fields: newFields });
        setExpandedField(index + 1);
    };

    return (
        <div className="form-properties-panel">
            {/* Header */}
            <div className="form-panel-header">
                <h3>⚙️ Cài đặt Form</h3>
                <p>Tùy chỉnh form và quản lý fields</p>
            </div>

            {/* Tabs */}
            <div className="form-panel-tabs">
                <button
                    className={activeTab === 'fields' ? 'active' : ''}
                    onClick={() => setActiveTab('fields')}
                >
                    📝 Fields
                </button>
                <button
                    className={activeTab === 'design' ? 'active' : ''}
                    onClick={() => setActiveTab('design')}
                >
                    🎨 Thiết kế
                </button>
                <button
                    className={activeTab === 'settings' ? 'active' : ''}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Cài đặt
                </button>
            </div>

            {/* Fields Tab */}
            {activeTab === 'fields' && (
                <div className="form-fields-tab">
                    {/* Add Field Buttons */}
                    <div className="add-field-section">
                        <p className="section-label">Thêm trường mới</p>
                        <div className="add-field-buttons">
                            <button onClick={() => handleAddField('text')} title="Text Field">
                                <span>📝</span> Text
                            </button>
                            <button onClick={() => handleAddField('email')} title="Email Field">
                                <span>📧</span> Email
                            </button>
                            <button onClick={() => handleAddField('tel')} title="Phone Field">
                                <span>📱</span> Phone
                            </button>
                            <button onClick={() => handleAddField('textarea')} title="Textarea">
                                <span>📄</span> Textarea
                            </button>
                            <button onClick={() => handleAddField('select')} title="Select">
                                <span>📋</span> Select
                            </button>
                            <button onClick={() => handleAddField('checkbox')} title="Checkbox">
                                <span>☑️</span> Checkbox
                            </button>
                            <button onClick={() => handleAddField('date')} title="Date">
                                <span>📅</span> Date
                            </button>
                            <button onClick={() => handleAddField('number')} title="Number">
                                <span>🔢</span> Number
                            </button>
                        </div>
                    </div>

                    {/* Field List */}
                    <div className="field-list">
                        <p className="section-label">
                            Danh sách fields ({config.fields?.length || 0})
                        </p>

                        {(!config.fields || config.fields.length === 0) ? (
                            <div className="empty-fields">
                                <p>Chưa có field nào. Thêm field để bắt đầu.</p>
                            </div>
                        ) : (
                            config.fields.map((field, index) => (
                                <div key={index} className="field-item">
                                    {/* Field Header */}
                                    <div className="field-item-header">
                                        <div className="field-item-info">
                                            <span className="field-type-icon">
                                                {field.type === 'text' && '📝'}
                                                {field.type === 'email' && '📧'}
                                                {field.type === 'tel' && '📱'}
                                                {field.type === 'textarea' && '📄'}
                                                {field.type === 'select' && '📋'}
                                                {field.type === 'checkbox' && '☑️'}
                                                {field.type === 'radio' && '🔘'}
                                                {field.type === 'date' && '📅'}
                                                {field.type === 'time' && '⏰'}
                                                {field.type === 'number' && '🔢'}
                                                {field.type === 'file' && '📎'}
                                            </span>
                                            <div className="field-item-text">
                                                <strong>{field.label || field.name}</strong>
                                                <span className="field-name-small">
                                                    {field.type}
                                                    {field.required && <span className="required-badge">*</span>}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="field-item-actions">
                                            <button
                                                onClick={() => handleMoveField(index, 'up')}
                                                disabled={index === 0}
                                                title="Move Up"
                                            >
                                                ⬆️
                                            </button>
                                            <button
                                                onClick={() => handleMoveField(index, 'down')}
                                                disabled={index === config.fields.length - 1}
                                                title="Move Down"
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={() => setExpandedField(expandedField === index ? null : index)}
                                                title="Edit"
                                            >
                                                {expandedField === index ? '🔼' : '🔽'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Field Details (Expanded) */}
                                    {expandedField === index && (
                                        <div className="field-item-details">
                                            <div className="form-group">
                                                <label>Tên field (name) *</label>
                                                <input
                                                    type="text"
                                                    value={field.name || ''}
                                                    onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                                                    placeholder="e.g., full_name"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Label hiển thị</label>
                                                <input
                                                    type="text"
                                                    value={field.label || ''}
                                                    onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                                    placeholder="e.g., Họ và tên"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Placeholder</label>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={(e) => handleUpdateField(index, { placeholder: e.target.value })}
                                                    placeholder="e.g., Nhập họ và tên của bạn"
                                                />
                                            </div>

                                            <div className="form-group-checkbox">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required || false}
                                                        onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                                    />
                                                    Bắt buộc nhập
                                                </label>
                                            </div>

                                            {(field.type === 'select' || field.type === 'radio') && (
                                                <div className="form-group">
                                                    <label>Options (mỗi dòng 1 option)</label>
                                                    <textarea
                                                        value={(field.options || []).join('\n')}
                                                        onChange={(e) => handleUpdateField(index, {
                                                            options: e.target.value.split('\n').filter(o => o.trim())
                                                        })}
                                                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                                                        rows="4"
                                                    />
                                                </div>
                                            )}

                                            {field.type === 'textarea' && (
                                                <div className="form-group">
                                                    <label>Số dòng (rows)</label>
                                                    <input
                                                        type="number"
                                                        value={field.rows || 4}
                                                        onChange={(e) => handleUpdateField(index, { rows: parseInt(e.target.value) || 4 })}
                                                        min="2"
                                                        max="20"
                                                    />
                                                </div>
                                            )}

                                            {/* Styling Options */}
                                            <div className="field-styling-section">
                                                <p className="subsection-label">Styling</p>

                                                <div className="form-group-row">
                                                    <div className="form-group">
                                                        <label>Padding</label>
                                                        <input
                                                            type="text"
                                                            value={field.padding || '12px'}
                                                            onChange={(e) => handleUpdateField(index, { padding: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Border Radius</label>
                                                        <input
                                                            type="text"
                                                            value={field.borderRadius || '8px'}
                                                            onChange={(e) => handleUpdateField(index, { borderRadius: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Border</label>
                                                    <input
                                                        type="text"
                                                        value={field.border || '1px solid #e5e7eb'}
                                                        onChange={(e) => handleUpdateField(index, { border: e.target.value })}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Font Size</label>
                                                    <input
                                                        type="text"
                                                        value={field.fontSize || '14px'}
                                                        onChange={(e) => handleUpdateField(index, { fontSize: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="field-actions">
                                                <button className="btn-duplicate" onClick={() => handleDuplicateField(index)}>
                                                    📋 Duplicate
                                                </button>
                                                <button className="btn-delete" onClick={() => handleDeleteField(index)}>
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && (
                <div className="form-design-tab">
                    {/* Form Title */}
                    <div className="form-group">
                        <label>Tiêu đề Form</label>
                        <input
                            type="text"
                            value={config.title || ''}
                            onChange={(e) => updateConfig({ title: e.target.value })}
                            placeholder="e.g., Liên hệ với chúng tôi"
                        />
                    </div>

                    {/* Button Settings */}
                    <p className="section-label">Nút Submit</p>

                    <div className="form-group">
                        <label>Text nút</label>
                        <input
                            type="text"
                            value={config.buttonText || 'Gửi'}
                            onChange={(e) => updateConfig({ buttonText: e.target.value })}
                        />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Background</label>
                            <input
                                type="color"
                                value={config.buttonBackground || '#667eea'}
                                onChange={(e) => updateConfig({ buttonBackground: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Text Color</label>
                            <input
                                type="color"
                                value={config.buttonColor || '#ffffff'}
                                onChange={(e) => updateConfig({ buttonColor: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Padding</label>
                            <input
                                type="text"
                                value={config.buttonPadding || '12px 32px'}
                                onChange={(e) => updateConfig({ buttonPadding: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Border Radius</label>
                            <input
                                type="text"
                                value={config.buttonBorderRadius || '8px'}
                                onChange={(e) => updateConfig({ buttonBorderRadius: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Layout */}
                    <p className="section-label">Layout</p>

                    <div className="form-group">
                        <label>Direction</label>
                        <select
                            value={config.direction || 'column'}
                            onChange={(e) => updateConfig({ direction: e.target.value })}
                        >
                            <option value="column">Vertical (Column)</option>
                            <option value="row">Horizontal (Row)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Gap giữa các fields</label>
                        <input
                            type="text"
                            value={config.gap || '16px'}
                            onChange={(e) => updateConfig({ gap: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="form-settings-tab">
                    <p className="section-label">Thông báo & Chuyển hướng</p>

                    <div className="form-group">
                        <label>Thông báo thành công</label>
                        <textarea
                            value={config.successMessage || 'Cảm ơn bạn đã gửi thông tin!'}
                            onChange={(e) => updateConfig({ successMessage: e.target.value })}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Thông báo lỗi</label>
                        <textarea
                            value={config.errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại.'}
                            onChange={(e) => updateConfig({ errorMessage: e.target.value })}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>URL chuyển hướng sau khi gửi (optional)</label>
                        <input
                            type="url"
                            value={config.redirectUrl || ''}
                            onChange={(e) => updateConfig({ redirectUrl: e.target.value })}
                            placeholder="https://example.com/thank-you"
                        />
                    </div>

                    <p className="section-label">Tích hợp</p>

                    <div className="form-group-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.sendEmailNotification || false}
                                onChange={(e) => updateConfig({ sendEmailNotification: e.target.checked })}
                            />
                            Gửi email thông báo khi có submission mới
                        </label>
                    </div>

                    {config.sendEmailNotification && (
                        <div className="form-group">
                            <label>Email nhận thông báo</label>
                            <input
                                type="email"
                                value={config.notificationEmail || ''}
                                onChange={(e) => updateConfig({ notificationEmail: e.target.value })}
                                placeholder="your@email.com"
                            />
                        </div>
                    )}

                    <div className="form-group-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={config.exportToGoogleSheets || false}
                                onChange={(e) => updateConfig({ exportToGoogleSheets: e.target.checked })}
                            />
                            Tự động export sang Google Sheets
                        </label>
                    </div>

                    {config.exportToGoogleSheets && (
                        <div className="form-group">
                            <label>Google Sheet ID</label>
                            <input
                                type="text"
                                value={config.googleSheetId || ''}
                                onChange={(e) => updateConfig({ googleSheetId: e.target.value })}
                                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            />
                        </div>
                    )}

                    <div className="info-box">
                        <p>💡 <strong>Tips:</strong></p>
                        <ul>
                            <li>Dữ liệu form sẽ được lưu tự động vào dashboard</li>
                            <li>Truy cập trang <strong>Form Submissions</strong> để xem và quản lý dữ liệu</li>
                            <li>Có thể export dữ liệu ra CSV hoặc Google Sheets</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormPropertiesPanel;
