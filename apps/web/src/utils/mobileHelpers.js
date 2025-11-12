/**
 * Mobile-specific helpers and utilities
 * Best practices for mobile landing pages
 */

/**
 * Mobile breakpoints
 */
export const MOBILE_BREAKPOINTS = {
    small: 320,    // Small phones
    medium: 375,   // Standard (iPhone)
    large: 414,    // Large phones (iPhone Plus)
    xlarge: 428    // Extra large (iPhone Pro Max)
};

/**
 * Minimum touch target sizes (Apple & Google guidelines)
 */
export const TOUCH_TARGETS = {
    minimum: 44,      // Minimum for all interactive elements
    comfortable: 48,  // Comfortable size
    recommended: 56   // Recommended for primary actions
};

/**
 * Mobile-optimized font sizes
 */
export const MOBILE_FONT_SIZES = {
    tiny: 11,
    small: 13,
    body: 16,        // Minimum to prevent zoom on iOS
    bodyLarge: 18,
    h6: 18,
    h5: 20,
    h4: 22,
    h3: 24,
    h2: 28,
    h1: 32,
    hero: 36
};

/**
 * Mobile spacing scale
 */
export const MOBILE_SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32
};

/**
 * Check if element meets minimum touch target size
 */
export const isTouchTargetValid = (width, height, minSize = TOUCH_TARGETS.minimum) => {
    return width >= minSize && height >= minSize;
};

/**
 * Validate element for mobile best practices
 */
export const validateMobileElement = (element) => {
    const warnings = [];
    const errors = [];

    const { type, size, styles, componentData } = element;

    // Check button touch targets
    if (type === 'button') {
        if (size.width < TOUCH_TARGETS.minimum || size.height < TOUCH_TARGETS.minimum) {
            errors.push({
                type: 'touch-target',
                message: `Button too small: ${size.width}×${size.height}px. Minimum: ${TOUCH_TARGETS.minimum}×${TOUCH_TARGETS.minimum}px`,
                suggestion: `Increase to at least ${TOUCH_TARGETS.recommended}×${TOUCH_TARGETS.recommended}px`
            });
        }

        if (size.height < TOUCH_TARGETS.comfortable) {
            warnings.push({
                type: 'touch-target',
                message: `Button height ${size.height}px is below comfortable size`,
                suggestion: `Consider ${TOUCH_TARGETS.comfortable}px or larger`
            });
        }
    }

    // Check text sizes
    if (type === 'heading' || type === 'paragraph') {
        const fontSize = parseInt(styles.fontSize || componentData.fontSize || 16);

        if (type === 'paragraph' && fontSize < 16) {
            warnings.push({
                type: 'font-size',
                message: `Body text ${fontSize}px may trigger zoom on iOS`,
                suggestion: 'Use minimum 16px to prevent auto-zoom'
            });
        }

        if (fontSize < 11) {
            errors.push({
                type: 'font-size',
                message: `Text too small: ${fontSize}px`,
                suggestion: 'Minimum 11px for readability'
            });
        }
    }

    // Check images
    if (type === 'image') {
        if (!componentData.alt || !componentData.alt.trim()) {
            warnings.push({
                type: 'accessibility',
                message: 'Image missing alt text',
                suggestion: 'Add descriptive alt text for accessibility'
            });
        }

        if (size.width > MOBILE_BREAKPOINTS.large) {
            warnings.push({
                type: 'performance',
                message: `Image width ${size.width}px exceeds mobile viewport`,
                suggestion: 'Consider max-width: 100% for responsive images'
            });
        }
    }

    // Check spacing
    const marginBottom = parseInt(styles.marginBottom || 0);
    if (marginBottom < MOBILE_SPACING.md && type !== 'icon') {
        warnings.push({
            type: 'spacing',
            message: 'Tight spacing may reduce readability on mobile',
            suggestion: `Add at least ${MOBILE_SPACING.md}px spacing between elements`
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        score: calculateMobileScore(errors, warnings)
    };
};

/**
 * Calculate mobile optimization score
 */
const calculateMobileScore = (errors, warnings) => {
    let score = 100;
    score -= errors.length * 20;  // Major issues
    score -= warnings.length * 5;  // Minor issues
    return Math.max(0, score);
};

/**
 * Auto-optimize element for mobile
 */
export const optimizeForMobile = (element) => {
    const optimized = JSON.parse(JSON.stringify(element));

    switch (element.type) {
        case 'button':
            // Ensure touch-friendly button size
            if (optimized.mobileSize.height < TOUCH_TARGETS.comfortable) {
                optimized.mobileSize.height = TOUCH_TARGETS.comfortable;
            }
            if (optimized.mobileSize.width < 120) {
                optimized.mobileSize.width = Math.max(120, optimized.mobileSize.width);
            }

            // Increase padding for touch
            optimized.styles.padding = `${MOBILE_SPACING.md}px ${MOBILE_SPACING.xl}px`;
            break;

        case 'heading':
        case 'paragraph':
            // Ensure readable font size
            const currentFontSize = parseInt(optimized.styles.fontSize || 16);
            if (element.type === 'paragraph' && currentFontSize < 16) {
                optimized.styles.fontSize = '16px';
            }

            // Add line-height for readability
            optimized.styles.lineHeight = element.type === 'heading' ? '1.2' : '1.6';

            // Add spacing
            optimized.styles.marginBottom = `${MOBILE_SPACING.lg}px`;
            break;

        case 'image':
            // Make responsive
            optimized.styles.maxWidth = '100%';
            optimized.styles.height = 'auto';

            // Add object-fit for better rendering
            optimized.styles.objectFit = 'cover';
            break;

        case 'icon':
            // Ensure visible icon size
            if (optimized.mobileSize.width < 32) {
                optimized.mobileSize.width = 32;
                optimized.mobileSize.height = 32;
            }
            break;

        default:
            break;
    }

    return optimized;
};

/**
 * Generate mobile optimization report for entire page
 */
export const generateMobileReport = (pageData) => {
    const report = {
        totalElements: pageData.elements.length,
        errors: [],
        warnings: [],
        byType: {},
        recommendations: []
    };

    pageData.elements.forEach(element => {
        const validation = validateMobileElement(element);

        report.errors.push(...validation.errors.map(e => ({
            ...e,
            elementId: element.id,
            elementType: element.type
        })));

        report.warnings.push(...validation.warnings.map(w => ({
            ...w,
            elementId: element.id,
            elementType: element.type
        })));

        // Group by type
        if (!report.byType[element.type]) {
            report.byType[element.type] = { count: 0, errors: 0, warnings: 0 };
        }
        report.byType[element.type].count++;
        report.byType[element.type].errors += validation.errors.length;
        report.byType[element.type].warnings += validation.warnings.length;
    });

    // Generate recommendations
    if (report.errors.length > 0) {
        report.recommendations.push({
            priority: 'high',
            message: `Fix ${report.errors.length} critical mobile issues`
        });
    }

    if (report.warnings.length > 5) {
        report.recommendations.push({
            priority: 'medium',
            message: 'Consider addressing mobile usability warnings'
        });
    }

    // Calculate overall score
    report.overallScore = calculateMobileScore(report.errors, report.warnings);

    return report;
};

/**
 * Mobile-optimized CSS generators
 */
export const generateMobileCSS = (element) => {
    const css = [];

    // Prevent text zoom on iOS
    css.push(`-webkit-text-size-adjust: 100%;`);

    // Smooth scrolling
    css.push(`-webkit-overflow-scrolling: touch;`);

    // Remove tap highlight
    css.push(`-webkit-tap-highlight-color: transparent;`);

    // Touch action for better performance
    if (element.type === 'button') {
        css.push(`touch-action: manipulation;`);
    }

    return css.join('\n');
};

/**
 * Quick fixes for common mobile issues
 */
export const quickFixMobileIssues = (elements) => {
    return elements.map(element => {
        let fixed = { ...element };

        // Fix touch targets
        if (element.type === 'button' && element.mobileSize) {
            if (element.mobileSize.height < TOUCH_TARGETS.minimum) {
                fixed.mobileSize = {
                    ...element.mobileSize,
                    height: TOUCH_TARGETS.comfortable
                };
            }
        }

        // Fix font sizes
        if ((element.type === 'heading' || element.type === 'paragraph') && element.styles) {
            const fontSize = parseInt(element.styles.fontSize || 16);
            if (element.type === 'paragraph' && fontSize < 16) {
                fixed.styles = {
                    ...element.styles,
                    fontSize: '16px'
                };
            }
        }

        // Fix images
        if (element.type === 'image' && element.styles) {
            fixed.styles = {
                ...element.styles,
                maxWidth: '100%',
                height: 'auto'
            };
        }

        return fixed;
    });
};
