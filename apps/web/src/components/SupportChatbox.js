import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Badge,
    Tooltip,
    CircularProgress,
    Button,
    Chip,
    Divider,
    Paper,
    Fade,
    Zoom,
    Snackbar,
    Alert,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating
} from '@mui/material';
import {
    Chat as ChatIcon,
    Close as CloseIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    Support as SupportIcon,
    Star as StarIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// ✅ WebSocket imports
import {
    initSocket,
    disconnectSocket,
    on,
    onRoomUpdate,
    onChatUpdate,
    joinRoom,
    leaveRoom,
    getStatus
} from '../utils/socket';

// Styled components
const ChatContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isOpen'
})(({ theme, isOpen }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: isOpen ? 380 : 60,
    height: isOpen ? 600 : 60,
    backgroundColor: '#fff',
    borderRadius: isOpen ? 16 : 30,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 9999,
    overflow: 'hidden'
}));

const ChatButton = styled(IconButton)(({ theme }) => ({
    width: 60,
    height: 60,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    '&:hover': {
        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
        transform: 'scale(1.05)'
    },
    transition: 'all 0.2s'
}));

const ChatHeader = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    '&::-webkit-scrollbar': {
        width: '6px'
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '3px'
    }
}));

const MessageBubble = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isBot'
})(({ theme, isOwn, isBot }) => ({
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    backgroundColor: isBot ? '#e3f2fd' : isOwn ? '#667eea' : '#fff',
    color: isBot ? '#1976d2' : isOwn ? '#fff' : '#000',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    wordWrap: 'break-word',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    position: 'relative'
}));

const InputContainer = styled(Box)(({ theme }) => ({
    padding: '16px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end'
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: '4px',
    padding: '10px 14px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: 'fit-content',
    alignItems: 'center',
    '& .dot': {
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: '#999',
        animation: 'typing 1.4s infinite',
        '&:nth-of-type(2)': {
            animationDelay: '0.2s'
        },
        '&:nth-of-type(3)': {
            animationDelay: '0.4s'
        }
    },
    '@keyframes typing': {
        '0%, 60%, 100%': {
            transform: 'translateY(0)',
            opacity: 0.7
        },
        '30%': {
            transform: 'translateY(-10px)',
            opacity: 1
        }
    }
}));

const QuickActionButton = styled(Button)(({ theme }) => ({
    borderRadius: 20,
    textTransform: 'none',
    padding: '8px 16px',
    fontSize: '0.85rem'
}));

const SupportChatbox = () => {
    const { user } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [room, setRoom] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [adminOnline, setAdminOnline] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState({});
    const [requestingAdmin, setRequestingAdmin] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [failedMessages, setFailedMessages] = useState(new Set());
    const [imagePreview, setImagePreview] = useState(null);
    const [ratingDialog, setRatingDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const socketCleanupRef = useRef({});
    const currentRoomIdRef = useRef(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Helper function to show toast notifications
    const showToast = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const lastMessageIdRef = useRef(null);

    // 🚀 WEBSOCKET: Initialize connection and listeners
    useEffect(() => {
        if (!user) return;

        const socket = initSocket();

        socketCleanupRef.current.handleConnected = on('connected', () => {
            setSocketConnected(true);
            showToast('✅ Kết nối realtime thành công', 'success');
        });

        socketCleanupRef.current.handleDisconnected = on('disconnected', () => {
            setSocketConnected(false);
            showToast('❌ Mất kết nối, dùng refresh thủ công', 'warning');
        });

        socketCleanupRef.current.handleNotConfigured = on('not_configured', () => {
            setSocketConnected(false);
            showToast('ℹ️ Chế độ manual refresh', 'info');
        });

        // Lắng nghe tin nhắn mới
        socketCleanupRef.current.handleChatUpdate = onChatUpdate((data) => {
            if (data.roomId === room?._id) {
                setMessages(prev => {
                    const exists = prev.some(msg => msg._id === data.message._id);
                    if (!exists) {
                        const filtered = prev.filter(msg => !msg.__optimistic);
                        return [...filtered, data.message];
                    }
                    return prev;
                });
                scrollToBottom();

                // Phát hiện admin vào hỗ trợ
                if (data.message.sender_type === 'admin' && !adminOnline) {
                    setAdminOnline(true);
                    showToast('Admin đã vào hỗ trợ! 👨‍💼', 'success');
                }
            }
        });

        // Lắng nghe cập nhật phòng
        // Thay thế phần socket listener về admin
        socketCleanupRef.current.handleRoomUpdate = onRoomUpdate((data) => {
            if (data.roomId === room?._id) {
                setRoom(prev => ({ ...prev, ...data.room }));

                // ✅ Phát hiện admin được assign
                if (data.room.admin_id && (!prev?.admin_id || !prev.admin_id._id)) {
                    setAdminOnline(true);
                    showToast('Admin đã vào hỗ trợ! 👨‍💼', 'success');
                }

                // ✅ Phát hiện phòng đóng
                if (data.room.status === 'resolved' && room?.status !== 'resolved') {
                    showToast('Cuộc hội thoại đã kết thúc', 'info');
                    setTimeout(() => setRatingDialog(true), 1000);
                }
            }
        });

        return () => {
            Object.values(socketCleanupRef.current).forEach(cleanup => {
                if (typeof cleanup === 'function') cleanup();
            });
            disconnectSocket(true);
            setSocketConnected(false);
        };
    }, [user, room]);

    // 🚀 WEBSOCKET: Join/leave room khi phòng thay đổi
    useEffect(() => {
        if (room && socketConnected) {
            joinRoom(room._id);
            currentRoomIdRef.current = room._id;
            return () => {
                leaveRoom(room._id);
                currentRoomIdRef.current = null;
            };
        }
    }, [room, socketConnected]);

    // Load messages for a room
    const loadMessagesForRoom = async (roomId) => {
        try {
            const messagesResponse = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setMessages(messagesResponse.data.messages);
            scrollToBottom(true);
        } catch (error) {
            console.error('Failed to load messages:', error);
            if (error.response?.status === 401) {
                showToast('Phiên đăng nhập hết hạn', 'error');
            }
        }
    };

    // Get or create chat room
    const initializeChatRoom = async () => {
        try {
            setIsLoading(true);
            const context = {
                page: window.location.pathname,
                action: determineAction(window.location.pathname),
                timestamp: new Date().toISOString()
            };

            const response = await axios.post(`${API_URL}/api/chat/rooms`,
                { context },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            const roomData = response.data.room;
            setRoom(roomData);
            currentRoomIdRef.current = roomData._id;

            await loadMessagesForRoom(roomData._id);
            setUnreadCount(0);
            lastMessageIdRef.current = null;

            scrollToBottom(true);
        } catch (error) {
            console.error('❌ Failed to initialize chat:', error);
            showToast('Không thể khởi tạo chat. Vui lòng thử lại.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const determineAction = (path) => {
        if (path.includes('/create')) return 'building';
        if (path.includes('/marketplace')) return 'marketplace';
        if (path.includes('/payment')) return 'payment';
        if (path.includes('/dashboard')) return 'dashboard';
        return 'general';
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (!room) {
            initializeChatRoom();
        } else {
            setUnreadCount(0);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    // Manual refresh function
    const handleManualRefresh = async () => {
        if (room) {
            await loadMessagesForRoom(room._id);
            showToast('Đã làm mới tin nhắn', 'success');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !room) return;

        const messageText = inputMessage.trim();
        setInputMessage('');

        const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            room_id: room._id,
            sender_id: user,
            sender_type: 'user',
            message: messageText,
            message_type: 'text',
            createdAt: new Date().toISOString(),
            __optimistic: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom(true);

        try {
            await axios.post(
                `${API_URL}/api/chat/rooms/${room._id}/messages`,
                {
                    message: messageText,
                    message_type: 'text',
                    enableAI: !room.admin_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
        } catch (error) {
            console.error('Send message error:', error);
            showToast('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
            setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        }
    };

    const handleTyping = (e) => {
        setInputMessage(e.target.value);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !room) return;

        if (file.size > 10 * 1024 * 1024) {
            showToast('File quá lớn! Tối đa 10MB', 'error');
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                `${API_URL}/api/chat/rooms/${room._id}/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                }
            );

            await axios.post(
                `${API_URL}/api/chat/rooms/${room._id}/messages`,
                {
                    message: file.type.startsWith('image/') ? `🖼️ ${file.name}` : `📎 ${file.name}`,
                    message_type: response.data.file.type,
                    attachments: [response.data.file]
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            showToast('Upload thành công! ✅', 'success');
            setImagePreview(null);
        } catch (error) {
            console.error('File upload error:', error);
            showToast('Không thể upload file. Vui lòng thử lại.', 'error');
            setImagePreview(null);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleQuickAction = (question) => {
        setInputMessage(question);
        setTimeout(() => handleSendMessage(), 100);
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            setUserScrolledUp(distanceFromBottom > 100);
        }
    };

    const scrollToBottom = (force = false) => {
        if (force || !userScrolledUp) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAIFeedback = async (messageId, isHelpful) => {
        try {
            await axios.post(
                `${API_URL}/api/chat/feedback`,
                { messageId, isHelpful, roomId: room._id },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setFeedbackGiven(prev => ({ ...prev, [messageId]: isHelpful }));

            if (!isHelpful) {
                setTimeout(() => {
                    const shouldConnectAdmin = window.confirm(
                        'Xin lỗi câu trả lời chưa hữu ích. Bạn có muốn kết nối với Admin không?'
                    );
                    if (shouldConnectAdmin) {
                        handleRequestAdmin();
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    const handleRequestAdmin = async () => {
        if (!room || requestingAdmin) return;

        setRequestingAdmin(true);

        try {
            await axios.post(
                `${API_URL}/api/chat/request-admin`,
                { roomId: room._id, reason: 'user_requested' },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            showToast('Đã gửi yêu cầu đến Admin. Admin sẽ hỗ trợ bạn trong giây lát! 👨‍💼', 'success');
        } catch (error) {
            console.error('Request admin error:', error);
            showToast('Không thể kết nối với Admin. Vui lòng thử lại sau.', 'error');
        } finally {
            setRequestingAdmin(false);
        }
    };

    const handleSubmitRating = async () => {
        if (!room || rating === 0) {
            showToast('Vui lòng chọn số sao đánh giá', 'warning');
            return;
        }

        try {
            await axios.post(
                `${API_URL}/api/chat/rooms/${room._id}/rate`,
                { score: rating, feedback: ratingFeedback },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            showToast('Cảm ơn đánh giá của bạn! ⭐', 'success');
            setRatingDialog(false);
            setRating(0);
            setRatingFeedback('');
        } catch (error) {
            console.error('Rating error:', error);
            showToast('Không thể gửi đánh giá. Vui lòng thử lại.', 'error');
        }
    };

    if (!user || user.role === 'admin') return null;

    return (
        <>
            <ChatContainer isOpen={isOpen}>
                {!isOpen ? (
                    <Tooltip title="Hỗ trợ" placement="left">
                        <ChatButton onClick={handleOpen}>
                            <Badge badgeContent={unreadCount} color="error">
                                <SupportIcon sx={{ fontSize: 28 }} />
                            </Badge>
                        </ChatButton>
                    </Tooltip>
                ) : (
                    <>
                        <ChatHeader>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}>
                                    <SupportIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Hỗ trợ Landing Hub
                                    </Typography>
                                    <Typography variant="caption">
                                        {/* ✅ Hiển thị trạng thái kết nối */}
                                        {adminOnline ? (
                                            <><span style={{color: '#4ade80'}}>●</span> Admin đang online</>
                                        ) : socketConnected ? (
                                            <><span style={{color: '#fbbf24'}}>●</span> AI Bot sẵn sàng</>
                                        ) : (
                                            <><span style={{color: '#ef4444'}}>●</span> Đang kết nối...</>
                                        )}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box>
                                {/* ✅ Nút refresh thủ công khi mất kết nối */}
                                {!socketConnected && (
                                    <IconButton
                                        onClick={handleManualRefresh}
                                        size="small"
                                        sx={{ color: '#fff', mr: 1 }}
                                        title="Làm mới"
                                    >
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton onClick={handleClose} sx={{ color: '#fff' }} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </ChatHeader>

                        <MessagesContainer ref={messagesContainerRef} onScroll={handleScroll}>
                            {isLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <>
                                    {messages.length === 0 && (
                                        <Box textAlign="center" py={4}>
                                            <Avatar sx={{ bgcolor: '#667eea', width: 60, height: 60, margin: '0 auto 16px' }}>
                                                <ChatIcon fontSize="large" />
                                            </Avatar>
                                            <Typography variant="h6" gutterBottom>
                                                Chào mừng! 👋
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" mb={2}>
                                                Bạn cần hỗ trợ gì hôm nay?
                                            </Typography>
                                            <Box display="flex" flexDirection="column" gap={1} mt={2}>
                                                <QuickActionButton
                                                    variant="outlined"
                                                    onClick={() => handleQuickAction('Làm sao để tạo landing page?')}
                                                >
                                                    🎨 Tạo landing page
                                                </QuickActionButton>
                                                <QuickActionButton
                                                    variant="outlined"
                                                    onClick={() => handleQuickAction('Cách publish page lên domain?')}
                                                >
                                                    🚀 Deploy & Domain
                                                </QuickActionButton>
                                                <QuickActionButton
                                                    variant="outlined"
                                                    onClick={() => handleQuickAction('Mua template ở marketplace')}
                                                >
                                                    🛒 Mua template
                                                </QuickActionButton>
                                            </Box>
                                        </Box>
                                    )}

                                    {messages.map((msg, index) => {
                                        const messageKey = msg._id || msg.tempId || `msg-${index}-${msg.createdAt || Date.now()}`;
                                        return (
                                            <Box key={messageKey}>
                                                {msg.message_type === 'system' ? (
                                                    <Box textAlign="center" my={1}>
                                                        <Chip label={msg.message} size="small" />
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" flexDirection="column" alignItems={msg.sender_type === 'user' ? 'flex-end' : 'flex-start'}>
                                                        <Box display="flex" gap={1} alignItems="flex-end">
                                                            {msg.sender_type !== 'user' && (
                                                                <Avatar sx={{ width: 24, height: 24, bgcolor: msg.sender_type === 'bot' ? '#1976d2' : '#667eea' }}>
                                                                    {msg.sender_type === 'bot' ? <BotIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                                                                </Avatar>
                                                            )}
                                                            <MessageBubble isOwn={msg.sender_type === 'user'} isBot={msg.sender_type === 'bot'}>
                                                                {msg.message}
                                                                {msg.attachments && msg.attachments.length > 0 && (
                                                                    <Box mt={1}>
                                                                        {msg.attachments.map((att, i) => (
                                                                            att.type === 'image' ? (
                                                                                <img key={i} src={att.url} alt={att.filename} style={{ maxWidth: '100%', borderRadius: 8 }} />
                                                                            ) : (
                                                                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                                                                                    {att.filename}
                                                                                </a>
                                                                            )
                                                                        ))}
                                                                    </Box>
                                                                )}
                                                            </MessageBubble>
                                                        </Box>
                                                        <Typography variant="caption" color="textSecondary" sx={{ ml: msg.sender_type !== 'user' ? 5 : 0, mt: 0.5 }}>
                                                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>

                                                        {msg.sender_type === 'bot' && (!room.admin_id || !room.admin_id._id) && !feedbackGiven[msg._id] && (
                                                            <Box display="flex" gap={0.5} ml={msg.sender_type !== 'user' ? 5 : 0} mt={0.5}>
                                                                <Tooltip title="Câu trả lời hữu ích">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleAIFeedback(msg._id, true)}
                                                                        sx={{
                                                                            fontSize: '0.75rem',
                                                                            padding: '2px 6px',
                                                                            bgcolor: '#e8f5e9',
                                                                            '&:hover': { bgcolor: '#c8e6c9' }
                                                                        }}
                                                                    >
                                                                        👍
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cần hỗ trợ thêm">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleAIFeedback(msg._id, false)}
                                                                        sx={{
                                                                            fontSize: '0.75rem',
                                                                            padding: '2px 6px',
                                                                            bgcolor: '#ffebee',
                                                                            '&:hover': { bgcolor: '#ffcdd2' }
                                                                        }}
                                                                    >
                                                                        👎
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}

                                                        {msg.sender_type === 'bot' && feedbackGiven[msg._id] !== undefined && (
                                                            <Typography variant="caption" color="textSecondary" sx={{ ml: 5, mt: 0.5, fontStyle: 'italic' }}>
                                                                {feedbackGiven[msg._id] ? '✓ Cảm ơn phản hồi!' : '✓ Đã ghi nhận'}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    })}

                                    {isTyping && (
                                        <TypingIndicator>
                                            <div className="dot" />
                                            <div className="dot" />
                                            <div className="dot" />
                                        </TypingIndicator>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </MessagesContainer>

                        {room && room.status !== 'resolved' && (!room.admin_id || !room.admin_id._id) && (
                            <Box px={2} pb={1}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PersonIcon />}
                                    onClick={handleRequestAdmin}
                                    disabled={requestingAdmin}
                                    sx={{
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        fontSize: '0.8rem',
                                        py: 0.5,
                                        '&:hover': {
                                            borderColor: '#764ba2',
                                            bgcolor: '#f5f3ff'
                                        }
                                    }}
                                >
                                    {requestingAdmin ? 'Đang kết nối...' : '💬 Kết nối với Admin'}
                                </Button>
                            </Box>
                        )}

                        {(imagePreview || isUploading) && (
                            <Box px={2} pb={1}>
                                {imagePreview && (
                                    <Box mb={1} position="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {!isUploading && (
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setImagePreview(null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    bgcolor: 'rgba(0,0,0,0.6)',
                                                    color: '#fff',
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                                }}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                )}
                                {isUploading && (
                                    <>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ flex: 1 }} />
                                            <Typography variant="caption">{uploadProgress}%</Typography>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                            Đang upload {imagePreview ? 'hình ảnh' : 'file'}...
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        )}

                        {room && room.status !== 'resolved' && (
                            <InputContainer>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                />
                                <IconButton
                                    onClick={() => fileInputRef.current.click()}
                                    size="small"
                                    disabled={isUploading}
                                >
                                    <AttachFileIcon />
                                </IconButton>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputMessage}
                                    onChange={handleTyping}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    multiline
                                    maxRows={3}
                                />
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim()}
                                    sx={{
                                        bgcolor: inputMessage.trim() ? '#667eea' : 'transparent',
                                        color: inputMessage.trim() ? '#fff' : 'inherit',
                                        '&:hover': {
                                            bgcolor: inputMessage.trim() ? '#764ba2' : 'transparent'
                                        }
                                    }}
                                >
                                    <SendIcon />
                                </IconButton>
                            </InputContainer>
                        )}

                        {room && room.status === 'resolved' && (
                            <Box p={2} bgcolor="#f5f5f5" textAlign="center">
                                <Typography variant="body2" color="textSecondary">
                                    Cuộc hội thoại đã kết thúc
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setRoom(null);
                                        setMessages([]);
                                        initializeChatRoom();
                                    }}
                                    sx={{ mt: 1 }}
                                >
                                    Bắt đầu chat mới
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </ChatContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" fontWeight={600}>
                        Đánh giá trải nghiệm hỗ trợ
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box textAlign="center" py={2}>
                        <Typography variant="body1" mb={2} color="textSecondary">
                            Bạn có hài lòng với dịch vụ hỗ trợ không?
                        </Typography>
                        <Rating
                            name="support-rating"
                            value={rating}
                            onChange={(event, newValue) => setRating(newValue)}
                            size="large"
                            sx={{ fontSize: '3rem' }}
                        />
                        <Typography variant="caption" display="block" mt={1} color="textSecondary">
                            {rating === 0 && 'Chọn số sao'}
                            {rating === 1 && 'Rất không hài lòng'}
                            {rating === 2 && 'Không hài lòng'}
                            {rating === 3 && 'Bình thường'}
                            {rating === 4 && 'Hài lòng'}
                            {rating === 5 && 'Rất hài lòng'}
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Chia sẻ ý kiến của bạn (không bắt buộc)"
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        variant="outlined"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRatingDialog(false)} color="inherit">
                        Bỏ qua
                    </Button>
                    <Button
                        onClick={handleSubmitRating}
                        variant="contained"
                        disabled={rating === 0}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                            }
                        }}
                    >
                        Gửi đánh giá
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SupportChatbox;