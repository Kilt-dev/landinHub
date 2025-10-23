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
import { Check, X, Eye, Star, AlertTriangle, Trash2, Download, RefreshCw, Filter, Pause, ShoppingCart, Package, Hourglass, BadgeCheck, DollarSign, Heart } from 'lucide-react';

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

    const transactionStatusOptions = useMemo(() => [
        { value: 'all', label: 'Tất cả' },
        { value: 'PENDING', label: 'Chờ xử lý' },
        { value: 'COMPLETED', label: 'Hoàn thành' },
        { value: 'REFUND_PENDING', label: 'Chờ hoàn tiền' }
    ], []);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/auth');
                setLoading(false);
                return;
            }
            try {
                const decodedToken = jwtDecode(token);
                if (decodedToken.role !== 'admin') {
                    toast.error('Bạn không có quyền truy cập trang này');
                    navigate('/dashboard');
                    return;
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

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPages(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load pages error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách marketplace pages');
        } finally {
            setLoading(false);
        }
    }, [selectedStatus, page, limit, searchTerm]);
    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/admin/orders?page=${page}&limit=${limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load orders error:', err);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchTerm]);
    useEffect(() => {
        if (userRole === 'admin') {
            if (currentTab === 'pages') {
                loadPages();
                loadStats();
            } else if (currentTab === 'transactions') {
                loadTransactions();
            } else if (currentTab === 'refunds') {
                loadRefundRequests();
            } else if (currentTab === 'orders') {
                loadOrders();
            }
        }
    }, [userRole, currentTab]);

    const loadStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/marketplace/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data.data);
        } catch (err) {
            console.error('Load stats error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải thống kê');
        }
    }, []);

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${API_BASE_URL}/api/admin/marketplace/transactions?page=${page}&limit=${limit}${selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load transactions error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách giao dịch');
        } finally {
            setLoading(false);
        }
    }, [selectedStatus, page, limit, searchTerm]);

    const loadRefundRequests = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/marketplace/refunds`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefundRequests(response.data.data || []);
        } catch (err) {
            console.error('Load refund requests error:', err);
            toast.error(err.response?.data?.message || 'Không thể tải danh sách yêu cầu hoàn tiền');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userRole === 'admin') {
            if (currentTab === 'pages') {
                loadPages();
                loadStats();
            } else if (currentTab === 'transactions') {
                loadTransactions();
            } else if (currentTab === 'refunds') {
                loadRefundRequests();
            }
        }
    }, [userRole, currentTab, loadPages, loadStats, loadTransactions, loadRefundRequests]);

    const handleApprove = async (id) => {
        if (!window.confirm('Bạn có chắc muốn duyệt landing page này?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/pages/${id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã duyệt thành công');
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Approve error:', err);
            toast.error(err.response?.data?.message || 'Không thể duyệt');
        } finally {
            setActionLoading(false);
        }
    };

    const openRejectModal = (id) => {
        setPageToReject(id);
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.warning('Vui lòng nhập lý do từ chối');
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/pages/${pageToReject}/reject`,
                { reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã từ chối landing page');
            setShowRejectModal(false);
            setRejectReason('');
            setPageToReject(null);
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Reject error:', err);
            toast.error(err.response?.data?.message || 'Không thể từ chối');
        } finally {
            setActionLoading(false);
        }
    };

    const openSuspendModal = (id) => {
        setPageToSuspend(id);
        setShowSuspendModal(true);
    };

    const handleSuspend = async () => {
        if (!suspendReason.trim()) {
            toast.warning('Vui lòng nhập lý do tạm ngưng');
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/pages/${pageToSuspend}/suspend`,
                { reason: suspendReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã tạm ngưng landing page');
            setShowSuspendModal(false);
            setSuspendReason('');
            setPageToSuspend(null);
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Suspend error:', err);
            toast.error(err.response?.data?.message || 'Không thể tạm ngưng');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFeatured = async (id) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/pages/${id}/toggle-featured`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã cập nhật trạng thái featured');
            loadPages();
        } catch (err) {
            console.error('Toggle featured error:', err);
            toast.error(err.response?.data?.message || 'Không thể cập nhật');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa landing page này?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/marketplace/pages/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã xóa thành công');
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'Không thể xóa');
        } finally {
            setActionLoading(false);
        }
    };

    const handleProcessRefund = async (transactionId) => {
        if (!window.confirm('Bạn có chắc muốn hoàn tiền cho giao dịch này?')) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/refunds/process`,
                { transaction_id: transactionId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã hoàn tiền thành công');
            loadRefundRequests();
        } catch (err) {
            console.error('Process refund error:', err);
            toast.error(err.response?.data?.message || 'Không thể hoàn tiền');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRefund = async (transactionId, reason) => {
        if (!reason.trim()) {
            toast.warning('Vui lòng nhập lý do từ chối hoàn tiền');
            return;
        }
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/admin/marketplace/refunds/reject`,
                { transaction_id: transactionId, reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Đã từ chối yêu cầu hoàn tiền');
            loadRefundRequests();
        } catch (err) {
            console.error('Reject refund error:', err);
            toast.error(err.response?.data?.message || 'Không thể từ chối hoàn tiền');
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
        return (
            <span className="status-badge" style={{
                backgroundColor: badge.color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500'
            }}>
                {badge.label}
            </span>
        );
    }, []);

    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    }, []);

    const formatDate = useCallback((date) => {
        return new Date(date).toLocaleString('vi-VN');
    }, []);

    const handleSelectPage = useCallback((pageId) => {
        setSelectedPages(prev => prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]);
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedPages(selectedPages.length === pages.length ? [] : pages.map(p => p._id));
    }, [selectedPages, pages]);

    const handleBulkApprove = async () => {
        if (selectedPages.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một trang');
            return;
        }
        if (!window.confirm(`Duyệt ${selectedPages.length} trang đã chọn?`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await Promise.all(selectedPages.map(id =>
                axios.post(
                    `${API_BASE_URL}/api/admin/marketplace/pages/${id}/approve`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            ));
            toast.success(`Đã duyệt ${selectedPages.length} trang thành công`);
            setSelectedPages([]);
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Bulk approve error:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt hàng loạt');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPages.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một trang');
            return;
        }
        if (!window.confirm(`Xóa ${selectedPages.length} trang đã chọn? Hành động này không thể hoàn tác!`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await Promise.all(selectedPages.map(id =>
                axios.delete(`${API_BASE_URL}/api/admin/marketplace/pages/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));
            toast.success(`Đã xóa ${selectedPages.length} trang thành công`);
            setSelectedPages([]);
            loadPages();
            loadStats();
        } catch (err) {
            console.error('Bulk delete error:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa hàng loạt');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportData = async () => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/marketplace/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `marketplace-export-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Đã xuất dữ liệu thành công');
        } catch (err) {
            console.error('Export error:', err);
            toast.error(err.response?.data?.message || 'Không thể xuất dữ liệu');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredPages = useMemo(() => {
        // Lọc phía client chỉ khi backend không hỗ trợ tìm kiếm
        if (!searchTerm) return pages;
        return pages.filter(page => {
            const term = searchTerm.toLowerCase();
            return (
                page.title?.toLowerCase().includes(term) ||
                page.description?.toLowerCase().includes(term) ||
                page.category?.toLowerCase().includes(term) ||
                page.seller_id?.name?.toLowerCase().includes(term) ||
                page.seller_id?.email?.toLowerCase().includes(term)
            );
        });
    }, [pages, searchTerm]);

    if (loading && !stats) {
        return <DogLoader />;
    }

    return (
        <div className="admin-marketplace-container">
            <Header />
            <div className="admin-marketplace-main">
                <Sidebar role={userRole} />
                <div className="admin-marketplace-content">
                    <div className="admin-marketplace-header" data-aos="fade-down">
                        <div>
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ShoppingCart size={32} /> Quản lý Marketplace
                            </h1>
                            <p>Quản lý landing page, giao dịch và yêu cầu hoàn tiền</p>
                        </div>
                    </div>

                    <div className="tabs" data-aos="fade-up">
                        <button
                            className={`tab ${currentTab === 'pages' ? 'active' : ''}`}
                            onClick={() => setCurrentTab('pages')}
                        >
                            Landing Pages
                        </button>
                        <button
                            className={`tab ${currentTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setCurrentTab('orders')}
                        >
                            📦 Đơn hàng
                        </button>
                        <button
                            className={`tab ${currentTab === 'refunds' ? 'active' : ''}`}
                            onClick={() => setCurrentTab('refunds')}
                        >
                            Yêu cầu hoàn tiền
                        </button>
                    </div>

                    {stats && currentTab === 'pages' && (
                        <div className="stats-grid" data-aos="fade-up">
                            <div className="stat-card">
                                <div className="stat-icon"><Package size={32} color="var(--color-gray-500)" /></div>                                <div className="stat-info">
                                    <div className="stat-value">{stats.overview?.totalPages || 0}</div>
                                    <div className="stat-label">Tổng pages</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><Hourglass size={32} color="var(--color-warning)" /></div>                                <div className="stat-info">
                                    <div className="stat-value">{stats.overview?.pendingPages || 0}</div>
                                    <div className="stat-label">Chờ duyệt</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><BadgeCheck size={32} color="var(--color-success)" /></div>                                <div className="stat-info">
                                    <div className="stat-value">{stats.overview?.activePages || 0}</div>
                                    <div className="stat-label">Đang bán</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><DollarSign size={32} color="var(--color-info)" /></div>                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.overview?.totalRevenue || 0)}</div>
                                    <div className="stat-label">Doanh thu</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'pages' && (
                        <>
                            <div className="admin-toolbar" data-aos="fade-up">
                                <div className="toolbar-left">
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên, mô tả, người bán..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <Filter size={18} />
                                    </div>
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
                                <div className="toolbar-right">
                                    <button className="toolbar-btn" onClick={loadPages} title="Làm mới" disabled={actionLoading}>
                                        <RefreshCw size={18} /> Làm mới
                                    </button>
                                    <button className="toolbar-btn" onClick={handleExportData} title="Xuất dữ liệu" disabled={actionLoading}>
                                        <Download size={18} /> Xuất CSV
                                    </button>
                                    {selectedPages.length > 0 && (
                                        <>
                                            <button className="toolbar-btn bulk-approve" onClick={handleBulkApprove} disabled={actionLoading}>
                                                <Check size={18} /> Duyệt ({selectedPages.length})
                                            </button>
                                            <button className="toolbar-btn bulk-delete" onClick={handleBulkDelete} disabled={actionLoading}>
                                                <Trash2 size={18} /> Xóa ({selectedPages.length})
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {filteredPages.length > 0 && (
                                <div className="bulk-selection-bar" data-aos="fade-up">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                        <span>Chọn tất cả ({filteredPages.length})</span>
                                    </label>
                                    {selectedPages.length > 0 && (
                                        <span className="selected-count">
                                            Đã chọn: {selectedPages.length} trang
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="pages-list" data-aos="fade-up">
                                {loading ? (
                                    <DogLoader />
                                ) : filteredPages.length === 0 ? (
                                    <div className="empty-state">
                                        <p>{searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có landing page nào'}</p>
                                    </div>
                                ) : (
                                    filteredPages.map(page => (
                                        <div key={page._id} className="admin-page-item">
                                            <div className="page-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPages.includes(page._id)}
                                                    onChange={() => handleSelectPage(page._id)}
                                                />
                                            </div>
                                            <div className="page-image">
                                                <img src={page.main_screenshot || '/placeholder.png'} alt={page.title} />
                                                {page.is_featured && (
                                                    <div className="featured-badge">
                                                        <Star size={16} fill="gold" color="gold" /> Featured
                                                    </div>
                                                )}
                                            </div>
                                            <div className="page-info">
                                                <div className="page-header">
                                                    <h3>{page.title}</h3>
                                                    {getStatusBadge(page.status)}
                                                </div>
                                                <p className="page-seller">
                                                    Người bán: <strong>{page.seller_id?.name || page.seller_id?.email || 'N/A'}</strong>
                                                </p>
                                                <p className="page-category">{page.category}</p>
                                                <p className="page-description">
                                                    {page.description?.substring(0, 150)}...
                                                </p>
                                                <div className="page-meta">
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Eye size={16} /> {page.views}
    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Heart size={16} /> {page.likes}
    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <ShoppingCart size={16} /> {page.sold_count}
    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Star size={16} fill="#f59e0b" color="#f59e0b" /> {page.rating.toFixed(1)}
    </span>
                                                </div>
                                                <p className="page-date">Ngày tạo: {formatDate(page.created_at)}</p>
                                                {page.rejection_reason && (
                                                    <div className="rejection-reason">
                                                        <AlertTriangle size={16} /> {page.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="page-actions">
                                                <div className="page-price">{formatPrice(page.price)}</div>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-view"
                                                        onClick={() => {
                                                            setSelectedPage(page);
                                                            setShowPreviewModal(true);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        <Eye size={16} /> Xem
                                                    </button>
                                                    {page.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                className="btn-approve"
                                                                onClick={() => handleApprove(page._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                <Check size={16} /> Duyệt
                                                            </button>
                                                            <button
                                                                className="btn-reject"
                                                                onClick={() => openRejectModal(page._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                <X size={16} /> Từ chối
                                                            </button>
                                                        </>
                                                    )}
                                                    {page.status === 'ACTIVE' && (
                                                        <>
                                                            <button
                                                                className="btn-suspend"
                                                                onClick={() => openSuspendModal(page._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                <Pause size={16} /> Tạm ngưng
                                                            </button>
                                                            <button
                                                                className="btn-featured"
                                                                onClick={() => handleToggleFeatured(page._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                <Star size={16} /> {page.is_featured ? 'Bỏ' : ''} Featured
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="btn-delete"
                                                        onClick={() => handleDelete(page._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Trash2 size={16} /> Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination" data-aos="fade-up">
                                    <button
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page === 1 || actionLoading}
                                    >
                                        Trước
                                    </button>
                                    <span>Trang {page} / {totalPages}</span>
                                    <button
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={page === totalPages || actionLoading}
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {currentTab === 'orders' && (
                        <>
                            <div className="admin-toolbar" data-aos="fade-up">
                                <div className="toolbar-left">
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            placeholder="Tìm theo mã đơn, tên người mua/bán..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <Filter size={18} />
                                    </div>
                                </div>
                                <div className="toolbar-right">
                                    <button className="toolbar-btn" onClick={loadOrders} title="Làm mới" disabled={actionLoading}>
                                        <RefreshCw size={18} /> Làm mới
                                    </button>
                                </div>
                            </div>

                            <div className="orders-list" data-aos="fade-up">
                                {loading ? (
                                    <DogLoader />
                                ) : orders.length === 0 ? (
                                    <div className="empty-state">
                                        <p>Chưa có đơn hàng nào</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order._id} className="order-item">
                                            <div className="order-info">
                                                <div className="order-header">
                                                    <h3>Mã đơn: {order.orderId}</h3>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <p>Người mua: <strong>{order.buyerId?.name || order.buyerId?.email || 'N/A'}</strong></p>
                                                <p>Người bán: <strong>{order.sellerId?.name || order.sellerId?.email || 'N/A'}</strong></p>
                                                <p>Trang: <strong>{order.marketplacePageId?.title || 'N/A'}</strong></p>
                                                <p>Giá: <strong>{formatPrice(order.price)}</strong></p>
                                                <p>Ngày: {formatDate(order.createdAt)}</p>
                                                {order.refundReason && (
                                                    <div className="refund-reason">
                                                        <AlertTriangle size={16} /> Lý do hoàn tiền: {order.refundReason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination" data-aos="fade-up">
                                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1 || actionLoading}>
                                        Trước
                                    </button>
                                    <span>Trang {page} / {totalPages}</span>
                                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages || actionLoading}>
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {currentTab === 'refunds' && (
                        <>
                            <div className="admin-toolbar" data-aos="fade-up">
                                <div className="toolbar-right">
                                    <button className="toolbar-btn" onClick={loadRefundRequests} title="Làm mới" disabled={actionLoading}>
                                        <RefreshCw size={18} /> Làm mới
                                    </button>
                                </div>
                            </div>

                            <div className="refund-requests-list" data-aos="fade-up">
                                {loading ? (
                                    <DogLoader />
                                ) : refundRequests.length === 0 ? (
                                    <div className="empty-state">
                                        <p>Không có yêu cầu hoàn tiền nào</p>
                                    </div>
                                ) : (
                                    refundRequests.map(request => (
                                        <div key={request._id} className="refund-request-item">
                                            <div className="refund-request-info">
                                                <div className="refund-request-header">
                                                    <h3>Mã giao dịch: {request._id}</h3>
                                                    {getStatusBadge(request.status)}
                                                </div>
                                                <p>Mua bởi: <strong>{request.buyer_id?.name || request.buyer_id?.email || 'N/A'}</strong></p>
                                                <p>Bán bởi: <strong>{request.seller_id?.name || request.seller_id?.email || 'N/A'}</strong></p>
                                                <p>Trang: {request.marketplace_page_id?.title || 'N/A'}</p>
                                                <p>Số tiền: {formatPrice(request.seller_amount)}</p>
                                                <p>Ngày yêu cầu: {formatDate(request.created_at)}</p>
                                            </div>
                                            <div className="refund-request-actions">
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => handleProcessRefund(request._id)}
                                                    disabled={actionLoading}
                                                >
                                                    <Check size={16} /> Duyệt hoàn tiền
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => {
                                                        const reason = prompt('Nhập lý do từ chối hoàn tiền:');
                                                        if (reason) handleRejectRefund(request._id, reason);
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    <X size={16} /> Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Preview Modal */}
                    {showPreviewModal && selectedPage && (
                        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>{selectedPage.title}</h2>
                                <img src={selectedPage.main_screenshot} alt={selectedPage.title} style={{ width: '100%', marginBottom: '20px' }} />
                                <p><strong>Mô tả:</strong> {selectedPage.description}</p>
                                <p><strong>Danh mục:</strong> {selectedPage.category}</p>
                                <p><strong>Giá:</strong> {formatPrice(selectedPage.price)}</p>
                                <p><strong>Người bán:</strong> {selectedPage.seller_id?.name || selectedPage.seller_id?.email}</p>
                                <button onClick={() => setShowPreviewModal(false)} disabled={actionLoading}>Đóng</button>
                            </div>
                        </div>
                    )}

                    {/* Reject Modal */}
                    {showRejectModal && (
                        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>Từ chối landing page</h2>
                                <p style={{ marginBottom: '15px', color: '#6b7280' }}>Vui lòng nhập lý do từ chối để người bán có thể cải thiện:</p>
                                <textarea
                                    placeholder="Ví dụ: Nội dung không phù hợp, vi phạm bản quyền, chất lượng kém..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={5}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectReason('');
                                            setPageToReject(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#e5e7eb',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Xác nhận từ chối
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Suspend Modal */}
                    {showSuspendModal && (
                        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <h2>Tạm ngưng landing page</h2>
                                <p style={{ marginBottom: '15px', color: '#6b7280' }}>Vui lòng nhập lý do tạm ngưng:</p>
                                <textarea
                                    placeholder="Ví dụ: Vi phạm chính sách, cần kiểm tra lại..."
                                    value={suspendReason}
                                    onChange={(e) => setSuspendReason(e.target.value)}
                                    rows={5}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button
                                        onClick={() => {
                                            setShowSuspendModal(false);
                                            setSuspendReason('');
                                            setPageToSuspend(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#e5e7eb',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSuspend}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: '#f97316',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Xác nhận tạm ngưng
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {actionLoading && (
                        <div className="loading-overlay">
                            <DogLoader />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminMarketplace;