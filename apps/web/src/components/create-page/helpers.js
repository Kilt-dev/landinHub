import React from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { sections } from '../../constants/sections';
import eventController from '../../utils/EventUtils';
import {
    CountdownRenderer,
    CarouselRenderer,
    AccordionRenderer,
    TabsRenderer,
    ProgressRenderer,
    RatingRenderer,
    SocialProofRenderer,
    SocialProofStatsRenderer
} from './advanced';

// Constants
/**
 * Item types for drag-and-drop functionality
 */
export const ItemTypes = {
    ELEMENT: 'element',
    EXISTING_ELEMENT: 'existingElement',
    CHILD_ELEMENT: 'childElement',
};

// Utilities
/**
 * Converts camelCase to kebab-case for CSS properties
 * @param {string} str - The camelCase string
 * @returns {string} The kebab-case string
 */
const toKebabCase = (str) =>
    str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Calculates precise coordinates within a canvas or section
 * FIXED: Better handling of zoom, scroll, and negative positions
 * @param {number} mouseX - Mouse X coordinate
 * @param {number} mouseY - Mouse Y coordinate
 * @param {HTMLElement} containerElement - The container element
 * @param {number} zoomLevel - Zoom level percentage
 * @returns {Object} Coordinates { x, y }
 */
export const getCanvasPosition = (mouseX, mouseY, containerElement, zoomLevel = 100) => {
    if (!containerElement) {
        console.error('Container element is null in getCanvasPosition');
        return { x: 0, y: 0 };
    }

    const rect = containerElement.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // Calculate position relative to container, accounting for zoom and scroll
    const zoom = zoomLevel / 100;
    const rawX = ((mouseX - rect.left) / zoom);
    const rawY = ((mouseY - rect.top) / zoom);

    // Allow negative positions but round to avoid sub-pixel issues
    return {
        x: Math.round(rawX),
        y: Math.round(rawY)
    };
};


/**
 * Snaps coordinates to grid or nearby snap points
 * FREE MODE: Pass enableSnap = false for pixel-perfect free positioning
 * FIXED: Better snapping tolerance and grid handling
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} gridSize - Size of the grid
 * @param {Array<Object>} snapPoints - Array of snap points { x, y }
 * @param {boolean} enableSnap - Enable/disable snapping (default: true)
 * @returns {Object} Snapped or free coordinates { x, y }
 */
export const snapToGrid = (x, y, gridSize = 1, snapPoints = [], enableSnap = true) => {
    // Round to avoid sub-pixel issues
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Free positioning mode - return exact coordinates
    if (!enableSnap || gridSize <= 1) {
        return { x: roundedX, y: roundedY };
    }

    // Snap to grid
    let snappedX = Math.round(roundedX / gridSize) * gridSize;
    let snappedY = Math.round(roundedY / gridSize) * gridSize;

    // Snap to nearby points (guidelines) - with 10px tolerance
    const SNAP_TOLERANCE = 10;
    snapPoints.forEach((point) => {
        if (point && typeof point.x === 'number' && Math.abs(roundedX - point.x) < SNAP_TOLERANCE) {
            snappedX = point.x;
        }
        if (point && typeof point.y === 'number' && Math.abs(roundedY - point.y) < SNAP_TOLERANCE) {
            snappedY = point.y;
        }
    });

    return { x: Math.round(snappedX), y: Math.round(snappedY) };
};

/**
 * Calculates bounds of an element for snapping
 * @param {Object} element - Element object with position and size
 * @returns {Object} Bounds { left, top, right, bottom, centerX, centerY }
 */
export const getElementBounds = (element) => ({
    left: element.position?.desktop?.x || 0,
    top: element.position?.desktop?.y || 0,
    right: (element.position?.desktop?.x || 0) + (element.size?.width || 200),
    bottom: (element.position?.desktop?.y || 0) + (element.size?.height || 50),
    centerX: (element.position?.desktop?.x || 0) + (element.size?.width || 200) / 2,
    centerY: (element.position?.desktop?.y || 0) + (element.size?.height || 50) / 2,
});

/**
 * Processes styles including pseudo-classes and keyframes into CSS string
 * @param {Object} styles - Style object
 * @param {string} className - CSS class name
 * @returns {string} Generated CSS string
 */
export const processStyles = (styles, className) => {
    let cssString = '';
    const keyframes = {};

    Object.entries(styles).forEach(([key, value]) => {
        if (key.startsWith(':')) {
            cssString += `.${className}${key} { `;
            Object.entries(value).forEach(([prop, val]) => {
                if (prop.startsWith('::')) {
                    cssString += `.${className}${prop} { `;
                    Object.entries(val).forEach(([p, v]) => {
                        cssString += `${toKebabCase(p)}: ${v}; `;
                    });
                    cssString += '} ';
                } else {
                    cssString += `${toKebabCase(prop)}: ${val}; `;
                }
            });
            cssString += '} ';
        } else if (key.startsWith('@keyframes')) {
            keyframes[key] = value;
        } else {
            cssString += `${toKebabCase(key)}: ${value}; `;
        }
    });

    Object.entries(keyframes).forEach(([key, frames]) => {
        cssString += `${key} { `;
        Object.entries(frames).forEach(([percentage, props]) => {
            cssString += `${percentage} { `;
            Object.entries(props).forEach(([prop, val]) => {
                cssString += `${toKebabCase(prop)}: ${val}; `;
            });
            cssString += '} ';
        });
        cssString += '} ';
    });

    return cssString;
};

// Component Rendering
/**
 * Cleans styles for text-based elements by removing incompatible properties
 * @param {Object} originalStyles - Original style object
 * @returns {Object} Cleaned style object
 */
const getCleanTextStyles = (originalStyles) => {
    const cleaned = { ...originalStyles };
    const propertiesToRemove = [
        'border',
        'borderRadius',
        'boxShadow',
        'backgroundColor',
        'background',
        'backgroundImage',
        'backgroundSize',
        'backgroundPosition',
        'padding',
        'paddingLeft',
        'paddingRight',
        'paddingTop',
        'paddingBottom',
    ];

    propertiesToRemove.forEach((prop) => delete cleaned[prop]);

    return {
        ...cleaned,
        margin: cleaned.margin || '0',
        boxSizing: 'border-box',
        display: cleaned.display || 'block',
        width: cleaned.width || '100%',
        height: cleaned.height || 'auto',
    };
};

/**
 * Generates CSS for icon component with pseudo-classes and keyframes
 * @param {Object} styles - Style object
 * @param {string} uniqueClass - Unique CSS class name
 * @param {boolean} hasImage - Whether the icon uses an image
 * @returns {string} Generated CSS string
 */
const getIconCSS = (styles, uniqueClass, hasImage) => {
    let hoverCSS = '';
    let activeCSS = '';
    let keyframesCSS = '';

    const iconStyles = { ...styles };
    const hoverStyles = iconStyles[':hover'] || {};
    const activeStyles = iconStyles[':active'] || {};

    delete iconStyles[':hover'];
    delete iconStyles[':active'];

    Object.keys(iconStyles).forEach((key) => {
        if (key.startsWith('@keyframes')) {
            const animationName = key.replace('@keyframes ', '').trim();
            const frames = iconStyles[key];
            keyframesCSS += `@keyframes ${animationName} {`;
            Object.entries(frames).forEach(([percentage, props]) => {
                keyframesCSS += `${percentage} {`;
                Object.entries(props).forEach(([prop, val]) => {
                    keyframesCSS += `${toKebabCase(prop)}: ${val};`;
                });
                keyframesCSS += '}';
            });
            keyframesCSS += '}';
            delete iconStyles[key];
        }
    });

    if (Object.keys(hoverStyles).length > 0) {
        hoverCSS = `.${uniqueClass}:hover {`;
        Object.entries(hoverStyles).forEach(([key, value]) => {
            hoverCSS += `${toKebabCase(key)}: ${value};`;
        });
        hoverCSS += '}';
    }

    if (Object.keys(activeStyles).length > 0) {
        activeCSS = `.${uniqueClass}:active {`;
        Object.entries(activeStyles).forEach(([key, value]) => {
            activeCSS += `${toKebabCase(key)}: ${value};`;
        });
        activeCSS += '}';
    }

    const imgCSS = hasImage
        ? `
        .${uniqueClass} img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `
        : '';

    return `
    .${uniqueClass} {
      position: absolute;
      z-index: ${iconStyles.zIndex || 10};
      isolation: ${iconStyles.isolation || 'isolate'};
    }
    .${uniqueClass} svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: ${iconStyles.stroke || 'currentColor'};
      stroke-width: ${iconStyles.strokeWidth || 2};
      stroke-linecap: ${iconStyles.strokeLinecap || 'round'};
      stroke-linejoin: ${iconStyles.strokeLinejoin || 'round'};
    }
    ${imgCSS}
    ${hoverCSS}
    ${activeCSS}
    ${keyframesCSS}
  `;
};

/**
 * Generates CSS for button component with pseudo-classes and keyframes
 * @param {Object} styles - Style object
 * @param {string} buttonClass - Unique CSS class name
 * @returns {string} Generated CSS string
 */
const getButtonCSS = (styles, buttonClass) => {
    const buttonStyles = { ...styles };
    const pseudoStyles = {
        ':hover': buttonStyles[':hover'] || {},
        ':active': buttonStyles[':active'] || {},
    };
    const keyframes = {};

    delete buttonStyles[':hover'];
    delete buttonStyles[':active'];

    Object.keys(buttonStyles).forEach((key) => {
        if (key.startsWith('@keyframes')) {
            keyframes[key.replace('@keyframes ', '').trim()] = buttonStyles[key];
            delete buttonStyles[key];
        }
    });

    let cssString = Object.entries(pseudoStyles).reduce((acc, [pseudo, props]) => {
        if (Object.keys(props).length === 0) return acc;
        const propsString = Object.entries(props).map(([key, value]) => {
            if (key.startsWith('::')) {
                const subPropsString = Object.entries(value).map(([k, v]) => `${toKebabCase(k)}: ${v};`).join(' ');
                return `.${buttonClass}${key} { ${subPropsString} }`;
            }
            return `${toKebabCase(key)}: ${value};`;
        }).join(' ');
        return `${acc}.${buttonClass}${pseudo} { ${propsString} } `;
    }, '');

    cssString += Object.entries(keyframes).reduce((acc, [name, frames]) => {
        const framesString = Object.entries(frames).map(([frame, props]) => {
            const propsString = Object.entries(props).map(([key, value]) => `${toKebabCase(key)}: ${value};`).join(' ');
            return `${frame} { ${propsString} }`;
        }).join(' ');
        return `${acc} @keyframes ${name} { ${framesString} }`;
    }, '');

    return cssString;
};

/**
 * Generates CSS for gallery animations
 * @param {Object} animation - Animation configuration
 * @param {string} galleryClass - Unique CSS class name
 * @returns {string} Generated CSS string
 */
const getGalleryAnimationCSS = (animation, galleryClass) => {
    if (!animation?.type) return '';

    const animationName = `${animation.type}-${galleryClass}`;
    const animationCSS = `
    @keyframes ${animationName} {
      ${animation.type === 'fadeIn' ? `
        from { opacity: 0; }
        to { opacity: 1; }
      ` : animation.type === 'fadeInUp' ? `
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      ` : animation.type === 'slideInRight' ? `
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      ` : animation.type === 'bounceIn' ? `
        0% { opacity: 0; transform: scale(0.3); }
        50% { opacity: 1; transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); }
      ` : ''}
    }
    .${galleryClass} {
      animation: ${animationName} ${animation.duration || 800}ms ease-out ${animation.delay || 0}ms;
    }
  `;

    return animationCSS;
};

/**
 * Renders content for different component types
 * @param {string} type - Component type
 * @param {Object} componentData - Component data
 * @param {Object} styles - Style object
 * @param {Array} children - Child components
 * @param {boolean} isCanvas - Whether in canvas mode
 * @param {Function} onSelectChild - Child selection callback
 * @param {string} parentId - Parent element ID
 * @param {string} childId - Child element ID
 * @param {boolean} isTemplateMode - Whether in template mode
 * @param {string} viewMode - Current view mode (desktop/tablet/mobile)
 * @returns {JSX.Element} Rendered component
 */
export const renderComponentContent = (
    type,
    componentData = {},
    styles = {},
    children = [],
    isCanvas = false,
    onSelectChild = null,
    parentId = null,
    childId = null,
    isTemplateMode = false,
    viewMode = 'desktop'
) => {
    // Validation
    if (!type || typeof type !== 'string') {
        return (
            <div
                style={{
                    color: componentData.errorColor || '#ff0000',
                    padding: '10px',
                    border: '1px dashed #ff0000',
                    borderRadius: '4px',
                    ...styles,
                }}
            >
                Unknown Component: {type || 'Không xác định'}
            </div>
        );
    }

    // Determine if component should use absolute positioning
    // Only use absolute for positioned elements that need it
    const absolutePositionTypes = ['icon', 'square', 'star'];
    const shouldUseAbsolutePosition = absolutePositionTypes.includes(type.toLowerCase());

    // Base styles with proper position handling
    // Preserve existing position if set, otherwise use appropriate default
    const baseStyles = {
        ...styles,
        position: styles.position || (shouldUseAbsolutePosition ? 'absolute' : undefined),
    };

    // Section rendering - This is used by Element.js wrapper, so keep it simple
    if (type === 'section' && componentData.structure === 'ladi-standard') {
        return (
            <div className="ladi-section" style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'visible',
            }}>
                {/* Background and overlay are handled by Element.js wrapper */}
                <div
                    className="ladi-container"
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    {children.map((child, index) => {
                        // Get responsive values for child
                        const childPosition = child.position?.[viewMode] || child.position?.desktop || { x: 0, y: 0 };
                        const childSize = viewMode === 'mobile' && child.mobileSize
                            ? child.mobileSize
                            : viewMode === 'tablet' && child.tabletSize
                                ? child.tabletSize
                                : child.size || {};

                        // Determine if child should use absolute positioning
                        const childNeedsAbsolute = child.styles?.position === 'absolute' ||
                            ['icon', 'square', 'star'].includes(child.type?.toLowerCase());

                        // Merge child styles with position
                        const childStyles = {
                            ...child.styles,
                            position: childNeedsAbsolute ? 'absolute' : (child.styles?.position || 'absolute'), // Children in sections are absolute by default
                            left: childPosition.x !== undefined ? `${childPosition.x}px` : undefined,
                            top: childPosition.y !== undefined ? `${childPosition.y}px` : undefined,
                            width: childSize.width ? `${childSize.width}px` : child.styles?.width,
                            height: childSize.height ? `${childSize.height}px` : child.styles?.height,
                            zIndex: childPosition.z || child.styles?.zIndex || 1,
                        };

                        return React.cloneElement(
                            renderComponentContent(
                                child.type,
                                child.componentData || {},
                                childStyles,
                                child.children || [],
                                isCanvas,
                                onSelectChild,
                                parentId,
                                child.id,
                                isTemplateMode,
                                viewMode
                            ),
                            { key: child.id || index }
                        );
                    })}
                </div>
            </div>
        );
    }

    // Component-specific rendering
    switch (type.toLowerCase()) {
        case 'square': {
            const { events = {} } = componentData;
            const handleClick = (e) => {
                e.stopPropagation();
                if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                    onSelectChild(parentId, childId);
                }
                // Only trigger events in preview mode, not canvas
                if (events.onClick && !isCanvas) {
                    eventController.handleEvent(events.onClick, childId || parentId, false);
                }
            };

            return (
                <svg
                    width={baseStyles.width || componentData.size?.width || 50}
                    height={baseStyles.height || componentData.size?.height || 50}
                    style={baseStyles}
                    onClick={handleClick}
                >
                    <rect
                        x="0"
                        y="0"
                        width={baseStyles.width || componentData.size?.width || 50}
                        height={baseStyles.height || componentData.size?.height || 50}
                        fill={baseStyles.fill || componentData.fill || '#000'}
                        stroke={baseStyles.stroke || componentData.stroke || 'currentColor'}
                        strokeWidth={baseStyles.strokeWidth || componentData.strokeWidth || 2}
                        strokeLinecap={baseStyles.strokeLinecap || componentData.strokeLinecap || 'round'}
                        strokeLinejoin={baseStyles.strokeLinejoin || componentData.strokeLinejoin || 'round'}
                    />
                </svg>
            );
        }

        case 'star': {
            const { events = {} } = componentData;
            const handleClick = (e) => {
                e.stopPropagation();
                if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                    onSelectChild(parentId, childId);
                }
                // Only trigger events in preview mode, not canvas
                if (events.onClick && !isCanvas) {
                    eventController.handleEvent(events.onClick, childId || parentId, false);
                }
            };

            return (
                <svg
                    width={baseStyles.width || componentData.size?.width || 50}
                    height={baseStyles.height || componentData.size?.height || 50}
                    style={baseStyles}
                    onClick={handleClick}
                >
                    <path
                        d="M25 5 L32 18 H48 L36 29 L41 44 L25 36 L9 44 L14 29 L2 18 H18 Z"
                        fill={baseStyles.fill || componentData.fill || '#000'}
                        stroke={baseStyles.stroke || componentData.stroke || 'currentColor'}
                        strokeWidth={baseStyles.strokeWidth || componentData.strokeWidth || 2}
                        strokeLinecap={baseStyles.strokeLinecap || componentData.strokeLinecap || 'round'}
                        strokeLinejoin={baseStyles.strokeLinejoin || componentData.strokeLinejoin || 'round'}
                    />
                </svg>
            );
        }

        case 'layoutgrid': {
            return (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: componentData.columns
                            ? `repeat(${componentData.columns}, 1fr)`
                            : baseStyles.gridTemplateColumns || 'repeat(2, 1fr)',
                        gap: componentData.gap || baseStyles.gap || '20px',
                        padding: componentData.padding || baseStyles.padding || '10px',
                        background: componentData.background || baseStyles.background || 'transparent',
                        ...baseStyles,
                    }}
                >
                    {children.map((child, index) =>
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
                </div>
            );
        }

        case 'icon': {
            const { icon, events = {}, title, imageUrl } = componentData;
            const uniqueClass = `icon-${parentId || 'root'}-${childId || Date.now()}`;
            const isSvg = icon && icon.startsWith('<svg');

            const handleClick = (e) => {
                e.stopPropagation();
                if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                    onSelectChild(parentId, childId);
                }
                // Only trigger events in preview mode, not canvas
                if (events.onClick && !isCanvas) {
                    eventController.handleEvent(events.onClick, childId || parentId, false);
                }
            };

            const iconStyles = {
                ...baseStyles,
                width: componentData.size?.width || baseStyles.width || '50px',
                height: componentData.size?.height || baseStyles.height || '50px',
                display: baseStyles.display || 'flex',
                alignItems: baseStyles.alignItems || 'center',
                justifyContent: baseStyles.justifyContent || 'center',
                cursor: events.onClick ? 'pointer' : 'default',
            };

            const cssString = getIconCSS(styles, uniqueClass, !!imageUrl);

            return (
                <>
                    {cssString && <style>{cssString}</style>}
                    <div className={`lpb-icon ${uniqueClass}`} style={iconStyles} onClick={handleClick} title={title || ''}>
                        {imageUrl ? (
                            <img src={imageUrl} alt={title || 'Icon'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : isSvg ? (
                            <div
                                dangerouslySetInnerHTML={{ __html: icon }}
                                style={{
                                    width: componentData.size?.width || baseStyles.width || '50px',
                                    height: componentData.size?.height || baseStyles.height || '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            />
                        ) : (
                            icon && <i className={icon} style={{ fontSize: 'inherit', color: 'inherit' }} />
                        )}
                    </div>
                </>
            );
        }

        case 'heading': {
            const headingLevel = componentData.level && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(componentData.level)
                ? componentData.level
                : 'h2';
            const HeadingTag = headingLevel;
            return (
                <HeadingTag
                    style={{
                        ...getCleanTextStyles(baseStyles),
                        position: baseStyles.position || 'relative',  // ✅ Preserve position
                        fontSize: baseStyles.fontSize || componentData.fontSize || '1.5rem',
                        color: baseStyles.color || componentData.color || '#1f2937',
                        margin: baseStyles.margin || componentData.margin || '0',
                        fontWeight: baseStyles.fontWeight || componentData.fontWeight || '700',
                        textAlign: baseStyles.textAlign || componentData.textAlign || 'left',
                        lineHeight: baseStyles.lineHeight || componentData.lineHeight || '1.4',
                        fontFamily: baseStyles.fontFamily || componentData.fontFamily || 'Arial, sans-serif',
                        fontStyle: baseStyles.fontStyle || componentData.fontStyle || 'normal',
                        textDecoration: baseStyles.textDecoration || componentData.textDecoration || 'none',
                        textTransform: baseStyles.textTransform || componentData.textTransform || 'none',
                        letterSpacing: baseStyles.letterSpacing || componentData.letterSpacing || '0',
                        textShadow: baseStyles.textShadow || componentData.textShadow || 'none',
                        WebkitTextStroke: baseStyles.WebkitTextStroke || componentData.WebkitTextStroke || 'none',
                        WebkitBackgroundClip: baseStyles.WebkitBackgroundClip || componentData.WebkitBackgroundClip || 'initial',
                        WebkitTextFillColor: baseStyles.WebkitTextFillColor || componentData.WebkitTextFillColor || 'initial',
                        zIndex: baseStyles.zIndex || 100,  // ✅ Cao hơn background
                        pointerEvents: 'auto',  // ✅ CHO PHÉP CLICK
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                            onSelectChild(parentId, childId);
                        }
                    }}
                >
                    {componentData.content || 'Tiêu đề'}
                </HeadingTag>
            );
        }

        case 'paragraph': {
            return (
                <p
                    style={{
                        ...getCleanTextStyles(baseStyles),
                        position: baseStyles.position || 'relative',  // ✅ Preserve position
                        fontSize: componentData.fontSize || '1rem',
                        color: componentData.color || '#1f2937',
                        margin: componentData.margin || '0',
                        fontWeight: componentData.fontWeight || '400',
                        lineHeight: componentData.lineHeight || '1.6',
                        textAlign: componentData.textAlign || 'left',
                        zIndex: baseStyles.zIndex || 100,  // ✅ Cao hơn background
                        pointerEvents: 'auto',  // ✅ CHO PHÉP CLICK
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                            onSelectChild(parentId, childId);
                        }
                    }}
                >
                    {componentData.content || 'Đoạn văn'}
                </p>
            );
        }

        case 'button': {
            const buttonClass = `button-${componentData.id || Math.random().toString(36).substr(2, 9)}`;
            const cssString = getButtonCSS(styles, buttonClass);

            const handleClick = (e) => {
                e.stopPropagation();
                // Canvas: Only select element, no event simulation
                if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                    onSelectChild(parentId, childId);
                    return; // Don't trigger events on canvas
                }
                // Preview: Execute actual events
                if (componentData.events?.onClick && !isCanvas) {
                    eventController.handleEvent(componentData.events.onClick, childId || parentId, false);
                    const event = componentData.events.onClick;
                    if (event.type === 'submitForm') {
                        console.log(`Submitting form to ${event.apiUrl}`);
                    } else if (event.type === 'navigate') {
                        window.location.href = event.url;
                    } else if (event.type === 'triggerApi') {
                        console.log(`Trigger API: ${event.apiUrl}`);
                    }
                }
            };

            return (
                <>
                    {cssString && <style>{cssString}</style>}
                    <button
                        className={buttonClass}
                        style={{
                            ...baseStyles,
                            position: baseStyles.position || 'relative',  // ✅ Preserve position
                            padding: baseStyles.padding || componentData.padding || '10px 20px',
                            borderRadius: baseStyles.borderRadius || componentData.borderRadius || '8px',
                            background: baseStyles.background || componentData.background || '#2563eb',
                            color: baseStyles.color || componentData.color || '#fff',
                            border: baseStyles.border || componentData.border || 'none',
                            cursor: baseStyles.cursor || 'pointer',
                            fontSize: baseStyles.fontSize || componentData.fontSize || '1rem',
                            fontWeight: baseStyles.fontWeight || componentData.fontWeight || '600',
                            textAlign: baseStyles.textAlign || componentData.textAlign || 'center',
                            display: baseStyles.display || 'inline-flex',
                            alignItems: baseStyles.alignItems || 'center',
                            justifyContent: baseStyles.justifyContent || 'center',
                            transition: baseStyles.transition || 'all 0.3s ease',
                            boxSizing: 'border-box',
                            width: baseStyles.width || 'auto',
                            minWidth: baseStyles.minWidth || 'fit-content',
                            whiteSpace: 'nowrap',
                            zIndex: baseStyles.zIndex || 100,  // ✅ Cao hơn background
                            pointerEvents: 'auto',  // ✅ CHO PHÉP CLICK
                        }}
                        onClick={handleClick}
                    >
                        {componentData.content || 'Nút'}
                    </button>
                </>
            );
        }

        case 'image': {
            return (
                <img
                    src={componentData.src || 'https://via.placeholder.com/150?text=Image'}
                    alt={componentData.alt || 'Hình ảnh'}
                    style={{
                        maxWidth: componentData.maxWidth || '100%',
                        height: componentData.height || 'auto',
                        borderRadius: componentData.borderRadius || '0',
                        ...baseStyles,
                    }}
                    draggable={componentData.draggable ?? false}
                />
            );
        }

        case 'iframe': {
            // Show placeholder if no src in canvas mode
            if (isCanvas && !componentData.src) {
                return (
                    <div
                        style={{
                            width: '100%',
                            minHeight: componentData.height || '400px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3f4f6',
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            color: '#6b7280',
                            flexDirection: 'column',
                            gap: '8px',
                            ...baseStyles,
                        }}
                    >
                        <div style={{ fontSize: '48px' }}>🖼️</div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>Iframe Component</div>
                        <div style={{ fontSize: '12px' }}>Thêm URL trong Properties Panel</div>
                    </div>
                );
            }

            return (
                <iframe
                    src={componentData.src || 'about:blank'}
                    title={componentData.title || 'Iframe'}
                    width={componentData.width || '100%'}
                    height={componentData.height || '400px'}
                    frameBorder={componentData.frameBorder ?? 0}
                    allow={componentData.allow || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'}
                    allowFullScreen={componentData.allowFullscreen ?? true}
                    loading={componentData.loading || 'lazy'}
                    style={{
                        width: '100%',
                        minHeight: componentData.height || '400px',
                        border: componentData.border || 'none',
                        pointerEvents: isCanvas ? 'none' : 'auto',
                        ...baseStyles,
                    }}
                />
            );
        }

        case 'form': {
            // Form submission state management
            const [isSubmitting, setIsSubmitting] = React.useState(false);
            const [submitStatus, setSubmitStatus] = React.useState(null); // 'success' | 'error' | null
            const [submitMessage, setSubmitMessage] = React.useState('');
            const formRef = React.useRef(null);

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
                    form_data: data,
                    metadata: {
                        device_type: getDeviceType(),
                        user_agent: navigator.userAgent,
                        screen_resolution: `${window.screen.width}x${window.screen.height}`,
                        referrer: document.referrer || 'direct',
                        submitted_at: new Date().toISOString(),
                        ...getUtmParams(),
                    }
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
                            {/* Empty form placeholder in canvas mode */}
                            {isCanvas && children.length === 0 && (
                                <div
                                    style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        backgroundColor: '#f9fafb',
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '8px',
                                        color: '#6b7280',
                                    }}
                                >
                                    <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                                        Form rỗng
                                    </div>
                                    <div style={{ fontSize: '13px' }}>
                                        Nhấp vào form và mở Properties Panel để thêm các trường
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
                    {children.map((child, index) =>
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
        }

        case 'section':
        case 'container': {
            return (
                <div
                    style={{
                        display: componentData.layoutType || 'flex',
                        flexDirection: componentData.direction || 'column',
                        gap: componentData.gap || '10px',
                        padding: componentData.padding || '0',
                        background: componentData.background || 'transparent',
                        ...baseStyles,
                    }}
                >
                    {componentData.title && !children.some((child) => child?.type === 'heading') && (
                        <h2
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.titleFontSize || '1.8rem',
                                margin: componentData.titleMargin || '0',
                                color: componentData.titleColor || '#1f2937',
                                fontWeight: componentData.titleFontWeight || '700',
                            }}
                        >
                            {componentData.title}
                        </h2>
                    )}
                    {componentData.subtitle && !children.some((child) => child?.type === 'paragraph') && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.subtitleFontSize || '1.2rem',
                                margin: componentData.subtitleMargin || '0',
                                color: componentData.subtitleColor || '#4b5563',
                            }}
                        >
                            {componentData.subtitle}
                        </p>
                    )}
                    {componentData.content && !children.some((child) => child?.type === 'paragraph') && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.contentFontSize || '1rem',
                                margin: componentData.contentMargin || '0',
                                color: componentData.contentColor || '#4b5563',
                            }}
                        >
                            {componentData.content}
                        </p>
                    )}
                    {Array.isArray(componentData.features) && componentData.features.length > 0 && !children.some((child) => child?.type === 'list') && (
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: componentData.featuresPadding || 0,
                                margin: componentData.featuresMargin || '0',
                                display: 'flex',
                                flexDirection: componentData.featuresDirection || 'column',
                                gap: componentData.featuresGap || '8px',
                            }}
                        >
                            {componentData.features.map((feature, index) => (
                                <li
                                    key={index}
                                    style={{
                                        fontSize: componentData.featureFontSize || '1rem',
                                        color: componentData.featureColor || '#1f2937',
                                    }}
                                >
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                    {componentData.ctaText && !children.some((child) => child?.type === 'button') && (
                        <button
                            style={{
                                padding: componentData.ctaPadding || '10px 20px',
                                borderRadius: componentData.ctaBorderRadius || '8px',
                                background: componentData.ctaBackground || '#2563eb',
                                color: componentData.ctaColor || '#fff',
                                border: componentData.ctaBorder || 'none',
                                cursor: 'pointer',
                                fontSize: componentData.ctaFontSize || '1rem',
                                fontWeight: componentData.ctaFontWeight || '600',
                            }}
                        >
                            {componentData.ctaText}
                        </button>
                    )}
                    {componentData.contact && !children.some((child) => child?.type === 'paragraph') && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.contactFontSize || '0.9rem',
                                margin: componentData.contactMargin || '0',
                                color: componentData.contactColor || '#4b5563',
                            }}
                        >
                            {componentData.contact}
                        </p>
                    )}
                    {children.map((child, index) =>
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
                </div>
            );
        }

        case 'divider': {
            return (
                <hr
                    style={{
                        border: 'none',
                        backgroundColor: componentData.color || '#e5e7eb',
                        height: componentData.thickness || '2px',
                        width: componentData.width || '100%',
                        margin: componentData.margin || '20px 0',
                        flexShrink: 0,
                        ...baseStyles,
                    }}
                />
            );
        }

        case 'spacer': {
            return (
                <div
                    style={{
                        background: componentData.background || 'transparent',
                        height: componentData.height || '40px',
                        width: componentData.width || '100%',
                        ...baseStyles,
                    }}
                />
            );
        }

        case 'popup': {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: componentData.direction || 'column',
                        gap: componentData.gap || '10px',
                        textAlign: componentData.textAlign || 'center',
                        padding: componentData.padding || '20px',
                        background: componentData.background || 'rgba(255, 255, 255, 0.9)',
                        borderRadius: componentData.borderRadius || '12px',
                        ...baseStyles,
                    }}
                >
                    {componentData.title && !children.some((child) => child?.type === 'heading') && (
                        <h3
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.titleFontSize || '1.5rem',
                                margin: componentData.titleMargin || '0',
                                color: componentData.titleColor || '#1f2937',
                                fontWeight: componentData.titleFontWeight || '600',
                            }}
                        >
                            {componentData.title}
                        </h3>
                    )}
                    {componentData.content && !children.some((child) => child?.type === 'paragraph') && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.contentFontSize || '1rem',
                                margin: componentData.contentMargin || '0',
                                color: componentData.contentColor || '#4b5563',
                            }}
                        >
                            {componentData.content}
                        </p>
                    )}
                    {componentData.buttonText && !children.some((child) => child?.type === 'button') && (
                        <button
                            style={{
                                padding: componentData.buttonPadding || '10px 20px',
                                borderRadius: componentData.buttonBorderRadius || '8px',
                                background: componentData.buttonBackground || '#2563eb',
                                color: componentData.buttonColor || '#fff',
                                border: componentData.buttonBorder || 'none',
                                cursor: 'pointer',
                                fontSize: componentData.buttonFontSize || '1rem',
                                fontWeight: componentData.buttonFontWeight || '600',
                            }}
                        >
                            {componentData.buttonText}
                        </button>
                    )}
                    {children.map((child, index) =>
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
                </div>
            );
        }

        case 'modal': {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: componentData.direction || 'column',
                        gap: componentData.gap || '10px',
                        padding: componentData.padding || '20px',
                        background: componentData.background || 'rgba(255, 255, 255, 0.9)',
                        borderRadius: componentData.borderRadius || '12px',
                        ...baseStyles,
                    }}
                >
                    {componentData.title && !children.some((child) => child?.type === 'heading') && (
                        <h3
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.titleFontSize || '1.5rem',
                                margin: componentData.titleMargin || '0',
                                color: componentData.titleColor || '#1f2937',
                                fontWeight: componentData.titleFontWeight || '600',
                            }}
                        >
                            {componentData.title}
                        </h3>
                    )}
                    {componentData.content && !children.some((child) => child?.type === 'paragraph') && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.contentFontSize || '1rem',
                                margin: componentData.contentMargin || '0',
                                color: componentData.contentColor || '#4b5563',
                            }}
                        >
                            {componentData.content}
                        </p>
                    )}
                    {componentData.closeButton && !children.some((child) => child?.type === 'button') && (
                        <button
                            style={{
                                padding: componentData.buttonPadding || '8px 16px',
                                borderRadius: componentData.buttonBorderRadius || '8px',
                                background: componentData.buttonBackground || '#6b7280',
                                color: componentData.buttonColor || '#fff',
                                border: componentData.buttonBorder || 'none',
                                cursor: 'pointer',
                                alignSelf: 'flex-end',
                                fontSize: componentData.buttonFontSize || '1rem',
                                fontWeight: componentData.buttonFontWeight || '600',
                            }}
                        >
                            {componentData.buttonText || 'Đóng'}
                        </button>
                    )}
                    {children.map((child, index) =>
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
                </div>
            );
        }

        case 'card': {
            return (
                <div
                    style={{
                        padding: componentData.padding || '20px',
                        background: componentData.background || '#ffffff',
                        borderRadius: componentData.borderRadius || '8px',
                        boxShadow: componentData.boxShadow || '0 2px 8px rgba(0,0,0,0.1)',
                        ...baseStyles,
                    }}
                >
                    {componentData.title && (
                        <h3
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.titleFontSize || '1.2rem',
                                margin: componentData.titleMargin || '0',
                                color: componentData.titleColor || '#1f2937',
                            }}
                        >
                            {componentData.title}
                        </h3>
                    )}
                    {componentData.content && (
                        <p
                            style={{
                                ...getCleanTextStyles(baseStyles),
                                fontSize: componentData.contentFontSize || '1rem',
                                margin: componentData.contentMargin || '10px 0 0',
                                color: componentData.contentColor || '#4b5563',
                            }}
                        >
                            {componentData.content}
                        </p>
                    )}
                </div>
            );
        }

        case 'grid': {
            return (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: componentData.columns ? `repeat(${componentData.columns}, 1fr)` : 'repeat(2, 1fr)',
                        gap: componentData.gap || '20px',
                        ...baseStyles,
                    }}
                >
                    {Array.isArray(componentData.items) &&
                        componentData.items.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    background: componentData.itemBackground || '#ffffff',
                                    borderRadius: componentData.itemBorderRadius || '8px',
                                    padding: componentData.itemPadding || '10px',
                                }}
                            >
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.title || 'Product'}
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                )}
                                {item.title && (
                                    <h4
                                        style={{
                                            ...getCleanTextStyles(baseStyles),
                                            fontSize: componentData.titleFontSize || '1rem',
                                            margin: componentData.titleMargin || '10px 0 0',
                                            color: componentData.titleColor || '#1f2937',
                                        }}
                                    >
                                        {item.title}
                                    </h4>
                                )}
                                {item.price && (
                                    <p
                                        style={{
                                            ...getCleanTextStyles(baseStyles),
                                            fontSize: componentData.priceFontSize || '0.9rem',
                                            margin: componentData.priceMargin || '5px 0 0',
                                            color: componentData.priceColor || '#4b5563',
                                        }}
                                    >
                                        {item.price}
                                    </p>
                                )}
                            </div>
                        ))}
                </div>
            );
        }

        case 'list': {
            return (
                <ul
                    style={{
                        listStyleType: componentData.listStyleType || 'none',
                        padding: componentData.padding || '0',
                        ...baseStyles,
                    }}
                >
                    {Array.isArray(componentData.items) &&
                        componentData.items.map((item, index) => (
                            <li
                                key={index}
                                style={{
                                    ...getCleanTextStyles(baseStyles),
                                    fontSize: componentData.itemFontSize || '1rem',
                                    margin: componentData.itemMargin || '5px 0',
                                    color: componentData.itemColor || '#1f2937',
                                }}
                            >
                                {item.title || item}
                            </li>
                        ))}
                </ul>
            );
        }

        case 'gallery': {
            const { images = [], animation = {} } = componentData;
            const galleryClass = `gallery-${parentId || 'root'}-${childId || Date.now()}`;
            const animationCSS = getGalleryAnimationCSS(animation, galleryClass);

            const handleImageClick = (e, imageUrl, index) => {
                e.stopPropagation();
                if (isCanvas) {
                    if (typeof onSelectChild === 'function' && parentId && childId) {
                        onSelectChild(parentId, childId);
                    }
                    toast.info(`Mô phỏng: Mở lightbox cho ảnh ${index + 1}`, {
                        position: 'bottom-right',
                        autoClose: 2000,
                    });
                } else {
                    console.log(`Open image: ${imageUrl}`);
                }
            };

            return (
                <>
                    {animationCSS && <style>{animationCSS}</style>}
                    <div
                        className={`lpb-gallery ${galleryClass}`}
                        style={{
                            ...baseStyles,
                            cursor: componentData.events?.onClick ? 'pointer' : 'default',
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isCanvas && typeof onSelectChild === 'function' && parentId && childId) {
                                onSelectChild(parentId, childId);
                            }
                        }}
                    >
                        <div
                            style={{
                                display: baseStyles.display || 'grid',
                                gridTemplateColumns: baseStyles.gridTemplateColumns || 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: baseStyles.gap || '10px',
                                width: '100%',
                            }}
                        >
                            {images.map((imageUrl, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: baseStyles.borderRadius || '8px',
                                        aspectRatio: '1 / 1',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease',
                                    }}
                                    onClick={(e) => handleImageClick(e, imageUrl, index)}
                                    onMouseEnter={(e) => {
                                        if (componentData.events?.onHover?.type === 'zoomIn') {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (componentData.events?.onHover?.type === 'zoomIn') {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    <img
                                        src={imageUrl || 'https://via.placeholder.com/150'}
                                        alt={`Gallery ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                        {children.map((child, index) =>
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
                    </div>
                </>
            );
        }

        case 'input': {
            const inputType = componentData.inputType || 'text';
            const label = componentData.label;
            const placeholder = componentData.placeholder || '';
            const required = componentData.required || false;

            return (
                <div style={{ ...baseStyles, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {label}
                            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    <input
                        type={inputType}
                        placeholder={placeholder}
                        required={required}
                        disabled={isCanvas}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            ...baseStyles,
                        }}
                    />
                </div>
            );
        }

        case 'textarea': {
            const label = componentData.label;
            const placeholder = componentData.placeholder || '';
            const rows = componentData.rows || 4;
            const required = componentData.required || false;

            return (
                <div style={{ ...baseStyles, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {label}
                            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    <textarea
                        placeholder={placeholder}
                        rows={rows}
                        required={required}
                        disabled={isCanvas}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            transition: 'all 0.3s ease',
                            ...baseStyles,
                        }}
                    />
                </div>
            );
        }

        case 'select': {
            const label = componentData.label;
            const options = componentData.options || [];
            const required = componentData.required || false;

            return (
                <div style={{ ...baseStyles, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {label}
                            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    <select
                        required={required}
                        disabled={isCanvas}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '16px',
                            outline: 'none',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            ...baseStyles,
                        }}
                    >
                        {options.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        case 'checkbox': {
            const label = componentData.label;
            const checked = componentData.checked || false;
            const name = componentData.name || '';
            const required = componentData.required || false;

            return (
                <div style={{ ...baseStyles, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        name={name}
                        defaultChecked={checked}
                        required={required}
                        disabled={isCanvas}
                        style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                        }}
                    />
                    <label style={{ fontSize: '16px', color: '#374151', cursor: 'pointer' }}>
                        {label}
                        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </label>
                </div>
            );
        }

        case 'radio': {
            const label = componentData.label;
            const name = componentData.name || 'radio-group';
            const options = componentData.options || [];
            const required = componentData.required || false;

            return (
                <div style={{ ...baseStyles, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {label && (
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {label}
                            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        </label>
                    )}
                    {options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={name}
                                value={option.value}
                                required={required && index === 0}
                                disabled={isCanvas}
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

        case 'accordion': {
            const [expandedItems, setExpandedItems] = React.useState(
                componentData.items?.reduce((acc, item) => {
                    acc[item.id] = item.expanded || false;
                    return acc;
                }, {}) || {}
            );

            const toggleItem = (itemId) => {
                if (isCanvas) return;

                setExpandedItems(prev => {
                    if (componentData.allowMultiple) {
                        return { ...prev, [itemId]: !prev[itemId] };
                    } else {
                        const newState = {};
                        Object.keys(prev).forEach(key => {
                            newState[key] = key === itemId ? !prev[itemId] : false;
                        });
                        return newState;
                    }
                });
            };

            return (
                <div style={{ ...baseStyles }}>
                    {componentData.title && (
                        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                            {componentData.title}
                        </h3>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(componentData.items || []).map((item, index) => (
                            <div
                                key={item.id || index}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    disabled={isCanvas}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: expandedItems[item.id] ? '#f3f4f6' : '#fff',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: isCanvas ? 'default' : 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        color: '#1f2937',
                                        transition: 'background-color 0.2s ease',
                                    }}
                                >
                                    <span>{item.title}</span>
                                    <span style={{
                                        transition: 'transform 0.2s ease',
                                        transform: expandedItems[item.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}>
                                        ▼
                                    </span>
                                </button>
                                {expandedItems[item.id] && (
                                    <div
                                        style={{
                                            padding: '16px',
                                            backgroundColor: '#fff',
                                            borderTop: '1px solid #e5e7eb',
                                            fontSize: '14px',
                                            color: '#6b7280',
                                            lineHeight: '1.6',
                                        }}
                                    >
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        case 'tabs': {
            const [activeTab, setActiveTab] = React.useState(componentData.activeTab || componentData.tabs?.[0]?.id);

            const handleTabChange = (tabId) => {
                if (isCanvas) return;
                setActiveTab(tabId);
            };

            const activeTabContent = (componentData.tabs || []).find(tab => tab.id === activeTab);

            return (
                <div style={{ ...baseStyles }}>
                    {componentData.title && (
                        <h3 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                            {componentData.title}
                        </h3>
                    )}
                    <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '16px' }}>
                        {(componentData.tabs || []).map((tab, index) => (
                            <button
                                key={tab.id || index}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                disabled={isCanvas}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                    cursor: isCanvas ? 'default' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '-2px',
                                }}
                            >
                                {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
                                {tab.title}
                            </button>
                        ))}
                    </div>
                    <div
                        style={{
                            padding: '16px',
                            fontSize: '15px',
                            color: '#374151',
                            lineHeight: '1.6',
                        }}
                    >
                        {activeTabContent?.content || 'No content available'}
                    </div>
                </div>
            );
        }

        default: {
            return (
                <div
                    style={{
                        color: componentData.errorColor || '#ff0000',
                        padding: '10px',
                        border: '1px dashed #ff0000',
                        borderRadius: '4px',
                        ...baseStyles,
                    }}
                >
                    Unknown Component: {type}
                </div>
            );
        }
    }
};

// PropTypes for type checking
renderComponentContent.propTypes = {
    type: PropTypes.string.isRequired,
    componentData: PropTypes.object,
    styles: PropTypes.object,
    children: PropTypes.array,
    isCanvas: PropTypes.bool,
    onSelectChild: PropTypes.func,
    parentId: PropTypes.string,
    childId: PropTypes.string,
    isTemplateMode: PropTypes.bool,
    viewMode: PropTypes.string,
};

getCanvasPosition.propTypes = {
    mouseX: PropTypes.number.isRequired,
    mouseY: PropTypes.number.isRequired,
    containerElement: PropTypes.instanceOf(Element),
    zoomLevel: PropTypes.number.isRequired,
};

snapToGrid.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    gridSize: PropTypes.number.isRequired,
    snapPoints: PropTypes.arrayOf(
        PropTypes.shape({
            x: PropTypes.number,
            y: PropTypes.number,
        })
    ),
};

getElementBounds.propTypes = {
    element: PropTypes.shape({
        position: PropTypes.shape({
            desktop: PropTypes.shape({
                x: PropTypes.number,
                y: PropTypes.number,
            }),
        }),
        size: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number,
        }),
    }).isRequired,
};

processStyles.propTypes = {
    styles: PropTypes.object.isRequired,
    className: PropTypes.string.isRequired,
};