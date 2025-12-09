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
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1764659589/Screenshot_2025-12-02_140925_b4eucu.png',
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
            ],
        }
    ],
};

export default modernSections;
