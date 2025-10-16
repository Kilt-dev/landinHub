import { FileText, ShoppingBag, Book } from 'lucide-react';

export const templates = {
    name: 'Mẫu',
    subCategories: [
        {
            id: 'landing-page-templates',
            name: 'Mẫu trang đích',
            lucideIcon: FileText,
            templates: [
                {
                    id: 'template-landing-1',
                    name: 'Trang đích thương mại điện tử',
                    lucideIcon: ShoppingBag,
                    description: 'Trang đích hoàn chỉnh cho thương mại điện tử',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/ecommerce-landing.jpg',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Trang đích thương mại điện tử',
                            backgroundColor: '#ffffff',
                            dataSource: { type: 'static' },
                            events: {},
                        },
                        size: { width: 420, height: 1200 },
                        styles: { textAlign: 'center', padding: '40px 0' },
                        children: [
                            {
                                id: 'template-hero',
                                type: 'section',
                                componentData: { title: 'Chào mừng đến với cửa hàng', dataSource: { type: 'static' } },
                                size: { width: 420, height: 400 },
                                position: { desktop: { x: 0, y: 0 }, tablet: { x: 0, y: 0 }, mobile: { x: 0, y: 0 } },
                                styles: { backgroundColor: '#f9fafb', textAlign: 'center' },
                                children: [
                                    {
                                        id: 'template-hero-heading',
                                        type: 'heading',
                                        componentData: { content: 'Mua sắm những ưu đãi tốt nhất', title: 'Tiêu đề chính', dataSource: { type: 'static' } },
                                        size: { width: 300, height: 50 },
                                        position: { desktop: { x: 60, y: 50 }, tablet: { x: 60, y: 50 }, mobile: { x: 30, y: 50 } },
                                        styles: { fontSize: '2rem', color: '#1f2937' },
                                    },
                                    {
                                        id: 'template-hero-button',
                                        type: 'button',
                                        componentData: { content: 'Mua ngay', title: 'Nút mua sắm', dataSource: { type: 'static' }, events: { onClick: { type: 'navigate', url: '/shop' } } },
                                        size: { width: 150, height: 40 },
                                        position: { desktop: { x: 135, y: 120 }, tablet: { x: 135, y: 120 }, mobile: { x: 80, y: 120 } },
                                        styles: { background: '#2563eb', color: '#fff', borderRadius: '8px' },
                                    },
                                ],
                            },
                            {
                                id: 'template-products',
                                type: 'section',
                                componentData: { title: 'Sản phẩm nổi bật', dataSource: { type: 'static' } },
                                size: { width: 420, height: 600 },
                                position: { desktop: { x: 0, y: 400 }, tablet: { x: 0, y: 400 }, mobile: { x: 0, y: 400 } },
                                styles: { backgroundColor: '#ffffff', textAlign: 'center' },
                                children: [
                                    {
                                        id: 'template-product-grid',
                                        type: 'grid',
                                        componentData: {
                                            title: 'Lưới sản phẩm',
                                            columns: 2,
                                            items: [
                                                { title: 'Sản phẩm 1', image: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/product1.jpg', price: '$29.99' },
                                                { title: 'Sản phẩm 2', image: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/product2.jpg', price: '$39.99' },
                                            ],
                                            dataSource: { type: 'static' },
                                        },
                                        size: { width: 380, height: 400 },
                                        position: { desktop: { x: 20, y: 100 }, tablet: { x: 20, y: 100 }, mobile: { x: 20, y: 100 } },
                                        styles: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    id: 'template-landing-2',
                    name: 'Trang đích blog',
                    lucideIcon: Book,
                    description: 'Trang đích cho blog',
                    previewImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/blog-landing.jpg',
                    json: {
                        type: 'section',
                        componentData: {
                            structure: 'ladi-standard',
                            title: 'Trang đích blog',
                            backgroundColor: '#ffffff',
                            dataSource: { type: 'static' },
                            events: {},
                        },
                        size: { width: 420, height: 1000 },
                        styles: { textAlign: 'center', padding: '40px 0' },
                        children: [
                            {
                                id: 'template-blog-hero',
                                type: 'section',
                                componentData: { title: 'Blog của chúng tôi', dataSource: { type: 'static' } },
                                size: { width: 420, height: 300 },
                                position: { desktop: { x: 0, y: 0 }, tablet: { x: 0, y: 0 }, mobile: { x: 0, y: 0 } },
                                styles: { backgroundColor: '#f9fafb', textAlign: 'center' },
                                children: [
                                    {
                                        id: 'template-blog-heading',
                                        type: 'heading',
                                        componentData: { content: 'Bài viết mới nhất', title: 'Tiêu đề blog', dataSource: { type: 'static' } },
                                        size: { width: 300, height: 50 },
                                        position: { desktop: { x: 60, y: 50 }, tablet: { x: 60, y: 50 }, mobile: { x: 30, y: 50 } },
                                        styles: { fontSize: '2rem', color: '#1f2937' },
                                    },
                                ],
                            },
                            {
                                id: 'template-blog-list',
                                type: 'section',
                                componentData: { title: 'Danh sách bài viết', dataSource: { type: 'static' } },
                                size: { width: 420, height: 600 },
                                position: { desktop: { x: 0, y: 300 }, tablet: { x: 0, y: 300 }, mobile: { x: 0, y: 300 } },
                                styles: { backgroundColor: '#ffffff', textAlign: 'left' },
                                children: [
                                    {
                                        id: 'template-blog-collection',
                                        type: 'collection',
                                        componentData: {
                                            title: 'Bộ sưu tập bài viết',
                                            items: [
                                                { title: 'Bài viết 1', content: 'Mô tả bài viết 1' },
                                                { title: 'Bài viết 2', content: 'Mô tả bài viết 2' },
                                            ],
                                            dataSource: { type: 'static' },
                                        },
                                        size: { width: 380, height: 500 },
                                        position: { desktop: { x: 20, y: 50 }, tablet: { x: 20, y: 50 }, mobile: { x: 20, y: 50 } },
                                        styles: { display: 'flex', flexDirection: 'column', gap: '20px' },
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
    ],
};