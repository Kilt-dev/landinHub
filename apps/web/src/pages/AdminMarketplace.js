import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/AdminMarketplace.css';
import DogLoader from '../components/Loader';
import { Check, X, Eye, Star, AlertTriangle, Trash2, Download, RefreshCw, Filter, Pause, ShoppingCart, Package, Hourglass, BadgeCheck, DollarSign, Heart, LayoutTemplate, User, Store, Calendar } from 'lucide-react';

const AdminMarketplace = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [pages, setPages] = useState([]);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [refundRequests, setRefundRequests] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('PENDING');
    const [selectedPage, setSelectedPage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedPages, setSelectedPages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [suspendReason, setSuspendReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [pageToReject, setPageToReject] = useState(null);
    const [pageToSuspend, setPageToSuspend] = useState(null);
    const [currentTab, setCurrentTab] = useState('pages');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const [orders, setOrders] = useState([]);
    const statusOptions = useMemo(() => [
        { value: 'all', label: 'Tất cả' },
        { value: 'PENDING', label: 'Chờ duyệt' },
        { value: 'ACTIVE', label: 'Đã duyệt' },
        { value: 'REJECTED', label: 'Bị từ chối' },
        { value: 'SUSPENDED', label: 'Tạm ngưng' }
    ], []);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/auth');
                setLoading(false); return;
            }
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken.role !== 'admin') {
                    toast.error('Bạn không có quyền truy cập trang này');
                    navigate('/dashboard'); return;
                }
                setUserRole(decodedToken.role);
            } catch (err) {
                console.error('Lỗi giải mã token:', err);
                toast.error('Phiên đăng nhập không hợp lệ');
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };
        if (user?.role === 'admin') {
            setUserRole(user.role);
            setLoading(false);
        } else {
            initializeAuth();
        }
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    const loadPages = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = selectedStatus === 'PENDING'
                ? `${API_BASE_URL}/api/admin/marketplace/pending?page=${page}&limit=${limit}`
                : `${API_BASE_URL}/api/admin/marketplace/pages?page=${page}&limit=${limit}${selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setPages(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load pages error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách marketplace pages');
        } finally {
            setLoading(false);
        }
    }, [selectedStatus, page, limit, searchTerm, API_BASE_URL]);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/admin/orders?page=${page}&limit=${limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
            const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setOrders(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load orders error:', err);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchTerm, API_BASE_URL]);

    const loadStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/marketplace/stats`, { headers: { Authorization: `Bearer ${token}` } });
            setStats(response.data.data);
        } catch (err) {
            console.error('Load stats error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải thống kê');
        }
    }, [API_BASE_URL]);

    const loadRefundRequests = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/marketplace/refunds`, { headers: { Authorization: `Bearer ${token}` } });
            setRefundRequests(response.data.data || []);
        } catch (err) {
            console.error('Load refund requests error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách yêu cầu hoàn tiền');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        if (userRole === 'admin') {
            if (currentTab === 'pages') {
                loadPages();
                loadStats();
            } else if (currentTab === 'refunds') {
                loadRefundRequests();
            } else if (currentTab === 'orders') {
                loadOrders();
            }
        }
    }, [userRole, currentTab, loadPages, loadStats, loadRefundRequests, loadOrders]);

    const handleApprove = async (id) => {
        if (!window.confirm('Bạn có chắc muốn duyệt landing page này?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/admin/marketplace/pages/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Đã duyệt thành công');
            loadPages(); loadStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể duyệt');
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (id) => { setPageToReject(id); setShowRejectModal(true); };
    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.warning('Vui lòng nhập lý do từ chối'); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/admin/marketplace/pages/${pageToReject}/reject`, { reason: rejectReason }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Đã từ chối landing page');
            setShowRejectModal(false); setRejectReason(''); setPageToReject(null);
            loadPages(); loadStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể từ chối');
        } finally {
            setActionLoading(false);
        }
    };

    const openSuspendModal = (id) => { setPageToSuspend(id); setShowSuspendModal(true); };
    const handleSuspend = async () => {
        if (!suspendReason.trim()) { toast.warning('Vui lòng nhập lý do tạm ngưng'); return; }
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/admin/marketplace/pages/${pageToSuspend}/suspend`, { reason: suspendReason }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Đã tạm ngưng landing page');
            setShowSuspendModal(false); setSuspendReason(''); setPageToSuspend(null);
            loadPages(); loadStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tạm ngưng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa landing page này?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/marketplace/pages/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Đã xóa thành công');
            loadPages(); loadStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể xóa');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = useCallback((status) => {
        const badges = {
            DRAFT: { color: '#6b7280', label: 'Bản nháp' },
            PENDING: { color: '#f59e0b', label: 'Chờ duyệt' },
            ACTIVE: { color: '#10b981', label: 'Đã duyệt' },
            REJECTED: { color: '#ef4444', label: 'Từ chối' },
            SUSPENDED: { color: '#f97316', label: 'Tạm ngưng' },
            COMPLETED: { color: '#10b981', label: 'Hoàn thành' },
            REFUND_PENDING: { color: '#f59e0b', label: 'Chờ hoàn tiền' }
        };
        const badge = badges[status] || { color: '#6b7280', label: status };
        return (<span className="status-badge123" style={{ backgroundColor: badge.color }}>{badge.label}</span>);
    }, []);

    const formatPrice = useCallback((price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price), []);
    const formatDate = useCallback((date) => new Date(date).toLocaleString('vi-VN'), []);

    if (loading && !stats) return <DogLoader />;


    return (
        <div className="admin-marketplace-container">
            <Header />
            <div className="admin-marketplace-main">
                <Sidebar role={userRole} />
                <div className="admin-marketplace-content">
                    <div className="admin-marketplace-header" data-aos="fade-down">
                        <h1><ShoppingCart size={32} /> Quản lý Marketplace</h1>
                        <p>Quản lý landing page, giao dịch và yêu cầu hoàn tiền</p>
                    </div>
                    <div className="tabs" data-aos="fade-up">
                        <button className={`tab ${currentTab === 'pages' ? 'active' : ''}`} onClick={() => setCurrentTab('pages')}>Landing Pages</button>
                        <button className={`tab ${currentTab === 'orders' ? 'active' : ''}`} onClick={() => setCurrentTab('orders')}>📦 Đơn hàng</button>
                        <button className={`tab ${currentTab === 'refunds' ? 'active' : ''}`} onClick={() => setCurrentTab('refunds')}>Yêu cầu hoàn tiền</button>
                    </div>

                    {stats && currentTab === 'pages' && (
                        <div className="stats-grid" data-aos="fade-up">
                            {/* Stats Cards */}
                        </div>
                    )}

                    {currentTab === 'pages' && (
                        <>
                            {/* Nội dung tab Landing Pages */}
                        </>
                    )}

                    {/* === KHỐI CODE MỚI CHO TAB ĐƠN HÀNG - DẠNG BẢNG === */}
                    {currentTab === 'orders' && (
                        <>
                            <div className="admin-toolbar" data-aos="fade-up">
                                <div className="toolbar-left">
                                    <div className="search-box">
                                        <input type="text" placeholder="Tìm theo mã đơn, sản phẩm, người mua/bán..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                                        <Filter size={18} />
                                    </div>
                                </div>
                                <div className="toolbar-right">
                                    <button className="toolbar-btn" onClick={loadOrders} title="Làm mới" disabled={actionLoading}><RefreshCw size={18} /> Làm mới</button>
                                </div>
                            </div>

                            <div className="orders-table-container" data-aos="fade-up">
                                {loading ? (<DogLoader />) : orders.length === 0 ? (
                                    <div className="empty-state"><p>{searchTerm ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào'}</p></div>
                                ) : (
                                    <table className="orders-table">
                                        <thead>
                                        <tr>
                                            <th>Mã Đơn</th>
                                            <th>Sản phẩm</th>
                                            <th>Người Mua</th>
                                            <th>Người Bán</th>
                                            <th>Ngày Tạo</th>
                                            <th className="cell-right">Giá</th>
                                            <th className="cell-center">Trạng Thái</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {orders.map(order => (
                                            <tr key={order._id}>
                                                <td data-label="Mã Đơn"><strong>{order.orderId}</strong></td>
                                                <td data-label="Sản phẩm">{order.marketplacePageId?.title || 'N/A'}</td>
                                                <td data-label="Người Mua">{order.buyerId?.name || order.buyerId?.email || 'N/A'}</td>
                                                <td data-label="Người Bán">{order.sellerId?.name || order.sellerId?.email || 'N/A'}</td>
                                                <td data-label="Ngày Tạo">{formatDate(order.createdAt)}</td>
                                                <td data-label="Giá" className="cell-right cell-price">{formatPrice(order.price)}</td>
                                                <td data-label="Trạng Thái" className="cell-center">{getStatusBadge(order.status)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination" data-aos="fade-up">
                                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1 || actionLoading}>Trước</button>
                                    <span>Trang {page} / {totalPages}</span>
                                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages || actionLoading}>Sau</button>
                                </div>
                            )}
                        </>
                    )}

                    {currentTab === 'refunds' && (
                        <>
                            {/* Nội dung tab Refunds */}
                        </>
                    )}

                    {/* Các Modals */}
                </div>
            </div>
        </div>
    );
};

export default AdminMarketplace;