import {
    Type, FileText, Square, FormInput, Image,
    Video, Star, Minus, ShoppingCart, LayoutGrid,
    SlidersHorizontal, Folder, ChevronDown, Table,
    BarChart, Menu
} from 'lucide-react';

export const elements = {
    name: 'Thành phần',
    subCategories: [
        {
            id: 'heading',
            name: 'Tiêu đề',
            lucideIcon: Type,
            templates: [
                {
                    id: 'heading-1-arial',
                    name: 'Heading 1 (Arial)',
                    lucideIcon: Type,
                    description: 'Tiêu đề cấp 1 với font Arial, lớn và đậm',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759953177/heading_1.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Heading 1 (Arial)',
                            content: 'Tiêu đề cấp 1',
                            dataSource: { type: 'static' },
                            events: { onClick: { type: 'showPopup', popupId: 'popup-1' } },
                            animation: { type: 'fadeInDown', duration: 800, delay: 0 }
                        },
                        size: { width: 400, height: 80 },
                        styles: {
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '3rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            textAlign: 'left',
                            margin: '0',
                        },
                    },
                },
                {
                    id: 'heading-2-poppins',
                    name: 'Heading 2 (Poppins)',
                    lucideIcon: Type,
                    description: 'Tiêu đề cấp 2 với font Poppins, hiện đại',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759984855/heading_2_swfgis.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Heading 2 (Poppins)',
                            content: 'Tiêu đề cấp 2',
                            dataSource: { type: 'static' },
                            events: { onHover: { type: 'navigate', url: '/about' } },
                            animation: { type: 'slideInLeft', duration: 1000, delay: 200 }
                        },
                        size: { width: 350, height: 60 },
                        styles: {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '2.25rem',
                            fontWeight: '600',
                            color: '#2563eb',
                            textAlign: 'center',
                            margin: '0',
                        },
                    },
                },
                {
                    id: 'heading-gradient-modern',
                    name: 'Gradient Modern',
                    lucideIcon: Type,
                    description: 'Tiêu đề gradient màu hiện đại với hiệu ứng ánh sáng',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078496/gadient_text_osstgn.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Gradient Modern',
                            content: 'Tiêu đề Gradient Hiện Đại',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'zoomIn', duration: 1200, delay: 0 }
                        },
                        size: { width: 500, height: 90 },
                        styles: {
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '3.5rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textAlign: 'center',
                            margin: '0',
                            letterSpacing: '-1px',
                        },
                    },
                },
                {
                    id: 'heading-neon-glow',
                    name: 'Neon Glow',
                    lucideIcon: Type,
                    description: 'Tiêu đề với hiệu ứng neon phát sáng',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078488/beauty_text_tkqau6.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Neon Glow',
                            content: 'NEON STYLE',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'pulse', duration: 1500, delay: 0, repeat: true }
                        },
                        size: { width: 450, height: 85 },
                        styles: {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '3rem',
                            fontWeight: '700',
                            color: '#06b6d4',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            margin: '0',
                            letterSpacing: '4px',
                            textShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 30px #06b6d4, 0 0 40px #06b6d4',
                        },
                    },
                },
                {
                    id: 'heading-3d-shadow',
                    name: '3D Shadow',
                    lucideIcon: Type,
                    description: 'Tiêu đề với hiệu ứng 3D đổ bóng sâu',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078492/3D_text_b3w9ig.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: '3D Shadow',
                            content: '3D EFFECT',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'bounceIn', duration: 1000, delay: 0 }
                        },
                        size: { width: 480, height: 100 },
                        styles: {
                            fontFamily: 'Montserrat, sans-serif',
                            fontSize: '4rem',
                            fontWeight: '900',
                            color: '#ef4444',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            margin: '0',
                            letterSpacing: '2px',
                            textShadow: '1px 1px 0px #dc2626, 2px 2px 0px #b91c1c, 3px 3px 0px #991b1b, 4px 4px 0px #7f1d1d, 5px 5px 10px rgba(0,0,0,0.4)',
                        },
                    },
                },
                {
                    id: 'heading-outline-stroke',
                    name: 'Outline Stroke',
                    lucideIcon: Type,
                    description: 'Tiêu đề với viền stroke nổi bật',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078489/text_3D_wugxlq.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Outline Stroke',
                            content: 'STROKE TEXT',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeInUp', duration: 1000, delay: 0 }
                        },
                        size: { width: 520, height: 95 },
                        styles: {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '4.5rem',
                            fontWeight: '900',
                            color: 'transparent',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            margin: '0',
                            letterSpacing: '3px',
                            WebkitTextStroke: '2px #1f2937',
                            textStroke: '2px #1f2937',
                        },
                    },
                },
                {
                    id: 'heading-elegant-serif',
                    name: 'Elegant Serif',
                    lucideIcon: Type,
                    description: 'Tiêu đề sang trọng với font serif và spacing rộng',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078489/text_dan_twqlpg.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Elegant Serif',
                            content: 'Elegance & Sophistication',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeIn', duration: 1500, delay: 0 }
                        },
                        size: { width: 550, height: 75 },
                        styles: {
                            fontFamily: 'Georgia, serif',
                            fontSize: '2.5rem',
                            fontWeight: '300',
                            fontStyle: 'italic',
                            color: '#374151',
                            textAlign: 'center',
                            margin: '0',
                            letterSpacing: '8px',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                        },
                    },
                },
                {
                    id: 'heading-retro-bold',
                    name: 'Retro Bold',
                    lucideIcon: Type,
                    description: 'Tiêu đề phong cách retro với màu sắc rực rỡ',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078722/retro_text_zu9ai2.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Retro Bold',
                            content: 'RETRO VIBES',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'rubberBand', duration: 1200, delay: 0 }
                        },
                        size: { width: 480, height: 90 },
                        styles: {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '3.8rem',
                            fontWeight: '800',
                            color: '#f59e0b',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            margin: '0',
                            letterSpacing: '1px',
                            textShadow: '3px 3px 0px #dc2626, 6px 6px 0px #ec4899',
                        },
                    },
                },
                {
                    id: 'heading-minimal-thin',
                    name: 'Minimal Thin',
                    lucideIcon: Type,
                    description: 'Tiêu đề tối giản với font mỏng thanh lịch',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078489/mimi_text_pv7qez.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Minimal Thin',
                            content: 'minimalist design',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeInDown', duration: 1000, delay: 0 }
                        },
                        size: { width: 500, height: 65 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '2.8rem',
                            fontWeight: '200',
                            color: '#6b7280',
                            textAlign: 'center',
                            margin: '0',
                            letterSpacing: '12px',
                            textTransform: 'lowercase',
                        },
                    },
                },
                {
                    id: 'heading-playful-script',
                    name: 'Playful Script',
                    lucideIcon: Type,
                    description: 'Tiêu đề vui nhộn với font chữ viết tay',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760078488/beauty_text_tkqau6.png',
                    json: {
                        type: 'heading',
                        componentData: {
                            title: 'Playful Script',
                            content: 'Beautiful Handwriting',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'bounceInLeft', duration: 1200, delay: 0 }
                        },
                        size: { width: 500, height: 80 },
                        styles: {
                            fontFamily: "'Dancing Script', cursive",
                            fontSize: '3.2rem',
                            fontWeight: '600',
                            color: '#a855f7',
                            textAlign: 'center',
                            margin: '0',
                            textShadow: '2px 2px 4px rgba(168, 85, 247, 0.3)',
                        },
                    },
                },
            ],
        },
        {
            id: 'paragraph',
            name: 'Đoạn văn',
            lucideIcon: FileText,
            templates: [
                {
                    id: 'paragraph-standard-left',
                    name: 'Đoạn văn chuẩn (Căn trái)',
                    lucideIcon: FileText,
                    description: 'Đoạn văn tiêu chuẩn, căn trái với font Inter',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759985655/daonvanbasic_bs4dit.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn chuẩn (Căn trái)',
                            content: 'Đây là một đoạn văn tiêu chuẩn, dùng để mô tả nội dung chính của trang.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeIn', duration: 800, delay: 0 }
                        },
                        size: { width: 400, height: 100 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1rem',
                            color: '#374151',
                            lineHeight: '1.6',
                            textAlign: 'left',
                            margin: '0',
                        },
                    },
                },
                {
                    id: 'paragraph-highlighted',
                    name: 'Đoạn văn nổi bật',
                    lucideIcon: FileText,
                    description: 'Đoạn văn với background màu nổi bật',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759985655/doanvantieuchuan_kacsto.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn nổi bật',
                            content: 'Đây là đoạn văn quan trọng cần được nhấn mạnh với background màu.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeInUp', duration: 1000, delay: 0 }
                        },
                        size: { width: 450, height: 110 },
                        styles: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '1.1rem',
                            color: '#1f2937',
                            lineHeight: '1.7',
                            textAlign: 'left',
                            margin: '0',
                            padding: '20px',
                            backgroundColor: '#fef3c7',
                            borderRadius: '8px',
                            borderLeft: '4px solid #f59e0b',
                        },
                    },
                },
                {
                    id: 'paragraph-boxed-info',
                    name: 'Đoạn văn khung thông tin',
                    lucideIcon: FileText,
                    description: 'Đoạn văn trong khung với viền và shadow',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759988424/thongtinquantrong_woocmd.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn khung thông tin',
                            content: 'Thông tin quan trọng được đặt trong khung để thu hút sự chú ý của người đọc.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'zoomIn', duration: 900, delay: 0 }
                        },
                        size: { width: 450, height: 120 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1rem',
                            color: '#1e40af',
                            lineHeight: '1.7',
                            textAlign: 'center',
                            margin: '0',
                            padding: '25px',
                            backgroundColor: '#eff6ff',
                            border: '2px solid #3b82f6',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)',
                        },
                    },
                },
                {
                    id: 'paragraph-quoted',
                    name: 'Đoạn văn trích dẫn',
                    lucideIcon: FileText,
                    description: 'Đoạn văn trích dẫn với font Roboto, viền trái',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759985655/doanvantricdan_brdix6.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn trích dẫn',
                            content: '"Trích dẫn này thể hiện ý tưởng quan trọng từ một nguồn đáng tin cậy."',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'slideInLeft', duration: 1000, delay: 0 }
                        },
                        size: { width: 400, height: 90 },
                        styles: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '1.1rem',
                            fontStyle: 'italic',
                            color: '#374151',
                            lineHeight: '1.7',
                            textAlign: 'left',
                            paddingLeft: '20px',
                            borderLeft: '4px solid #2563eb',
                            margin: '0',
                        },
                    },
                },
                {
                    id: 'paragraph-elegant-large',
                    name: 'Đoạn văn thanh lịch',
                    lucideIcon: FileText,
                    description: 'Đoạn văn lớn, thanh lịch với spacing rộng',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759985655/doanvantieuchuan_kacsto.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn thanh lịch',
                            content: 'Nội dung được trình bày với phong cách thanh lịch, tạo cảm giác chuyên nghiệp và dễ đọc.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeInDown', duration: 1100, delay: 0 }
                        },
                        size: { width: 480, height: 110 },
                        styles: {
                            fontFamily: 'Georgia, serif',
                            fontSize: '1.25rem',
                            color: '#1f2937',
                            lineHeight: '2',
                            textAlign: 'justify',
                            margin: '0',
                            letterSpacing: '0.5px',
                        },
                    },
                },
                {
                    id: 'paragraph-modern-card',
                    name: 'Đoạn văn card hiện đại',
                    lucideIcon: FileText,
                    description: 'Đoạn văn trong card với gradient background',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759988425/cardTim_elppyy.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn card hiện đại',
                            content: 'Card hiện đại với gradient background tạo điểm nhấn thị giác độc đáo.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'bounceIn', duration: 1000, delay: 0 }
                        },
                        size: { width: 460, height: 130 },
                        styles: {
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '1.05rem',
                            color: '#ffffff',
                            lineHeight: '1.8',
                            textAlign: 'center',
                            margin: '0',
                            padding: '30px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                        },
                    },
                },
                {
                    id: 'paragraph-caption',
                    name: 'Chú thích',
                    lucideIcon: FileText,
                    description: 'Đoạn văn chú thích với font Inter, kích thước nhỏ',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759985654/daonvanchuthich_trxytj.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Chú thích',
                            content: 'Đây là một đoạn chú thích, thường dùng để giải thích hoặc bổ sung thông tin.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeIn', duration: 800, delay: 200 }
                        },
                        size: { width: 350, height: 80 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.9rem',
                            color: '#6b7280',
                            lineHeight: '1.5',
                            textAlign: 'center',
                            margin: '0',
                        },
                    },
                },
                {
                    id: 'paragraph-alert-warning',
                    name: 'Cảnh báo',
                    lucideIcon: FileText,
                    description: 'Đoạn văn cảnh báo với màu cam nổi bật',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759988424/infovang_uhpwlg.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Cảnh báo',
                            content: '⚠️ Thông tin quan trọng! Vui lòng đọc kỹ nội dung này trước khi tiếp tục.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'shake', duration: 800, delay: 0 }
                        },
                        size: { width: 450, height: 100 },
                        styles: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#92400e',
                            lineHeight: '1.6',
                            textAlign: 'left',
                            margin: '0',
                            padding: '20px',
                            backgroundColor: '#fef3c7',
                            border: '2px solid #f59e0b',
                            borderRadius: '8px',
                        },
                    },
                },
                {
                    id: 'paragraph-success-message',
                    name: 'Thông báo thành công',
                    lucideIcon: FileText,
                    description: 'Đoạn văn thông báo thành công với màu xanh',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759988424/complete_x0ed1f.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Thông báo thành công',
                            content: '✓ Hoàn thành! Thao tác của bạn đã được thực hiện thành công.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'bounceIn', duration: 1000, delay: 0 }
                        },
                        size: { width: 450, height: 90 },
                        styles: {
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1rem',
                            fontWeight: '500',
                            color: '#065f46',
                            lineHeight: '1.6',
                            textAlign: 'center',
                            margin: '0',
                            padding: '20px',
                            backgroundColor: '#d1fae5',
                            border: '2px solid #10b981',
                            borderRadius: '8px',
                        },
                    },
                },
                {
                    id: 'paragraph-dark-mode',
                    name: 'Đoạn văn Dark Mode',
                    lucideIcon: FileText,
                    description: 'Đoạn văn tối cho giao diện dark mode',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1759988424/dark_tu8acy.png',
                    json: {
                        type: 'paragraph',
                        componentData: {
                            title: 'Đoạn văn Dark Mode',
                            content: 'Nội dung được tối ưu cho giao diện tối, mang lại trải nghiệm đọc thoải mái trong môi trường ánh sáng yếu.',
                            dataSource: { type: 'static' },
                            events: {},
                            animation: { type: 'fadeInUp', duration: 1000, delay: 0 }
                        },
                        size: { width: 470, height: 120 },
                        styles: {
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '1.05rem',
                            color: '#e5e7eb',
                            lineHeight: '1.8',
                            textAlign: 'left',
                            margin: '0',
                            padding: '25px',
                            backgroundColor: '#1f2937',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        },
                    },
                },
            ],
        },
        {
            "id": "button",
            "name": "Nút bấm",
            "lucideIcon": "Square",
            "templates": [
                {
                    "id": "button-neumorphism-soft",
                    "name": "Neumorphism Soft",
                    "lucideIcon": "Square",
                    "description": "Nút bấm Neumorphism với hiệu ứng lồi nhẹ",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068883/btn_neus_l2gdxo.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Neumorphism Soft",
                            "content": "Nhấn vào đây",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "submitForm", "apiUrl": "/api/submit" },
                                "onHover": { "type": "toggleClass", "className": "hover-effect" }
                            }
                        },
                        "size": { "width": 160, "height": 50 },
                        "styles": {
                            "background": "#e0e0e0",
                            "color": "#333",
                            "borderRadius": "12px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "none",
                            "boxShadow": "5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.8)",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "3px 3px 6px rgba(163, 177, 198, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9)",
                                "transform": "translateY(-2px)"
                            },
                            ":active": {
                                "boxShadow": "inset 3px 3px 6px rgba(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.8)",
                                "transform": "translateY(1px)"
                            }
                        }
                    }
                },
                {
                    "id": "button-neumorphism-pressed",
                    "name": "Neumorphism Pressed",
                    "lucideIcon": "Square",
                    "description": "Nút bấm Neumorphism với hiệu ứng nhấn vào",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068883/btn_neus2_ykjw6m.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Neumorphism Pressed",
                            "content": "Khám phá ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/explore" },
                                "onHover": { "type": "toggleClass", "className": "active-effect" }
                            }
                        },
                        "size": { "width": 160, "height": 50 },
                        "styles": {
                            "background": "#e0e0e0",
                            "color": "#333",
                            "borderRadius": "12px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "none",
                            "boxShadow": "inset 5px 5px 10px rgba(163, 177, 198, 0.6), inset -5px -5px 10px rgba(255, 255, 255, 0.8)",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "inset 3px 3px 6px rgba(163, 177, 198, 0.8), inset -3px -3px 6px rgba(255, 255, 255, 0.9)",
                                "transform": "translateY(1px)"
                            },
                            ":active": {
                                "boxShadow": "inset 6px 6px 12px rgba(163, 177, 198, 0.7), inset -6px -6px 12px rgba(255, 255, 255, 0.7)",
                                "transform": "translateY(2px)"
                            }
                        }
                    }
                },
                {
                    "id": "button-gradient-glow",
                    "name": "Gradient Glow",
                    "lucideIcon": "Square",
                    "description": "Nút bấm với nền gradient và hiệu ứng phát sáng",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068884/btn_gadient_c0phjo.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Gradient Glow",
                            "content": "Bắt đầu ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "triggerApi", "apiUrl": "/api/start" },
                                "onHover": { "type": "scale", "scale": 1.05 }
                            }
                        },
                        "size": { "width": 170, "height": 52 },
                        "styles": {
                            "background": "linear-gradient(45deg, #ff6b6b, #ff8e53)",
                            "color": "#fff",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "none",
                            "boxShadow": "0 0 15px rgba(255, 107, 107, 0.5)",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 28px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "0 0 25px rgba(255, 107, 107, 0.8)",
                                "transform": "scale(1.05)"
                            },
                            ":active": {
                                "boxShadow": "0 0 10px rgba(255, 107, 107, 0.3)",
                                "transform": "scale(0.98)"
                            }
                        }
                    }
                },
                // {
                //     "id": "button-glassmorphism",
                //     "name": "Glassmorphism",
                //     "lucideIcon": "Square",
                //     "description": "Nút bấm với hiệu ứng kính mờ",
                //     "previewImage": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/button-glassmorphism.jpg",
                //     "json": {
                //         "type": "button",
                //         "componentData": {
                //             "title": "Glassmorphism",
                //             "content": "Xem thêm",
                //             "dataSource": { "type": "static" },
                //             "events": {
                //                 "onClick": { "type": "navigate", "url": "/details" },
                //                 "onHover": { "type": "toggleClass", "className": "glass-hover" }
                //             }
                //         },
                //         "size": { "width": 160, "height": 50 },
                //         "styles": {
                //             "background": "rgba(255, 255, 255, 0.1)",
                //             "color": "#61b245",
                //             "borderRadius": "12px",
                //             "fontWeight": "600",
                //             "fontSize": "16px",
                //             "border": "1px solid rgba(255, 255, 255, 0.2)",
                //             "backdropFilter": "blur(10px)",
                //             "boxShadow": "0 8px 32px rgba(31, 38, 135, 0.2)",
                //             "transition": "all 0.3s ease",
                //             "cursor": "pointer",
                //             "padding": "12px 24px",
                //             "display": "flex",
                //             "alignItems": "center",
                //             "justifyContent": "center",
                //             ":hover": {
                //                 "background": "rgba(255, 255, 255, 0.2)",
                //                 "boxShadow": "0 12px 40px rgba(31, 38, 135, 0.3)",
                //                 "transform": "translateY(-2px)"
                //             },
                //             ":active": {
                //                 "background": "rgba(255, 255, 255, 0.05)",
                //                 "transform": "translateY(1px)"
                //             }
                //         }
                //     }
                // },
                {
                    "id": "button-minimal-pulse",
                    "name": "Minimal Pulse",
                    "lucideIcon": "Square",
                    "description": "Nút bấm tối giản với hiệu ứng nhấp nháy",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068883/btn_thu_c6p3qf.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Minimal Pulse",
                            "content": "Thử ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "triggerApi", "apiUrl": "/api/try" },
                                "onHover": { "type": "pulse", "duration": "1s" }
                            }
                        },
                        "size": { "width": 102, "height": 48 },
                        "styles": {
                            "background": "#fff",
                            "color": "#1f2937",
                            "borderRadius": "8px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "2px solid #2563eb",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "10px 20px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "animation": "pulse 1s infinite",
                                "boxShadow": "0 0 15px rgba(37, 99, 235, 0.3)"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            },
                            "@keyframes pulse": {
                                "0%": { "boxShadow": "0 0 0 0 rgba(37, 99, 235, 0.4)" },
                                "70%": { "boxShadow": "0 0 0 10px rgba(37, 99, 235, 0)" },
                                "100%": { "boxShadow": "0 0 0 0 rgba(37, 99, 235, 0)" }
                            }
                        }
                    }
                },
                {
                    "id": "button-3d-transform",
                    "name": "3D Transform",
                    "lucideIcon": "Square",
                    "description": "Nút bấm với hiệu ứng 3D xoay nhẹ",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_khamphathem_h4w7uj.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "3D Transform",
                            "content": "Khám phá 3D",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/3d-experience" },
                                "onHover": { "type": "rotate", "angle": "5deg" }
                            }
                        },
                        "size": { "width": 170, "height": 52 },
                        "styles": {
                            "background": "#2c3e50",
                            "color": "#fff",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "none",
                            "boxShadow": "0 5px 15px rgba(0, 0, 0, 0.3)",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 28px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "perspective": "1000px",
                            ":hover": {
                                "transform": "rotateX(5deg) rotateY(5deg) translateY(-3px)",
                                "boxShadow": "0 8px 20px rgba(0, 0, 0, 0.4)"
                            },
                            ":active": {
                                "transform": "rotateX(0deg) rotateY(0deg) translateY(1px)",
                                "boxShadow": "0 3px 10px rgba(0, 0, 0, 0.2)"
                            }
                        }
                    }
                },
                {
                    "id": "button-outline-glow",
                    "name": "Outline Glow",
                    "lucideIcon": "Square",
                    "description": "Nút bấm viền với hiệu ứng sáng viền",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_timhieuthem_fbbg5n.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Outline Glow",
                            "content": "Tìm hiểu thêm",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/learn-more" },
                                "onHover": { "type": "toggleClass", "className": "glow-effect" }
                            }
                        },
                        "size": { "width": 150, "height": 48 },
                        "styles": {
                            "background": "transparent",
                            "color": "#2563eb",
                            "borderRadius": "8px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "2px solid #2563eb",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "10px 20px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "0 0 15px rgba(37, 99, 235, 0.5)",
                                "borderColor": "#3b82f6",
                                "color": "#3b82f6"
                            },
                            ":active": {
                                "boxShadow": "0 0 8px rgba(37, 99, 235, 0.3)",
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "button-retro-neon",
                    "name": "Retro Neon",
                    "lucideIcon": "Square",
                    "description": "Nút bấm phong cách neon retro",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760069126/btn_dangky_mlefek.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Retro Neon",
                            "content": "Đăng ký ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "submitForm", "apiUrl": "/api/register" },
                                "onHover": { "type": "toggleClass", "className": "neon-glow" }
                            }
                        },
                        "size": { "width": 170, "height": 52 },
                        "styles": {
                            "background": "#1a1a1a",
                            "color": "#ff00ff",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "2px solid #ff00ff",
                            "boxShadow": "0 0 10px #ff00ff, 0 0 20px #ff00ff",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 28px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "0 0 15px #ff00ff, 0 0 30px #ff00ff",
                                "color": "#fff",
                                "borderColor": "#ff66ff"
                            },
                            ":active": {
                                "boxShadow": "0 0 5px #ff00ff",
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "button-flat-add",
                    "name": "Flat Add",
                    "lucideIcon": "Square",
                    "description": "Nút bấm phẳng với hiệu ứng viền nổi bật khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_xanh_js8azl.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Flat Add",
                            "content": "Thêm",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "triggerApi", "apiUrl": "/api/add" },
                                "onHover": { "type": "toggleClass", "className": "flat-hover" }
                            }
                        },
                        "size": { "width": 140, "height": 46 },
                        "styles": {
                            "background": "#10b981",
                            "color": "#fff",
                            "borderRadius": "8px",
                            "fontWeight": "600",
                            "fontSize": "15px",
                            "border": "2px solid transparent",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "10px 20px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "background": "transparent",
                                "borderColor": "#10b981",
                                "color": "#10b981",
                                "boxShadow": "0 0 10px rgba(16, 185, 129, 0.4)"
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "none"
                            }
                        }
                    }
                },
                {
                    "id": "button-bam-ngay-animated",
                    "name": "Bấm Ngay Animated",
                    "lucideIcon": "Square",
                    "description": "Nút bấm với hiệu ứng slide-in khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068883/btn_bamngay_maknae.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Bấm Ngay Animated",
                            "content": "Bấm ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/action" },
                                "onHover": { "type": "slide", "duration": "0.5s" }
                            }
                        },
                        "size": { "width": 150, "height": 48 },
                        "styles": {
                            "background": "#8b5cf6",
                            "color": "#fff",
                            "borderRadius": "10px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "none",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "overflow": "hidden",
                            ":hover": {
                                "animation": "slideIn 0.5s ease forwards",
                                "boxShadow": "0 0 15px rgba(139, 92, 246, 0.5)"
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "none"
                            },
                            "@keyframes slideIn": {
                                "0%": { "transform": "translateX(-10%)", "opacity": 0.7 },
                                "100%": { "transform": "translateX(0)", "opacity": 1 }
                            }
                        }
                    }
                },
                {
                    "id": "button-modern-glow",
                    "name": "Modern Glow",
                    "lucideIcon": "Square",
                    "description": "Nút bấm với viền sáng neon và hiệu ứng scale",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_khamphathem_h4w7uj.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Modern Glow",
                            "content": "Khám phá thêm",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/discover" },
                                "onHover": { "type": "scale", "scale": 1.1 }
                            }
                        },
                        "size": { "width": 160, "height": 50 },
                        "styles": {
                            "background": "transparent",
                            "color": "#00ddeb",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "2px solid #00ddeb",
                            "boxShadow": "0 0 10px rgba(0, 221, 235, 0.5)",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "boxShadow": "0 0 20px rgba(0, 221, 235, 0.8)",
                                "transform": "scale(1.1)",
                                "borderColor": "#00f5ff"
                            },
                            ":active": {
                                "boxShadow": "0 0 5px rgba(0, 221, 235, 0.3)",
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "button-retro-wave",
                    "name": "Retro Wave",
                    "lucideIcon": "Square",
                    "description": "Nút bấm phong cách retro với hiệu ứng sóng",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760069463/btn_retroware_vernmi.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Retro Wave",
                            "content": "Tham gia ngay",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "submitForm", "apiUrl": "/api/join" },
                                "onHover": { "type": "wave", "duration": "1.5s" }
                            }
                        },
                        "size": { "width": 170, "height": 52 },
                        "styles": {
                            "background": "#1e1e2f",
                            "color": "#00ffcc",
                            "borderRadius": "8px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "2px solid #00ffcc",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 28px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "overflow": "hidden",
                            ":hover": {
                                "animation": "wave 1.5s infinite",
                                "boxShadow": "0 0 15px rgba(0, 255, 204, 0.6)",
                                "color": "#fff"
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "none"
                            },
                            "@keyframes wave": {
                                "0%": { "boxShadow": "0 0 0 0 rgba(0, 255, 204, 0.4)" },
                                "50%": { "boxShadow": "0 0 0 15px rgba(0, 255, 204, 0.2)" },
                                "100%": { "boxShadow": "0 0 0 30px rgba(0, 255, 204, 0)" }
                            }
                        }
                    }
                },
                {
                    "id": "button-gradient-flow",
                    "name": "Gradient Flow",
                    "lucideIcon": "Square",
                    "description": "Nút với gradient động chuyển màu mượt mà và scale 3D khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068883/btn_gadient1_zxkghw.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Gradient Flow",
                            "content": "Tham gia",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/join" },
                                "onHover": { "type": "scale", "scale": 1.08 }
                            }
                        },
                        "size": { "width": 124, "height": 50 },
                        "styles": {
                            "background": "linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1)",
                            "backgroundSize": "200% 200%",
                            "color": "#fff",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "none",
                            "boxShadow": "0 4px 15px rgba(0, 0, 0, 0.2)",
                            "transition": "all 0.4s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            ":hover": {
                                "backgroundPosition": "100% 0",
                                "transform": "scale(1.08)",
                                "boxShadow": "0 6px 20px rgba(0, 0, 0, 0.3)",
                                "animation": "gradientFlow 3s ease infinite"
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "0 2px 10px rgba(0, 0, 0, 0.2)"
                            },
                            "@keyframes gradientFlow": {
                                "0%": { "backgroundPosition": "0% 50%" },
                                "50%": { "backgroundPosition": "100% 50%" },
                                "100%": { "backgroundPosition": "0% 50%" }
                            }
                        }
                    }
                },
                {
                    "id": "button-particle-burst",
                    "name": "Particle Burst",
                    "lucideIcon": "Square",
                    "description": "Nút với hiệu ứng hạt nổ tung khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_batdau_twixmv.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Particle Burst",
                            "content": "Bắt đầu",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "triggerApi", "apiUrl": "/api/start" },
                                "onHover": { "type": "particle", "duration": "0.8s" }
                            }
                        },
                        "size": { "width": 170, "height": 52 },
                        "styles": {
                            "background": "#1e3a8a",
                            "color": "#fff",
                            "borderRadius": "12px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "none",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 28px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "overflow": "hidden",
                            "zIndex": 1,
                            ":hover": {
                                "boxShadow": "0 0 15px rgba(30, 58, 138, 0.5)",
                                "transform": "scale(1.05)",
                                "::before": {
                                    "content": "''",
                                    "position": "absolute",
                                    "top": "50%",
                                    "left": "50%",
                                    "width": "150%",
                                    "height": "150%",
                                    "background": "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%)",
                                    "transform": "translate(-50%, -50%) scale(0)",
                                    "animation": "particleBurst 0.8s ease-out forwards",
                                    "zIndex": -1
                                }
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "none"
                            },
                            "@keyframes particleBurst": {
                                "0%": { "transform": "translate(-50%, -50%) scale(0)", "opacity": 1 },
                                "100%": { "transform": "translate(-50%, -50%) scale(1.5)", "opacity": 0 }
                            }
                        }
                    }
                },
                {
                    "id": "button-liquid-fill",
                    "name": "Liquid Fill",
                    "lucideIcon": "Square",
                    "description": "Nút với hiệu ứng chất lỏng tràn từ dưới lên khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760069735/btn_khampha_pqqoww.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Liquid Fill",
                            "content": "Khám phá",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/explore" },
                                "onHover": { "type": "liquid", "duration": "0.6s" }
                            }
                        },
                        "size": { "width": 160, "height": 50 },
                        "styles": {
                            "background": "#111827",
                            "color": "#fff",
                            "borderRadius": "10px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "none",
                            "transition": "color 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "overflow": "hidden",
                            "zIndex": 1,
                            ":hover": {
                                "color": "#111827",
                                "::before": {
                                    "content": "''",
                                    "position": "absolute",
                                    "top": "0",
                                    "left": "0",
                                    "width": "100%",
                                    "height": "100%",
                                    "background": "#60a5fa",
                                    "transform": "translateY(100%)",
                                    "animation": "liquidFill 0.6s ease forwards",
                                    "zIndex": -1
                                }
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            },
                            "@keyframes liquidFill": {
                                "0%": { "transform": "translateY(100%)" },
                                "100%": { "transform": "translateY(0)" }
                            }
                        }
                    }
                },
                {
                    "id": "button-3d-flip",
                    "name": "3D Flip",
                    "lucideIcon": "Square",
                    "description": "Nút lật 3D khi hover, hiển thị mặt sau",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760068882/btn_clieck_f4xe3j.png",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "3D Flip",
                            "content": "Click Me",
                            "backContent": "Go Now!",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/go" },
                                "onHover": { "type": "flip", "duration": "0.5s" }
                            }
                        },
                        "size": { "width": 150, "height": 48 },
                        "styles": {
                            "background": "#dc2626",
                            "color": "#fff",
                            "borderRadius": "8px",
                            "fontWeight": "600",
                            "fontSize": "16px",
                            "border": "none",
                            "transition": "all 0.5s ease",
                            "cursor": "pointer",
                            "padding": "10px 20px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 1,
                            ":hover": {
                                "transform": "rotateY(180deg)",
                                "boxShadow": "0 0 15px rgba(220, 38, 38, 0.5)",
                                "::before": {
                                    "content": "attr(data-back-content)",
                                    "position": "absolute",
                                    "top": "0",
                                    "left": "0",
                                    "width": "100%",
                                    "height": "100%",
                                    "background": "#b91c1c",
                                    "color": "#fff",
                                    "display": "flex",
                                    "alignItems": "center",
                                    "justifyContent": "center",
                                    "transform": "rotateY(180deg)",
                                    "borderRadius": "8px",
                                    "zIndex": -1
                                }
                            },
                            ":active": {
                                "transform": "rotateY(180deg) scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "button-glitch-text",
                    "name": "Glitch Text",
                    "lucideIcon": "Square",
                    "description": "Nút với hiệu ứng text glitch khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "button",
                        "componentData": {
                            "title": "Glitch Text",
                            "content": "Go Now",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "triggerApi", "apiUrl": "/api/hack" },
                                "onHover": { "type": "glitch", "duration": "0.4s" }
                            }
                        },
                        "size": { "width": 129, "height": 50 },
                        "styles": {
                            "background": "#0f172a",
                            "color": "#22d3ee",
                            "borderRadius": "10px",
                            "fontWeight": "700",
                            "fontSize": "16px",
                            "border": "2px solid #22d3ee",
                            "transition": "all 0.3s ease",
                            "cursor": "pointer",
                            "padding": "12px 24px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 1,
                            ":hover": {
                                "boxShadow": "0 0 15px rgba(34, 211, 238, 0.5)",
                                "::before": {
                                    "content": "attr(data-content)",
                                    "position": "absolute",
                                    "top": "0",
                                    "left": "2px",
                                    "width": "100%",
                                    "height": "100%",
                                    "color": "#ff00ff",
                                    "animation": "glitchTop 0.4s ease infinite",
                                    "zIndex": -1,
                                    "display": "flex",
                                    "alignItems": "center",
                                    "justifyContent": "center"
                                },
                                "::after": {
                                    "content": "attr(data-content)",
                                    "position": "absolute",
                                    "top": "0",
                                    "left": "-2px",
                                    "width": "100%",
                                    "height": "100%",
                                    "color": "#00ffcc",
                                    "animation": "glitchBottom 0.4s ease infinite",
                                    "zIndex": -1,
                                    "display": "flex",
                                    "alignItems": "center",
                                    "justifyContent": "center"
                                }
                            },
                            ":active": {
                                "transform": "scale(0.95)",
                                "boxShadow": "none"
                            },
                            "@keyframes glitchTop": {
                                "0%": { "transform": "translate(0)", "opacity": 0.8 },
                                "50%": { "transform": "translate(2px, -2px)", "opacity": 0.4 },
                                "100%": { "transform": "translate(0)", "opacity": 0.8 }
                            },
                            "@keyframes glitchBottom": {
                                "0%": { "transform": "translate(0)", "opacity": 0.8 },
                                "50%": { "transform": "translate(-2px, 2px)", "opacity": 0.4 },
                                "100%": { "transform": "translate(0)", "opacity": 0.8 }
                            }
                        }
                    }}
            ]
        },
        {
            id: 'image',
            name: 'Hình ảnh',
            lucideIcon: Image,
            templates: [
                {
                    id: 'image-standard',
                    name: 'Hình ảnh chuẩn',
                    lucideIcon: Image,
                    description: 'Hình ảnh tiêu chuẩn',
                    previewImage: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg',
                    json: {
                        type: 'image',
                        componentData: {
                            title: 'Hình ảnh',
                            src: 'https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg',
                            alt: 'Hình ảnh mẫu',
                            dataSource: { type: 'static' },
                            events: {},
                        },
                        size: { width: 200, height: 200 },
                        styles: { maxWidth: '100%', borderRadius: '8px' },
                    },
                },
                {
                    id: 'image-rounded',
                    name: 'Hình ảnh bo góc',
                    lucideIcon: Image,
                    description: 'Hình ảnh với góc bo tròn',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/image-rounded.jpg',
                    json: {
                        type: 'image',
                        componentData: {
                            title: 'Hình ảnh bo góc',
                            src: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/placeholder-rounded.jpg',
                            alt: 'Hình ảnh bo góc',
                            dataSource: { type: 'static' },
                            events: {},
                        },
                        size: { width: 200, height: 200 },
                        styles: { maxWidth: '100%', borderRadius: '50%' },
                    },
                },
            ],
        },
        {
            id: 'video',
            name: 'Video',
            lucideIcon: Video,
            templates: [
                {
                    id: 'video-standard',
                    name: 'Video chuẩn',
                    lucideIcon: Video,
                    description: 'Video tiêu chuẩn',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/video-standard.jpg',
                    json: {
                        type: 'video',
                        componentData: {
                            title: 'Video',
                            src: 'https://res.cloudinary.com/your_cloud_name/video/upload/v1234567890/sample.mp4',
                            dataSource: { type: 'static' },
                            events: {},
                        },
                        size: { width: 300, height: 200 },
                        styles: { maxWidth: '100%', borderRadius: '8px' },
                    },
                },
            ],
        },
        {
            "id": "icon",
            "name": "Biểu tượng",
            "lucideIcon": "Star",
            "templates": [
                {
                    "id": "icon-star",
                    "name": "Ngôi sao",
                    "lucideIcon": "Star",
                    "description": "Biểu tượng ngôi sao với hiệu ứng phóng to và đổi màu khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Ngôi sao",
                            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon></svg>",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/favorite" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "color": "#f59e0b",
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "scale(1.2)",
                                "color": "#d97706",
                                "filter": "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.9)"
                            }
                        }
                    }
                },
                {
                    "id": "icon-heart",
                    "name": "Trái tim",
                    "lucideIcon": "Heart",
                    "description": "Biểu tượng trái tim với hiệu ứng nhịp đập khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Trái tim",
                            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'></path></svg>",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "/love" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "color": "#e11d48",
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "color": "#be123c",
                                "filter": "drop-shadow(0 0 8px rgba(225, 29, 72, 0.5))",
                                "animation": "pulse 0.6s ease infinite"
                            },
                            ":active": {
                                "transform": "scale(0.9)"
                            },
                            "@keyframes pulse": {
                                "0%": { "transform": "scale(1)" },
                                "50%": { "transform": "scale(1.2)" },
                                "100%": { "transform": "scale(1)" }
                            }
                        }
                    }
                },
                {
                    "id": "icon-facebook",
                    "name": "Facebook",
                    "lucideIcon": "Facebook",
                    "description": "Biểu tượng Facebook dạng ảnh PNG với hiệu ứng phóng to khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Facebook",
                            "imageUrl": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760031918/2021_Facebook_icon.svg_gyvfen.png",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://facebook.com" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "scale(1.2)",
                                "filter": "drop-shadow(0 0 8px rgba(24, 119, 242, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "icon-zalo",
                    "name": "Zalo",
                    "lucideIcon": "MessageCircle",
                    "description": "Biểu tượng Zalo dạng ảnh PNG với hiệu ứng rung nhẹ khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Zalo",
                            "imageUrl": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760031918/zalo_jlbtaz.png",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://zalo.me" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "rotate(5deg)",
                                "filter": "drop-shadow(0 0 8px rgba(0, 104, 255, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "icon-messenger",
                    "name": "Messenger",
                    "lucideIcon": "MessageSquare",
                    "description": "Biểu tượng Messenger dạng ảnh PNG với hiệu ứng nhấp nháy khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Messenger",
                            "imageUrl": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760031919/messender_csdiye.webp",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://messenger.com" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "animation": "blink 0.5s ease infinite",
                                "filter": "drop-shadow(0 0 8px rgba(0, 132, 255, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            },
                            "@keyframes blink": {
                                "0%": { "opacity": 1 },
                                "50%": { "opacity": 0.7 },
                                "100%": { "opacity": 1 }
                            }
                        }
                    }
                },
                {
                    "id": "icon-tiktok",
                    "name": "TikTok",
                    "lucideIcon": "Music",
                    "description": "Biểu tượng TikTok dạng SVG với hiệu ứng xoay khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "TikTok",
                            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M7 3v6.4a6.4 6.4 0 0 0 6.4 6.4 6.4 6.4 0 0 0 6-4.8V3'></path><path d='M14.4 8.8V3h2.4a3.2 3.2 0 0 1 3.2 3.2v1.6'></path></svg>",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://tiktok.com" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "color": "#000000",
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "rotate(360deg)",
                                "filter": "drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "icon-youtube",
                    "name": "YouTube",
                    "lucideIcon": "Play",
                    "description": "Biểu tượng YouTube dạng SVG với hiệu ứng phát sáng khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "YouTube",
                            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z'></path><polygon points='9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02'></polygon></svg>",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://youtube.com" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "color": "#FF0000",
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "scale(1.2)",
                                "filter": "drop-shadow(0 0 8px rgba(255, 0, 0, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                },
                {
                    "id": "icon-instagram",
                    "name": "Instagram",
                    "lucideIcon": "Instagram",
                    "description": "Biểu tượng Instagram dạng SVG với hiệu ứng gradient khi hover",
                    "previewImage": "",
                    "json": {
                        "type": "icon",
                        "componentData": {
                            "title": "Instagram",
                            "icon": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='2' width='20' height='20' rx='5' ry='5'></rect><circle cx='12' cy='12' r='4'></circle><line x1='17.5' y1='6.5' x2='17.51' y2='6.5'></line></svg>",
                            "dataSource": { "type": "static" },
                            "events": {
                                "onClick": { "type": "navigate", "url": "https://instagram.com" }
                            }
                        },
                        "size": { "width": 50, "height": 50 },
                        "styles": {
                            "color": "#E4405F",
                            "width": "50px",
                            "height": "50px",
                            "display": "flex",
                            "alignItems": "center",
                            "justifyContent": "center",
                            "position": "relative",
                            "zIndex": 10,
                            "isolation": "isolate",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "scale(1.2)",
                                "filter": "drop-shadow(0 0 8px rgba(228, 64, 95, 0.5))"
                            },
                            ":active": {
                                "transform": "scale(0.95)"
                            }
                        }
                    }
                }
            ]
        },
        {
            "id": "gallery",
            "name": "Thư viện ảnh",
            "lucideIcon": "LayoutGrid",
            "templates": [
                {
                    "id": "gallery-grid-basic",
                    "name": "Lưới ảnh cơ bản",
                    "lucideIcon": "LayoutGrid",
                    "description": "Lưới ảnh đơn giản với hiệu ứng fadeIn khi tải",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                    "json": {
                        "type": "gallery",
                        "componentData": {
                            "title": "Lưới ảnh cơ bản",
                            "images": [
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg"
                            ],
                            "dataSource": { "type": "static" },
                            "events": { "onClick": { "type": "openPopup", "popupId": "image-popup" } },
                            "animation": { "type": "fadeIn", "duration": 800, "delay": 0 }
                        },
                        "size": { "width": 380, "height": 300 },
                        "styles": {
                            "display": "grid",
                            "gridTemplateColumns": "repeat(auto-fill, minmax(150px, 1fr))",
                            "gap": "10px",
                            "borderRadius": "8px",
                            "overflow": "hidden"
                        }
                    }
                },
                {
                    "id": "gallery-masonry-modern",
                    "name": "Masonry hiện đại",
                    "lucideIcon": "LayoutGrid",
                    "description": "Bố cục masonry linh hoạt với animation zoomIn khi hover",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                    "json": {
                        "type": "gallery",
                        "componentData": {
                            "title": "Masonry hiện đại",
                            "images": [
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg"
                            ],
                            "dataSource": { "type": "static" },
                            "events": { "onHover": { "type": "zoomIn", "duration": 300 } },
                            "animation": { "type": "fadeInUp", "duration": 1000, "delay": 200 }
                        },
                        "size": { "width": 400, "height": 350 },
                        "styles": {
                            "display": "grid",
                            "gridTemplateColumns": "repeat(auto-fill, minmax(120px, 1fr))",
                            "gap": "8px",
                            "transition": "all 0.3s ease",
                            ":hover": {
                                "transform": "scale(1.05)"
                            }
                        }
                    }
                },
                {
                    "id": "gallery-carousel-slide",
                    "name": "Carousel slide",
                    "lucideIcon": "LayoutGrid",
                    "description": "Carousel ảnh với chuyển động mượt mà và autoplay",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                    "json": {
                        "type": "gallery",
                        "componentData": {
                            "title": "Carousel slide",
                            "images": [
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg"
                            ],
                            "dataSource": { "type": "static" },
                            "events": { "onClick": { "type": "navigate", "url": "/gallery-detail" } },
                            "animation": { "type": "slideInRight", "duration": 1200, "delay": 0, "repeat": true }
                        },
                        "size": { "width": 380, "height": 250 },
                        "styles": {
                            "display": "flex",
                            "overflow": "hidden",
                            "borderRadius": "12px",
                            "boxShadow": "0 4px 8px rgba(0,0,0,0.1)"
                        }
                    }
                },
                {
                    "id": "gallery-thumbnail-grid",
                    "name": "Thumbnail grid",
                    "lucideIcon": "LayoutGrid",
                    "description": "Lưới thumbnail với lightbox khi click",
                    "previewImage": "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                    "json": {
                        "type": "gallery",
                        "componentData": {
                            "title": "Thumbnail grid",
                            "images": [
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg",
                                "https://res.cloudinary.com/dubthm5m6/image/upload/v1760126448/img_rtpdlt.jpg"
                            ],
                            "dataSource": { "type": "static" },
                            "events": { "onClick": { "type": "showLightbox" } },
                            "animation": { "type": "bounceIn", "duration": 900, "delay": 100 }
                        },
                        "size": { "width": 380, "height": 300 },
                        "styles": {
                            "display": "grid",
                            "gridTemplateColumns": "repeat(3, 1fr)",
                            "gap": "12px",
                            "cursor": "pointer"
                        }
                    }
                }
            ]
        },
    ],
};