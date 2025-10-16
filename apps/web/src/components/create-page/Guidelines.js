import React from 'react';

const Guidelines = ({ guidelines, zoomLevel }) => {
    return (
        <>
            {guidelines.map((guide, index) => (
                <div
                    key={index}
                    style={{
                        position: 'absolute',
                        background: '#2563eb',
                        opacity: 0.5,
                        zIndex: 1000,
                        ...(guide.vertical
                            ? { left: guide.position * (zoomLevel / 100), top: 0, width: '1px', height: '100%' }
                            : { top: guide.position * (zoomLevel / 100), left: 0, height: '1px', width: '100%' }),
                    }}
                />
            ))}
        </>
    );
};

export default Guidelines;
