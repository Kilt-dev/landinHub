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

const sendOrderCancellation = async (order) => {
    try {
        const marketplacePage = await require('../models/MarketplacePage').findById(order.marketplacePageId);
        if (!marketplacePage) {
            console.error('❌ MarketplacePage not found for ID:', order.marketplacePageId);
            return;
        }

        const buyer = await User.findById(order.buyerId);
        if (!buyer || !buyer.email) {
            console.error(`❌ No buyer or email for buyerId: ${order.buyerId}`);
            return;
        }
        const buyerEmail = buyer.email.trim();
        console.log('DEBUG: Sending cancellation to:', buyerEmail, 'for order:', order.orderId);

        const mailOptions = {
            from: `"LandingHub" <${process.env.EMAIL_USER}>`,
            to: buyerEmail,
            subject: 'Đơn hàng đã bị hủy',
            text: `Đơn hàng ${order.orderId} cho ${marketplacePage.title} đã được hủy.`,
            html: `
        <h2>Đơn hàng đã bị hủy</h2>
        <p>Mã đơn hàng: <strong>${order.orderId}</strong></p>
        <p>Sản phẩm: <strong>${marketplacePage.title}</strong></p>
        <p>Trạng thái: <strong>Đã hủy</strong></p>
        <p>Nếu đã thanh toán, chúng tôi sẽ xử lý hoàn tiền trong vòng 24h.</p>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Cancellation email sent to:', buyerEmail);
    } catch (error) {
        console.error('❌ Cancellation email error:', error.message);
    }
};

// 🔔 REFUND REQUEST NOTIFICATION
const sendRefundRequestNotification = async (transaction) => {
    try {
        // Gửi cho admin (có thể config admin email trong .env)
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        const buyer = await User.findById(transaction.buyer_id);
        const seller = await User.findById(transaction.seller_id);

        const mailOptions = {
            from: `"LandingHub" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: '🔔 Yêu cầu hoàn tiền mới - LandingHub',
            text: `Có yêu cầu hoàn tiền mới cho giao dịch ${transaction._id}`,
            html: `
        <h2>🔔 Yêu cầu hoàn tiền mới</h2>
        <p><strong>Mã giao dịch:</strong> ${transaction._id}</p>
        <p><strong>Số tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}</p>
        <p><strong>Người mua:</strong> ${buyer?.name || 'N/A'} (${buyer?.email || 'N/A'})</p>
        <p><strong>Người bán:</strong> ${seller?.name || 'N/A'} (${seller?.email || 'N/A'})</p>
        <p><strong>Lý do:</strong> ${transaction.refund?.reason || 'Không có lý do'}</p>
        <p><strong>Thời gian yêu cầu:</strong> ${new Date(transaction.refund?.requested_at).toLocaleString('vi-VN')}</p>
        <br/>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/transactions" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xử lý ngay</a></p>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Refund request email sent to admin:', adminEmail);
    } catch (error) {
        console.error('❌ Refund request email error:', error.message);
    }
};

// 💬 ADMIN REPLY NOTIFICATION
const sendAdminReplyNotification = async (chatRoom, message) => {
    try {
        const user = await User.findById(chatRoom.user_id);
        if (!user || !user.email) {
            console.error(`❌ No user or email for userId: ${chatRoom.user_id}`);
            return;
        }

        const userEmail = user.email.trim();

        const mailOptions = {
            from: `"LandingHub Support" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '💬 Admin đã trả lời hỗ trợ của bạn - LandingHub',
            text: `Admin đã trả lời: ${message.message}`,
            html: `
        <h2>💬 Admin đã trả lời</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p>Admin đã trả lời yêu cầu hỗ trợ của bạn về: <strong>${chatRoom.subject}</strong></p>
        <div style="background: #f9fafb; padding: 16px; border-left: 4px solid #667eea; margin: 16px 0;">
            <p style="margin: 0;"><strong>Admin:</strong> ${message.message}</p>
        </div>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Xem và trả lời</a></p>
        <br/>
        <p style="color: #666; font-size: 13px;">Nếu bạn không yêu cầu hỗ trợ, vui lòng bỏ qua email này.</p>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Admin reply email sent to user:', userEmail);
    } catch (error) {
        console.error('❌ Admin reply email error:', error.message);
    }
};

// 📧 LEAD EMAIL MARKETING
const sendLeadEmail = async (leadEmail, subject, content, options = {}) => {
    try {
        if (!leadEmail || !leadEmail.includes('@')) {
            throw new Error('Invalid email address');
        }

        const {
            leadName = '',
            senderName = 'LandingHub Team',
            includeUnsubscribe = true
        } = options;

        const mailOptions = {
            from: `"${senderName}" <${process.env.EMAIL_USER}>`,
            to: leadEmail.trim(),
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 8px 8px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #ffffff;
                            padding: 30px;
                            border: 1px solid #e5e7eb;
                            border-top: none;
                        }
                        .footer {
                            background: #f9fafb;
                            padding: 20px;
                            text-align: center;
                            border-radius: 0 0 8px 8px;
                            font-size: 13px;
                            color: #6b7280;
                        }
                        .button {
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        .unsubscribe {
                            font-size: 12px;
                            color: #9ca3af;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">LandingHub</h1>
                    </div>
                    <div class="content">
                        ${leadName ? `<p>Xin chào <strong>${leadName}</strong>,</p>` : '<p>Xin chào,</p>'}
                        ${content}
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} LandingHub. All rights reserved.</p>
                        ${includeUnsubscribe ? `
                            <p class="unsubscribe">
                                Bạn nhận email này vì đã đăng ký hoặc gửi form tại LandingHub.
                                <br/>
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe" style="color: #9ca3af;">Hủy đăng ký</a>
                            </p>
                        ` : ''}
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Marketing email sent to:', leadEmail);
        return { success: true, email: leadEmail };

    } catch (error) {
        console.error('❌ Marketing email error:', error.message);
        throw error;
    }
};

// 📧 BULK EMAIL TO MULTIPLE LEADS
const sendBulkLeadEmails = async (leads, subject, content, options = {}) => {
    try {
        const results = {
            success: [],
            failed: []
        };

        for (const lead of leads) {
            try {
                await sendLeadEmail(
                    lead.email,
                    subject,
                    content,
                    {
                        leadName: lead.name || '',
                        ...options
                    }
                );
                results.success.push(lead.email);

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                results.failed.push({
                    email: lead.email,
                    error: error.message
                });
            }
        }

        console.log(`✅ Bulk email completed: ${results.success.length} sent, ${results.failed.length} failed`);
        return results;

    } catch (error) {
        console.error('❌ Bulk email error:', error.message);
        throw error;
    }
};
const sendRefundRequest = sendRefundRequestNotification;
const sendRefundCompleted = sendDeliveryConfirmation;

module.exports = {
    sendOrderConfirmation,
    sendDeliveryConfirmation,
    sendOrderCancellation,
    sendRefundRequestNotification,
    sendAdminReplyNotification,
    sendLeadEmail,
    sendBulkLeadEmails,
    sendRefundRequest,
    sendRefundCompleted,
};