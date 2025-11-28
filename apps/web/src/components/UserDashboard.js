import React, { useState, useEffect } from 'react';
import {
    RefreshCw, AlertCircle
} from 'lucide-react';
import api from '@landinghub/api';
import { initSocket, joinDashboard, leaveDashboard, onDashboardUpdate } from '../utils/socket';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
    const [data, setData] = useState({
        pages: { total: 0, live: 0, draft: 0, totalViews: '0', totalRevenue: '0đ' },
        purchases: { count: 0, totalSpent: '0đ', avgPerPurchase: '0đ', totalSpentRaw: 0 },
        sales: { count: 0, totalEarned: '0đ', avgPerSale: '0đ', totalEarnedRaw: 0 },
        balance: { amount: '0đ', amountRaw: 0, status: 'neutral' },
        pagesList: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('📡 Fetching dashboard data...');

            const response = await api.get('/api/dashboard/data');
            console.log('✅ Dashboard API Response:', response.data);
            console.log('📊 Pages Data:', response.data.data.pages);
            console.log('📋 Pages List Length:', response.data.data.pagesList?.length);

            if (response.data.success && response.data.data) {
                // Ensure all required fields exist with fallbacks
                const apiData = response.data.data;
                setData({
                    pages: apiData.pages || { total: 0, live: 0, draft: 0, totalViews: '0', totalRevenue: '0đ' },
                    purchases: apiData.purchases || { count: 0, totalSpent: '0đ', avgPerPurchase: '0đ', totalSpentRaw: 0 },
                    sales: apiData.sales || { count: 0, totalEarned: '0đ', avgPerSale: '0đ', totalEarnedRaw: 0 },
                    balance: apiData.balance || { amount: '0đ', amountRaw: 0, status: 'neutral' },
                    pagesList: apiData.pagesList || []
                });
                console.log('✅ State Updated - Total Pages:', apiData.pages?.total || 0);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (error) {
            console.error('❌ Dashboard Error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Initialize socket connection for real-time updates
        const socket = initSocket();
        if (socket) {
            joinDashboard();

            // Listen for dashboard updates
            const cleanup = onDashboardUpdate((data) => {
                console.log('📊 Dashboard update received:', data);
                // Automatically refresh dashboard data when update is received
                fetchData();
            });

            // Cleanup on unmount
            return () => {
                cleanup();
                leaveDashboard();
            };
        }
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="spin" size={48} />
                <p>Đang tải dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <h3>Không thể tải dashboard</h3>
                <p>{error}</p>
                <button onClick={fetchData} className="btn-retry">
                    <RefreshCw size={18} /> Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="user-dashboard">
            {/* HEADER */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Hiệu suất kinh doanh và marketplace của bạn
                    </p>
                </div>
                <button onClick={fetchData} className="btn-refresh">
                    Làm mới
                </button>
            </div>

            {/* WELCOME BANNER */}
            <div className="welcome-banner">
                <div className="banner-content">
                    <h2>Xin chào! 👋</h2>
                    <p>
                        Bạn đang quản lý <strong>{data.pages.total} landing pages</strong> với{' '}
                        <strong>{data.pages.totalViews} lượt truy cập</strong>
                    </p>
                </div>
                <div className="banner-stats">
                    <div className="banner-stat">
                        <div className="banner-stat-value">{data.pages.live}</div>
                        <div className="banner-stat-label">ĐANG HOẠT ĐỘNG</div>
                    </div>
                    <div className="banner-stat">
                        <div className="banner-stat-value">{data.pages.draft}</div>
                        <div className="banner-stat-label">BẢN NHÁP</div>
                    </div>
                </div>
            </div>

            {/* STATS CARDS - MODERN DESIGN */}
            <div className="stats-grid">
                {/* Marketplace Revenue - HIGHLIGHTED */}
                <div className="stat-card modern marketplace-revenue highlighted">
                    <div className="stat-header">
                        <span className="stat-label">Doanh Thu Marketplace</span>
                    </div>
                    <div className="stat-value">{data.sales.totalEarned}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">{data.sales.count} sản phẩm đã bán</span>
                        <span className="stat-secondary">TB: {data.sales.avgPerSale}</span>
                    </div>
                </div>

                {/* Landing Pages Views */}
                <div className="stat-card modern views">
                    <div className="stat-header">
                        <span className="stat-label">Lượt Xem Landing Pages</span>
                    </div>
                    <div className="stat-value">{data.pages.totalViews}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">{data.pages.total} landing pages</span>
                    </div>
                </div>

                {/* Total Leads */}
                <div className="stat-card modern leads">
                    <div className="stat-header">
                        <span className="stat-label">Tổng Giao Dịch</span>
                    </div>
                    <div className="stat-value">{data.purchases.count + data.sales.count}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">Mua & Bán marketplace</span>
                    </div>
                </div>

                {/* Purchases */}
                <div className="stat-card modern purchases">
                    <div className="stat-header">
                        <span className="stat-label">Đầu Tư Mua Sắm</span>
                    </div>
                    <div className="stat-value">{data.purchases.totalSpent}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">{data.purchases.count} giao dịch mua</span>
                        <span className="stat-secondary">TB: {data.purchases.avgPerPurchase}</span>
                    </div>
                </div>

                {/* Balance */}
                <div className={`stat-card modern balance ${data.balance.status}`}>
                    <div className="stat-header">
                        <span className="stat-label">Lợi Nhuận Ròng</span>
                        <span className={`balance-badge ${data.balance.status}`}>
                            {data.balance.status === 'positive' ? 'Sinh lời' : 'Đang đầu tư'}
                        </span>
                    </div>
                    <div className="stat-value">{data.balance.amount}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">Doanh thu - Chi phí</span>
                    </div>
                </div>

                {/* Total Pages */}
                <div className="stat-card modern activity">
                    <div className="stat-header">
                        <span className="stat-label">Tổng Landing Pages</span>
                    </div>
                    <div className="stat-value">{data.pages.total}</div>
                    <div className="stat-footer">
                        <span className="stat-meta">{data.pages.live} đang hoạt động, {data.pages.draft} nháp</span>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="quick-actions">
                <a href="/pages" className="action-btn primary">
                    Quản lý Pages
                </a>
                <a href="/create-landing" className="action-btn secondary">
                    Tạo Page Mới
                </a>
                <a href="/marketplace" className="action-btn secondary">
                    Marketplace
                </a>
            </div>
        </div>
    );
};

export default UserDashboard;