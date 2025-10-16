import { Square, Gift } from 'lucide-react';

export const popups = {
    name: 'Popup',
    subCategories: [
        {
            id: 'basic-popups',
            name: 'Popup cơ bản',
            lucideIcon: Square,
            templates: [
                {
                    id: 'popup-1',
                    name: 'Popup đơn giản',
                    lucideIcon: Square,
                    description: 'Popup tối giản với tiêu đề và nội dung',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/popup.jpg',
                    json: {
                        type: 'popup',
                        componentData: {
                            title: 'Chào mừng!',
                            content: 'Đây là một popup đơn giản để thông báo.',
                            buttonText: 'Đóng',
                            buttonAction: { type: 'closePopup' },
                        },
                        position: { desktop: { x: 0, y: 0 }, tablet: { x: 0, y: 0 }, mobile: { x: 0, y: 0 } },
                        size: { width: 600, height: 400 },
                        styles: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)', zIndex: 10000 },
                        children: [
                            {
                                id: 'popup-heading-1',
                                type: 'heading',
                                componentData: { content: 'Chào mừng!', title: 'Tiêu đề popup' },
                                position: { desktop: { x: 20, y: 20 }, tablet: { x: 20, y: 20 }, mobile: { x: 20, y: 20 } },
                                size: { width: 560, height: 40 },
                                styles: { fontSize: '1.5rem', color: '#1f2937', textAlign: 'center' },
                            },
                            {
                                id: 'popup-button-1',
                                type: 'button',
                                componentData: { content: 'Đóng', title: 'Nút đóng', action: { type: 'closePopup' } },
                                position: { desktop: { x: 240, y: 320 }, tablet: { x: 240, y: 320 }, mobile: { x: 240, y: 320 } },
                                size: { width: 120, height: 40 },
                                styles: { background: '#2563eb', color: '#fff', borderRadius: '8px' },
                            },
                        ],
                    },
                },
                {
                    id: 'promo-popup',
                    name: 'Popup khuyến mãi',
                    lucideIcon: Gift,
                    description: 'Popup quảng cáo với biểu mẫu đăng ký',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/promo-popup.jpg',
                    json: {
                        type: 'popup',
                        componentData: {
                            title: 'Ưu đãi đặc biệt!',
                            content: 'Đăng ký nhận tin để được giảm giá 20%.',
                            fields: [{ type: 'email', placeholder: 'Nhập email của bạn', label: 'Email' }],
                            buttonText: 'Nhận ưu đãi',
                            dataSource: { type: 'static' },
                            events: { onSubmit: { type: 'submitForm', apiUrl: '/api/newsletter' } },
                        },
                        position: { desktop: { x: 0, y: 0 }, tablet: { x: 0, y: 0 }, mobile: { x: 0, y: 0 } },
                        size: { width: 600, height: 400 },
                        styles: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)', zIndex: 10000 },
                        children: [
                            {
                                id: 'promo-heading-1',
                                type: 'heading',
                                componentData: { content: 'Ưu đãi đặc biệt!', title: 'Tiêu đề khuyến mãi' },
                                position: { desktop: { x: 20, y: 20 }, tablet: { x: 20, y: 20 }, mobile: { x: 20, y: 20 } },
                                size: { width: 560, height: 40 },
                                styles: { fontSize: '1.5rem', color: '#1f2937', textAlign: 'center' },
                            },
                            {
                                id: 'promo-form-1',
                                type: 'form',
                                componentData: {
                                    title: 'Biểu mẫu khuyến mãi',
                                    fields: [{ type: 'email', placeholder: 'Nhập email của bạn', label: 'Email' }],
                                    buttonText: 'Nhận ưu đãi',
                                },
                                position: { desktop: { x: 20, y: 100 }, tablet: { x: 20, y: 100 }, mobile: { x: 20, y: 100 } },
                                size: { width: 560, height: 120 },
                                styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                            },
                        ],
                    },
                },
            ],
        },
    ],
};