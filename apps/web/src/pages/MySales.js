import React, {useState, useEffect, useCallback, useContext} from 'react';
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
import { Eye, Trash2 } from 'lucide-react';

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

    const fetchMyPages = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/my/pages`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                params: { status: selectedStatus !== 'all' ? selectedStatus : undefined }
            });
            console.log('MySales pages response:', response.data);
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
    }, [userId, selectedStatus]);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/seller/stats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('Stats response:', response.data);
            setStats(response.data.data);
        } catch (err) {
            console.error('Fetch stats error:', err);
            toast.error('Không thể tải thống kê bán hàng');
        }
    }, [userId]);

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
            <span className="status-badge" style={{ backgroundColor: badge.color, color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem' }}>
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

    return (
        <div className="my-sales-container">
            <Header />
            <div className="my-sales-main">
                <Sidebar userRole={userRole} />

                <div className="my-sales-content">
                    <div className="my-sales-header" data-aos="fade-down">
                        <div>
                            <h1>Quản lý Landing Page Đang Bán</h1>
                            <p>Theo dõi và quản lý các landing page bạn đã đăng bán</p>
                        </div>
                        <button className="btn-add" onClick={() => navigate('/sell-page')}>
                            + Đăng bán mới
                        </button>
                    </div>

                    {stats && (
                        <div className="stats-grid" data-aos="fade-up">
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats.totalPages}</div>
                                    <div className="stat-label">Tổng landing page</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats.activePages}</div>
                                    <div className="stat-label">Đang bán</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⏳</div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats.pendingPages}</div>
                                    <div className="stat-label">Chờ duyệt</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.revenue)}</div>
                                    <div className="stat-label">Doanh thu</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🛒</div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats.totalSales}</div>
                                    <div className="stat-label">Đã bán</div>
                                </div>
                            </div>
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

                    <div className="pages-list" data-aos="fade-up">
                        {pages.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có landing page nào</p>
                                <button onClick={() => navigate('/sell-page')}>
                                    Đăng bán ngay
                                </button>
                            </div>
                        ) : (
                            pages.map(page => (
                                <div key={page._id} className="page-item">
                                    <div className="page-image">
                                        <img src={page.main_screenshot || '/placeholder.png'} alt={page.title} />
                                    </div>
                                    <div className="page-info">
                                        <div className="page-header">
                                            <h3>{page.title}</h3>
                                            {getStatusBadge(page.status)}
                                        </div>
                                        <p className="page-category">{page.category}</p>
                                        <p className="page-description">
                                            {page.description?.substring(0, 150) || 'Không có mô tả'}...
                                        </p>
                                        <div className="page-meta">
                                            <span>👁️ {page.views} lượt xem</span>
                                            <span>❤️ {page.likes} thích</span>
                                            <span>🛒 {page.sold_count} đã bán</span>
                                        </div>
                                        {page.rejection_reason && (
                                            <div className="rejection-reason">
                                                <strong>Lý do từ chối:</strong> {page.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="page-actions">
                                        <div className="page-price">{formatPrice(page.price)}</div>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={() => navigate(`/marketplace/${page._id}`)}
                                            >
                                                <Eye size={16} /> Xem
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(page._id)}
                                            >
                                                <Trash2 size={16} /> Xóa
                                            </button>
                                        </div>
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