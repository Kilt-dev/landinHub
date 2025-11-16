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
            const [systemReport, transactions, chatAnalytics] = await Promise.all([
                api.get('/api/reports/admin/system'),
                api.get('/api/payment/admin/transactions?limit=5'),
                api.get('/api/chat-analytics/summary') // 📊 Message count & AI analysis
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

                // Extract chat analytics data
                const chatData = chatAnalytics.data?.data || {};
                const messageStats = chatData.messageStats || {};

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
                    },
                    // 📊 MESSAGE STATS & AI ANALYSIS
                    messageStats: {
                        total: messageStats.total || 0,
                        today: messageStats.today || 0,
                        aiGenerated: messageStats.aiGenerated || 0,
                        humanWritten: messageStats.humanWritten || 0,
                        aiPercentage: messageStats.aiPercentage || 0,
                        byType: messageStats.byType || {}
                    },
                    chatOverview: {
                        totalChats: chatData.totalChats || 0,
                        openChats: chatData.openChats || 0,
                        resolvedToday: chatData.resolvedToday || 0
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

            {/* MESSAGE STATS & AI ANALYSIS */}
            <div className="dashboard-grid-2" style={{ marginBottom: '30px' }}>
                {/* MESSAGE STATISTICS */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Thống Kê Tin Nhắn</h2>
                    </div>
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Tổng số tin nhắn</div>
                            <div style={{ fontSize: '36px', fontWeight: '700', color: '#667eea' }}>
                                {data.messageStats?.total?.toLocaleString() || 0}
                            </div>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Tin nhắn hôm nay</div>
                            <div style={{ fontSize: '28px', fontWeight: '600', color: '#3b82f6' }}>
                                {data.messageStats?.today?.toLocaleString() || 0}
                            </div>
                        </div>
                        <div className="status-bars" style={{ marginTop: '20px' }}>
                            <div className="status-bar">
                                <div className="status-bar-header">
                                    <span>Tin nhắn từ người dùng</span>
                                    <span className="status-count">{data.messageStats?.byType?.user || 0}</span>
                                </div>
                            </div>
                            <div className="status-bar">
                                <div className="status-bar-header">
                                    <span>Tin nhắn từ admin</span>
                                    <span className="status-count">{data.messageStats?.byType?.admin || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI ANALYSIS */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h2>Phân Tích AI</h2>
                    </div>
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Tỷ lệ sử dụng AI</div>
                            <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>
                                {data.messageStats?.aiPercentage || 0}%
                            </div>
                        </div>

                        {/* AI vs Human Progress Bar */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                                <span>AI Generated</span>
                                <span>Human Written</span>
                            </div>
                            <div style={{
                                height: '32px',
                                background: '#f3f4f6',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                display: 'flex'
                            }}>
                                <div
                                    style={{
                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                        width: `${data.messageStats?.aiPercentage || 0}%`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {data.messageStats?.aiGenerated > 0 && `${data.messageStats.aiGenerated}`}
                                </div>
                                <div
                                    style={{
                                        background: 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {data.messageStats?.humanWritten > 0 && `${data.messageStats.humanWritten}`}
                                </div>
                            </div>
                        </div>

                        {/* Chat Overview */}
                        <div className="status-bars">
                            <div className="status-bar">
                                <div className="status-bar-header">
                                    <span>Tổng số chat</span>
                                    <span className="status-count">{data.chatOverview?.totalChats || 0}</span>
                                </div>
                            </div>
                            <div className="status-bar">
                                <div className="status-bar-header">
                                    <span>Chat đang mở</span>
                                    <span className="status-count">{data.chatOverview?.openChats || 0}</span>
                                </div>
                            </div>
                            <div className="status-bar">
                                <div className="status-bar-header">
                                    <span>Đã giải quyết hôm nay</span>
                                    <span className="status-count">{data.chatOverview?.resolvedToday || 0}</span>
                                </div>
                            </div>
                        </div>
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
