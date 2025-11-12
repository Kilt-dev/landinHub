import React, { useState, useEffect } from 'react';

const CountdownRenderer = ({ componentData, styles }) => {
    const { targetDate, labels = {}, style = 'modern' } = componentData;
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                if (componentData.onComplete) {
                    // Trigger completion event
                    console.log('Countdown complete:', componentData.onComplete);
                }
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate, componentData.onComplete]);

    const TimeUnit = ({ value, label }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
        }}>
            <div style={{
                background: style === 'modern' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderRadius: '12px',
                padding: '16px 24px',
                minWidth: '100px',
                textAlign: 'center',
                backdropFilter: style === 'modern' ? 'blur(10px)' : 'none',
                border: style === 'modern' ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
            }}>
                <div style={{
                    fontSize: style === 'modern' ? '3rem' : '2rem',
                    fontWeight: '700',
                    color: styles.color || '#ffffff',
                    lineHeight: 1,
                }}>
                    {String(value).padStart(2, '0')}
                </div>
            </div>
            <div style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: styles.color || '#ffffff',
                opacity: 0.8,
                textTransform: 'uppercase',
                letterSpacing: '1px',
            }}>
                {label}
            </div>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            ...styles,
        }}>
            <TimeUnit value={timeLeft.days} label={labels.days || 'Days'} />
            <TimeUnit value={timeLeft.hours} label={labels.hours || 'Hours'} />
            <TimeUnit value={timeLeft.minutes} label={labels.minutes || 'Mins'} />
            <TimeUnit value={timeLeft.seconds} label={labels.seconds || 'Secs'} />
        </div>
    );
};

export default CountdownRenderer;
