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
import '../styles/AdminPayoutManagement.css';
import DogLoader from '../components/Loader';
import {
    DollarSign, Clock, CheckCircle, XCircle, Upload, User, Building2
} from 'lucide-react';

const AdminPayoutManagement = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [payouts, setPayouts] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveData, setApproveData] = useState({ proof_url: '', notes: '' });
    const [rejectData, setRejectData] = useState({ reason: '' });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
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
                if (decodedToken.role !== 'admin') {
                    toast.error('Bạn không có quyền truy cập trang này');
                    navigate('/');
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

        if (user?.role === 'admin') {
            setUserRole('admin');
            setLoading(false);
        } else {
            initializeAuth();
        }
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    useEffect(() => {
        if (userRole === 'admin') {
            loadPayouts();
            loadStats();
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

            const response = await axios.get(`${API_BASE_URL}/api/payout/admin/all?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setPayouts(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load payouts error:', err);
            toast.error('Không thể tải danh sách rút tiền');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/payout/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data.data);
        } catch (err) {
            console.error('Load stats error:', err);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Ảnh không được vượt quá 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return null;

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', imageFile);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/images/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return response.data.imageUrl;
        } catch (err) {
            console.error('Upload image error:', err);
            toast.error('Không thể upload ảnh');
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleApprovePayout = async (payoutId) => {
        if (!approveData.proof_url && !imageFile) {
            toast.error('Vui lòng nhập link ảnh hoặc upload ảnh chứng từ chuyển khoản');
            return;
        }

        try {
            let proofUrl = approveData.proof_url;

            // Upload image nếu có
            if (imageFile) {
                proofUrl = await uploadImage();
                if (!proofUrl) return; // Upload failed
            }

            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/payout/admin/${payoutId}/approve`,
                { ...approveData, proof_url: proofUrl },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Đã duyệt yêu cầu rút tiền');
            setShowApproveModal(false);
            setApproveData({ proof_url: '', notes: '' });
            setImageFile(null);
            setImagePreview(null);
            loadPayouts();
            loadStats();
        } catch (err) {
            console.error('Approve error:', err);
            toast.error(err.response?.data?.message || 'Không thể duyệt yêu cầu');
        }
    };

    const handleRejectPayout = async (payoutId) => {
        if (!rejectData.reason) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/payout/admin/${payoutId}/reject`,
                rejectData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Đã từ chối yêu cầu rút tiền');
            setSelectedPayout(null);
            setRejectData({ reason: '' });
            loadPayouts();
            loadStats();
        } catch (err) {
            console.error('Reject error:', err);
            toast.error(err.response?.data?.message || 'Không thể từ chối yêu cầu');
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
            COMPLETED: { label: 'Đã chuyển', color: '#10b981' },
            FAILED: { label: 'Từ chối', color: '#ef4444' }
        };

        const info = statusMap[status] || statusMap.PENDING;
        return (
            <span className="status-badge" style={{ backgroundColor: info.color }}>
                {info.label}
            </span>
        );
    };

    if (loading && !stats) {
        return <DogLoader />;
    }

    return (
        <div className="admin-payout-container">
            <Sidebar role={userRole} />
            <div className="admin-payout-main">
                <Header />
                <div className="admin-payout-content">
                    {/* Header */}
                    <div className="payout-header" data-aos="fade-down">
                        <div>
                            <h1>💸 Quản lý rút tiền</h1>
                            <p>Duyệt yêu cầu rút tiền từ người bán</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {stats && (
                        <div className="stats-grid" data-aos="fade-up">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fef3c7' }}>
                                    <Clock size={28} color="#d97706" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.pending?.amount || 0)}</div>
                                    <div className="stat-label">Chờ duyệt ({stats.pending?.count || 0})</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#dbeafe' }}>
                                    <DollarSign size={28} color="#1e40af" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.processing?.amount || 0)}</div>
                                    <div className="stat-label">Đang xử lý ({stats.processing?.count || 0})</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#dcfce7' }}>
                                    <CheckCircle size={28} color="#16a34a" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{formatPrice(stats.completed?.amount || 0)}</div>
                                    <div className="stat-label">Đã chuyển ({stats.completed?.count || 0})</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fee2e2' }}>
                                    <XCircle size={28} color="#dc2626" />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{stats.failed?.count || 0}</div>
                                    <div className="stat-label">Từ chối</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="payout-filters" data-aos="fade-up">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="PROCESSING">Đang xử lý</option>
                            <option value="COMPLETED">Đã chuyển</option>
                            <option value="FAILED">Từ chối</option>
                        </select>
                    </div>

                    {/* Payouts Table */}
                    <div className="payouts-table" data-aos="fade-up">
                        {loading ? (
                            <DogLoader />
                        ) : payouts.length === 0 ? (
                            <div className="empty-state">
                                <p>Không có yêu cầu rút tiền nào</p>
                            </div>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Người bán</th>
                                        <th>Ngân hàng</th>
                                        <th>Số TK</th>
                                        <th>Tên TK</th>
                                        <th>Số tiền</th>
                                        <th>Ngày yêu cầu</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout._id}>
                                            <td>
                                                <div className="user-info">
                                                    <User size={16} />
                                                    <div>
                                                        <div>{payout.seller_id?.name}</div>
                                                        <small>{payout.seller_id?.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Building2 size={16} style={{ marginRight: '4px' }} />
                                                {payout.bank_info?.bank_name}
                                            </td>
                                            <td><code>{payout.bank_info?.account_number}</code></td>
                                            <td><strong>{payout.bank_info?.account_name}</strong></td>
                                            <td><strong>{formatPrice(payout.amount)}</strong></td>
                                            <td>{formatDate(payout.created_at)}</td>
                                            <td>{getStatusBadge(payout.status)}</td>
                                            <td>
                                                {payout.status === 'PENDING' || payout.status === 'PROCESSING' ? (
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-approve"
                                                            onClick={() => {
                                                                setSelectedPayout(payout);
                                                                setShowApproveModal(true);
                                                            }}
                                                        >
                                                            ✅ Duyệt
                                                        </button>
                                                        <button
                                                            className="btn-reject"
                                                            onClick={() => {
                                                                setSelectedPayout(payout);
                                                            }}
                                                        >
                                                            ❌ Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span>-</span>
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

            {/* Approve Modal */}
            {showApproveModal && selectedPayout && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>✅ Duyệt yêu cầu rút tiền</h2>
                        <div className="modal-info">
                            <p><strong>Người bán:</strong> {selectedPayout.seller_id?.name}</p>
                            <p><strong>Số tiền:</strong> {formatPrice(selectedPayout.amount)}</p>
                            <p><strong>Ngân hàng:</strong> {selectedPayout.bank_info?.bank_name}</p>
                            <p><strong>STK:</strong> {selectedPayout.bank_info?.account_number}</p>
                            <p><strong>Tên TK:</strong> {selectedPayout.bank_info?.account_name}</p>
                        </div>
                        <div className="form-group">
                            <label>Link ảnh chứng từ chuyển khoản</label>
                            <input
                                type="url"
                                value={approveData.proof_url}
                                onChange={(e) => setApproveData({ ...approveData, proof_url: e.target.value })}
                                placeholder="https://example.com/transfer-proof.jpg"
                            />
                        </div>
                        <div className="form-group">
                            <label>Hoặc upload ảnh chứng từ</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                style={{ marginBottom: '10px' }}
                            />
                            {imagePreview && (
                                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </div>
                            )}
                            {uploadingImage && (
                                <p style={{ color: '#3b82f6', marginTop: '5px' }}>Đang upload...</p>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Ghi chú</label>
                            <textarea
                                value={approveData.notes}
                                onChange={(e) => setApproveData({ ...approveData, notes: e.target.value })}
                                placeholder="Đã chuyển khoản lúc 14:30..."
                                rows="3"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>
                                Hủy
                            </button>
                            <button className="btn-confirm" onClick={() => handleApprovePayout(selectedPayout._id)}>
                                Xác nhận duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {selectedPayout && !showApproveModal && (
                <div className="modal-overlay" onClick={() => setSelectedPayout(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>❌ Từ chối yêu cầu rút tiền</h2>
                        <div className="modal-info">
                            <p><strong>Người bán:</strong> {selectedPayout.seller_id?.name}</p>
                            <p><strong>Số tiền:</strong> {formatPrice(selectedPayout.amount)}</p>
                        </div>
                        <div className="form-group">
                            <label>Lý do từ chối *</label>
                            <textarea
                                value={rejectData.reason}
                                onChange={(e) => setRejectData({ reason: e.target.value })}
                                placeholder="Nhập lý do từ chối..."
                                rows="4"
                                required
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setSelectedPayout(null)}>
                                Hủy
                            </button>
                            <button className="btn-danger" onClick={() => handleRejectPayout(selectedPayout._id)}>
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayoutManagement;