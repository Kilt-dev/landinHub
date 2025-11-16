export { default as CountdownRenderer } from './CountdownRenderer';
export { default as CarouselRenderer } from './CarouselRenderer';
export { default as FormRenderer } from './FormRenderer';

// Placeholder renderers for other components
import React from 'react';
import { ChevronDown, Star, TrendingUp } from 'lucide-react';

export const AccordionRenderer = ({ componentData, styles }) => {
    const { items = [], title } = componentData;
    const [openItems, setOpenItems] = React.useState([0]);

    const toggleItem = (index) => {
        setOpenItems(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    return (
        <div style={{ width: '100%', ...styles }}>
            {title && <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700' }}>{title}</h3>}
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}
                >
                    <button
                        onClick={() => toggleItem(index)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#ffffff',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '1rem',
                            fontWeight: '600',
                        }}
                    >
                        {item.question}
                        <ChevronDown
                            size={20}
                            style={{
                                transform: openItems.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                            }}
                        />
                    </button>
                    {openItems.includes(index) && (
                        <div style={{ padding: '16px', background: '#f9fafb', color: '#6b7280' }}>
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export const TabsRenderer = ({ componentData, styles }) => {
    const { tabs = [], title, defaultTab = 0 } = componentData;
    const [activeTab, setActiveTab] = React.useState(defaultTab);

    return (
        <div style={{ width: '100%', ...styles }}>
            {title && <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700', textAlign: 'center' }}>{title}</h3>}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === index ? '2px solid #3b82f6' : '2px solid transparent',
                            color: activeTab === index ? '#3b82f6' : '#6b7280',
                            fontWeight: activeTab === index ? '600' : '400',
                            cursor: 'pointer',
                            marginBottom: '-2px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {tabs[activeTab]?.content && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                            {tabs[activeTab].content.price}
                            <span style={{ fontSize: '1rem', fontWeight: '400', color: '#6b7280' }}>/{tabs[activeTab].content.period}</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                            {tabs[activeTab].content.features?.map((feature, i) => (
                                <li key={i} style={{ padding: '8px 0', color: '#374151' }}>✓ {feature}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProgressRenderer = ({ componentData, styles }) => {
    const { items = [], title, showPercentage = true } = componentData;

    return (
        <div style={{ width: '100%', ...styles }}>
            {title && <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700' }}>{title}</h3>}
            {items.map((item, index) => (
                <div key={index} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{item.label}</span>
                        {showPercentage && <span style={{ color: '#6b7280' }}>{item.value}%</span>}
                    </div>
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${item.value}%`,
                            height: '100%',
                            background: item.color || '#3b82f6',
                            borderRadius: '4px',
                            transition: 'width 1s ease-out',
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const RatingRenderer = ({ componentData, styles }) => {
    const { rating = 0, maxRating = 5, reviews = 0, showReviews = true, color = '#fbbf24' } = componentData;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...styles }}>
            <div style={{ display: 'flex', gap: '4px' }}>
                {[...Array(maxRating)].map((_, i) => (
                    <Star
                        key={i}
                        size={24}
                        fill={i < Math.floor(rating) ? color : 'none'}
                        stroke={i < rating ? color : '#d1d5db'}
                    />
                ))}
            </div>
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>{rating.toFixed(1)}</span>
            {showReviews && <span style={{ color: '#6b7280' }}>({reviews} đánh giá)</span>}
        </div>
    );
};

export const SocialProofRenderer = ({ componentData, styles }) => {
    const { notifications = [] } = componentData;
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % notifications.length);
        }, componentData.interval || 5000);

        return () => clearInterval(timer);
    }, [notifications.length, componentData.interval]);

    if (notifications.length === 0) return null;

    const notification = notifications[currentIndex];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideInUp 0.5s ease-out',
            ...styles,
        }}>
            <img
                src={notification.avatar}
                alt={notification.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                    {notification.name} {notification.action}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {notification.product} • {notification.time}
                </div>
            </div>
        </div>
    );
};

export const SocialProofStatsRenderer = ({ componentData, styles }) => {
    const { stats = [] } = componentData;

    return (
        <div style={styles}>
            {stats.map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>
                        {stat.value}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
};
