import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import './SupportChatbox.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const SupportChatbox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [aiStreaming, setAiStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState('');
    const [roomInfo, setRoomInfo] = useState(null); // Track room info (hasAdmin, aiEnabled, etc.)

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    // Initialize chat room
    useEffect(() => {
        if (isOpen && !roomId) {
            initializeChatRoom();
        }
    }, [isOpen]);

    // Initialize Socket.IO
    useEffect(() => {
        if (roomId && !socketRef.current) {
            const token = localStorage.getItem('token');
            if (!token) return;

            const socket = io(API_URL, {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                console.log('✅ Socket.IO connected');
                setIsConnected(true);
                socket.emit('join_room', { roomId });
            });

            socket.on('disconnect', () => {
                console.log('❌ Socket.IO disconnected');
                setIsConnected(false);
            });

            socket.on('joined_room', (data) => {
                console.log('Joined room:', data.roomId);
            });

            socket.on('new_message', (data) => {
                setMessages(prev => [...prev, {
                    id: data.id,
                    sender_type: data.sender_type,
                    message: data.message,
                    created_at: data.created_at
                }]);
            });

            socket.on('ai_response_start', (data) => {
                setAiStreaming(true);
                setStreamingMessage('');
            });

            socket.on('ai_response_chunk', (data) => {
                setStreamingMessage(data.fullText);
            });

            socket.on('ai_response_complete', (data) => {
                setAiStreaming(false);
                setStreamingMessage('');
                setMessages(prev => [...prev, {
                    id: data.messageId,
                    sender_type: 'bot',
                    message: data.message,
                    created_at: data.created_at
                }]);
            });

            socket.on('user_typing', () => {
                setIsTyping(true);
            });

            socket.on('user_stop_typing', () => {
                setIsTyping(false);
            });

            socket.on('admin_joined', () => {
                // Admin joined - reload room info
                console.log('Admin joined');
                setRoomInfo(prev => ({ ...prev, admin_id: true, ai_enabled: false }));
            });

            socket.on('escalated_to_admin', () => {
                console.log('Request escalated to admin');
            });

            socket.on('room_deescalated', (data) => {
                console.log('Room de-escalated, back to AI');
                setRoomInfo(prev => ({ ...prev, admin_id: null, ai_enabled: true }));
            });

            socket.on('error', (data) => {
                console.error('Socket error:', data.message);
                alert(data.message);
            });

            socketRef.current = socket;

            return () => {
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [roomId]);

    const initializeChatRoom = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/chat/rooms`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setRoomId(response.data.room.id);
                setRoomInfo(response.data.room); // Save room info
                loadMessages(response.data.room.id);
            }
        } catch (error) {
            console.error('Error initializing chat room:', error);
            alert('Không thể khởi tạo chat. Vui lòng đăng nhập lại.');
        }
    };

    const loadMessages = async (chatRoomId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/chat/rooms/${chatRoomId}/messages`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim() || !socketRef.current) return;

        const message = inputMessage.trim();
        setInputMessage('');

        // Send via Socket.IO with AI response
        socketRef.current.emit('send_message_with_ai', {
            roomId,
            message
        });
    };

    const handleInputChange = (e) => {
        setInputMessage(e.target.value);

        // Emit typing indicator
        if (socketRef.current) {
            socketRef.current.emit('typing', { roomId });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 1 second of no input
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('stop_typing', { roomId });
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleDeEscalate = async () => {
        if (!roomId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/chat/rooms/${roomId}/de-escalate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                console.log('✅ De-escalated to AI:', response.data);
                setRoomInfo(response.data.room);
            }
        } catch (error) {
            console.error('Error de-escalating:', error);
            alert('Không thể chuyển về chat với AI. Vui lòng thử lại.');
        }
    };

    return (
        <>
            {/* Chat Button */}
            <div className="chat-button" onClick={toggleChat}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
                </svg>
                {!isConnected && isOpen && (
                    <span className="connection-indicator offline"></span>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div>
                            <h3>Hỗ trợ LandingHub</h3>
                            <span className="chat-status">
                {isConnected ? (
                    <>
                        <span className="status-dot online"></span>
                        {roomInfo?.admin_id ? ' Admin đang hỗ trợ' : ' AI đang hỗ trợ'}
                    </>
                ) : (
                    <>
                        <span className="status-dot offline"></span> Không kết nối
                    </>
                )}
              </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {roomInfo?.admin_id && (
                                <button
                                    className="deescalate-btn"
                                    onClick={handleDeEscalate}
                                    title="Quay lại chat với AI"
                                    style={{
                                        background: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}
                                >
                                    🤖 Chat với AI
                                </button>
                            )}
                            <button className="close-btn" onClick={toggleChat}>✕</button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={msg.id ?? `msg-${msg.sender_type}-${index}-${msg.created_at || Date.now()}`}
                                className={`message ${msg.sender_type === 'user' ? 'user' : 'bot'}`}
                            >
                                <div className="message-content">
                                    {msg.message_type === 'system' ? (
                                        <em>{msg.message}</em>
                                    ) : (
                                        msg.message
                                    )}
                                </div>
                                <div className="message-time">
                                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* AI Streaming Message */}
                        {aiStreaming && streamingMessage && (
                            <div className="message bot">
                                <div className="message-content streaming">
                                    {streamingMessage}
                                    <span className="cursor">▊</span>
                                </div>
                            </div>
                        )}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input">
            <textarea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                rows="1"
                disabled={!isConnected}
            />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || !isConnected}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SupportChatbox;