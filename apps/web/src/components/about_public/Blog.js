import React, { useState } from "react";
import { Link } from "react-router-dom";
import Background from "../../components/Background";
import { Search, Filter, Star, Eye, Download } from "lucide-react";
import "../../styles/Blog.css";

const Blog = () => {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Dữ liệu mẫu cho templates
    const templates = [
        {
            id: 1,
            title: "Modern Business",
            category: "business",
            image: "🏢",
            views: "2.5k",
            downloads: "450",
            rating: 4.8,
            description: "Template chuyên nghiệp cho doanh nghiệp hiện đại"
        },
        {
            id: 2,
            title: "Creative Portfolio",
            category: "portfolio",
            image: "🎨",
            views: "3.2k",
            downloads: "680",
            rating: 4.9,
            description: "Giao diện sáng tạo cho portfolio cá nhân"
        },
        {
            id: 3,
            title: "Real Estate Pro",
            category: "realestate",
            image: "🏠",
            views: "4.1k",
            downloads: "920",
            rating: 5.0,
            description: "Template chuyên dụng cho bất động sản"
        },
        {
            id: 4,
            title: "E-commerce Plus",
            category: "ecommerce",
            image: "🛍️",
            views: "5.3k",
            downloads: "1.2k",
            rating: 4.7,
            description: "Giao diện bán hàng trực tuyến đẹp mắt"
        },
        {
            id: 5,
            title: "Event Landing",
            category: "event",
            image: "🎉",
            views: "1.8k",
            downloads: "340",
            rating: 4.6,
            description: "Template cho sự kiện và hội thảo"
        },
        {
            id: 6,
            title: "SaaS Startup",
            category: "saas",
            image: "💻",
            views: "3.9k",
            downloads: "750",
            rating: 4.8,
            description: "Landing page cho sản phẩm SaaS"
        },
        {
            id: 7,
            title: "Minimal Agency",
            category: "agency",
            image: "✨",
            views: "2.7k",
            downloads: "520",
            rating: 4.9,
            description: "Thiết kế tối giản cho agency"
        },
        {
            id: 8,
            title: "Restaurant Menu",
            category: "food",
            image: "🍽️",
            views: "2.1k",
            downloads: "410",
            rating: 4.5,
            description: "Template cho nhà hàng và quán ăn"
        },
        {
            id: 9,
            title: "Fitness Gym",
            category: "health",
            image: "💪",
            views: "1.5k",
            downloads: "280",
            rating: 4.7,
            description: "Landing page cho phòng gym, fitness"
        }
    ];

    const categories = [
        { id: "all", name: "Tất cả", icon: "🌟" },
        { id: "business", name: "Doanh nghiệp", icon: "🏢" },
        { id: "realestate", name: "BĐS", icon: "🏠" },
        { id: "portfolio", name: "Portfolio", icon: "🎨" },
        { id: "ecommerce", name: "E-commerce", icon: "🛍️" },
        { id: "event", name: "Sự kiện", icon: "🎉" },
        { id: "saas", name: "SaaS", icon: "💻" },
        { id: "agency", name: "Agency", icon: "✨" },
        { id: "food", name: "Nhà hàng", icon: "🍽️" },
        { id: "health", name: "Sức khỏe", icon: "💪" }
    ];

    const filteredTemplates = templates.filter(template => {
        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
        const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <Background showShapes={true} fullWidth={true}>
            <div className="blog-container">

                {/* Hero Section */}
                <section className="blog-hero">
                    <h1>Kho Giao Diện Landing Page</h1>
                    <p className="hero-subtitle">
                        Hơn 100+ mẫu giao diện đẹp, chuyên nghiệp và dễ tùy biến.<br/>
                        Tìm template phù hợp cho dự án của bạn ngay hôm nay!
                    </p>

                    {/* Search Bar */}
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm template..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </section>

                {/* Categories Filter */}
                <section className="categories-section">
                    <div className="categories-scroll">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                <span className="cat-icon">{cat.icon}</span>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Templates Grid */}
                <section className="templates-section">
                    <div className="section-header">
                        <h2>
                            {selectedCategory === "all"
                                ? "Tất cả Templates"
                                : categories.find(c => c.id === selectedCategory)?.name}
                        </h2>
                        <div className="results-count">
                            {filteredTemplates.length} kết quả
                        </div>
                    </div>

                    <div className="templates-grid">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="template-card">
                                <div className="template-preview">
                                    <div className="template-emoji">{template.image}</div>
                                    <div className="template-overlay">
                                        <Link to="/customerForm" className="preview-btn">
                                            Xem Demo
                                        </Link>
                                    </div>
                                </div>

                                <div className="template-info">
                                    <h3>{template.title}</h3>
                                    <p>{template.description}</p>

                                    <div className="template-stats">
                                        <div className="stat">
                                            <Eye size={16} />
                                            <span>{template.views}</span>
                                        </div>
                                        <div className="stat">
                                            <Download size={16} />
                                            <span>{template.downloads}</span>
                                        </div>
                                        <div className="stat rating">
                                            <Star size={16} fill="#fbbf24" />
                                            <span>{template.rating}</span>
                                        </div>
                                    </div>

                                    <Link to="/customerForm" className="use-template-btn">
                                        Sử dụng Template
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="no-results">
                            <p>Không tìm thấy template phù hợp</p>
                            <button onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}>
                                Xem tất cả
                            </button>
                        </div>
                    )}
                </section>

                {/* Features Section */}
                <section className="features-highlight">
                    <h2>Tại sao chọn Templates của chúng tôi?</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <h4>Cài đặt nhanh chóng</h4>
                            <p>Chỉ cần 1 click để bắt đầu với template</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎨</div>
                            <h4>Dễ tùy chỉnh</h4>
                            <p>Thay đổi màu sắc, font chữ và nội dung dễ dàng</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📱</div>
                            <h4>Responsive 100%</h4>
                            <p>Hiển thị hoàn hảo trên mọi thiết bị</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🚀</div>
                            <h4>Tối ưu SEO</h4>
                            <p>Code sạch, tốc độ tải nhanh</p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="blog-cta">
                    <h2>Không tìm thấy template phù hợp?</h2>
                    <p>Liên hệ với chúng tôi để được tư vấn và thiết kế riêng</p>
                    <Link to="/public/lien-he" className="cta-button">
                        Liên hệ ngay
                    </Link>
                </section>

            </div>
        </Background>
    );
};

export default Blog;