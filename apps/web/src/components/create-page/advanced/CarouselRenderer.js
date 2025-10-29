import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const CarouselRenderer = ({ componentData, styles }) => {
    const { slides = [], autoplay = true, interval = 5000, showDots = true, showArrows = true } = componentData;
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (!autoplay || slides.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoplay, interval, slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    if (slides.length === 0) {
        return <div style={styles}>No slides available</div>;
    }

    const slide = slides[currentSlide];

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            ...styles,
        }}>
            {/* Slide Content */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '30px',
                textAlign: 'center',
            }}>
                {slide.avatar && (
                    <img
                        src={slide.avatar}
                        alt={slide.author}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            marginBottom: '20px',
                            objectFit: 'cover',
                            border: '3px solid #f3f4f6',
                        }}
                    />
                )}
                {slide.image && (
                    <img
                        src={slide.image}
                        alt={slide.title}
                        style={{
                            width: '100%',
                            maxHeight: '250px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            marginBottom: '20px',
                        }}
                    />
                )}
                {slide.content && (
                    <p style={{
                        fontSize: '1.125rem',
                        lineHeight: 1.6,
                        color: '#374151',
                        marginBottom: '20px',
                        fontStyle: 'italic',
                    }}>
                        "{slide.content}"
                    </p>
                )}
                {slide.title && (
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '8px',
                    }}>
                        {slide.title}
                    </h3>
                )}
                {slide.price && (
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#3b82f6',
                        marginBottom: '8px',
                    }}>
                        {slide.price}
                    </div>
                )}
                {slide.description && (
                    <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                    }}>
                        {slide.description}
                    </p>
                )}
                {slide.author && (
                    <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                    }}>
                        {slide.author}
                    </div>
                )}
                {slide.rating && (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                size={20}
                                fill={i < slide.rating ? '#fbbf24' : 'none'}
                                stroke={i < slide.rating ? '#fbbf24' : '#d1d5db'}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Arrows */}
            {showArrows && slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}
                    >
                        <ChevronLeft size={24} color="#1f2937" />
                    </button>
                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}
                    >
                        <ChevronRight size={24} color="#1f2937" />
                    </button>
                </>
            )}

            {/* Dots */}
            {showDots && slides.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                }}>
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            style={{
                                width: currentSlide === index ? '24px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: currentSlide === index ? '#3b82f6' : '#d1d5db',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CarouselRenderer;
