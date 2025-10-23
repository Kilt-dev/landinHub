import React, { useState, useEffect } from 'react';
import {
    Activity, Users, DollarSign, TrendingUp, Award, CreditCard,
    RefreshCw, Download, Calendar
} from 'lucide-react';
import api from '@landinghub/api';
import '../styles/AdminSystemReport.css';

const AdminSystemReport = () => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const fetchReport = async () => {
        try {
            setLoading(true);
            let url = 'api/reports/admin/system';

            if (dateRange.startDate && dateRange.endDate) {
                url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
            }

            const response = await api.get(url);
            console.log('📊 Admin Report:', response.data);

            if (response.data.success) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error('❌ Error fetching admin report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div className="admin-report loading">
                <RefreshCw className="spin" size={48} />
                <p>Đang tải báo cáo...</p>
            </div>
        );
    }

    if (!report) {
        return <div className="admin-report error"><p>Không thể tải báo cáo</p></div>;
    }

    const { overview, transactions, marketplace, topSellers, topBuyers, dailyRevenue } = report;

    return (
        <div className="admin-report">
            {/* HEADER */}
            <div className="report-header">
                <div className="report-title">
                    <Activity size={32} />
                    <div>
                        <h1>🔐 Admin System Report</h1>
                        <p>Tổng quan hệ thống và doanh thu</p>
                    </div>
                </div>
                <div className="report-actions">
                    <button className="btn-refresh" onClick={fetchReport}>
                        <RefreshCw size={18} /> Làm mới
                    </button>
                    <button className="btn-download">
                        <Download size={18} /> Tải xuống
                    </button>
                </div>
            </div>

            {/* DATE FILTER */}
            <div className="date-range-filter">
                <Calendar size={20} />
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
                <span>đến</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
                <button onClick={fetchReport} className="btn-filter">Lọc</button>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="overview-grid">
                <div className="overview-card revenue">
                    <DollarSign size={40} />
                    <div>
                        <h3>Tổng Doanh Thu</h3>
                        <div className="value">{overview.totalRevenue}</div>
                    </div>
                </div>
                <div className="overview-card fees">
                    <TrendingUp size={40} />
                    <div>
                        <h3>Platform Fees</h3>
                        <div className="value">{overview.platformFees}</div>
                        <div className="meta">{overview.feePercentage}</div>
                    </div>
                </div>
                <div className="overview-card pages">
                    <Activity size={40} />
                    <div>
                        <h3>Tổng Marketplace Pages</h3>
                        <div className="value">{marketplace.totalPages}</div>
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
                            <div className="count">{item.count} giao dịch</div>
                            <div className="amount">{item.totalAmount}</div>
                            <div className="fees">Phí: {item.platformFees}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAYMENT METHODS */}
            <div className="section">
                <h2>💳 Phương Thức Thanh Toán</h2>
                <div className="payment-grid">
                    {transactions.byPaymentMethod.map((item, idx) => (
                        <div key={idx} className="payment-card">
                            <CreditCard size={32} />
                            <div className="method">{item.method}</div>
                            <div className="count">{item.count} GD</div>
                            <div className="amount">{item.totalAmount}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* TOP SELLERS */}
            <div className="section">
                <h2>🏆 Top 20 Sellers</h2>
                <div className="leaderboard-table">
                    <table>
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Seller ID</th>
                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Earned</th>
                            <th>Platform Fees</th>
                        </tr>
                        </thead>
                        <tbody>
                        {topSellers.slice(0, 20).map((seller) => (
                            <tr key={seller.sellerId}>
                                <td className="rank">#{seller.rank}</td>
                                <td className="seller-id">{seller.sellerId.substring(0, 10)}...</td>
                                <td>{seller.totalSales}</td>
                                <td className="revenue">{seller.totalRevenue}</td>
                                <td className="earned">{seller.totalEarned}</td>
                                <td className="fees">{seller.platformFees}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
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
                                    <span className="value">{day.revenue}</span>
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

            {/* FOOTER */}
            <div className="report-footer">
                <p>📅 Báo cáo được tạo lúc: {new Date(report.generatedAt).toLocaleString('vi-VN')}</p>
                <p>🔄 Dữ liệu cập nhật realtime</p>
            </div>
        </div>
    );
};

export default AdminSystemReport;