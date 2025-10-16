Dưới đây là file README.md được viết bằng tiếng Việt, tuân thủ chuẩn Markdown, và bao gồm các thông tin chi tiết dựa trên mã nguồn controller bạn cung cấp. Tôi đã cập nhật thời gian hiện tại (12:08 PM +07, ngày 17/09/2025) vào phần thông tin và đảm bảo nội dung rõ ràng, chuyên nghiệp.

README - Controller LandingHub
Tài liệu này cung cấp tổng quan, hướng dẫn cài đặt và thông tin sử dụng cho file controller.js, xử lý logic backend để tạo, quản lý và xuất bản các trang landing page sử dụng các dịch vụ AWS, Puppeteer và DeepSeek AI. Cập nhật lần cuối: Thứ Tư, ngày 17 tháng 9 năm 2025, 12:08 PM +07.
Tổng Quan
File controller.js chứa tập hợp các endpoint Express.js để quản lý các trang landing page, bao gồm tạo mới, lưu tự động, cải tiến bằng AI, lưu, cập nhật, xuất bản, xóa và lấy nội dung trang. Nó tích hợp với:

AWS SDK: Để lưu trữ trên S3, phân phối qua CloudFront và quản lý DNS qua Route 53.
Puppeteer: Để xác thực và render nội dung HTML cùng với chụp ảnh màn hình.
DeepSeek AI: Thông qua API OpenAI để tạo và cải tiến nội dung trang landing.
MongoDB: Sử dụng Mongoose để lưu trữ metadata của trang.

Yêu Cầu Trước
Trước khi chạy controller này, hãy đảm bảo các điều kiện sau đã được thiết lập:

Node.js: Phiên bản 14.x trở lên.
npm: Để cài đặt các phụ thuộc.
Tài khoản AWS: Với thông tin xác thực đã cấu hình cho S3, CloudFront và Route 53.
MongoDB: Một instance đang chạy với Mongoose được cấu hình.
Biến Môi Trường: Cấu hình các biến sau trong file .env:

AWS_REGION: Vùng AWS (ví dụ: ap-southeast-1).
AWS_S3_BUCKET: Tên bucket S3.
DEEPSEEK_API_KEY: Khóa API cho DeepSeek AI.
YOUR_HOSTED_ZONE_ID: ID vùng lưu trữ Route 53.
YOUR_ACM_CERTIFICATE_ARN: ARN chứng chỉ ACM cho CloudFront.
YOUR_OAI_ID: ID Identity Truy Cập Nguồn cho CloudFront.



Cài Đặt

Cài đặt các phụ thuộc cần thiết:
bashnpm install aws-sdk axios puppeteer mongoose openai uuid

Cấu hình file .env với các biến môi trường cần thiết.
Đảm bảo model Page được định nghĩa đúng trong ../models/Page.js với schema sau (ví dụ):
javascriptconst pageSchema = new mongoose.Schema({
_id: String,
user_id: String,
name: String,
file_path: String,
status: String,
url: String,
created_at: Date,
updated_at: Date,
lastUpdated: Date,
views: Number,
zalo_chatbot_script_id: String
});
module.exports = mongoose.model('Page', pageSchema);

Nhập controller vào ứng dụng Express của bạn:
javascriptconst controller = require('./controller');
app.get('/api/pages', controller.getPages);
app.post('/api/pages', controller.createPage);
app.post('/api/pages/auto-save', controller.autoSave);
app.post('/api/pages/ai-refactor', controller.aiRefactor);
app.post('/api/pages/save', controller.savePage);
app.put('/api/pages/:id', controller.updatePage);
app.post('/api/pages/:id/publish', controller.publishPage);
app.delete('/api/pages/:id', controller.deletePage);
app.get('/api/pages/:id/content', controller.getPageContent);


Chức Năng
1. Lấy Danh Sách Trang

Endpoint: GET /api/pages
Mô tả: Lấy danh sách các trang landing của người dùng đã xác thực.
Yêu cầu: Yêu cầu req.user.userId từ middleware xác thực.
Phản hồi: Mảng các đối tượng trang với id, name, url, status, statusColor, v.v.
Xử lý lỗi: Trả về 401 nếu không được ủy quyền, 500 nếu có lỗi máy chủ.

2. Tạo Trang Mới

Endpoint: POST /api/pages
Mô tả: Tạo trang landing mới bằng DeepSeek AI dựa trên mô tả.
Dữ liệu yêu cầu: { description: String }
Quy trình:

Tạo HTML/CSS/JS bằng DeepSeek AI.
Xác thực bằng Puppeteer và chụp ảnh màn hình.
Tải lên S3 và lưu metadata vào MongoDB.


Phản hồi: Đối tượng trang với html và metadata.
Xử lý lỗi: 400 nếu đầu vào không hợp lệ, 500 nếu có lỗi máy chủ/AI.

3. Lưu Tự Động

Endpoint: POST /api/pages/auto-save
Mô tả: Lưu bản nháp của nội dung trang hiện tại.
Dữ liệu yêu cầu: { html: String, css: String, pageId: String }
Quy trình: Lưu bản nháp vào file tạm (ví dụ: ./temp/draft_<userId>_<pageId>.json).
Phản hồi: { success: true, savedAt: String, message: String }
Xử lý lỗi: 400 nếu đầu vào không hợp lệ, 500 nếu có lỗi file.

4. Cải Tiến Bằng AI

Endpoint: POST /api/pages/ai-refactor
Mô tả: Cải tiến nội dung HTML hiện tại bằng DeepSeek AI để nâng cao thiết kế và hiệu suất.
Dữ liệu yêu cầu: { html: String }
Quy trình:

Gửi HTML đến AI để cải tiến (UI/UX, thiết kế đáp ứng, hiệu ứng, v.v.).
Xác thực nội dung cải tiến bằng Puppeteer và tạo ảnh thu nhỏ.
Tải ảnh thu nhỏ lên S3.


Phản hồi: { html: String, thumbnail: String, improvements: Array, isValid: Boolean, metadata: Object }
Xử lý lỗi: 400 nếu đầu vào không hợp lệ, 500 nếu có lỗi AI/máy chủ.

5. Lưu Trang

Endpoint: POST /api/pages/save
Mô tả: Lưu một trang landing mới với HTML được cung cấp.
Dữ liệu yêu cầu: { html: String }
Quy trình: Xác thực bằng Puppeteer, tải lên S3 và lưu vào MongoDB.
Phản hồi: Đối tượng trang.
Xử lý lỗi: 400 nếu HTML không hợp lệ, 500 nếu có lỗi tải lên.

6. Cập Nhật Trang

Endpoint: PUT /api/pages/:id
Mô tả: Cập nhật trang landing hiện có với HTML mới.
Dữ liệu yêu cầu: { html: String }
Quy trình: Xác thực bằng Puppeteer, tải lên S3 và cập nhật MongoDB.
Phản hồi: Đối tượng trang đã cập nhật.
Xử lý lỗi: 404 nếu không tìm thấy trang, 400 nếu HTML không hợp lệ, 500 nếu có lỗi.

7. Xuất Bản Trang

Endpoint: POST /api/pages/:id/publish
Mô tả: Xuất bản trang landing bằng cách tạo phân phối CloudFront và bản ghi DNS Route 53.
Quy trình:

Cấu hình CloudFront với nguồn S3.
Thiết lập subdomain (ví dụ: <userId>-<id>.landinghub.vn).
Cập nhật trạng thái trang thành "ĐÃ XUẤT BẢN".


Phản hồi: Đối tượng trang đã cập nhật với url.
Xử lý lỗi: 404 nếu không tìm thấy trang, 500 nếu có lỗi AWS.

8. Xóa Trang

Endpoint: DELETE /api/pages/:id
Mô tả: Xóa trang landing khỏi S3, Route 53 và MongoDB.
Quy trình: Xóa đối tượng S3, xóa bản ghi DNS và xóa mục trong cơ sở dữ liệu.
Phản hồi: { success: true }
Xử lý lỗi: 404 nếu không tìm thấy trang, 500 nếu có lỗi AWS.

9. Lấy Nội Dung Trang

Endpoint: GET /api/pages/:id/content
Mô tả: Lấy nội dung HTML của trang landing để chỉnh sửa.
Quy trình: Lấy file từ S3.
Phản hồi: { html: String, css: String }
Xử lý lỗi: 404 nếu không tìm thấy trang, 500 nếu có lỗi S3.

Cấu Hình

AWS SDK: Khởi tạo với AWS.config.update({ region: process.env.AWS_REGION }).
Puppeteer: Chạy ở chế độ headless với sandbox bị vô hiệu để tối ưu hiệu suất.
DeepSeek AI: Cấu hình với baseURL và khóa API từ biến môi trường.
Browser Pool: Tái sử dụng để tối ưu hóa tài nguyên, đóng khi nhận SIGINT.

Lưu Ý Khi Sử Dụng

Xác Thực: Tất cả nội dung HTML được xác thực bằng Puppeteer để đảm bảo khả năng render và chụp ảnh màn hình.
Xử Lý Lỗi: Ghi log lỗi vào console và trả về mã trạng thái HTTP phù hợp.
File Tạm: Lưu trong thư mục ./temp, dọn dẹp sau khi tải lên S3.
Bảo Mật: Yêu cầu middleware xác thực để cung cấp req.user.userId.

Khắc Phục Sự Cố

Lỗi Puppeteer: Đảm bảo máy chủ có đủ quyền và tài nguyên (chế độ không sandbox có thể yêu cầu quyền root).
Lỗi AWS: Kiểm tra thông tin xác thực, quyền bucket và cấu hình Route 53.
Vấn Đề Phản Hồi AI: Kiểm tra tính hợp lệ của khóa API và cấu trúc prompt.
Lỗi I/O File: Đảm bảo thư mục ./temp có quyền ghi.