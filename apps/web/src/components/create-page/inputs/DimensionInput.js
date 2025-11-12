import React, { useState, useCallback } from 'react';
import { validateDimension } from '../../../utils/validation';
import './FormInputs.css';

/**
 * Smart dimension input with unit selector
 * Supports: px, %, rem, em, vw, vh
 */
const DimensionInput = ({
    label,
    value,
    onChange,
    min = 0,
    max = 5000,
    defaultUnit = 'px',
    allowedUnits = ['px', '%', 'rem', 'em', 'vw', 'vh'],
    placeholder = '100',
    helpText,
    required = false
}) => {
    // Parse current value
    const parseValue = (val) => {
        if (!val) return { number: '', unit: defaultUnit };
        const match = String(val).match(/^(\d+(?:\.\d+)?)\s*([a-z%]+)?$/i);
        if (match) {
            return {
                number: match[1],
                unit: match[2] || defaultUnit
            };
        }
        return { number: val, unit: defaultUnit };
    };

    const [input, setInput] = useState(parseValue(value));
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleNumberChange = useCallback((e) => {
        const newNumber = e.target.value;
        setInput(prev => ({ ...prev, number: newNumber }));

        // Clear error when typing
        setError('');
    }, []);

    const handleUnitChange = useCallback((e) => {
        const newUnit = e.target.value;
        setInput(prev => ({ ...prev, unit: newUnit }));

        // Immediately update with new unit
        if (input.number) {
            const newValue = `${input.number}${newUnit}`;
            const result = validateDimension(newValue, {
                min,
                max,
                allowedUnits,
                defaultUnit,
                fieldName: label
            });

            if (result.valid) {
                onChange(result.value);
                setError('');
            } else {
                setError(result.error);
            }
        }
    }, [input.number, onChange, min, max, allowedUnits, defaultUnit, label]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);

        if (!input.number && !required) {
            setError('');
            return;
        }

        const fullValue = `${input.number}${input.unit}`;
        const result = validateDimension(fullValue, {
            min,
            max,
            allowedUnits,
            defaultUnit,
            fieldName: label
        });

        if (result.valid) {
            onChange(result.value);
            setError('');
        } else {
            setError(result.error);
        }
    }, [input, onChange, min, max, allowedUnits, defaultUnit, label, required]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setError('');
    }, []);

    return (
        <div className={`form-input-group ${error ? 'has-error' : ''} ${isFocused ? 'is-focused' : ''}`}>
            <label className="form-label">
                {label}
                {required && <span className="required-mark">*</span>}
            </label>

            <div className="dimension-input-wrapper">
                <input
                    type="number"
                    className="form-input dimension-number"
                    value={input.number}
                    onChange={handleNumberChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    step={input.unit === 'px' ? 1 : 0.1}
                />

                <select
                    className="form-select dimension-unit"
                    value={input.unit}
                    onChange={handleUnitChange}
                >
                    {allowedUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                    ))}
                </select>
            </div>

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

export default DimensionInput;
