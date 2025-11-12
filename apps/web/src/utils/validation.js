/**
 * Validation utilities for Properties Panel
 * Comprehensive validation with user-friendly error messages
 */

/**
 * Validate numeric input with range
 */
export const validateNumber = (value, options = {}) => {
    const {
        min = -Infinity,
        max = Infinity,
        required = false,
        fieldName = 'Giá trị'
    } = options;

    // Check if empty
    if (value === '' || value === null || value === undefined) {
        if (required) {
            return {
                valid: false,
                error: `${fieldName} không được để trống`
            };
        }
        return { valid: true, value: undefined };
    }

    // Parse number
    const parsed = parseFloat(value);

    // Check if NaN
    if (isNaN(parsed)) {
        return {
            valid: false,
            error: `${fieldName} phải là một số hợp lệ`
        };
    }

    // Check range
    if (parsed < min) {
        return {
            valid: false,
            error: `${fieldName} không được nhỏ hơn ${min}`
        };
    }

    if (parsed > max) {
        return {
            valid: false,
            error: `${fieldName} không được lớn hơn ${max}`
        };
    }

    return { valid: true, value: parsed };
};

/**
 * Validate dimension (width/height) with unit
 */
export const validateDimension = (value, options = {}) => {
    const {
        min = 0,
        max = 10000,
        allowedUnits = ['px', '%', 'rem', 'em', 'vw', 'vh'],
        defaultUnit = 'px',
        fieldName = 'Kích thước'
    } = options;

    if (!value) {
        return {
            valid: true,
            value: undefined
        };
    }

    // Parse value and unit
    const match = String(value).match(/^(\d+(?:\.\d+)?)\s*([a-z%]+)?$/i);

    if (!match) {
        return {
            valid: false,
            error: `${fieldName} không hợp lệ (ví dụ: 100px, 50%, 2rem)`
        };
    }

    const numValue = parseFloat(match[1]);
    const unit = match[2] || defaultUnit;

    // Validate unit
    if (!allowedUnits.includes(unit)) {
        return {
            valid: false,
            error: `Đơn vị không hợp lệ. Cho phép: ${allowedUnits.join(', ')}`
        };
    }

    // Validate range (only for px)
    if (unit === 'px') {
        if (numValue < min || numValue > max) {
            return {
                valid: false,
                error: `${fieldName} phải từ ${min}px đến ${max}px`
            };
        }
    }

    return {
        valid: true,
        value: `${numValue}${unit}`
    };
};

/**
 * Validate color (hex, rgb, rgba, named)
 */
export const validateColor = (value) => {
    if (!value) return { valid: true, value: undefined };

    const colorPatterns = [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex
        /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, // RGBA
        /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
        /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/, // HSLA
    ];

    const isValid = colorPatterns.some(pattern => pattern.test(value)) ||
        CSS.supports('color', value); // Named colors

    if (!isValid) {
        return {
            valid: false,
            error: 'Màu sắc không hợp lệ (ví dụ: #FF5733, rgb(255,87,51), red)'
        };
    }

    return { valid: true, value };
};

/**
 * Validate URL
 */
export const validateURL = (value, options = {}) => {
    const { required = false, allowRelative = true } = options;

    if (!value || value.trim() === '') {
        if (required) {
            return {
                valid: false,
                error: 'URL không được để trống'
            };
        }
        return { valid: true, value: undefined };
    }

    // Allow relative URLs
    if (allowRelative && (value.startsWith('/') || value.startsWith('./'))) {
        return { valid: true, value };
    }

    // Validate absolute URL
    try {
        new URL(value);
        return { valid: true, value };
    } catch {
        return {
            valid: false,
            error: 'URL không hợp lệ (ví dụ: https://example.com hoặc /path/to/page)'
        };
    }
};

/**
 * Validate text length
 */
export const validateText = (value, options = {}) => {
    const {
        minLength = 0,
        maxLength = Infinity,
        required = false,
        fieldName = 'Văn bản'
    } = options;

    if (!value || value.trim() === '') {
        if (required) {
            return {
                valid: false,
                error: `${fieldName} không được để trống`
            };
        }
        return { valid: true, value: undefined };
    }

    const length = value.length;

    if (length < minLength) {
        return {
            valid: false,
            error: `${fieldName} phải có ít nhất ${minLength} ký tự`
        };
    }

    if (length > maxLength) {
        return {
            valid: false,
            error: `${fieldName} không được vượt quá ${maxLength} ký tự`
        };
    }

    return { valid: true, value };
};

/**
 * Validate CSS property value
 */
export const validateCSS = (property, value) => {
    if (!value) return { valid: true, value: undefined };

    // Use CSS.supports to validate
    const isValid = CSS.supports(property, value);

    if (!isValid) {
        return {
            valid: false,
            error: `Giá trị CSS không hợp lệ cho thuộc tính "${property}"`
        };
    }

    return { valid: true, value };
};

/**
 * Batch validate multiple fields
 */
export const validateFields = (fields) => {
    const errors = {};
    const validatedValues = {};
    let isValid = true;

    Object.entries(fields).forEach(([fieldName, { value, validator, options }]) => {
        const result = validator(value, options);

        if (!result.valid) {
            errors[fieldName] = result.error;
            isValid = false;
        } else {
            validatedValues[fieldName] = result.value;
        }
    });

    return {
        valid: isValid,
        errors,
        values: validatedValues
    };
};

/**
 * Pre-defined validation rules
 */
export const VALIDATION_RULES = {
    width: {
        validator: validateDimension,
        options: { min: 10, max: 5000, fieldName: 'Chiều rộng' }
    },
    height: {
        validator: validateDimension,
        options: { min: 10, max: 5000, fieldName: 'Chiều cao' }
    },
    padding: {
        validator: validateDimension,
        options: { min: 0, max: 500, fieldName: 'Padding' }
    },
    margin: {
        validator: validateDimension,
        options: { min: -500, max: 500, fieldName: 'Margin' }
    },
    fontSize: {
        validator: validateDimension,
        options: { min: 8, max: 200, fieldName: 'Cỡ chữ' }
    },
    borderRadius: {
        validator: validateDimension,
        options: { min: 0, max: 500, fieldName: 'Bo góc' }
    },
    opacity: {
        validator: validateNumber,
        options: { min: 0, max: 1, fieldName: 'Độ trong suốt' }
    },
    zIndex: {
        validator: validateNumber,
        options: { min: 0, max: 10000, fieldName: 'Z-Index' }
    },
    color: {
        validator: validateColor
    },
    backgroundColor: {
        validator: validateColor
    },
    url: {
        validator: validateURL,
        options: { allowRelative: true }
    }
};
