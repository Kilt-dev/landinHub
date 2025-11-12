/**
 * Modern Layout Engine for Landing Page Builder
 * Inspired by Figma's Auto Layout and CSS Flexbox/Grid
 */

/**
 * Layout Modes
 */
export const LayoutMode = {
    ABSOLUTE: 'absolute',      // Free positioning (like Figma Frame)
    FLEX_VERTICAL: 'flex-v',   // Stack vertically (Auto Layout)
    FLEX_HORIZONTAL: 'flex-h', // Stack horizontally (Auto Layout)
    GRID: 'grid',              // CSS Grid layout
    FLOW: 'flow',              // Normal document flow
};

/**
 * Alignment Options
 */
export const AlignmentOptions = {
    START: 'flex-start',
    CENTER: 'center',
    END: 'flex-end',
    STRETCH: 'stretch',
    SPACE_BETWEEN: 'space-between',
    SPACE_AROUND: 'space-around',
    SPACE_EVENLY: 'space-evenly',
};

/**
 * Calculate element bounds with constraints
 */
export const calculateBounds = (element, parentBounds, viewMode = 'desktop') => {
    const position = element.position?.[viewMode] || element.position?.desktop || { x: 0, y: 0, z: 1 };
    const size = element.size || { width: 200, height: 50 };

    // Get responsive size if available
    const responsiveSize = viewMode === 'mobile'
        ? element.mobileSize || size
        : viewMode === 'tablet'
        ? element.tabletSize || size
        : size;

    return {
        x: position.x,
        y: position.y,
        z: position.z || 1,
        width: responsiveSize.width,
        height: responsiveSize.height,
        right: position.x + responsiveSize.width,
        bottom: position.y + responsiveSize.height,
        centerX: position.x + responsiveSize.width / 2,
        centerY: position.y + responsiveSize.height / 2,
    };
};

/**
 * Auto Layout Engine - Calculate positions for children
 */
export const applyAutoLayout = (container, children, config = {}) => {
    const {
        mode = LayoutMode.FLEX_VERTICAL,
        gap = 16,
        padding = 20,
        alignment = AlignmentOptions.START,
        wrap = false,
    } = config;

    const positioned = [];
    let currentX = padding;
    let currentY = padding;
    let maxWidth = 0;
    let maxHeight = 0;
    let rowHeight = 0;

    children.forEach((child, index) => {
        const childBounds = calculateBounds(child, container);

        if (mode === LayoutMode.FLEX_VERTICAL) {
            // Vertical stacking
            positioned.push({
                ...child,
                position: {
                    ...child.position,
                    [config.viewMode || 'desktop']: {
                        x: currentX,
                        y: currentY,
                        z: child.position?.z || index + 1,
                    },
                },
            });
            currentY += childBounds.height + gap;
            maxWidth = Math.max(maxWidth, childBounds.width);
        } else if (mode === LayoutMode.FLEX_HORIZONTAL) {
            // Horizontal stacking with wrap
            if (wrap && currentX + childBounds.width > container.size.width - padding) {
                currentX = padding;
                currentY += rowHeight + gap;
                rowHeight = 0;
            }

            positioned.push({
                ...child,
                position: {
                    ...child.position,
                    [config.viewMode || 'desktop']: {
                        x: currentX,
                        y: currentY,
                        z: child.position?.z || index + 1,
                    },
                },
            });
            currentX += childBounds.width + gap;
            rowHeight = Math.max(rowHeight, childBounds.height);
            maxHeight = Math.max(maxHeight, currentY + rowHeight);
        } else if (mode === LayoutMode.GRID) {
            // Grid layout
            const columns = config.columns || 3;
            const col = index % columns;
            const row = Math.floor(index / columns);

            positioned.push({
                ...child,
                position: {
                    ...child.position,
                    [config.viewMode || 'desktop']: {
                        x: padding + col * (childBounds.width + gap),
                        y: padding + row * (childBounds.height + gap),
                        z: child.position?.z || index + 1,
                    },
                },
            });
        }
    });

    return positioned;
};

/**
 * Snap to Grid
 */
export const snapToGrid = (value, gridSize = 8) => {
    return Math.round(value / gridSize) * gridSize;
};

/**
 * Snap to Guides - Advanced snapping with visual feedback
 */
export const snapToGuides = (element, allElements, snapThreshold = 5) => {
    const elementBounds = calculateBounds(element);
    const guides = [];
    const snapped = { ...element };

    allElements.forEach(other => {
        if (other.id === element.id) return;

        const otherBounds = calculateBounds(other);

        // Horizontal guides
        const horizontalChecks = [
            { value: otherBounds.y, type: 'top', otherY: otherBounds.y },
            { value: otherBounds.bottom, type: 'bottom', otherY: otherBounds.bottom },
            { value: otherBounds.centerY, type: 'centerY', otherY: otherBounds.centerY },
        ];

        horizontalChecks.forEach(check => {
            if (Math.abs(elementBounds.y - check.value) < snapThreshold) {
                snapped.position = {
                    ...snapped.position,
                    desktop: { ...snapped.position.desktop, y: check.value },
                };
                guides.push({
                    type: 'horizontal',
                    y: check.value,
                    x1: Math.min(elementBounds.x, otherBounds.x),
                    x2: Math.max(elementBounds.right, otherBounds.right),
                });
            }
        });

        // Vertical guides
        const verticalChecks = [
            { value: otherBounds.x, type: 'left', otherX: otherBounds.x },
            { value: otherBounds.right, type: 'right', otherX: otherBounds.right },
            { value: otherBounds.centerX, type: 'centerX', otherX: otherBounds.centerX },
        ];

        verticalChecks.forEach(check => {
            if (Math.abs(elementBounds.x - check.value) < snapThreshold) {
                snapped.position = {
                    ...snapped.position,
                    desktop: { ...snapped.position.desktop, x: check.value },
                };
                guides.push({
                    type: 'vertical',
                    x: check.value,
                    y1: Math.min(elementBounds.y, otherBounds.y),
                    y2: Math.max(elementBounds.bottom, otherBounds.bottom),
                });
            }
        });
    });

    return { element: snapped, guides };
};

/**
 * Distribute elements evenly
 */
export const distributeElements = (elements, direction = 'horizontal') => {
    if (elements.length < 3) return elements;

    const sorted = [...elements].sort((a, b) => {
        const boundsA = calculateBounds(a);
        const boundsB = calculateBounds(b);
        return direction === 'horizontal'
            ? boundsA.x - boundsB.x
            : boundsA.y - boundsB.y;
    });

    const first = calculateBounds(sorted[0]);
    const last = calculateBounds(sorted[sorted.length - 1]);
    const totalSpace = direction === 'horizontal'
        ? last.x - first.right
        : last.y - first.bottom;

    const gap = totalSpace / (sorted.length - 1);
    let currentPos = direction === 'horizontal' ? first.right : first.bottom;

    return sorted.map((el, i) => {
        if (i === 0 || i === sorted.length - 1) return el;

        const bounds = calculateBounds(el);
        currentPos += gap;

        return {
            ...el,
            position: {
                ...el.position,
                desktop: {
                    ...el.position.desktop,
                    [direction === 'horizontal' ? 'x' : 'y']: currentPos,
                },
            },
        };
    });
};

/**
 * Align elements
 */
export const alignElements = (elements, alignment = 'left') => {
    if (elements.length < 2) return elements;

    const bounds = elements.map(el => calculateBounds(el));

    let targetValue;
    switch (alignment) {
        case 'left':
            targetValue = Math.min(...bounds.map(b => b.x));
            break;
        case 'right':
            targetValue = Math.max(...bounds.map(b => b.right));
            break;
        case 'top':
            targetValue = Math.min(...bounds.map(b => b.y));
            break;
        case 'bottom':
            targetValue = Math.max(...bounds.map(b => b.bottom));
            break;
        case 'centerH':
            targetValue = (Math.min(...bounds.map(b => b.x)) + Math.max(...bounds.map(b => b.right))) / 2;
            break;
        case 'centerV':
            targetValue = (Math.min(...bounds.map(b => b.y)) + Math.max(...bounds.map(b => b.bottom))) / 2;
            break;
        default:
            return elements;
    }

    return elements.map((el, i) => {
        const bound = bounds[i];
        let newPos = { ...el.position.desktop };

        switch (alignment) {
            case 'left':
                newPos.x = targetValue;
                break;
            case 'right':
                newPos.x = targetValue - bound.width;
                break;
            case 'top':
                newPos.y = targetValue;
                break;
            case 'bottom':
                newPos.y = targetValue - bound.height;
                break;
            case 'centerH':
                newPos.x = targetValue - bound.width / 2;
                break;
            case 'centerV':
                newPos.y = targetValue - bound.height / 2;
                break;
        }

        return {
            ...el,
            position: {
                ...el.position,
                desktop: newPos,
            },
        };
    });
};

/**
 * Resize element proportionally
 */
export const resizeProportional = (element, newWidth, newHeight, maintainAspect = true) => {
    const currentSize = element.size || { width: 200, height: 50 };
    const aspectRatio = currentSize.width / currentSize.height;

    if (maintainAspect) {
        if (newWidth) {
            newHeight = newWidth / aspectRatio;
        } else if (newHeight) {
            newWidth = newHeight * aspectRatio;
        }
    }

    return {
        ...element,
        size: {
            width: Math.round(newWidth || currentSize.width),
            height: Math.round(newHeight || currentSize.height),
        },
    };
};

/**
 * Calculate spacing between elements
 */
export const calculateSpacing = (element1, element2) => {
    const bounds1 = calculateBounds(element1);
    const bounds2 = calculateBounds(element2);

    return {
        horizontal: Math.abs(bounds2.x - bounds1.right),
        vertical: Math.abs(bounds2.y - bounds1.bottom),
    };
};

/**
 * Group elements into a container
 */
export const groupElements = (elements) => {
    if (elements.length === 0) return null;

    const bounds = elements.map(el => calculateBounds(el));
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxRight = Math.max(...bounds.map(b => b.right));
    const maxBottom = Math.max(...bounds.map(b => b.bottom));

    const group = {
        id: `group-${Date.now()}`,
        type: 'container',
        layoutMode: LayoutMode.ABSOLUTE,
        position: {
            desktop: { x: minX, y: minY, z: 1 },
        },
        size: {
            width: maxRight - minX,
            height: maxBottom - minY,
        },
        children: elements.map(el => ({
            ...el,
            position: {
                desktop: {
                    x: calculateBounds(el).x - minX,
                    y: calculateBounds(el).y - minY,
                    z: el.position?.desktop?.z || 1,
                },
            },
        })),
        styles: {
            background: 'transparent',
        },
    };

    return group;
};

export default {
    LayoutMode,
    AlignmentOptions,
    calculateBounds,
    applyAutoLayout,
    snapToGrid,
    snapToGuides,
    distributeElements,
    alignElements,
    resizeProportional,
    calculateSpacing,
    groupElements,
};
