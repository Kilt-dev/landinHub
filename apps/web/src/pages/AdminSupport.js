import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import axios from 'axios';
import {
    initSocket,
    getSocket,
    on,
    joinDashboard,
    leaveDashboard,
    onRoomUpdate,
    onChatUpdate,
    disconnectSocket,
    joinRoom,
    leaveRoom
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
    const selectedRoomRef = useRef(null); // Track current room for socket handlers

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Keep selectedRoomRef in sync with selectedRoom state
    useEffect(() => {
        selectedRoomRef.current = selectedRoom;
    }, [selectedRoom]);

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

            // Transform messages to ensure consistent format
            const transformedMessages = response.data.messages.map(msg => ({
                _id: msg.id || msg._id,
                room_id: msg.room_id,
                sender_id: msg.sender_id,
                sender_type: msg.sender_type,
                message: msg.message,
                message_type: msg.message_type || 'text',
                created_at: msg.created_at || msg.createdAt,
                createdAt: msg.created_at || msg.createdAt,
                is_read: msg.is_read,
                ai_metadata: msg.ai_metadata
            }));

            const uniqueMessages = transformedMessages.filter((msg, index, self) =>
                index === self.findIndex((m) => m._id === msg._id)
            );

            console.log(`📜 [AdminSupport] Loaded ${uniqueMessages.length} messages for room ${roomId}`);
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
        if (!socket) {
            console.error('❌ Failed to initialize socket');
            showToast('Không thể kết nối WebSocket', 'error');
            return;
        }

        // Lắng nghe trạng thái kết nối
        socketCleanupRef.current.handleConnected = on('connect', () => {
            console.log('✅ Admin socket connected');
            setSocketConnected(true);
            socket.emit('join_dashboard'); // Join admin dashboard for notifications
            showToast('✅ Kết nối thành công', 'success');
        });

        socketCleanupRef.current.handleDisconnected = on('disconnect', () => {
            console.log('❌ Admin socket disconnected');
            setSocketConnected(false);
            showToast('⚠️ Mất kết nối', 'warning');
        });

        // Listen for new messages (backend emits 'new_message')
        socketCleanupRef.current.handleNewMessage = on('new_message', (data) => {
            console.log('📨 [AdminSupport] New message received:', data);

            // Get current selected room from ref (avoids closure issues)
            const currentRoom = selectedRoomRef.current;

            // Only process if this message is for currently selected room
            if (!currentRoom || data.room_id !== currentRoom._id) {
                console.log('📨 [AdminSupport] Message not for current room, ignoring');
                return;
            }

            const newMsg = {
                _id: data.id,
                room_id: data.room_id,
                sender_id: {
                    _id: data.sender_id,
                    name: data.sender_name || 'User' // Use sender_name from backend
                },
                sender_type: data.sender_type,
                message: data.message,
                created_at: data.created_at,
                createdAt: data.created_at
            };

            setMessages(prev => {
                // Check if message already exists (avoid duplicates)
                const exists = prev.some(msg => msg._id === newMsg._id);
                if (exists) {
                    console.log('📨 [AdminSupport] Message already exists, skipping');
                    return prev;
                }

                // Remove optimistic message if exists and add real message
                const filtered = prev.filter(msg => !msg.__optimistic);
                console.log(`✅ [AdminSupport] Added new message: ${newMsg.message.substring(0, 30)}...`);
                scrollToBottom();
                return [...filtered, newMsg];
            });
        });

        // Listen for room updates (for room list refresh)
        socketCleanupRef.current.handleNewSupportRequest = on('new_support_request', (data) => {
            console.log('🆕 [AdminSupport] New support request:', data);
            showToast('📢 Yêu cầu hỗ trợ mới!', 'info');
            loadRooms(); // Reload room list
        });

        // Listen for admin joined event
        socketCleanupRef.current.handleAdminJoined = on('admin_joined', (data) => {
            console.log('👨‍💼 [AdminSupport] Admin joined room:', data);
            if (selectedRoom && data.roomId === selectedRoom._id) {
                showToast('Admin đã tham gia chat', 'info');
            }
        });

        return () => {
            // Cleanup tất cả listeners
            Object.values(socketCleanupRef.current).forEach(cleanup => {
                if (typeof cleanup === 'function') cleanup();
            });
            if (socket && socket.connected) {
                socket.emit('leave_dashboard');
            }
            setSocketConnected(false);
        };
    }, [user]); // Only re-init if user changes

    // ✅ WEBSOCKET: Join/leave room khi chọn phòng
    useEffect(() => {
        if (selectedRoom && socketConnected) {
            const socket = getSocket();
            if (socket) {
                console.log(`🚪 [AdminSupport] Joining room: ${selectedRoom._id}`);
                socket.emit('join_room', { roomId: selectedRoom._id });

                return () => {
                    console.log(`🚪 [AdminSupport] Leaving room: ${selectedRoom._id}`);
                    socket.emit('leave_room', { roomId: selectedRoom._id });
                };
            }
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
        if (!selectedRoom || !socketConnected) {
            showToast('Vui lòng đợi kết nối socket', 'error');
            return;
        }

        try {
            // Emit socket event to assign room
            const socket = getSocket();
            if (socket) {
                socket.emit('assign_room', { roomId: selectedRoom._id });
                showToast('Đã nhận hỗ trợ! 👨‍💼', 'success');

                // Update local state
                setSelectedRoom(prev => ({
                    ...prev,
                    admin_id: user.id,
                    status: 'assigned'
                }));

                setTimeout(() => {
                    loadRooms();
                }, 500);
            }
        } catch (error) {
            console.error('Failed to assign room:', error);
            showToast('Không thể nhận hỗ trợ. Vui lòng thử lại.', 'error');
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedRoom || !socketConnected) {
            if (!socketConnected) {
                showToast('Vui lòng đợi kết nối socket', 'error');
            }
            return;
        }

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
            // Send via socket instead of API
            const socket = getSocket();
            if (socket) {
                socket.emit('send_message', {
                    roomId: selectedRoom._id,
                    message: messageText
                });
                console.log('📤 Admin sent message via socket');
            }

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
                                            <Typography variant="h4">
                                                {(stats.byStatus?.open || 0) + (stats.byStatus?.assigned || 0) + (stats.byStatus?.resolved || 0) + (stats.byStatus?.closed || 0)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#fef3c7' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Chờ xử lý
                                            </Typography>
                                            <Typography variant="h4" color="#d97706">{stats.pendingRooms || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#dbeafe' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Đang xử lý
                                            </Typography>
                                            <Typography variant="h4" color="#2563eb">{stats.myActiveRooms || 0}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ bgcolor: '#dcfce7' }}>
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Đã giải quyết hôm nay
                                            </Typography>
                                            <Typography variant="h4" color="#16a34a">{stats.today?.resolved || 0}</Typography>
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
                                            <Chip
                                                icon={socketConnected ? <WifiIcon /> : <WifiOffIcon />}
                                                label={socketConnected ? 'Tự động cập nhật' : 'Không kết nối'}
                                                color={socketConnected ? 'success' : 'default'}
                                                size="small"
                                            />
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
                                                                    {msg.sender_type === 'bot' ? 'AI Assistant' : msg.sender_type === 'admin' ? 'Admin' : (msg.sender_id?.name || 'Người dùng')} • {new Date(msg.created_at || msg.createdAt).toLocaleTimeString('vi-VN')}
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