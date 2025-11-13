import React, { useEffect, useState, useRef } from 'react';
import './TextSelectionToolbar.css';

/**
 * Floating Toolbar for Text Selection
 * Shows AI button when text is selected in canvas elements
 */
const TextSelectionToolbar = ({ onAIClick }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const toolbarRef = useRef(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            // Check if selection is within canvas elements (has lpb- classes)
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const container = range?.commonAncestorContainer?.parentElement;

            // Check if selection is in a canvas element
            const isInCanvas = container?.closest('.lpb-canvas') ||
                               container?.closest('.lpb-child-element') ||
                               container?.closest('.lpb-element');

            if (text && text.length > 0 && isInCanvas) {
                setSelectedText(text);

                // Get selection position
                const rect = range.getBoundingClientRect();
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 50 // Position above selection
                });
                setIsVisible(true);
            } else {
                setIsVisible(false);
                setSelectedText('');
            }
        };

        // Listen to selection changes
        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
        };
    }, []);

    const handleAIClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (onAIClick && selectedText) {
            onAIClick(selectedText);
        }

        // Clear selection after opening modal
        window.getSelection().removeAllRanges();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            ref={toolbarRef}
            className="text-selection-toolbar"
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translateX(-50%)',
                zIndex: 10000,
            }}
        >
            <button
                className="text-selection-ai-btn"
                onClick={handleAIClick}
                title="Tạo nội dung với AI"
            >
                <span>Tạo với AI</span>
            </button>
        </div>
    );
};

export default TextSelectionToolbar;
