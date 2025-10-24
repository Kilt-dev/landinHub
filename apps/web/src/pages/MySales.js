import React, { useState, useEffect, useCallback, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/MySales.css';
import DogLoader from '../components/Loader';

const IconLuxury = ({ name, size = 18, color = 'currentColor', className = '' }) => {
    const icons = {
        View: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
        Trash: <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
        Box: <svg xmlns="http://www.w3.org/2000/svg" width={size*1.2} height={size*1.2} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.89 1.57l7.55 4.37A2 2 0 0 1 23 7.66v8.68a2 2 0 0 1-1.06 1.79l-7.55 4.37a2 2 0 0 1-1.89 0l-7.55-4.37A2 2 0 0 1 1 16.34V7.66a2 2 0 0 1 1.06-1.79l7.55-4.37a2 2 0 0 1 1.89 0z"></path><path d="M2.5 7.5L12 12l9.5-4.5"></path><path d="M12 22.5V12"></path></svg>,
        Check: <svg xmlns="http://www.w3.org/2000/svg" width={size*1.2} height={size*1.2} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
        Clock: <svg xmlns="http://www.w3.org/2000/svg" width={size*1.2} height={size*1.2} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
        Dollar: <svg xmlns="http://www.w3.org/2000/svg" width={size*1.2} height={size*1.2} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
        ShoppingBag: <svg xmlns="http://www.w3.org/2000/svg" width={size*1.2} height={size*1.2} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
    };

    return <i className={className}>{icons[name] || null}</i>;
};

const MySales = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [pages, setPages] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const statusOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'DRAFT', label: 'Bản nháp' },
        { value: 'PENDING', label: 'Chờ duyệt' },
        { value: 'ACTIVE', label: 'Đang bán' },
        { value: 'REJECTED', label: 'Bị từ chối' },
        { value: 'SUSPENDED', label: 'Tạm ngưng' },
        { value: 'SOLD_OUT', label: 'Hết hàng' }
    ];

    const statIcons = {
        totalPages: { name: 'Box', color: '#B8860B' },
        activePages: { name: 'Check', color: '#27AE60' },
        pendingPages: { name: 'Clock', color: '#E6B01F' },
        revenue: { name: 'Dollar', color: '#B8860B' },
        totalSales: { name: 'ShoppingBag', color: '#192A56' },
    };

    const fetchMyPages = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/my/pages`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                params: { status: selectedStatus !== 'all' ? selectedStatus : undefined }
            });
            if (Array.isArray(response.data.data)) {
                setPages(response.data.data);
            } else {
                console.error('Response data is not an array:', response.data);
                setPages([]);
                toast.error('Dữ liệu landing page không hợp lệ');
            }
        } catch (err) {
            console.error('Fetch pages error:', err);
            setPages([]);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách landing page đã đăng bán');
        } finally {
            setLoading(false);
        }
    }, [userId, selectedStatus, API_BASE_URL]);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/seller/stats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.data) {
                setStats(response.data.data);
            }
        } catch (err) {
            console.error('Fetch stats error:', err);
            toast.error('Không thể tải thống kê bán hàng');
        }
    }, [userId, API_BASE_URL]);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found in localStorage');
                toast.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/auth');
                setLoading(false);
                return;
            }
            try {
                const decoded = jwtDecode(token);
                if (!decoded.userId) {
                    throw new Error('Invalid token: userId not found');
                }
                setUserId(decoded.userId);
                setUserRole(decoded.role);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                if (user?.role) {
                    setUserRole(user.role);
                }
            } catch (err) {
                console.error('Error decoding token:', err);
                toast.error('Phiên đăng nhập không hợp lệ');
                navigate('/auth');
                setLoading(false);
            }
        };

        initializeAuth();
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    useEffect(() => {
        if (userId) {
            fetchMyPages();
            fetchStats();
        }
    }, [userId, selectedStatus, fetchMyPages, fetchStats]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa landing page này khỏi marketplace?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/marketplace/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success('Đã xóa thành công');
            fetchMyPages();
            fetchStats();
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'Không thể xóa landing page');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            DRAFT: { color: '#6b7280', label: 'Bản nháp' },
            PENDING: { color: '#f59e0b', label: 'Chờ duyệt' },
            ACTIVE: { color: '#10b981', label: 'Đang bán' },
            REJECTED: { color: '#ef4444', label: 'Bị từ chối' },
            SUSPENDED: { color: '#f97316', label: 'Tạm ngưng' },
            SOLD_OUT: { color: '#6b7280', label: 'Hết hàng' }
        };
        const badge = badges[status] || { color: '#6b7280', label: 'Không xác định' };
        return (
            <span className="status-badge" style={{ backgroundColor: badge.color, color: 'white' }}>
                {badge.label}
            </span>
        );
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (loading && !stats) {
        return <DogLoader />;
    }

    const statsList = stats ? [
        { key: 'totalPages', label: 'Tổng landing page', value: stats.totalPages, icon: statIcons.totalPages },
        { key: 'activePages', label: 'Đang bán', value: stats.activePages, icon: statIcons.activePages },
        { key: 'pendingPages', label: 'Chờ duyệt', value: stats.pendingPages, icon: statIcons.pendingPages },
        { key: 'revenue', label: 'Doanh thu', value: formatPrice(stats.revenue), icon: statIcons.revenue, isCurrency: true },
        { key: 'totalSales', label: 'Đã bán', value: stats.totalSales, icon: statIcons.totalSales }
    ] : [];

    return (
        <div className="my-sales-container">
            <Header />
            <div className="my-sales-main">
                <Sidebar userRole={userRole} />
                <div className="my-sales-content">
                    <div className="my-sales-header" data-aos="fade-down">
                        <div>
                            <h1>Quản lý Marketplace</h1>
                            <p>Theo dõi và quản lý các landing page bạn đã đăng bán</p>
                        </div>
                        <button className="btn-add" onClick={() => navigate('/sell-page')}>
                            + Đăng bán mới
                        </button>
                    </div>

                    {stats && (
                        <div className="stats-grid" data-aos="fade-up">
                            {statsList.map((stat) => (
                                <div key={stat.key} className="stat-card">
                                    <div className="stat-icon-wrapper">
                                        <IconLuxury
                                            name={stat.icon.name}
                                            color={stat.icon.color}
                                            className="stat-icon"
                                            size={22}
                                        />
                                    </div>
                                    <div className="stat-info">
                                        <div className={`stat-value ${stat.isCurrency ? 'value-gold' : ''}`}>
                                            {stat.value}
                                        </div>
                                        <div className="stat-label">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="filter-section" data-aos="fade-up">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="status-filter"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pages-list1" data-aos="fade-up">
                        {pages.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có landing page nào được đăng bán trên Marketplace</p>
                                <button onClick={() => navigate('/sell-page')}>
                                    Đăng bán ngay
                                </button>
                            </div>
                        ) : (
                            pages.map(page => (
                                <div key={page._id} className="page-item">
                                    <div className="page-image">
                                        <img
                                            loading="lazy"
                                            src={page.main_screenshot || 'https://via.placeholder.com/300x200?text=Preview'}
                                            alt={page.title}
                                        />
                                        <div className="image-placeholder">No Image</div>
                                        <div className="page-overlay">
                                            <div className="action-buttons1">
                                                <button
                                                    className="btn-view1"
                                                    onClick={() => navigate(`/marketplace/${page._id}`)}
                                                >
                                                    <IconLuxury name="View" size={16} color="white" />
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(page._id)}
                                                >
                                                    <IconLuxury name="Trash" size={16} color="#ef4444" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="page-info">
                                        <div className="page-header">
                                            <h3 title={page.title}>{page.title}</h3>
                                            {getStatusBadge(page.status)}
                                        </div>
                                        <p className="page-category">{page.category}</p>
                                        <p className="page-description">
                                            {page.description?.substring(0, 80) || 'Không có mô tả'}...
                                        </p>
                                        <div className="page-meta1">
                        <span>
                            <IconLuxury name="View" size={12} color="#7F8C8D" /> {page.views} lượt xem
                        </span>
                                            <span>
                            <IconLuxury name="Check" size={12} color="#7F8C8D" /> {page.likes} thích
                        </span>
                                            <span>
                            <IconLuxury name="ShoppingBag" size={12} color="#7F8C8D" /> {page.sold_count} đã bán
                        </span>
                                        </div>
                                        {page.rejection_reason && (
                                            <div className="rejection-reason" title={page.rejection_reason}>
                                                <strong>Lý do từ chối:</strong> {page.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="page-actions">
                                        <div className="page-price">{formatPrice(page.price)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MySales;