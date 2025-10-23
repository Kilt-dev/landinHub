import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import PayoutRequest from '../components/PayoutRequest';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Payments.css';
import DogLoader from '../components/Loader';
import {
    DollarSign, CreditCard, Clock, CheckCircle, XCircle,
    Download, Filter, Calendar, TrendingUp, Users, Eye
} from 'lucide-react';

const Payments = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedMethod, setSelectedMethod] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const statusOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'PENDING', label: 'Chờ thanh toán', color: '#f59e0b' },
        { value: 'PROCESSING', label: 'Đang xử lý', color: '#3b82f6' },
        { value: 'COMPLETED', label: 'Hoàn thành', color: '#10b981' },
        { value: 'FAILED', label: 'Thất bại', color: '#ef4444' },
        { value: 'CANCELLED', label: 'Đã hủy', color: '#6b7280' },
        { value: 'REFUNDED', label: 'Đã hoàn tiền', color: '#8b5cf6' }
    ];

    const paymentMethods = [
        { value: 'all', label: 'Tất cả phương thức' },
        { value: 'MOMO', label: 'MOMO', icon: '📱' },
        { value: 'VNPAY', label: 'VNPay', icon: '🏦' },
        { value: 'SANDBOX', label: 'Sandbox', icon: '💳' },
        { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: '🏧' }
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
                if (!decodedToken.role || !decodedToken.userId) {
                    navigate('/auth');
                    setLoading(false);
                    return;
                }
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
            loadTransactions();
            loadStats();
        }
    }, [userRole, selectedStatus, selectedMethod, currentPage]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10
            });

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }
            if (selectedMethod !== 'all') {
                params.append('payment_method', selectedMethod);
            }
            if (dateRange.start) {
                params.append('start_date', dateRange.start);
            }
            if (dateRange.end) {
                params.append('end_date', dateRange.end);
            }

            const endpoint = userRole === 'admin'
                ? `${API_BASE_URL}/api/payment/admin/transactions`
                : `${API_BASE_URL}/api/payment/transactions`;

            const response = await axios.get(`${endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTransactions(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load transactions error:', err);
            toast.error('Không thể tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin'
                ? `${API_BASE_URL}/api/payment/admin/stats`
                : `${API_BASE_URL}/api/payment/stats`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data.data);
        } catch (err) {
            console.error('Load stats error:', err);
        }
    };

    const handleExportTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedStatus !== 'all') params.append('status', selectedStatus);
            if (selectedMethod !== 'all') params.append('payment_method', selectedMethod);
            if (dateRange.start) params.append('start_date', dateRange.start);
            if (dateRange.end) params.append('end_date', dateRange.end);

            const endpoint = userRole === 'admin'
                ? `${API_BASE_URL}/api/payment/admin/export`
                : `${API_BASE_URL}/api/payment/export`;

            const response = await axios.get(`${endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transactions-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Đã xuất dữ liệu thành công');
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Không thể xuất dữ liệu');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusInfo = statusOptions.find(s => s.value === status) || statusOptions[0];
        return (
            <span
                className="status-badge1"
                style={{
                    backgroundColor: statusInfo.color || '#6b7280',
                    color: 'white'
                }}
            >
                {statusInfo.label}
            </span>
        );
    };

    const getPaymentMethodIcon = (method) => {
        const methodInfo = paymentMethods.find(m => m.value === method);
        return methodInfo?.icon || '💳';
    };

    const getTransactionType = (txn) => {
        if (!user || userRole === 'admin') return null;

        const currentUserId = user?.id || user?.userId || user?._id;
        const buyerId = txn.buyer_id?._id || txn.buyer_id;
        const sellerId = txn.seller_id?._id || txn.seller_id;

        if (buyerId?.toString() === currentUserId?.toString()) {
            return { type: 'buy', label: '🛒 Đã mua', color: '#3b82f6' };
        } else if (sellerId?.toString() === currentUserId?.toString()) {
            return { type: 'sell', label: '💰 Đã bán', color: '#10b981' };
        }
        return { type: 'unknown', label: 'N/A', color: '#6b7280' };
    };

    const handleViewDetail = (transaction) => {
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
    };

    if (loading && !stats) {
        return <DogLoader />;
    }

    return (
        <div className="payments-container">
            <Sidebar role={userRole} />
            <div className="payments-main">
                <Header />
                <div className="payments-content">
                    {/* Header */}
                    <div className="payments-header" data-aos="fade-down">
                        <div>
                            <h1>💰 {userRole === 'admin' ? 'Quản lý thanh toán' : 'Lịch sử thanh toán'}</h1>
                            <p>{userRole === 'admin' ? 'Quản lý toàn bộ giao dịch trên hệ thống' : 'Theo dõi lịch sử giao dịch của bạn'}</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                        <div className="stats-grid" data-aos="fade-up">
                            {userRole === 'admin' ? (
                                <>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#e0f2fe' }}>
                                            <DollarSign size={28} color="#0284c7" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.totalRevenue || 0)}</div>
                                            <div className="stat-label">Tổng doanh thu</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#f3e8ff' }}>
                                            <TrendingUp size={28} color="#9333ea" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.totalPlatformFee || 0)}</div>
                                            <div className="stat-label">Phí platform</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#dcfce7' }}>
                                            <CheckCircle size={28} color="#16a34a" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{stats.completedCount || 0}</div>
                                            <div className="stat-label">Thành công</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#fef3c7' }}>
                                            <Clock size={28} color="#d97706" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{stats.pendingCount || 0}</div>
                                            <div className="stat-label">Chờ xử lý</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#e0f2fe' }}>
                                            <DollarSign size={28} color="#0284c7" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.totalRevenue || 0)}</div>
                                            <div className="stat-label">Doanh thu bán hàng</div>
                                            <div className="stat-sublabel">{stats.salesCount || 0} lượt bán</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#dcfce7' }}>
                                            <CheckCircle size={28} color="#16a34a" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.totalEarned || 0)}</div>
                                            <div className="stat-label">Thu nhập thực</div>
                                            <div className="stat-sublabel">Sau trừ phí 10%</div>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-card highlight-card"
                                        onClick={() => {
                                            if (stats.pendingPayout > 0) {
                                                setShowPayoutModal(true);
                                            } else {
                                                toast.info('Bạn chưa có tiền để rút');
                                            }
                                        }}
                                    >
                                        <div className="stat-icon" style={{ background: '#fef3c7' }}>
                                            <Clock size={28} color="#d97706" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.pendingPayout || 0)}</div>
                                            <div className="stat-label">Chờ rút tiền</div>
                                            <div className="stat-sublabel">Click để yêu cầu rút</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon" style={{ background: '#d1fae5' }}>
                                            <TrendingUp size={28} color="#059669" />
                                        </div>
                                        <div className="stat-info">
                                            <div className="stat-value">{formatPrice(stats.completedPayout || 0)}</div>
                                            <div className="stat-label">Đã nhận</div>
                                            <div className="stat-sublabel">Đã chuyển khoản</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="payments-filters" data-aos="fade-up">
                        <div className="filter-row">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="filter-select"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedMethod}
                                onChange={(e) => setSelectedMethod(e.target.value)}
                                className="filter-select"
                            >
                                {paymentMethods.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.icon && `${opt.icon} `}{opt.label}
                                    </option>
                                ))}
                            </select>

                            <div className="date-filters">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="date-input"
                                />
                                <span>đến</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="date-input"
                                />
                            </div>

                            <button className="filter-btn" onClick={loadTransactions}>
                                <Filter size={16} /> Lọc
                            </button>
                            <button className="export-btn" onClick={handleExportTransactions}>
                                <Download size={16} /> Xuất CSV
                            </button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="transactions-table" data-aos="fade-up">
                        {loading ? (
                            <DogLoader />
                        ) : transactions.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có giao dịch nào</p>
                            </div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        {userRole !== 'admin' && <th>Loại</th>}
                                        <th>Ngày</th>
                                        <th>Sản phẩm</th>
                                        {userRole === 'admin' && <th>Người mua</th>}
                                        {userRole === 'admin' && <th>Người bán</th>}
                                        <th>Phương thức</th>
                                        <th>Số tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {transactions.map((txn) => {
                                        const txnType = getTransactionType(txn);
                                        return (
                                            <tr key={txn._id}>
                                                <td>
                                                    <code className="transaction-id">
                                                        {txn._id.substring(0, 8)}...
                                                    </code>
                                                </td>
                                                {userRole !== 'admin' && txnType && (
                                                    <td>
                                                    <span
                                                        className="transaction-type-badge"
                                                        style={{
                                                            backgroundColor: txnType.color,
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {txnType.label}
                                                    </span>
                                                    </td>
                                                )}
                                                <td>{formatDate(txn.created_at)}</td>
                                                <td>
                                                    <div className="product-info">
                                                        <strong>{txn.marketplace_page_id?.title || 'N/A'}</strong>
                                                    </div>
                                                </td>
                                                {userRole === 'admin' && (
                                                    <td>
                                                        {txn.buyer_id?.name || txn.buyer_id?.email || 'N/A'}
                                                    </td>
                                                )}
                                                {userRole === 'admin' && (
                                                    <td>
                                                        {txn.seller_id?.name || txn.seller_id?.email || 'N/A'}
                                                    </td>
                                                )}
                                                <td>
                                                    <span className="payment-method">
                                                        {getPaymentMethodIcon(txn.payment_method)} {txn.payment_method}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong className="amount">{formatPrice(txn.amount)}</strong>
                                                </td>
                                                <td>{getStatusBadge(txn.status)}</td>
                                                <td>
                                                    <button
                                                        className="view-detail-btn"
                                                        onClick={() => handleViewDetail(txn)}
                                                    >
                                                        <Eye size={16} /> Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                        >
                                            Trước
                                        </button>
                                        <span>Trang {currentPage} / {totalPages}</span>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedTransaction && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Chi tiết giao dịch</h2>
                        <div className="transaction-detail">
                            <div className="detail-row">
                                <span className="label">ID giao dịch:</span>
                                <code>{selectedTransaction._id}</code>
                            </div>
                            <div className="detail-row">
                                <span className="label">Sản phẩm:</span>
                                <span>{selectedTransaction.marketplace_page_id?.title}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Số tiền:</span>
                                <strong>{formatPrice(selectedTransaction.amount)}</strong>
                            </div>
                            <div className="detail-row">
                                <span className="label">Phí nền tảng:</span>
                                <span>{formatPrice(selectedTransaction.platform_fee || 0)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Người bán nhận:</span>
                                <span>{formatPrice(selectedTransaction.seller_amount)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Phương thức:</span>
                                <span>{getPaymentMethodIcon(selectedTransaction.payment_method)} {selectedTransaction.payment_method}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Trạng thái:</span>
                                {getStatusBadge(selectedTransaction.status)}
                            </div>
                            <div className="detail-row">
                                <span className="label">Ngày tạo:</span>
                                <span>{formatDate(selectedTransaction.created_at)}</span>
                            </div>
                            {selectedTransaction.paid_at && (
                                <div className="detail-row">
                                    <span className="label">Ngày thanh toán:</span>
                                    <span>{formatDate(selectedTransaction.paid_at)}</span>
                                </div>
                            )}
                        </div>
                        <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* Payout Request Modal */}
            <PayoutRequest
                isOpen={showPayoutModal}
                onClose={() => setShowPayoutModal(false)}
                pendingAmount={stats?.pendingPayout || 0}
                onSuccess={() => {
                    loadStats();
                    loadTransactions();
                }}
            />
        </div>
    );
};

export default React.memo(Payments);