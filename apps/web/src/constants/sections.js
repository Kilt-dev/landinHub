import {
    Type, FileText, Square, FormInput, Image,
    Video, Star, Minus, ShoppingCart, LayoutGrid,
    SlidersHorizontal, Folder, ChevronDown, Table,
    BarChart, Menu
} from 'lucide-react';

/**
 * Helper function to create responsive position for children
 */
const createResponsivePosition = (desktopPos, tabletPos = null, mobilePos = null) => {
    const tablet = tabletPos || {
        x: Math.round(desktopPos.x * 0.64),
        y: desktopPos.y,
        z: desktopPos.z || 1
    };

    const mobile = mobilePos || {
        x: Math.round(desktopPos.x * 0.31),
        y: desktopPos.y,
        z: desktopPos.z || 1
    };

    return {
        desktop: { ...desktopPos, z: desktopPos.z || 1 },
        tablet: tablet,
        mobile: mobile
    };
};

export const sections = {
    name: 'Phần',
    subCategories: [
        {
            id: 'standard-sections',
            name: 'Phần tiêu chuẩn',
            lucideIcon: LayoutGrid,
            templates: [
                {
                    id: 'empty-section',
                    name: 'Phần trống',
                    lucideIcon: LayoutGrid,
                    description: 'Phần cơ bản không có thành phần con, có thể tùy chỉnh',
                    previewImage:'https://res.cloudinary.com/dubthm5m6/image/upload/v1760965968/sectiontrong_yyx2a9.png',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Phần trống',
                            backgroundColor: '#ffffff',
                            dataSource: { type: 'static' },
                            events: {}
                        },
                        size: { width: 1200, height: 400 },
                        mobileSize: { width: 375, height: 300 },
                        tabletSize: { width: 768, height: 350 },
                        styles: { textAlign: 'center', padding: '0px 0' },
                        children: []  // Không có thành phần con
                    }
                },
                {
                    id: 'hero-section',
                    name: 'Phần tiêu đề chính',
                    lucideIcon: LayoutGrid,
                    description: 'Phần tiêu đề nổi bật cho trang đích',
                    previewImage:'https://res.cloudinary.com/dubthm5m6/image/upload/v1760965968/sectionhero_yudwaj.png',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Chào mừng đến với trang của chúng tôi',
                            backgroundColor: '#ffffff',
                            dataSource: { type: 'static' },
                            events: { onClick: { type: 'navigate', url: '/home' } }
                        },
                        size: { width: 600, height: 574 },
                        mobileSize: { width: 375, height: 400 },
                        tabletSize: { width: 768, height: 500 },
                        styles: { color: '#ffffff', textAlign: 'center' },
                        children: [
                            {
                                id: 'hero-heading',
                                type: 'heading',
                                componentData: {
                                    title: 'Gradient Modern',
                                    content: 'Chào mừng đến với trang của chúng tôi',
                                    dataSource: { type: 'static' },
                                    animation: { type: 'zoomIn', duration: 1200, delay: 0 }
                                },
                                size: { width: 700, height: 90 },
                                mobileSize: { width: 340, height: 60 },
                                tabletSize: { width: 550, height: 75 },
                                position: createResponsivePosition({ x: 250, y: 50 }, { x: 109, y: 50 }, { x: 17, y: 30 }),
                                styles: {
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '17px',
                                    fontWeight: '800',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textAlign: 'center',
                                    margin: '0',
                                    letterSpacing: '-1px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '1.8rem', letterSpacing: '0px' },
                                    tablet: { fontSize: '2.6rem', letterSpacing: '-0.5px' }
                                }
                            },
                            {
                                id: 'hero-button',
                                type: 'button',
                                componentData: {
                                    title: 'Gradient Flow',
                                    content: 'Bắt đầu ngay',
                                    dataSource: { type: 'static' },
                                    events: { onClick: { type: 'navigate', url: '' } }
                                },
                                size: { width: 180, height: 50 },
                                mobileSize: { width: 140, height: 44 },
                                tabletSize: { width: 160, height: 48 },
                                position: createResponsivePosition({ x: 510, y: 160 }, { x: 304, y: 150 }, { x: 117, y: 120 }),
                                styles: {
                                    background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1)',
                                    color: '#fff',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    fontSize: '16px',
                                    border: 'none',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                    cursor: 'pointer',
                                    padding: '12px 24px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '14px', padding: '10px 18px' },
                                    tablet: { fontSize: '15px', padding: '11px 20px' }
                                }
                            }
                        ]
                    }
                },
                {
                    id: 'cta-section',
                    name: 'Phần kêu gọi hành động',
                    lucideIcon: Square,
                    description: 'Khuyến khích người dùng hành động',
                    previewImage:'https://res.cloudinary.com/dubthm5m6/image/upload/v1760965968/sectionhanhdong_pp4xhh.png',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Sẵn sàng bắt đầu?',
                            backgroundColor: '#2563eb',
                            dataSource: { type: 'static' },
                            events: {}
                        },
                        size: { width: 1200, height: 300 },
                        mobileSize: { width: 375, height: 250 },
                        tabletSize: { width: 768, height: 280 },
                        styles: { color: '#ffffff', textAlign: 'center', padding: '0px 0' },
                        children: [
                            {
                                id: 'cta-heading',
                                type: 'heading',
                                componentData: {
                                    title: '3D Shadow',
                                    content: 'Bắt đầu ngay hôm nay!',
                                    dataSource: { type: 'static' }
                                },
                                size: { width: 800, height: 100 },
                                mobileSize: { width: 340, height: 65 },
                                tabletSize: { width: 600, height: 85 },
                                position: createResponsivePosition({ x: 200, y: 20 }, { x: 84, y: 20 }, { x: 17, y: 20 }),
                                styles: {
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontSize: '19px',
                                    fontWeight: '900',
                                    color: '#ef4444',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    margin: '0',
                                    letterSpacing: '2px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '12px', letterSpacing: '1px' },
                                    tablet: { fontSize: '14px', letterSpacing: '1.5px' }
                                }
                            },
                            {
                                id: 'cta-button',
                                type: 'button',
                                componentData: {
                                    title: 'Modern Glow',
                                    content: 'Đăng ký ngay',
                                    dataSource: { type: 'static' },
                                    events: { onClick: { type: 'navigate', url: '/signup' } }
                                },
                                size: { width: 180, height: 50 },
                                mobileSize: { width: 150, height: 44 },
                                tabletSize: { width: 170, height: 48 },
                                position: createResponsivePosition({ x: 510, y: 140 }, { x: 299, y: 130 }, { x: 112, y: 110 }),
                                styles: {
                                    background: 'transparent',
                                    color: '#00ddeb',
                                    borderRadius: '10px',
                                    fontWeight: '700',
                                    fontSize: '15px',
                                    border: '2px solid #00ddeb',
                                    cursor: 'pointer',
                                    padding: '10px 20px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '14px', padding: '9px 16px' },
                                    tablet: { fontSize: '14.5px', padding: '9.5px 18px' }
                                }
                            }
                        ]
                    }
                },
                {
                    id: 'testimonial-section',
                    name: 'Phần đánh giá',
                    lucideIcon: FileText,
                    description: 'Hiển thị đánh giá từ khách hàng',
                    previewImage:'https://res.cloudinary.com/dubthm5m6/image/upload/v1760965968/sectiondanhgia_s1t980.png',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Khách hàng nói gì',
                            backgroundColor: '#ffffff',
                            dataSource: { type: 'static' },
                            events: {}
                        },
                        size: { width: 1200, height: 350 },
                        mobileSize: { width: 375, height: 320 },
                        tabletSize: { width: 768, height: 340 },
                        styles: { textAlign: 'center', padding: '0px 0' },
                        children: [
                            {
                                id: 'testimonial-heading',
                                type: 'heading',
                                componentData: {
                                    title: 'Elegant Serif',
                                    content: 'Đánh giá khách hàng',
                                    dataSource: { type: 'static' }
                                },
                                size: { width: 300, height: 75 },
                                mobileSize: { width: 340, height: 50 },
                                tabletSize: { width: 600, height: 65 },
                                position: createResponsivePosition({ x: 200, y: 20 }, { x: 84, y: 20 }, { x: 17, y: 20 }),
                                styles: {
                                    fontFamily: 'Georgia, serif',
                                    fontSize: '20px',
                                    fontWeight: '300',
                                    fontStyle: 'italic',
                                    color: '#374151',
                                    textAlign: 'center',
                                    margin: '0',
                                    letterSpacing: '8px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '16px', letterSpacing: '3px' },
                                    tablet: { fontSize: '12px', letterSpacing: '5px' }
                                }
                            },
                            {
                                id: 'testimonial-1',
                                type: 'paragraph',
                                componentData: {
                                    title: 'Đoạn văn trích dẫn',
                                    content: '"Sản phẩm và dịch vụ tuyệt vời!" - Nguyễn Văn A',
                                    dataSource: { type: 'static' }
                                },
                                size: { width: 300, height: 80 },
                                mobileSize: { width: 340, height: 90 },
                                tabletSize: { width: 700, height: 85 },
                                position: createResponsivePosition({ x: 150, y: 120 }, { x: 34, y: 100 }, { x: 17, y: 90 }),
                                styles: {
                                    fontFamily: 'Roboto, sans-serif',
                                    fontSize: '1.1rem',
                                    fontStyle: 'italic',
                                    color: '#374151',
                                    lineHeight: '1.7',
                                    textAlign: 'left',
                                    paddingLeft: '20px',
                                    borderLeft: '4px solid #2563eb',
                                    margin: '0',
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '14px', paddingLeft: '15px', borderLeft: '3px solid #2563eb' },
                                    tablet: { fontSize: '12px', paddingLeft: '18px' }
                                }
                            }
                        ]
                    }
                },
                {
                    id: 'footer-section',
                    name: 'Phần chân trang',
                    lucideIcon: ChevronDown,
                    description: 'Chân trang với liên kết và thông tin liên hệ',
                    previewImage:'https://res.cloudinary.com/dubthm5m6/image/upload/v1760965968/sectionfooter_excwj1.png',

                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Chân trang',
                            backgroundColor: '#295da1',
                            dataSource: { type: 'static' },
                            events: {}
                        },
                        size: { width: 1200, height: 200 },
                        mobileSize: { width: 375, height: 220 },
                        tabletSize: { width: 768, height: 210 },
                        styles: { color: '#363232', textAlign: 'center', padding: '0px 0',backgroundColor: '#295da1' },
                        children: [
                            {
                                id: 'footer-text',
                                type: 'paragraph',
                                componentData: {
                                    title: 'Copyright',
                                    content: '© 2025 Công ty của bạn. Mọi quyền được bảo lưu.',
                                    dataSource: { type: 'static' }
                                },
                                size: { width: 400, height: 60 },
                                mobileSize: { width: 340, height: 65 },
                                tabletSize: { width: 650, height: 62 },
                                position: createResponsivePosition({ x: 200, y: 90 }, { x: 59, y: 80 }, { x: 17, y: 75 }),
                                styles: {
                                    fontFamily: 'Roboto, sans-serif',
                                    fontSize: '1rem',
                                    color: '#e5e7eb',
                                    lineHeight: '1.8',
                                    textAlign: 'center',
                                    margin: '0',
                                    padding: '20px',
                                    borderRadius: '10px'
                                },
                                responsiveStyles: {
                                    mobile: { fontSize: '0.85rem', padding: '15px', borderRadius: '8px' },
                                    tablet: { fontSize: '0.92rem', padding: '18px' }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ]
};