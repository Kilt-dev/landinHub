import {
    Clock, PlayCircle, ChevronDown, BarChart2,
    Star, Calendar, Zap, TrendingUp, Box, Layers
} from 'lucide-react';

/**
 * Advanced Elements Library
 * Modern components for professional landing pages
 */
export const advancedElements = {
    name: 'Thành phần nâng cao',
    subCategories: [
        {
            id: 'countdown',
            name: 'Đếm ngược',
            lucideIcon: Clock,
            templates: [
                {
                    id: 'countdown-modern',
                    name: 'Countdown Modern',
                    lucideIcon: Clock,
                    description: 'Bộ đếm ngược hiện đại với flip animation',
                    previewImage: 'https://via.placeholder.com/400x200?text=Countdown',
                    json: {
                        type: 'countdown',
                        componentData: {
                            title: 'Countdown Timer',
                            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            labels: {
                                days: 'Ngày',
                                hours: 'Giờ',
                                minutes: 'Phút',
                                seconds: 'Giây'
                            },
                            onComplete: { type: 'openPopup', popupId: 'end-popup' },
                            dataSource: { type: 'static' },
                            animation: { type: 'fadeIn', duration: 800, delay: 0 }
                        },
                        size: { width: 600, height: 150 },
                        mobileSize: { width: 340, height: 120 },
                        tabletSize: { width: 500, height: 135 },
                        styles: {
                            display: 'flex',
                            gap: '20px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontFamily: 'Poppins, sans-serif',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '16px',
                            padding: '30px',
                            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                        },
                        responsiveStyles: {
                            mobile: {
                                gap: '10px',
                                padding: '20px',
                                fontSize: '0.9rem'
                            },
                            tablet: {
                                gap: '15px',
                                padding: '25px'
                            }
                        }
                    },
                },
                {
                    id: 'countdown-minimal',
                    name: 'Countdown Minimal',
                    lucideIcon: Clock,
                    description: 'Bộ đếm ngược tối giản, thanh lịch',
                    previewImage: 'https://via.placeholder.com/400x150?text=Countdown+Minimal',
                    json: {
                        type: 'countdown',
                        componentData: {
                            title: 'Còn lại',
                            targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                            labels: {
                                days: 'd',
                                hours: 'h',
                                minutes: 'm',
                                seconds: 's'
                            },
                            style: 'minimal',
                            dataSource: { type: 'static' },
                        },
                        size: { width: 400, height: 80 },
                        mobileSize: { width: 320, height: 60 },
                        styles: {
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#1f2937',
                        },
                    },
                },
            ]
        },
        {
            id: 'carousel',
            name: 'Carousel/Slider',
            lucideIcon: PlayCircle,
            templates: [
                {
                    id: 'carousel-testimonial',
                    name: 'Testimonial Carousel',
                    lucideIcon: PlayCircle,
                    description: 'Carousel hiển thị đánh giá khách hàng',
                    previewImage: 'https://via.placeholder.com/600x300?text=Testimonial+Carousel',
                    json: {
                        type: 'carousel',
                        componentData: {
                            title: 'Khách hàng nói gì',
                            slides: [
                                {
                                    content: 'Sản phẩm tuyệt vời! Đã thay đổi cách làm việc của tôi.',
                                    author: 'Nguyễn Văn A',
                                    avatar: 'https://i.pravatar.cc/150?img=1',
                                    rating: 5
                                },
                                {
                                    content: 'Dịch vụ khách hàng xuất sắc, hỗ trợ 24/7.',
                                    author: 'Trần Thị B',
                                    avatar: 'https://i.pravatar.cc/150?img=2',
                                    rating: 5
                                },
                                {
                                    content: 'Giá cả hợp lý, chất lượng vượt mong đợi.',
                                    author: 'Lê Văn C',
                                    avatar: 'https://i.pravatar.cc/150?img=3',
                                    rating: 4
                                },
                            ],
                            autoplay: true,
                            interval: 5000,
                            showDots: true,
                            showArrows: true,
                            dataSource: { type: 'static' },
                            animation: { type: 'slideInRight', duration: 800 }
                        },
                        size: { width: 700, height: 400 },
                        mobileSize: { width: 340, height: 450 },
                        tabletSize: { width: 600, height: 420 },
                        styles: {
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '40px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        },
                    },
                },
                {
                    id: 'carousel-product',
                    name: 'Product Carousel',
                    lucideIcon: Box,
                    description: 'Carousel hiển thị sản phẩm nổi bật',
                    previewImage: 'https://via.placeholder.com/600x350?text=Product+Carousel',
                    json: {
                        type: 'carousel',
                        componentData: {
                            title: 'Sản phẩm nổi bật',
                            slides: [
                                {
                                    image: 'https://via.placeholder.com/400x300?text=Product+1',
                                    title: 'Sản phẩm A',
                                    price: '299.000đ',
                                    description: 'Mô tả ngắn gọn về sản phẩm'
                                },
                                {
                                    image: 'https://via.placeholder.com/400x300?text=Product+2',
                                    title: 'Sản phẩm B',
                                    price: '399.000đ',
                                    description: 'Mô tả ngắn gọn về sản phẩm'
                                },
                            ],
                            autoplay: false,
                            showDots: true,
                            dataSource: { type: 'static' },
                        },
                        size: { width: 600, height: 450 },
                        mobileSize: { width: 340, height: 400 },
                        styles: {
                            borderRadius: '16px',
                            overflow: 'hidden',
                        },
                    },
                },
            ]
        },
        {
            id: 'accordion',
            name: 'Accordion/FAQ',
            lucideIcon: ChevronDown,
            templates: [
                {
                    id: 'accordion-faq',
                    name: 'FAQ Accordion',
                    lucideIcon: ChevronDown,
                    description: 'Accordion cho câu hỏi thường gặp',
                    previewImage: 'https://via.placeholder.com/500x400?text=FAQ+Accordion',
                    json: {
                        type: 'accordion',
                        componentData: {
                            title: 'Câu hỏi thường gặp',
                            items: [
                                {
                                    question: 'Làm thế nào để đăng ký tài khoản?',
                                    answer: 'Click vào nút Đăng ký ở góc trên bên phải, điền thông tin và xác nhận email.'
                                },
                                {
                                    question: 'Thời gian giao hàng là bao lâu?',
                                    answer: 'Đơn hàng sẽ được giao trong vòng 2-3 ngày làm việc tại TP.HCM và Hà Nội.'
                                },
                                {
                                    question: 'Có chính sách hoàn trả không?',
                                    answer: 'Có, chúng tôi hỗ trợ hoàn trả trong vòng 7 ngày nếu sản phẩm lỗi.'
                                },
                                {
                                    question: 'Thanh toán như thế nào?',
                                    answer: 'Hỗ trợ thanh toán COD, chuyển khoản, thẻ tín dụng và ví điện tử.'
                                },
                            ],
                            allowMultiple: false,
                            defaultOpen: [0],
                            dataSource: { type: 'static' },
                            animation: { type: 'fadeIn', duration: 600 }
                        },
                        size: { width: 600, height: 400 },
                        mobileSize: { width: 340, height: 450 },
                        tabletSize: { width: 520, height: 420 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                        },
                    },
                },
            ]
        },
        {
            id: 'tabs',
            name: 'Tabs',
            lucideIcon: Layers,
            templates: [
                {
                    id: 'tabs-pricing',
                    name: 'Pricing Tabs',
                    lucideIcon: Layers,
                    description: 'Tabs hiển thị bảng giá',
                    previewImage: 'https://via.placeholder.com/600x400?text=Pricing+Tabs',
                    json: {
                        type: 'tabs',
                        componentData: {
                            title: 'Chọn gói phù hợp',
                            tabs: [
                                {
                                    label: 'Cơ bản',
                                    content: {
                                        price: '99.000đ',
                                        period: 'tháng',
                                        features: [
                                            '10 GB Storage',
                                            'Email support',
                                            'Basic analytics',
                                        ]
                                    }
                                },
                                {
                                    label: 'Chuyên nghiệp',
                                    content: {
                                        price: '299.000đ',
                                        period: 'tháng',
                                        features: [
                                            '100 GB Storage',
                                            'Priority support',
                                            'Advanced analytics',
                                            'Custom domain',
                                        ]
                                    }
                                },
                                {
                                    label: 'Doanh nghiệp',
                                    content: {
                                        price: '999.000đ',
                                        period: 'tháng',
                                        features: [
                                            'Unlimited Storage',
                                            '24/7 phone support',
                                            'Advanced analytics',
                                            'Custom domain',
                                            'API access',
                                        ]
                                    }
                                },
                            ],
                            defaultTab: 1,
                            dataSource: { type: 'static' },
                        },
                        size: { width: 700, height: 500 },
                        mobileSize: { width: 340, height: 550 },
                        styles: {
                            background: '#ffffff',
                            borderRadius: '16px',
                            padding: '30px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        },
                    },
                },
            ]
        },
        {
            id: 'progress',
            name: 'Progress Bar',
            lucideIcon: TrendingUp,
            templates: [
                {
                    id: 'progress-skills',
                    name: 'Skills Progress',
                    lucideIcon: BarChart2,
                    description: 'Progress bars hiển thị kỹ năng',
                    previewImage: 'https://via.placeholder.com/500x300?text=Skills+Progress',
                    json: {
                        type: 'progress',
                        componentData: {
                            title: 'Kỹ năng',
                            items: [
                                { label: 'React/Next.js', value: 95, color: '#61dafb' },
                                { label: 'Node.js', value: 90, color: '#68a063' },
                                { label: 'TypeScript', value: 85, color: '#3178c6' },
                                { label: 'UI/UX Design', value: 80, color: '#f06292' },
                            ],
                            animated: true,
                            showPercentage: true,
                            dataSource: { type: 'static' },
                            animation: { type: 'slideInLeft', duration: 1000, delay: 200 }
                        },
                        size: { width: 500, height: 280 },
                        mobileSize: { width: 340, height: 320 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            padding: '20px',
                        },
                    },
                },
                {
                    id: 'progress-circle',
                    name: 'Circular Progress',
                    lucideIcon: TrendingUp,
                    description: 'Progress dạng tròn',
                    previewImage: 'https://via.placeholder.com/400x400?text=Circular+Progress',
                    json: {
                        type: 'progress-circle',
                        componentData: {
                            title: 'Hoàn thành',
                            value: 75,
                            total: 100,
                            color: '#10b981',
                            strokeWidth: 12,
                            dataSource: { type: 'static' },
                            animation: { type: 'zoomIn', duration: 800 }
                        },
                        size: { width: 250, height: 250 },
                        mobileSize: { width: 200, height: 200 },
                        styles: {
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        },
                    },
                },
            ]
        },
        {
            id: 'rating',
            name: 'Rating/Stars',
            lucideIcon: Star,
            templates: [
                {
                    id: 'rating-stars',
                    name: 'Star Rating',
                    lucideIcon: Star,
                    description: 'Hiển thị đánh giá sao',
                    previewImage: 'https://via.placeholder.com/300x100?text=Star+Rating',
                    json: {
                        type: 'rating',
                        componentData: {
                            rating: 4.5,
                            maxRating: 5,
                            reviews: 127,
                            showReviews: true,
                            interactive: false,
                            color: '#fbbf24',
                            dataSource: { type: 'static' },
                        },
                        size: { width: 250, height: 60 },
                        mobileSize: { width: 220, height: 50 },
                        styles: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '1.5rem',
                        },
                    },
                },
            ]
        },
        {
            id: 'social-proof',
            name: 'Social Proof',
            lucideIcon: Zap,
            templates: [
                {
                    id: 'social-proof-notification',
                    name: 'Live Notification',
                    lucideIcon: Zap,
                    description: 'Thông báo khách hàng mua hàng real-time',
                    previewImage: 'https://via.placeholder.com/350x100?text=Live+Notification',
                    json: {
                        type: 'social-proof',
                        componentData: {
                            notifications: [
                                {
                                    name: 'Nguyễn Văn A',
                                    action: 'vừa mua',
                                    product: 'Gói Premium',
                                    time: '5 phút trước',
                                    avatar: 'https://i.pravatar.cc/50?img=1'
                                },
                                {
                                    name: 'Trần Thị B',
                                    action: 'vừa đăng ký',
                                    product: 'Khóa học Online',
                                    time: '12 phút trước',
                                    avatar: 'https://i.pravatar.cc/50?img=2'
                                },
                            ],
                            interval: 5000,
                            position: 'bottom-left',
                            dataSource: { type: 'static' },
                        },
                        size: { width: 320, height: 80 },
                        styles: {
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            position: 'fixed',
                            bottom: '20px',
                            left: '20px',
                            zIndex: 1000,
                        },
                    },
                },
                {
                    id: 'social-proof-stats',
                    name: 'Trust Stats',
                    lucideIcon: TrendingUp,
                    description: 'Thống kê uy tín (người dùng, đánh giá, v.v.)',
                    previewImage: 'https://via.placeholder.com/600x200?text=Trust+Stats',
                    json: {
                        type: 'social-proof-stats',
                        componentData: {
                            stats: [
                                { label: 'Khách hàng', value: '10,000+', icon: '👥' },
                                { label: 'Đánh giá 5 sao', value: '4.9/5', icon: '⭐' },
                                { label: 'Năm kinh nghiệm', value: '15+', icon: '📅' },
                                { label: 'Dự án hoàn thành', value: '500+', icon: '✅' },
                            ],
                            dataSource: { type: 'static' },
                            animation: { type: 'fadeInUp', duration: 1000, delay: 300 }
                        },
                        size: { width: 700, height: 150 },
                        mobileSize: { width: 340, height: 280 },
                        styles: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            textAlign: 'center',
                            padding: '30px',
                            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                            borderRadius: '16px',
                        },
                        responsiveStyles: {
                            mobile: {
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '15px',
                                padding: '20px',
                            },
                            tablet: {
                                gridTemplateColumns: 'repeat(4, 1fr)',
                            }
                        }
                    },
                },
            ]
        },
    ],
};

export default advancedElements;
