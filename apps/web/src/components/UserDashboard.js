import React, { useState, useEffect } from 'react';
import {
    Store, FileText, TrendingUp, DollarSign, Zap, Sparkles, Play, Award,
    Star, Users, MessageCircle, Clock, Eye, Calendar, BarChart3
} from 'lucide-react';
import api from '@landinghub/api';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
    const [data, setData] = useState({
        stats: { totalPages: 0, totalViews: '0', totalRevenue: '0M', livePages: 0, conversionRate: '0%' },
        pages: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('api/dashboard/data');
                setData(response.data.data);
            } catch (error) {
                console.log('Mock data:', error);
                setData({
                    stats: { totalPages: 24, totalViews: '1,247', totalRevenue: '15.2M', livePages: 12, conversionRate: '8.7%' },
                    pages: [
                        { id: '1', title: 'Villa Luxury', description: 'Trang bán biệt thự cao cấp...', status: 'ĐÃ XUẤT BẢN', views: '324', revenue: '2.5M', created: '16/10', screenshot: '/images/card1.jpg' },
                        { id: '2', title: 'Startup SaaS', description: 'Landing page SaaS startup...', status: 'CHƯA XUẤT BẢN', views: '189', revenue: '1.8M', created: '15/10', screenshot: '/images/card2.jpg' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="creator-dashboard">
            {/* ========== HERO 150+ WORDS ========== */}
            <section className="creator-hero">
                <div className="creator-hero-content">
                    <div className="creator-badge">
                        <Sparkles size={20} /> <span>CREATOR DASHBOARD</span>
                    </div>
                    <h1 className="creator-hero-title">
                        Chào mừng quay lại, <span className="creator-highlight">Creator {data.stats.totalPages}+!</span>
                    </h1>
                    <p className="creator-hero-subtitle">
                        🚀 <strong>Quản lý {data.stats.totalPages} Landing Pages chuyên nghiệp</strong> bạn đã tạo.
                        Tổng <strong>{data.stats.totalViews}</strong> lượt xem, doanh thu <strong>{data.stats.totalRevenue}</strong>
                        với tỷ lệ chuyển đổi <strong>{data.stats.conversionRate}</strong>.
                        <br/><br/>
                        💡 <strong>Tính năng nổi bật:</strong> Builder kéo thả không code • 100+ Templates HTML5UP/Tailwind •
                        Tối ưu mobile 100% • Analytics realtime • Zalo Chatbot tích hợp •
                        CloudFront CDN siêu tốc • SEO tự động • A/B Testing dễ dàng.
                        <br/><br/>
                        🎯 <strong>Mục tiêu tháng này:</strong> Bán 50 Templates • Đạt 5K views • Tăng 30% doanh thu.
                        Bạn đang xếp <strong>Top 10 Seller</strong> với {data.stats.livePages} pages LIVE!
                    </p>
                    <div className="creator-hero-stats">
                        <div className="creator-stat-item">
                            <TrendingUp size={20} className="creator-icon-green" />
                            <span>{data.stats.conversionRate} Chuyển đổi</span>
                        </div>
                        <div className="creator-stat-item">
                            <Award size={20} className="creator-icon-gold" />
                            <span>{data.stats.livePages} Pages LIVE</span>
                        </div>
                        <div className="creator-stat-item">
                            <DollarSign size={20} className="creator-icon-blue" />
                            <span>+{data.stats.totalRevenue} Doanh thu</span>
                        </div>
                    </div>
                </div>
                <div className="creator-hero-images">
                    <img src="/images/hero-landing1.jpg" className="creator-hero-img creator-hero-img-1" alt="" />
                    <img src="/images/hero-landing2.jpg" className="creator-hero-img creator-hero-img-2" alt="" />
                    <img src="/images/hero-landing3.jpg" className="creator-hero-img creator-hero-img-3" alt="" />
                </div>
            </section>

            {/* ========== 4 ACCESS CARDS ========== */}
            <section className="creator-access">
                <div className="creator-access-grid">
                    <button className="creator-access-card marketplace">
                        <Store size={48} /><div><h3>Marketplace</h3><p>Bán Templates • Kiếm {data.stats.totalRevenue}</p></div><Play size={20} className="creator-access-arrow" />
                    </button>
                    <button className="creator-access-card pages">
                        <FileText size={48} /><div><h3>My Pages</h3><p>{data.stats.totalPages} Landing Pages</p></div><Play size={20} className="creator-access-arrow" />
                    </button>
                    <button className="creator-access-card earnings">
                        <DollarSign size={48} /><div><h3>Earnings</h3><p>{data.stats.totalRevenue} VNĐ</p></div><Play size={20} className="creator-access-arrow" />
                    </button>
                    <button className="creator-access-card analytics">
                        <TrendingUp size={48} /><div><h3>Analytics</h3><p>{data.stats.totalViews} Views</p></div><Play size={20} className="creator-access-arrow" />
                    </button>
                </div>
            </section>

            {/* ========== ALL LANDING PAGES GRID ========== */}
            <section className="creator-pages-section">
                <div className="creator-container">
                    <div className="creator-section-header">
                        <h2 className="creator-section-title">📋 {data.stats.totalPages} Landing Pages Của Bạn</h2>
                        <button className="creator-create-btn">+ Tạo Mới</button>
                    </div>
                    <div className="creator-pages-grid">
                        {data.pages.map(page => (
                            <div key={page.id} className="creator-page-card">
                                <div className="creator-page-media">
                                    <img src={page.screenshot || '/images/card-placeholder.jpg'} alt={page.title} />
                                    <div className={`creator-status ${page.status === 'ĐÃ XUẤT BẢN' ? 'live' : 'draft'}`}>
                                        {page.status === 'ĐÃ XUẤT BẢN' ? 'LIVE' : 'DRAFT'}
                                    </div>
                                </div>
                                <div className="creator-page-content">
                                    <h3>{page.title}</h3>
                                    <p>{page.description}</p>
                                    <div className="creator-page-meta">
                                        <span><Eye size={16} /> {page.views}</span>
                                        <span><DollarSign size={16} /> {page.revenue}</span>
                                        <span><Calendar size={16} /> {page.created}</span>
                                    </div>
                                    <div className="creator-page-actions">
                                        <button className="creator-btn-primary">Preview</button>
                                        <button className="creator-btn-secondary">Edit</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========== FEATURES 100+ WORDS ========== */}
            <section className="creator-features">
                <div className="creator-container">
                    <h2 className="creator-section-title">✨ Tại sao 10K+ Creators chọn LandingHub?</h2>
                    <div className="creator-features-grid">
                        <div className="creator-feature-card">
                            <Zap size={40} className="creator-feature-icon" />
                            <h3>Tạo siêu nhanh 3s</h3>
                            <p>Upload HTML → Live Template ngay! Builder kéo thả không cần code. Tối ưu mobile tự động. Hỗ trợ Tailwind/Bootstrap.</p>
                        </div>
                        <div className="creator-feature-card">
                            <DollarSign size={40} className="creator-feature-icon" />
                            <h3>Kiếm tiền 70% Commission</h3>
                            <p>Bán Templates 0đ-500k. Thanh toán tự động VNĐ/USD. Top Seller kiếm 100M+/tháng. Không phí ẩn.</p>
                        </div>
                        <div className="creator-feature-card">
                            <Star size={40} className="creator-feature-icon" />
                            <h3>100+ Templates Premium</h3>
                            <p>HTML5UP, TailwindUI, Creative Tim. Tất cả responsive 100%. Tích hợp Zalo OA, Google Analytics, Facebook Pixel.</p>
                        </div>
                        <div className="creator-feature-card">
                            <Users size={40} className="creator-feature-icon" />
                            <h3>Cộng đồng 10K+ Creators</h3>
                            <p>Review 4.9⭐. Support 24/7 tiếng Việt. Group Facebook 5K members. Webinar hàng tuần miễn phí.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(UserDashboard);