import { useEffect, useRef } from 'react';

/**
 * Custom hook for polling API endpoints
 * Replaces Socket.IO on Lambda production
 *
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling is enabled
 */
export const usePolling = (callback, interval = 3000, enabled = true) => {
    const savedCallback = useRef();
    const intervalRef = useRef();

    // Remember the latest callback
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        }

        const tick = () => {
            if (savedCallback.current) {
                savedCallback.current();
            }
        };

        // Call immediately on mount
        tick();

        // Then set up interval
        intervalRef.current = setInterval(tick, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [interval, enabled]);

    return intervalRef;
};

/**
 * Hook for polling messages in a chat room
 */
export const useChatPolling = (roomId, onNewMessages, enabled = true) => {
    const lastMessageIdRef = useRef(null);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const pollMessages = async () => {
        if (!roomId) return;

        try {
            const response = await fetch(
                `${API_URL}/api/chat/rooms/${roomId}/messages${lastMessageIdRef.current ? `?after=${lastMessageIdRef.current}` : ''}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) return;

            const data = await response.json();

            if (data.messages && data.messages.length > 0) {
                // Update last message ID
                const latestMessage = data.messages[data.messages.length - 1];
                lastMessageIdRef.current = latestMessage._id;

                // Call callback with new messages
                onNewMessages(data.messages);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    usePolling(pollMessages, 3000, enabled);
};

export default usePolling;
