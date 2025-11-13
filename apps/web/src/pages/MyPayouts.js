import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/MyPayouts.css';
import DogLoader from '../components/Loader';
import { DollarSign, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react';

const MyPayouts = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0 });
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
            loadPayouts();
        }
    }, [userRole, selectedStatus, currentPage]);

    const loadPayouts = async () => {
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

            const response = await axios.get(`${API_BASE_URL}/api/payout/my-payouts?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPayouts(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);

            // Calculate stats
            const allPayouts = response.data.data || [];
            setStats({
                pending: allPayouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length,
                completed: allPayouts.filter(p => p.status === 'COMPLETED').length,
                failed: allPayouts.filter(p => p.status === 'FAILED').length
            });
        } catch (err) {
            console.error('Load payouts error:', err);
            toast.error('Không thể tải lịch sử rút tiền');
        } finally {
            setLoading(false);
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
        const statusMap = {
            PENDING: { label: 'Chờ duyệt', color: '#f59e0b' },
            PROCESSING: { label: 'Đang xử lý', color: '#3b82f6' },
            COMPLETED: { label: 'Đã nhận tiền', color: '#10b981' },
            FAILED: { label: 'Từ chối', color: '#ef4444' }
        };

        const info = statusMap[status] || statusMap.PENDING;
        return (
            <span className="status-badge2" style={{ backgroundColor: info.color }}>
                {info.label}
            </span>
        );
    };

    if (loading && payouts.length === 0) {
        return <DogLoader />;
    }

    return (
        <div className="my-payouts-container">
            <Sidebar role={userRole} />
            <div className="my-payouts-main">
                <Header />
                <div className="my-payouts-content">
                    {/* Header */}
                    <div className="payouts-header" data-aos="fade-down">
                        <div>
                            <h1>Lịch sử rút tiền</h1>
                            <p>Theo dõi các yêu cầu rút tiền của bạn</p>
                        </div>
                        <button className="btn-back" onClick={() => navigate('/payments')}>
                            ← Quay lại Thanh toán
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid" data-aos="fade-up">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fef3c7' }}>
                                <Clock size={28} color="#d97706" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.pending}</div>
                                <div className="stat-label">Chờ duyệt</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#dcfce7' }}>
                                <CheckCircle size={28} color="#16a34a" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.completed}</div>
                                <div className="stat-label">Đã nhận tiền</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#fee2e2' }}>
                                <XCircle size={28} color="#dc2626" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.failed}</div>
                                <div className="stat-label">Bị từ chối</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="payouts-filters" data-aos="fade-up">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="PROCESSING">Đang xử lý</option>
                            <option value="COMPLETED">Đã nhận tiền</option>
                            <option value="FAILED">Bị từ chối</option>
                        </select>
                    </div>

                    {/* Payouts Table */}
                    <div className="payouts-table" data-aos="fade-up">
                        {loading ? (
                            <DogLoader />
                        ) : payouts.length === 0 ? (
                            <div className="empty-state">
                                <p>Bạn chưa có yêu cầu rút tiền nào</p>
                                <button className="btn-primary" onClick={() => navigate('/payments')}>
                                    Quay lại Thanh toán
                                </button>
                            </div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Ngày yêu cầu</th>
                                        <th>Số tiền</th>
                                        <th>Ngân hàng</th>
                                        <th>Số TK</th>
                                        <th>Trạng thái</th>
                                        <th>Chứng từ</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout._id}>
                                            <td>{formatDate(payout.created_at)}</td>
                                            <td><strong>{formatPrice(payout.amount)}</strong></td>
                                            <td>
                                                <Building2 size={16} style={{ marginRight: '4px' }} />
                                                {payout.bank_info?.bank_name}
                                            </td>
                                            <td><code>{payout.bank_info?.account_number}</code></td>
                                            <td>{getStatusBadge(payout.status)}</td>
                                            <td>
                                                {payout.status === 'COMPLETED' && payout.proof_url ? (
                                                    <a
                                                        href={payout.proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="proof-link"
                                                    >
                                                        <img
                                                            src={payout.proof_url}
                                                            alt="Chứng từ chuyển khoản"
                                                            style={{
                                                                maxWidth: '80px',
                                                                maxHeight: '60px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                border: '1px solid #ddd'
                                                            }}
                                                            title="Click để xem ảnh đầy đủ"
                                                        />
                                                    </a>
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                {payout.status === 'COMPLETED' ? (
                                                    <span className="success-note">
                                                            {payout.notes || 'Đã chuyển khoản'}
                                                        </span>
                                                ) : payout.status === 'FAILED' ? (
                                                    <span className="error-note">
                                                            {payout.notes || 'Bị từ chối'}
                                                        </span>
                                                ) : payout.status === 'PROCESSING' ? (
                                                    <span className="info-note">
                                                            Đang xử lý...
                                                        </span>
                                                ) : (
                                                    <span className="pending-note">
                                                            Chờ admin duyệt
                                                        </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
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
        </div>
    );
};

export default MyPayouts;