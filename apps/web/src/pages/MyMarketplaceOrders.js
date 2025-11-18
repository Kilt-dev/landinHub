import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '@landinghub/api';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Market.css';
import DogLoader from '../components/Loader';
import { ShoppingBag, Download, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, RefreshCw, DollarSign, TrendingUp, Package } from 'lucide-react';

const MyMarketplaceOrders = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [activeTab, setActiveTab] = useState('bought'); // 'bought' or 'sold'
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        processing: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        totalRevenue: 0,
        platformFees: 0
    });
    const navigate = useNavigate();

    const statusOptions = [
        { value: 'all', label: 'Tất cả', icon: ShoppingBag, color: '#6b7280' },
        { value: 'pending', label: 'Chờ xử lý', icon: AlertCircle, color: '#f59e0b' },
        { value: 'processing', label: 'Đang xử lý', icon: RefreshCw, color: '#3b82f6' },
        { value: 'delivered', label: 'Đã giao', icon: CheckCircle, color: '#10b981' },
        { value: 'cancelled', label: 'Đã hủy', icon: XCircle, color: '#ef4444' },
        { value: 'refunded', label: 'Đã hoàn tiền', icon: RefreshCw, color: '#8b5cf6' }
    ];

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                setLoading(false);
                return;
            }
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role);
            } catch (err) {
                console.error('Lỗi giải mã token:', err);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role) {
            setUserRole(user.role);
            setLoading(false);
        } else {
            initializeAuth();
        }
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    useEffect(() => {
        if (userRole) {
            loadOrders();
        }
    }, [userRole, currentPage, selectedStatus, activeTab]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20
            });

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            // Different endpoints for bought vs sold orders
            const endpoint = activeTab === 'bought' ? '/api/orders/my' : '/api/orders/seller';
            console.log('🔍 Loading orders from:', endpoint);

            const response = await api.get(`${endpoint}?${params}`);

            console.log('📦 Orders API Response:', response.data);
            console.log('📊 Orders data array:', response.data.data);
            console.log('📏 Orders count:', response.data.data?.length);

            if (response.data.success) {
                const orderData = response.data.data || [];
                console.log('✅ Setting orders state with', orderData.length, 'items');
                setOrders(orderData);
                setFilteredOrders(orderData);
                setTotalPages(response.data.pagination?.totalPages || 1);

                // Calculate stats
                const statsData = {
                    total: orderData.length,
                    processing: orderData.filter(o => o.status === 'processing').length,
                    delivered: orderData.filter(o => o.status === 'delivered').length,
                    cancelled: orderData.filter(o => o.status === 'cancelled').length,
                    refunded: orderData.filter(o => o.status === 'refunded').length
                };

                if (activeTab === 'sold') {
                    statsData.totalRevenue = orderData.reduce((sum, order) => {
                        if (order.status === 'delivered') {
                            return sum + (order.seller_revenue || 0);
                        }
                        return sum;
                    }, 0);
                    statsData.platformFees = orderData.reduce((sum, order) => {
                        if (order.status === 'delivered') {
                            return sum + (order.platform_fee || 0);
                        }
                        return sum;
                    }, 0);
                }

                setStats(statsData);
            }
        } catch (err) {
            console.error('Lỗi tải đơn hàng:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        if (!statusOption) return null;

        const Icon = statusOption.icon;
        return (
            <span
                className="order-status-badge"
                style={{ backgroundColor: statusOption.color }}
            >
                <Icon size={14} /> {statusOption.label}
            </span>
        );
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDownload = async (orderId) => {
        try {
            const response = await api.get(`/api/orders/${orderId}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `order-${orderId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Đang tải xuống landing page...');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Không thể tải xuống. Vui lòng thử lại sau.');
        }
    };

    if (loading && orders.length === 0) {
        return <DogLoader />;
    }

    return (
        <div className="my-orders-container">
            <Header />
            <div className="my-orders-main">
                <Sidebar userRole={userRole} />
                <div className="my-orders-content">
                    <div className="my-orders-header" data-aos="fade-down">
                        <div>
                            <h1>Đơn hàng Marketplace</h1>
                            <p>Quản lý đơn hàng đã mua và đơn hàng bán ra</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="orders-tabs" data-aos="fade-up">
                        <button
                            className={`tab-button ${activeTab === 'bought' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('bought');
                                setCurrentPage(1);
                                setSelectedStatus('all');
                            }}
                        >
                            <ShoppingBag size={18} />
                            Đã mua
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'sold' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('sold');
                                setCurrentPage(1);
                                setSelectedStatus('all');
                            }}
                        >
                            <Package size={18} />
                            Bán ra
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="orders-stats" data-aos="fade-up">
                        <div className="stat-card1">
                            <div className="stat-icon">
                                <ShoppingBag size={24} color="#6b7280" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Tổng đơn</div>
                            </div>
                        </div>
                        <div className="stat-card1">
                            <div className="stat-icon">
                                <RefreshCw size={24} color="#3b82f6" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.processing}</div>
                                <div className="stat-label">Đang xử lý</div>
                            </div>
                        </div>
                        <div className="stat-card1">
                            <div className="stat-icon">
                                <CheckCircle size={24} color="#10b981" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.delivered}</div>
                                <div className="stat-label">Đã giao</div>
                            </div>
                        </div>
                        {activeTab === 'sold' && (
                            <div className="stat-card1">
                                <div className="stat-icon">
                                    <DollarSign size={24} color="#B8860B" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
                                    <div className="stat-label">Doanh thu</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter */}
                    <div className="orders-filter" data-aos="fade-up">
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

                    {/* Orders List */}
                    <div className="orders-list" data-aos="fade-up">
                        {loading ? (
                            <div className="loading-spinner">
                                <RefreshCw className="spin" size={32} />
                                <p>Đang tải...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="empty-state">
                                <ShoppingBag size={64} color="#ccc" />
                                <p>
                                    {activeTab === 'bought'
                                        ? 'Bạn chưa mua landing page nào'
                                        : 'Chưa có đơn hàng bán ra'}
                                </p>
                                {activeTab === 'bought' && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => navigate('/marketplace')}
                                    >
                                        Khám phá Marketplace
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order._id} className="order-card">
                                    <div className="order-header">
                                        <div className="order-id">
                                            <Calendar size={16} />
                                            <span>#{order.order_id || order._id}</span>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div className="order-body">
                                        <div className="order-image">
                                            <img
                                                src={order.page?.main_screenshot || order.marketplace_page?.main_screenshot || '/placeholder.png'}
                                                alt={order.page?.title || order.marketplace_page?.title || 'Landing Page'}
                                            />
                                        </div>
                                        <div className="order-details">
                                            <h3>{order.page?.title || order.marketplace_page?.title || 'Landing Page'}</h3>
                                            <p className="order-date">
                                                <Calendar size={14} />
                                                {formatDate(order.created_at || order.createdAt)}
                                            </p>
                                            {activeTab === 'bought' ? (
                                                <p className="order-seller">
                                                    Người bán: {order.seller?.name || order.seller?.username || 'N/A'}
                                                </p>
                                            ) : (
                                                <p className="order-buyer">
                                                    Người mua: {order.buyer?.name || order.buyer?.username || 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="order-actions">
                                            <div className="order-price">
                                                <span className="price-label">Giá:</span>
                                                <span className="price-value">{formatPrice(order.amount)}</span>
                                            </div>
                                            {activeTab === 'sold' && order.seller_revenue && (
                                                <div className="seller-revenue">
                                                    <span className="revenue-label">Bạn nhận:</span>
                                                    <span className="revenue-value">{formatPrice(order.seller_revenue)}</span>
                                                </div>
                                            )}
                                            {order.status === 'delivered' && activeTab === 'bought' && (
                                                <button
                                                    className="btn-download"
                                                    onClick={() => handleDownload(order._id)}
                                                >
                                                    <Download size={16} />
                                                    Tải xuống
                                                </button>
                                            )}
                                            <button
                                                className="btn-view-detail"
                                                onClick={() => navigate(`/marketplace/${order.marketplace_page?._id || order.page?._id}`)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination" data-aos="fade-up">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                                className="pagination-btn"
                            >
                                Trước
                            </button>
                            <span className="pagination-info">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="pagination-btn"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyMarketplaceOrders;
