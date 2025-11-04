# 💬 Hướng dẫn Tích hợp Chat vào Landing Page Builder

**Version:** 1.0
**Ngày cập nhật:** 2025-11-04
**Mục đích:** Hướng dẫn tích hợp các nền tảng chat phổ biến vào landing page

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Tích hợp Facebook Messenger](#tích-hợp-facebook-messenger)
3. [Tích hợp Zalo Chat](#tích-hợp-zalo-chat)
4. [Tích hợp Tawk.to](#tích-hợp-tawkto)
5. [Tích hợp Crisp Chat](#tích-hợp-crisp-chat)
6. [Tích hợp LiveChat](#tích-hợp-livechat)
7. [Tích hợp Custom Chat Widget](#tích-hợp-custom-chat-widget)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

Landing Page Builder hỗ trợ tích hợp các nền tảng chat phổ biến để tương tác với khách hàng ngay trên landing page. Bạn có thể tích hợp chat theo 2 cách:

### **Phương án 1: Tích hợp trực tiếp trong Builder**
- Thêm chat widget vào từng landing page
- Cấu hình riêng cho mỗi trang
- Linh hoạt, dễ quản lý

### **Phương án 2: Tích hợp Global (Toàn bộ website)**
- Thêm script vào file template chính
- Chat hiển thị trên tất cả các trang
- Dễ bảo trì, chỉ cần cấu hình 1 lần

---

## 💙 Tích hợp Facebook Messenger

### **Bước 1: Lấy Facebook Page ID**

1. Truy cập [Facebook Page của bạn](https://www.facebook.com/pages)
2. Vào **Settings** → **Messenger Platform**
3. Copy **Page ID**

### **Bước 2: Tạo Messenger Plugin**

1. Truy cập [Messenger Customer Chat Plugin](https://developers.facebook.com/docs/messenger-platform/discovery/customer-chat-plugin)
2. Điền **Page ID** và cấu hình:
   - **Greeting Text:** "Chào bạn! Chúng tôi có thể giúp gì cho bạn?"
   - **Theme Color:** `#0084FF` (hoặc màu brand của bạn)
   - **Logged in greeting:** Chào mừng riêng cho user đã đăng nhập
   - **Logged out greeting:** Chào mừng cho khách

3. Click **Generate Code** và copy đoạn code

### **Bước 3: Thêm vào Landing Page**

#### **Option A: Thêm vào Properties Panel (Single Page)**

Trong **CreateLanding.js**, thêm Facebook Messenger settings vào Page Settings:

```javascript
// File: apps/web/src/components/CreateLanding.js

const [pageSettings, setPageSettings] = useState({
    meta: {
        title: '',
        description: '',
        favicon: ''
    },
    chat: {
        enabled: false,
        provider: 'facebook', // 'facebook', 'zalo', 'tawk', 'crisp', 'custom'
        facebook: {
            pageId: '',
            greetingText: 'Chào bạn! Có thể giúp gì cho bạn?',
            themeColor: '#0084FF',
            loggedInGreeting: '',
            loggedOutGreeting: ''
        }
    },
    analytics: {
        googleAnalyticsId: '',
        facebookPixelId: ''
    }
});
```

#### **Option B: Thêm Script trực tiếp vào HTML Export**

Trong **pageUtils.js**, thêm Facebook Messenger script vào `renderStaticHTML()`:

```javascript
// File: apps/web/src/utils/pageUtils.js

export const renderStaticHTML = (pageData) => {
    // ... existing code ...

    const chatScript = pageData.chat?.enabled ? generateChatScript(pageData.chat) : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <!-- ... existing head ... -->
</head>
<body>
    <!-- ... existing body ... -->

    <!-- Chat Widget -->
    ${chatScript}

    <!-- Facebook Messenger Plugin -->
    ${pageData.chat?.provider === 'facebook' ? `
    <!-- Load Facebook SDK -->
    <div id="fb-root"></div>
    <script>
        window.fbAsyncInit = function() {
            FB.init({
                xfbml: true,
                version: 'v18.0'
            });
        };

        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    </script>

    <!-- Messenger Chat Plugin -->
    <div class="fb-customerchat"
         attribution="biz_inbox"
         page_id="${pageData.chat.facebook.pageId}"
         theme_color="${pageData.chat.facebook.themeColor || '#0084FF'}"
         logged_in_greeting="${pageData.chat.facebook.loggedInGreeting || 'Chào bạn!'}"
         logged_out_greeting="${pageData.chat.facebook.loggedOutGreeting || 'Xin chào! Chúng tôi có thể giúp gì?'}">
    </div>
    ` : ''}
</body>
</html>`;
};
```

### **Bước 4: Thêm Chat Settings UI**

Tạo component mới `ChatSettingsPanel.js`:

```javascript
// File: apps/web/src/components/create-page/properties/ChatSettingsPanel.js

import React, { useState } from 'react';
import { MessageCircle, Facebook } from 'lucide-react';

const ChatSettingsPanel = ({ pageSettings, onUpdate }) => {
    const [chatEnabled, setChatEnabled] = useState(pageSettings.chat?.enabled || false);
    const [provider, setProvider] = useState(pageSettings.chat?.provider || 'facebook');

    const handleToggleChat = (enabled) => {
        setChatEnabled(enabled);
        onUpdate({
            ...pageSettings,
            chat: {
                ...pageSettings.chat,
                enabled
            }
        });
    };

    const handleUpdateFacebookSettings = (updates) => {
        onUpdate({
            ...pageSettings,
            chat: {
                ...pageSettings.chat,
                facebook: {
                    ...pageSettings.chat.facebook,
                    ...updates
                }
            }
        });
    };

    return (
        <div className="chat-settings-panel">
            <div className="setting-group">
                <label className="setting-label">
                    <MessageCircle size={16} />
                    Enable Chat
                </label>
                <input
                    type="checkbox"
                    checked={chatEnabled}
                    onChange={(e) => handleToggleChat(e.target.checked)}
                />
            </div>

            {chatEnabled && (
                <>
                    <div className="setting-group">
                        <label>Chat Provider</label>
                        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                            <option value="facebook">Facebook Messenger</option>
                            <option value="zalo">Zalo Chat</option>
                            <option value="tawk">Tawk.to</option>
                            <option value="crisp">Crisp</option>
                        </select>
                    </div>

                    {provider === 'facebook' && (
                        <div className="facebook-settings">
                            <div className="setting-group">
                                <label>Facebook Page ID</label>
                                <input
                                    type="text"
                                    placeholder="123456789012345"
                                    value={pageSettings.chat?.facebook?.pageId || ''}
                                    onChange={(e) => handleUpdateFacebookSettings({ pageId: e.target.value })}
                                />
                            </div>

                            <div className="setting-group">
                                <label>Greeting Text</label>
                                <input
                                    type="text"
                                    placeholder="Chào bạn! Có thể giúp gì cho bạn?"
                                    value={pageSettings.chat?.facebook?.greetingText || ''}
                                    onChange={(e) => handleUpdateFacebookSettings({ greetingText: e.target.value })}
                                />
                            </div>

                            <div className="setting-group">
                                <label>Theme Color</label>
                                <input
                                    type="color"
                                    value={pageSettings.chat?.facebook?.themeColor || '#0084FF'}
                                    onChange={(e) => handleUpdateFacebookSettings({ themeColor: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ChatSettingsPanel;
```

---

## 📱 Tích hợp Zalo Chat

### **Bước 1: Lấy Zalo OA ID**

1. Đăng ký [Zalo Official Account](https://oa.zalo.me/)
2. Vào **Cài đặt** → **Thông tin OA**
3. Copy **OA ID** (ví dụ: `1234567890123456789`)

### **Bước 2: Thêm Zalo Chat Plugin**

```javascript
// Thêm vào renderStaticHTML()

${pageData.chat?.provider === 'zalo' ? `
<!-- Zalo Chat Plugin -->
<div class="zalo-chat-widget"
     data-oaid="${pageData.chat.zalo.oaId}"
     data-welcome-message="${pageData.chat.zalo.welcomeMessage || 'Rất vui được hỗ trợ bạn!'}"
     data-autopopup="0"
     data-width="350"
     data-height="420">
</div>
<script src="https://sp.zalo.me/plugins/sdk.js"></script>
` : ''}
```

### **Bước 3: Cấu hình Zalo Settings**

```javascript
chat: {
    enabled: true,
    provider: 'zalo',
    zalo: {
        oaId: '1234567890123456789',
        welcomeMessage: 'Xin chào! Zalo OA có thể giúp gì cho bạn?',
        autoPopup: false,
        width: 350,
        height: 420
    }
}
```

---

## 💬 Tích hợp Tawk.to

### **Bước 1: Tạo tài khoản Tawk.to**

1. Đăng ký tại [Tawk.to](https://www.tawk.to/)
2. Tạo **Property** mới
3. Vào **Administration** → **Chat Widget**
4. Copy **Property ID** và **Widget ID**

### **Bước 2: Thêm Tawk.to Script**

```javascript
${pageData.chat?.provider === 'tawk' ? `
<!-- Tawk.to Widget -->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
    s1.async=true;
    s1.src='https://embed.tawk.to/${pageData.chat.tawk.propertyId}/${pageData.chat.tawk.widgetId}';
    s1.charset='UTF-8';
    s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0);
})();

// Customize Tawk.to
Tawk_API.onLoad = function(){
    Tawk_API.setAttributes({
        'name': '${pageData.chat.tawk.visitorName || 'Visitor'}',
        'email': '${pageData.chat.tawk.visitorEmail || ''}',
    }, function(error){});
};
</script>
` : ''}
```

---

## 🔵 Tích hợp Crisp Chat

### **Bước 1: Lấy Crisp Website ID**

1. Đăng ký [Crisp](https://crisp.chat/)
2. Tạo **Website** mới
3. Vào **Settings** → **Setup Instructions**
4. Copy **Website ID**

### **Bước 2: Thêm Crisp Script**

```javascript
${pageData.chat?.provider === 'crisp' ? `
<!-- Crisp Chat -->
<script type="text/javascript">
    window.$crisp=[];
    window.CRISP_WEBSITE_ID="${pageData.chat.crisp.websiteId}";
    (function(){
        d=document;
        s=d.createElement("script");
        s.src="https://client.crisp.chat/l.js";
        s.async=1;
        d.getElementsByTagName("head")[0].appendChild(s);
    })();

    // Customize Crisp
    $crisp.push(["set", "user:email", ["${pageData.chat.crisp.userEmail || ''}"]]);
    $crisp.push(["set", "user:nickname", ["${pageData.chat.crisp.userName || 'Visitor'}"]]);
    $crisp.push(["set", "session:segments", [["${pageData.chat.crisp.segment || 'landing-page'}"]]]);
</script>
` : ''}
```

---

## 🎨 Tích hợp Custom Chat Widget

Nếu bạn muốn tạo chat widget riêng:

### **Option 1: Floating Chat Button**

```javascript
// Thêm vào pageUtils.js

const customChatWidget = `
<style>
.custom-chat-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9998;
    transition: all 0.3s ease;
}

.custom-chat-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.custom-chat-button svg {
    width: 28px;
    height: 28px;
    color: white;
}

.custom-chat-widget {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: none;
    flex-direction: column;
    overflow: hidden;
}

.custom-chat-widget.active {
    display: flex;
}

.custom-chat-header {
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.custom-chat-body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
}

.custom-chat-footer {
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
}

.custom-chat-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
}

.custom-chat-send {
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}
</style>

<div class="custom-chat-button" onclick="toggleCustomChat()">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
</div>

<div class="custom-chat-widget" id="customChatWidget">
    <div class="custom-chat-header">
        <div>
            <div style="font-weight: 600; font-size: 16px;">Live Chat</div>
            <div style="font-size: 12px; opacity: 0.9;">Online - Phản hồi ngay</div>
        </div>
        <button onclick="toggleCustomChat()" style="background: transparent; border: none; color: white; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
    <div class="custom-chat-body" id="customChatBody">
        <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
            <p>Chào mừng bạn!</p>
            <p style="font-size: 14px; margin-top: 8px;">Chúng tôi có thể giúp gì cho bạn?</p>
        </div>
    </div>
    <div class="custom-chat-footer">
        <input
            type="text"
            class="custom-chat-input"
            placeholder="Nhập tin nhắn..."
            id="customChatInput"
            onkeypress="if(event.key === 'Enter') sendCustomChatMessage()"
        />
        <button class="custom-chat-send" onclick="sendCustomChatMessage()">Gửi</button>
    </div>
</div>

<script>
function toggleCustomChat() {
    const widget = document.getElementById('customChatWidget');
    widget.classList.toggle('active');
}

function sendCustomChatMessage() {
    const input = document.getElementById('customChatInput');
    const body = document.getElementById('customChatBody');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'text-align: right; margin: 8px 0;';
    userMsg.innerHTML = '<div style="display: inline-block; background: #667eea; color: white; padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 14px;">' + message + '</div>';
    body.appendChild(userMsg);

    input.value = '';
    body.scrollTop = body.scrollHeight;

    // Simulate bot response
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.style.cssText = 'margin: 8px 0;';
        botMsg.innerHTML = '<div style="display: inline-block; background: #f3f4f6; color: #1f2937; padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 14px;">Cảm ơn bạn đã liên hệ! Chúng tôi sẽ trả lời bạn sớm nhất.</div>';
        body.appendChild(botMsg);
        body.scrollTop = body.scrollHeight;
    }, 1000);
}
</script>
`;

// Add to renderStaticHTML
${pageData.chat?.provider === 'custom' ? customChatWidget : ''}
```

---

## ✅ Best Practices

### **1. Chat Placement**
- ✅ Đặt ở góc phải dưới (desktop) hoặc dưới cùng giữa (mobile)
- ✅ Đảm bảo không che các CTA quan trọng
- ✅ Có thể minimize/expand

### **2. Greeting Message**
- ✅ Ngắn gọn, thân thiện
- ✅ Rõ ràng về thời gian phản hồi
- ✅ Có CTA (Call-to-Action) rõ ràng

**Ví dụ tốt:**
> "👋 Chào bạn! Chúng tôi online từ 8h-22h hàng ngày. Có thể giúp gì cho bạn?"

**Ví dụ không tốt:**
> "Hello"

### **3. Mobile Optimization**
- ✅ Test trên mobile để đảm bảo chat không che form
- ✅ Auto-hide khi keyboard mở (mobile)
- ✅ Touch-friendly size (tối thiểu 44x44px)

### **4. Performance**
- ✅ Load chat script bất đồng bộ (`async`)
- ✅ Lazy load (chỉ load khi user interact)
- ✅ Avoid multiple chat widgets cùng lúc

### **5. Privacy & GDPR**
- ✅ Thông báo về cookie/tracking
- ✅ Cho phép user opt-out
- ✅ Link tới Privacy Policy

---

## 🐛 Troubleshooting

### **Vấn đề: Chat không hiển thị**

**Giải pháp:**
1. Kiểm tra Page ID / OA ID / Property ID có đúng không
2. Kiểm tra script có load thành công (mở DevTools → Network)
3. Kiểm tra CSP (Content Security Policy) có block script không
4. Clear cache và refresh

### **Vấn đề: Chat bị chặn bởi Ad Blocker**

**Giải pháp:**
- Sử dụng custom domain cho chat script
- Host chat widget trên domain riêng
- Thông báo cho user disable ad blocker

### **Vấn đề: Chat conflict với các plugin khác**

**Giải pháp:**
- Chỉ enable 1 chat provider tại 1 thời điểm
- Kiểm tra z-index conflicts
- Load chat script sau cùng

### **Vấn đề: Chat không responsive trên mobile**

**Giải pháp:**
```css
@media (max-width: 768px) {
    .custom-chat-widget {
        width: 100% !important;
        height: 100% !important;
        bottom: 0 !important;
        right: 0 !important;
        border-radius: 0 !important;
    }
}
```

---

## 📞 Hỗ trợ

Nếu bạn cần hỗ trợ thêm về tích hợp chat, vui lòng:

1. Đọc docs của chat provider
2. Kiểm tra console logs
3. Test trên incognito mode
4. Liên hệ support team

---

**Chúc bạn tích hợp chat thành công! 🎉**
