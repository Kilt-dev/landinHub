# 📝 Hướng Dẫn Sử Dụng Form Builder - LandingHub

## 🎯 Tổng Quan

Form Builder trong LandingHub cho phép bạn tạo forms để thu thập leads (thông tin khách hàng) một cách dễ dàng, tương tự LadiPage. Tất cả form submissions sẽ được lưu tự động vào MongoDB và bạn có thể quản lý chúng từ dashboard.

---

## 🛠️ Cách Tạo Form

### **Bước 1: Thêm Form vào Page**

1. Mở **Component Library** (thanh bên trái)
2. Click tab **"Elements"**
3. Tìm và kéo component **"Form"** vào canvas
4. Hoặc click vào "Form" để add tự động

### **Bước 2: Cấu Hình Form**

1. Click vào form vừa tạo trên canvas
2. **Properties Panel** (bên phải) sẽ mở ra
3. Bạn sẽ thấy giao diện cấu hình form với các tab:

#### **Tab "Fields" (Trường)**

**Thêm Field:**
1. Click nút **"+ Add Field"**
2. Chọn loại field:
   - **Text**: Nhập text thường
   - **Email**: Email (có validation)
   - **Phone**: Số điện thoại
   - **Number**: Chỉ nhập số
   - **Date**: Chọn ngày
   - **Password**: Mật khẩu (ẩn ký tự)
   - **Textarea**: Nhập text nhiều dòng
   - **Dropdown**: Chọn từ danh sách
   - **Checkbox**: Nhiều lựa chọn
   - **Radio**: Chọn 1 trong nhiều

**Cấu Hình Field:**
Mỗi field có các options:
- **Label**: Nhãn hiển thị (vd: "Họ và tên")
- **Name**: Tên field trong database (vd: "full_name")
- **Placeholder**: Text gợi ý (vd: "Nhập họ và tên...")
- **Required**: Bắt buộc nhập (checkbox)
- **Options** (cho Dropdown/Radio): Danh sách lựa chọn

**Sắp Xếp Fields:**
- Kéo icon **⋮** để sắp xếp thứ tự fields
- Click **Trash icon** để xóa field
- Click **Copy icon** để nhân bản field

#### **Tab "Design" (Thiết kế)**

**Form Style:**
- **Title**: Tiêu đề form
- **Direction**: Hướng sắp xếp (Column/Row)
- **Gap**: Khoảng cách giữa các fields
- **Background**: Màu nền form
- **Border**: Viền form
- **Padding**: Khoảng cách trong

**Field Style:**
- **Font Size**: Kích thước chữ
- **Border**: Viền input
- **Border Radius**: Bo góc
- **Padding**: Khoảng cách trong input

**Submit Button:**
- **Text**: Text nút submit (vd: "Gửi thông tin")
- **Loading Text**: Text khi đang submit (vd: "Đang gửi...")
- **Background Color**: Màu nền nút
- **Text Color**: Màu chữ
- **Border Radius**: Bo góc
- **Padding**: Khoảng cách trong

#### **Tab "Behavior" (Hành vi)**

**Form Submission:**
- **Success Message**: Thông báo khi gửi thành công
- **Error Message**: Thông báo khi gửi lỗi
- **Reset After Submit**: Reset form sau khi gửi (checkbox)
- **Show Loading State**: Hiển thị loading khi gửi (checkbox)

**Webhook (Optional):**
- **Webhook URL**: Gửi data đến API của bạn
- Ngoài việc lưu vào database, bạn có thể gửi đến CRM/Email Marketing tool

---

## 📊 Quản Lý Form Submissions (Leads)

### **Truy Cập Form Dashboard**

1. Từ menu chính, click **"Form Data"** hoặc **"Leads"**
2. Bạn sẽ thấy dashboard quản lý tất cả form submissions

### **Tính Năng Dashboard**

**Statistics:**
- **Total**: Tổng số leads
- **New**: Leads mới chưa đọc
- **Read**: Đã đọc
- **Replied**: Đã trả lời
- **Archived**: Đã lưu trữ
- **Spam**: Đánh dấu spam

**Filters:**
- **Status**: Lọc theo trạng thái
- **Page**: Lọc theo trang cụ thể
- **Date Range**: Lọc theo khoảng thời gian
- **Search**: Tìm kiếm theo nội dung

**Actions:**
- **View Details**: Xem chi tiết submission
- **Update Status**: Thay đổi trạng thái
- **Bulk Actions**: Thao tác hàng loạt
- **Export CSV**: Xuất ra file Excel

### **Thông Tin Mỗi Lead**

Mỗi form submission bao gồm:

**Form Data:**
- Tất cả thông tin người dùng nhập vào form

**Metadata (Tự động thu thập):**
- **Device Type**: Desktop/Tablet/Mobile
- **Screen Resolution**: Độ phân giải màn hình
- **User Agent**: Trình duyệt và OS
- **Referrer**: Nguồn traffic
- **Submitted At**: Thời gian submit
- **UTM Parameters**: Tracking marketing
  - utm_source
  - utm_medium
  - utm_campaign
  - utm_term
  - utm_content

---

## 🚀 Publish Form Lên Website

### **Export Form**

Khi bạn publish page, form sẽ **tự động** được include trong HTML export.

**Cách hoạt động:**
1. User điền form trên trang published
2. Click submit → Data gửi đến: `/api/forms/submit`
3. Backend tự động lưu vào MongoDB
4. Nếu có webhook, gửi thêm đến webhook URL

### **Custom Domain**

Form hoạt động trên cả:
- CloudFront domain (*.cloudfront.net)
- Custom domain của bạn (*.landinghub.app)

---

## 💡 Best Practices

### **1. Form Design**

✅ **DO:**
- Giữ form ngắn gọn (3-5 fields tối đa)
- Sử dụng placeholder rõ ràng
- Đánh dấu required fields
- Button CTA nổi bật (màu tương phản)

❌ **DON'T:**
- Quá nhiều fields (user sẽ bỏ qua)
- Label không rõ ràng
- Button CTA nhỏ/không nổi bật

### **2. Field Configuration**

**Name Attribute:**
- Sử dụng snake_case: `full_name`, `phone_number`, `company_name`
- Tránh tên chung chung: `field1`, `input2`

**Validation:**
- Bật required cho fields quan trọng
- Sử dụng type phù hợp (email, tel, number)

### **3. Success Message**

Good examples:
- ✅ "Cảm ơn! Chúng tôi sẽ liên hệ trong 24h"
- ✅ "Đã nhận thông tin. Check email để nhận ưu đãi!"
- ❌ "OK" (quá ngắn, không rõ ràng)

---

## 🔧 Troubleshooting

### **Vấn đề: Form hiển thị "Empty form"**

**Nguyên nhân:** Chưa add fields vào form

**Giải pháp:**
1. Click vào form
2. Mở Properties Panel (bên phải)
3. Tab "Fields" → Click "+ Add Field"
4. Add ít nhất 1 field

### **Vấn đề: Form không submit được**

**Kiểm tra:**
1. Backend đang chạy (`npm start` trong /backend)
2. REACT_APP_API_URL đúng trong .env
3. Check console log có lỗi API không
4. Đảm bảo user đã login (cần token)

### **Vấn đề: Không thấy submissions trong dashboard**

**Kiểm tra:**
1. Form đã được publish chưa?
2. User đã submit form chưa?
3. API `/api/forms/submissions` hoạt động chưa?
4. Check MongoDB connection

---

## 📝 Example: Contact Form

**Fields Setup:**
```
1. Text Field
   - Label: "Họ và tên"
   - Name: "full_name"
   - Placeholder: "Nguyễn Văn A"
   - Required: ✓

2. Email Field
   - Label: "Email"
   - Name: "email"
   - Placeholder: "email@example.com"
   - Required: ✓

3. Phone Field
   - Label: "Số điện thoại"
   - Name: "phone"
   - Placeholder: "+84 123 456 789"
   - Required: ✓

4. Textarea Field
   - Label: "Tin nhắn"
   - Name: "message"
   - Placeholder: "Nội dung bạn muốn gửi..."
   - Rows: 4
   - Required: ✗
```

**Button Setup:**
- Text: "Gửi thông tin"
- Loading Text: "Đang gửi..."
- Background: #2563eb (Blue)
- Color: #ffffff (White)

**Messages:**
- Success: "Cảm ơn! Chúng tôi sẽ liên hệ trong 24h"
- Error: "Có lỗi xảy ra, vui lòng thử lại"

---

## 🎓 Advanced Features

### **Webhook Integration**

Gửi form data đến CRM/Email tool:

```javascript
// Form Settings > Webhook URL
https://your-crm.com/api/leads

// Payload gửi đến webhook:
{
  "page_id": "6123abc...",
  "form_data": {
    "full_name": "Nguyễn Văn A",
    "email": "email@example.com",
    "phone": "+84123456789"
  },
  "metadata": {
    "device_type": "desktop",
    "user_agent": "Mozilla/5.0...",
    "submitted_at": "2025-11-15T10:30:00.000Z",
    "utm_source": "facebook",
    "utm_campaign": "winter-sale"
  }
}
```

### **Custom Validation**

Hiện tại hỗ trợ HTML5 validation:
- Email: Auto validate format
- Number: Chỉ cho phép số
- Required: Bắt buộc nhập

### **A/B Testing Forms**

Tạo nhiều variants của form:
1. Duplicate page
2. Thay đổi form fields/design
3. So sánh conversion rate trong Analytics

---

## 📞 Support

Nếu gặp vấn đề:
1. Check FORM_BUILDER_GUIDE.md này
2. Check console log (F12)
3. Tạo issue tại GitHub repository

**Happy Building! 🚀**
