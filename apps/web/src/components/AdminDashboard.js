import React, { useState, useEffect } from 'react';
import {
    Activity, Users, DollarSign, TrendingUp, Award, CreditCard,
    RefreshCw, Download, Calendar, AlertCircle, ShoppingCart
} from 'lucide-react';
import api from '@landinghub/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('📡 Fetching admin dashboard data...');

            const response = await api.get('api/reports/admin/system');
            console.log('✅ Admin Dashboard API Response:', response.data);

            if (response.data.success) {
                setReport(response.data.data);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            console.error('❌ Error fetching admin dashboard:', error);
            setError(error.message || 'Không thể tải dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="admin-dashboard-loading">
                <RefreshCw className="spin" size={48} />
                <p>Đang tải dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <h3>Không thể tải dashboard</h3>
                <p>{error}</p>
                <button onClick={fetchDashboardData} className="btn-retry">
                    <RefreshCw size={18} /> Thử lại
                </button>
            </div>
        );
    }

    if (!report) {
        return <div className="admin-dashboard-error"><p>Không có dữ liệu</p></div>;
    }

    const { overview, transactions, marketplace, topSellers, topBuyers, dailyRevenue } = report;

    return (
        <div className="admin-dashboard">
            {/* HEADER */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>Admin Dashboard</h1>
                    <p>Tổng quan hệ thống và hiệu suất</p>
                </div>
                <button onClick={fetchDashboardData} className="btn-refresh">
                    <RefreshCw size={18} /> Làm mới
                </button>
            </div>

            {/* OVERVIEW STATS */}
            <div className="overview-grid">
                <div className="stat-card revenue">
                    <div className="card-icon"><DollarSign size={40} /></div>
                    <div className="card-content">
                        <h3>Tổng Doanh Thu</h3>
                        <div className="value">{overview.totalRevenue}</div>
                        <div className="meta">Tất cả giao dịch</div>
                    </div>
                </div>

                <div className="stat-card fees">
                    <div className="card-icon"><TrendingUp size={40} /></div>
                    <div className="card-content">
                        <h3>Platform Fees</h3>
                        <div className="value">{overview.platformFees}</div>
                        <div className="meta">{overview.feePercentage} của doanh thu</div>
                    </div>
                </div>

                <div className="stat-card pages">
                    <div className="card-icon"><Activity size={40} /></div>
                    <div className="card-content">
                        <h3>Marketplace Pages</h3>
                        <div className="value">{marketplace.totalPages}</div>
                        <div className="meta">
                            {marketplace.byStatus.map((s, i) => (
                                <span key={i}>{s.count} {s._id}{i < marketplace.byStatus.length - 1 ? ' • ' : ''}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="stat-card transactions">
                    <div className="card-icon"><ShoppingCart size={40} /></div>
                    <div className="card-content">
                        <h3>Giao Dịch</h3>
                        <div className="value">
                            {transactions.byStatus.reduce((sum, item) => sum + item.count, 0)}
                        </div>
                        <div className="meta">
                            {transactions.byStatus.find(s => s.status === 'COMPLETED')?.count || 0} thành công
                        </div>
                    </div>
                </div>
            </div>

            {/* TRANSACTION STATUS */}
            <div className="section">
                <h2>📊 Giao Dịch Theo Trạng Thái</h2>
                <div className="transaction-grid">
                    {transactions.byStatus.map((item, idx) => (
                        <div key={idx} className={`transaction-card status-${item.status.toLowerCase()}`}>
                            <div className="status">{item.status}</div>
                            <div className="count">{item.count}</div>
                            <div className="label">giao dịch</div>
                            <div className="amount">{item.totalAmount}</div>
                            <div className="fees">Phí: {item.platformFees}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="two-column-section">
                {/* TOP SELLERS */}
                <div className="section">
                    <h2>🏆 Top 5 Sellers</h2>
                    <div className="top-list">
                        {topSellers.slice(0, 5).map((seller) => (
                            <div key={seller.sellerId} className="top-item">
                                <div className="rank">#{seller.rank}</div>
                                <div className="info">
                                    <div className="id">{seller.sellerId.substring(0, 12)}...</div>
                                    <div className="stats">
                                        {seller.totalSales} sales • {seller.totalRevenue}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOP BUYERS */}
                <div className="section">
                    <h2>💰 Top 5 Buyers</h2>
                    <div className="top-list">
                        {topBuyers.slice(0, 5).map((buyer) => (
                            <div key={buyer.buyerId} className="top-item">
                                <div className="rank">#{buyer.rank}</div>
                                <div className="info">
                                    <div className="id">{buyer.buyerId.substring(0, 12)}...</div>
                                    <div className="stats">
                                        {buyer.totalPurchases} purchases • {buyer.totalSpent}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DAILY REVENUE CHART */}
            <div className="section">
                <h2>📈 Doanh Thu 30 Ngày Gần Nhất</h2>
                <div className="daily-chart">
                    {dailyRevenue.slice(-30).map((day, idx) => {
                        const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenueRaw));
                        const height = maxRevenue > 0 ? (day.revenueRaw / maxRevenue) * 100 : 0;

                        return (
                            <div key={idx} className="chart-bar-wrapper">
                                <div className="bar-info">
                                    <span className="value">{day.revenueRaw > 0 ? day.revenue.replace('₫', '') : '0'}</span>
                                    <span className="count">{day.count} GD</span>
                                </div>
                                <div className="chart-bar" style={{ height: `${Math.max(height, 5)}%` }}>
                                    <div className="bar-fill"></div>
                                </div>
                                <div className="bar-label">{day.date.split('/').slice(0, 2).join('/')}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PAYMENT METHODS */}
            {transactions.byPaymentMethod && transactions.byPaymentMethod.length > 0 && (
                <div className="section">
                    <h2>💳 Phương Thức Thanh Toán</h2>
                    <div className="payment-grid">
                        {transactions.byPaymentMethod.map((item, idx) => (
                            <div key={idx} className="payment-card">
                                <CreditCard size={32} />
                                <div className="method">{item.method || 'N/A'}</div>
                                <div className="count">{item.count} GD</div>
                                <div className="amount">{item.totalAmount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="dashboard-footer">
                <p>Cập nhật lúc: {new Date(report.generatedAt).toLocaleString('vi-VN')}</p>
            </div>
        </div>
    );
};

export default React.memo(AdminDashboard);