import React, { useEffect, useState } from 'react';
import { sections } from '../../constants/sections';

const SectionPopup = ({ showPopup, setShowPopup, viewMode, handleAddSection }) => {
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const handleClosePopup = (e) => {
            if (e.key === 'Escape') {
                setShowPopup(false);
            }
        };
        document.addEventListener('keydown', handleClosePopup);
        return () => document.removeEventListener('keydown', handleClosePopup);
    }, [setShowPopup]);

    useEffect(() => {
        // Reset tab khi mở popup
        if (showPopup) {
            setActiveTab(0);
        }
    }, [showPopup]);

    if (!showPopup) return null;

    const categories = sections.subCategories || [];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setShowPopup(false)}
        >
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { 
                            opacity: 0;
                            transform: translateY(20px); 
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0); 
                        }
                    }
                    .section-popup-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .section-popup-scrollbar::-webkit-scrollbar-track {
                        background: #f8fafc;
                        border-radius: 4px;
                    }
                    .section-popup-scrollbar::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 4px;
                    }
                    .section-popup-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                    }
                `}
            </style>
            <div
                style={{
                    position: 'relative',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    zIndex: 10000,
                    width: viewMode === 'mobile' ? '95%' : viewMode === 'tablet' ? '85%' : '900px',
                    maxWidth: '95vw',
                    height: viewMode === 'mobile' ? '90vh' : '85vh',
                    maxHeight: '900px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s ease',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Fixed */}
                <div
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: viewMode === 'mobile' ? '20px 16px' : '24px 32px',
                        borderRadius: '16px 16px 0 0',
                        flexShrink: 0,
                    }}
                >
                    <h2
                        style={{
                            fontSize: viewMode === 'mobile' ? '1.25rem' : '1.75rem',
                            fontWeight: '600',
                            margin: 0,
                            color: '#ffffff',
                            textAlign: 'center',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Chọn Section Template
                    </h2>
                    <p
                        style={{
                            fontSize: viewMode === 'mobile' ? '0.875rem' : '0.95rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            textAlign: 'center',
                            margin: '8px 0 0',
                        }}
                    >
                        {categories.length} danh mục • {categories.reduce((sum, cat) => sum + (cat.templates?.length || 0), 0)} templates
                    </p>

                    {/* Close Button */}
                    <button
                        onClick={() => setShowPopup(false)}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            width: '32px',
                            height: '32px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            fontWeight: '300',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Tabs Navigation - Fixed */}
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        padding: viewMode === 'mobile' ? '12px 16px' : '16px 32px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e5e7eb',
                        overflowX: 'auto',
                        flexShrink: 0,
                    }}
                    className="section-popup-scrollbar"
                >
                    {categories.map((category, index) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveTab(index)}
                            style={{
                                padding: viewMode === 'mobile' ? '8px 16px' : '10px 20px',
                                background: activeTab === index ? '#ffffff' : 'transparent',
                                color: activeTab === index ? '#1e293b' : '#64748b',
                                border: activeTab === index ? '1px solid #e5e7eb' : '1px solid transparent',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: viewMode === 'mobile' ? '0.875rem' : '0.95rem',
                                fontWeight: activeTab === index ? '600' : '500',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === index ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== index) {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.color = '#475569';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== index) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#64748b';
                                }
                            }}
                        >
                            {category.name}
                            <span
                                style={{
                                    marginLeft: '8px',
                                    padding: '2px 8px',
                                    background: activeTab === index ? '#3b82f6' : '#e5e7eb',
                                    color: activeTab === index ? '#ffffff' : '#64748b',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                }}
                            >
                                {category.templates?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content - Scrollable */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: viewMode === 'mobile' ? '16px' : '24px 32px',
                        background: '#ffffff',
                    }}
                    className="section-popup-scrollbar"
                >
                    {categories[activeTab] && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    viewMode === 'mobile'
                                        ? '1fr'
                                        : viewMode === 'tablet'
                                            ? 'repeat(auto-fill, minmax(240px, 1fr))'
                                            : 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: viewMode === 'mobile' ? '16px' : '20px',
                            }}
                        >
                            {categories[activeTab].templates?.map((template) => (
                                <div
                                    key={template.id}
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        background: '#ffffff',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onClick={() => {
                                        handleAddSection(template);
                                        setShowPopup(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = '#3b82f6';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    {/* Preview Image */}
                                    <div
                                        style={{
                                            width: '100%',
                                            height: viewMode === 'mobile' ? '140px' : '160px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            marginBottom: '12px',
                                            background: '#f1f5f9',
                                        }}
                                    >
                                        <img
                                            src={template.previewImage}
                                            alt={template.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        />
                                    </div>

                                    {/* Template Info */}
                                    <h4
                                        style={{
                                            fontSize: viewMode === 'mobile' ? '0.95rem' : '1rem',
                                            fontWeight: '600',
                                            margin: '0 0 6px',
                                            color: '#1e293b',
                                            lineHeight: '1.3',
                                        }}
                                    >
                                        {template.name}
                                    </h4>
                                    <p
                                        style={{
                                            fontSize: viewMode === 'mobile' ? '0.8rem' : '0.875rem',
                                            color: '#64748b',
                                            margin: '0 0 12px',
                                            lineHeight: '1.5',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {template.description}
                                    </p>

                                    {/* Add Button */}
                                    <button
                                        style={{
                                            width: '100%',
                                            padding: viewMode === 'mobile' ? '8px 16px' : '10px 20px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: viewMode === 'mobile' ? '0.875rem' : '0.95rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddSection(template);
                                            setShowPopup(false);
                                        }}
                                    >
                                        <span style={{ fontSize: '18px', fontWeight: '300' }}>+</span>
                                        Thêm Section
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {(!categories[activeTab] || !categories[activeTab].templates || categories[activeTab].templates.length === 0) && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '60px 20px',
                                color: '#94a3b8',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '64px',
                                    marginBottom: '16px',
                                    opacity: 0.3,
                                }}
                            >
                                📦
                            </div>
                            <p
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    margin: 0,
                                    color: '#64748b',
                                }}
                            >
                                Chưa có template nào
                            </p>
                            <p
                                style={{
                                    fontSize: '0.875rem',
                                    margin: '8px 0 0',
                                    color: '#94a3b8',
                                }}
                            >
                                Thử chọn danh mục khác
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SectionPopup;