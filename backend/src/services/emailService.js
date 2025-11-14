/**
 * Email Notification Service
 * Send emails for chat notifications, admin alerts, etc.
 */

const nodemailer = require('nodemailer');

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

/**
 * Send email notification to admin about new chat
 */
async function notifyAdminNewChat(chatRoom, user) {
    if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) {
        console.log('⚠️  Email not configured, skipping notification');
        return;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Landing Hub Support" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `🆕 Chat mới từ ${user.name || user.email}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Chat Hỗ Trợ Mới</h2>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Người dùng:</strong> ${user.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Chủ đề:</strong> ${chatRoom.subject}</p>
          <p><strong>Tags:</strong> ${chatRoom.tags.join(', ')}</p>
          <p><strong>Priority:</strong> ${chatRoom.priority}</p>
        </div>

        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/admin/support"
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem Chat
          </a>
        </div>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent for chat ${chatRoom._id}`);
    } catch (error) {
        console.error('❌ Email sending error:', error);
    }
}

/**
 * Send email notification to user about admin response
 */
async function notifyUserAdminResponse(chatRoom, user, adminMessage) {
    if (!process.env.SMTP_USER) return;

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Landing Hub Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `💬 Admin đã trả lời chat của bạn`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Admin Đã Trả Lời</h2>

        <p>Xin chào <strong>${user.name || user.email}</strong>,</p>

        <div style="background: #f0f7ff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          ${adminMessage.substring(0, 300)}${adminMessage.length > 300 ? '...' : ''}
        </div>

        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard"
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem Đầy Đủ
          </a>
        </div>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ User notification sent to ${user.email}`);
    } catch (error) {
        console.error('❌ Email sending error:', error);
    }
}

/**
 * Send chat resolution confirmation
 */
async function notifyChatResolved(chatRoom, user) {
    if (!process.env.SMTP_USER) return;

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Landing Hub Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `✅ Chat của bạn đã được giải quyết`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Chat Đã Được Giải Quyết</h2>

        <p>Xin chào <strong>${user.name || user.email}</strong>,</p>

        <p>Chat hỗ trợ của bạn về "<strong>${chatRoom.subject}</strong>" đã được giải quyết.</p>

        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard"
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Đánh Giá Dịch Vụ
          </a>
        </div>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Resolution notification sent to ${user.email}`);
    } catch (error) {
        console.error('❌ Email sending error:', error);
    }
}

/**
 * Send daily admin report
 */
async function sendDailyAdminReport(stats) {
    if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) return;

    const transporter = createTransporter();

    const mailOptions = {
        from: `"Landing Hub Reports" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `📊 Báo cáo hỗ trợ - ${new Date().toLocaleDateString('vi-VN')}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Báo Cáo Hàng Ngày</h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #667eea; font-size: 32px;">${stats.newChats}</h3>
            <p style="margin: 10px 0 0 0; color: #666;">Chat Mới</p>
          </div>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #f59e0b; font-size: 32px;">${stats.openChats}</h3>
            <p style="margin: 10px 0 0 0; color: #666;">Đang Mở</p>
          </div>
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #10b981; font-size: 32px;">${stats.resolvedChats}</h3>
            <p style="margin: 10px 0 0 0; color: #666;">Đã Giải Quyết</p>
          </div>
          <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0; color: #8b5cf6; font-size: 32px;">${stats.totalMessages}</h3>
            <p style="margin: 10px 0 0 0; color: #666;">Tin Nhắn</p>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/admin/analytics"
             style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xem Chi Tiết
          </a>
        </div>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Daily admin report sent`);
    } catch (error) {
        console.error('❌ Email sending error:', error);
    }
}

module.exports = {
    notifyAdminNewChat,
    notifyUserAdminResponse,
    notifyChatResolved,
    sendDailyAdminReport
};