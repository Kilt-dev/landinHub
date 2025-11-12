import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing page history with optimizations
 * Features:
 * - Limited history size (prevents memory leak)
 * - Debounced updates
 * - Efficient undo/redo
 */

const MAX_HISTORY_SIZE = 50; // Giới hạn history để tránh memory leak

export const usePageHistory = (initialPageData) => {
    const [history, setHistory] = useState([initialPageData]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const debounceTimerRef = useRef(null);

    /**
     * Add new state to history with debounce
     */
    const addToHistory = useCallback((newPageData, immediate = false) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const updateHistory = () => {
            setHistory((prev) => {
                // Remove all future history if we're not at the end
                const newHistory = prev.slice(0, historyIndex + 1);

                // Add new state
                newHistory.push(newPageData);

                // Limit history size (keep only last MAX_HISTORY_SIZE entries)
                if (newHistory.length > MAX_HISTORY_SIZE) {
                    const trimmed = newHistory.slice(-MAX_HISTORY_SIZE);
                    // Adjust index accordingly
                    setHistoryIndex(trimmed.length - 1);
                    return trimmed;
                }

                setHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        };

        if (immediate) {
            updateHistory();
        } else {
            // Debounce updates (wait 300ms before adding to history)
            debounceTimerRef.current = setTimeout(updateHistory, 300);
        }
    }, [historyIndex]);

    /**
     * Undo to previous state
     */
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            toast.info('⏪ Đã hoàn tác', { autoClose: 1000 });
            return history[historyIndex - 1];
        } else {
            toast.warning('⚠️ Không thể hoàn tác thêm', { autoClose: 1000 });
            return null;
        }
    }, [historyIndex, history]);

    /**
     * Redo to next state
     */
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            toast.info('⏩ Đã làm lại', { autoClose: 1000 });
            return history[historyIndex + 1];
        } else {
            toast.warning('⚠️ Không thể làm lại thêm', { autoClose: 1000 });
            return null;
        }
    }, [historyIndex, history]);

    /**
     * Reset history to initial state
     */
    const resetHistory = useCallback((newInitialState) => {
        setHistory([newInitialState]);
        setHistoryIndex(0);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, []);

    /**
     * Get current state
     */
    const getCurrentState = useCallback(() => {
        return history[historyIndex];
    }, [history, historyIndex]);

    /**
     * Check if can undo/redo
     */
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Cleanup on unmount
    const cleanup = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, []);

    return {
        history,
        historyIndex,
        addToHistory,
        undo,
        redo,
        resetHistory,
        getCurrentState,
        canUndo,
        canRedo,
        cleanup,
        historySize: history.length
    };
};
