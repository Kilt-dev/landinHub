import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import {
    Container, Grid, Paper, Typography, Box, Card, CardContent,
    Select, MenuItem, FormControl, InputLabel, CircularProgress, Divider, Chip
} from '@mui/material';
import {
    TrendingUp, ChatBubble, Message, Group, ShoppingCart, AttachMoney,
    Assessment, Payment, AccountBalance, Description, Psychology,
    Lightbulb, Analytics, Inventory, Category, Star, LocalAtm, CreditCard
} from '@mui/icons-material';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import axios from 'axios';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminAnalytics = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(30);
    const [chatTrends, setChatTrends] = useState([]);
    const [marketplaceTrends, setMarketplaceTrends] = useState(null);
    const [summary, setSummary] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [systemReport, setSystemReport] = useState(null);

    // Helper function to clean and parse AI text (remove emoji)
    const cleanAIText = (text) => {
        if (!text) return [];
        // Remove emoji and split into lines
        const cleanedText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
        // Split by newlines and filter empty lines
        const lines = cleanedText.split('\n').filter(line => line.trim());
        return lines;
    };

    // Parse recommendations into structured format
    const parseRecommendations = (text) => {
        if (!text) return [];
        const lines = cleanAIText(text);
        const recommendations = [];
        let currentRec = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            // Check if it's a numbered item (e.g., "1. Title" or "1) Title")
            const match = trimmed.match(/^(\d+)[.):]\s*(.+)/);
            if (match) {
                if (currentRec) recommendations.push(currentRec);
                currentRec = { title: match[2], details: [] };
            } else if (currentRec && trimmed.startsWith('-')) {
                currentRec.details.push(trimmed.substring(1).trim());
            } else if (currentRec && trimmed) {
                currentRec.details.push(trimmed);
            } else if (trimmed && !currentRec) {
                // Standalone text
                recommendations.push({ title: trimmed, details: [] });
            }
        });
        if (currentRec) recommendations.push(currentRec);
        return recommendations;
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            const [trendsRes, marketplaceRes, summaryRes, insightsRes, systemRes] = await Promise.all([
                axios.get(`${apiUrl}/api/chat-analytics/trends?days=${timeRange}`, config),
                axios.get(`${apiUrl}/api/chat-analytics/marketplace-trends?days=${timeRange}`, config),
                axios.get(`${apiUrl}/api/chat-analytics/summary`, config),
                axios.get(`${apiUrl}/api/chat-analytics/ai-insights?days=${timeRange}`, config),
                axios.get(`${apiUrl}/api/reports/admin/system`, config)
            ]);

            setChatTrends(trendsRes.data.data);
            setMarketplaceTrends(marketplaceRes.data.data);
            setSummary(summaryRes.data.data);
            setAiInsights(insightsRes.data.data);
            setSystemReport(systemRes.data.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
        <Card sx={{
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            borderLeft: `4px solid ${color}`,
            height: '100%'
        }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                        {trend && (
                            <Chip
                                label={trend}
                                size="small"
                                color={trend.includes('+') ? 'success' : 'error'}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Box>
                    <Box sx={{
                        backgroundColor: `${color}20`,
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="dashboard-container">
                <Header role={user?.role} />
                <div className="dashboard-main">
                    <Sidebar role={user?.role} />
                    <div className="dashboard-content">
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                            <CircularProgress />
                        </Box>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare order status data for chart
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
            <Header role={user?.role} />
            <div className="dashboard-main">
                <Sidebar role={user?.role} />
                <div className="dashboard-content">
                    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Analytics sx={{ fontSize: 40, color: '#667eea' }} />
                                <Typography variant="h4" fontWeight="bold">
                                    Admin Analytics Dashboard
                                </Typography>
                            </Box>
                            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Time Range</InputLabel>
                                <Select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    label="Time Range"
                                >
                                    <MenuItem value={7}>Last 7 days</MenuItem>
                                    <MenuItem value={30}>Last 30 days</MenuItem>
                                    <MenuItem value={90}>Last 90 days</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Summary Cards Row 1 - Business Metrics */}
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <AttachMoney /> Business Metrics
                        </Typography>
                        <Grid container spacing={3} mb={4}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Revenue"
                                    value={systemReport?.overview?.totalRevenue || '₫0'}
                                    subtitle={`Fees: ${systemReport?.overview?.platformFees || '₫0'}`}
                                    icon={<AttachMoney sx={{ color: '#10b981', fontSize: 40 }} />}
                                    color="#10b981"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Marketplace Pages"
                                    value={systemReport?.marketplace?.totalPages || 0}
                                    subtitle={`Avg: ${systemReport?.marketplace?.priceStats?.avg || '₫0'}`}
                                    icon={<ShoppingCart sx={{ color: '#667eea', fontSize: 40 }} />}
                                    color="#667eea"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Leads"
                                    value={systemReport?.leads?.total || 0}
                                    subtitle={`Today: ${systemReport?.leads?.today || 0}`}
                                    icon={<Description sx={{ color: '#f59e0b', fontSize: 40 }} />}
                                    color="#f59e0b"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Active Users"
                                    value={summary?.totalUsers || 0}
                                    subtitle={`${summary?.totalChats || 0} total chats`}
                                    icon={<Group sx={{ color: '#4facfe', fontSize: 40 }} />}
                                    color="#4facfe"
                                />
                            </Grid>
                        </Grid>

                        {/* Summary Cards Row 2 - Chat & Support */}
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ChatBubble /> Support & Engagement
                        </Typography>
                        <Grid container spacing={3} mb={4}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Today's Chats"
                                    value={summary?.todayChats || 0}
                                    subtitle={`${summary?.resolvedToday || 0} resolved today`}
                                    icon={<ChatBubble sx={{ color: '#667eea', fontSize: 40 }} />}
                                    color="#667eea"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Open Chats"
                                    value={summary?.openChats || 0}
                                    subtitle="Needs attention"
                                    icon={<Message sx={{ color: '#f093fb', fontSize: 40 }} />}
                                    color="#f093fb"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Messages Today"
                                    value={summary?.todayMessages || 0}
                                    subtitle={`AI: ${summary?.messageStats?.aiToday || 0} (${summary?.messageStats?.aiPercentage || 0}%)`}
                                    icon={<TrendingUp sx={{ color: '#43e97b', fontSize: 40 }} />}
                                    color="#43e97b"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Messages"
                                    value={summary?.messageStats?.total || 0}
                                    subtitle={`AI: ${summary?.messageStats?.aiGenerated || 0}`}
                                    icon={<Assessment sx={{ color: '#8b5cf6', fontSize: 40 }} />}
                                    color="#8b5cf6"
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        {/* AI Recommendations */}
                        {summary?.aiRecommendations && parseRecommendations(summary.aiRecommendations).length > 0 && (
                            <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', border: '1px solid #667eea40' }}>
                                <Box display="flex" alignItems="center" gap={1} mb={3}>
                                    <Psychology sx={{ color: '#667eea', fontSize: 28 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        AI Smart Recommendations
                                    </Typography>
                                </Box>
                                <Box>
                                    {parseRecommendations(summary.aiRecommendations).map((rec, index) => (
                                        <Box key={index} mb={2}>
                                            <Box display="flex" alignItems="flex-start" gap={1}>
                                                <Lightbulb sx={{ color: '#f59e0b', fontSize: 20, mt: 0.3 }} />
                                                <Box>
                                                    <Typography variant="body1" fontWeight="600" gutterBottom>
                                                        {rec.title}
                                                    </Typography>
                                                    {rec.details.length > 0 && (
                                                        <Box ml={2}>
                                                            {rec.details.map((detail, idx) => (
                                                                <Typography key={idx} variant="body2" color="text.secondary" paragraph>
                                                                    {detail}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                            {index < parseRecommendations(summary.aiRecommendations).length - 1 && (
                                                <Divider sx={{ my: 2 }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        {/* AI Insights */}
                        {aiInsights && (
                            <Grid container spacing={3} mb={4}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, height: '100%', border: '1px solid #f093fb40' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                                            <ChatBubble sx={{ color: '#f093fb', fontSize: 28 }} />
                                            <Typography variant="h6" fontWeight="bold">
                                                Chat Trends Analysis
                                            </Typography>
                                        </Box>
                                        <Box>
                                            {aiInsights.chatInsights && cleanAIText(aiInsights.chatInsights).length > 0 ? (
                                                cleanAIText(aiInsights.chatInsights).map((line, index) => (
                                                    <Typography key={index} variant="body2" paragraph color="text.secondary">
                                                        {line}
                                                    </Typography>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    Chưa có đủ dữ liệu cuộc hội thoại để phân tích. Khi có người dùng bắt đầu chat, AI sẽ tự động phân tích xu hướng và đưa ra insights.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, height: '100%', border: '1px solid #43e97b40' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={3}>
                                            <ShoppingCart sx={{ color: '#43e97b', fontSize: 28 }} />
                                            <Typography variant="h6" fontWeight="bold">
                                                Marketplace Insights
                                            </Typography>
                                        </Box>
                                        <Box>
                                            {aiInsights.marketplaceInsights && cleanAIText(aiInsights.marketplaceInsights).length > 0 ? (
                                                cleanAIText(aiInsights.marketplaceInsights).map((line, index) => (
                                                    <Typography key={index} variant="body2" paragraph color="text.secondary">
                                                        {line}
                                                    </Typography>
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    Chưa có đủ dữ liệu marketplace để phân tích. Khi có template được đăng bán và có người mua, AI sẽ phân tích hiệu suất và đưa ra insights.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}

                        {/* Revenue Trends Chart */}
                        {systemReport?.dailyRevenue && systemReport.dailyRevenue.length > 0 && (
                            <Paper sx={{ p: 3, mb: 4 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={3}>
                                    <LocalAtm sx={{ color: '#10b981', fontSize: 28 }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Revenue Trends (Last 30 Days)
                                    </Typography>
                                </Box>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={systemReport.dailyRevenue}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="revenueRaw" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                        <Area type="monotone" dataKey="platformFeesRaw" stroke="#667eea" fillOpacity={1} fill="url(#colorFees)" name="Platform Fees" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Paper>
                        )}

                        {/* Order Status & Payment Methods */}
                        <Grid container spacing={3} mb={4}>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <Inventory sx={{ color: '#667eea', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Transaction Status Breakdown
                                        </Typography>
                                    </Box>
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
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <CreditCard sx={{ color: '#4facfe', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Payment Methods Distribution
                                        </Typography>
                                    </Box>
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

                        {/* Marketplace Trends */}
                        <Grid container spacing={3}>
                            {/* Category Performance */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <Star sx={{ color: '#f59e0b', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Top Categories by Sales
                                        </Typography>
                                    </Box>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={marketplaceTrends?.categoryStats || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="totalSales" fill="#667eea" name="Sales" />
                                            <Bar dataKey="totalViews" fill="#4facfe" name="Views" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>

                            {/* Category Distribution Pie */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <Category sx={{ color: '#8b5cf6', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Category Distribution
                                        </Typography>
                                    </Box>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={marketplaceTrends?.categoryStats || []}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry._id}: ${entry.pageCount}`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="pageCount"
                                            >
                                                {(marketplaceTrends?.categoryStats || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>

                            {/* Top Templates */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                                        <TrendingUp sx={{ color: '#10b981', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Top Performing Templates
                                        </Typography>
                                    </Box>
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>Template</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Price</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Sales</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Views</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>Rating</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {(marketplaceTrends?.topTemplates || []).map((template, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '12px' }}>{template.title}</td>
                                                    <td style={{ padding: '12px' }}>{template.category}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(template.price)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>{template.sold_count}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>{template.views}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        {template.rating?.toFixed(1) || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;