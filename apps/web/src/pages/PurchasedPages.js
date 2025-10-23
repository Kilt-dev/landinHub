import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Market.css';
import DogLoader from '../components/Loader';
import { ShoppingBag, Download, Eye, Calendar } from 'lucide-react';

const PurchasedPages = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [purchasedPages, setPurchasedPages] = useState([]);
    const [filteredPages, setFilteredPages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const categories = [
        { value: 'all', label: 'Tất cả' },
        { value: 'business', label: 'Doanh nghiệp' },
        { value: 'portfolio', label: 'Portfolio' },
        { value: 'ecommerce', label: 'E-commerce' },
        { value: 'blog', label: 'Blog' },
        { value: 'event', label: 'Sự kiện' },
        { value: 'other', label: 'Khác' }
    ];

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                setLoading(false);
                return;
            }
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role);
            } catch (err) {
                console.error('Lỗi giải mã token:', err);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role) {
            setUserRole(user.role);
            setLoading(false);
        } else {
            initializeAuth();
        }
    }, [user, navigate]);

    useEffect(() => {
        AOS.init({ duration: 600, once: true });
    }, []);

    useEffect(() => {
        if (userRole) {
            loadPurchasedPages();
        }
    }, [userRole, currentPage, selectedCategory, searchQuery]);

    const loadPurchasedPages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 12
            });

            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await axios.get(
                `${API_BASE_URL}/api/marketplace/my/purchased?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPurchasedPages(response.data.data || []);
            setFilteredPages(response.data.data || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Load purchased pages error:', err);
            toast.error('Không thể tải danh sách page đã mua');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (pageId, format) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/marketplace/${pageId}/download/${format}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `page-${pageId}.${format === 'iuhpage' ? 'iuhpage' : 'zip'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Tải xuống thành công!');
        } catch (err) {
            console.error('Download error:', err);
            toast.error('Không thể tải xuống page');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    if (loading && purchasedPages.length === 0) {
        return <DogLoader />;
    }

    return (
        <div className="marketplace-container">
            <Sidebar role={userRole} />
            <div className="marketplace-main">
                <Header />
                <div className="marketplace-content">
                    {/* Header */}
                    <div className="marketplace-hero" data-aos="fade-down">
                        <div>
                            <h1>🛍️ Page đã mua</h1>
                            <p>Quản lý các landing page bạn đã mua từ marketplace</p>
                        </div>
                        <button className="btn-back" onClick={() => navigate('/market')}>
                            ← Quay lại Marketplace
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid" data-aos="fade-up" style={{ marginBottom: '30px' }}>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#dbeafe' }}>
                                <ShoppingBag size={28} color="#2563eb" />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{purchasedPages.length}</div>
                                <div className="stat-label">Tổng page đã mua</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="marketplace-filters" data-aos="fade-up">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm page..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-row">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pages Grid */}
                    {loading ? (
                        <DogLoader />
                    ) : filteredPages.length === 0 ? (
                        <div className="marketplace-empty" data-aos="fade-up">
                            <ShoppingBag size={64} color="#9ca3af" />
                            <h3>Bạn chưa mua page nào</h3>
                            <p>Khám phá các landing page tuyệt vời trên marketplace!</p>
                            <button className="btn-primary" onClick={() => navigate('/market')}>
                                Khám phá Marketplace
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="marketplace-grid" data-aos="fade-up">
                                {filteredPages.map((page) => (
                                    <div key={page._id} className="marketplace-card">
                                        <div className="marketplace-card-image">
                                            {page.preview_image ? (
                                                <img src={page.preview_image} alt={page.title} />
                                            ) : (
                                                <div className="marketplace-card-placeholder">
                                                    No preview
                                                </div>
                                            )}
                                            <div className="marketplace-card-badge" style={{ background: '#10b981' }}>
                                                ✅ Đã mua
                                            </div>
                                        </div>
                                        <div className="marketplace-card-content">
                                            <h3>{page.title}</h3>
                                            <p className="marketplace-card-description">
                                                {page.description?.substring(0, 100)}
                                                {page.description?.length > 100 && '...'}
                                            </p>
                                            <div className="marketplace-card-meta">
                                                <span className="marketplace-card-category">
                                                    {categories.find(c => c.value === page.category)?.label || page.category}
                                                </span>
                                                <span className="marketplace-card-price">
                                                    {formatPrice(page.price)}
                                                </span>
                                            </div>
                                            {page.purchased_at && (
                                                <div className="marketplace-card-purchase-date" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.875rem',
                                                    color: '#6b7280',
                                                    marginTop: '8px'
                                                }}>
                                                    <Calendar size={14} />
                                                    <span>Mua ngày: {formatDate(page.purchased_at)}</span>
                                                </div>
                                            )}
                                            <div className="marketplace-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => navigate(`/market/${page._id}`)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        padding: '10px',
                                                        width: '100%'
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                    Xem chi tiết
                                                </button>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-primary"
                                                        onClick={() => handleDownload(page._id, 'html')}
                                                        title="Tải về HTML"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            fontSize: '0.875rem',
                                                            padding: '8px'
                                                        }}
                                                    >
                                                        <Download size={14} />
                                                        HTML
                                                    </button>
                                                    <button
                                                        className="btn-primary"
                                                        onClick={() => handleDownload(page._id, 'iuhpage')}
                                                        title="Tải về .iuhpage"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            fontSize: '0.875rem',
                                                            padding: '8px'
                                                        }}
                                                    >
                                                        <Download size={14} />
                                                        .iuhpage
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pagination" data-aos="fade-up">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        Trước
                                    </button>
                                    <span>Trang {currentPage} / {totalPages}</span>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchasedPages;