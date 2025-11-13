import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download, RefreshCw, DollarSign, TrendingUp,
    Calendar, CreditCard, User, Package, CheckCircle, XCircle,
    Clock, AlertCircle
} from 'lucide-react';
import api from '@landinghub/api';
import '../styles/AdminTransactions.css';

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        paymentMethod: 'all',
        startDate: '',
        endDate: '',
        searchQuery: ''
    });
    const [stats, setStats] = useState({
        totalRevenue: '0đ',
        platformFees: '0đ',
        completed: 0,
        pending: 0,
        failed: 0
    });
    const [pagination, setPageination] = useState({
        page: 1,
        limit: 20,
        totalPages: 1
    });

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            });

            const response = await api.get(`api/payment/admin/transactions?${queryParams}`);
            console.log('📊 Admin Transactions:', response.data);

            if (response.data.success) {
                setTransactions(response.data.data.transactions);
                setStats(response.data.data.stats);
                setPageination(prev => ({
                    ...prev,
                    totalPages: response.data.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('❌ Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [pagination.page, filters.status, filters.paymentMethod]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle size={18} color="#10b981" />;
            case 'PENDING': return <Clock size={18} color="#f59e0b" />;
            case 'FAILED': return <XCircle size={18} color="#ef4444" />;
            default: return <AlertCircle size={18} color="#6b7280" />;
        }
    };

    const getStatusClass = (status) => {
        return status.toLowerCase();
    };

    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'VNPAY': return 'VNPay';
            case 'MOMO': return 'MOMO';
            case 'BANK_TRANSFER': return 'Bank';
            case 'SANDBOX': return 'Test';
            default: return 'Other';
        }
    };

    const handleExport = () => {
        // TODO: Implement export to CSV/Excel
        alert('Export functionality coming soon!');
    };

    return (
        <div className="admin-transactions">
            {/* HEADER */}
            <div className="page-header">
                <div className="header-content">
                    <h1>Quản Lý Giao Dịch</h1>
                    <p>Theo dõi tất cả giao dịch và lợi nhuận platform</p>
                </div>
                <div className="header-actions">
                    <button onClick={fetchTransactions} className="btn-refresh">
                        <RefreshCw size={18} /> Làm mới
                    </button>
                    <button onClick={handleExport} className="btn-export">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                <div className="stat-card revenue">
                    <div className="icon"><DollarSign size={32} /></div>
                    <div className="content">
                        <h3>Tổng Doanh Thu</h3>
                        <div className="value">{stats.totalRevenue}</div>
                        <div className="meta">Tất cả giao dịch</div>
                    </div>
                </div>

                <div className="stat-card fees">
                    <div className="icon"><TrendingUp size={32} /></div>
                    <div className="content">
                        <h3>Lợi Nhuận Platform</h3>
                        <div className="value">{stats.platformFees}</div>
                        <div className="meta">15-20% mỗi GD</div>
                    </div>
                </div>

                <div className="stat-card completed">
                    <div className="icon"><CheckCircle size={32} /></div>
                    <div className="content">
                        <h3>Thành Công</h3>
                        <div className="value">{stats.completed}</div>
                        <div className="meta">Giao dịch</div>
                    </div>
                </div>

                <div className="stat-card pending">
                    <div className="icon"><Clock size={32} /></div>
                    <div className="content">
                        <h3>Đang Xử Lý</h3>
                        <div className="value">{stats.pending}</div>
                        <div className="meta">Giao dịch</div>
                    </div>
                </div>
            </div>

            {/* FILTERS */}
            <div className="filters-section">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Tìm theo Order ID, Buyer, Seller..."
                        value={filters.searchQuery}
                        onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                    />
                </div>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="filter-select"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                </select>

                <select
                    value={filters.paymentMethod}
                    onChange={(e) => setFilters({...filters, paymentMethod: e.target.value})}
                    className="filter-select"
                >
                    <option value="all">Tất cả phương thức</option>
                    <option value="VNPAY">VNPay</option>
                    <option value="MOMO">Momo</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="SANDBOX">Sandbox</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="date-input"
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="date-input"
                />

                <button onClick={fetchTransactions} className="btn-filter">
                    <Filter size={18} /> Lọc
                </button>
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="transactions-table">
                <table>
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Buyer</th>
                        <th>Seller</th>
                        <th>Page</th>
                        <th>Amount</th>
                        <th>Platform Fee</th>
                        <th>Seller Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="loading-row">
                                <RefreshCw className="spin" size={24} />
                                <span>Đang tải...</span>
                            </td>
                        </tr>
                    ) : transactions.length > 0 ? (
                        transactions.map((tx) => (
                            <tr key={tx._id}>
                                <td className="order-id">
                                    <code>{tx.transaction_id.substring(0, 8)}...</code>
                                </td>
                                <td className="buyer">
                                    <User size={14} /> {tx.buyer_name || tx.buyer_id.substring(0, 8)}
                                </td>
                                <td className="seller">
                                    <User size={14} /> {tx.seller_name || tx.seller_id.substring(0, 8)}
                                </td>
                                <td className="page">
                                    <Package size={14} /> {tx.page_name || 'N/A'}
                                </td>
                                <td className="amount">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(tx.amount)}
                                </td>
                                <td className="platform-fee">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(tx.platform_fee || 0)}
                                </td>
                                <td className="seller-amount">
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(tx.seller_amount || 0)}
                                </td>
                                <td className="payment-method">
                                        <span className="method-badge">
                                            {getPaymentMethodIcon(tx.payment_method)} {tx.payment_method}
                                        </span>
                                </td>
                                <td className={`status ${getStatusClass(tx.status)}`}>
                                    {getStatusIcon(tx.status)}
                                    <span>{tx.status}</span>
                                </td>
                                <td className="date">
                                    <Calendar size={14} />
                                    {new Date(tx.created_at).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="empty-row">
                                <AlertCircle size={32} color="#6b7280" />
                                <p>Không có giao dịch nào</p>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPageination(prev => ({...prev, page: prev.page - 1}))}
                        disabled={pagination.page === 1}
                        className="btn-page"
                    >
                        ← Prev
                    </button>
                    <span className="page-info">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPageination(prev => ({...prev, page: prev.page + 1}))}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn-page"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminTransactions;