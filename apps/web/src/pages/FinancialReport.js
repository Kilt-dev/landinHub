import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, ShoppingCart, ShoppingBag,
    Award, BarChart3, Calendar, Download, Filter, RefreshCw
} from 'lucide-react';
import api from '@landinghub/api';
import '../styles/FinancialReport.css';

const FinancialReport = () => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('all');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const fetchReport = async () => {
        try {
            setLoading(true);
            let url = `api/reports/financial?period=${period}`;

            if (dateRange.startDate && dateRange.endDate) {
                url = `api/reports/financial?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
            }

            const response = await api.get(url);
            console.log('📊 Financial Report:', response.data);

            if (response.data.success) {
                setReport(response.data.data);
            }
        } catch (error) {
            console.error('❌ Error fetching financial report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [period]);

    const handleDateRangeFilter = () => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchReport();
        }
    };

    if (loading) {
        return (
            <div className="financial-report loading">
                <RefreshCw className="spin" size={48} />
                <p>Đang tải báo cáo...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="financial-report error">
                <p>Không thể tải báo cáo</p>
            </div>
        );
    }

    const { summary, monthlyData, topPages, transactionStatus } = report;

    return (
        <div className="financial-report">
            {/* ========== HEADER ========== */}
            <div className="report-header">
                <div className="report-title">
                    <BarChart3 size={32} />
                    <div>
                        <h1>Báo Cáo Tài Chính</h1>
                        <p>Tổng quan thu chi và doanh số bán hàng</p>
                    </div>
                </div>

                <div className="report-actions">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="period-selector"
                    >
                        <option value="all">Tất cả</option>
                        <option value="today">Hôm nay</option>
                        <option value="week">7 ngày</option>
                        <option value="month">30 ngày</option>
                        <option value="quarter">3 tháng</option>
                        <option value="year">1 năm</option>
                    </select>

                    <button className="btn-refresh" onClick={fetchReport}>
                        <RefreshCw size={18} /> Làm mới
                    </button>

                    <button className="btn-download">
                        <Download size={18} /> Tải xuống
                    </button>
                </div>
            </div>

            {/* ========== DATE RANGE FILTER ========== */}
            <div className="date-range-filter">
                <Calendar size={20} />
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    placeholder="Từ ngày"
                />
                <span>đến</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    placeholder="Đến ngày"
                />
                <button onClick={handleDateRangeFilter} className="btn-filter">
                    <Filter size={18} /> Lọc
                </button>
            </div>

            {/* ========== SUMMARY CARDS ========== */}
            <div className="summary-grid">
                {/* Card: Purchases */}
                <div className="summary-card purchases">
                    <div className="card-icon">
                        <ShoppingCart size={32} />
                    </div>
                    <div className="card-content">
                        <h3>Đã Mua</h3>
                        <div className="card-value">{summary.purchases.totalSpent}</div>
                        <div className="card-meta">
                            <span>{summary.purchases.count} giao dịch</span>
                            <span className="separator">•</span>
                            <span>TB: {summary.purchases.avgPerPurchase}</span>
                        </div>
                        <div className="card-footer">
                            Phí: {summary.purchases.platformFees}
                        </div>
                    </div>
                </div>

                {/* Card: Sales */}
                <div className="summary-card sales">
                    <div className="card-icon">
                        <ShoppingBag size={32} />
                    </div>
                    <div className="card-content">
                        <h3>Đã Bán</h3>
                        <div className="card-value">{summary.sales.totalRevenue}</div>
                        <div className="card-meta">
                            <span>{summary.sales.count} giao dịch</span>
                            <span className="separator">•</span>
                            <span>TB: {summary.sales.avgPerSale}</span>
                        </div>
                        <div className="card-footer">
                            Thực nhận: {summary.sales.totalEarned} (Phí {summary.sales.feePercentage})
                        </div>
                    </div>
                </div>

                {/* Card: Balance */}
                <div className={`summary-card balance ${summary.balance.status}`}>
                    <div className="card-icon">
                        {summary.balance.status === 'positive' ?
                            <TrendingUp size={32} /> :
                            <TrendingDown size={32} />
                        }
                    </div>
                    <div className="card-content">
                        <h3>Số Dư Ròng</h3>
                        <div className="card-value">{summary.balance.amount}</div>
                        <div className="card-meta">
                            <span>Bán - Mua = Số dư</span>
                        </div>
                        <div className="card-footer">
                            {summary.balance.status === 'positive' ?
                                '✅ Lợi nhuận dương' :
                                '⚠️ Chi nhiều hơn thu'
                            }
                        </div>
                    </div>
                </div>

                {/* Card: Pending Payouts */}
                <div className="summary-card pending">
                    <div className="card-icon">
                        <Award size={32} />
                    </div>
                    <div className="card-content">
                        <h3>Chờ Thanh Toán</h3>
                        <div className="card-value">{summary.pendingPayouts.amount}</div>
                        <div className="card-meta">
                            <span>{summary.pendingPayouts.count} giao dịch</span>
                        </div>
                        <div className="card-footer">
                            Sẽ được thanh toán trong 7-14 ngày
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== MONTHLY CHART ========== */}
            {monthlyData && monthlyData.length > 0 && (
                <div className="chart-section">
                    <h2>📈 Doanh Thu Theo Tháng</h2>
                    <div className="chart-container">
                        <div className="chart-bars">
                            {monthlyData.map((item, index) => {
                                const maxRevenue = Math.max(...monthlyData.map(d => d.revenueRaw));
                                const height = maxRevenue > 0 ? (item.revenueRaw / maxRevenue) * 100 : 0;

                                return (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div className="chart-bar-info">
                                            <span className="bar-value">{item.revenueFormatted}</span>
                                            <span className="bar-count">{item.count} GD</span>
                                        </div>
                                        <div className="chart-bar" style={{ height: `${Math.max(height, 5)}%` }}>
                                            <div className="bar-fill"></div>
                                        </div>
                                        <div className="chart-bar-label">{item.month}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== TOP SELLING PAGES ========== */}
            {topPages && topPages.length > 0 && (
                <div className="top-pages-section">
                    <h2>🏆 Top Pages Bán Chạy</h2>
                    <div className="top-pages-table">
                        <table>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên Page</th>
                                <th>Giá</th>
                                <th>Số lượt bán</th>
                                <th>Doanh thu</th>
                                <th>Thực nhận</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topPages.map((page, index) => (
                                <tr key={page.pageId}>
                                    <td className="rank">#{index + 1}</td>
                                    <td className="page-name">{page.pageName}</td>
                                    <td>{page.pagePrice}</td>
                                    <td className="sales-count">{page.totalSales}</td>
                                    <td className="revenue">{page.totalRevenue}</td>
                                    <td className="earned">{page.totalEarned}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========== TRANSACTION STATUS ========== */}
            {transactionStatus && transactionStatus.length > 0 && (
                <div className="transaction-status-section">
                    <h2>📊 Trạng Thái Giao Dịch</h2>
                    <div className="status-grid">
                        {transactionStatus.map((item, index) => (
                            <div key={index} className={`status-card status-${item.status.toLowerCase()}`}>
                                <div className="status-label">{item.status}</div>
                                <div className="status-count">{item.count} giao dịch</div>
                                <div className="status-amount">{item.totalAmount}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ========== FOOTER INFO ========== */}
            <div className="report-footer">
                <p>
                    📅 Báo cáo được tạo lúc: {new Date(report.generatedAt).toLocaleString('vi-VN')}
                </p>
                <p>
                    🔄 Dữ liệu được cập nhật realtime từ hệ thống
                </p>
            </div>
        </div>
    );
};

export default FinancialReport;