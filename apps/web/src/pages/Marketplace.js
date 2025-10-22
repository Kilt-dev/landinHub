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
        { value: 'Khác', label: 'Khác' },
    ];

    const sortOptions = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'oldest', label: 'Cũ nhất' },
        { value: 'price_low', label: 'Giá thấp đến cao' },
        { value: 'price_high', label: 'Giá cao đến thấp' },
        { value: 'popular', label: 'Phổ biến nhất' },
        { value: 'bestseller', label: 'Bán chạy nhất' },
        { value: 'rating', label: 'Đánh giá cao nhất' },
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
                sort: sortBy,
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
            setPages((prev) => (pageNum === 1 ? newPages : [...prev, ...newPages]));
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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const calculateDiscount = (price, originalPrice) => {
        if (!originalPrice || originalPrice <= price) return 0;
        return Math.round(((originalPrice - price) / originalPrice) * 100);
    };

    // Hàm kiểm tra nếu sản phẩm là mới (dựa trên created_at, ví dụ trong 7 ngày)
    const isNewProduct = (createdAt) => {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    if (loading && page === 1) {
        return <DogLoader />;
    }

    return (
        <div className="marketplace-container">
            <div className="marketplace-main">
                <Header />
                <div className="marketplace-content">
                    <Sidebar userRole={userRole} />
                    <div className="marketplace-noidung">
                        {/* Hero Section */}
                        <div className="marketplace-hero" data-aos="fade-down">
                            <div className="hero-image">
                                <img
                                    src="https://res.cloudinary.com/dubthm5m6/image/upload/v1761104441/Pink_Pixel_Gaming_Channel_Banner_phcntk.jpg" // Thêm ảnh nền cho hero
                                    alt="Marketplace Banner"
                                    className="hero-img"
                                    loading="lazy"
                                />
                                <div className="hero-overlay">
                                    <h1>Chợ Landing Page</h1>
                                    <p>Khám phá và mua các landing page chất lượng cao từ cộng đồng</p>
                                </div>
                            </div>
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
                                    {categories.map((cat) => (
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
                                    {sortOptions.map((opt) => (
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
                                <h2>Sản phẩm nổi bật</h2>
                                <div className="featured-grid">
                                    {featuredPages.map((page) => (
                                        <div key={page._id} className="featured-card" onClick={() => handleViewDetail(page._id)}>
                                            <div className="featured-image">
                                                <img
                                                    src={page.main_screenshot || '/placeholder.png'}
                                                    alt={page.title}
                                                    className="card-img"
                                                    loading="lazy"
                                                />
                                                {calculateDiscount(page.price, page.original_price) > 0 && (
                                                    <div className="discount-badge">
                                                        -{calculateDiscount(page.price, page.original_price)}%
                                                    </div>
                                                )}
                                                {isNewProduct(page.created_at) && (
                                                    <div className="new-badge">Mới</div>
                                                )}
                                                <div className="image-overlay">
                                                    <button className="quick-view-btn">
                                                        <Eye size={16} /> Xem nhanh
                                                    </button>
                                                </div>
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
                            <h2>Tất cả Landing Page</h2>
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
                                    {pages.map((page) => (
                                        <div key={page._id} className="marketplace-card" data-aos="zoom-in">
                                            <div className="card-image">
                                                <img
                                                    src={page.main_screenshot || '/placeholder.png'}
                                                    alt={page.title}
                                                    className="card-img"
                                                    loading="lazy"
                                                />
                                                {page.is_bestseller && (
                                                    <div className="bestseller-badge">Bán chạy</div>
                                                )}
                                                {calculateDiscount(page.price, page.original_price) > 0 && (
                                                    <div className="discount-badge">
                                                        -{calculateDiscount(page.price, page.original_price)}%
                                                    </div>
                                                )}
                                                {isNewProduct(page.created_at) && (
                                                    <div className="new-badge">Mới</div>
                                                )}
                                                <div className="image-overlay">

                                                </div>
                                            </div>
                                            <div className="card-content">
                                                <div className="card-category">{page.category}</div>
                                                <h3 className="card-title">{page.title}</h3>
                                                <p className="card-description">
                                                    {page.description.substring(0, 80)}...
                                                </p>
                                                <div className="card-meta">
                          <span>
                            <Eye size={16} /> {page.views}
                          </span>
                                                    <span>
                            <Heart size={16} /> {page.likes}
                          </span>
                                                    <span>
                            <Star size={16} /> {page.rating.toFixed(1)}
                          </span>
                                                    <span>
                            <ShoppingCart size={16} /> {page.sold_count}
                          </span>
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
                            {pages.length === 0 && !loading && (
                                <div className="empty-state">
                                    <p>Không tồn tại landing page nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Marketplace;