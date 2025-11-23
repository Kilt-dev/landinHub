import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Divider,
    TextField,
    MenuItem,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack
} from '@mui/material';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    Assessment as AssessmentIcon,
    TrendingUp,
    AttachMoney,
    ShoppingCart,
    People,
    Chat,
    Refresh,
    Description,
    Payment as PaymentIcon
} from '@mui/icons-material';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const COLORS = ['#667eea', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('30');
    const [reportData, setReportData] = useState({
        systemReport: null,
        chatAnalytics: null,
        marketplaceTrends: null,
        summary: null
    });

    // Fetch all report data
    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            const [systemRes, chatRes, marketplaceRes, summaryRes] = await Promise.all([
                axios.get(`${apiUrl}/api/reports/admin/system`, config),
                axios.get(`${apiUrl}/api/chat-analytics/trends?days=${dateRange}`, config),
                axios.get(`${apiUrl}/api/chat-analytics/marketplace-trends?days=${dateRange}`, config),
                axios.get(`${apiUrl}/api/chat-analytics/summary`, config)
            ]);

            setReportData({
                systemReport: systemRes.data.data,
                chatAnalytics: chatRes.data.data,
                marketplaceTrends: marketplaceRes.data.data,
                summary: summaryRes.data.data
            });
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.response?.data?.message || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('LandingHub - Comprehensive Report', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

        let yPos = 40;

        // System Overview
        if (reportData.systemReport) {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('System Overview', 14, yPos);
            yPos += 10;

            const overviewData = [
                ['Total Revenue', reportData.systemReport.overview.totalRevenue],
                ['Platform Fees', reportData.systemReport.overview.platformFees],
                ['Fee Percentage', reportData.systemReport.overview.feePercentage],
                ['Total Marketplace Pages', reportData.systemReport.marketplace.totalPages],
                ['Total Leads', reportData.systemReport.leads?.total || 0]
            ];

            doc.autoTable({
                startY: yPos,
                head: [['Metric', 'Value']],
                body: overviewData,
                theme: 'grid',
                headStyles: { fillColor: [102, 126, 234] }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Top Sellers
        if (reportData.systemReport?.topSellers?.length > 0) {
            doc.setFontSize(14);
            doc.text('Top Sellers', 14, yPos);
            yPos += 10;

            const sellerData = reportData.systemReport.topSellers.slice(0, 10).map(seller => [
                seller.rank,
                seller.sellerId.substring(0, 12) + '...',
                seller.totalSales,
                seller.totalRevenue
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['Rank', 'Seller ID', 'Sales', 'Revenue']],
                body: sellerData,
                theme: 'striped',
                headStyles: { fillColor: [52, 211, 153] }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Add new page for marketplace trends
        doc.addPage();
        yPos = 20;

        // Marketplace Categories
        if (reportData.marketplaceTrends?.categoryStats?.length > 0) {
            doc.setFontSize(14);
            doc.text('Marketplace Categories', 14, yPos);
            yPos += 10;

            const categoryData = reportData.marketplaceTrends.categoryStats.map(cat => [
                cat._id || 'Uncategorized',
                cat.totalSales,
                cat.totalViews,
                cat.pageCount
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['Category', 'Sales', 'Views', 'Pages']],
                body: categoryData,
                theme: 'grid',
                headStyles: { fillColor: [245, 158, 11] }
            });
        }

        // Save PDF
        doc.save(`LandingHub-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Export to Excel
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // System Overview Sheet
        if (reportData.systemReport) {
            const overviewData = [
                ['Metric', 'Value'],
                ['Total Revenue', reportData.systemReport.overview.totalRevenue],
                ['Platform Fees', reportData.systemReport.overview.platformFees],
                ['Fee Percentage', reportData.systemReport.overview.feePercentage],
                ['', ''],
                ['Marketplace'],
                ['Total Pages', reportData.systemReport.marketplace.totalPages],
                ['Avg Price', reportData.systemReport.marketplace.priceStats.avg],
                ['Min Price', reportData.systemReport.marketplace.priceStats.min],
                ['Max Price', reportData.systemReport.marketplace.priceStats.max],
                ['', ''],
                ['Leads'],
                ['Total Leads', reportData.systemReport.leads?.total || 0],
                ['Today', reportData.systemReport.leads?.today || 0],
                ['This Week', reportData.systemReport.leads?.thisWeek || 0],
                ['This Month', reportData.systemReport.leads?.thisMonth || 0]
            ];
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
        }

        // Top Sellers Sheet
        if (reportData.systemReport?.topSellers?.length > 0) {
            const sellerData = [
                ['Rank', 'Seller ID', 'Total Sales', 'Total Revenue', 'Total Earned', 'Platform Fees'],
                ...reportData.systemReport.topSellers.map(s => [
                    s.rank,
                    s.sellerId,
                    s.totalSales,
                    s.totalRevenue,
                    s.totalEarned,
                    s.platformFees
                ])
            ];
            const wsSellers = XLSX.utils.aoa_to_sheet(sellerData);
            XLSX.utils.book_append_sheet(wb, wsSellers, 'Top Sellers');
        }

        // Top Buyers Sheet
        if (reportData.systemReport?.topBuyers?.length > 0) {
            const buyerData = [
                ['Rank', 'Buyer ID', 'Total Purchases', 'Total Spent'],
                ...reportData.systemReport.topBuyers.map(b => [
                    b.rank,
                    b.buyerId,
                    b.totalPurchases,
                    b.totalSpent
                ])
            ];
            const wsBuyers = XLSX.utils.aoa_to_sheet(buyerData);
            XLSX.utils.book_append_sheet(wb, wsBuyers, 'Top Buyers');
        }

        // Marketplace Categories Sheet
        if (reportData.marketplaceTrends?.categoryStats?.length > 0) {
            const categoryData = [
                ['Category', 'Total Sales', 'Total Views', 'Page Count', 'Avg Price'],
                ...reportData.marketplaceTrends.categoryStats.map(c => [
                    c._id || 'Uncategorized',
                    c.totalSales,
                    c.totalViews,
                    c.pageCount,
                    c.avgPrice
                ])
            ];
            const wsCategories = XLSX.utils.aoa_to_sheet(categoryData);
            XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');
        }

        // Top Templates Sheet
        if (reportData.marketplaceTrends?.topTemplates?.length > 0) {
            const templateData = [
                ['Title', 'Category', 'Price', 'Sold Count', 'Views', 'Rating'],
                ...reportData.marketplaceTrends.topTemplates.map(t => [
                    t.title,
                    t.category,
                    t.price,
                    t.sold_count,
                    t.views,
                    t.rating || 'N/A'
                ])
            ];
            const wsTemplates = XLSX.utils.aoa_to_sheet(templateData);
            XLSX.utils.book_append_sheet(wb, wsTemplates, 'Top Templates');
        }

        // Chat Statistics Sheet
        if (reportData.chatAnalytics?.length > 0) {
            const chatData = [
                ['Date', 'Total Chats', 'Open Chats', 'Resolved Chats'],
                ...reportData.chatAnalytics.map(c => [
                    c._id,
                    c.totalChats,
                    c.openChats,
                    c.resolvedChats
                ])
            ];
            const wsChat = XLSX.utils.aoa_to_sheet(chatData);
            XLSX.utils.book_append_sheet(wb, wsChat, 'Chat Analytics');
        }

        XLSX.writeFile(wb, `LandingHub-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Header />
                <div className="dashboard-main">
                    <Sidebar />
                    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Loading comprehensive reports...
                        </Typography>
                    </Container>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <Header />
                <div className="dashboard-main">
                    <Sidebar />
                    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                        <Alert severity="error">{error}</Alert>
                    </Container>
                </div>
            </div>
        );
    }

    const { systemReport, chatAnalytics, marketplaceTrends, summary } = reportData;

    // Prepare order status data
    const orderStatusData = systemReport?.transactions?.byStatus?.map(item => ({
        status: item.status,
        count: item.count,
        amount: item.totalAmountRaw
    })) || [];

    // Prepare payment method data
    const paymentMethodData = systemReport?.transactions?.byPaymentMethod?.map(item => ({
        method: item.method,
        count: item.count,
        amount: item.totalAmountRaw
    })) || [];

    return (
        <div className="dashboard-container">
            <Header />
            <div className="dashboard-main">
                <Sidebar />
                <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                    {/* Header Section - No Print */}
                    <Box className="no-print" sx={{ mb: 4 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssessmentIcon fontSize="large" color="primary" />
                                    Comprehensive Reports
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    System analytics, marketplace insights, and performance metrics
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                                <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
                                    <TextField
                                        select
                                        size="small"
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        label="Time Range"
                                        sx={{ minWidth: 120 }}
                                    >
                                        <MenuItem value="7">Last 7 Days</MenuItem>
                                        <MenuItem value="30">Last 30 Days</MenuItem>
                                        <MenuItem value="90">Last 90 Days</MenuItem>
                                    </TextField>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Refresh />}
                                        onClick={fetchReports}
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={exportToPDF}
                                    >
                                        PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<DownloadIcon />}
                                        onClick={exportToExcel}
                                    >
                                        Excel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        startIcon={<PrintIcon />}
                                        onClick={handlePrint}
                                    >
                                        Print
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Print Header - Only visible when printing */}
                    <Box className="print-only" sx={{ display: 'none', '@media print': { display: 'block', mb: 3 } }}>
                        <Typography variant="h3" align="center" gutterBottom>
                            LandingHub - Comprehensive Report
                        </Typography>
                        <Typography variant="body1" align="center" color="text.secondary">
                            Generated: {new Date().toLocaleString()} | Period: Last {dateRange} Days
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                    </Box>

                    {/* Executive Summary */}
                    {summary && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUp color="primary" />
                                Executive Summary
                            </Typography>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <AttachMoney color="success" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Revenue
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h4" sx={{ mt: 1 }}>
                                                {systemReport?.overview?.totalRevenue || '₫0'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Fees: {systemReport?.overview?.platformFees || '₫0'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <ShoppingCart color="primary" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Marketplace Pages
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h4" sx={{ mt: 1 }}>
                                                {systemReport?.marketplace?.totalPages || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Avg: {systemReport?.marketplace?.priceStats?.avg || '₫0'}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Chat color="info" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Chats
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h4" sx={{ mt: 1 }}>
                                                {summary.totalChats?.toLocaleString() || 0}
                                            </Typography>
                                            <Typography variant="caption" color="success.main">
                                                {summary.todayChats || 0} today
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Description color="warning" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Leads
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h4" sx={{ mt: 1 }}>
                                                {systemReport?.leads?.total || 0}
                                            </Typography>
                                            <Typography variant="caption" color="warning.main">
                                                {systemReport?.leads?.today || 0} today
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Transaction Status & Payment Methods */}
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingCart color="primary" />
                                    Transaction Status Breakdown
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={orderStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.status}: ${entry.count}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {orderStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PaymentIcon color="success" />
                                    Payment Methods
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={paymentMethodData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="method" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#667eea" name="Transactions" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Revenue Trends */}
                    {systemReport?.dailyRevenue && systemReport.dailyRevenue.length > 0 && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoney color="success" />
                                Daily Revenue Trends (Last 30 Days)
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={systemReport.dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenueRaw" stroke="#34d399" strokeWidth={2} name="Revenue" />
                                    <Line type="monotone" dataKey="platformFeesRaw" stroke="#667eea" strokeWidth={2} name="Platform Fees" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    )}

                    {/* Chat Analytics */}
                    {chatAnalytics && chatAnalytics.length > 0 && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chat color="primary" />
                                Chat Analytics Trends
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chatAnalytics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="totalChats" stackId="1" stroke="#667eea" fill="#667eea" />
                                    <Area type="monotone" dataKey="openChats" stackId="2" stroke="#f59e0b" fill="#f59e0b" />
                                    <Area type="monotone" dataKey="resolvedChats" stackId="3" stroke="#34d399" fill="#34d399" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    )}

                    {/* Marketplace Categories */}
                    {marketplaceTrends?.categoryStats && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShoppingCart color="success" />
                                Marketplace Categories Performance
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Sales by Category
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={marketplaceTrends.categoryStats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="totalSales" fill="#667eea" name="Sales" />
                                            <Bar dataKey="totalViews" fill="#34d399" name="Views" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Category Distribution
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={marketplaceTrends.categoryStats}
                                                dataKey="pageCount"
                                                nameKey="_id"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                label
                                            >
                                                {marketplaceTrends.categoryStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    {/* Top Templates */}
                    {marketplaceTrends?.topTemplates && marketplaceTrends.topTemplates.length > 0 && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                ⭐ Top Performing Templates
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Rank</strong></TableCell>
                                            <TableCell><strong>Title</strong></TableCell>
                                            <TableCell><strong>Category</strong></TableCell>
                                            <TableCell align="right"><strong>Price</strong></TableCell>
                                            <TableCell align="right"><strong>Sales</strong></TableCell>
                                            <TableCell align="right"><strong>Views</strong></TableCell>
                                            <TableCell align="center"><strong>Rating</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {marketplaceTrends.topTemplates.slice(0, 10).map((template, index) => (
                                            <TableRow key={index}>
                                                <TableCell>#{index + 1}</TableCell>
                                                <TableCell>{template.title}</TableCell>
                                                <TableCell>
                                                    <Chip label={template.category} size="small" color="primary" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(template.price)}
                                                </TableCell>
                                                <TableCell align="right">{template.sold_count}</TableCell>
                                                <TableCell align="right">{template.views}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={template.rating ? `⭐ ${template.rating.toFixed(1)}` : 'N/A'}
                                                        size="small"
                                                        color={template.rating >= 4 ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Top Sellers & Top Buyers */}
                    <Grid container spacing={3} mb={3}>
                        {/* Top Sellers */}
                        {systemReport?.topSellers && systemReport.topSellers.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <People color="primary" />
                                        Top Sellers
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Rank</strong></TableCell>
                                                    <TableCell><strong>Seller ID</strong></TableCell>
                                                    <TableCell align="right"><strong>Sales</strong></TableCell>
                                                    <TableCell align="right"><strong>Revenue</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {systemReport.topSellers.slice(0, 5).map((seller) => (
                                                    <TableRow key={seller.sellerId}>
                                                        <TableCell>
                                                            <Chip
                                                                label={`#${seller.rank}`}
                                                                size="small"
                                                                color={seller.rank <= 3 ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                            {seller.sellerId.substring(0, 12)}...
                                                        </TableCell>
                                                        <TableCell align="right">{seller.totalSales}</TableCell>
                                                        <TableCell align="right">{seller.totalRevenue}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        )}

                        {/* Top Buyers */}
                        {systemReport?.topBuyers && systemReport.topBuyers.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <People color="success" />
                                        Top Buyers
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Rank</strong></TableCell>
                                                    <TableCell><strong>Buyer ID</strong></TableCell>
                                                    <TableCell align="right"><strong>Purchases</strong></TableCell>
                                                    <TableCell align="right"><strong>Spent</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {systemReport.topBuyers.slice(0, 5).map((buyer) => (
                                                    <TableRow key={buyer.buyerId}>
                                                        <TableCell>
                                                            <Chip
                                                                label={`#${buyer.rank}`}
                                                                size="small"
                                                                color={buyer.rank <= 3 ? 'success' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                            {buyer.buyerId.substring(0, 12)}...
                                                        </TableCell>
                                                        <TableCell align="right">{buyer.totalPurchases}</TableCell>
                                                        <TableCell align="right">{buyer.totalSpent}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>

                    {/* Leads Performance */}
                    {systemReport?.leads?.topPages && systemReport.leads.topPages.length > 0 && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Description color="warning" />
                                Top Lead Generating Pages
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Rank</strong></TableCell>
                                            <TableCell><strong>Page ID</strong></TableCell>
                                            <TableCell align="right"><strong>Leads Count</strong></TableCell>
                                            <TableCell align="right"><strong>Latest Submission</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {systemReport.leads.topPages.map((page) => (
                                            <TableRow key={page.pageId}>
                                                <TableCell>
                                                    <Chip label={`#${page.rank}`} size="small" color="warning" />
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {page.pageId.substring(0, 16)}...
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip label={page.leadsCount} color="success" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {new Date(page.latestSubmission).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Footer */}
                    <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2">
                            Report generated on {new Date().toLocaleString()} | LandingHub Analytics Platform
                        </Typography>
                    </Box>

                    {/* Print Styles */}
                    <style>{`
                        @media print {
                            .no-print {
                                display: none !important;
                            }
                            .print-only {
                                display: block !important;
                            }
                            body {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                    `}</style>
                </Container>
            </div>
        </div>
    );
};

export default React.memo(Reports);
