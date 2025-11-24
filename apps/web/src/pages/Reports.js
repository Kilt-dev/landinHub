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
    Stack,
    LinearProgress,
    Avatar,
    Tabs,
    Tab
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
    Radar,
    ComposedChart
} from 'recharts';
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    Assessment as AssessmentIcon,
    TrendingUp,
    TrendingDown,
    AttachMoney,
    ShoppingCart,
    People,
    Chat,
    Refresh,
    Description,
    Payment as PaymentIcon,
    Insights,
    Timeline,
    Speed,
    CheckCircle,
    Cancel,
    HourglassEmpty,
    LocalAtm,
    Store,
    StarRate
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
    const [tabValue, setTabValue] = useState(0);
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
                ['Total Pages', reportData.systemReport.marketplace.totalPages],
                ['Total Leads', reportData.systemReport.leads?.total || 0]
            ];
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
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

    // Prepare data for charts
    const orderStatusData = systemReport?.transactions?.byStatus?.map(item => ({
        status: item.status,
        count: item.count,
        amount: item.totalAmountRaw
    })) || [];

    const paymentMethodData = systemReport?.transactions?.byPaymentMethod?.map(item => ({
        method: item.method,
        count: item.count,
        amount: item.totalAmountRaw
    })) || [];

    // Performance metrics for radar chart
    const performanceData = [{
        metric: 'Revenue',
        value: Math.min((systemReport?.overview?.totalRevenueRaw || 0) / 10000000 * 100, 100)
    }, {
        metric: 'Sales',
        value: Math.min((systemReport?.marketplace?.totalPages || 0) / 100 * 100, 100)
    }, {
        metric: 'Leads',
        value: Math.min((systemReport?.leads?.total || 0) / 500 * 100, 100)
    }, {
        metric: 'Chats',
        value: Math.min((summary?.totalChats || 0) / 1000 * 100, 100)
    }, {
        metric: 'Users',
        value: Math.min((summary?.totalUsers || 0) / 500 * 100, 100)
    }];

    // KPI Card Component
    const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, gradient }) => (
        <Card
            elevation={3}
            sx={{
                background: gradient || `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                borderLeft: `4px solid ${color}`,
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                }
            }}
        >
            <CardContent>
                <Stack spacing={1}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {title}
                        </Typography>
                        <Avatar sx={{ bgcolor: `${color}30`, width: 40, height: 40 }}>
                            <Icon sx={{ color: color, fontSize: 24 }} />
                        </Avatar>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                        {value}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                        {trend && (
                            <Chip
                                icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                                label={trendValue || '0%'}
                                size="small"
                                color={trend === 'up' ? 'success' : 'error'}
                                sx={{ height: 20 }}
                            />
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

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
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{
                                        bgcolor: 'primary.main',
                                        width: 56,
                                        height: 56,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    }}>
                                        <AssessmentIcon fontSize="large" />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            System Reports
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Comprehensive analytics & business intelligence
                                        </Typography>
                                    </Box>
                                </Box>
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

                    {/* Navigation Tabs */}
                    <Paper sx={{ mb: 3 }} className="no-print">
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                            <Tab icon={<Timeline />} label="Overview" />
                            <Tab icon={<AttachMoney />} label="Revenue" />
                            <Tab icon={<Store />} label="Marketplace" />
                            <Tab icon={<Chat />} label="Support" />
                            <Tab icon={<Speed />} label="Performance" />
                        </Tabs>
                    </Paper>

                    {/* Tab Content: Overview */}
                    {tabValue === 0 && (
                        <>
                            {/* KPI Cards */}
                            <Grid container spacing={3} mb={4}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <KPICard
                                        title="TOTAL REVENUE"
                                        value={systemReport?.overview?.totalRevenue || '₫0'}
                                        subtitle={`Fees: ${systemReport?.overview?.platformFees || '₫0'}`}
                                        icon={LocalAtm}
                                        color="#10b981"
                                        trend="up"
                                        trendValue="+12.5%"
                                        gradient="linear-gradient(135deg, #10b98120 0%, #10b98110 100%)"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <KPICard
                                        title="MARKETPLACE PAGES"
                                        value={systemReport?.marketplace?.totalPages || 0}
                                        subtitle={`Avg: ${systemReport?.marketplace?.priceStats?.avg || '₫0'}`}
                                        icon={Store}
                                        color="#667eea"
                                        trend="up"
                                        trendValue="+8.3%"
                                        gradient="linear-gradient(135deg, #667eea20 0%, #764ba210 100%)"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <KPICard
                                        title="TOTAL CHATS"
                                        value={summary?.totalChats?.toLocaleString() || 0}
                                        subtitle={`${summary?.todayChats || 0} today`}
                                        icon={Chat}
                                        color="#06b6d4"
                                        trend="up"
                                        trendValue="+15.2%"
                                        gradient="linear-gradient(135deg, #06b6d420 0%, #06b6d410 100%)"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <KPICard
                                        title="TOTAL LEADS"
                                        value={systemReport?.leads?.total || 0}
                                        subtitle={`${systemReport?.leads?.today || 0} today`}
                                        icon={Description}
                                        color="#f59e0b"
                                        trend="down"
                                        trendValue="-2.1%"
                                        gradient="linear-gradient(135deg, #f59e0b20 0%, #f59e0b10 100%)"
                                    />
                                </Grid>
                            </Grid>

                            {/* Quick Stats */}
                            <Grid container spacing={3} mb={4}>
                                <Grid item xs={12} md={4}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="success.main">
                                                Transaction Success Rate
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                <CheckCircle color="success" />
                                                <Typography variant="h3" fontWeight="bold">
                                                    {systemReport?.transactions?.successRate || '0%'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseFloat(systemReport?.transactions?.successRate) || 0}
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color="success"
                                            />
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="info.main">
                                                Average Order Value
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                <ShoppingCart color="info" />
                                                <Typography variant="h3" fontWeight="bold">
                                                    {systemReport?.marketplace?.priceStats?.avg || '₫0'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Range: {systemReport?.marketplace?.priceStats?.min} - {systemReport?.marketplace?.priceStats?.max}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom color="warning.main">
                                                User Engagement
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                <People color="warning" />
                                                <Typography variant="h3" fontWeight="bold">
                                                    {summary?.totalUsers || 0}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Active users with chat history
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Performance Radar Chart */}
                            <Paper sx={{ p: 3, mb: 4 }}>
                                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Speed color="primary" />
                                    System Performance Overview
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={performanceData}>
                                                <PolarGrid stroke="#667eea" />
                                                <PolarAngleAxis dataKey="metric" />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                <Radar
                                                    name="Performance"
                                                    dataKey="value"
                                                    stroke="#667eea"
                                                    fill="#667eea"
                                                    fillOpacity={0.6}
                                                />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Stack spacing={2}>
                                            {performanceData.map((item, index) => (
                                                <Box key={index}>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {item.metric}
                                                        </Typography>
                                                        <Typography variant="body2" color="primary.main">
                                                            {item.value.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={item.value}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: '#e0e0e0',
                                                            '& .MuiLinearProgress-bar': {
                                                                background: `linear-gradient(90deg, #667eea ${item.value}%, #764ba2 100%)`
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </>
                    )}

                    {/* Tab Content: Revenue */}
                    {tabValue === 1 && (
                        <>
                            {/* Revenue Trends */}
                            {systemReport?.dailyRevenue && systemReport.dailyRevenue.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Timeline color="success" />
                                        Revenue Trends (Last 30 Days)
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={systemReport.dailyRevenue}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                                </linearGradient>
                                                <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="revenueRaw"
                                                stroke="#10b981"
                                                fill="url(#colorRevenue)"
                                                name="Total Revenue"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="platformFeesRaw"
                                                stroke="#667eea"
                                                fill="url(#colorFees)"
                                                name="Platform Fees"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="transactionCount"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                name="Transactions"
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </Paper>
                            )}

                            {/* Transaction Status & Payment Methods */}
                            <Grid container spacing={3} mb={4}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, height: '100%' }}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Insights color="primary" />
                                            Transaction Status
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={orderStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    labelLine={false}
                                                    label={(entry) => `${entry.status}: ${entry.count}`}
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
                                    <Paper sx={{ p: 3, height: '100%' }}>
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
                                                <Bar dataKey="count" fill="#10b981" name="Transactions" radius={[8, 8, 0, 0]} />
                                                <Bar dataKey="amount" fill="#667eea" name="Amount" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Top Sellers & Top Buyers */}
                            <Grid container spacing={3} mb={4}>
                                {systemReport?.topSellers && systemReport.topSellers.length > 0 && (
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 3, height: '100%' }}>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <StarRate color="primary" />
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
                                                            <TableRow
                                                                key={seller.sellerId}
                                                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                                            >
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
                                                                <TableCell align="right">
                                                                    <Chip label={seller.totalSales} size="small" color="primary" />
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                    {seller.totalRevenue}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Grid>
                                )}

                                {systemReport?.topBuyers && systemReport.topBuyers.length > 0 && (
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 3, height: '100%' }}>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                                            <TableRow
                                                                key={buyer.buyerId}
                                                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                                            >
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
                                                                <TableCell align="right">
                                                                    <Chip label={buyer.totalPurchases} size="small" color="info" />
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                                                    {buyer.totalSpent}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </>
                    )}

                    {/* Tab Content: Marketplace */}
                    {tabValue === 2 && (
                        <>
                            {/* Marketplace Categories */}
                            {marketplaceTrends?.categoryStats && (
                                <Paper sx={{ p: 3, mb: 4 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Store color="primary" />
                                        Marketplace Performance by Category
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={7}>
                                            <ResponsiveContainer width="100%" height={350}>
                                                <BarChart data={marketplaceTrends.categoryStats}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="_id" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="totalSales" fill="#667eea" name="Total Sales" radius={[8, 8, 0, 0]} />
                                                    <Bar dataKey="totalViews" fill="#34d399" name="Total Views" radius={[8, 8, 0, 0]} />
                                                    <Bar dataKey="pageCount" fill="#f59e0b" name="Page Count" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <ResponsiveContainer width="100%" height={350}>
                                                <PieChart>
                                                    <Pie
                                                        data={marketplaceTrends.categoryStats}
                                                        dataKey="pageCount"
                                                        nameKey="_id"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        label={(entry) => `${entry._id}: ${entry.pageCount}`}
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
                                <Paper sx={{ p: 3, mb: 4 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StarRate color="warning" />
                                        Top Performing Templates
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell><strong>Rank</strong></TableCell>
                                                    <TableCell><strong>Title</strong></TableCell>
                                                    <TableCell><strong>Category</strong></TableCell>
                                                    <TableCell align="right"><strong>Price</strong></TableCell>
                                                    <TableCell align="right"><strong>Sales</strong></TableCell>
                                                    <TableCell align="right"><strong>Views</strong></TableCell>
                                                    <TableCell align="center"><strong>Rating</strong></TableCell>
                                                    <TableCell align="right"><strong>Conversion</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {marketplaceTrends.topTemplates.slice(0, 10).map((template, index) => {
                                                    const conversionRate = ((template.sold_count / template.views) * 100).toFixed(1);
                                                    return (
                                                        <TableRow
                                                            key={index}
                                                            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                                        >
                                                            <TableCell>
                                                                <Chip
                                                                    label={`#${index + 1}`}
                                                                    size="small"
                                                                    color={index < 3 ? 'warning' : 'default'}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>
                                                                {template.title}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={template.category}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(template.price)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip label={template.sold_count} size="small" color="info" />
                                                            </TableCell>
                                                            <TableCell align="right">{template.views.toLocaleString()}</TableCell>
                                                            <TableCell align="center">
                                                                <Chip
                                                                    label={template.rating ? template.rating.toFixed(1) : 'N/A'}
                                                                    size="small"
                                                                    color={template.rating >= 4.5 ? 'success' : template.rating >= 4 ? 'info' : 'default'}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip
                                                                    label={`${conversionRate}%`}
                                                                    size="small"
                                                                    color={conversionRate > 5 ? 'success' : conversionRate > 2 ? 'warning' : 'default'}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}
                        </>
                    )}

                    {/* Tab Content: Support */}
                    {tabValue === 3 && (
                        <>
                            {/* Chat Analytics */}
                            {chatAnalytics && chatAnalytics.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chat color="primary" />
                                        Support Chat Trends
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={chatAnalytics}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                                                </linearGradient>
                                                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                                                </linearGradient>
                                                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="totalChats"
                                                stroke="#667eea"
                                                fill="url(#colorTotal)"
                                                name="Total Chats"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="openChats"
                                                stroke="#f59e0b"
                                                fill="url(#colorOpen)"
                                                name="Open Chats"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="resolvedChats"
                                                stroke="#34d399"
                                                fill="url(#colorResolved)"
                                                name="Resolved Chats"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Paper>
                            )}

                            {/* Chat Statistics Cards */}
                            <Grid container spacing={3} mb={4}>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ background: 'linear-gradient(135deg, #667eea20 0%, #764ba210 100%)' }}>
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                        <Chat />
                                                    </Avatar>
                                                    <Typography variant="h6">Total Chats</Typography>
                                                </Box>
                                                <Typography variant="h3" fontWeight="bold">
                                                    {summary?.totalChats?.toLocaleString() || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    All time conversations
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ background: 'linear-gradient(135deg, #f59e0b20 0%, #f59e0b10 100%)' }}>
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                                        <HourglassEmpty />
                                                    </Avatar>
                                                    <Typography variant="h6">Open Chats</Typography>
                                                </Box>
                                                <Typography variant="h3" fontWeight="bold">
                                                    {summary?.openChats || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Awaiting response
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ background: 'linear-gradient(135deg, #34d39920 0%, #34d39910 100%)' }}>
                                        <CardContent>
                                            <Stack spacing={2}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                                        <CheckCircle />
                                                    </Avatar>
                                                    <Typography variant="h6">Resolved Today</Typography>
                                                </Box>
                                                <Typography variant="h3" fontWeight="bold">
                                                    {summary?.resolvedToday || 0}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Successfully handled
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </>
                    )}

                    {/* Tab Content: Performance */}
                    {tabValue === 4 && (
                        <>
                            {/* Leads Performance */}
                            {systemReport?.leads?.topPages && systemReport.leads.topPages.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4 }}>
                                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Description color="warning" />
                                        Top Lead Generating Pages
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell><strong>Rank</strong></TableCell>
                                                    <TableCell><strong>Page ID</strong></TableCell>
                                                    <TableCell align="right"><strong>Leads Count</strong></TableCell>
                                                    <TableCell align="right"><strong>Latest Submission</strong></TableCell>
                                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {systemReport.leads.topPages.map((page) => (
                                                    <TableRow
                                                        key={page.pageId}
                                                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                                    >
                                                        <TableCell>
                                                            <Chip
                                                                label={`#${page.rank}`}
                                                                size="small"
                                                                color={page.rank <= 3 ? 'warning' : 'default'}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                                            {page.pageId.substring(0, 16)}...
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={page.leadsCount}
                                                                color="success"
                                                                sx={{ fontWeight: 'bold' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {new Date(page.latestSubmission).toLocaleDateString('vi-VN')}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label="Active"
                                                                size="small"
                                                                color="success"
                                                                icon={<CheckCircle />}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    <Box sx={{ mt: 6, textAlign: 'center', color: 'text.secondary' }}>
                        <Divider sx={{ mb: 3 }} />
                        <Typography variant="body2" gutterBottom>
                            Report generated on {new Date().toLocaleString('vi-VN')} | LandingHub Analytics Platform
                        </Typography>
                        <Typography variant="caption">
                            © {new Date().getFullYear()} LandingHub. All rights reserved.
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
