import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Marketplace.css';
import DogLoader from '../components/Loader';
import { Search, Eye, Heart, Star, ShoppingCart } from 'lucide-react';

const Marketplace = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [pages, setPages] = useState([]);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [featuredPages, setFeaturedPages] = useState([]);
    const [bestsellers, setBestsellers] = useState([]);
    const [viewFilter, setViewFilter] = useState('all'); // all / purchased / my-pages
    const [purchasedPageIds, setPurchasedPageIds] = useState([]);
    const [myPageIds, setMyPageIds] = useState([]);

    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const categories = [
        { value: 'all', label: 'Tất cả' },
        { value: 'Thương mại điện tử', label: 'Thương mại điện tử' },
        { value: 'Landing Page', label: 'Landing Page' },
        { value: 'Blog', label: 'Blog' },
        { value: 'Portfolio', label: 'Portfolio' },
        { value: 'Doanh nghiệp', label: 'Doanh nghiệp' },
        { value: 'Giáo dục', label: 'Giáo dục' },
        { value: 'Sự kiện', label: 'Sự kiện' },
        { value: 'Bất động sản', label: 'Bất động sản' },
        { value: 'Ẩm thực', label: 'Ẩm thực' },
        { value: 'Du lịch', label: 'Du lịch' },
        { value: 'Y tế', label: 'Y tế' },
        { value: 'Thời trang', label: 'Thời trang' },
        { value: 'Khác', label: 'Khác' }
    ];

    const sortOptions = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'oldest', label: 'Cũ nhất' },
        { value: 'price_low', label: 'Giá thấp đến cao' },
        { value: 'price_high', label: 'Giá cao đến thấp' },
        { value: 'popular', label: 'Phổ biến nhất' },
        { value: 'bestseller', label: 'Bán chạy nhất' },
        { value: 'rating', label: 'Đánh giá cao nhất' }
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
                if (!decodedToken.role || !decodedToken.userId) {
                    navigate('/auth');
                    setLoading(false);
                    return;
                }
                setUserRole(decodedToken.role);
                setUserId(decodedToken.userId || decodedToken.id || decodedToken._id);
            } catch (err) {
                console.error('Lỗi giải mã token:', err);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role) {
            setUserRole(user.role);
            setUserId(user.id || user.userId || user._id);
            setLoading(false);
        } else {
            initializeAuth();
        }
    }, [user, navigate]);

    // Fetch purchased and my page IDs
    useEffect(() => {
        if (userId) {
            fetchPurchasedPageIds();
            fetchMyPageIds();
        }
    }, [userId]);

    const fetchPurchasedPageIds = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/marketplace/my/purchased?limit=1000`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const ids = (response.data.data || []).map(p => p._id);
            setPurchasedPageIds(ids);
        } catch (err) {
            console.error('Fetch purchased pages error:', err);
        }
    };

    const fetchMyPageIds = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/marketplace/my/pages`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const ids = (response.data.data || []).map(p => p._id);
            setMyPageIds(ids);
        } catch (err) {
            console.error('Fetch my pages error:', err);
        }
    };

    useEffect(() => {
        AOS.init({ duration: 600, once: true, offset: 100 });
    }, []);

    useEffect(() => {
        if (userRole) {
            loadFeaturedPages();
            loadBestsellers();
        }
    }, [userRole]);

    useEffect(() => {
        if (userRole) {
            setPages([]);
            setPage(1);
            setHasMore(true);
            loadPages(1);
        }
    }, [userRole, selectedCategory, sortBy]);

    const loadFeaturedPages = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/featured/list?limit=5`);
            setFeaturedPages(response.data.data || []);
        } catch (err) {
            console.error('Lỗi tải featured pages:', err);
        }
    };

    const loadBestsellers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/bestsellers/list?limit=5`);
            setBestsellers(response.data.data || []);
        } catch (err) {
            console.error('Lỗi tải bestsellers:', err);
        }
    };

    const loadPages = async (pageNum = 1) => {
        try {
            setLoading(pageNum === 1);
            const params = new URLSearchParams({
                page: pageNum,
                limit: 12,
                sort: sortBy
            });

            if (selectedCategory !== 'all') {
                params.append('category', selectedCategory);
            }

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            if (priceRange.min) {
                params.append('price_min', priceRange.min);
            }

            if (priceRange.max) {
                params.append('price_max', priceRange.max);
            }

            const response = await axios.get(`${API_BASE_URL}/api/marketplace?${params}`);

            const newPages = response.data.data || [];
            setPages(prev => pageNum === 1 ? newPages : [...prev, ...newPages]);
            setHasMore(newPages.length === 12);
            setError('');
        } catch (err) {
            console.error('Lỗi tải marketplace pages:', err);
            setError('Không thể tải marketplace: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadPages(nextPage);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPages([]);
        setPage(1);
        setHasMore(true);
        loadPages(1);
    };

    const handleViewDetail = (pageId) => {
        navigate(`/marketplace/${pageId}`);
    };

    const formatPrice = (price) => {
        if (price === 0) return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const calculateDiscount = (price, originalPrice) => {
        if (!originalPrice || originalPrice <= price) return 0;
        return Math.round(((originalPrice - price) / originalPrice) * 100);
    };

    const isPurchased = (pageId) => purchasedPageIds.includes(pageId);
    const isMyPage = (pageId) => myPageIds.includes(pageId);

    const getFilteredPages = () => {
        if (viewFilter === 'all') return pages;
        if (viewFilter === 'purchased') return pages.filter(p => isPurchased(p._id));
        if (viewFilter === 'my-pages') return pages.filter(p => isMyPage(p._id));
        return pages;
    };

    const filteredPages = getFilteredPages();

    if (loading && page === 1) {
        return <DogLoader />;
    }

    return (
        <div className="marketplace-container">
            <Sidebar userRole={userRole} />
            <div className="marketplace-main">
                <Header />
                <div className="marketplace-content">
                    {/* Hero Section */}
                    <div className="marketplace-hero" data-aos="fade-down">
                        <h1>Marketplace Landing Page</h1>
                        <p>Khám phá và mua các landing page chất lượng cao từ cộng đồng</p>
                    </div>

                    {/* View Filter Tabs */}
                    <div className="view-filter-tabs" data-aos="fade-up" style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px',
                        padding: '0 10px'
                    }}>
                        <button
                            onClick={() => setViewFilter('all')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                background: viewFilter === 'all' ? '#6366f1' : '#e5e7eb',
                                color: viewFilter === 'all' ? 'white' : '#374151',
                                fontWeight: viewFilter === 'all' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tất cả ({pages.length})
                        </button>
                        <button
                            onClick={() => setViewFilter('purchased')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                background: viewFilter === 'purchased' ? '#10b981' : '#e5e7eb',
                                color: viewFilter === 'purchased' ? 'white' : '#374151',
                                fontWeight: viewFilter === 'purchased' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            ✅ Đã mua ({purchasedPageIds.length})
                        </button>
                        <button
                            onClick={() => setViewFilter('my-pages')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                background: viewFilter === 'my-pages' ? '#f59e0b' : '#e5e7eb',
                                color: viewFilter === 'my-pages' ? 'white' : '#374151',
                                fontWeight: viewFilter === 'my-pages' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            👤 Page của tôi ({myPageIds.length})
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="marketplace-filters" data-aos="fade-up">
                        <form onSubmit={handleSearch} className="search-bar">
                            <input
                                type="text"
                                placeholder="Tìm kiếm landing page..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit">
                                <Search size={16} /> Tìm kiếm
                            </button>
                        </form>

                        <div className="filter-row">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <div className="price-range">
                                <input
                                    type="number"
                                    placeholder="Giá tối thiểu"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Giá tối đa"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                />
                                <button onClick={handleSearch}>Áp dụng</button>
                            </div>
                        </div>
                    </div>

                    {/* Featured Pages */}
                    {featuredPages.length > 0 && (
                        <div className="featured-section" data-aos="fade-up">
                            <h2>Nổi bật</h2>
                            <div className="featured-grid">
                                {featuredPages.map((page) => (
                                    <div key={page._id} className="featured-card" onClick={() => handleViewDetail(page._id)}>
                                        <div className="featured-image">
                                            <img src={page.main_screenshot || '/placeholder.png'} alt={page.title} />
                                            {calculateDiscount(page.price, page.original_price) > 0 && (
                                                <div className="discount-badge">
                                                    -{calculateDiscount(page.price, page.original_price)}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="featured-info">
                                            <h3>{page.title}</h3>
                                            <div className="featured-price">
                                                <span className="current-price">{formatPrice(page.price)}</span>
                                                {page.original_price && (
                                                    <span className="original-price">{formatPrice(page.original_price)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-message" data-aos="fade-in">
                            {error}
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="marketplace-grid-section" data-aos="fade-up">
                        <h2>
                            {viewFilter === 'all' && 'Tất cả Landing Page'}
                            {viewFilter === 'purchased' && '✅ Đã mua'}
                            {viewFilter === 'my-pages' && '👤 Page của tôi'}
                        </h2>
                        <InfiniteScroll
                            dataLength={pages.length}
                            next={loadMore}
                            hasMore={hasMore}
                            loader={<div className="loader">Đang tải...</div>}
                            endMessage={
                                pages.length > 0 && (
                                    <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                                        Đã hiển thị tất cả landing page
                                    </p>
                                )
                            }
                        >
                            <div className="marketplace-grid">
                                {filteredPages.map((page) => (
                                    <div key={page._id} className="marketplace-card" data-aos="zoom-in">
                                        <div className="card-image" onClick={() => handleViewDetail(page._id)}>
                                            <img src={page.main_screenshot || '/placeholder.png'} alt={page.title} />
                                            {isMyPage(page._id) && (
                                                <div className="my-page-badge" style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    left: '10px',
                                                    background: '#f59e0b',
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    zIndex: 2
                                                }}>
                                                    👤 Page của bạn
                                                </div>
                                            )}
                                            {isPurchased(page._id) && !isMyPage(page._id) && (
                                                <div className="purchased-badge" style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    left: '10px',
                                                    background: '#10b981',
                                                    color: 'white',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    zIndex: 2
                                                }}>
                                                    ✅ Đã mua
                                                </div>
                                            )}
                                            {page.is_bestseller && (
                                                <div className="bestseller-badge">Bán chạy</div>
                                            )}
                                            {calculateDiscount(page.price, page.original_price) > 0 && (
                                                <div className="discount-badge">
                                                    -{calculateDiscount(page.price, page.original_price)}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-content">
                                            <div className="card-category">{page.category}</div>
                                            <h3 className="card-title">{page.title}</h3>
                                            <p className="card-description">
                                                {page.description.substring(0, 100)}
                                                {page.description.length > 100 ? '...' : ''}
                                            </p>
                                            <div className="card-meta">
                                                <span><Eye size={16} /> {page.views}</span>
                                                <span><Heart size={16} /> {page.likes}</span>
                                                <span><Star size={16} /> {page.rating.toFixed(1)}</span>
                                                <span><ShoppingCart size={16} /> {page.sold_count}</span>
                                            </div>
                                            <div className="card-footer">
                                                <div className="card-price">
                                                    <span className="current-price">{formatPrice(page.price)}</span>
                                                    {page.original_price && (
                                                        <span className="original-price">{formatPrice(page.original_price)}</span>
                                                    )}
                                                </div>
                                                <button
                                                    className="view-detail-btn"
                                                    onClick={() => handleViewDetail(page._id)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfiniteScroll>

                        {filteredPages.length === 0 && !loading && (
                            <div className="empty-state">
                                <p>
                                    {viewFilter === 'all' && 'Không tồn tại landing page nào'}
                                    {viewFilter === 'purchased' && 'Bạn chưa mua page nào'}
                                    {viewFilter === 'my-pages' && 'Bạn chưa đăng bán page nào'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;