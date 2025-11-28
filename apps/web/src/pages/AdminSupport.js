import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import axios from 'axios';
// import { usePolling } from '../hooks/usePolling'; // ❌ ĐÃ XÓA

// ✅ WebSocket imports
import {
    initSocket,
    disconnectSocket,
    on,
    onRoomUpdate,
    onChatUpdate,
    joinRoom,
    leaveRoom,
    joinDashboard,
    leaveDashboard,
    getStatus
} from '../utils/socket';

import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Badge,
    TextField,
    IconButton,
    Chip,
    Button,
    Divider,
    Card,
    CardContent,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    CircularProgress,
    Tooltip,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    Person as PersonIcon,
    SmartToy as BotIcon,
    Check as CheckIcon,
    Assignment as AssignmentIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
    PriorityHigh as PriorityIcon,
    Close as CloseIcon,
    Wifi as WifiIcon,
    WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    height: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column'
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    overflow: 'hidden',
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
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
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    backgroundColor: isBot ? '#e3f2fd' : isOwn ? '#667eea' : '#fff',
    color: isBot ? '#1976d2' : isOwn ? '#fff' : '#000',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    wordWrap: 'break-word',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    marginBottom: theme.spacing(1)
}));

const StatsCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    height: '100%'
}));

const AdminSupport = () => {
    const { user } = useContext(UserContext);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [stats, setStats] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [socketConnected, setSocketConnected] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const socketCleanupRef = useRef({});

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const showToast = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const closeSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const lastMessageIdRef = useRef(null);

    // ✅ HELPER: Kiểm tra token trước khi gọi API
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
            throw new Error('No token');
        }
        return { Authorization: `Bearer ${token}` };
    };

    // Load rooms - CHỈ GỌI KHI CẦN THIẾT
    const loadRooms = async () => {
        try {
            setLoading(true);
            const statusMap = ['', 'open', 'assigned', 'resolved'];
            const status = statusMap[tabValue];

            const response = await axios.get(`${API_URL}/api/chat/admin/rooms`, {
                params: status ? { status } : {},
                headers: getAuthHeader() // ✅ Sử dụng helper
            });

            const uniqueRooms = response.data.rooms.filter((room, index, self) =>
                index === self.findIndex((r) => r._id === room._id)
            );

            setRooms(uniqueRooms);
        } catch (error) {
            console.error('Failed to load rooms:', error);
            if (error.response?.status === 401) {
                showToast('Lỗi xác thực, vui lòng đăng nhập lại', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMessagesForRoom = async (roomId) => {
        try {
            const response = await axios.get(`${API_URL}/api/chat/rooms/${roomId}/messages`, {
                headers: getAuthHeader()
            });

            const uniqueMessages = response.data.messages.filter((msg, index, self) =>
                index === self.findIndex((m) => m._id === msg._id)
            );

            setMessages(uniqueMessages);
            scrollToBottom(true);
        } catch (error) {
            console.error('Failed to load messages:', error);
            showToast('Không thể tải tin nhắn', 'error');
        }
    };

    const loadStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/chat/admin/stats`, {
                headers: getAuthHeader()
            });

            setStats(response.data.stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
            if (error.response?.status === 401) {
                showToast('Lỗi xác thực', 'error');
            }
        }
    };

    // ✅ WEBSOCKET: Khởi tạo và lắng nghe sự kiện
    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const socket = initSocket();

        // Lắng nghe trạng thái kết nối
        socketCleanupRef.current.handleConnected = on('connected', () => {
            setSocketConnected(true);
            joinDashboard();
            showToast('✅ WebSocket kết nối thành công', 'success');
        });

        socketCleanupRef.current.handleDisconnected = on('disconnected', () => {
            setSocketConnected(false);
        });

        socketCleanupRef.current.handleNotConfigured = on('not_configured', () => {
            setSocketConnected(false);
            showToast('ℹ️ WebSocket chưa cấu hình, dùng refresh thủ công', 'info');
        });

        // Lắng nghe cập nhật dữ liệu
        socketCleanupRef.current.handleRoomUpdate = onRoomUpdate(() => {
            showToast('📋 Danh sách phòng đã cập nhật', 'info');
            loadRooms();
        });

        socketCleanupRef.current.handleChatUpdate = onChatUpdate((data) => {
            if (data.roomId === selectedRoom?._id) {
                setMessages(prev => {
                    const exists = prev.some(msg => msg._id === data.message._id);
                    if (!exists) {
                        return [...prev.filter(msg => !msg.__optimistic), data.message];
                    }
                    return prev;
                });
                scrollToBottom();
            }
        });

        socketCleanupRef.current.handleReconnectFailed = on('reconnect_failed', () => {
            showToast('❌ Không thể kết nối WebSocket, dùng refresh thủ công', 'warning');
        });

        return () => {
            // Cleanup tất cả listeners
            Object.values(socketCleanupRef.current).forEach(cleanup => {
                if (typeof cleanup === 'function') cleanup();
            });
            disconnectSocket(true);
            setSocketConnected(false);
        };
    }, [user]);

    // ✅ WEBSOCKET: Join/leave room khi chọn phòng
    useEffect(() => {
        if (selectedRoom && socketConnected) {
            joinRoom(selectedRoom._id);
            return () => {
                leaveRoom(selectedRoom._id);
            };
        }
    }, [selectedRoom, socketConnected]);

    // Load initial data
    useEffect(() => {
        if (user && user.role === 'admin') {
            loadRooms();
            loadStats();
        }
    }, [user, tabValue]);

    const handleSelectRoom = async (room) => {
        try {
            setSelectedRoom(room);
            lastMessageIdRef.current = null;
            await loadMessagesForRoom(room._id);

            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                lastMessageIdRef.current = lastMsg._id;
            }

            scrollToBottom();
        } catch (error) {
            console.error('Failed to select room:', error);
        }
    };

    const handleAssignToSelf = async () => {
        if (!selectedRoom) return;

        try {
            await axios.post(
                `${API_URL}/api/chat/admin/assign`,
                { roomId: selectedRoom._id },
                { headers: getAuthHeader() }
            );

            showToast('Đã nhận hỗ trợ! 👨‍💼', 'success');

            setTimeout(() => {
                loadRooms();
            }, 500);
        } catch (error) {
            console.error('Failed to assign room:', error);
            showToast('Không thể nhận hỗ trợ. Vui lòng thử lại.', 'error');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedRoom) return;

        const messageText = inputMessage.trim();
        setInputMessage('');

        const optimisticMessage = {
            _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            room_id: selectedRoom._id,
            sender_id: user,
            sender_type: 'admin',
            message: messageText,
            message_type: 'text',
            createdAt: new Date().toISOString(),
            __optimistic: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom(true);

        try {
            await axios.post(
                `${API_URL}/api/chat/rooms/${selectedRoom._id}/messages`,
                {
                    message: messageText,
                    message_type: 'text',
                    enableAI: false
                },
                { headers: getAuthHeader() }
            );

            // ✅ WebSocket sẽ tự động nhận tin nhắn mới, không cần poll
        } catch (error) {
            console.error('Send message error:', error);
            showToast('Không thể gửi tin nhắn. Vui lòng thử lại.', 'error');
            setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        }
    };

    const handleTyping = (e) => {
        setInputMessage(e.target.value);
    };

    // Trong AdminSupport.js
    const handleCloseRoom = async () => {
        if (!selectedRoom) return;

        try {
            // Sử dụng endpoint admin để cập nhật status thành 'resolved'
            await axios.put(
                `${API_URL}/api/chat/admin/rooms/${selectedRoom._id}/status`,
                { status: 'resolved' },
                { headers: getAuthHeader() }
            );

            showToast('Đã đóng cuộc hội thoại! ✅', 'success');

            setTimeout(() => {
                setSelectedRoom(null);
                setMessages([]);
                loadRooms();
            }, 500);
        } catch (error) {
            console.error('Failed to close room:', error);
            showToast('Không thể đóng cuộc hội thoại. Vui lòng thử lại.', 'error');
        }
    };

    const handleUpdatePriority = async (priority) => {
        if (!selectedRoom) return;

        try {
            await axios.put(
                `${API_URL}/api/chat/admin/rooms/${selectedRoom._id}/status`,
                { priority },
                { headers: getAuthHeader() }
            );

            setSelectedRoom({ ...selectedRoom, priority });
            loadRooms();
            setAnchorEl(null);
            showToast('Cập nhật mức độ ưu tiên thành công', 'success');
        } catch (error) {
            console.error('Failed to update priority:', error);
            showToast('Cập nhật thất bại', 'error');
        }
    };

    const scrollToBottom = (force = false) => {
        if (force || !userScrolledUp) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            setUserScrolledUp(distanceFromBottom > 100);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="dashboard-container">
                <Header role={user?.role} />
                <div className="dashboard-main">
                    <Sidebar role={user?.role} />
                    <div className="dashboard-content">
                        <Container>
                            <Box py={4} textAlign="center">
                                <Typography variant="h5">Bạn không có quyền truy cập trang này</Typography>
                            </Box>
                        </Container>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'error';
            case 'assigned': return 'primary';
            case 'resolved': return 'success';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'error';
            case 'high': return 'warning';
            case 'normal': return 'primary';
            case 'low': return 'default';
            default: return 'default';
        }
    };

    return (
        <div className="dashboard-container">
            <Header role={user.role} />
            <div className="dashboard-main">
                <Sidebar role={user.role} />
                <div className="dashboard-content">
                    <Container maxWidth="xl" sx={{ py: 3 }}>
                        {/* ✅ Indicator trạng thái WebSocket */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h4" gutterBottom fontWeight={600}>
                                🎧 Hỗ trợ khách hàng
                            </Typography>
                            <Chip
                                icon={socketConnected ? <WifiIcon /> : <WifiOffIcon />}
                                label={socketConnected ? 'Realtime' : 'Offline'}
                                color={socketConnected ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>

                        {stats && (
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Tổng cuộc hội thoại
                                            </Typography>
                                            <Typography variant="h4">{stats.totalRooms}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#fef3c7' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Chờ xử lý
                                            </Typography>
                                            <Typography variant="h4" color="#d97706">{stats.openRooms}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#dbeafe' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Đang xử lý
                                            </Typography>
                                            <Typography variant="h4" color="#2563eb">{stats.assignedRooms}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#dcfce7' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Đã giải quyết hôm nay
                                            </Typography>
                                            <Typography variant="h4" color="#16a34a">{stats.resolvedToday}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <StyledPaper>
                                    <Box p={2} borderBottom="1px solid #e0e0e0">
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6">Danh sách chat</Typography>
                                            <Tooltip title="Làm mới">
                                                <IconButton size="small" onClick={loadRooms}>
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                                            <Tab label="Tất cả" />
                                            <Tab label="Mới" />
                                            <Tab label="Đang xử lý" />
                                            <Tab label="Đã xong" />
                                        </Tabs>
                                    </Box>

                                    <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                                        {loading ? (
                                            <Box display="flex" justifyContent="center" p={4}>
                                                <CircularProgress />
                                            </Box>
                                        ) : rooms.length === 0 ? (
                                            <Box p={4} textAlign="center">
                                                <Typography color="textSecondary">Không có cuộc hội thoại nào</Typography>
                                                {!socketConnected && (
                                                    <Typography variant="caption" color="warning">
                                                        ⚠️ Bật WebSocket để nhận tin nhắn realtime
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            rooms.map((room) => (
                                                <ListItem
                                                    key={room._id}
                                                    disablePadding
                                                    secondaryAction={
                                                        room.unread_count_admin > 0 && (
                                                            <Badge badgeContent={room.unread_count_admin} color="error" />
                                                        )
                                                    }
                                                >
                                                    <ListItemButton
                                                        selected={selectedRoom?._id === room._id}
                                                        onClick={() => handleSelectRoom(room)}
                                                    >
                                                        <ListItemAvatar>
                                                            <Badge
                                                                badgeContent={room.priority === 'urgent' || room.priority === 'high' ? '!' : 0}
                                                                color="error"
                                                            >
                                                                <Avatar>
                                                                    {room.user_id?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </Avatar>
                                                            </Badge>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={
                                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                                        {room.user_id?.name || 'Người dùng'}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={room.status}
                                                                        size="small"
                                                                        color={getStatusColor(room.status)}
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <Box>
                                                                    <Typography variant="caption" display="block">
                                                                        {room.subject}
                                                                    </Typography>
                                                                    {room.tags && room.tags.length > 0 && (
                                                                        <Box mt={0.5}>
                                                                            {room.tags.slice(0, 2).map((tag, i) => (
                                                                                <Chip key={i} label={tag} size="small" sx={{ mr: 0.5, fontSize: '0.65rem', height: 18 }} />
                                                                            ))}
                                                                        </Box>
                                                                    )}
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {new Date(room.last_message_at).toLocaleString('vi-VN')}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))
                                        )}
                                    </List>
                                </StyledPaper>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                <StyledPaper>
                                    {selectedRoom ? (
                                        <>
                                            <Box p={2} borderBottom="1px solid #e0e0e0">
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Avatar>
                                                            {selectedRoom.user_id?.name?.charAt(0).toUpperCase() || 'U'}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight={600}>
                                                                {selectedRoom.user_id?.name || 'Người dùng'}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {selectedRoom.user_id?.email}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={selectedRoom.priority}
                                                            size="small"
                                                            color={getPriorityColor(selectedRoom.priority)}
                                                        />
                                                        {selectedRoom.tags && selectedRoom.tags.map((tag, i) => (
                                                            <Chip key={i} label={tag} size="small" variant="outlined" />
                                                        ))}
                                                    </Box>

                                                    <Box display="flex" gap={1}>
                                                        {!selectedRoom.admin_id && (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<AssignmentIcon />}
                                                                onClick={handleAssignToSelf}
                                                            >
                                                                Nhận hỗ trợ
                                                            </Button>
                                                        )}

                                                        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                                                            <MoreVertIcon />
                                                        </IconButton>

                                                        <Menu
                                                            anchorEl={anchorEl}
                                                            open={Boolean(anchorEl)}
                                                            onClose={() => setAnchorEl(null)}
                                                        >
                                                            <MenuItem onClick={() => handleUpdatePriority('urgent')}>
                                                                <PriorityIcon color="error" sx={{ mr: 1 }} /> Khẩn cấp
                                                            </MenuItem>
                                                            <MenuItem onClick={() => handleUpdatePriority('high')}>
                                                                <PriorityIcon color="warning" sx={{ mr: 1 }} /> Cao
                                                            </MenuItem>
                                                            <MenuItem onClick={() => handleUpdatePriority('normal')}>
                                                                <PriorityIcon color="primary" sx={{ mr: 1 }} /> Bình thường
                                                            </MenuItem>
                                                            <MenuItem onClick={() => handleUpdatePriority('low')}>
                                                                <PriorityIcon sx={{ mr: 1 }} /> Thấp
                                                            </MenuItem>
                                                            <Divider />
                                                            <MenuItem onClick={handleCloseRoom}>
                                                                <CloseIcon sx={{ mr: 1 }} /> Đóng cuộc hội thoại
                                                            </MenuItem>
                                                        </Menu>
                                                    </Box>
                                                </Box>

                                                {selectedRoom.context && (
                                                    <Box mt={1} p={1} bgcolor="#f5f5f5" borderRadius={1}>
                                                        <Typography variant="caption" color="textSecondary">
                                                            📍 Trang: {selectedRoom.context.page} | Hành động: {selectedRoom.context.action}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            <MessagesContainer ref={messagesContainerRef} onScroll={handleScroll}>
                                                {messages.map((msg, index) => (
                                                    <Box key={msg._id || `msg-${index}`}>
                                                        {msg.message_type === 'system' ? (
                                                            <Box textAlign="center" my={1}>
                                                                <Chip label={msg.message} size="small" />
                                                            </Box>
                                                        ) : (
                                                            <Box display="flex" flexDirection="column" alignItems={msg.sender_type === 'admin' ? 'flex-end' : 'flex-start'}>
                                                                <Box display="flex" gap={1} alignItems="flex-end">
                                                                    {msg.sender_type !== 'admin' && (
                                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: msg.sender_type === 'bot' ? '#1976d2' : '#ff9800' }}>
                                                                            {msg.sender_type === 'bot' ? <BotIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
                                                                        </Avatar>
                                                                    )}
                                                                    <MessageBubble isOwn={msg.sender_type === 'admin'} isBot={msg.sender_type === 'bot'}>
                                                                        {msg.message}
                                                                        {msg.ai_metadata?.is_ai_generated && (
                                                                            <Chip label="AI" size="small" sx={{ ml: 1, height: 16, fontSize: '0.65rem' }} />
                                                                        )}
                                                                    </MessageBubble>
                                                                </Box>
                                                                <Typography variant="caption" color="textSecondary" sx={{ ml: msg.sender_type === 'admin' ? 0 : 5, mt: 0.5 }}>
                                                                    {msg.sender_id?.name || 'Unknown'} • {new Date(msg.createdAt).toLocaleTimeString('vi-VN')}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))}

                                                {isTyping && (
                                                    <Box display="flex" gap={1} alignItems="center">
                                                        <Typography variant="caption" color="textSecondary">
                                                            Đang gõ...
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <div ref={messagesEndRef} />
                                            </MessagesContainer>

                                            {selectedRoom.status !== 'resolved' && (
                                                <Box p={2} borderTop="1px solid #e0e0e0" display="flex" gap={1}>
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
                                                        maxRows={4}
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
                                                </Box>
                                            )}
                                        </>
                                    ) : (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                            <Box textAlign="center">
                                                <Typography variant="h6" color="textSecondary">
                                                    Chọn một cuộc hội thoại để bắt đầu
                                                </Typography>
                                                {!socketConnected && (
                                                    <Typography variant="caption" color="warning">
                                                        ⚠️ WebSocket chưa kết nối, bạn cần refresh thủ công
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </StyledPaper>
                            </Grid>
                        </Grid>
                    </Container>
                </div>
            </div>

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
        </div>
    );
};

export default AdminSupport;