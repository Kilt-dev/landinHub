import React from 'react';

const Rulers = ({ canvasWidth, canvasHeight, zoomLevel }) => {
    const tickSpacing = 50;
    const horizontalTicks = Array.from({ length: Math.ceil(canvasWidth / tickSpacing) }, (_, i) => i * tickSpacing);
    const verticalTicks = Array.from({ length: Math.ceil(canvasHeight / tickSpacing) }, (_, i) => i * tickSpacing);

    return (
        <>
            <div className="lpb-ruler lpb-ruler-horizontal">
                {horizontalTicks.map((tick) => (
                    <div
                        key={tick}
                        className="lpb-ruler-tick lpb-ruler-tick-horizontal"
                        style={{ left: tick / (zoomLevel / 100) }}
                    >
                        {tick}
                    </div>
                ))}
            </div>
            <div className="lpb-ruler lpb-ruler-vertical">
                {verticalTicks.map((tick) => (
                    <div
                        key={tick}
                        className="lpb-ruler-tick lpb-ruler-tick-vertical"
                        style={{ top: tick / (zoomLevel / 100) }}
                    >
                        {tick}
                    </div>
                ))}
            </div>
        </>
    );
};

export default Rulers;