import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { usePolling } from '../hooks/usePolling';
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
    Star as StarIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
    const [feedbackGiven, setFeedbackGiven] = useState({}); // Track feedback per message
    const [requestingAdmin, setRequestingAdmin] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [failedMessages, setFailedMessages] = useState(new Set());
    const [imagePreview, setImagePreview] = useState(null);
    const [ratingDialog, setRatingDialog] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingFeedback, setRatingFeedback] = useState('');
    const [userScrolledUp, setUserScrolledUp] = useState(false); // Track if user scrolled up
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null); // Ref for messages container
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Helper function to show toast notifications
    const showToast = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const lastMessageIdRef = useRef(null);
    const lastRoomStatusRef = useRef(null);
    const isReinitializingRef = useRef(false); // Flag to prevent polling during reinit

    // 🔄 Polling: Poll messages khi chat box đang mở
    const pollMessages = async () => {
        // Don't poll if reinitializing or no room
        if (!room || !isOpen || isReinitializingRef.current) return;

        try {
            const params = lastMessageIdRef.current
                ? `?after=${lastMessageIdRef.current}`
                : '';

            const response = await axios.get(
                `${API_URL}/api/chat/rooms/${room._id}/messages${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.messages && response.data.messages.length > 0) {
                const newMessages = response.data.messages;

                setMessages(prev => {
                    // Remove optimistic messages that got confirmed
                    const filtered = prev.filter(msg => !msg.__optimistic);

                    // Create a Set of existing message IDs for fast lookup
                    const existingIds = new Set(filtered.map(msg => msg._id));

                    // Only add truly new messages (not already in the list)
                    const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));

                    // Merge and return
                    return [...filtered, ...uniqueNewMessages];
                });

                // Update last message ID
                const latestMessage = newMessages[newMessages.length - 1];
                lastMessageIdRef.current = latestMessage._id;

                // Check if any new message is from admin
                const hasAdminMessage = newMessages.some(msg => msg.sender_type === 'admin');
                if (hasAdminMessage && !adminOnline) {
                    setAdminOnline(true);
                    showToast('Admin đã vào hỗ trợ! 👨‍💼', 'success');
                }

                scrollToBottom();
            }

            // Also poll room status to check if admin assigned or room closed
            const roomResponse = await axios.get(
                `${API_URL}/api/chat/rooms/${room._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (roomResponse.data.room) {
                const updatedRoom = roomResponse.data.room;

                // Check if admin was assigned
                if (!room.admin_id && updatedRoom.admin_id) {
                    setAdminOnline(true);
                    showToast('Admin đã vào hỗ trợ! 👨‍💼', 'success');
                }

                // Check if room was closed
                if (room.status !== 'resolved' && updatedRoom.status === 'resolved') {
                    showToast('Cuộc hội thoại đã kết thúc', 'info');
                    setTimeout(() => {
                        setRatingDialog(true);
                    }, 1000);
                }

                setRoom(updatedRoom);
            }
        } catch (error) {
            console.error('Polling error:', error);

            // If room not found (404), the room was deleted or doesn't exist
            // Stop polling and create a fresh room
            if (error.response?.status === 404 && !isReinitializingRef.current) {
                console.warn('❌ Chat room not found (404). Clearing cache and creating new room...');

                // Set flag to stop all polling immediately
                isReinitializingRef.current = true;

                // Clear room state completely
                setRoom(null);
                setMessages([]);
                lastMessageIdRef.current = null;

                // Clear any cached room data from localStorage
                try {
                    localStorage.removeItem('chatRoomId');
                    localStorage.removeItem('lastChatRoomId');
                } catch (e) {
                    console.error('Failed to clear localStorage:', e);
                }

                // Create a new room if chat is still open (one-time only)
                if (isOpen) {
                    setTimeout(() => {
                        initializeChatRoom();
                    }, 500);
                }
            }
        }
    };

    // Poll messages every 3 seconds when chat is open
    usePolling(pollMessages, 3000, isOpen && !!room);

    // 🔄 Polling: Check admin online status every 10 seconds
    // NOTE: Disabled - API endpoint not implemented yet
    // Admin status is now detected when admin sends a message
    const pollAdminStatus = async () => {
        // Disabled to prevent 404 errors
        // TODO: Implement backend API endpoint /api/chat/admin/online-status
        return;
    };

    // Poll admin status every 10 seconds (currently disabled)
    // usePolling(pollAdminStatus, 10000, isOpen);

    // Helper function to load messages for a room
    const loadMessagesForRoom = async (roomId) => {
        try {
            const messagesResponse = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setMessages(messagesResponse.data.messages);
            scrollToBottom(true); // Force scroll on initial load
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    // Get or create chat room when opening
    const initializeChatRoom = async () => {
        try {
            setIsLoading(true);

            // Get current page context
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

            // Load messages
            const messagesResponse = await axios.get(`${API_URL}/api/chat/rooms/${roomData._id}/messages`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            setMessages(messagesResponse.data.messages);
            setUnreadCount(0);

            // Reset reinitialize flag on success - allow polling to resume
            isReinitializingRef.current = false;

            scrollToBottom(true); // Force scroll on room init
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            showToast('Không thể khởi tạo chat. Vui lòng thử lại.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Determine user action based on current path
    const determineAction = (path) => {
        if (path.includes('/create')) return 'building';
        if (path.includes('/marketplace')) return 'marketplace';
        if (path.includes('/payment')) return 'payment';
        if (path.includes('/dashboard')) return 'dashboard';
        return 'general';
    };

    // Open chat
    const handleOpen = () => {
        setIsOpen(true);
        if (!room) {
            initializeChatRoom();
        } else {
            setUnreadCount(0);
        }
    };

    // Close chat
    const handleClose = () => {
        setIsOpen(false);
        // Polling sẽ tự động dừng khi isOpen = false
    };

    // Send message
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !room) return;

        const messageText = inputMessage.trim();
        setInputMessage('');

        // 🚀 OPTIMISTIC UPDATE: Add message to UI immediately
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
        scrollToBottom(true); // Force scroll when user sends message

        // Send message via HTTP POST
        try {
            await axios.post(
                `${API_URL}/api/chat/rooms/${room._id}/messages`,
                {
                    message: messageText,
                    message_type: 'text',
                    enableAI: !room.admin_id // Enable AI only if no admin assigned
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            // Polling sẽ tự động fetch message mới trong 3s
        } catch (error) {
            console.error('Send message error:', error);
            showToast('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
            // Remove optimistic message
            setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        }
    };

    // Handle typing
    const handleTyping = (e) => {
        setInputMessage(e.target.value);
        // Typing indicator disabled (không cần thiết với polling)
    };

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !room) return;

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast('File quá lớn! Tối đa 10MB', 'error');
            return;
        }

        // Show image preview for images
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

            // Send message with attachment via HTTP POST
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
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Quick action buttons
    const handleQuickAction = (question) => {
        setInputMessage(question);
        setTimeout(() => handleSendMessage(), 100);
    };

    // Handle scroll detection
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            // User has scrolled up if distance from bottom > 100px
            setUserScrolledUp(distanceFromBottom > 100);
        }
    };

    // Scroll to bottom with optional force parameter
    const scrollToBottom = (force = false) => {
        // Only auto-scroll if user is at bottom OR force scroll
        if (force || !userScrolledUp) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    useEffect(() => {
        // Only auto-scroll if user hasn't scrolled up
        scrollToBottom();
    }, [messages]);

    // Handle AI feedback
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

            // If not helpful, suggest admin
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

    // Request admin connection
    const handleRequestAdmin = async () => {
        if (!room || !socket || requestingAdmin) return;

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

            // Socket will handle the escalation on backend
            showToast('Đã gửi yêu cầu đến Admin. Admin sẽ hỗ trợ bạn trong giây lát! 👨‍💼', 'success');
        } catch (error) {
            console.error('Request admin error:', error);
            showToast('Không thể kết nối với Admin. Vui lòng thử lại sau.', 'error');
        } finally {
            setRequestingAdmin(false);
        }
    };

    // Handle rating submission
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

    // Don't show chatbox for admin users - they use admin dashboard instead
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
                        {/* Header */}
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
                                        {adminOnline ? (
                                            <><span style={{color: '#4ade80'}}>●</span> Admin đang online</>
                                        ) : (
                                            <><span style={{color: '#fbbf24'}}>●</span> AI Bot sẵn sàng hỗ trợ</>
                                        )}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={handleClose} sx={{ color: '#fff' }} size="small">
                                <CloseIcon />
                            </IconButton>
                        </ChatHeader>

                        {/* Messages */}
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

                                            {/* Quick action buttons */}
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

                                    {messages.map((msg, index) => (
                                        <Box key={msg._id || `msg-${index}-${msg.createdAt}`}>
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

                                                    {/* AI Feedback Buttons */}
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

                                                    {/* Feedback given confirmation */}
                                                    {msg.sender_type === 'bot' && feedbackGiven[msg._id] !== undefined && (
                                                        <Typography variant="caption" color="textSecondary" sx={{ ml: 5, mt: 0.5, fontStyle: 'italic' }}>
                                                            {feedbackGiven[msg._id] ? '✓ Cảm ơn phản hồi!' : '✓ Đã ghi nhận'}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    ))}

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

                        {/* Connect to Admin Button */}
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

                        {/* Image Preview & Upload Progress */}
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

                        {/* Input */}
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

            {/* Toast Notifications */}
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

            {/* Rating Dialog */}
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