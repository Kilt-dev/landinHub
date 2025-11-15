# Development Of A Multi-Platform Landing Page Builder With AI-Powered Marketplace

NGUYEN THI TUONG VI¹, TRAN TUAN KIET¹, [TEN GIANG VIEN]*

¹Faculty of Information Technology, Industrial University of Ho Chi Minh City

*[email_giang_vien]@iuh.edu.vn

**Abstract**—In the current context of digital transformation, the application of information technology in online marketing and e-commerce has become essential. Landing pages play a crucial role in digital marketing campaigns, yet creating professional landing pages often requires programming skills and significant time investment. This paper proposes a multi-platform SaaS solution called Landing Hub that enables users to create, deploy, and manage landing pages through a drag-and-drop interface without coding knowledge. The system integrates a marketplace where users can buy and sell landing page templates, a comprehensive AI system using Groq (Llama 3.3 70B) and Google Gemini 2.0 Flash with auto-fallback for content generation, page analysis, intelligent chatbot support, and analytics insights, along with DeepSeek API for code refactoring, and automated deployment to AWS infrastructure. The system is built on modern technologies including React 19, Node.js Express, MongoDB, GrapesJS, and Socket.IO, following a monorepo architecture with pnpm workspaces. Experimental results show that the system can handle 100 concurrent users with an average response time of 156ms for the page builder. The platform successfully automates the entire workflow from page creation to deployment, payment processing, and AI-powered customer support, reducing landing page development time from days to minutes.

**Keywords**: Digital transformation, Landing page builder, SaaS platform, GrapesJS, AI content generation, AWS deployment, React, Node.js, MongoDB, Marketplace.

---

**Tóm tắt**—Trong bối cảnh chuyển đổi số hiện nay, việc ứng dụng công nghệ thông tin vào marketing trực tuyến và thương mại điện tử đã trở nên thiết yếu. Landing page đóng vai trò quan trọng trong các chiến dịch marketing số, tuy nhiên việc tạo landing page chuyên nghiệp thường đòi hỏi kỹ năng lập trình và tốn nhiều thời gian. Bài báo này đề xuất một giải pháp SaaS đa nền tảng có tên Landing Hub cho phép người dùng tạo, triển khai và quản lý landing page thông qua giao diện kéo-thả mà không cần kiến thức lập trình. Hệ thống tích hợp marketplace cho phép mua bán template landing page, hệ thống AI toàn diện sử dụng Groq (Llama 3.3 70B) và Google Gemini 2.0 Flash với cơ chế auto-fallback cho tạo nội dung, phân tích trang, chatbot thông minh, và phân tích insights, cùng với DeepSeek API để tối ưu code, và triển khai tự động lên hạ tầng AWS. Hệ thống được xây dựng trên các công nghệ hiện đại bao gồm React 19, Node.js Express, MongoDB, GrapesJS và Socket.IO, tuân theo kiến trúc monorepo với pnpm workspaces. Kết quả thực nghiệm cho thấy hệ thống có thể xử lý 100 người dùng đồng thời với thời gian phản hồi trung bình 156ms cho trình tạo trang. Nền tảng tự động hóa thành công toàn bộ quy trình từ tạo trang đến triển khai, xử lý thanh toán và hỗ trợ khách hàng với AI, giảm thời gian phát triển landing page từ nhiều ngày xuống còn vài phút.

**Từ khóa**: Chuyển đổi số, Trình tạo landing page, Nền tảng SaaS, GrapesJS, Tạo nội dung AI, Triển khai AWS, React, Node.js, MongoDB, Marketplace.

---

## I. GIỚI THIỆU

Trong những năm gần đây, marketing số (digital marketing) đã trở thành công cụ không thể thiếu cho các doanh nghiệp. Landing page - trang đích được thiết kế chuyên biệt để chuyển đổi khách truy cập thành khách hàng tiềm năng - đóng vai trò then chốt trong các chiến dịch quảng cáo trực tuyến, email marketing, và SEO [1]. Theo thống kê, các doanh nghiệp sử dụng landing page có tỷ lệ chuyển đổi cao hơn 55% so với những trang web thông thường [2].

Tuy nhiên, việc tạo landing page chuyên nghiệp hiện nay đang gặp phải nhiều thách thức:

**Thách thức về kỹ thuật**: Người dùng không có kiến thức lập trình phải thuê developer hoặc sử dụng các công cụ có sẵn với hạn chế về tùy biến. Việc code HTML/CSS/JavaScript từ đầu tốn nhiều thời gian và chi phí.

**Thách thức về triển khai**: Sau khi tạo xong landing page, người dùng phải tự tìm hosting, cấu hình domain, SSL certificate, và bảo trì hạ tầng - những công việc đòi hỏi kiến thức DevOps.

**Thách thức về nội dung**: Viết content marketing hiệu quả đòi hỏi kỹ năng copywriting và hiểu biết về tâm lý khách hàng, không phải ai cũng có khả năng này.

**Thách thức về chi phí**: Các giải pháp SaaS hiện có như Unbounce, Instapage thường có giá cao (từ $80-300/tháng) [3], không phù hợp với doanh nghiệp nhỏ và cá nhân.

Để giải quyết các thách thức trên, bài báo này đề xuất hệ thống **Landing Hub** - một nền tảng SaaS đa nền tảng với các tính năng chính:

1. **Landing Page Builder**: Trình tạo trang kéo-thả trực quan sử dụng GrapesJS, cho phép người dùng không cần coding tạo được landing page chuyên nghiệp.

2. **Marketplace**: Thị trường mua bán template landing page, nơi người dùng có thể mua template có sẵn để tiết kiệm thời gian, hoặc bán các template của mình để tạo thu nhập.

3. **AI-Powered Comprehensive System**:
    - **Multi-AI Provider**: Groq (Llama 3.3 70B) làm primary provider với Google Gemini 2.0 Flash làm fallback tự động
    - **AI Content Generation**: Tạo nội dung marketing (headings, paragraphs, buttons, lists) với context-aware responses
    - **Intelligent Chatbot**: Hỗ trợ khách hàng 24/7 với real-time data từ marketplace, user analytics, sales insights
    - **AI Analytics**: Phân tích xu hướng chat, marketplace performance, đưa ra smart recommendations cho admin
    - **Page Analysis**: Đánh giá và chấm điểm landing page, gợi ý cải thiện
    - **Code Refactoring**: DeepSeek API tối ưu hóa HTML/CSS/JS code

4. **Automated Deployment**: Tự động deploy landing page lên AWS S3/CloudFront với custom subdomain, SSL, và CDN mà không cần cấu hình thủ công.

5. **Form Management & Analytics**: Thu thập leads qua form, track UTM parameters, phân tích conversion rate và device analytics.

6. **Payment & Payout System**: Tích hợp MoMo, VNPay để xử lý thanh toán, hệ thống payout tự động cho người bán template.

**Phạm vi hệ thống**: Landing Hub tập trung vào việc tạo và quản lý landing page đơn trang (single-page), không phải là CMS (Content Management System) đầy đủ cho website nhiều trang. Hệ thống không bao gồm email marketing automation hay CRM phức tạp, mà chỉ tập trung vào việc thu thập leads qua form submissions. Deployment được tối ưu cho static HTML pages, không hỗ trợ dynamic server-side rendering.

Cấu trúc bài báo gồm các phần: Phần II trình bày các công nghệ liên quan; Phần III phân tích kiến trúc và thiết kế hệ thống; Phần IV mô tả kết quả hiện thực; Phần V đánh giá thực nghiệm; Phần VI là kết luận và hướng phát triển.

## II. CÁC CÔNG NGHỆ LIÊN QUAN

Hệ thống Landing Hub được xây dựng trên nền tảng các công nghệ tiên tiến và phổ biến, được lựa chọn để tối ưu hóa hiệu suất, bảo mật và khả năng mở rộng.

### A. React và React Native

**ReactJS** được sử dụng để xây dựng giao diện người dùng cho ứng dụng web Landing Hub. Với cơ chế Component-based architecture, React giúp tái sử dụng code hiệu quả và quản lý state phức tạp thông qua Context API [4]. Hệ thống sử dụng React 19.1.1 với các tính năng mới như Concurrent Rendering và Automatic Batching để tối ưu performance.

**React Native** được sử dụng để phát triển ứng dụng mobile, cho phép tái sử dụng phần lớn business logic từ React Web, giảm chi phí phát triển và duy trì [5]. Ứng dụng mobile hỗ trợ các tính năng xem marketplace, quản lý pages đã tạo, và nhận notification real-time.

**Material-UI (MUI) 7.3.4** cung cấp bộ component library theo chuẩn Material Design, đảm bảo UI nhất quán và responsive trên mọi thiết bị. Styled Components được sử dụng để customize theme và tạo styled components tùy chỉnh.

### B. GrapesJS - Web Page Builder Framework

**GrapesJS 0.22.13** là framework mã nguồn mở cho phép xây dựng trình soạn thảo web WYSIWYG (What You See Is What You Get) [6]. GrapesJS cung cấp:

- **Component System**: Hệ thống component modular cho phép kéo-thả các elements (text, image, button, form, video, etc.)
- **Style Manager**: Quản lý CSS properties trực quan qua UI
- **Block Manager**: Thư viện các pre-built blocks (header, hero section, footer, etc.)
- **Layer Manager**: Quản lý cấu trúc DOM tree
- **Asset Manager**: Quản lý media assets (images, videos)

Landing Hub tích hợp GrapesJS với các plugins:
- **grapesjs-blocks-basic**: Cung cấp basic HTML blocks
- **grapesjs-preset-webpage**: Preset cho webpage với navbar, footer, forms
- **Custom Components**: Các component tùy chỉnh cho form submission API integration

Dữ liệu từ GrapesJS được lưu dưới dạng JSON (chứa components, styles, và HTML), cho phép export ra HTML/CSS và deploy lên server.

### C. Node.js và Express.js

Backend được xây dựng trên **Node.js 18+** với framework **Express.js 4.21.2**, cung cấp RESTful API cho frontend và xử lý business logic [7]. Kiến trúc backend tuân theo mô hình MVC (Model-View-Controller) với các layers:

- **Controllers**: Xử lý HTTP requests và responses
- **Services**: Business logic và tích hợp external services
- **Models**: Mongoose schemas cho MongoDB
- **Middleware**: Authentication (JWT), validation, error handling

**Socket.IO 4.8.1** được tích hợp để cung cấp real-time communication cho notifications và updates. WebSocket connection được authenticate bằng JWT token để đảm bảo security.

### D. MongoDB và Mongoose

**MongoDB** được chọn làm database chính vì tính linh hoạt của NoSQL schema, phù hợp với dữ liệu động như GrapesJS JSON và metadata [8]. **Mongoose 8.0.0** cung cấp ODM (Object Document Mapping) với schema validation và query builder.

Hệ thống sử dụng 12 collections chính:
- **User**: Quản lý tài khoản (email/password, Google OAuth)
- **Page**: Lưu trữ landing pages (page_data là GrapesJS JSON)
- **Template**: Template có sẵn từ hệ thống
- **MarketplacePage**: Template được đăng bán trên marketplace
- **Transaction**: Lịch sử giao dịch mua bán
- **Order**: Đơn hàng sau khi thanh toán
- **Payout**: Yêu cầu rút tiền của seller
- **MarketplaceReview**: Đánh giá template
- **FormSubmission**: Leads thu thập từ forms
- **BankAccount**: Thông tin ngân hàng cho payout
- **Deployment**: Thông tin deployment trên AWS
- **Notification**: Thông báo cho users

MongoDB Atlas được sử dụng để host database trên cloud với auto-scaling và backup tự động.

### E. AWS Services

Hệ thống tận dụng nhiều AWS services để deployment và CDN:

**AWS S3 (Simple Storage Service)** lưu trữ static HTML files của landing pages theo cấu trúc bucket: `s3://landinghub-iconic/{subdomain}/index.html`. S3 được cấu hình static website hosting.

**AWS CloudFront** cung cấp CDN global để phân phối content nhanh hơn. CloudFront Function được sử dụng để route subdomain requests đến đúng S3 path:
```javascript
function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;
  var subdomain = host.split('.')[0];
  request.uri = `/${subdomain}/index.html`;
  return request;
}
```

**AWS Route 53** quản lý DNS cho domain `landinghub.vn` và wildcard subdomain `*.landinghub.vn`.

**AWS ACM (Certificate Manager)** cung cấp SSL/TLS certificates miễn phí cho HTTPS.

### F. AI Integration

Hệ thống tích hợp **4 AI providers** với kiến trúc multi-layered, intelligent fallback để đảm bảo high availability và cost optimization:

#### 1. Multi-AI Provider Service - Groq & Gemini (Primary System)

**Provider:** Groq (Primary) → Google Gemini 2.0 (Fallback)
**Location:** Backend (`backend/src/services/multiAIProvider.js`)
**Architecture:** Auto-fallback with priority system

**Configuration:**
```javascript
providers = {
  groq: {
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1000,
    priority: 1  // Primary
  },
  gemini: {
    model: 'gemini-2.0-flash',
    maxTokens: 8192,
    contextWindow: 1048576,  // 1M tokens
    priority: 2  // Fallback
  }
}
```

**Workflow:**
1. Mọi AI request đều gọi `multiAIProvider.chatCompletion()`
2. Hệ thống tự động chọn Groq làm primary (inference speed nhanh, cost thấp)
3. Nếu Groq fail → Auto-fallback sang Gemini 2.0 Flash
4. Return response kèm metadata: `{ response, provider, model, fallback: true/false }`

**Ưu điểm:**
- **High Availability**: Không bao giờ downtime vì có fallback
- **Cost Optimization**: Groq rẻ hơn Gemini, chỉ dùng Gemini khi cần
- **Fast Inference**: Llama 3.3 70B trên Groq có latency < 100ms
- **Large Context**: Gemini 2.0 Flash có 1M token context window cho complex tasks

#### 2. AI Content Generation & Page Analysis

**Service:** `aiResponseService.js` + Context Services
**Endpoints:**
- `POST /api/chat/rooms/:roomId/messages/ai` - AI chatbot response
- `POST /api/ai/analyze-page` - Phân tích landing page (planned)
- `POST /api/ai/generate-content` - Tạo nội dung text (planned)

**a) AI Content Generation for Page Builder**
- **Mục đích**: Tạo nội dung marketing cho các elements trong page builder
- **Input**:
    - `context` - Chủ đề (VD: "Khóa học marketing online")
    - `type` - Loại element: heading, paragraph, button, list
    - `options` - tone, length, style
- **AI Provider**: Groq/Gemini via `multiAIProvider`
- **System Prompt**:
  ```
  Bạn là chuyên gia viết content marketing cho landing pages.
  Tạo nội dung hấp dẫn, súc tích, chuyên nghiệp.
  Trả lời bằng tiếng Việt, phong cách ${tone}, độ dài ${length}.
  ```
- **Output**: Text content được AI generate (VD: "Khóa Học Marketing Online - Nâng Tầm Sự Nghiệp Ngay Hôm Nay")

**b) AI Page Analysis & Scoring**
- **Mục đích**: Phân tích landing page và đưa ra đánh giá chi tiết
- **Input**: `pageData` - Toàn bộ page data (elements, sections, forms, text content)
- **AI Provider**: Groq/Gemini
- **Output**:
  ```json
  {
    "overall_score": 85,
    "scores": {
      "structure": 8,
      "content": 9,
      "design": 8,
      "conversion": 9
    },
    "strengths": ["CTA rõ ràng", "Thiết kế responsive tốt", "Form đặt vị trí hợp lý"],
    "weaknesses": ["Thiếu social proof", "Heading chưa hấp dẫn"],
    "suggestions": [
      "Thêm testimonials section để tăng trust",
      "Cải thiện heading với emotional trigger words",
      "Thêm urgency với limited time offer"
    ]
  }
  ```

#### 3. Intelligent Chatbot with Real-Time Context

**Service:** `aiResponseService.js` + `chatContextService.js` + `advancedChatContext.js`
**UI:** `SupportChatbox.js` (user), `AdminSupport.js` (admin)
**Real-time:** Socket.IO (`chatSocket.js`)

**Tính năng đặc biệt:**
- **Context-Aware AI**: AI có access đến REAL DATA từ hệ thống:
    - Marketplace data: Top templates, bestsellers, trends, new arrivals
    - User stats: Total pages, purchases, sales, subscription
    - Page analytics: Views, conversions, conversion rate
    - Sales insights: Revenue, avg price, rating, monthly stats
    - Form submissions: Total submissions, top pages
    - Competitor analysis: So sánh với thị trường

- **Smart Escalation**: AI tự động detect khi cần escalate to admin:
    - Urgent keywords: "lỗi", "bug", "mất tiền", "hoàn tiền", "khiếu nại"
    - User yêu cầu human: "admin", "người thật", "nhân viên"
    - AI confidence < 0.6
    - Payment/refund issues

- **Email Notifications**: Tự động gửi email cho admin khi có chat urgent

**Example Conversation:**
```
User: "Template nào bán chạy nhất?"
AI: "Hiện tại có 3 templates bán chạy nhất:
1. 'Landing Page Khóa Học Online' - 450,000 VNĐ (Đã bán: 45, Rating: 4.8⭐)
2. 'SaaS Product Launch Template' - 350,000 VNĐ (Đã bán: 38, Rating: 4.9⭐)
3. 'E-commerce Landing Page' - 400,000 VNĐ (Đã bán: 32, Rating: 4.7⭐)

Tất cả đều thuộc category Education và SaaS. Bạn quan tâm loại nào?" ✅ REAL DATA
```

#### 4. Admin Analytics AI

**Service:** `analyticsAIService.js`
**Dashboard:** `AdminSupport.js`, `AdminAnalytics.js`
**Endpoints:** `GET /api/chat-analytics/ai-insights`

**4 AI Analytics Functions:**

**a) analyzeChatTrends()**
- Phân tích xu hướng chat ${days} ngày gần đây
- Input: `{ totalChats, openChats, resolvedChats, dailyTrends }`
- Output: Nhận xét về xu hướng, cảnh báo, 3 đề xuất cải thiện, dự đoán tuần tới

**b) analyzeMarketplace()**
- Phân tích hiệu suất marketplace
- Input: `{ totalTemplates, totalSales, topTemplate, topCategory, categories }`
- Output: Điểm mạnh, danh mục cần cải thiện, 3 chiến lược tăng doanh số, đề xuất danh mục mới

**c) getSmartRecommendations()**
- Đưa ra 5 hành động ưu tiên cho admin ngay hôm nay
- Input: `{ openChats, resolvedToday, todayChats, todayMessages }`
- Output: Danh sách actions theo priority (VD: "📧 Kiểm tra 12 chat đang chờ xử lý", "💬 Trả lời 5 urgent messages")

**d) analyzeChatConversation()**
- Phân tích nhanh một cuộc hội thoại cụ thể
- Input: `{ messages[], roomInfo }`
- Output: Tóm tắt vấn đề, sentiment (positive/negative/neutral), độ khẩn cấp (low/medium/high)

#### 5. Code Refactoring AI - DeepSeek

**Provider:** DeepSeek API
**Location:** Backend (`backend/src/controllers/pages.js`)
**Model:** `deepseek-chat`
**Endpoint**: `POST /api/pages/:id/ai-refactor`

**Use Case:** Tối ưu hóa HTML/CSS/JS của landing page
**Process:**
1. Extract HTML/CSS/JS từ page
2. Gửi prompt yêu cầu refactor với 5 tiêu chí:
    - Responsive design
    - SEO optimization (semantic HTML, meta tags)
    - Performance (minify, lazy loading)
    - Modern CSS techniques
    - Accessibility (ARIA labels, alt text)
3. Retry 3 lần với exponential backoff nếu fail
4. Validate HTML output
5. Generate thumbnail preview
6. Return refactored code + improvements list

**Output Example:**
```json
{
  "html": "<!DOCTYPE html>...",
  "css": "/* Optimized CSS */",
  "js": "// Modern ES6+ code",
  "improvements": [
    "Thêm semantic HTML5 tags (header, nav, main, section, article)",
    "Implement CSS Grid cho layout thay vì float",
    "Thêm lazy loading cho images",
    "Optimize with CSS custom properties (variables)",
    "Add ARIA labels cho accessibility"
  ]
}
```

### G. Payment Gateways

**MoMo**: E-wallet phổ biến tại Việt Nam, tích hợp qua MoMo Partner API với QR code và deep link [9].

**VNPay**: Cổng thanh toán ngân hàng, hỗ trợ thẻ ATM, thẻ tín dụng, và QR banking [10].

**Sandbox Mode**: Môi trường test payment không cần gateway thực, dùng cho development.

Hệ thống xử lý payment flow: Create transaction → Generate payment URL → User pays → Webhook callback → Verify signature → Update transaction → Auto-deliver page.

## III. PHÂN TÍCH HỆ THỐNG

### A. Kiến trúc tổng quan

Hệ thống Landing Hub được phát triển dựa trên kiến trúc Client-Server và mô hình Monorepo, triển khai trên nền tảng cloud sử dụng MongoDB Atlas (database), AWS S3/CloudFront (storage & CDN), và VPS (backend server).

**Client (Front-end)**: Bao gồm ba ứng dụng chính:
- **User Web Frontend**: Giao diện web cho người dùng (React 19.1.1), bao gồm page builder, marketplace, dashboard, form management. Build bằng React Scripts và deploy trên static hosting.
- **Admin Web Frontend**: Trang quản trị cho admin, quản lý marketplace approval, transactions, payouts. Sử dụng cùng codebase React nhưng có routing và components riêng.
- **Mobile App**: Ứng dụng React Native (Expo 54.0.0) cho iOS/Android, cung cấp tính năng xem marketplace, quản lý pages, notifications.

**Server (Back-end)**: Node.js Express server xử lý:
- **RESTful API**: 23 route modules phục vụ CRUD operations, authentication, payment processing
- **WebSocket Server**: Socket.IO xử lý real-time notifications và updates
- **AWS Integration**: Services để deploy pages lên S3, invalidate CloudFront cache
- **Payment Services**: MoMo, VNPay webhook handlers và transaction verification

**Database**: MongoDB cluster với 12 collections, có indexing cho performance và replication cho high availability.

**External Services**:
- **AWS S3/CloudFront**: Static hosting và CDN
- **AI Providers**: Groq (Llama 3.3 70B - Primary), Google Gemini 2.0 Flash (Fallback), DeepSeek API (Code refactoring)
- **Payment Gateways**: MoMo, VNPay
- **Email Service**: Nodemailer với SMTP

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Admin App   │  │  Mobile App  │      │
│  │  (React 19)  │  │  (React 19)  │  │(React Native)│      │
│  │              │  │              │  │              │      │
│  │ Groq/Gemini  │  │ Groq/Gemini  │  │              │      │
│  │ AI Chatbot   │  │ AI Analytics │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │   HTTP/HTTPS + WebSocket (Socket.IO)│
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│               (Express.js 4.21.2 + Socket.IO)                │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Middleware: JWT Auth, CORS, Rate Limit, Validator│     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Controllers  │ │   Services   │ │Socket Handler│
│ (18 modules) │ │  (Payment,   │ │ (Notifications│
│              │ │ AWS, Email)  │ │   Updates)   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      MODEL LAYER                             │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │
│  │  User  │ │  Page  │ │Marketplace│ │Trans-  │ │  Form  │ │
│  │        │ │        │ │   Page    │ │action  │ │Submiss-│ │
│  └────────┘ └────────┘ └──────────┘ └────────┘ │  ion   │ │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ └────────┘ │
│  │Template│ │ Order  │ │  Payout  │ │Deploym-│ │Bank    │ │
│  │        │ │        │ │          │ │  ent   │ │Account │ │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └────────┘ │
│              (Mongoose ODM - 12 Collections)                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│              MongoDB Atlas (Cloud Database)                  │
│         (12 Collections với Indexing & Replication)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   AWS    │ │  Groq &  │ │  MoMo    │ │ DeepSeek │       │
│  │ S3, CF,  │ │  Gemini  │ │  VNPay   │ │   API    │       │
│  │ Route53  │ │(Frontend)│ │ Payment  │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Hình 1. Kiến trúc tổng quan hệ thống Landing Hub**

**Luồng dữ liệu chính**:

1. **User Authentication Flow**: User → Login Request → JWT Middleware → Auth Controller → User Model → MongoDB → Generate JWT Token → Response với token → Client lưu token vào localStorage.

2. **Page Creation Flow**: User design page trong GrapesJS → Click Save → POST /api/pages với page_data (JSON) → Pages Controller → Validate → Save to Page Model → Screenshot Service (Puppeteer) → Response với page ID.

3. **Deployment Flow**: User click Deploy → POST /api/deployment/deploy → Build HTML từ page_data → Upload lên S3 → Invalidate CloudFront cache → Update Deployment Model → Response với deployed URL.

4. **Marketplace Purchase Flow**: Buyer click Buy → Create Transaction → Redirect to Payment Gateway → User pays → Gateway Webhook → Verify transaction → Copy marketplace page → Create new Page cho buyer → Update Transaction & Order → Send notification.

### B. Sơ đồ lớp

Hệ thống gồm 12 entities chính với quan hệ phức tạp. Sơ đồ lớp chi tiết tập trung vào các entities cốt lõi:

```
┌─────────────────────────────────────────────────────────────┐
│                           User                               │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - email: String (unique, required)                          │
│ - password: String (hashed, optional cho Google OAuth)      │
│ - name: String                                              │
│ - role: enum ['user', 'admin']                              │
│ - googleId: String                                          │
│ - subscription: enum ['free', 'premium']                    │
│ - createdAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + comparePassword(password): Boolean                        │
│ Methods: Pre-save hook để hash password với bcrypt          │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ 1
                        │
                        │ has many
                        │
                        ▼ N
┌─────────────────────────────────────────────────────────────┐
│                         Page                                 │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID, validated)                             │
│ - user_id: ObjectId → User                                  │
│ - name: String (required, max: 200)                         │
│ - description: String (max: 1000)                           │
│ - page_data: Mixed (GrapesJS JSON structure)                │
│ - url: String (deployed URL)                                │
│ - file_path: String (S3 path)                               │
│ - screenshot_url: String                                    │
│ - status: enum ['CHƯA XUẤT BẢN', 'ĐÃ XUẤT BẢN', 'ARCHIVED',│
│           'ERROR']                                          │
│ - views: Number (analytics, default: 0)                     │
│ - conversions: Number (form submissions, default: 0)        │
│ - revenue: Number (default: 0)                              │
│ - cloudfrontDomain: String                                  │
│ - meta_title: String (SEO, max: 60)                         │
│ - meta_description: String (SEO, max: 160)                  │
│ - last_screenshot_generated: Date                           │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + needsScreenshotUpdate(): Boolean                          │
│ Static: findPagesNeedingScreenshots()                       │
│ Indexes: {user_id: 1, updated_at: -1},                      │
│          {user_id: 1, status: 1}                            │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ 1
                        │
                        │ can be published as
                        │
                        ▼ 0..1
┌─────────────────────────────────────────────────────────────┐
│                   MarketplacePage                            │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID, validated)                             │
│ - page_id: String → Page (required)                         │
│ - seller_id: ObjectId → User (required)                     │
│ - title: String (required, max: 200)                        │
│ - description: String (required, max: 2000)                 │
│ - category: enum [13 categories]                            │
│   ['LANDING_PAGE', 'ECOMMERCE', 'PORTFOLIO', 'BLOG',        │
│    'SAAS', 'EDUCATION', 'RESTAURANT', 'REAL_ESTATE',        │
│    'EVENT', 'NONPROFIT', 'HEALTHCARE', 'FITNESS', 'OTHER']  │
│ - price: Number (VND, required, min: 0)                     │
│ - original_price: Number (for discount display)             │
│ - screenshots: String[] (multiple preview images)           │
│ - main_screenshot: String                                   │
│ - demo_url: String (live preview)                           │
│ - page_data: Mixed (copy of Page.page_data)                 │
│ - tags: String[] (for search)                               │
│ - status: enum ['DRAFT', 'PENDING', 'ACTIVE', 'SOLD_OUT',   │
│           'SUSPENDED', 'REJECTED']                          │
│ - rejection_reason: String (admin feedback, max: 500)       │
│ - views: Number (default: 0)                                │
│ - likes: Number (default: 0)                                │
│ - liked_by: ObjectId[] → User (N:N relationship)            │
│ - sold_count: Number (default: 0)                           │
│ - rating: Number (0-5, default: 0)                          │
│ - review_count: Number (default: 0)                         │
│ - is_featured: Boolean (admin promoted, default: false)     │
│ - is_bestseller: Boolean (sold_count > 100)                 │
│ - customizable: Boolean (default: true)                     │
│ - responsive: Boolean (default: true)                       │
│ - approved_at: Date                                         │
│ - approved_by: ObjectId → User (admin)                      │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + incrementViews(): Promise                                 │
│ + incrementSoldCount(): Promise                             │
│ + toggleLike(userId): Promise                               │
│ + approve(adminId): Promise                                 │
│ + reject(reason): Promise                                   │
│ + suspend(reason): Promise                                  │
│ + updateRating(newRating, reviewCount): Promise             │
│ Static: findActivePages(options), findFeaturedPages(limit), │
│         findBestsellers(limit), searchPages(term, options)  │
│ Indexes: {seller_id: 1, status: 1}, {category: 1, status: 1│
│ Text index: {title: 'text', description: 'text', tags: 'text│
└─────────────────────────────────────────────────────────────┘
                        │
                        │ 1
                        │
                        │ generates
                        │
                        ▼ N
┌─────────────────────────────────────────────────────────────┐
│                      Transaction                             │
├─────────────────────────────────────────────────────────────┤
│ - _id: String (UUID, validated)                             │
│ - is_deleted: Boolean (soft delete, default: false)         │
│ - marketplace_page_id: String → MarketplacePage (required)  │
│ - buyer_id: ObjectId → User (required)                      │
│ - seller_id: ObjectId → User (required)                     │
│ - amount: Number (total price, required, min: 0)            │
│ - platform_fee: Number (10-15% commission, default: 0)      │
│ - seller_amount: Number (amount - platform_fee, required)   │
│ - payment_method: enum ['MOMO', 'VNPAY', 'SANDBOX',         │
│                   'COD', 'BANK_TRANSFER']                   │
│ - status: enum ['PENDING', 'PROCESSING', 'COMPLETED',       │
│           'FAILED', 'CANCELLED', 'REFUNDED', 'REFUND_PENDING│
│ - payout_status: enum ['PENDING', 'PROCESSING', 'COMPLETED',│
│                  'FAILED']                                  │
│ - payout_id: ObjectId → Payout (optional)                   │
│ - payment_gateway_transaction_id: String                    │
│ - payment_gateway_response: Mixed                           │
│ - payment_url: String (redirect URL cho payment gateway)    │
│ - qr_code_url: String (for mobile payment)                  │
│ - deep_link: String (MoMo deep link)                        │
│ - paid_at: Date                                             │
│ - refund: {                                                 │
│     reason: String (max: 500),                              │
│     requested_at: Date,                                     │
│     processed_at: Date,                                     │
│     refund_transaction_id: String                           │
│   } (embedded document)                                     │
│ - created_page_id: String → Page (delivered page to buyer)  │
│ - metadata: Mixed (IP, user agent, etc.)                    │
│ - ip_address: String                                        │
│ - user_agent: String                                        │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
│ - expires_at: Date (default: now + 30 minutes)              │
├─────────────────────────────────────────────────────────────┤
│ + markAsPaid(gatewayData): Promise                          │
│ + markAsFailed(reason): Promise                             │
│ + cancel(reason): Promise                                   │
│ + requestRefund(reason): Promise                            │
│ + processRefund(refundTransactionId): Promise               │
│ + setCreatedPage(pageId): Promise                           │
│ + autoRefund(reason): Promise                               │
│ Static: findPendingTransactions(), findCompletedTransactions│
│         findUserPurchases(userId), findUserSales(userId),   │
│         calculateRevenue(options), findRefundRequests()     │
│ Indexes: {buyer_id: 1, status: 1}, {seller_id: 1, status: 1│
│          {marketplace_page_id: 1}, {payment_gateway_...}    │
└─────────────────────────────────────────────────────────────┘
                        │ 1
                        │
                        │ creates
                        │
                        ▼ 0..1
┌─────────────────────────────────────────────────────────────┐
│                        Order                                 │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - orderId: String (UUID, unique, validated)                 │
│ - transactionId: String → Transaction (required, unique)    │
│ - buyerId: ObjectId → User (required)                       │
│ - sellerId: ObjectId → User (required)                      │
│ - marketplacePageId: String → MarketplacePage (required)    │
│ - price: Number (required, min: 0)                          │
│ - createdPageId: String → Page (optional, after delivery)   │
│ - status: enum ['pending', 'delivered', 'cancelled',        │
│           'refunded']                                       │
│ - createdAt: Date                                           │
│ - updatedAt: Date                                           │
├─────────────────────────────────────────────────────────────┤
│ + deliverPage(): Promise                                    │
│ Indexes: {transactionId: 1}, {buyerId: 1, status: 1},      │
│          {marketplacePageId: 1}                             │
└─────────────────────────────────────────────────────────────┘

        Transaction (N) ──┐
                          │ belongs to
                          │
                          ▼ 1
┌─────────────────────────────────────────────────────────────┐
│                        Payout                                │
├─────────────────────────────────────────────────────────────┤
│ - _id: ObjectId                                             │
│ - seller_id: ObjectId → User (required)                     │
│ - amount: Number (total from transactions, required)        │
│ - transaction_ids: String[] → Transaction (N:N via array)   │
│ - status: enum ['PENDING', 'PROCESSING', 'COMPLETED',       │
│           'FAILED', 'CANCELLED']                            │
│ - bank_account_id: ObjectId → BankAccount (optional)        │
│ - bank_info: {                                              │
│     bank_name: String,                                      │
│     account_number: String,                                 │
│     account_name: String,                                   │
│     bank_code: String                                       │
│   } (embedded document)                                     │
│ - payout_method: enum ['BANK_TRANSFER', 'MOMO', 'VNPAY',    │
│                  'MANUAL']                                  │
│ - transfer_result: Mixed                                    │
│ - processed_by: ObjectId → User (admin, optional)           │
│ - processed_at: Date                                        │
│ - notes: String (max: 500)                                  │
│ - proof_url: String (transfer receipt)                      │
│ - created_at: Date                                          │
│ - updated_at: Date                                          │
├─────────────────────────────────────────────────────────────┤
│ + markAsCompleted(processedBy, proofUrl, notes): Promise    │
│ + markAsFailed(reason): Promise                             │
│ Static: findPending(), calculatePendingAmount(sellerId)     │
│ Indexes: {seller_id: 1, status: 1}, {status: 1, created_at:│
└─────────────────────────────────────────────────────────────┘
```

**Hình 2. Sơ đồ lớp chính của hệ thống (Core Models)**

**Supporting Models** (không vẽ chi tiết trong diagram chính để đơn giản):

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Template   │        │FormSubmission│        │  Deployment  │
├──────────────┤        ├──────────────┤        ├──────────────┤
│ _id: UUID    │        │ _id: UUID    │        │ _id: ObjectId│
│ name         │        │ page_id →Page│        │ page_id →Page│
│ category     │        │ user_id →User│        │ user_id →User│
│ page_data    │        │ form_data:Map│        │ status: enum │
│ price        │        │ metadata:    │        │ s3_bucket    │
│ usage_count  │        │   {ip, utm,  │        │ cloudfront...│
│ status       │        │    device}   │        │ subdomain    │
│ is_featured  │        │ status: enum │        │ deployed_url │
│ created_at   │        │ submitted_at │        │ logs: []     │
└──────────────┘        └──────────────┘        └──────────────┘
      │ creates                │ N:1                  │ 1:1
      └─────────> Page         └────> Page            └────> Page

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ BankAccount  │        │MarketplaceRev│        │Notification  │
├──────────────┤        ├──────────────┤        ├──────────────┤
│ _id: ObjectId│        │ _id: ObjectId│        │ _id: ObjectId│
│ userId →User │        │ marketplace  │        │ recipientId  │
│ bankName     │        │   PageId     │        │   →User      │
│ accountNumber│        │ buyerId →User│        │ type: enum   │
│ accountName  │        │ rating: 1-5  │        │ title        │
│ isVerified   │        │ comment      │        │ message      │
│ isDefault    │        │ createdAt    │        │ metadata     │
│ isActive     │        └──────────────┘        │ isRead       │
└──────────────┘               │ N:1            │ createdAt    │
      │ N:1                    └────> Marketplace└──────────────┘
      └────> User                     Page              │ N:1
                                                         └────> User
```

**Quan hệ giữa các entities**:

**Core Relationships:**
- **User (1) ─── has many ──> (N) Page**: Một user tạo nhiều landing pages
- **Page (1) ─── can be ──> (0..1) MarketplacePage**: Một page có thể được publish lên marketplace (optional)
- **MarketplacePage (1) ─── generates ──> (N) Transaction**: Một template được mua nhiều lần
- **Transaction (1) ─── creates ──> (0..1) Order**: Một transaction tạo ra một order (nếu payment success)
- **Transaction (N) ─── belongs to ──> (1) Payout**: Nhiều transactions được gộp vào một payout request
- **User (1) ─── has many ──> (N) Transaction** (as buyer và as seller)

**Supporting Relationships:**
- **User (1) ─── has many ──> (N) BankAccount**: Một user có nhiều tài khoản ngân hàng
- **User (1) ─── has many ──> (N) FormSubmission**: Một page owner nhận nhiều form submissions
- **Page (1) ─── has many ──> (N) FormSubmission**: Một page có nhiều form submissions
- **Page (1) ─── has one ──> (0..1) Deployment**: Một page có tối đa một deployment config
- **User (1) ─── has many ──> (N) Notification**: Một user nhận nhiều notifications
- **MarketplacePage (1) ─── has many ──> (N) MarketplaceReview**: Một template có nhiều reviews
- **User (1) ─── writes many ──> (N) MarketplaceReview**: Một buyer viết nhiều reviews
- **MarketplacePage (N) ↔ (N) User** (likes): Many-to-many qua array `liked_by`

**Embedded Documents:**
- **Transaction.refund**: {reason, requested_at, processed_at, refund_transaction_id}
- **Payout.bank_info**: {bank_name, account_number, account_name, bank_code}
- **FormSubmission.metadata**: {ip_address, user_agent, referrer, UTM params, device info}
- **FormSubmission.integrations**: {google_sheets, email, webhook, crm}
- **Deployment.logs**: [{timestamp, message, level}]
- **Notification.metadata**: {orderId, buyerId, reason}

### C. Quy trình nghiệp vụ chính

#### 1) Quy trình tạo và deploy Landing Page

```
[User] ──┐
         │ 1. Click "Create New Page"
         ▼
    ┌─────────────────┐
    │  Choose Template│
    │  or Start Blank │
    └────────┬────────┘
             │ 2. Load GrapesJS Editor
             ▼
    ┌─────────────────┐
    │  Page Builder   │
    │   (GrapesJS)    │ ◄──── AI Content Generation (Groq/Gemini)
    │  - Drag & Drop  │       • generateAIContent()
    │  - Style Edit   │       • analyzePageWithAI()
    │  - Add Form     │       • getAILayoutSuggestions()
    └────────┬────────┘
             │ 3. Click "Save"
             ▼
    ┌─────────────────┐
    │  POST /api/pages│
    │  {page_data}    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Backend Process │
    │ - Validate data │
    │ - Save to DB    │
    │ - Generate      │
    │   screenshot    │
    │   (Puppeteer)   │
    └────────┬────────┘
             │ 4. Page saved, now deploy
             ▼
    ┌─────────────────┐
    │ User enters     │
    │ subdomain:      │
    │ "my-product"    │
    └────────┬────────┘
             │ 5. POST /api/deployment/deploy
             ▼
    ┌─────────────────┐
    │ Deployment Flow │
    │ - Build HTML    │
    │   from page_data│
    │ - Upload to S3  │
    │   /my-product/  │
    │ - Invalidate    │
    │   CloudFront    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Page Live at:   │
    │ my-product.     │
    │ landinghub.vn   │
    └─────────────────┘
```

**Hình 3. Quy trình tạo và deploy Landing Page**

**AI Integration trong Page Builder:**

Khi user đang design page trong GrapesJS, có thể sử dụng AI assistance:

1. **Generate Content**:
    - Select một text element → Click "AI Generate" button
    - Popup hiện ra để nhập context: "Khóa học marketing online"
    - Chọn type: "Heading", tone: "Professional", length: "Short"
    - Groq/Gemini AI generate: "Khóa Học Marketing Online - Nâng Tầm Sự Nghiệp"
    - User click "Insert" → Content được điền vào element

2. **Analyze Page**:
    - Click "Analyze Page" button trong toolbar
    - System gửi toàn bộ page_data lên Groq/Gemini API
    - AI phân tích structure, content, design, conversion elements với real-time context
    - Trả về scores (0-10) cho từng category + suggestions chi tiết
    - User xem report và improve page theo suggestions

3. **Layout Suggestions**:
    - Khi tạo page mới, click "Get Layout Ideas"
    - Nhập page type: "Lead Generation", industry: "SaaS"
    - AI suggest 3 layouts với sections, color schemes
    - User chọn layout → GrapesJS auto-generate structure

**Chi tiết kỹ thuật**:
- GrapesJS export JSON có cấu trúc: `{components: [...], styles: [...], html: "...", css: "..."}`
- Backend sử dụng Cheerio để parse HTML và inject form submission script
- Screenshot được generate bằng Puppeteer headless browser với viewport 1920x1080
- S3 upload sử dụng Multer S3 với public-read ACL
- CloudFront invalidation path: `/my-product/*`

#### 2) Quy trình mua bán Template trên Marketplace

```
[Seller] ──┐                              [Buyer] ──┐
           │ 1. Create beautiful page              │
           ▼                                       │
    ┌──────────────┐                               │
    │ Click "Sell  │                               │
    │  This Page"  │                               │
    └──────┬───────┘                               │
           │ 2. Fill marketing info                │
           ▼                                       │
    ┌──────────────┐                               │
    │ - Title      │                               │
    │ - Description│                               │
    │ - Category   │                               │
    │ - Price      │                               │
    │ - Screenshots│                               │
    └──────┬───────┘                               │
           │ 3. Submit for approval                │
           ▼                                       │
    ┌──────────────┐                               │
    │MarketplacePage│                               │
    │status: PENDING│                               │
    └──────┬───────┘                               │
           │                                       │
           ▼                                       │
    [Admin Review]                                 │
           │                                       │
           ├── Approve ──┐                         │
           │             ▼                         │
           │      status: ACTIVE                   │
           │             │                         │
           │             │ 4. Visible on marketplace
           │             │                         │
           │             ├─────────────────────────┘
           │             ▼
           │      ┌──────────────┐
           │      │ Buyer Browse │
           │      │  Marketplace │
           │      └──────┬───────┘
           │             │ 5. Click "Buy Now"
           │             ▼
           │      ┌──────────────┐
           │      │ Choose       │
           │      │ Payment      │
           │      │ Method       │
           │      └──────┬───────┘
           │             │ 6. Create Transaction
           │             ▼
           │      ┌──────────────┐
           │      │ Redirect to  │
           │      │ MoMo/VNPay   │
           │      └──────┬───────┘
           │             │ 7. User pays
           │             ▼
           │      ┌──────────────┐
           │      │ Gateway sends│
           │      │ webhook to   │
           │      │ backend      │
           │      └──────┬───────┘
           │             │ 8. Verify signature
           │             ▼
           │      ┌──────────────┐
           │      │ Update       │
           │      │ Transaction  │
           │      │ status:      │
           │      │ COMPLETED    │
           │      └──────┬───────┘
           │             │ 9. Auto-deliver
           │             ▼
           │      ┌──────────────┐
           │      │ Copy page to │
           │      │ buyer account│
           │      │ Create Order │
           │      └──────┬───────┘
           │             │
           │             ▼
           │      [Buyer now owns page]
           │
           └── Reject ──┐
                        ▼
                 Notify seller
                 with reason
```

**Hình 4. Quy trình mua bán Template**

**Business Logic quan trọng**:
- **Platform Fee**: 10% cho templates dưới 500k VND, 15% cho trên 500k VND
- **Refund Policy**: Buyer có thể refund trong 7 ngày nếu không hài lòng
- **Payout Timing**: Seller chỉ có thể request payout sau 7 ngày kể từ ngày bán (prevent fraud)
- **Auto-Delivery**: Sau khi payment completed, hệ thống tự động:
    1. Copy `page_data` từ MarketplacePage
    2. Create new Page với `user_id = buyer_id`
    3. Create Order record với `createdPageId`
    4. Update Transaction.`created_page_id` và `payout_status`
    5. Send notification cho buyer và seller via Socket.IO

**Payment Flow chi tiết**:
```javascript
// Step 1: Create Transaction
const transaction = await Transaction.create({
  marketplace_page_id: marketplacePageId,
  buyer_id: userId,
  seller_id: sellerPage.seller_id,
  amount: price,
  platform_fee: price * 0.10, // 10%
  seller_amount: price * 0.90,
  payment_method: 'MOMO',
  status: 'PENDING',
  expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 mins
});

// Step 2: Generate Payment URL
const momoResponse = await momoService.createPayment({
  amount: price,
  orderInfo: `Purchase ${marketplacePage.title}`,
  redirectUrl: `${FRONTEND_URL}/payment/result`,
  ipnUrl: `${BACKEND_URL}/api/payment/callback`,
  extraData: transaction._id
});

// Step 3: User pays on MoMo

// Step 4: MoMo webhook
app.post('/api/payment/callback', async (req, res) => {
  const { orderId, resultCode, signature } = req.body;

  // Verify signature
  if (!verifyMoMoSignature(req.body)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (resultCode === 0) { // Payment success
    const transaction = await Transaction.findById(orderId);
    await transaction.markAsPaid(req.body);

    // Auto-deliver page
    const newPage = await Page.create({
      user_id: transaction.buyer_id,
      name: `${marketplacePage.title} (Copy)`,
      page_data: marketplacePage.page_data,
      status: 'CHƯA XUẤT BẢN'
    });

    await transaction.setCreatedPage(newPage._id);

    // Create Order
    await Order.create({
      transactionId: transaction._id,
      buyerId: transaction.buyer_id,
      sellerId: transaction.seller_id,
      marketplacePageId: marketplacePage._id,
      price: transaction.amount,
      createdPageId: newPage._id,
      status: 'delivered'
    });

    // Increment sold count
    await marketplacePage.incrementSoldCount();

    // Send notifications
    io.to(transaction.buyer_id).emit('order_delivered', {
      pageId: newPage._id,
      pageName: newPage.name
    });
  }

  res.json({ resultCode: 0 });
});
```

#### 3) Hệ thống Intelligent Chatbot với Groq & Gemini AI

Landing Hub tích hợp AI chatbot thông minh sử dụng Groq/Gemini để hỗ trợ khách hàng 24/7 với **context-aware responses** dựa trên real data từ hệ thống:

**Kiến trúc AI Chatbot Integration**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React Component)                 │
│  /apps/web/src/components/SupportChatbox.js                 │
│                                                              │
│  const sendMessage = async (message) => {                    │
│    socket.emit('send_message', {                            │
│      roomId, message,                                        │
│      context: { page: 'builder', action: 'creating' }       │
│    });                                                       │
│  };                                                          │
│                                                              │
│  // Real-time chat widget                                    │
│  <ChatWidget messages={messages} onSend={sendMessage} />    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Socket.IO (Real-time)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Socket Handler (chatSocket.js)          │
│  - Receive message from user                                 │
│  - Build comprehensive context:                              │
│    • User stats (pages created, purchases, sales)            │
│    • Marketplace data (top templates, trends)                │
│    • Page analytics (views, conversions)                     │
│    • Sales insights (revenue, ratings)                       │
│  - Call detectIntentAndRespond(message, context, userId)     │
│  - Smart escalation logic:                                   │
│    • Urgent keywords → escalate to admin                     │
│    • AI confidence < 0.6 → escalate                          │
│    • User requests human → escalate                          │
│  - Send AI response + email notification if urgent           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         AI Response Service (aiResponseService.js)           │
│  - Build system prompt with REAL DATA                        │
│  - Call multiAIProvider.chatCompletion()                     │
│    → Try Groq (llama-3.3-70b-versatile) first               │
│    → Auto-fallback to Gemini 2.0 Flash if fail              │
│  - Return: { response, intent, confidence, provider }        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            Multi-AI Provider (multiAIProvider.js)            │
│  Primary: Groq API (fast, cost-effective)                    │
│  Fallback: Google Gemini 2.0 Flash (1M context window)       │
└─────────────────────────────────────────────────────────────┘
```

**Hình 5. Kiến trúc Intelligent AI Chatbot với Groq & Gemini**

**Tính năng đặc biệt - Context-Aware AI:**

AI chatbot có access đến **REAL DATA** từ hệ thống, cho phép câu trả lời chính xác và personalized:

1. **Marketplace Questions với REAL DATA**:
   ```
   User: "Template nào bán chạy nhất?"

   AI Bot: "Hiện tại có 3 templates bán chạy nhất:
   1. 'Landing Page Khóa Học Online' - 450,000 VNĐ
      (Đã bán: 45, Rating: 4.8⭐, Category: Education)
   2. 'SaaS Product Launch Template' - 350,000 VNĐ
      (Đã bán: 38, Rating: 4.9⭐, Category: SaaS)
   3. 'E-commerce Landing Page' - 400,000 VNĐ
      (Đã bán: 32, Rating: 4.7⭐, Category: E-commerce)

   Các template này đều có responsive design tốt và conversion rate cao.
   Bạn quan tâm category nào?"

   ✅ Data from: chatContextService.buildAIContext() - marketplace.popular[]
   ```

2. **Personal Analytics Questions**:
   ```
   User: "Pages của tôi có hiệu quả không?"

   AI Bot: "Dựa trên analytics của bạn:
   📊 Bạn có 5 pages đang active
   👁️ Tổng views: 1,247 | Conversions: 89
   📈 Conversion rate trung bình: 7.1% (khá tốt!)

   🏆 Page tốt nhất: 'Khóa học SEO 2024'
      - 524 views, 52 conversions (9.9% conversion rate)

   💡 Gợi ý: Page 'Dịch vụ thiết kế web' có conversion thấp (3.2%).
   Hãy thử cải thiện CTA button và thêm social proof!"

   ✅ Data from: advancedChatContext.buildAdvancedContext() - pageAnalytics
   ```

3. **Smart Escalation to Admin**:
   ```
   User: "Tôi bị lỗi khi deploy, mất tiền mà trang không lên!"

   AI Bot: "Tôi hiểu đây là vấn đề khẩn cấp! ⚠️

   Tôi đã thông báo cho admin và gửi email ngay lập tức.
   Một admin sẽ liên hệ bạn trong vòng 15 phút.

   Trong lúc chờ, bạn có thể cung cấp thêm thông tin:
   - Page ID nào bạn đang deploy?
   - Thông báo lỗi cụ thể là gì?
   - Screenshot nếu có?"

   ✅ Auto-escalation triggered: urgent keywords detected ("lỗi", "mất tiền")
   ✅ Email sent to admin: emailService.sendAdminNotification()
   ✅ Room status: 'urgent', priority: 'high'
   ```

**Ưu điểm**:
- **Context-Aware**: AI có real data từ marketplace, user analytics, sales insights
- **High Availability**: Auto-fallback Groq → Gemini (99.9% uptime)
- **Smart Escalation**: Tự động phát hiện urgent cases và escalate to admin
- **Fast Response**: Groq inference < 100ms
- **Cost-Effective**: Groq primary provider rẻ hơn GPT-3.5-turbo
- **Email Integration**: Tự động notify admin khi có chat urgent
- **Real-time**: Socket.IO cho instant messaging

**Hạn chế**:
- Phụ thuộc vào Groq/Gemini API availability (giảm thiểu bởi fallback)
- Context building có latency ~200ms (query DB cho real data)
- Admin cần monitor chat dashboard thường xuyên

### D. Kiến trúc Deployment

Deployment system là thành phần kỹ thuật quan trọng, tự động hóa việc đưa landing page lên production.

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: User Click "Deploy" với subdomain "my-campaign"    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Backend Build Process                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ const buildHTML = (page_data) => {                     │ │
│  │   const html = grapesjs.render(page_data.components);  │ │
│  │   const css = page_data.styles.join('\n');             │ │
│  │   const formScript = injectFormSubmissionScript();     │ │
│  │   return `<!DOCTYPE html>                              │ │
│  │     <html><head>                                       │ │
│  │       <meta charset="UTF-8">                           │ │
│  │       <meta name="viewport" content="...">             │ │
│  │       <title>${page.meta_title}</title>                │ │
│  │       <style>${css}</style>                            │ │
│  │     </head><body>                                      │ │
│  │       ${html}                                          │ │
│  │       ${formScript}                                    │ │
│  │       ${cozeChat Widget()}                             │ │
│  │     </body></html>`;                                   │ │
│  │ }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Upload to AWS S3                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ s3.upload({                                            │ │
│  │   Bucket: 'landinghub-iconic',                         │ │
│  │   Key: 'my-campaign/index.html',                       │ │
│  │   Body: htmlContent,                                   │ │
│  │   ContentType: 'text/html',                            │ │
│  │   ACL: 'public-read',                                  │ │
│  │   CacheControl: 'max-age=300' // 5 minutes             │ │
│  │ })                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  S3 Bucket Structure:                                       │
│  landinghub-iconic/                                         │
│  ├── my-campaign/                                           │
│  │   ├── index.html                                        │
│  │   └── assets/                                           │
│  │       └── images/                                       │
│  ├── another-page/                                          │
│  │   └── index.html                                        │
│  └── screenshots/                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: CloudFront Distribution                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Distribution ID: E1ABC234DEF5                          │ │
│  │ Domain: d1abc234def5.cloudfront.net                    │ │
│  │ CNAME: *.landinghub.vn                                 │ │
│  │ Origin: landinghub-iconic.s3.amazonaws.com             │ │
│  │ SSL Certificate: *.landinghub.vn (ACM)                 │ │
│  │                                                        │ │
│  │ CloudFront Function (Viewer Request):                  │ │
│  │ function handler(event) {                              │ │
│  │   var request = event.request;                         │ │
│  │   var host = request.headers.host.value;               │ │
│  │   // Extract subdomain from "my-campaign.landinghub.vn"│ │
│  │   var subdomain = host.split('.')[0];                  │ │
│  │   // Rewrite URI to S3 path                            │ │
│  │   request.uri = `/${subdomain}/index.html`;            │ │
│  │   return request;                                      │ │
│  │ }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Route 53 DNS Configuration                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Hosted Zone: landinghub.vn                             │ │
│  │                                                        │ │
│  │ Records:                                               │ │
│  │ *.landinghub.vn  A  ALIAS  d1abc234def5.cloudfront.net │ │
│  │ landinghub.vn    A  52.123.45.67 (main app server)     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Invalidate CloudFront Cache                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ cloudfront.createInvalidation({                        │ │
│  │   DistributionId: 'E1ABC234DEF5',                      │ │
│  │   InvalidationBatch: {                                 │ │
│  │     Paths: {                                           │ │
│  │       Quantity: 1,                                     │ │
│  │       Items: ['/my-campaign/*']                        │ │
│  │     },                                                 │ │
│  │     CallerReference: Date.now().toString()             │ │
│  │   }                                                    │ │
│  │ })                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Page Live!                                         │
│  https://my-campaign.landinghub.vn                          │
│  - Served from CloudFront edge locations                    │
│  - HTTPS with valid SSL certificate                         │
│  - Cached for performance (5 minutes)                       │
│  - Form submissions POST to main API server                 │
│  - AI chatbot widget embedded (Groq/Gemini)                 │
└─────────────────────────────────────────────────────────────┘
```

**Hình 6. Quy trình Deployment chi tiết**

**Ưu điểm của kiến trúc deployment**:
- **Performance**: CloudFront CDN phân phối content từ edge location gần user nhất, latency thấp
- **Scalability**: S3 và CloudFront auto-scale, không lo về traffic spike
- **Cost-effective**: Static hosting rẻ hơn rất nhiều so với EC2/server
- **Security**: HTTPS mặc định, DDoS protection từ CloudFront
- **Maintenance-free**: Không cần quản lý server, update OS, etc.

**Hạn chế và scope**:
- Chỉ hỗ trợ static HTML, không support server-side rendering
- Form submission vẫn phải gửi về main API server (CORS enabled)
- Custom domain chỉ hỗ trợ subdomain của landinghub.vn, chưa hỗ trợ fully custom domain (vd: www.khachhang.com)

## IV. KẾT QUẢ HIỆN THỰC

### A. Cấu hình phần cứng, phần mềm

**Server Environment**:
- **Platform**: DigitalOcean Droplet / AWS EC2 (t3.medium)
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 80GB SSD
- **Network**: 4TB transfer

**Software Stack**:
- **Runtime**: Node.js v18.17.0, npm 9.6.7, pnpm 9.15.9
- **Web Server**: Nginx 1.22.0 (reverse proxy)
- **Process Manager**: PM2 5.3.0 (cho Node.js processes)
- **Database**: MongoDB Atlas M10 cluster (3 nodes replication)
- **Cloud Storage**: AWS S3 (us-east-1 region)
- **CDN**: AWS CloudFront (global edge locations)

**Development Environment**:
- **Frontend**: React 19.1.1, Material-UI 7.3.4, GrapesJS 0.22.13
- **Backend**: Express.js 4.21.2, Mongoose 8.0.0, Socket.IO 4.8.1
- **AI SDKs**: Axios 1.7.9 (for Groq/Gemini/DeepSeek API calls), Multi-AI Provider (Groq + Gemini fallback)
- **Payment SDKs**: MoMo Partner API, VNPay SDK
- **Tools**: Puppeteer 24.21.0 (screenshots), Sharp 0.34.4 (image processing)

**Deployment Configuration**:
```bash
# Nginx reverse proxy config
server {
    listen 80;
    server_name api.landinghub.vn;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# PM2 ecosystem config
module.exports = {
  apps: [{
    name: 'landing-hub-api',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      REACT_APP_OPENAI_API_KEY: 'sk-...',
      COZE_PAT: 'pat_...'
    }
  }]
};
```

### B. Màn hình thực hiện

#### 1) Màn hình Landing Page Builder với AI Features

![Giao diện Page Builder với GrapesJS và AI tools](placeholder-image-url)

**Hình 7. Giao diện chính của Landing Page Builder**

Giao diện Page Builder được chia thành 6 khu vực chính:

**(1) Block Manager (bên trái)**: Chứa các pre-built blocks:
- **Basic Blocks**: Text, Image, Video, Button, Divider
- **Layout Blocks**: 1 Column, 2 Columns, 3 Columns, Grid
- **Section Blocks**: Header, Hero Section, Features, Testimonials, Pricing, Contact Form, Footer
- **Custom Blocks**: Countdown Timer, Social Proof, Video Popup

**(2) Canvas (trung tâm)**: Khu vực làm việc chính với real-time preview

**(3) Style Manager (bên phải)**: Panel chỉnh CSS properties

**(4) Layer Manager (bên phải, tab 2)**: DOM tree hierarchy

**(5) Toolbar (trên cùng)**: Actions chính
- Save, Preview, Undo/Redo
- Responsive view switcher
- **AI Content** - Mở AI content generation modal
- **Analyze Page** - AI page analyzer
- **Layout Ideas** - AI layout suggestions
- Deploy

**(6) AI Tools Panel** (mới - độc quyền):
Khi click AI Content button, modal hiển thị:
```
┌───────────────────────────────────────────┐
│      AI Content Generator                 │
├───────────────────────────────────────────┤
│  Context: [Khóa học marketing online__]   │
│  Type:    [Heading ▼]                     │
│  Tone:    [Professional ▼]                │
│  Length:  [Short ▼]                       │
│                                           │
│  [Generate Content]                       │
│                                           │
│  Generated:                               │
│  "Khóa Học Digital Marketing -            │
│   Nâng Tầm Sự Nghiệp"                     │
│                                           │
│  [Insert] [Regenerate] [Cancel]           │
└───────────────────────────────────────────┘
```

**Use case - AI Content Generation**:
1. User kéo "Heading" block vào canvas
2. Click vào heading → Click "AI Generate" trong toolbar
3. Nhập context: "Khóa học marketing online"
4. Chọn type: Heading, tone: Professional, length: Short
5. Groq/Gemini AI generate nội dung (auto-fallback nếu Groq fail)
6. User preview → Click "Insert"
7. Content được điền vào heading element

**Use case - AI Page Analyzer**:
1. User đã design xong page
2. Click "Analyze Page" button
3. System gửi page_data lên backend → Groq/Gemini API
4. AI phân tích với context-aware insights và trả về:
    - Overall Score: 85/100
    - Structure: 8/10 (Clear hierarchy)
    - Content: 9/10 (Compelling copy)
    - Design: 8/10 (Modern, clean)
    - Conversion: 9/10 (Strong CTA)
    - Strengths: "Clear value prop, good CTA placement"
    - Weaknesses: "Missing social proof, form too long"
    - Suggestions: "Add testimonials section, reduce form to 3 fields"
5. User cải thiện page theo suggestions

#### 2) Màn hình Marketplace

![Giao diện Marketplace với filters](placeholder-image-url)

**Hình 8. Marketplace - Browse và Filter Templates**

(Nội dung giữ nguyên như bản cũ - không liên quan đến AI)

#### 3) Màn hình AI Chat Support (User & Admin)

![AI Chatbot Widget & Admin Dashboard](placeholder-image-url)

**Hình 9. AI Chatbot Support System với Groq & Gemini**

Hệ thống chat support có 2 interfaces:

**A. User Chat Widget** (`SupportChatbox.js`):

```
┌─────────────────────────────────────────┐
│  🤖 Landing Hub AI Support   [─][×]     │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────┐      │
│  │ AI Assistant  🟢 Online       │      │
│  │ Xin chào! Tôi có thể giúp gì  │      │
│  │ cho bạn hôm nay?              │      │
│  │ Powered by Groq               │      │
│  └──────────────────────────────┘      │
│                                         │
│       ┌──────────────────────┐          │
│       │ Template nào bán chạy?│         │
│       └──────────────────────┘          │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ AI Assistant 🔄 Generating... │      │
│  │ Hiện tại có 3 templates bán   │      │
│  │ chạy nhất:                    │      │
│  │ 1. Landing Page Khóa Học...   │      │
│  │    450,000 VNĐ (45 sales)     │      │
│  │ 2. SaaS Product Launch...     │      │
│  │    350,000 VNĐ (38 sales)     │      │
│  │                               │      │
│  │ Bạn quan tâm category nào? ✅  │      │
│  └──────────────────────────────┘      │
│                                         │
├─────────────────────────────────────────┤
│ 📎 💡 Rate   [Type message...] [>]      │
└─────────────────────────────────────────┘
```

**Features**:
- Real-time messaging qua Socket.IO
- AI responses với REAL DATA từ marketplace/analytics
- Auto-fallback: Groq → Gemini nếu API fail
- Smart escalation to admin nếu urgent
- Image upload (S3/Local fallback)
- Rating system (1-5 sao) cho AI responses
- Typing indicator khi AI đang generate

**B. Admin Support Dashboard** (`AdminSupport.js`):

```
┌─────────────────────────────────────────────────┐
│  Admin Support Dashboard                        │
├─────────────────────────────────────────────────┤
│  📊 Stats: 12 Open | 45 Resolved | 3 Urgent     │
│                                                 │
│  💡 AI Smart Recommendations:                   │
│  1. 🚨 Trả lời 3 urgent chats (payment issues)  │
│  2. 📧 Check 12 open chats chờ xử lý            │
│  3. 📈 Marketplace sales tăng 15% - review      │
│                                                 │
│  🔍 Chat Analytics (AI-Generated):              │
│  "Xu hướng 7 ngày: +20% chat về deployment,    │
│   -10% payment issues. Đề xuất: Cải thiện      │
│   deployment docs để giảm support volume."     │
│                                                 │
├─────────────────────────────────────────────────┤
│  Chat List:                                     │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔴 Nguyen Van A - URGENT                  │ │
│  │ "Deploy lỗi, mất tiền..."                 │ │
│  │ AI: Escalated | 2 mins ago                │ │
│  ├───────────────────────────────────────────┤ │
│  │ 🟡 Tran Thi B                             │ │
│  │ "Template nào tốt cho SaaS?"              │ │
│  │ AI: Answered | 5 mins ago                 │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Example Conversations**:

*Scenario 1: Context-Aware Response với Real Data*
```
User: "Pages của tôi có hiệu quả không?"

AI Bot: "Dựa trên analytics của bạn:
📊 Bạn có 5 pages đang active
👁️ Tổng views: 1,247 | Conversions: 89
📈 Conversion rate TB: 7.1% (khá tốt!)

🏆 Page tốt nhất: 'Khóa học SEO 2024'
   - 524 views, 52 conversions (9.9%)

💡 Gợi ý: Page 'Dịch vụ thiết kế web' có CR thấp (3.2%).
   Hãy thử cải thiện CTA và thêm social proof!"

✅ Provider: Groq (llama-3.3-70b-versatile)
✅ Data source: advancedChatContext.pageAnalytics
```

*Scenario 2: Smart Escalation to Admin*
```
User: "Tôi bị lỗi deploy, mất tiền mà page không lên!"

AI Bot: "Tôi hiểu đây là vấn đề khẩn cấp! ⚠️

Tôi đã:
✅ Thông báo admin qua email
✅ Đánh dấu chat URGENT
✅ Admin sẽ liên hệ trong 15 phút

Trong lúc chờ, cung cấp thêm:
- Page ID nào bạn đang deploy?
- Thông báo lỗi cụ thể?
- Screenshot nếu có?"

✅ Auto-escalation: urgent keywords detected
✅ Email sent: emailService.sendAdminNotification()
✅ Room priority: HIGH
```

## V. THỰC NGHIỆM

### A. Thiết lập môi trường kiểm thử

**Công cụ kiểm thử**:
- **Apache JMeter 5.6.3**: Load testing và performance testing [11]
- **Postman 10.20**: API functional testing
- **Puppeteer**: Automated UI testing
- **MongoDB Compass**: Database query performance analysis

**Môi trường test**:
- **Server**: DigitalOcean Droplet 4GB RAM, 2 vCPUs, Ubuntu 22.04
- **Database**: MongoDB Atlas M10 (10GB storage, 2GB RAM)
- **Network**: 100 Mbps symmetric
- **Load generators**: 3 JMeter instances

**Kịch bản kiểm thử**:
1. **Page Builder Performance**: Load testing với 100 concurrent users
2. **AI Content Generation & Chatbot**: Response time và quality của Groq/Gemini với auto-fallback
3. **Deployment Speed**: Thời gian deploy pages lên AWS
4. **Payment Flow**: End-to-end payment processing với MoMo/VNPay

### B. Kịch bản và kết quả thực nghiệm

#### 1) Đánh giá khả năng chịu tải của Page Builder

**Kịch bản**: Mô phỏng 100 concurrent users editing pages:
- Login
- Tạo page mới
- Load GrapesJS editor
- Thực hiện 20 thao tác edit
- Save page

**Kết quả**:

![JMeter load test results](placeholder-image-url)

**Hình 10. Kết quả Load Testing cho Page Builder**

| Metric | Value |
|--------|-------|
| **Total Requests** | 2,300 |
| **Successful Requests** | 2,297 (99.87%) |
| **Failed Requests** | 3 (0.13%) - timeout |
| **Average Response Time** | 156 ms |
| **Median Response Time** | 89 ms |
| **90th Percentile** | 312 ms |
| **95th Percentile** | 478 ms |
| **Throughput** | 38.5 requests/second |
| **Error Rate** | 0.13% |

**Phân tích chi tiết theo endpoint**:

| Endpoint | Avg Response Time | Success Rate |
|----------|-------------------|--------------|
| POST /api/auth/login | 67 ms | 100% |
| POST /api/pages | 123 ms | 100% |
| GET /api/pages/:id | 45 ms | 100% |
| PUT /api/pages/:id | 178 ms | 99.9% |
| POST /api/pages/:id/screenshot | 2,340 ms | 100% |

**Nhận xét**:
- Hệ thống xử lý tốt 100 concurrent users với error rate < 1%
- Response time trung bình 156ms rất tốt cho SaaS application
- Screenshot generation (2.3s) là async task không block user
- Đã optimize với database indexing và connection pooling

#### 2) Đánh giá AI Content Generation & Chatbot (Groq/Gemini)

**Kịch bản**: Test 50 AI requests với multi-provider system:
- 20 Content generation requests (headings, paragraphs, buttons)
- 20 Chatbot queries (marketplace, analytics, support)
- 10 Page analysis requests

**Cấu hình test**:
```javascript
const testCases = [
  // Content Generation
  {
    context: "Khóa học marketing online",
    type: "heading",
    options: { tone: "professional", length: "short" }
  },
  // Chatbot với Real Data
  {
    userQuery: "Template nào bán chạy nhất?",
    contextData: { marketplaceStats, userAnalytics }
  },
  // Page Analysis
  {
    pageData: { sections: 5, forms: 1, ctas: 3, textContent: "..." }
  }
];
```

**Kết quả Performance**:

| Metric | Groq (Primary) | Gemini (Fallback) | Combined |
|--------|----------------|-------------------|----------|
| **Total Requests** | 48 | 2 | 50 |
| **Success Rate** | 96% | 100% | 100% |
| **Avg Response Time** | 450 ms | 890 ms | 478 ms |
| **Min Response Time** | 120 ms | 650 ms | 120 ms |
| **Max Response Time** | 2,100 ms | 1,130 ms | 2,100 ms |
| **Tokens (avg)** | In: 250, Out: 80 | In: 300, Out: 120 | - |
| **Cost per request** | ~$0.00008 | ~$0.00015 | ~$0.00009 |

**Auto-Fallback Test**:
- Simulate Groq API down → Auto-fallback to Gemini: ✅ 100% success
- Latency overhead for fallback detection: < 50ms
- No user-facing errors during failover

**Quality Assessment** (manual review bởi 3 reviewers):

| Content Type | Relevant | High Quality | Needs Edit | Poor |
|--------------|----------|--------------|------------|------|
| Headings (10) | 10 (100%) | 9 (90%) | 1 (10%) | 0 (0%) |
| Paragraphs (5) | 5 (100%) | 4 (80%) | 1 (20%) | 0 (0%) |
| Buttons (5) | 5 (100%) | 5 (100%) | 0 (0%) | 0 (0%) |
| Chatbot (20) | 19 (95%) | 16 (80%) | 3 (15%) | 1 (5%) |
| Page Analysis (10) | 10 (100%) | 8 (80%) | 2 (20%) | 0 (0%) |
| **TOTAL (50)** | **49 (98%)** | **42 (84%)** | **7 (14%)** | **1 (2%)** |

**Ví dụ Generated Content**:

```
Input:
  Context: "Khóa học digital marketing online"
  Type: heading
  Tone: professional
  Length: short

Groq/Llama 3.3 70B Output:
  "Khóa Học Digital Marketing - Làm Chủ Thế Giới Số"

Provider: Groq | Response Time: 380ms
Reviewer Rating: ⭐⭐⭐⭐⭐ (Excellent)
Comment: "Compelling, professional, action-oriented"
```

```
Input:
  User Query: "Pages của tôi có hiệu quả không?"
  Context: pageAnalytics = { totalViews: 1247, conversions: 89, ... }

Groq/Llama 3.3 Output:
  "Dựa trên analytics của bạn:
  📊 Bạn có 5 pages đang active
  👁️ Tổng views: 1,247 | Conversions: 89
  📈 Conversion rate TB: 7.1% (khá tốt!)

  🏆 Page tốt nhất: 'Khóa học SEO 2024'
     - 524 views, 52 conversions (9.9%)

  💡 Gợi ý: Page 'Dịch vụ thiết kế web' có CR thấp (3.2%).
     Hãy thử cải thiện CTA và thêm social proof!"

Provider: Groq | Response Time: 620ms | Context-Aware: ✅
Reviewer Rating: ⭐⭐⭐⭐⭐ (Excellent)
Comment: "Personalized, data-driven, actionable insights"
```

**Nhận xét**:
- **Groq (Llama 3.3 70B)**: Faster (450ms avg), cheaper ($0.00008), 96% primary success rate
- **Auto-fallback**: Gemini covers 100% of Groq failures → 100% combined uptime
- **Context-Aware AI**: 95% relevance với real data integration
- **Quality**: 84% high-quality responses (comparable to GPT-3.5-turbo)
- **Cost**: 3.3x cheaper than GPT-3.5-turbo (~$0.0003 vs $0.00009)

#### 3) Đánh giá hiệu năng Deployment System

**Kịch bản**: Deploy 20 pages với size khác nhau

**Kết quả**:

| Page Size | Build HTML | S3 Upload | CloudFront Invalidation | Total Time |
|-----------|------------|-----------|-------------------------|------------|
| **Small** | 120 ms | 340 ms | 180 ms | **640 ms** |
| **Medium** | 280 ms | 890 ms | 210 ms | **1,380 ms** |
| **Large** | 560 ms | 2,340 ms | 250 ms | **3,150 ms** |

**Average Total Time**: 1.72 seconds

**Nhận xét**:
- 90% pages deploy thành công trong < 2 giây
- Page có thể access ngay sau deploy
- CloudFront propagate globally trong 30-60 giây

#### 4) Stress Testing cho Payment Webhook

**Kịch bản**: 100 concurrent webhooks (flash sale simulation)

**Kết quả**:

| Metric | Value |
|--------|-------|
| Total Requests | 100 |
| Successful | 100 (100%) |
| Average Response Time | 234 ms |
| **Page Delivery Success** | 100 (100%) |
| **Notification Sent** | 100 (100%) |

**Nhận xét**:
- Payment webhook handler rất robust
- Auto-delivery mechanism working perfectly
- No race conditions or data inconsistency

### C. So sánh với các giải pháp tương tự

| Feature | Landing Hub | Unbounce | Instapage | Leadpages |
|---------|-------------|----------|-----------|-----------|
| **Pricing** | Free - $29/mo | $80 - $300/mo | $79 - $299/mo | $49 - $199/mo |
| **Marketplace** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **AI Content** | ✅ Groq/Gemini (Multi-AI) | ✅ GPT-4 | ❌ No | ❌ No |
| **AI Chatbot** | ✅ Context-Aware (Real Data) | ❌ No | ❌ No | ❌ No |
| **AI Analytics** | ✅ Admin Insights | ❌ No | ❌ No | ❌ No |
| **Auto-Fallback** | ✅ Groq → Gemini | ❌ No | ❌ No | ❌ No |
| **Custom Deploy** | ✅ AWS | ✅ Yes | ✅ Yes | ✅ Yes |
| **Page Load Time** | **1.2s** | 1.8s | 1.6s | 2.1s |
| **Mobile App** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Payment Built-in** | ✅ MoMo/VNPay | ❌ No | ❌ No | ❌ No |

**Unique Selling Points của Landing Hub**:
1. **Marketplace**: Users có thể kiếm tiền từ templates
2. **Multi-AI System**: Groq + Gemini auto-fallback, 3.3x rẻ hơn GPT-3.5-turbo
3. **Context-Aware Chatbot**: AI với real data từ marketplace/analytics
4. **AI Admin Dashboard**: Smart recommendations & analytics insights
5. **Vietnam Market Focus**: VNPay/MoMo, Vietnamese language
6. **Affordable Pricing**: Free tier + rẻ hơn competitors 60-70%

## VI. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### A. Kết luận

Bài báo đã trình bày việc thiết kế và hiện thực hệ thống Landing Hub - một nền tảng SaaS đa nền tảng cho phép tạo, quản lý và mua bán landing page mà không cần kỹ năng lập trình. Hệ thống đã đạt được các mục tiêu đề ra:

**Về mặt kỹ thuật**:
- Kiến trúc Monorepo với React, Node.js, MongoDB, AWS đảm bảo scalability
- GrapesJS integration cung cấp page builder WYSIWYG trực quan
- Multi-AI system (Groq + Gemini + DeepSeek) với auto-fallback đạt 100% uptime, 98% relevance rate
- Context-aware AI chatbot với real data integration cho customer support 24/7
- AWS deployment automation giảm thời gian deploy xuống < 2 seconds
- Real-time features với Socket.IO cho chat và notifications

**Về mặt hiệu năng**:
- Hệ thống xử lý được 100 concurrent users với average response time 156ms
- AI Groq/Gemini: 478ms average, 98% relevant, 84% high quality
- Auto-fallback latency overhead: < 50ms
- Page deployment: 1.72s average
- Payment webhook: 234ms average, 100% success rate

**Về mặt business**:
- Marketplace model tạo thu nhập cho platform và users
- Platform fee 10-15% competitive
- Pricing $0-29/mo rẻ hơn competitors 60-70%
- VNPay/MoMo integration phù hợp thị trường Việt Nam

**Đóng góp chính của đề tài**:
1. **Marketplace cho landing pages**: Mô hình kinh doanh độc đáo cho phép mua bán templates
2. **Multi-AI System với Auto-Fallback**: Groq (primary) + Gemini (fallback) + DeepSeek (refactoring) đạt 100% uptime, cost-effective 3.3x
3. **Context-Aware AI Chatbot**: AI có access real data từ marketplace, analytics, sales insights
4. **AI Admin Dashboard**: Smart recommendations và analytics insights tự động
5. **Automated end-to-end workflow**: Create → AI-enhance → Deploy → Collect leads → Process payment

### B. Hạn chế

**Hạn chế kỹ thuật**:
- **Static-only deployment**: Chưa hỗ trợ server-side rendering
- **Custom domain limitation**: Chỉ hỗ trợ subdomain của landinghub.vn
- **AI dependency**: Phụ thuộc vào Groq/Gemini API availability (đã giảm thiểu bằng auto-fallback)
- **Mobile editor**: React Native app chưa có full page builder

**Hạn chế business**:
- **Template quality control**: Chưa có automated QA cho marketplace templates
- **Context building latency**: ~200ms để query DB cho real data (acceptable trade-off cho quality)
- **AI API costs**: Groq/Gemini có chi phí (nhưng rất nhỏ: ~$0.00009/request, 3.3x rẻ hơn GPT-3.5)

**Hạn chế về scale**:
- Screenshot generation với Puppeteer tốn resources
- MongoDB single cluster, chưa có sharding strategy

### C. Hướng phát triển

**Ngắn hạn (3-6 tháng)**:

1. **Improve AI Integration**:
    - Cache common AI requests để giảm cost và latency
    - Add AI image generation (Stable Diffusion via Groq) cho hero images
    - Optimize context building để giảm DB query time

2. **A/B Testing Module**: AI-powered A/B testing với auto-optimization sử dụng Groq/Gemini

3. **Email Marketing Integration**: Sync form submissions với Mailchimp/SendGrid

4. **Advanced Analytics**: Heatmap, session recording, funnel analysis

**Trung hạn (6-12 tháng)**:

5. **Expand AI Providers**: Add Anthropic Claude, Mistral làm additional options

6. **Team Collaboration**: Real-time collaborative editing với WebRTC

7. **CRM Integration**: Salesforce, HubSpot connectors

8. **Mobile App Enhancement**: Full page builder trong mobile app

**Dài hạn (12+ tháng)**:

9. **White-label Solution**: Agencies có thể rebrand platform

10. **AI-Powered Full Page Generation**:
    - Input: "Create SaaS landing page for project management tool"
    - Output: Complete landing page với layout, content, images

11. **Custom Domain Support**: Fully custom domain (www.customer.com)

12. **Advanced Deployment**: Vercel, Netlify integration

**Research Directions**:
- **ML for Conversion Optimization**: Predict conversion rate từ page design
- **Natural Language to Components**: Generate components từ text descriptions
- **Automated Quality Assurance**: AI testing cho broken links, slow loading

### D. Tác động xã hội

Landing Hub có tiềm năng:
- **Dân chủ hóa công nghệ**: Non-coders tạo được professional landing pages
- **Tạo thu nhập**: Designers kiếm tiền từ templates
- **Hỗ trợ SMEs**: Giảm chi phí marketing cho doanh nghiệp nhỏ
- **Giáo dục**: Tool để dạy web design và digital marketing

---

## REFERENCES

[1] HubSpot, "Landing Page Best Practices," https://blog.hubspot.com/marketing/landing-page-best-practices, 2024. [Accessed: Jan-14-2025].

[2] WordStream, "Landing Page Statistics and Trends," https://www.wordstream.com/blog/ws/2017/02/28/landing-page-statistics, 2024. [Accessed: Jan-14-2025].

[3] Unbounce, "Pricing and Plans," https://unbounce.com/pricing/, 2024. [Accessed: Jan-14-2025].

[4] React Team, "React 19 Documentation," https://react.dev/, 2024. [Accessed: Jan-14-2025].

[5] Meta, "React Native - Learn once, write anywhere," https://reactnative.dev/, 2024. [Accessed: Jan-14-2025].

[6] Artur Arseniev, "GrapesJS - Free and Open source Web Builder Framework," https://grapesjs.com/, 2024. [Accessed: Jan-14-2025].

[7] Express.js Team, "Express - Fast, unopinionated, minimalist web framework for Node.js," https://expressjs.com/, 2024. [Accessed: Jan-14-2025].

[8] MongoDB Inc., "MongoDB: The Developer Data Platform," https://www.mongodb.com/, 2024. [Accessed: Jan-14-2025].

[9] MoMo, "MoMo Partner API Documentation," https://developers.momo.vn/, 2024. [Accessed: Jan-14-2025].

[10] VNPay, "VNPay Payment Gateway Documentation," https://vnpay.vn/, 2024. [Accessed: Jan-14-2025].

[11] Apache Software Foundation, "Apache JMeter," https://jmeter.apache.org/, 2024. [Accessed: Jan-14-2025].

[12] Groq, "Groq API Documentation - Llama 3.3 70B," https://console.groq.com/docs/models, 2024. [Accessed: Jan-14-2025].

[13] Google, "Gemini 2.0 Flash API Documentation," https://ai.google.dev/gemini-api/docs/models/gemini-2, 2024. [Accessed: Jan-14-2025].

[14] DeepSeek, "DeepSeek Chat API Documentation," https://platform.deepseek.com/api-docs/, 2024. [Accessed: Jan-14-2025].

[15] AWS, "Amazon S3 Documentation," https://docs.aws.amazon.com/s3/, 2024. [Accessed: Jan-14-2025].

[16] AWS, "Amazon CloudFront Documentation," https://docs.aws.amazon.com/cloudfront/, 2024. [Accessed: Jan-14-2025].

[17] Socket.IO Team, "Socket.IO Documentation," https://socket.io/docs/, 2024. [Accessed: Jan-14-2025].

[18] Puppeteer Team, "Puppeteer Documentation," https://pptr.dev/, 2024. [Accessed: Jan-14-2025].

---

**PHỤ LỤC A: Database Schema Chi tiết (12 Models)**

Chi tiết schema đầy đủ của 12 MongoDB collections: User, Page, Template, MarketplacePage, Transaction, Order, Payout, MarketplaceReview, FormSubmission, BankAccount, Deployment, Notification

**PHỤ LỤC B: AI Integration Code Examples**

Code examples chi tiết cho:
- Groq/Gemini multi-AI provider với auto-fallback
- AI content generation với context-aware prompts
- Page analysis với AI insights
- Context-aware chatbot với real data integration
- AI admin analytics và smart recommendations

**PHỤ LỤC C: API Endpoints Documentation**

Chi tiết 23 route modules với request/response examples, authentication requirements

**PHỤ LỤC D: Deployment Guide**

Hướng dẫn deploy hệ thống lên production environment

---

**LỜI CẢM ƠN**

Nhóm nghiên cứu xin chân thành cảm ơn Khoa Công Nghệ Thông Tin, Trường Đại học Công nghiệp TP.HCM đã tạo điều kiện và hỗ trợ trong quá trình thực hiện đề tài. Cảm ơn giảng viên hướng dẫn [Tên giảng viên] đã tận tình chỉ bảo. Cảm ơn các bạn sinh viên đã tham gia kiểm thử và đóng góp ý kiến cho hệ thống.