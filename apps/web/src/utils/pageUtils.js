// ==================== EVENT RUNTIME GENERATOR ====================

/**
 * Generate runtime script để xử lý events trong HTML tĩnh
 * @param {Array} events - Danh sách events từ pageData
 * @param {Array} popups - Danh sách popup elements
 * @returns {string} - JavaScript code
 */
const generateEventRuntime = (events, popups) => {
    return `
    // Landing Page Builder Runtime v1.0
    (function() {
        'use strict';
        
        window.LPB = window.LPB || {};
        
        // ========== POPUP MANAGER ==========
        LPB.popups = {
            active: new Set(),
            
            open: function(popupId, data) {
                const popup = document.getElementById(popupId);
                if (!popup) {
                    console.error('[LPB] Popup not found:', popupId);
                    return;
                }
                
                // Update content nếu có data
                if (data && data.html) {
                    const content = popup.querySelector('.lpb-popup-body');
                    if (content) content.innerHTML = data.html;
                }
                
                // Show popup
                popup.classList.add('lpb-popup-active');
                document.body.style.overflow = 'hidden';
                this.active.add(popupId);
                
                // Analytics tracking
                if (window.gtag) {
                    gtag('event', 'popup_open', {
                        event_category: 'Engagement',
                        event_label: popupId
                    });
                }
            },
            
            close: function(popupId) {
                const popup = document.getElementById(popupId);
                if (popup) {
                    popup.classList.remove('lpb-popup-active');
                    this.active.delete(popupId);
                    
                    // Restore scroll nếu không còn popup nào
                    if (this.active.size === 0) {
                        document.body.style.overflow = '';
                    }
                }
            },
            
            closeAll: function() {
                this.active.forEach(id => this.close(id));
            }
        };
        
        // ========== API MANAGER ==========
        LPB.api = {
            cache: new Map(),
            
            getCacheKey: function(endpoint, params) {
                return endpoint + JSON.stringify(params || {});
            },
            
            fetch: async function(endpoint, options = {}) {
                const cacheKey = this.getCacheKey(endpoint, options.params);
                
                // Check cache
                if (this.cache.has(cacheKey)) {
                    const cached = this.cache.get(cacheKey);
                    const now = Date.now();
                    const TTL = options.ttl || 5 * 60 * 1000; // 5 phút default
                    
                    if (now - cached.timestamp < TTL) {
                        console.log('[LPB] Cache hit:', endpoint);
                        return cached.data;
                    }
                }
                
                // Fetch mới
                try {
                    console.log('[LPB] Fetching:', endpoint);
                    const response = await fetch(endpoint, {
                        method: options.method || 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        },
                        body: options.data ? JSON.stringify(options.data) : undefined
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                    }
                    
                    const data = await response.json();
                    
                    // Cache result
                    this.cache.set(cacheKey, {
                        data: data,
                        timestamp: Date.now()
                    });
                    
                    return data;
                } catch (error) {
                    console.error('[LPB] API Error:', error);
                    throw error;
                }
            },
            
            clearCache: function(endpoint) {
                if (endpoint) {
                    for (let key of this.cache.keys()) {
                        if (key.startsWith(endpoint)) {
                            this.cache.delete(key);
                        }
                    }
                } else {
                    this.cache.clear();
                }
            }
        };
        
        // ========== EVENT HANDLER ==========
        LPB.handleEvent = async function(config) {
            const { type } = config;
            
            try {
                switch(type) {
                    case 'openPopup':
                        if (!config.popupId) {
                            console.error('[LPB] Missing popupId');
                            return;
                        }
                        this.popups.open(config.popupId, config.data);
                        break;
                        
                    case 'closePopup':
                        const targetPopupId = config.popupId || config.elementId;
                        if (!targetPopupId) {
                            console.error('[LPB] Missing popupId');
                            return;
                        }
                        this.popups.close(targetPopupId);
                        break;
                        
                    case 'triggerApi':
                        if (!config.apiUrl) {
                            console.error('[LPB] Missing apiUrl');
                            return;
                        }
                        const data = await this.api.fetch(config.apiUrl, {
                            method: config.method || 'GET',
                            params: config.params,
                            data: config.data
                        });
                        
                        // Update target nếu có
                        if (config.updateTarget) {
                            const target = document.getElementById(config.updateTarget);
                            if (target && data.html) {
                                target.innerHTML = data.html;
                            }
                        }
                        break;
                        
                    case 'both':
                        // Open popup immediately với loading
                        this.popups.open(config.popupId, { 
                            html: '<div style="text-align:center;padding:40px;"><div class="lpb-spinner"></div><p>Đang tải...</p></div>' 
                        });
                        
                        // Fetch API in background
                        const apiData = await this.api.fetch(config.apiUrl, {
                            method: config.method || 'GET',
                            params: config.params
                        });
                        
                        // Update popup content
                        this.popups.open(config.popupId, { html: apiData.html || JSON.stringify(apiData) });
                        break;
                        
                    case 'navigate':
                        if (!config.url) {
                            console.error('[LPB] Missing url');
                            return;
                        }
                        if (config.newTab) {
                            window.open(config.url, '_blank');
                        } else {
                            window.location.href = config.url;
                        }
                        break;
                        
                    case 'scrollToSection':
                        if (!config.sectionId) {
                            console.error('[LPB] Missing sectionId');
                            return;
                        }
                        const section = document.querySelector(\`[data-element-id="\${config.sectionId}"]\`);
                        if (section) {
                            section.scrollIntoView({ 
                                behavior: config.smooth !== false ? 'smooth' : 'auto',
                                block: 'start'
                            });
                        } else {
                            console.error('[LPB] Section not found:', config.sectionId);
                        }
                        break;
                        
                    case 'submitForm':
                        if (!config.apiUrl) {
                            console.error('[LPB] Missing apiUrl');
                            return;
                        }
                        console.log('[LPB] Form submit to:', config.apiUrl);
                        break;
                        
                    default:
                        console.warn('[LPB] Unknown event type:', type);
                }
            } catch (error) {
                console.error('[LPB] Event handling error:', error);
                alert('Có lỗi xảy ra: ' + error.message);
            }
        };
        
        // ========== AUTO-BIND EVENTS ==========
        const eventsConfig = ${JSON.stringify(events)};
        
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[LPB] Initializing events...', eventsConfig.length);
            
            eventsConfig.forEach(config => {
                const element = document.getElementById(config.elementId);
                if (!element) {
                    console.warn('[LPB] Element not found:', config.elementId);
                    return;
                }
                
                // Bind onClick
                if (config.events.onClick && config.events.onClick.type !== 'none') {
                    element.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        LPB.handleEvent(config.events.onClick);
                    });
                    
                    element.style.cursor = 'pointer';
                }
                
                // Bind hover prefetch
                if (config.events.onClick?.params?.apiConfig?.preload) {
                    element.addEventListener('mouseenter', function() {
                        LPB.api.fetch(
                            config.events.onClick.params.apiConfig.endpoint,
                            config.events.onClick.params.apiConfig
                        ).catch(() => {}); // Silent prefetch
                    }, { once: true });
                }
                
                // Bind onHover effects
                if (config.events.onHover) {
                    const hoverClass = config.events.onHover.className;
                    if (hoverClass) {
                        element.addEventListener('mouseenter', function() {
                            this.classList.add(hoverClass);
                        });
                        element.addEventListener('mouseleave', function() {
                            this.classList.remove(hoverClass);
                        });
                    }
                }
            });
            
            console.log('[LPB] Events initialized!');
        });
        
        // ========== ESC TO CLOSE POPUP ==========
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                LPB.popups.closeAll();
            }
        });
        
        console.log('[LPB] Runtime loaded');
    })();
    `;
};

/**
 * Extract tất cả events từ pageData elements
 * @param {Object} pageData - Page data object
 * @returns {Array} - Array of event configs
 */
const extractEvents = (pageData) => {
    const events = [];

    const processElement = (element, parentId = null) => {
        const elementId = element.id;

        // Check element events
        if (element.componentData?.events) {
            events.push({
                elementId: elementId,
                events: element.componentData.events,
                type: element.type,
                parentId: parentId
            });
        }

        // Check children events
        if (Array.isArray(element.children)) {
            element.children.forEach(child => {
                if (child.componentData?.events) {
                    events.push({
                        elementId: child.id,
                        events: child.componentData.events,
                        type: child.type,
                        parentId: elementId
                    });
                }

                // Recursive cho nested children
                if (Array.isArray(child.children)) {
                    processElement(child, child.id);
                }
            });
        }
    };

    pageData.elements.forEach(element => {
        processElement(element);
    });

    return events;
};

/**
 * Render tất cả popups thành HTML
 * @param {Array} popups - Array of popup elements
 * @returns {string} - HTML string
 */
const renderPopupsHTML = (popups) => {
    return popups.map(popup => {
        const { id, componentData = {}, styles = {}, size = {}, children = [] } = popup;

        // Render children content
        const childrenHTML = children.map(child =>
            renderElementHTML(child, true)
        ).join('');

        return `
            <div 
                id="${id}" 
                class="lpb-popup" 
                data-element-id="${id}"
                style="display:none;"
            >
                <!-- Overlay -->
                <div 
                    class="lpb-popup-overlay" 
                    onclick="LPB.popups.close('${id}')"
                ></div>
                
                <!-- Popup Container -->
                <div 
                    class="lpb-popup-container"
                    style="
                        width: ${size.width || 600}px;
                        max-width: 90vw;
                        min-height: ${size.height || 400}px;
                        background: ${styles.background || componentData.background || 'rgba(255, 255, 255, 0.95)'};
                        border-radius: ${styles.borderRadius || componentData.borderRadius || '12px'};
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
                    "
                >
                    <!-- Header -->
                    <div class="lpb-popup-header">
                        <h3 style="margin:0; font-size:16px; font-weight:600; color:#111827;">
                            ${componentData.title || 'Popup Title'}
                        </h3>
                        <button 
                            class="lpb-popup-close" 
                            onclick="LPB.popups.close('${id}')"
                            aria-label="Close popup"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <!-- Body -->
                    <div class="lpb-popup-body" style="padding: ${componentData.padding || '20px'};">
                        ${childrenHTML || `<p style="color:#6b7280;">${componentData.content || 'Popup content'}</p>`}
                    </div>
                </div>
            </div>
        `;
    }).join('\n');
};

/**
 * Render một element thành HTML với proper ID
 * @param {Object} element - Element object
 * @param {boolean} isChild - Whether this is a child element
 * @returns {string} - HTML string
 */
const renderElementHTML = (element, isChild = false) => {
    const { id, type, componentData = {}, styles = {}, size = {}, position = {}, children = [] } = element;

    // Convert styles object to inline CSS
    const inlineStyles = Object.entries(styles)
        .filter(([key]) => !key.startsWith(':') && !key.startsWith('@'))
        .map(([key, value]) => {
            const kebabKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            return `${kebabKey}:${value}`;
        })
        .join(';');

    // Base attributes
    const baseAttrs = `
        id="${id}"
        data-element-id="${id}"
        data-type="${type}"
        class="lpb-element lpb-${type}"
    `;

    // Position styles cho child elements
    const positionStyles = isChild ? `
        position: absolute;
        left: ${position.desktop?.x || 0}px;
        top: ${position.desktop?.y || 0}px;
        width: ${size.width || 200}px;
        height: ${size.height || 50}px;
    ` : '';

    // Render based on type
    switch(type) {
        case 'section':
            return renderSectionHTML(element);

        case 'button':
            return `
                <button 
                    ${baseAttrs}
                    style="${inlineStyles}; ${positionStyles}"
                >
                    ${componentData.content || 'Button'}
                </button>
            `;

        case 'heading':
            const HeadingTag = componentData.level || 'h2';
            return `
                <${HeadingTag} 
                    ${baseAttrs}
                    style="${inlineStyles}; ${positionStyles}"
                >
                    ${componentData.content || 'Heading'}
                </${HeadingTag}>
            `;

        case 'paragraph':
            return `
                <p 
                    ${baseAttrs}
                    style="${inlineStyles}; ${positionStyles}"
                >
                    ${componentData.content || 'Paragraph'}
                </p>
            `;

        case 'image':
            return `
                <img 
                    ${baseAttrs}
                    src="${componentData.src || componentData.imageUrl || 'https://via.placeholder.com/150'}"
                    alt="${componentData.alt || 'Image'}"
                    style="${inlineStyles}; ${positionStyles}"
                />
            `;

        case 'icon':
            const isSvg = componentData.icon?.startsWith('<svg');
            return `
                <div 
                    ${baseAttrs}
                    style="${inlineStyles}; ${positionStyles}"
                    title="${componentData.title || ''}"
                >
                    ${componentData.imageUrl
                ? `<img src="${componentData.imageUrl}" alt="${componentData.title || 'Icon'}" style="width:100%;height:100%;object-fit:contain;" />`
                : isSvg
                    ? componentData.icon
                    : componentData.icon
                        ? `<i class="${componentData.icon}"></i>`
                        : '📦'
            }
                </div>
            `;

        case 'gallery':
            return renderGalleryHTML(element, isChild);

        default:
            return `
                <div 
                    ${baseAttrs}
                    style="${inlineStyles}; ${positionStyles}"
                >
                    ${componentData.content || type}
                </div>
            `;
    }
};

/**
 * Render gallery element
 */
const renderGalleryHTML = (element, isChild) => {
    const { id, componentData = {}, styles = {}, size = {}, position = {} } = element;

    const positionStyles = isChild ? `
        position: absolute;
        left: ${position.desktop?.x || 0}px;
        top: ${position.desktop?.y || 0}px;
    ` : '';

    const images = componentData.images || [];

    return `
        <div 
            id="${id}"
            data-element-id="${id}"
            data-type="gallery"
            class="lpb-element lpb-gallery"
            style="${positionStyles} width: ${size.width || 380}px; height: ${size.height || 300}px;"
        >
            <div style="
                display: ${styles.display || 'grid'};
                grid-template-columns: ${styles.gridTemplateColumns || 'repeat(auto-fill, minmax(150px, 1fr))'};
                gap: ${styles.gap || '10px'};
                width: 100%;
                height: 100%;
            ">
                ${images.map((imageUrl, index) => `
                    <div style="
                        position: relative;
                        overflow: hidden;
                        border-radius: ${styles.borderRadius || '8px'};
                        aspect-ratio: 1 / 1;
                    ">
                        <img
                            src="${imageUrl || 'https://via.placeholder.com/150'}"
                            alt="Gallery ${index + 1}"
                            style="
                                width: 100%;
                                height: 100%;
                                object-fit: ${styles.objectFit || 'cover'};
                                object-position: ${styles.objectPosition || 'center'};
                            "
                            loading="lazy"
                        />
                    </div>
                `).join('')}
                ${images.length === 0 ? `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: #9ca3af;
                        text-align: center;
                        grid-column: 1 / -1;
                    ">
                        <i class="fas fa-image" style="font-size: 48px; margin-bottom: 8px;"></i>
                        <p>Empty gallery</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Render section với children
 */
const renderSectionHTML = (section) => {
    const { id, componentData = {}, styles = {}, size = {}, position = {}, children = [] } = section;

    // Render children
    const childrenHTML = children.map(child =>
        renderElementHTML(child, true)
    ).join('\n');

    return `
        <section 
            id="${id}"
            data-element-id="${id}"
            class="lpb-section ladi-section"
            style="
                position: absolute;
                top: ${position.desktop?.y || 0}px;
                left: 50%;
                transform: translateX(-50%);
                width: 1200px;
                height: ${size.height || 400}px;
            "
        >
            <!-- Background -->
            <div class="ladi-section-background" style="
                position: absolute;
                inset: 0;
                z-index: 0;
                background-color: ${componentData.backgroundColor || styles.backgroundColor || 'transparent'};
                background-image: ${componentData.backgroundImage ? `url(${componentData.backgroundImage})` : 'none'};
                background-size: cover;
                background-position: center;
            "></div>
            
            <!-- Overlay -->
            <div class="ladi-overlay" style="
                position: absolute;
                inset: 0;
                z-index: 0;
                background-color: ${componentData.overlayColor || 'transparent'};
                opacity: ${componentData.overlayOpacity || 0};
            "></div>
            
            <!-- Container -->
            <div class="ladi-container" style="
                position: relative;
                z-index: 1;
                padding: ${componentData.padding || styles.padding || '20px'};
                width: 100%;
                height: 100%;
            ">
                ${childrenHTML}
            </div>
        </section>
    `;
};

/**
 * Generate CSS từ pageData
 */
const generateCSS = (pageData) => {
    let css = `
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 0;
        }
        
        .lpb-element {
            transition: all 0.3s ease;
        }
    `;

    // Extract pseudo-classes và animations từ elements
    pageData.elements.forEach(element => {
        const { id, styles = {} } = element;

        // Process hover states
        if (styles[':hover']) {
            css += `\n#${id}:hover {`;
            Object.entries(styles[':hover']).forEach(([key, value]) => {
                const kebabKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                css += `${kebabKey}:${value};`;
            });
            css += `}`;
        }

        // Process keyframes
        Object.entries(styles).forEach(([key, value]) => {
            if (key.startsWith('@keyframes')) {
                css += `\n${key} {`;
                Object.entries(value).forEach(([frame, props]) => {
                    css += `${frame} {`;
                    Object.entries(props).forEach(([prop, val]) => {
                        const kebabProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                        css += `${kebabProp}:${val};`;
                    });
                    css += `}`;
                });
                css += `}`;
            }
        });

        // Process children
        if (element.children) {
            element.children.forEach(child => {
                if (child.styles?.[':hover']) {
                    css += `\n#${child.id}:hover {`;
                    Object.entries(child.styles[':hover']).forEach(([key, value]) => {
                        const kebabKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                        css += `${kebabKey}:${value};`;
                    });
                    css += `}`;
                }
            });
        }
    });

    return css;
};

/**
 * Render toàn bộ pageData thành static HTML với embedded runtime
 * @param {Object} pageData - Page data
 * @returns {string} - Complete HTML document
 */
export const renderStaticHTML = (pageData) => {
    // Extract components
    const popups = pageData.elements.filter(el => el.type === 'popup');
    const sections = pageData.elements.filter(el => el.type === 'section');
    const events = extractEvents(pageData);

    // Generate HTML parts
    const sectionsHTML = sections.map(section => renderSectionHTML(section)).join('\n');
    const popupsHTML = renderPopupsHTML(popups);
    const runtimeScript = generateEventRuntime(events, popups);

    // Generate CSS
    const cssContent = generateCSS(pageData);

    // Combine everything
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${pageData.meta?.description || 'Landing page generated by LandingHub'}">
    <title>${pageData.meta?.title || 'Landing Page'}</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <!-- Styles -->
    <style>
        ${cssContent}
        
        /* Popup Styles */
        .lpb-popup {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .lpb-popup.lpb-popup-active {
            display: flex;
        }
        
        .lpb-popup-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            cursor: pointer;
        }
        
        .lpb-popup-container {
            position: relative;
            z-index: 1;
            background: white;
            border-radius: 12px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .lpb-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e5e7eb;
            background: linear-gradient(to bottom, #f9fafb, #ffffff);
        }
        
        .lpb-popup-close {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            color: #6b7280;
            font-size: 18px;
            font-weight: bold;
        }
        
        .lpb-popup-close:hover {
            background: #f3f4f6;
            color: #111827;
        }
        
        .lpb-popup-body {
            padding: 20px;
        }
        
        /* Loading Spinner */
        .lpb-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .lpb-section {
                width: 100% !important;
            }
            
            .lpb-popup-container {
                width: 90% !important;
                max-width: 90vw !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <!-- Canvas -->
    <div id="lpb-canvas" style="
        position: relative;
        min-height: 100vh;
        background: ${pageData.canvas?.background || '#ffffff'};
    ">
        ${sectionsHTML}
    </div>
    
    <!-- Popups -->
    ${popupsHTML}
    
    <!-- Runtime Script -->
    <script>
        ${runtimeScript}
    </script>
    
    <!-- Google Analytics (optional) -->
    ${pageData.analytics?.googleAnalyticsId ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${pageData.analytics.googleAnalyticsId}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${pageData.analytics.googleAnalyticsId}');
    </script>
    ` : ''}
</body>
</html>`;
};

/**
 * Parse HTML string thành pageData structure
 */
export const parseHTMLToPageData = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const pageData = {
        canvas: {
            width: 1200,
            height: 'auto',
            background: '#ffffff'
        },
        elements: [],
        meta: {}
    };

    try {
        // Parse canvas
        const canvasEl = doc.getElementById('lpb-canvas');
        if (canvasEl) {
            pageData.canvas.background = canvasEl.style.background || '#ffffff';
        }

        // Parse meta
        const titleEl = doc.querySelector('title');
        if (titleEl) {
            pageData.meta.title = titleEl.textContent;
        }

        const descEl = doc.querySelector('meta[name="description"]');
        if (descEl) {
            pageData.meta.description = descEl.getAttribute('content');
        }

        // Parse sections
        const sections = doc.querySelectorAll('.lpb-section');
        sections.forEach(sectionEl => {
            const section = parseSectionElement(sectionEl);
            if (section) {
                pageData.elements.push(section);
            }
        });

        // Parse popups
        const popups = doc.querySelectorAll('.lpb-popup');
        popups.forEach(popupEl => {
            const popup = parsePopupElement(popupEl);
            if (popup) {
                pageData.elements.push(popup);
            }
        });

        // Parse events từ script
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
            const content = script.textContent || script.innerHTML;
            const eventsMatch = content.match(/const eventsConfig = (\[[\s\S]*?\]);/);
            if (eventsMatch) {
                try {
                    const events = JSON.parse(eventsMatch[1]);
                    events.forEach(eventConfig => {
                        const element = findElementById(pageData.elements, eventConfig.elementId);
                        if (element) {
                            if (!element.componentData) {
                                element.componentData = {};
                            }
                            element.componentData.events = eventConfig.events;
                        }
                    });
                } catch (e) {
                    console.warn('Cannot parse events config:', e);
                }
            }
        });

        console.log('[parseHTMLToPageData] Parsed successfully:', pageData.elements.length, 'elements');
        return pageData;

    } catch (error) {
        console.error('[parseHTMLToPageData] Parse error:', error);
        return {
            canvas: { width: 1200, height: 'auto', background: '#ffffff' },
            elements: [],
            meta: {}
        };
    }
};

// ==================== HELPER FUNCTIONS ====================

const parseSectionElement = (sectionEl) => {
    const id = sectionEl.id || `section-${Date.now()}`;
    const topMatch = sectionEl.style.top?.match(/(\d+)px/);
    const top = topMatch ? parseInt(topMatch[1]) : 0;
    const widthMatch = sectionEl.style.width?.match(/(\d+)px/);
    const heightMatch = sectionEl.style.height?.match(/(\d+)px/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 1200;
    const height = heightMatch ? parseInt(heightMatch[1]) : 400;

    const bgEl = sectionEl.querySelector('.ladi-section-background');
    const overlayEl = sectionEl.querySelector('.ladi-overlay');
    const containerEl = sectionEl.querySelector('.ladi-container');

    const componentData = { structure: 'ladi-standard' };

    if (bgEl) {
        const bgStyle = bgEl.style;
        componentData.backgroundColor = bgStyle.backgroundColor || 'transparent';
        const bgImageMatch = bgStyle.backgroundImage?.match(/url\(['"]?(.+?)['"]?\)/);
        if (bgImageMatch) {
            componentData.backgroundImage = bgImageMatch[1];
            componentData.backgroundType = 'image';
        } else if (componentData.backgroundColor !== 'transparent') {
            componentData.backgroundType = 'color';
        }
        componentData.backgroundPosition = bgStyle.backgroundPosition || 'center';
    }

    if (overlayEl) {
        componentData.overlayColor = overlayEl.style.backgroundColor || 'transparent';
        componentData.overlayOpacity = parseFloat(overlayEl.style.opacity) || 0;
    }

    const styles = parseInlineStyles(sectionEl.style);

    if (containerEl) {
        componentData.padding = containerEl.style.padding || '20px';
    }

    const children = [];
    if (containerEl) {
        const childElements = containerEl.querySelectorAll('.lpb-element[data-element-id]');
        childElements.forEach(childEl => {
            if (childEl.parentElement === containerEl || childEl.parentElement?.parentElement === containerEl) {
                const child = parseChildElement(childEl);
                if (child) {
                    children.push(child);
                }
            }
        });
    }

    return {
        id,
        type: 'section',
        componentData,
        position: {
            desktop: { x: 0, y: top },
            tablet: { x: 0, y: top },
            mobile: { x: 0, y: top }
        },
        size: { width, height },
        styles,
        children,
        visible: true,
        locked: false
    };
};

const parsePopupElement = (popupEl) => {
    const id = popupEl.id || `popup-${Date.now()}`;
    const containerEl = popupEl.querySelector('.lpb-popup-container');
    if (!containerEl) return null;

    const widthMatch = containerEl.style.width?.match(/(\d+)px/);
    const minHeightMatch = containerEl.style.minHeight?.match(/(\d+)px/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 600;
    const height = minHeightMatch ? parseInt(minHeightMatch[1]) : 400;

    const headerEl = popupEl.querySelector('.lpb-popup-header h3');
    const bodyEl = popupEl.querySelector('.lpb-popup-body');

    const componentData = {
        title: headerEl?.textContent || 'Popup',
        background: containerEl.style.background || 'rgba(255, 255, 255, 0.95)',
        borderRadius: containerEl.style.borderRadius || '12px',
        padding: bodyEl?.style.padding || '20px'
    };

    const styles = parseInlineStyles(containerEl.style);

    const children = [];
    if (bodyEl) {
        const childElements = bodyEl.querySelectorAll('.lpb-element[data-element-id]');
        childElements.forEach(childEl => {
            const child = parseChildElement(childEl);
            if (child) {
                children.push(child);
            }
        });
    }

    return {
        id,
        type: 'popup',
        componentData,
        position: {
            desktop: { x: 0, y: 0 },
            tablet: { x: 0, y: 0 },
            mobile: { x: 0, y: 0 }
        },
        size: { width, height },
        styles,
        children,
        visible: true,
        locked: false
    };
};

const parseChildElement = (element) => {
    const id = element.id || element.getAttribute('data-element-id') || `element-${Date.now()}`;
    const type = element.getAttribute('data-type') || inferTypeFromElement(element);

    const leftMatch = element.style.left?.match(/(\d+)px/);
    const topMatch = element.style.top?.match(/(\d+)px/);
    const left = leftMatch ? parseInt(leftMatch[1]) : 0;
    const top = topMatch ? parseInt(topMatch[1]) : 0;

    const widthMatch = element.style.width?.match(/(\d+)px/);
    const heightMatch = element.style.height?.match(/(\d+)px/);
    const width = widthMatch ? parseInt(widthMatch[1]) : (type === 'icon' ? 50 : 200);
    const height = heightMatch ? parseInt(heightMatch[1]) : (type === 'icon' ? 50 : 50);

    const styles = parseInlineStyles(element.style);
    const componentData = parseComponentData(element, type);

    return {
        id,
        type,
        componentData,
        position: {
            desktop: { x: left, y: top },
            tablet: { x: left, y: top },
            mobile: { x: left, y: top }
        },
        size: { width, height },
        styles,
        children: [],
        visible: true,
        locked: false
    };
};

const parseComponentData = (element, type) => {
    const componentData = {};

    switch (type) {
        case 'button':
            componentData.content = element.textContent || 'Button';
            componentData.background = element.style.background;
            componentData.color = element.style.color;
            componentData.borderRadius = element.style.borderRadius;
            componentData.border = element.style.border;
            componentData.fontSize = element.style.fontSize;
            componentData.fontWeight = element.style.fontWeight;
            break;

        case 'heading':
            componentData.content = element.textContent || 'Heading';
            componentData.level = element.tagName.toLowerCase();
            componentData.fontSize = element.style.fontSize;
            componentData.color = element.style.color;
            componentData.fontWeight = element.style.fontWeight;
            componentData.textAlign = element.style.textAlign;
            break;

        case 'paragraph':
            componentData.content = element.textContent || 'Paragraph';
            componentData.fontSize = element.style.fontSize;
            componentData.color = element.style.color;
            componentData.fontWeight = element.style.fontWeight;
            componentData.lineHeight = element.style.lineHeight;
            componentData.textAlign = element.style.textAlign;
            break;

        case 'image':
            componentData.src = element.getAttribute('src');
            componentData.alt = element.getAttribute('alt');
            componentData.imageUrl = element.getAttribute('src');
            break;

        case 'icon':
            const img = element.querySelector('img');
            const iconEl = element.querySelector('i');
            const svgEl = element.querySelector('svg');

            if (img) {
                componentData.imageUrl = img.getAttribute('src');
            } else if (svgEl) {
                componentData.icon = svgEl.outerHTML;
            } else if (iconEl) {
                componentData.icon = iconEl.className;
            }
            componentData.title = element.getAttribute('title') || '';
            break;

        case 'gallery':
            const images = Array.from(element.querySelectorAll('img')).map(img => img.src);
            componentData.images = images;
            break;

        default:
            componentData.content = element.textContent || '';
            break;
    }

    return componentData;
};

const parseInlineStyles = (styleObj) => {
    const styles = {};
    const importantProps = [
        'background', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
        'color', 'fontSize', 'fontWeight', 'fontFamily',
        'border', 'borderRadius', 'boxShadow', 'textShadow',
        'padding', 'margin',
        'display', 'alignItems', 'justifyContent', 'flexDirection', 'gap',
        'textAlign', 'lineHeight', 'textTransform',
        'cursor', 'transition', 'animation',
        'zIndex', 'opacity'
    ];

    importantProps.forEach(prop => {
        if (styleObj[prop]) {
            styles[prop] = styleObj[prop];
        }
    });

    return styles;
};

const inferTypeFromElement = (element) => {
    const tagName = element.tagName.toLowerCase();
    const classList = element.classList;

    if (classList.contains('lpb-button') || tagName === 'button') return 'button';
    if (classList.contains('lpb-icon')) return 'icon';
    if (classList.contains('lpb-gallery')) return 'gallery';
    if (classList.contains('lpb-section')) return 'section';
    if (classList.contains('lpb-popup')) return 'popup';

    if (tagName.match(/^h[1-6]$/)) return 'heading';
    if (tagName === 'p') return 'paragraph';
    if (tagName === 'img') return 'image';
    if (tagName === 'hr') return 'divider';
    if (tagName === 'form') return 'form';
    if (tagName === 'ul' || tagName === 'ol') return 'list';

    return 'container';
};

const findElementById = (elements, id) => {
    for (const element of elements) {
        if (element.id === id) return element;

        if (element.children && element.children.length > 0) {
            const found = findElementById(element.children, id);
            if (found) return found;
        }
    }
    return null;
};