/**
 * Google Forms Integration Utilities
 * Hỗ trợ kết nối form builder với Google Forms
 */

/**
 * Parse Google Forms URL to extract Form ID
 * @param {string} url - Google Forms URL
 * @returns {string|null} - Form ID or null
 */
export const extractGoogleFormId = (url) => {
    if (!url) return null;

    // Pattern 1: https://docs.google.com/forms/d/{FORM_ID}/edit
    // Pattern 2: https://docs.google.com/forms/d/e/{FORM_ID}/viewform
    const patterns = [
        /forms\/d\/e\/([a-zA-Z0-9_-]+)\/viewform/,
        /forms\/d\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

/**
 * Validate Google Forms URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidGoogleFormUrl = (url) => {
    if (!url) return false;
    return /docs\.google\.com\/forms\/d/.test(url);
};

/**
 * Generate Google Forms embed URL
 * @param {string} formId - Google Form ID
 * @returns {string} - Embed URL
 */
export const getGoogleFormEmbedUrl = (formId) => {
    return `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`;
};

/**
 * Generate Google Forms prefill URL
 * @param {string} formId - Google Form ID
 * @param {Object} fieldMappings - Mapping của các field: { fieldName: entryId }
 * @param {Object} values - Values to prefill: { fieldName: value }
 * @returns {string} - Prefilled URL
 */
export const getGoogleFormPrefillUrl = (formId, fieldMappings, values) => {
    const baseUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    const params = new URLSearchParams();

    Object.keys(values).forEach(fieldName => {
        const entryId = fieldMappings[fieldName];
        if (entryId && values[fieldName]) {
            params.append(`entry.${entryId}`, values[fieldName]);
        }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Convert form fields to Google Forms compatible format
 * @param {Array} fields - Array of form fields from builder
 * @returns {Array} - Google Forms compatible fields
 */
export const convertToGoogleFormFields = (fields) => {
    return fields.map(field => {
        const mapping = {
            text: 'SHORT_ANSWER',
            email: 'SHORT_ANSWER',
            tel: 'SHORT_ANSWER',
            number: 'SHORT_ANSWER',
            textarea: 'PARAGRAPH',
            select: 'DROPDOWN',
            checkbox: 'CHECKBOX',
            radio: 'MULTIPLE_CHOICE',
            date: 'DATE',
            time: 'TIME',
            file: 'FILE_UPLOAD'
        };

        return {
            name: field.name,
            label: field.label,
            type: mapping[field.type] || 'SHORT_ANSWER',
            required: field.required || false,
            placeholder: field.placeholder,
            options: field.options || []
        };
    });
};

/**
 * Submit form data to Google Forms
 * @param {string} formId - Google Form ID
 * @param {Object} fieldMappings - Field to entry ID mappings
 * @param {Object} formData - Form data to submit
 * @returns {Promise<boolean>} - Success status
 */
export const submitToGoogleForm = async (formId, fieldMappings, formData) => {
    try {
        const submitUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;

        const formBody = new URLSearchParams();
        Object.keys(formData).forEach(fieldName => {
            const entryId = fieldMappings[fieldName];
            if (entryId && formData[fieldName]) {
                formBody.append(`entry.${entryId}`, formData[fieldName]);
            }
        });

        // Submit using fetch with no-cors mode
        // Note: Google Forms doesn't allow CORS, so we use no-cors
        // This means we can't read the response, but submission still works
        await fetch(submitUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString()
        });

        // Since we can't read response in no-cors mode,
        // we assume success if no error was thrown
        return true;
    } catch (error) {
        console.error('Error submitting to Google Forms:', error);
        return false;
    }
};

/**
 * Generate Google Forms field mapping instructions
 * @param {Array} fields - Form fields
 * @returns {string} - Markdown instructions
 */
export const generateFieldMappingInstructions = (fields) => {
    return `
# Hướng dẫn tìm Entry ID của Google Forms

## Bước 1: Mở Google Forms
1. Truy cập Google Forms của bạn
2. Click vào tab "Responses" (Câu trả lời)
3. Click vào nút "Link to Sheets" để tạo Google Sheets

## Bước 2: Lấy Entry ID
1. Mở Google Forms ở chế độ "Preview" (Xem trước)
2. Right-click vào trang và chọn "View Page Source" (Xem nguồn trang)
3. Search (Ctrl+F) tìm "entry." trong source code
4. Tìm các entry ID tương ứng với từng field

### Ví dụ:
- Name field → \`entry.123456789\`
- Email field → \`entry.987654321\`

## Bước 3: Mapping các Field

Dưới đây là các field của form của bạn. Hãy điền Entry ID tương ứng:

${fields.map((field, index) => `
### Field ${index + 1}: ${field.label || field.name}
- **Type:** ${field.type}
- **Name:** ${field.name}
- **Entry ID:** _____________ (Điền vào đây)
`).join('\n')}

## Bước 4: Cấu hình trong Builder
Sau khi có Entry ID, quay lại Form Properties Panel và điền vào mục "Google Forms Integration".
`;
};

/**
 * Test Google Forms integration
 * @param {string} formId - Google Form ID
 * @param {Object} fieldMappings - Field mappings
 * @returns {Promise<Object>} - Test result
 */
export const testGoogleFormsIntegration = async (formId, fieldMappings) => {
    try {
        const testData = {};
        Object.keys(fieldMappings).forEach(fieldName => {
            testData[fieldName] = `Test value for ${fieldName}`;
        });

        const success = await submitToGoogleForm(formId, fieldMappings, testData);

        return {
            success,
            message: success
                ? 'Kết nối thành công! Test submission đã được gửi.'
                : 'Kết nối thất bại. Vui lòng kiểm tra lại Form ID và Field Mappings.'
        };
    } catch (error) {
        return {
            success: false,
            message: 'Lỗi kết nối: ' + error.message
        };
    }
};

/**
 * Generate form submission script for Google Forms
 * @param {string} formId - Google Form ID
 * @param {Object} fieldMappings - Field to entry ID mappings
 * @param {string} formElementId - ID của form element
 * @returns {string} - JavaScript code
 */
export const generateGoogleFormsSubmissionScript = (formId, fieldMappings, formElementId) => {
    return `
<script>
(function() {
    const form = document.getElementById('${formElementId}');
    if (!form) return;

    const GOOGLE_FORM_ID = '${formId}';
    const FIELD_MAPPINGS = ${JSON.stringify(fieldMappings, null, 2)};

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Build Google Forms submission URL
        const submitUrl = \`https://docs.google.com/forms/d/e/\${GOOGLE_FORM_ID}/formResponse\`;
        const body = new URLSearchParams();

        Object.keys(data).forEach(fieldName => {
            const entryId = FIELD_MAPPINGS[fieldName];
            if (entryId && data[fieldName]) {
                body.append(\`entry.\${entryId}\`, data[fieldName]);
            }
        });

        // Show loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang gửi...';
        }

        try {
            // Submit to Google Forms
            await fetch(submitUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString()
            });

            // Show success message
            alert('Form đã được gửi thành công!');
            form.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Có lỗi xảy ra khi gửi form. Vui lòng thử lại.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });
})();
</script>
`;
};

export default {
    extractGoogleFormId,
    isValidGoogleFormUrl,
    getGoogleFormEmbedUrl,
    getGoogleFormPrefillUrl,
    convertToGoogleFormFields,
    submitToGoogleForm,
    generateFieldMappingInstructions,
    testGoogleFormsIntegration,
    generateGoogleFormsSubmissionScript
};
