import React, {useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserProfile from './UserProfile';
import api from '@landinghub/api';
import logo from '../assets/logo.png';
import '../styles/header.css';
import { FiBell, FiX } from 'react-icons/fi';
import { io } from 'socket.io-client';


const Header = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const socket = useRef();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/user/info');
                setUserData(res.data);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Không thể tải dữ liệu người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data.data);
            setUnreadCount(res.data.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Lỗi tải thông báo:', err);
        }
    };
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            auth: { token }
        });

        socket.current.on('new_notification', payload => {
            setNotifications(prev => [payload, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        socket.current.on('connect', () => console.log('Socket connected', socket.current.id));
        socket.current.on('connect_error', err => console.error('Socket error:', err.message));

        // cleanup
        return () => socket.current.disconnect();
    }, []);   // <- để [] để chỉ chạy 1 lần

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Lỗi đánh dấu đã đọc:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/auth';
    };

    const displayName = userData.name || (localStorage.getItem('token') ? `User ${jwtDecode(localStorage.getItem('token')).userId}` : 'Khách');

    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="header-container">
            <nav className="navbar">
                <div className="navbar-container">
                    <img src={logo} alt="Logo" className="logo-image" />

                    <div className="header-right">
                        {/* 🔔 Thông báo */}
                        <div className="notif-wrapper">
                            <div className="bell-icon" onClick={() => setShowNotif(!showNotif)}>
                                <FiBell size={20} />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </div>

                            {showNotif && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <strong>Thông báo</strong>
                                        <FiX className="close-notif" onClick={() => setShowNotif(false)} />
                                    </div>
                                    <div className="notif-list">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">Không có thông báo mới</div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif._id}
                                                    className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                                                    onClick={() => markAsRead(notif._id)}
                                                >
                                                    <div className="notif-title">{notif.title}</div>
                                                    <div className="notif-message">{notif.message}</div>
                                                    <div className="notif-time">
                                                        {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 👤 Avatar + Profile */}
                        <div className="user-info">
                            {localStorage.getItem('token') ? (
                                <>
                                    <span>Chào, {displayName}</span>
                                    <div
                                        className="user-avatar cursor-pointer"
                                        onClick={() => setShowProfile(!showProfile)}
                                    >
                                        {userData.avatar ? (
                                            <img src={userData.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-gray-600">
                                                <circle cx="12" cy="8" r="4" />
                                                <path d="M4 20c0-3.5 4-5.5 8-5.5s8 2 8 5.5" />
                                            </svg>
                                        )}
                                    </div>
                                    <button onClick={handleLogout}>Đăng xuất</button>
                                    {showProfile && (
                                        <div className="profile-popup">
                                            <UserProfile />
                                            <button onClick={() => setShowProfile(false)}>Đóng</button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button onClick={() => navigate('/auth')}>Đăng nhập</button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default React.memo(Header);