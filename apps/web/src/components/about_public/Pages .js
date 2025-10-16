import React from "react";
import { Link } from "react-router-dom";
import Background from "../../components/Background";
import {
    Zap,
    Target,
    TrendingUp,
    Users,
    Layout,
    Smartphone,
    BarChart3,
    CheckCircle2
} from "lucide-react";
import "../../styles/page.Info.css";

const Pages = () => {
    return (
        <Background showShapes={true} fullWidth={true}>
            <div className="pages-container">

                {/* Hero Section */}
                <section className="pages-hero">
                    <h1>Landing Page là gì?</h1>
                    <p className="hero-subtitle">
                        Tìm hiểu về công cụ marketing mạnh mẽ giúp bạn tăng tỷ lệ chuyển đổi
                        và thu hút khách hàng tiềm năng hiệu quả
                    </p>
                </section>

                {/* Definition Section */}
                <section className="definition-section">
                    <div className="definition-card">
                        <div className="definition-icon">
                            <Layout size={48} />
                        </div>
                        <h2>Landing Page - Trang Đích</h2>
                        <p>
                            Landing Page (Trang đích) là một trang web độc lập được thiết kế với
                            <strong> mục đích duy nhất</strong>: chuyển đổi khách truy cập thành khách hàng
                            tiềm năng hoặc khách hàng thực sự.
                        </p>
                        <p>
                            Khác với website thông thường có nhiều trang và nhiều mục đích, Landing Page
                            tập trung vào <strong>một hành động cụ thể</strong> như: đăng ký email, tải tài liệu,
                            đặt hẹn, mua hàng...
                        </p>
                    </div>
                </section>

                {/* Why Use Landing Page */}
                <section className="why-section">
                    <h2 className="section-title">Tại sao cần Landing Page?</h2>
                    <div className="benefits-grid">
                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <Target />
                            </div>
                            <h3>Tập trung cao</h3>
                            <p>Loại bỏ mọi yếu tố gây xao lãng, hướng khách hàng đến một hành động duy nhất</p>
                        </div>

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <TrendingUp />
                            </div>
                            <h3>Tăng tỷ lệ chuyển đổi</h3>
                            <p>Thiết kế tối ưu giúp tỷ lệ chuyển đổi cao hơn 5-10 lần so với trang web thông thường</p>
                        </div>

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <BarChart3 />
                            </div>
                            <h3>Dễ đo lường</h3>
                            <p>Theo dõi hiệu quả chiến dịch marketing một cách chính xác và rõ ràng</p>
                        </div>

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <Users />
                            </div>
                            <h3>Thu thập leads</h3>
                            <p>Công cụ hiệu quả để xây dựng danh sách khách hàng tiềm năng chất lượng</p>
                        </div>

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <Zap />
                            </div>
                            <h3>Triển khai nhanh</h3>
                            <p>Có thể tạo và phát hành trong vài giờ, không cần website phức tạp</p>
                        </div>

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <Smartphone />
                            </div>
                            <h3>Tối ưu mobile</h3>
                            <p>Responsive hoàn hảo trên mọi thiết bị, tiếp cận khách hàng mọi lúc mọi nơi</p>
                        </div>
                    </div>
                </section>

                {/* Elements of Landing Page */}
                <section className="elements-section">
                    <h2 className="section-title">8 Yếu tố quan trọng của Landing Page</h2>
                    <div className="elements-list">
                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Tiêu đề hấp dẫn (Headline)</h4>
                                <p>Câu tiêu đề ngắn gọn, súc tích, thu hút ngay từ giây đầu tiên</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Nội dung giá trị (Value Proposition)</h4>
                                <p>Trình bày rõ ràng lợi ích mà khách hàng sẽ nhận được</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Hình ảnh/Video chất lượng</h4>
                                <p>Visual hấp dẫn giúp truyền tải thông điệp hiệu quả hơn</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Call-to-Action (CTA) rõ ràng</h4>
                                <p>Nút hành động nổi bật, văn bản thúc đẩy hành động cụ thể</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Form đơn giản</h4>
                                <p>Chỉ yêu cầu thông tin cần thiết, tránh làm khách hàng bỏ cuộc</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Social Proof</h4>
                                <p>Đánh giá, testimonials, số liệu thống kê tạo lòng tin</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Tính năng nổi bật</h4>
                                <p>Liệt kê các tính năng, lợi ích chính một cách dễ hiểu</p>
                            </div>
                        </div>

                        <div className="element-item">
                            <CheckCircle2 className="check-icon" />
                            <div className="element-content">
                                <h4>Trust Signals</h4>
                                <p>Logo đối tác, chứng nhận, bảo mật thông tin</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Types of Landing Pages */}
                <section className="types-section">
                    <h2 className="section-title">Các loại Landing Page phổ biến</h2>
                    <div className="types-grid">
                        <div className="type-card">
                            <span className="type-number">01</span>
                            <h3>Lead Generation</h3>
                            <p>Thu thập thông tin khách hàng tiềm năng thông qua form đăng ký</p>
                        </div>

                        <div className="type-card">
                            <span className="type-number">02</span>
                            <h3>Click-Through</h3>
                            <p>Giới thiệu sản phẩm/dịch vụ và dẫn khách hàng đến trang mua hàng</p>
                        </div>

                        <div className="type-card">
                            <span className="type-number">03</span>
                            <h3>Sales Page</h3>
                            <p>Trang bán hàng trực tiếp với CTA mua hàng ngay lập tức</p>
                        </div>

                        <div className="type-card">
                            <span className="type-number">04</span>
                            <h3>Splash Page</h3>
                            <p>Trang giới thiệu ngắn gọn trước khi vào website chính</p>
                        </div>

                        <div className="type-card">
                            <span className="type-number">05</span>
                            <h3>Event Registration</h3>
                            <p>Đăng ký sự kiện, webinar, hội thảo online</p>
                        </div>

                        <div className="type-card">
                            <span className="type-number">06</span>
                            <h3>Download Page</h3>
                            <p>Tải tài liệu, ebook, whitepaper miễn phí</p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="pages-cta">
                    <h2>Sẵn sàng tạo Landing Page đầu tiên?</h2>
                    <p>
                        Với LandingHub, bạn có thể tạo Landing Page chuyên nghiệp chỉ trong vài phút
                    </p>
                    <Link to="/customerForm" className="cta-button">
                        Bắt đầu ngay miễn phí
                    </Link>
                </section>

            </div>
        </Background>
    );
};

export default Pages;