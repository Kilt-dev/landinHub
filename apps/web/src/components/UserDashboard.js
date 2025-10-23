import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, ShoppingBag, Award, Eye, Calendar,
    RefreshCw, AlertCircle
} from 'lucide-react';
import api from '@landinghub/api';
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

            const response = await api.get('api/dashboard/data');
            console.log('✅ Dashboard API Response:', response.data);
            console.log('📊 Pages Data:', response.data.data.pages);
            console.log('📋 Pages List Length:', response.data.data.pagesList?.length);

            if (response.data.success && response.data.data) {
                setData(response.data.data);
                console.log('✅ State Updated - Total Pages:', response.data.data.pages.total);
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
                <div className="header-content">
                    <h1>👋 Chào mừng quay lại!</h1>
                    <p>
                        Bạn có <strong>{data.pages.total} landing pages</strong>
                        ({data.pages.live} LIVE • {data.pages.draft} Draft)
                        với <strong>{data.pages.totalViews} lượt xem</strong>
                    </p>
                </div>
                <button onClick={fetchData} className="btn-refresh">
                    <RefreshCw size={18} /> Làm mới
                </button>
            </div>

            {/* STATS CARDS */}
            <div className="stats-grid">
                <div className="stat-card pages">
                    <div className="card-icon"><Eye size={32} /></div>
                    <div className="card-content">
                        <h3>Landing Pages</h3>
                        <div className="value">{data.pages.total}</div>
                        <div className="meta">
                            <span className="live">{data.pages.live} LIVE</span>
                            <span className="separator">•</span>
                            <span className="draft">{data.pages.draft} Draft</span>
                        </div>
                        <div className="footer">{data.pages.totalViews} lượt xem</div>
                    </div>
                </div>

                <div className="stat-card purchases">
                    <div className="card-icon"><ShoppingBag size={32} /></div>
                    <div className="card-content">
                        <h3>Đã Mua</h3>
                        <div className="value">{data.purchases.totalSpent}</div>
                        <div className="meta"><span>{data.purchases.count} giao dịch</span></div>
                        <div className="footer">TB: {data.purchases.avgPerPurchase}/GD</div>
                    </div>
                </div>

                <div className="stat-card sales">
                    <div className="card-icon"><DollarSign size={32} /></div>
                    <div className="card-content">
                        <h3>Đã Bán</h3>
                        <div className="value">{data.sales.totalEarned}</div>
                        <div className="meta"><span>{data.sales.count} giao dịch</span></div>
                        <div className="footer">TB: {data.sales.avgPerSale}/GD</div>
                    </div>
                </div>

                <div className={`stat-card balance ${data.balance.status}`}>
                    <div className="card-icon">
                        {data.balance.status === 'positive' ? <TrendingUp size={32} /> : <Award size={32} />}
                    </div>
                    <div className="card-content">
                        <h3>Số Dư Ròng</h3>
                        <div className="value">{data.balance.amount}</div>
                        <div className="meta"><span>Bán - Mua</span></div>
                        <div className="footer">
                            {data.balance.status === 'positive' ? '✅ Lợi nhuận dương' : '💰 Đang đầu tư'}
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGES LIST */}
            {data.pagesList && data.pagesList.length > 0 && (
                <div className="pages-section">
                    <div className="section-header">
                        <h2>📋 Landing Pages Gần Đây</h2>
                        <span className="page-count">
                            Hiển thị {Math.min(6, data.pagesList.length)} trong tổng số {data.pages.total} pages
                        </span>
                    </div>
                    <div className="pages-grid">
                        {data.pagesList.slice(0, 6).map(page => (
                            <div key={page.id} className="page-card">
                                <div className="page-image">
                                    <img src={page.screenshot || '/images/placeholder.jpg'} alt={page.title} />
                                    <div className={`page-status ${page.status === 'ĐÃ XUẤT BẢN' ? 'live' : 'draft'}`}>
                                        {page.status === 'ĐÃ XUẤT BẢN' ? 'LIVE' : 'DRAFT'}
                                    </div>
                                </div>
                                <div className="page-content">
                                    <h3>{page.title}</h3>
                                    <div className="page-stats">
                                        <span><Eye size={14} /> {page.views}</span>
                                        <span><DollarSign size={14} /> {page.revenue}</span>
                                        <span><Calendar size={14} /> {page.created}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;