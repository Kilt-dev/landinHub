# KIẾN TRÚC HỆ THỐNG LANDINGHUB

## Tài Liệu Kiến Trúc Hệ Thống
**Dự án**: LandingHub - Nền tảng tạo và quản lý Landing Page
**Sinh viên**: [Tên sinh viên]
**Trường**: [Tên trường]
**Ngành**: Công nghệ Thông tin

---

# MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Kiến Trúc Triển Khai (Deployment Architecture)](#2-kiến-trúc-triển-khai)
3. [Kiến Trúc Ứng Dụng (Application Architecture)](#3-kiến-trúc-ứng-dụng)
4. [Sơ Đồ UML](#4-sơ-đồ-uml)
5. [Sơ Đồ ERD](#5-sơ-đồ-erd)
6. [Luồng Xử Lý (Sequence Diagrams)](#6-luồng-xử-lý)
7. [Công Nghệ Sử Dụng](#7-công-nghệ-sử-dụng)

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1. Mô Tả Hệ Thống

LandingHub là hệ thống quản lý và tạo landing page tự động, cho phép người dùng:
- Tạo landing page bằng drag-and-drop editor
- Xuất bản landing page với custom domain
- Thu thập leads từ form submissions
- Mua bán landing page templates trên marketplace
- Nhận thanh toán qua cổng thanh toán điện tử (MoMo, VNPay)
- Nhận hỗ trợ từ AI chatbot và admin

## 1.2. Đặc Điểm Kỹ Thuật

- **Kiến trúc**: Microservices + Serverless
- **Frontend**: Single Page Application (SPA) - React
- **Backend**: RESTful API - Node.js/Express
- **Database**: NoSQL - MongoDB
- **Real-time**: WebSocket - AWS API Gateway
- **Cloud**: AWS (Lambda, S3, CloudFront, DynamoDB, API Gateway)
- **Deployment**: Serverless Framework
- **CI/CD**: Git-based deployment

## 1.3. Người Dùng Hệ Thống

1. **User (Người dùng thường)**: Tạo landing page, mua templates
2. **Admin (Quản trị viên)**: Quản lý toàn bộ hệ thống
3. **Seller (Người bán)**: Đăng bán landing page templates
4. **Buyer (Người mua)**: Mua landing page templates

---

# 2. KIẾN TRÚC TRIỂN KHAI

## 2.1. Sơ Đồ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET USERS                               │
│                    (Web Browsers, Mobile Apps)                       │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ├─────────── HTTPS ────────────┐
                     │                              │
                     ▼                              ▼
        ┌────────────────────────┐    ┌────────────────────────┐
        │   CloudFront CDN       │    │  Route 53 DNS          │
        │  (Content Delivery)    │    │  (Domain Management)   │
        └────────┬───────────────┘    └────────────────────────┘
                 │
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌──────────────────┐
│   S3 Bucket  │      │  Vercel/Netlify  │
│   (Static    │      │   (Frontend App) │
│   Landing    │      │   React SPA      │
│   Pages)     │      └────────┬─────────┘
└──────────────┘               │
                               │ REST API
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌───────────────────────┐     ┌──────────────────────┐
    │  AWS Lambda           │     │  EC2 / Heroku        │
    │  (Serverless Backend) │     │  (Node.js Backend)   │
    │  + API Gateway        │     │  Express Server      │
    └──────────┬────────────┘     └──────────┬───────────┘
               │                             │
               │                             │
    ┌──────────┴─────────────────────────────┴─────────┐
    │                                                    │
    │              APPLICATION LAYER                    │
    │                                                    │
    ├─────────┬──────────┬──────────┬──────────────────┤
    │         │          │          │                  │
    ▼         ▼          ▼          ▼                  ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐      ┌──────────────┐
│MongoDB │ │DynamoDB│ │  S3   │ │CloudFront│    │ WebSocket    │
│(Main DB│ │(WebSocket│(File  │ │(CDN)   │    │ API Gateway  │
│ Atlas) │ │Connections│Storage│ │        │    │              │
└────────┘ └──────┘ └────────┘ └────────┘      └──────────────┘
    │                   │
    │                   │
    ▼                   ▼
┌────────────────────────────────────┐
│     EXTERNAL SERVICES              │
├────────────────────────────────────┤
│ • MoMo Payment Gateway             │
│ • VNPay Payment Gateway            │
│ • OpenAI / Gemini AI               │
│ • AWS SES (Email)                  │
│ • CloudWatch (Monitoring)          │
└────────────────────────────────────┘
```

## 2.2. Kiến Trúc Chi Tiết Theo Lớp

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Landing Page │  │  Dashboard   │  │  Marketplace │        │
│  │   Viewer     │  │    (Admin/   │  │     Page     │        │
│  │  (S3+CDN)    │  │    User)     │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                 │                  │                 │
│         └─────────────────┴──────────────────┘                │
│                           │                                    │
│                    React Application                           │
│                    (Vercel/Netlify)                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  API Gateway   │
                    │  (HTTPS/WSS)   │
                    └───────┬────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Node.js/Express Backend                      │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │ Controllers │  │  Services   │  │   Models    │     │  │
│  │  │             │  │             │  │             │     │  │
│  │  │ • User      │  │ • Auth      │  │ • User      │     │  │
│  │  │ • Page      │  │ • Page      │  │ • Page      │     │  │
│  │  │ • Marketplace│ │ • Payment  │  │ • Order     │     │  │
│  │  │ • Payment   │  │ • WebSocket│  │ • Transaction│    │  │
│  │  │ • Chat      │  │ • Email    │  │ • ChatRoom  │     │  │
│  │  │ • Form      │  │ • AI       │  │ • FormSubmission│ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Lambda Functions (Serverless)                   │  │
│  │                                                            │  │
│  │  • websocketConnect    (WebSocket authentication)         │  │
│  │  • websocketDisconnect (Connection cleanup)               │  │
│  │  • websocketDefault    (Message routing)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                      DATA LAYER                                   │
│                                                                   │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │   MongoDB      │  │  DynamoDB   │  │   AWS S3     │         │
│  │   (Primary)    │  │  (WebSocket)│  │  (Storage)   │         │
│  │                │  │             │  │              │         │
│  │ Collections:   │  │ Tables:     │  │ Buckets:     │         │
│  │ • users        │  │ • websocket-│  │ • pages/     │         │
│  │ • pages        │  │   connections│ │ • uploads/   │         │
│  │ • orders       │  │             │  │ • templates/ │         │
│  │ • transactions │  │             │  │              │         │
│  │ • chatrooms    │  │             │  │              │         │
│  │ • chatmessages │  │             │  │              │         │
│  │ • formsubmissions│ │           │  │              │         │
│  │ • marketplacepages││           │  │              │         │
│  │ • reviews      │  │             │  │              │         │
│  └────────────────┘  └─────────────┘  └──────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

## 2.3. Kiến Trúc Real-time (WebSocket)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                       │
│            (React App with WebSocket Client)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ WSS Connection (wss://)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           AWS API Gateway WebSocket API                      │
│                                                              │
│  Routes:                                                     │
│  • $connect    ──────► Lambda: websocketConnect             │
│  • $disconnect ──────► Lambda: websocketDisconnect          │
│  • $default    ──────► Lambda: websocketDefault             │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────────┐   ┌─────────────────────┐
│ Lambda Functions │   │   DynamoDB Table    │
│                  │   │  (Connections)      │
│ • Authenticate   │◄──┤                     │
│ • Store Connection│──►│ • connectionId     │
│ • Join Rooms     │   │ • userId           │
│ • Send Messages  │◄──┤ • rooms[]          │
│ • Cleanup        │   │ • userRole         │
└────────┬─────────┘   │ • ttl (24h)        │
         │             └─────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  API Gateway Management API          │
│  (Send messages to connections)      │
│                                       │
│  Methods:                             │
│  • postToConnection(connectionId)    │
└──────────────────────────────────────┘
         │
         │ Push messages
         │
         ▼
┌─────────────────────────────────────┐
│        Connected Clients            │
│                                     │
│  • Dashboards (admin/user)          │
│  • Chat rooms                       │
│  • Order notifications              │
│  • Lead notifications               │
└─────────────────────────────────────┘
```

## 2.4. Luồng Deployment

```
┌──────────────────────────────────────────────────────────────┐
│                  DEVELOPMENT WORKFLOW                         │
└──────────────────────────────────────────────────────────────┘

    Developer
       │
       ▼
   Git Commit ──────► GitHub Repository
       │                     │
       │                     │ Trigger
       │                     │
       │                     ▼
       │            ┌──────────────────┐
       │            │   CI/CD Pipeline │
       │            │   (GitHub Actions│
       │            │    / GitLab CI)  │
       │            └────────┬─────────┘
       │                     │
       ├─────────────────────┴──────────────────┐
       │                                        │
       ▼                                        ▼
┌──────────────────┐                  ┌──────────────────┐
│ Frontend Build   │                  │ Backend Deploy   │
│                  │                  │                  │
│ 1. npm install   │                  │ 1. npm install   │
│ 2. npm build     │                  │ 2. Run tests     │
│ 3. Deploy Vercel │                  │ 3. serverless    │
│ 4. Update .env   │                  │    deploy        │
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌──────────────────┐              ┌────────────────────────┐
│ Vercel/Netlify   │              │   AWS Lambda +         │
│ (CDN Deployment) │              │   API Gateway          │
└──────────────────┘              └────────────────────────┘
         │                                     │
         └─────────────┬───────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Production    │
              │  Environment   │
              │                │
              │ • MongoDB Atlas│
              │ • AWS Services │
              │ • Payment APIs │
              └────────────────┘
```

---

# 3. KIẾN TRÚC ỨNG DỤNG

## 3.1. Mô Hình MVC (Model-View-Controller)

```
┌─────────────────────────────────────────────────────────────┐
│                         VIEW LAYER                           │
│                      (React Components)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Dashboard    │  │ PageEditor   │  │ Marketplace  │     │
│  │ Components   │  │ Components   │  │ Components   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                CONTROLLER LAYER                              │
│                 (Express Routes + Controllers)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes:                                              │  │
│  │  • /api/auth/*         → authController              │  │
│  │  • /api/pages/*        → pagesController             │  │
│  │  • /api/marketplace/*  → marketplaceController       │  │
│  │  • /api/payment/*      → paymentController           │  │
│  │  • /api/forms/*        → formSubmissionController    │  │
│  │  • /api/chat/*         → chatController              │  │
│  │  • /api/dashboard/*    → dashboardController         │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ Business Logic
                      │
┌─────────────────────┼────────────────────────────────────────┐
│                  MODEL LAYER                                 │
│                (Mongoose Models + Services)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Models (MongoDB Schemas):                         │    │
│  │                                                     │    │
│  │  • User          (Authentication, Profile)         │    │
│  │  • Page          (Landing Pages)                   │    │
│  │  • MarketplacePage (Templates for sale)            │    │
│  │  • Order         (Purchase orders)                 │    │
│  │  • Transaction   (Payment transactions)            │    │
│  │  • ChatRoom      (Support chat rooms)              │    │
│  │  • ChatMessage   (Chat messages)                   │    │
│  │  • FormSubmission (Lead data)                      │    │
│  │  • Review        (Template reviews)                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Services (Business Logic):                        │    │
│  │                                                     │    │
│  │  • authService       (JWT, password hashing)       │    │
│  │  • pageService       (CRUD, publish)               │    │
│  │  • paymentService    (MoMo, VNPay integration)     │    │
│  │  • websocketService  (Real-time messaging)         │    │
│  │  • emailService      (SMTP, notifications)         │    │
│  │  • aiResponseService (ChatGPT integration)         │    │
│  │  • s3Service         (File upload/download)        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## 3.2. Middleware Stack

```
HTTP Request
     │
     ▼
┌─────────────────────┐
│  CORS Middleware    │ ◄── Allow cross-origin requests
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Body Parser         │ ◄── Parse JSON/URL-encoded data
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Authentication      │ ◄── Verify JWT token
│ Middleware          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Authorization       │ ◄── Check user permissions
│ Middleware          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Route Handler       │ ◄── Execute business logic
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Error Handler       │ ◄── Catch and format errors
└─────────┬───────────┘
          │
          ▼
    HTTP Response
```

---

*Tiếp tục phần 4 - Sơ đồ UML trong file tiếp theo...*
