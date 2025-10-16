import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Templates.css';
import DogLoader from '../components/Loader';

const Templates = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [designType, setDesignType] = useState('Tất cả');
    const [sortBy, setSortBy] = useState('usage_count');
    const [usingTemplateId, setUsingTemplateId] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const location = useLocation();
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const categories = ['Tất cả', 'Bất động sản', 'Thương mại điện tử', 'Nhà hàng', 'Sức khỏe', 'Giáo dục', 'Khác'];
    const designTypes = ['Tất cả', '1 Page', 'Long Form', 'Mobile First', 'E-commerce', 'Lead Gen'];
    const sortOptions = [
        { value: 'usage_count', label: 'Phổ biến nhất' },
        { value: 'created_at', label: 'Mới nhất' },
        { value: 'price_asc', label: 'Giá thấp đến cao' },
        { value: 'price_desc', label: 'Giá cao đến thấp' }
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
        if (userRole && userRole === 'user') {
            setTemplates([]);
            setPage(1);
            setHasMore(true);
            loadTemplates(1);
        }
    }, [userRole, selectedCategory, searchQuery, designType, sortBy]);

    const loadTemplates = async (pageNum = 1) => {
        try {
            setLoading(pageNum === 1);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                page: pageNum,
                limit: 12,
                category: selectedCategory !== 'Tất cả' ? selectedCategory : '',
                q: searchQuery,
                design_type: designType !== 'Tất cả' ? designType : '',
                sort: sortBy
            });

            const response = await axios.get(`${API_BASE_URL}/api/templates?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newTemplates = response.data.templates || [];
            setTemplates(prev => pageNum === 1 ? newTemplates : [...prev, ...newTemplates]);
            setHasMore(newTemplates.length === 12);
            setError('');
        } catch (err) {
            setError('Không thể tải templates');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadTemplates(nextPage);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setTemplates([]);
        setPage(1);
        setHasMore(true);
        loadTemplates(1);
    };

    const handlePreview = async (templateId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/templates/${templateId}/preview`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPreviewTemplate(response.data);
            setShowPreview(true);
        } catch (err) {
            alert('Không thể xem trước template');
        }
    };

    const handleUseTemplate = async (templateId, templateName) => {
        if (usingTemplateId) return;
        const confirmed = window.confirm(`Tạo landing page từ "${templateName}"?`);
        if (!confirmed) return;

        try {
            setUsingTemplateId(templateId);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/templates/${templateId}/use`,
                {
                    name: `${templateName} - Copy`,
                    description: `Từ template ${templateName}`
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                alert('✅ Tạo thành công!');
                navigate(`/pages?id=${response.data.page.id}`);
            }
        } catch (err) {
            alert(`❌ ${err.response?.data?.error || 'Lỗi sử dụng template'}`);
        } finally {
            setUsingTemplateId(null);
        }
    };

    const getSafeImageUrl = (url) => {
        if (!url || url.startsWith('s3://')) {
            return 'https://via.placeholder.com/400x240/667eea/ffffff?text=T';
        }
        return url;
    };

    const getUniqueKey = (template, index) => `${template.id}-${index}-${page}`;

    const getPlaceholderImage = (templateName, category) => {
        const colors = {
            'Bất động sản': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Thương mại điện tử': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'Nhà hàng': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'Sức khỏe': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'Giáo dục': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'Khác': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
        };
        return {
            background: colors[category] || colors['Khác'],
            text: templateName.charAt(0).toUpperCase()
        };
    };

    if (loading) return <DogLoader />;

    const isCompact = location.pathname === '/dashboard';

    return (
        <div className="templates-page">
            <Header role={userRole} />
            <div className="templates-main">
                <Sidebar role={userRole} isCompact={isCompact} />
                <div className="templates-content">
                    {/* BANNER QUẢNG CÁO */}
                    <div className="banner-section">
                        <img
                            src="https://res.cloudinary.com/dubthm5m6/image/upload/v1760618991/Black_and_white_Geometric_Gamming_Channel_Youtube_Banner_nanfgp.jpg"
                            alt="Template Marketplace Banner"
                            className="banner-image"
                        />
                        <div className="banner-overlay">
                            <h2>Khám Phá Marketplace Templates</h2>
                            <p>200+ Mẫu Thiết Kế Chuyên Nghiệp - Nhận Ưu Đãi 20% Hôm Nay!</p>
                            <button className="banner-cta" onClick={() => navigate('/premium')}>
                                Mua Ngay
                            </button>
                        </div>
                    </div>

                    {/* SEARCH + FILTERS */}
                    <div className="controls-section">
                        <form className="search-form" onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm template..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-btn">
                                <i className="fas fa-search"></i>
                            </button>
                        </form>

                        <div className="sub-filters">
                            <select
                                value={designType}
                                onChange={e => setDesignType(e.target.value)}
                                className="filter-select"
                            >
                                {designTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="filter-select"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* TABS DANH MỤC */}
                    <div className="category-tabs">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`tab-btn ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="error-alert">
                            <i className="fas fa-exclamation-triangle"></i>
                            {error}
                        </div>
                    )}

                    <InfiniteScroll
                        dataLength={templates.length}
                        next={loadMore}
                        hasMore={hasMore}
                        loader={<DogLoader small />}
                        endMessage={
                            <div className="end-message">
                                <i className="fas fa-check-circle"></i>
                                <p>Đã tải hết templates!</p>
                            </div>
                        }
                        className="templates-grid"
                    >
                        {templates.map((template, index) => {
                            const placeholder = getPlaceholderImage(template.name, template.category);
                            const safeImage = getSafeImageUrl(template.thumbnail_url);
                            return (
                                <div key={getUniqueKey(template, index)} className="template-card" data-aos="fade-up">
                                    <div className="card-media">
                                        <img
                                            src={safeImage}
                                            alt={template.name}
                                            className="template-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div
                                            className="image-placeholder"
                                            style={{ background: placeholder.background }}
                                        >
                                            <span>{placeholder.text}</span>
                                        </div>

                                        <div className="card-overlay">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handlePreview(template.id)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleUseTemplate(template.id, template.name)}
                                                disabled={usingTemplateId === template.id}
                                            >
                                                {usingTemplateId === template.id ? (
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                ) : (
                                                    <i className="fas fa-rocket"></i>
                                                )}
                                            </button>
                                        </div>

                                        {template.is_featured && <div className="badge featured">⭐ Nổi bật</div>}
                                        {template.price > 0 && (
                                            <div className="badge premium">{template.formatted_price}</div>
                                        )}
                                        {template.price === 0 && <div className="badge free">Free</div>}
                                    </div>

                                    <div className="card-content">
                                        <h3 className="card-title">{template.name}</h3>
                                        <div className="card-meta">
                                            <span className="category">{template.category}</span>
                                            <span className="usage">
                        <i className="fas fa-users"></i> {template.usage_count}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </InfiniteScroll>

                    {showPreview && previewTemplate && (
                        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                            <div className="modal-content" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>{previewTemplate.template?.name}</h2>
                                    <button className="modal-close" onClick={() => setShowPreview(false)}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <iframe
                                    srcDoc={previewTemplate.html}
                                    title="Preview"
                                    className="modal-iframe"
                                />
                                <div className="modal-footer">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowPreview(false);
                                            handleUseTemplate(previewTemplate.template.id, previewTemplate.template.name);
                                        }}
                                    >
                                        <i className="fas fa-rocket"></i> Sử dụng
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(Templates);