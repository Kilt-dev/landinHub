const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // false cho port 587 (TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOrderConfirmation = async (order) => {
    try {
        const marketplacePage = await require('../models/MarketplacePage').findById(order.marketplacePageId);
        if (!marketplacePage) {
            console.error('❌ MarketplacePage not found for ID:', order.marketplacePageId);
            return;
        }

        // Lấy email từ User
        const buyer = await User.findById(order.buyerId);
        if (!buyer || !buyer.email) {
            console.error(`❌ No buyer or email for buyerId: ${order.buyerId}`);
            return;
        }
        const buyerEmail = buyer.email.trim(); // Email sạch từ DB
        console.log('DEBUG: Sending order confirmation to:', buyerEmail, 'for order:', order.orderId);

        const mailOptions = {
            from: `"LandingHub" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: 'Xác nhận đặt hàng Landing Page',
            text: `Đơn hàng ${order.orderId} cho ${marketplacePage.title} đã được xác nhận.`,
            html: `
        <h2>Xác nhận đặt hàng</h2>
        <p>Mã đơn hàng: <strong>${order.orderId}</strong></p>
        <p>Sản phẩm: <strong>${marketplacePage.title}</strong></p>
        <p>Giá: <strong>${order.price.toLocaleString('vi-VN')} VND</strong></p>
        <p>Trạng thái: <strong>Đã thanh toán</strong></p>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Order confirmation sent to:', buyerEmail, 'for order:', order.orderId);
    } catch (error) {
        console.error('❌ Order confirmation error:', error.message);
    }
};

const sendDeliveryConfirmation = async (order) => {
    try {
        const marketplacePage = await require('../models/MarketplacePage').findById(order.marketplacePageId);
        if (!marketplacePage) {
            console.error('❌ MarketplacePage not found for ID:', order.marketplacePageId);
            return;
        }

        // Lấy email từ User
        const buyer = await User.findById(order.buyerId);
        if (!buyer || !buyer.email) {
            console.error(`❌ No buyer or email for buyerId: ${order.buyerId}`);
            return;
        }
        const buyerEmail = buyer.email.trim();
        console.log('DEBUG: Sending delivery confirmation to:', buyerEmail, 'for order:', order.orderId);

        const mailOptions = {
            from: `"LandingHub" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: 'Xác nhận giao Landing Page',
            text: `Landing page ${marketplacePage.title} đã được giao cho đơn hàng ${order.orderId}.`,
            html: `
        <h2>Landing Page đã được giao!</h2>
        <p>Mã đơn hàng: <strong>${order.orderId}</strong></p>
        <p>Sản phẩm: <strong>${marketplacePage.title}</strong></p>
        <p>Giá: <strong>${order.price.toLocaleString('vi-VN')} VND</strong></p>
        <p>Trạng thái: <strong>Đã giao</strong></p>
        <p>Tải xuống: <a href="http://localhost:3000/marketplace/${order.marketplacePageId}/download/html">Tải file HTML</a></p>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Delivery confirmation sent to:', buyerEmail, 'for order:', order.orderId);
    } catch (error) {
        console.error('❌ Delivery confirmation error:', error.message);
    }
};

module.exports = { sendOrderConfirmation, sendDeliveryConfirmation };