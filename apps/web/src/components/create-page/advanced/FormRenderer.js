import React from 'react';

/**
 * FormRenderer Component
 * Handles form rendering and submission with proper React hooks usage
 * Moved from helpers.js to fix hooks violation
 */
const FormRenderer = ({
    componentData = {},
    styles = {},
    children = [],
    isCanvas = false,
    parentId,
    renderComponentContent,
    onSelectChild,
    isTemplateMode,
    viewMode
}) => {
    // Form submission state management - SAFE TO USE HOOKS HERE
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitStatus, setSubmitStatus] = React.useState(null); // 'success' | 'error' | null
    const [submitMessage, setSubmitMessage] = React.useState('');
    const formRef = React.useRef(null);

    const baseStyles = styles;

    // Helper to get clean text styles (remove conflicting properties)
    const getCleanTextStyles = (styles) => {
        const { display, flexDirection, justifyContent, alignItems, gap, ...textStyles } = styles || {};
        return textStyles;
    };

    const renderFormField = (field, index) => {
        const fieldType = field.type || 'text';
        const fieldName = field.name || `field-${index}`;
        const fieldStyles = {
            width: '100%',
            padding: field.padding || '12px 16px',
            borderRadius: field.borderRadius || '8px',
            border: field.border || '1px solid #d1d5db',
            fontSize: field.fontSize || '16px',
            outline: 'none',
            transition: 'all 0.3s ease',
        };

        // Render textarea
        if (fieldType === 'textarea') {
            return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {field.label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    <textarea
                        name={fieldName}
                        placeholder={field.placeholder || field.label || 'Nhập...'}
                        rows={field.rows || 4}
                        required={field.required}
                        disabled={isCanvas || isSubmitting}
                        style={{
                            ...fieldStyles,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
            );
        }

        // Render checkbox
        if (fieldType === 'checkbox') {
            return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        name={fieldName}
                        required={field.required}
                        disabled={isCanvas || isSubmitting}
                        style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                        }}
                    />
                    <label style={{ fontSize: '16px', color: '#374151', cursor: 'pointer' }}>
                        {field.label}
                        {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </label>
                </div>
            );
        }

        // Render select
        if (fieldType === 'select') {
            return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {field.label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    <select
                        name={fieldName}
                        required={field.required}
                        disabled={isCanvas || isSubmitting}
                        style={{
                            ...fieldStyles,
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {(field.options || []).map((option, optIndex) => (
                            <option key={optIndex} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // Render radio group
        if (fieldType === 'radio') {
            return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {field.label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {field.label}
                            {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    {(field.options || []).map((option, optIndex) => (
                        <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={fieldName}
                                value={option.value}
                                required={field.required && optIndex === 0}
                                disabled={isCanvas || isSubmitting}
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                }}
                            />
                            <label style={{ fontSize: '16px', color: '#374151', cursor: 'pointer' }}>
                                {option.label}
                            </label>
                        </div>
                    ))}
                </div>
            );
        }

        // Render standard input (text, email, password, tel, number, date, etc.)
        return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {field.label && (
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {field.label}
                        {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </label>
                )}
                <input
                    type={fieldType}
                    name={fieldName}
                    placeholder={field.placeholder || field.label || 'Nhập...'}
                    required={field.required}
                    disabled={isCanvas || isSubmitting}
                    style={fieldStyles}
                />
            </div>
        );
    };

    // Handle form submission
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // Don't submit in canvas mode
        if (isCanvas) {
            return false;
        }

        // Collect form data
        const formElement = formRef.current;
        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            // Handle checkbox special case (collect all checked values)
            if (formElement.querySelector(`[name="${key}"][type="checkbox"]`)) {
                if (!data[key]) {
                    data[key] = formData.getAll(key);
                }
            } else {
                data[key] = value;
            }
        }

        // Get page ID from URL or data attribute
        const pathParts = window.location.pathname.split('/');
        const pageId = pathParts[pathParts.length - 1] || componentData.pageId || parentId;

        // Collect metadata for lead tracking
        const getDeviceType = () => {
            const width = window.innerWidth;
            if (width < 768) return 'mobile';
            if (width < 1024) return 'tablet';
            return 'desktop';
        };

        const getUtmParams = () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content'),
            };
        };

        // Prepare submission payload
        const submissionData = {
            page_id: pageId,
            form_id: parentId || `form-${Date.now()}`, // Form element ID
            form_data: data,
            device_type: getDeviceType(),
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            ...getUtmParams(),
        };

        // Set loading state
        if (componentData.showLoadingState !== false) {
            setIsSubmitting(true);
        }
        setSubmitStatus(null);
        setSubmitMessage('');

        try {
            // Submit to system API (auto-save to MongoDB)
            const systemApiUrl = `${process.env.REACT_APP_API_URL || ''}/api/forms/submit`;
            const response = await fetch(systemApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                // Success - data saved to MongoDB
                setSubmitStatus('success');
                setSubmitMessage(componentData.successMessage || 'Cảm ơn bạn đã gửi thông tin!');

                // Reset form if configured
                if (componentData.resetAfterSubmit !== false) {
                    formElement.reset();
                }

                // Send to custom webhook if configured (optional)
                const webhookUrl = componentData.webhookUrl || componentData.events?.onSubmit?.apiUrl;
                if (webhookUrl) {
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(submissionData),
                        });
                    } catch (webhookError) {
                        console.warn('Webhook notification failed:', webhookError);
                        // Don't show error to user since main submission succeeded
                    }
                }

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setSubmitStatus(null);
                    setSubmitMessage('');
                }, 5000);
            } else {
                // Error response from server
                const errorData = await response.json().catch(() => ({}));
                setSubmitStatus('error');
                setSubmitMessage(errorData.message || componentData.errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (error) {
            // Network or other error
            console.error('Form submission error:', error);
            setSubmitStatus('error');
            setSubmitMessage(componentData.errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            ref={formRef}
            id={parentId}
            onSubmit={handleFormSubmit}
            style={{
                display: 'flex',
                flexDirection: componentData.direction || 'column',
                gap: componentData.gap || '16px',
                ...baseStyles,
            }}
        >
            {componentData.title && (
                <h3
                    style={{
                        ...getCleanTextStyles(baseStyles),
                        margin: componentData.titleMargin || '0 0 8px 0',
                        fontSize: componentData.titleFontSize || '1.5rem',
                        color: componentData.titleColor || '#1f2937',
                        fontWeight: componentData.titleFontWeight || '600',
                    }}
                >
                    {componentData.title}
                </h3>
            )}

            {/* Render form fields */}
            {Array.isArray(componentData.fields) && componentData.fields.length > 0 ? (
                componentData.fields.map((field, index) => renderFormField(field, index))
            ) : (
                <>
                    {/* Empty form placeholder in canvas mode - Enhanced with step-by-step guide */}
                    {isCanvas && children.length === 0 && (
                        <div
                            style={{
                                padding: '32px 24px',
                                textAlign: 'center',
                                backgroundColor: '#eff6ff',
                                border: '2px dashed #3b82f6',
                                borderRadius: '12px',
                                color: '#1e40af',
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                            <div style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '600', color: '#1e3a8a' }}>
                                Form Chưa Có Trường Nhập Liệu
                            </div>
                            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '16px', lineHeight: '1.6' }}>
                                Để thu thập thông tin khách hàng (leads), hãy thêm các trường vào form:
                            </div>
                            <div style={{
                                textAlign: 'left',
                                display: 'inline-block',
                                backgroundColor: '#fff',
                                padding: '16px',
                                borderRadius: '8px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        backgroundColor: '#3b82f6',
                                        color: '#fff',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>1</span>
                                    <span>Click vào form này (đã chọn sẵn)</span>
                                </div>
                                <div style={{ fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        backgroundColor: '#3b82f6',
                                        color: '#fff',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>2</span>
                                    <span>Mở <strong>Properties Panel</strong> (bên phải) →</span>
                                </div>
                                <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        backgroundColor: '#3b82f6',
                                        color: '#fff',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>3</span>
                                    <span>Click <strong>"+ Add Field"</strong> để thêm trường</span>
                                </div>
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                marginTop: '16px',
                                padding: '12px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '6px',
                                border: '1px solid #fcd34d'
                            }}>
                                💡 <strong>Tip:</strong> Bắt đầu với Name, Email, Phone để thu thập leads cơ bản
                            </div>
                        </div>
                    )}
                    {/* Default input for non-empty children or non-canvas mode */}
                    {(!isCanvas || children.length > 0) && !children.some((child) => child?.type === 'input') && (
                        <input
                            type={componentData.inputType || 'text'}
                            name="defaultInput"
                            placeholder={componentData.placeholder || 'Nhập...'}
                            disabled={isCanvas || isSubmitting}
                            style={{
                                width: '100%',
                                padding: componentData.inputPadding || '12px 16px',
                                borderRadius: componentData.inputBorderRadius || '8px',
                                border: componentData.inputBorder || '1px solid #d1d5db',
                                fontSize: componentData.inputFontSize || '16px',
                                outline: 'none',
                            }}
                        />
                    )}
                </>
            )}

            {/* Submit message display */}
            {submitMessage && (
                <div
                    style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: submitStatus === 'success' ? '#d1fae5' : '#fee2e2',
                        border: `1px solid ${submitStatus === 'success' ? '#10b981' : '#ef4444'}`,
                        color: submitStatus === 'success' ? '#065f46' : '#991b1b',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                >
                    {submitMessage}
                </div>
            )}

            {/* Submit button */}
            {!children.some((child) => child?.type === 'button') && (
                <button
                    type="submit"
                    disabled={isCanvas || isSubmitting}
                    style={{
                        background: componentData.buttonBackground || '#2563eb',
                        color: componentData.buttonColor || '#fff',
                        padding: componentData.buttonPadding || '12px 24px',
                        borderRadius: componentData.buttonBorderRadius || '8px',
                        border: componentData.buttonBorder || 'none',
                        cursor: (isCanvas || isSubmitting) ? 'default' : 'pointer',
                        fontSize: componentData.buttonFontSize || '16px',
                        fontWeight: componentData.buttonFontWeight || '600',
                        transition: 'all 0.3s ease',
                        opacity: isSubmitting ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}
                >
                    {isSubmitting && componentData.showLoadingState !== false && (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }}
                        />
                    )}
                    {isSubmitting ? (componentData.buttonLoadingText || 'Đang gửi...') : (componentData.buttonText || 'Gửi')}
                </button>
            )}

            {/* Child components */}
            {children && renderComponentContent && children.map((child, index) =>
                React.cloneElement(
                    renderComponentContent(
                        child.type,
                        child.componentData || {},
                        child.styles || {},
                        child.children || [],
                        isCanvas,
                        onSelectChild,
                        parentId,
                        child.id,
                        isTemplateMode,
                        viewMode
                    ),
                    { key: child.id || index }
                )
            )}
        </form>
    );
};

export default FormRenderer;
