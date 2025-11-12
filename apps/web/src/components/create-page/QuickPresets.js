import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './QuickPresets.css';

/**
 * Quick Component Presets
 * Pre-made responsive components optimized for mobile
 */

const QUICK_PRESETS = [
    {
        id: 'cta-button-primary',
        name: 'CTA Button - Primary',
        category: 'Buttons',
        icon: '🎯',
        description: 'Large, mobile-friendly call-to-action button',
        component: {
            type: 'button',
            componentData: {
                text: 'Get Started Now',
                action: 'link',
                href: '#'
            },
            size: { width: 280, height: 56 },
            mobileSize: { width: 300, height: 56 },
            styles: {
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '700',
                padding: '16px 32px',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                ':hover': {
                    backgroundColor: '#1d4ed8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)'
                }
            }
        }
    },
    {
        id: 'hero-heading',
        name: 'Hero Heading',
        category: 'Text',
        icon: '✨',
        description: 'Large, attention-grabbing heading',
        component: {
            type: 'heading',
            componentData: {
                text: 'Transform Your Business Today',
                tag: 'h1'
            },
            size: { width: 800, height: 100 },
            mobileSize: { width: 340, height: 120 },
            styles: {
                fontSize: '48px',
                fontWeight: '900',
                lineHeight: '1.2',
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: '24px',
                '@media (max-width: 768px)': {
                    fontSize: '32px'
                }
            }
        }
    },
    {
        id: 'feature-card',
        name: 'Feature Card',
        category: 'Cards',
        icon: '📦',
        description: 'Card with icon, title, and description',
        component: {
            type: 'section',
            componentData: {
                structure: 'card'
            },
            size: { width: 350, height: 280 },
            mobileSize: { width: 340, height: 300 },
            styles: {
                backgroundColor: '#ffffff',
                padding: '32px 24px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                ':hover': {
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-4px)'
                }
            },
            children: [
                {
                    id: 'icon',
                    type: 'icon',
                    componentData: {
                        icon: 'star',
                        library: 'lucide'
                    },
                    position: { desktop: { x: 24, y: 24 }, mobile: { x: 24, y: 24 } },
                    size: { width: 48, height: 48 },
                    styles: {
                        color: '#2563eb',
                        fontSize: '48px'
                    }
                },
                {
                    id: 'title',
                    type: 'heading',
                    componentData: {
                        text: 'Amazing Feature',
                        tag: 'h3'
                    },
                    position: { desktop: { x: 24, y: 88 }, mobile: { x: 24, y: 88 } },
                    size: { width: 300, height: 32 },
                    styles: {
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '12px'
                    }
                },
                {
                    id: 'description',
                    type: 'paragraph',
                    componentData: {
                        text: 'Discover how this feature can transform your workflow and boost productivity.'
                    },
                    position: { desktop: { x: 24, y: 132 }, mobile: { x: 24, y: 132 } },
                    size: { width: 300, height: 120 },
                    styles: {
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#6b7280'
                    }
                }
            ]
        }
    },
    {
        id: 'pricing-card',
        name: 'Pricing Card',
        category: 'Cards',
        icon: '💰',
        description: 'Pricing plan card with features list',
        component: {
            type: 'section',
            componentData: {
                structure: 'pricing'
            },
            size: { width: 320, height: 500 },
            mobileSize: { width: 340, height: 520 },
            styles: {
                backgroundColor: '#ffffff',
                padding: '32px 24px',
                borderRadius: '16px',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e5e7eb',
                textAlign: 'center'
            },
            children: [
                {
                    id: 'plan-name',
                    type: 'heading',
                    componentData: { text: 'Pro Plan', tag: 'h3' },
                    position: { desktop: { x: 24, y: 24 }, mobile: { x: 24, y: 24 } },
                    size: { width: 270, height: 36 },
                    styles: {
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937'
                    }
                },
                {
                    id: 'price',
                    type: 'heading',
                    componentData: { text: '$49', tag: 'h2' },
                    position: { desktop: { x: 24, y: 72 }, mobile: { x: 24, y: 72 } },
                    size: { width: 270, height: 60 },
                    styles: {
                        fontSize: '48px',
                        fontWeight: '900',
                        color: '#2563eb'
                    }
                },
                {
                    id: 'cta',
                    type: 'button',
                    componentData: { text: 'Choose Plan', action: 'link' },
                    position: { desktop: { x: 45, y: 400 }, mobile: { x: 45, y: 400 } },
                    size: { width: 230, height: 56 },
                    styles: {
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontSize: '16px',
                        fontWeight: '600',
                        padding: '16px',
                        borderRadius: '8px',
                        border: 'none'
                    }
                }
            ]
        }
    },
    {
        id: 'contact-form',
        name: 'Contact Form',
        category: 'Forms',
        icon: '📝',
        description: 'Simple contact form',
        component: {
            type: 'section',
            componentData: {
                structure: 'form'
            },
            size: { width: 500, height: 400 },
            mobileSize: { width: 340, height: 450 },
            styles: {
                backgroundColor: '#f9fafb',
                padding: '32px 24px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
            },
            children: [
                {
                    id: 'form-title',
                    type: 'heading',
                    componentData: { text: 'Get In Touch', tag: 'h3' },
                    position: { desktop: { x: 24, y: 24 }, mobile: { x: 24, y: 24 } },
                    size: { width: 450, height: 36 },
                    styles: {
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '24px'
                    }
                }
            ]
        }
    },
    {
        id: 'testimonial',
        name: 'Testimonial Card',
        category: 'Social Proof',
        icon: '💬',
        description: 'Customer testimonial with avatar',
        component: {
            type: 'section',
            componentData: {
                structure: 'testimonial'
            },
            size: { width: 400, height: 240 },
            mobileSize: { width: 340, height: 260 },
            styles: {
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb'
            },
            children: [
                {
                    id: 'quote',
                    type: 'paragraph',
                    componentData: { text: '"This product changed my life! Highly recommended to everyone."' },
                    position: { desktop: { x: 24, y: 24 }, mobile: { x: 24, y: 24 } },
                    size: { width: 350, height: 80 },
                    styles: {
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#374151',
                        fontStyle: 'italic'
                    }
                },
                {
                    id: 'author',
                    type: 'paragraph',
                    componentData: { text: '- John Doe, CEO' },
                    position: { desktop: { x: 24, y: 120 }, mobile: { x: 24, y: 120 } },
                    size: { width: 350, height: 24 },
                    styles: {
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280'
                    }
                }
            ]
        }
    }
];

const QuickPresets = ({ onAddPreset, viewMode = 'desktop' }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['All', ...new Set(QUICK_PRESETS.map(p => p.category))];

    const filteredPresets = QUICK_PRESETS.filter(preset => {
        const matchesCategory = selectedCategory === 'All' || preset.category === selectedCategory;
        const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            preset.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddPreset = (preset) => {
        // Clone and add position
        const component = JSON.parse(JSON.stringify(preset.component));
        component.position = {
            desktop: { x: 100, y: 100, z: 1 },
            tablet: { x: 80, y: 80, z: 1 },
            mobile: { x: 20, y: 20, z: 1 }
        };
        component.id = `${preset.id}-${Date.now()}`;

        onAddPreset(component);
        toast.success(`✨ Đã thêm "${preset.name}"!`);
    };

    return (
        <div className="quick-presets-panel">
            <div className="presets-header">
                <h3>⚡ Quick Presets</h3>
                <p className="presets-subtitle">Pre-made responsive components</p>
            </div>

            {/* Search */}
            <div className="presets-search">
                <i className="fas fa-search"></i>
                <input
                    type="text"
                    placeholder="Search presets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Category filter */}
            <div className="category-filter">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Presets grid */}
            <div className="presets-grid">
                {filteredPresets.map(preset => (
                    <div key={preset.id} className="preset-card">
                        <div className="preset-icon">{preset.icon}</div>
                        <h4 className="preset-name">{preset.name}</h4>
                        <p className="preset-desc">{preset.description}</p>
                        <button
                            className="add-preset-btn"
                            onClick={() => handleAddPreset(preset)}
                        >
                            <i className="fas fa-plus"></i>
                            Add to Page
                        </button>
                    </div>
                ))}
            </div>

            {filteredPresets.length === 0 && (
                <div className="no-presets">
                    <i className="fas fa-search"></i>
                    <p>No presets found</p>
                </div>
            )}
        </div>
    );
};

export default QuickPresets;
