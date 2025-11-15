/**
 * Form Submission Handler
 * Generates form submission code for exported HTML pages
 */

/**
 * Generate form submission script for a specific form element
 * This will be injected into exported HTML
 */
export const generateFormSubmissionScript = (formElement, pageId) => {
    const formId = formElement.id || `FORM-${Date.now()}`;
    const apiUrl = process.env.REACT_APP_API_URL || 'https://llk8aosgaf.execute-api.us-east-1.amazonaws.com/prod';

    const fields = formElement.componentData?.fields || [];
    const successMessage = formElement.componentData?.successMessage || 'Cảm ơn bạn đã gửi thông tin!';
    const errorMessage = formElement.componentData?.errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại.';
    const redirectUrl = formElement.componentData?.redirectUrl || '';

    return `
    <script>
    (function() {
        const form = document.getElementById('${formId}');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const formData = {};
            const formElements = form.querySelectorAll('input, textarea, select');

            formElements.forEach(element => {
                if (element.name) {
                    formData[element.name] = element.value;
                }
            });

            // Get device type
            const getDeviceType = () => {
                const ua = navigator.userAgent;
                if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                    return "tablet";
                }
                if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                    return "mobile";
                }
                return "desktop";
            };

            // Get UTM parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            const utmParams = {
                utm_source: urlParams.get('utm_source'),
                utm_medium: urlParams.get('utm_medium'),
                utm_campaign: urlParams.get('utm_campaign'),
                utm_term: urlParams.get('utm_term'),
                utm_content: urlParams.get('utm_content')
            };

            // Prepare submission data
            const submissionData = {
                page_id: '${pageId}',
                form_id: '${formId}',
                form_data: formData,
                device_type: getDeviceType(),
                screen_resolution: window.screen.width + 'x' + window.screen.height,
                ...utmParams
            };

            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang gửi...';
            }

            try {
                // Submit to API
                const response = await fetch('${apiUrl}/api/forms/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submissionData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    alert('${successMessage}');
                    form.reset();

                    // Redirect if specified
                    ${redirectUrl ? `window.location.href = '${redirectUrl}';` : ''}

                    // Track conversion if analytics is available
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'form_submit', {
                            'event_category': 'engagement',
                            'event_label': '${formId}'
                        });
                    }

                    if (typeof fbq !== 'undefined') {
                        fbq('track', 'Lead');
                    }
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('${errorMessage}');
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    })();
    </script>
    `;
};

/**
 * Generate all form submission scripts for a page
 * Returns array of script strings to be injected before </body>
 */
export const generateAllFormScripts = (pageData) => {
    const scripts = [];
    const pageId = pageData.id || pageData._id;

    // Find all form elements recursively
    const findForms = (elements) => {
        const forms = [];

        elements.forEach(element => {
            if (element.type === 'form') {
                forms.push(element);
            }

            if (element.children && element.children.length > 0) {
                forms.push(...findForms(element.children));
            }
        });

        return forms;
    };

    const forms = findForms(pageData.elements || []);

    forms.forEach(form => {
        scripts.push(generateFormSubmissionScript(form, pageId));
    });

    return scripts;
};

/**
 * Validate form configuration
 * Returns array of validation errors
 */
export const validateFormConfig = (formElement) => {
    const errors = [];

    if (!formElement.componentData?.fields || formElement.componentData.fields.length === 0) {
        errors.push('Form must have at least one field');
    }

    const fields = formElement.componentData?.fields || [];

    fields.forEach((field, index) => {
        if (!field.name) {
            errors.push(`Field ${index + 1} must have a name`);
        }

        if (!field.type) {
            errors.push(`Field ${index + 1} must have a type`);
        }

        if (field.required && !field.name) {
            errors.push(`Required field ${index + 1} must have a name`);
        }
    });

    return errors;
};

/**
 * Get default form configuration
 */
export const getDefaultFormConfig = () => {
    return {
        title: 'Liên hệ với chúng tôi',
        fields: [
            {
                name: 'name',
                type: 'text',
                placeholder: 'Họ và tên',
                label: 'Họ và tên',
                required: true,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
            },
            {
                name: 'email',
                type: 'email',
                placeholder: 'Email',
                label: 'Email',
                required: true,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
            },
            {
                name: 'phone',
                type: 'tel',
                placeholder: 'Số điện thoại',
                label: 'Số điện thoại',
                required: false,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
            },
            {
                name: 'message',
                type: 'textarea',
                placeholder: 'Nội dung tin nhắn',
                label: 'Tin nhắn',
                required: false,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                rows: 4
            }
        ],
        buttonText: 'Gửi ngay',
        buttonBackground: '#667eea',
        buttonColor: '#ffffff',
        buttonPadding: '12px 32px',
        buttonBorderRadius: '8px',
        buttonBorder: 'none',
        buttonFontSize: '16px',
        buttonFontWeight: '600',
        direction: 'column',
        gap: '16px',
        successMessage: 'Cảm ơn bạn đã gửi thông tin! Chúng tôi sẽ liên hệ lại sớm nhất.',
        errorMessage: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
        redirectUrl: '',
        showLabels: true,
        labelPosition: 'top' // 'top', 'left', 'inside'
    };
};

/**
 * Generate form HTML with proper attributes for submission
 */
export const generateFormHTML = (formElement, pageId) => {
    const formId = formElement.id || `FORM-${Date.now()}`;
    const config = { ...getDefaultFormConfig(), ...formElement.componentData };

    let html = `<form id="${formId}" class="lpb-form" style="${generateFormStyles(config)}">`;

    // Title
    if (config.title) {
        html += `<h3 style="margin: 0 0 ${config.gap || '16px'} 0; font-size: ${config.titleFontSize || '24px'}; font-weight: ${config.titleFontWeight || '600'}; color: ${config.titleColor || '#1f2937'};">${config.title}</h3>`;
    }

    // Fields
    config.fields.forEach(field => {
        const fieldId = `${formId}-${field.name}`;

        html += `<div class="form-field" style="margin-bottom: ${config.gap || '16px'};">`;

        // Label
        if (config.showLabels && config.labelPosition === 'top') {
            html += `<label for="${fieldId}" style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #374151;">${field.label || field.name}${field.required ? ' *' : ''}</label>`;
        }

        // Input
        if (field.type === 'textarea') {
            html += `<textarea
                id="${fieldId}"
                name="${field.name}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                rows="${field.rows || 4}"
                style="width: 100%; padding: ${field.padding || '12px'}; border: ${field.border || '1px solid #e5e7eb'}; border-radius: ${field.borderRadius || '8px'}; font-size: ${field.fontSize || '14px'}; font-family: inherit; resize: vertical;"
            ></textarea>`;
        } else {
            html += `<input
                type="${field.type || 'text'}"
                id="${fieldId}"
                name="${field.name}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                style="width: 100%; padding: ${field.padding || '12px'}; border: ${field.border || '1px solid #e5e7eb'}; border-radius: ${field.borderRadius || '8px'}; font-size: ${field.fontSize || '14px'};"
            />`;
        }

        html += `</div>`;
    });

    // Submit button
    html += `<button type="submit" style="background: ${config.buttonBackground || '#667eea'}; color: ${config.buttonColor || '#ffffff'}; padding: ${config.buttonPadding || '12px 32px'}; border: ${config.buttonBorder || 'none'}; border-radius: ${config.buttonBorderRadius || '8px'}; font-size: ${config.buttonFontSize || '16px'}; font-weight: ${config.buttonFontWeight || '600'}; cursor: pointer; transition: all 0.2s;">${config.buttonText || 'Gửi'}</button>`;

    html += `</form>`;

    return html;
};

/**
 * Generate form container styles
 */
const generateFormStyles = (config) => {
    return `
        display: flex;
        flex-direction: ${config.direction || 'column'};
        gap: ${config.gap || '16px'};
        width: 100%;
    `.trim().replace(/\s+/g, ' ');
};
