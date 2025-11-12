/**
 * Smooth transition utilities for UI animations
 * Provides consistent, performant animations across the app
 */

/**
 * Easing functions for smooth animations
 */
export const EASINGS = {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
};

/**
 * Standard transition durations (in ms)
 */
export const DURATIONS = {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800
};

/**
 * Create transition CSS string
 */
export const createTransition = (properties, duration = DURATIONS.normal, easing = EASINGS.easeInOut) => {
    if (Array.isArray(properties)) {
        return properties
            .map(prop => `${prop} ${duration}ms ${easing}`)
            .join(', ');
    }
    return `${properties} ${duration}ms ${easing}`;
};

/**
 * Pre-defined transition styles
 */
export const TRANSITION_STYLES = {
    // Transform transitions
    transform: createTransition('transform', DURATIONS.normal, EASINGS.smooth),
    scale: createTransition('transform', DURATIONS.fast, EASINGS.bounce),

    // Layout transitions
    size: createTransition(['width', 'height'], DURATIONS.normal, EASINGS.easeOut),
    position: createTransition(['top', 'left', 'right', 'bottom'], DURATIONS.normal, EASINGS.easeOut),

    // Opacity transitions
    fade: createTransition('opacity', DURATIONS.normal, EASINGS.easeInOut),
    fadeFast: createTransition('opacity', DURATIONS.fast, EASINGS.easeInOut),

    // Color transitions
    color: createTransition(['color', 'background-color', 'border-color'], DURATIONS.normal, EASINGS.easeInOut),

    // All properties (use sparingly - can be performance heavy)
    all: createTransition('all', DURATIONS.normal, EASINGS.easeInOut),

    // No transition
    none: 'none'
};

/**
 * Responsive mode switch animation
 */
export const responsiveModeTransition = {
    enter: {
        transition: createTransition(['transform', 'opacity', 'width'], DURATIONS.normal, EASINGS.smooth),
        from: {
            opacity: 0.8,
            transform: 'scale(0.95)'
        },
        to: {
            opacity: 1,
            transform: 'scale(1)'
        }
    }
};

/**
 * Canvas zoom transition
 */
export const canvasZoomTransition = createTransition('transform', DURATIONS.fast, EASINGS.easeOut);

/**
 * Element drag transition
 */
export const elementDragTransition = {
    dragging: {
        transition: TRANSITION_STYLES.none, // No transition while dragging
        opacity: 0.7,
        cursor: 'grabbing'
    },
    dropped: {
        transition: createTransition(['transform', 'opacity'], DURATIONS.fast, EASINGS.bounce),
        opacity: 1,
        cursor: 'grab'
    }
};

/**
 * Panel collapse/expand transition
 */
export const panelTransition = {
    width: createTransition('width', DURATIONS.normal, EASINGS.easeInOut),
    transform: createTransition('transform', DURATIONS.normal, EASINGS.easeInOut),
    opacity: createTransition('opacity', DURATIONS.normal, EASINGS.easeInOut)
};

/**
 * Modal/Popup animation
 */
export const modalTransition = {
    overlay: {
        enter: {
            transition: createTransition('opacity', DURATIONS.normal, EASINGS.easeIn),
            from: { opacity: 0 },
            to: { opacity: 1 }
        },
        exit: {
            transition: createTransition('opacity', DURATIONS.fast, EASINGS.easeOut),
            from: { opacity: 1 },
            to: { opacity: 0 }
        }
    },
    content: {
        enter: {
            transition: createTransition(['transform', 'opacity'], DURATIONS.normal, EASINGS.bounce),
            from: {
                opacity: 0,
                transform: 'scale(0.9) translateY(-20px)'
            },
            to: {
                opacity: 1,
                transform: 'scale(1) translateY(0)'
            }
        },
        exit: {
            transition: createTransition(['transform', 'opacity'], DURATIONS.fast, EASINGS.easeOut),
            from: {
                opacity: 1,
                transform: 'scale(1) translateY(0)'
            },
            to: {
                opacity: 0,
                transform: 'scale(0.95) translateY(10px)'
            }
        }
    }
};

/**
 * Toast notification animation
 */
export const toastTransition = {
    enter: {
        transition: createTransition(['transform', 'opacity'], DURATIONS.normal, EASINGS.easeOut),
        from: {
            opacity: 0,
            transform: 'translateX(100%)'
        },
        to: {
            opacity: 1,
            transform: 'translateX(0)'
        }
    },
    exit: {
        transition: createTransition(['transform', 'opacity'], DURATIONS.fast, EASINGS.easeIn),
        from: {
            opacity: 1,
            transform: 'translateX(0)'
        },
        to: {
            opacity: 0,
            transform: 'translateX(100%)'
        }
    }
};

/**
 * Helper to apply transition with cleanup
 */
export const applyTransition = (element, transitionStyle, callback) => {
    if (!element) return;

    element.style.transition = transitionStyle;

    if (callback) {
        const handleTransitionEnd = () => {
            element.removeEventListener('transitionend', handleTransitionEnd);
            callback();
        };
        element.addEventListener('transitionend', handleTransitionEnd);
    }
};

/**
 * Animate element with promise
 */
export const animateElement = (element, from, to, duration = DURATIONS.normal, easing = EASINGS.easeInOut) => {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }

        // Apply from styles
        Object.assign(element.style, from);

        // Force reflow
        element.offsetHeight;

        // Add transition
        const properties = Object.keys(to);
        element.style.transition = createTransition(properties, duration, easing);

        // Apply to styles
        Object.assign(element.style, to);

        // Wait for transition end
        const handleEnd = () => {
            element.removeEventListener('transitionend', handleEnd);
            resolve();
        };

        element.addEventListener('transitionend', handleEnd);

        // Fallback timeout
        setTimeout(() => {
            element.removeEventListener('transitionend', handleEnd);
            resolve();
        }, duration + 50);
    });
};

/**
 * Stagger animation for multiple elements
 */
export const staggerAnimation = async (elements, animation, staggerDelay = 50) => {
    for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, staggerDelay));
        }
        animation(elements[i], i);
    }
};
