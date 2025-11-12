import React, { useState, useCallback, useRef, useEffect } from 'react';
import { validateColor } from '../../../utils/validation';
import './FormInputs.css';

/**
 * Advanced color picker with presets, gradient support, and opacity
 */

const COLOR_PRESETS = [
    { name: 'Đen', value: '#000000' },
    { name: 'Trắng', value: '#ffffff' },
    { name: 'Xám nhạt', value: '#f3f4f6' },
    { name: 'Xám đậm', value: '#1f2937' },
    { name: 'Xanh dương', value: '#2563eb' },
    { name: 'Xanh lá', value: '#10b981' },
    { name: 'Vàng', value: '#eab308' },
    { name: 'Cam', value: '#f59e0b' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Hồng', value: '#ec4899' },
    { name: 'Tím', value: '#8b5cf6' },
];

const GRADIENT_PRESETS = [
    { name: 'Không gradient', value: '' },
    { name: 'Tím - Hồng', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Xanh dương', value: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' },
    { name: 'Xanh lá', value: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { name: 'Hoàng hôn', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
    { name: 'Cầu vồng', value: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #4facfe)' },
];

const ColorPicker = ({
    label,
    value,
    onChange,
    allowGradient = false,
    showOpacity = true,
    helpText
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const [colorValue, setColorValue] = useState(value || '#000000');
    const [opacity, setOpacity] = useState(1);
    const [error, setError] = useState('');
    const pickerRef = useRef(null);

    // Parse color to get opacity
    useEffect(() => {
        if (value && value.startsWith('rgba')) {
            const match = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                const a = parseFloat(match[4]);
                setColorValue(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
                setOpacity(a);
            }
        } else if (value) {
            setColorValue(value);
        }
    }, [value]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showPicker]);

    const handleColorChange = useCallback((newColor) => {
        setColorValue(newColor);

        // Validate and apply
        const result = validateColor(newColor);
        if (result.valid) {
            // Apply with opacity if needed
            if (showOpacity && opacity < 1) {
                const hex = newColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                onChange(`rgba(${r}, ${g}, ${b}, ${opacity})`);
            } else {
                onChange(newColor);
            }
            setError('');
        } else {
            setError(result.error);
        }
    }, [onChange, showOpacity, opacity]);

    const handleOpacityChange = useCallback((newOpacity) => {
        setOpacity(newOpacity);

        // Apply color with new opacity
        if (colorValue) {
            const hex = colorValue.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            onChange(`rgba(${r}, ${g}, ${b}, ${newOpacity})`);
        }
    }, [colorValue, onChange]);

    const handleGradientSelect = useCallback((gradient) => {
        if (gradient) {
            onChange(gradient);
            setShowPicker(false);
        } else {
            // Remove gradient, back to solid color
            handleColorChange(colorValue);
        }
    }, [onChange, colorValue, handleColorChange]);

    return (
        <div className="form-input-group color-picker-group">
            <label className="form-label">{label}</label>

            <div className="color-picker-trigger" onClick={() => setShowPicker(!showPicker)}>
                <div
                    className="color-preview"
                    style={{
                        background: value || colorValue,
                        border: '2px solid #e5e7eb'
                    }}
                />
                <input
                    type="text"
                    className="form-input color-input"
                    value={value || colorValue}
                    readOnly
                />
                <button type="button" className="color-picker-btn">
                    <i className="fas fa-palette"></i>
                </button>
            </div>

            {showPicker && (
                <div className="color-picker-dropdown" ref={pickerRef}>
                    {/* Native color picker */}
                    <div className="native-color-picker">
                        <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="native-color-input"
                        />
                        <span className="color-value">{colorValue}</span>
                    </div>

                    {/* Opacity slider */}
                    {showOpacity && (
                        <div className="opacity-control">
                            <label>Độ trong suốt: {Math.round(opacity * 100)}%</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={opacity}
                                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                                className="opacity-slider"
                            />
                        </div>
                    )}

                    {/* Color presets */}
                    <div className="color-presets">
                        <label>Màu thường dùng:</label>
                        <div className="preset-grid">
                            {COLOR_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className="preset-color"
                                    style={{ background: preset.value }}
                                    onClick={() => handleColorChange(preset.value)}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Gradient presets */}
                    {allowGradient && (
                        <div className="gradient-presets">
                            <label>Gradient:</label>
                            <div className="gradient-list">
                                {GRADIENT_PRESETS.map(preset => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        className="gradient-preset"
                                        style={{ background: preset.value || '#ffffff' }}
                                        onClick={() => handleGradientSelect(preset.value)}
                                        title={preset.name}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="form-error">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {helpText && !error && (
                <div className="form-help">
                    <i className="fas fa-info-circle"></i>
                    {helpText}
                </div>
            )}
        </div>
    );
};

export default ColorPicker;
