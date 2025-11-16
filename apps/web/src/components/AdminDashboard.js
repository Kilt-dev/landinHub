import React, { useState, useEffect } from 'react';
import api from '@landinghub/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        overview: {
            totalRevenue: '0đ',
            platformFees: '0đ',
            totalPages: 0,
            totalUsers: 0,
            totalTransactions: 0,
            activePages: 0
        },
        transactions: {
            completed: 0,
            pending: 0,
            failed: 0,
            refunded: 0
        },
        payments: {
            vnpay: 0,
            momo: 0,
            sandbox: 0
        },
        recent: {
            transactions: [],
            users: []
        },
        trends: {
            revenueGrowth: '+0%',
            userGrowth: '+0%',
            transactionGrowth: '+0%'
        }
    });

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // Fetch multiple endpoints in parallel
            const [systemReport, transactions] = await Promise.all([
                api.get('/api/reports/admin/system'),
                api.get('/api/payment/admin/transactions?limit=5')
            ]);

            if (systemReport.data.success) {
                const report = systemReport.data.data;

                // Calculate transaction stats by status
                const txByStatus = report.transactions?.byStatus || [];
                const txStats = {
                    completed: txByStatus.find(t => t.status === 'COMPLETED')?.count || 0,
                    pending: txByStatus.find(t => t.status === 'PENDING')?.count || 0,
                    failed: txByStatus.find(t => t.status === 'FAILED')?.count || 0,
                    refunded: txByStatus.find(t => t.status === 'REFUNDED')?.count || 0
                };

                // Calculate payment method stats
                const paymentMethods = report.transactions?.byPaymentMethod || [];
                const paymentStats = {
                    vnpay: paymentMethods.find(p => p.method === 'VNPAY')?.count || 0,
                    momo: paymentMethods.find(p => p.method === 'MOMO')?.count || 0,
                    sandbox: paymentMethods.find(p => p.method === 'SANDBOX')?.count || 0
                };

                setData({
                    overview: {
                        totalRevenue: report.overview?.totalRevenue || '0đ',
                        platformFees: report.overview?.platformFees || '0đ',
                        totalPages: report.marketplace?.totalPages || 0,
                        totalUsers: report.overview?.totalUsers || 0,
                        totalTransactions: report.overview?.totalTransactions || 0,
                        activePages: report.marketplace?.activePages || 0
                    },
                    transactions: txStats,
                    payments: paymentStats,
                    recent: {
                        transactions: transactions.data?.data?.transactions?.slice(0, 5) || [],
                        users: report.topBuyers?.slice(0, 5) || []
                    },
                    trends: {
                        revenueGrowth: '+12.5%', // Mock - can implement later
                        userGrowth: '+8.3%',
                        transactionGrowth: '+15.2%'
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching admin dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <div className="spinner"></div>
                <p>Đang tải dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* HEADER */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Admin Dashboard</h1>
                    <p className="dashboard-subtitle">Tổng quan hệ thống và doanh thu</p>
                </div>
                <button onClick={fetchAdminData} className="btn-refresh">
                    Làm mới
                </button>
            </div>

            {/* KPI CARDS */}
            <div className="kpi-grid">
                <div className="kpi-card revenue">
                    <div className="kpi-header">
                        <span className="kpi-label">Tổng Doanh Thu</span>
                        <span className="kpi-trend positive">{data.trends.revenueGrowth}</span>
                    </div>
                    <div className="kpi-value">{data.overview.totalRevenue}</div>
                    <div className="kpi-footer">
                        <span>Platform Fee</span>
                        <span className="kpi-secondary">{data.overview.platformFees}</span>
                    </div>
                </div>

                <div className="kpi-card transactions">
                    <div className="kpi-header">
                        <span className="kpi-label">Giao Dịch</span>
                        <span className="kpi-trend positive">{data.trends.transactionGrowth}</span>
                    </div>
                    <div className="kpi-value">{data.overview.totalTransactions}</div>
                    <div className="kpi-footer">
                        <span className="kpi-status completed">{data.transactions.completed} Hoàn thành</span>
                        <span className="kpi-status pending">{data.transactions.pending} Đang xử lý</span>
                    </div>
                </div>

                <div className="kpi-card pages">
                    <div className="kpi-header">
                        <span className="kpi-label">Landing Pages</span>
                    </div>
                    <div className="kpi-value">{data.overview.totalPages}</div>
                    <div className="kpi-footer">
                        <span className="kpi-status active">{data.overview.activePages} Active</span>
                        <span className="kpi-status inactive">{data.overview.totalPages - data.overview.activePages} Inactive</span>
                    </div>
                </div>

                <div className="kpi-card users">
                    <div className="kpi-header">
                        <span className="kpi-label">Người Dùng</span>
                        <span className="kpi-trend positive">{data.trends.userGrowth}</span>
                    </div>
                    <div className="kpi-value">{data.overview.totalUsers}</div>
                    <div className="kpi-footer">
                        <span>Tổng số người dùng đã đăng ký</span>
                    </div>
                </div>
            </div>

            {/* TRANSACTIONS & PAYMENT METHODS */}
            <div className="dashboard-grid-2">
                {/* TRANSACTION STATUS */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Trạng Thái Giao Dịch</h2>
                    </div>
                    <div className="status-bars">
                        <div className="status-bar">
                            <div className="status-bar-header">
                                <span>Hoàn thành</span>
                                <span className="status-count">{data.transactions.completed}</span>
                            </div>
                            <div className="status-bar-track">
                                <div
                                    className="status-bar-fill completed"
                                    style={{
                                        width: `${(data.transactions.completed / data.overview.totalTransactions * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="status-bar">
                            <div className="status-bar-header">
                                <span>Đang xử lý</span>
                                <span className="status-count">{data.transactions.pending}</span>
                            </div>
                            <div className="status-bar-track">
                                <div
                                    className="status-bar-fill pending"
                                    style={{
                                        width: `${(data.transactions.pending / data.overview.totalTransactions * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="status-bar">
                            <div className="status-bar-header">
                                <span>Thất bại</span>
                                <span className="status-count">{data.transactions.failed}</span>
                            </div>
                            <div className="status-bar-track">
                                <div
                                    className="status-bar-fill failed"
                                    style={{
                                        width: `${(data.transactions.failed / data.overview.totalTransactions * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="status-bar">
                            <div className="status-bar-header">
                                <span>Hoàn tiền</span>
                                <span className="status-count">{data.transactions.refunded}</span>
                            </div>
                            <div className="status-bar-track">
                                <div
                                    className="status-bar-fill refunded"
                                    style={{
                                        width: `${(data.transactions.refunded / data.overview.totalTransactions * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAYMENT METHODS */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Phương Thức Thanh Toán</h2>
                    </div>
                    <div className="payment-methods">
                        <div className="payment-method vnpay">
                            <div className="payment-method-name">VNPay</div>
                            <div className="payment-method-count">{data.payments.vnpay}</div>
                            <div className="payment-method-bar">
                                <div
                                    className="payment-method-fill"
                                    style={{
                                        width: `${(data.payments.vnpay / (data.payments.vnpay + data.payments.momo + data.payments.sandbox) * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="payment-method momo">
                            <div className="payment-method-name">Momo</div>
                            <div className="payment-method-count">{data.payments.momo}</div>
                            <div className="payment-method-bar">
                                <div
                                    className="payment-method-fill"
                                    style={{
                                        width: `${(data.payments.momo / (data.payments.vnpay + data.payments.momo + data.payments.sandbox) * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="payment-method sandbox">
                            <div className="payment-method-name">Sandbox</div>
                            <div className="payment-method-count">{data.payments.sandbox}</div>
                            <div className="payment-method-bar">
                                <div
                                    className="payment-method-fill"
                                    style={{
                                        width: `${(data.payments.sandbox / (data.payments.vnpay + data.payments.momo + data.payments.sandbox) * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h2>Giao Dịch Gần Đây</h2>
                    <a href="/admin/transactions" className="link-view-all">Xem tất cả →</a>
                </div>
                <div className="transactions-list">
                    {data.recent.transactions.length > 0 ? (
                        data.recent.transactions.map((tx, idx) => (
                            <div key={idx} className="transaction-item">
                                <div className="transaction-info">
                                    <div className="transaction-id">#{tx.transaction_id?.substring(0, 8)}</div>
                                    <div className="transaction-user">{tx.buyer_name || 'User'}</div>
                                </div>
                                <div className="transaction-amount">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                                </div>
                                <div className={`transaction-status ${tx.status.toLowerCase()}`}>
                                    {tx.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">Chưa có giao dịch nào</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(AdminDashboard);
