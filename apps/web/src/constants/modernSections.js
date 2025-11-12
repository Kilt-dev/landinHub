import {
    Rocket, Zap, Star, Users, CheckCircle, MessageCircle,
    DollarSign, Mail, Phone, MapPin, Award, TrendingUp
} from 'lucide-react';

/**
 * Beautiful Modern Section Templates
 * Ready-to-use sections for professional landing pages
 */
export const modernSections = {
    name: 'Section Templates',
    subCategories: [
        {
            id: 'hero',
            name: 'Hero Sections',
            lucideIcon: Rocket,
            templates: [
                {
                    id: 'hero-modern-1',
                    name: 'Hero Modern - Centered',
                    lucideIcon: Rocket,
                    description: 'Hero section hiện đại với CTA button',
                    previewImage: 'https://via.placeholder.com/600x400?text=Hero+Modern+Centered',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Hero Modern',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 600 },
                        styles: {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '80px 40px',
                        },
                        children: [
                            {
                                id: 'hero-heading',
                                type: 'heading',
                                componentData: {
                                    content: 'Xây Dựng Landing Page Chuyên Nghiệp',
                                    level: 'h1',
                                },
                                position: { desktop: { x: 300, y: 150 }, tablet: { x: 150, y: 150 }, mobile: { x: 20, y: 120 } },
                                size: { width: 600, height: 80 },
                                styles: {
                                    fontSize: '3rem',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    textAlign: 'center',
                                    lineHeight: '1.2',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                },
                            },
                            {
                                id: 'hero-subtitle',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Tạo trang landing đẹp trong vài phút với drag & drop. Không cần code!',
                                },
                                position: { desktop: { x: 350, y: 250 }, tablet: { x: 200, y: 250 }, mobile: { x: 20, y: 220 } },
                                size: { width: 500, height: 60 },
                                styles: {
                                    fontSize: '1.25rem',
                                    color: 'rgba(255,255,255,0.9)',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                },
                            },
                            {
                                id: 'hero-cta',
                                type: 'button',
                                componentData: {
                                    content: 'Bắt Đầu Miễn Phí',
                                    events: {
                                        onClick: {
                                            type: 'scrollToSection',
                                            sectionId: 'features',
                                        },
                                    },
                                },
                                position: { desktop: { x: 500, y: 350 }, tablet: { x: 300, y: 350 }, mobile: { x: 100, y: 320 } },
                                size: { width: 200, height: 50 },
                                styles: {
                                    background: '#ffffff',
                                    color: '#667eea',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    padding: '14px 32px',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s ease',
                                },
                            },
                        ],
                    },
                },
                {
                    id: 'hero-split-1',
                    name: 'Hero Split - Image Right',
                    lucideIcon: Rocket,
                    description: 'Hero section với hình ảnh bên phải',
                    previewImage: 'https://via.placeholder.com/600x400?text=Hero+Split',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Hero Split',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 500 },
                        styles: {
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '60px 80px',
                        },
                        children: [
                            {
                                id: 'split-heading',
                                type: 'heading',
                                componentData: {
                                    content: 'Giải Pháp Marketing Toàn Diện',
                                    level: 'h1',
                                },
                                position: { desktop: { x: 80, y: 120 }, tablet: { x: 40, y: 100 }, mobile: { x: 20, y: 80 } },
                                size: { width: 450, height: 70 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    lineHeight: '1.2',
                                },
                            },
                            {
                                id: 'split-text',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Tăng trưởng doanh số với landing page được tối ưu chuyển đổi. Công cụ mạnh mẽ, dễ sử dụng.',
                                },
                                position: { desktop: { x: 80, y: 210 }, tablet: { x: 40, y: 190 }, mobile: { x: 20, y: 170 } },
                                size: { width: 450, height: 80 },
                                styles: {
                                    fontSize: '1.125rem',
                                    color: '#6b7280',
                                    lineHeight: '1.7',
                                },
                            },
                            {
                                id: 'split-cta',
                                type: 'button',
                                componentData: {
                                    content: 'Dùng Thử Ngay',
                                },
                                position: { desktop: { x: 80, y: 310 }, tablet: { x: 40, y: 290 }, mobile: { x: 20, y: 270 } },
                                size: { width: 180, height: 50 },
                                styles: {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#ffffff',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    padding: '12px 28px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                },
                            },
                            {
                                id: 'split-image',
                                type: 'image',
                                componentData: {
                                    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
                                    alt: 'Dashboard',
                                },
                                position: { desktop: { x: 650, y: 80 }, tablet: { x: 400, y: 80 }, mobile: { x: 20, y: 380 } },
                                size: { width: 450, height: 340 },
                                styles: {
                                    borderRadius: '16px',
                                    objectFit: 'cover',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                },
                            },
                        ],
                    },
                },
            ],
        },
        {
            id: 'features',
            name: 'Features',
            lucideIcon: Zap,
            templates: [
                {
                    id: 'features-3col',
                    name: 'Features - 3 Columns',
                    lucideIcon: Zap,
                    description: 'Hiển thị tính năng dạng 3 cột',
                    previewImage: 'https://via.placeholder.com/600x350?text=Features+3+Columns',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Features 3 Columns',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 450 },
                        styles: {
                            background: '#f9fafb',
                            padding: '80px 60px',
                        },
                        children: [
                            {
                                id: 'features-title',
                                type: 'heading',
                                componentData: {
                                    content: 'Tính Năng Nổi Bật',
                                    level: 'h2',
                                },
                                position: { desktop: { x: 400, y: 40 }, tablet: { x: 250, y: 40 }, mobile: { x: 50, y: 40 } },
                                size: { width: 400, height: 50 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            // Feature 1
                            {
                                id: 'feature-icon-1',
                                type: 'icon',
                                componentData: {
                                    icon: 'fa-solid fa-rocket',
                                    title: 'Nhanh Chóng',
                                },
                                position: { desktop: { x: 120, y: 150 }, tablet: { x: 60, y: 150 }, mobile: { x: 130, y: 130 } },
                                size: { width: 60, height: 60 },
                                styles: {
                                    fontSize: '2.5rem',
                                    color: '#667eea',
                                },
                            },
                            {
                                id: 'feature-title-1',
                                type: 'heading',
                                componentData: {
                                    content: 'Ra Mắt Trong Vài Phút',
                                    level: 'h3',
                                },
                                position: { desktop: { x: 80, y: 230 }, tablet: { x: 40, y: 230 }, mobile: { x: 50, y: 210 } },
                                size: { width: 280, height: 40 },
                                styles: {
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            {
                                id: 'feature-desc-1',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Kéo thả để tạo trang landing chuyên nghiệp không cần code.',
                                },
                                position: { desktop: { x: 70, y: 280 }, tablet: { x: 30, y: 280 }, mobile: { x: 30, y: 260 } },
                                size: { width: 300, height: 60 },
                                styles: {
                                    fontSize: '0.95rem',
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                },
                            },
                            // Feature 2
                            {
                                id: 'feature-icon-2',
                                type: 'icon',
                                componentData: {
                                    icon: 'fa-solid fa-mobile',
                                    title: 'Responsive',
                                },
                                position: { desktop: { x: 520, y: 150 }, tablet: { x: 340, y: 150 }, mobile: { x: 130, y: 370 } },
                                size: { width: 60, height: 60 },
                                styles: {
                                    fontSize: '2.5rem',
                                    color: '#10b981',
                                },
                            },
                            {
                                id: 'feature-title-2',
                                type: 'heading',
                                componentData: {
                                    content: 'Hoàn Toàn Responsive',
                                    level: 'h3',
                                },
                                position: { desktop: { x: 480, y: 230 }, tablet: { x: 300, y: 230 }, mobile: { x: 50, y: 450 } },
                                size: { width: 280, height: 40 },
                                styles: {
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            {
                                id: 'feature-desc-2',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Tự động tối ưu cho mọi thiết bị: desktop, tablet, mobile.',
                                },
                                position: { desktop: { x: 470, y: 280 }, tablet: { x: 290, y: 280 }, mobile: { x: 30, y: 500 } },
                                size: { width: 300, height: 60 },
                                styles: {
                                    fontSize: '0.95rem',
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                },
                            },
                            // Feature 3
                            {
                                id: 'feature-icon-3',
                                type: 'icon',
                                componentData: {
                                    icon: 'fa-solid fa-chart-line',
                                    title: 'Tối Ưu',
                                },
                                position: { desktop: { x: 920, y: 150 }, tablet: { x: 620, y: 150 }, mobile: { x: 130, y: 610 } },
                                size: { width: 60, height: 60 },
                                styles: {
                                    fontSize: '2.5rem',
                                    color: '#f59e0b',
                                },
                            },
                            {
                                id: 'feature-title-3',
                                type: 'heading',
                                componentData: {
                                    content: 'Tăng Chuyển Đổi',
                                    level: 'h3',
                                },
                                position: { desktop: { x: 880, y: 230 }, tablet: { x: 580, y: 230 }, mobile: { x: 50, y: 690 } },
                                size: { width: 280, height: 40 },
                                styles: {
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            {
                                id: 'feature-desc-3',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Templates được tối ưu để tăng tỷ lệ chuyển đổi khách hàng.',
                                },
                                position: { desktop: { x: 870, y: 280 }, tablet: { x: 570, y: 280 }, mobile: { x: 30, y: 740 } },
                                size: { width: 300, height: 60 },
                                styles: {
                                    fontSize: '0.95rem',
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                },
                            },
                        ],
                    },
                },
            ],
        },
        {
            id: 'cta',
            name: 'Call To Action',
            lucideIcon: Star,
            templates: [
                {
                    id: 'cta-centered',
                    name: 'CTA - Centered',
                    lucideIcon: Star,
                    description: 'Call to action với button lớn ở giữa',
                    previewImage: 'https://via.placeholder.com/600x300?text=CTA+Centered',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'CTA Centered',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 350 },
                        styles: {
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '60px 40px',
                        },
                        children: [
                            {
                                id: 'cta-heading',
                                type: 'heading',
                                componentData: {
                                    content: 'Sẵn Sàng Bắt Đầu?',
                                    level: 'h2',
                                },
                                position: { desktop: { x: 350, y: 80 }, tablet: { x: 200, y: 80 }, mobile: { x: 50, y: 70 } },
                                size: { width: 500, height: 60 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                    textAlign: 'center',
                                },
                            },
                            {
                                id: 'cta-text',
                                type: 'paragraph',
                                componentData: {
                                    content: 'Tạo landing page đầu tiên của bạn ngay hôm nay. Miễn phí 14 ngày!',
                                },
                                position: { desktop: { x: 350, y: 160 }, tablet: { x: 200, y: 160 }, mobile: { x: 40, y: 150 } },
                                size: { width: 500, height: 50 },
                                styles: {
                                    fontSize: '1.125rem',
                                    color: 'rgba(255,255,255,0.95)',
                                    textAlign: 'center',
                                    lineHeight: '1.6',
                                },
                            },
                            {
                                id: 'cta-button',
                                type: 'button',
                                componentData: {
                                    content: 'Đăng Ký Miễn Phí',
                                },
                                position: { desktop: { x: 490, y: 230 }, tablet: { x: 300, y: 230 }, mobile: { x: 90, y: 220 } },
                                size: { width: 220, height: 56 },
                                styles: {
                                    background: '#ffffff',
                                    color: '#f5576c',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    padding: '16px 36px',
                                    borderRadius: '9999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                },
                            },
                        ],
                    },
                },
            ],
        },
        {
            id: 'testimonial',
            name: 'Testimonials',
            lucideIcon: MessageCircle,
            templates: [
                {
                    id: 'testimonial-cards',
                    name: 'Testimonial Cards',
                    lucideIcon: MessageCircle,
                    description: 'Đánh giá khách hàng dạng cards',
                    previewImage: 'https://via.placeholder.com/600x400?text=Testimonial+Cards',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Testimonials',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 450 },
                        styles: {
                            background: '#ffffff',
                            padding: '80px 60px',
                        },
                        children: [
                            {
                                id: 'testimonial-title',
                                type: 'heading',
                                componentData: {
                                    content: 'Khách Hàng Nói Gì',
                                    level: 'h2',
                                },
                                position: { desktop: { x: 400, y: 40 }, tablet: { x: 250, y: 40 }, mobile: { x: 60, y: 40 } },
                                size: { width: 400, height: 50 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            // Testimonial 1
                            {
                                id: 'testimonial-card-1',
                                type: 'div',
                                componentData: {
                                    content: '',
                                },
                                position: { desktop: { x: 80, y: 130 }, tablet: { x: 40, y: 130 }, mobile: { x: 30, y: 120 } },
                                size: { width: 340, height: 240 },
                                styles: {
                                    background: '#f9fafb',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                },
                                children: [
                                    {
                                        id: 'testimonial-text-1',
                                        type: 'paragraph',
                                        componentData: {
                                            content: '"Công cụ tuyệt vời! Tôi đã tạo được landing page chuyên nghiệp chỉ trong 30 phút."',
                                        },
                                        position: { desktop: { x: 24, y: 24 }, tablet: { x: 24, y: 24 }, mobile: { x: 24, y: 24 } },
                                        size: { width: 292, height: 100 },
                                        styles: {
                                            fontSize: '0.95rem',
                                            color: '#374151',
                                            lineHeight: '1.7',
                                            fontStyle: 'italic',
                                        },
                                    },
                                    {
                                        id: 'testimonial-author-1',
                                        type: 'paragraph',
                                        componentData: {
                                            content: '- Nguyễn Văn A, CEO Startup X',
                                        },
                                        position: { desktop: { x: 24, y: 140 }, tablet: { x: 24, y: 140 }, mobile: { x: 24, y: 140 } },
                                        size: { width: 292, height: 40 },
                                        styles: {
                                            fontSize: '0.875rem',
                                            color: '#6b7280',
                                            fontWeight: '600',
                                        },
                                    },
                                ],
                            },
                            // Add more testimonials...
                        ],
                    },
                },
            ],
        },
        {
            id: 'pricing',
            name: 'Pricing',
            lucideIcon: DollarSign,
            templates: [
                {
                    id: 'pricing-3col',
                    name: 'Pricing - 3 Tiers',
                    lucideIcon: DollarSign,
                    description: 'Bảng giá 3 gói',
                    previewImage: 'https://via.placeholder.com/600x500?text=Pricing+3+Tiers',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Pricing',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 600 },
                        styles: {
                            background: '#f9fafb',
                            padding: '80px 60px',
                        },
                        children: [
                            {
                                id: 'pricing-title',
                                type: 'heading',
                                componentData: {
                                    content: 'Chọn Gói Phù Hợp',
                                    level: 'h2',
                                },
                                position: { desktop: { x: 380, y: 40 }, tablet: { x: 230, y: 40 }, mobile: { x: 60, y: 40 } },
                                size: { width: 440, height: 50 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            // Pricing cards would be added here...
                        ],
                    },
                },
            ],
        },
        {
            id: 'contact',
            name: 'Contact',
            lucideIcon: Mail,
            templates: [
                {
                    id: 'contact-form',
                    name: 'Contact Form',
                    lucideIcon: Mail,
                    description: 'Form liên hệ đơn giản',
                    previewImage: 'https://via.placeholder.com/600x450?text=Contact+Form',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Contact',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 500 },
                        styles: {
                            background: '#ffffff',
                            padding: '80px 60px',
                        },
                        children: [
                            {
                                id: 'contact-title',
                                type: 'heading',
                                componentData: {
                                    content: 'Liên Hệ Với Chúng Tôi',
                                    level: 'h2',
                                },
                                position: { desktop: { x: 400, y: 40 }, tablet: { x: 250, y: 40 }, mobile: { x: 40, y: 40 } },
                                size: { width: 400, height: 50 },
                                styles: {
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    textAlign: 'center',
                                },
                            },
                            // Form fields would be added here...
                        ],
                    },
                },
            ],
        },
        {
            id: 'footer',
            name: 'Footer',
            lucideIcon: Award,
            templates: [
                {
                    id: 'footer-simple',
                    name: 'Footer Simple',
                    lucideIcon: Award,
                    description: 'Footer đơn giản với links',
                    previewImage: 'https://via.placeholder.com/600x200?text=Footer+Simple',
                    json: {
                        type: 'section',
                        componentData: {
                            title: 'Footer',
                            structure: 'ladi-standard',
                        },
                        size: { width: 1200, height: 250 },
                        styles: {
                            background: '#1f2937',
                            padding: '60px 80px',
                        },
                        children: [
                            {
                                id: 'footer-text',
                                type: 'paragraph',
                                componentData: {
                                    content: '© 2025 LandingHub. All rights reserved.',
                                },
                                position: { desktop: { x: 450, y: 180 }, tablet: { x: 280, y: 180 }, mobile: { x: 80, y: 180 } },
                                size: { width: 300, height: 30 },
                                styles: {
                                    fontSize: '0.875rem',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    ],
};

export default modernSections;
