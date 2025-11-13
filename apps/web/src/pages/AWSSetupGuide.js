import React from 'react';
import { CheckCircle, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import '../styles/AWSSetupGuide.css';

/**
 * AWS Setup Guide - Comprehensive documentation
 * Helps users configure AWS for CloudFront + Route 53 deployment
 */
const AWSSetupGuide = () => {
    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        alert('Đã copy code!');
    };

    return (
        <div className="aws-guide-container">
            <div className="guide-header">
                <h1>Hướng dẫn Deploy lên AWS CloudFront + Route 53</h1>
                <p>Hướng dẫn chi tiết từng bước để deploy landing pages của bạn lên AWS</p>
            </div>

            {/* Table of Contents */}
            <div className="toc">
                <h3>Nội dung</h3>
                <ul>
                    <li><a href="#overview">Tổng quan</a></li>
                    <li><a href="#prerequisites">Yêu cầu</a></li>
                    <li><a href="#create-aws-account">Tạo AWS Account</a></li>
                    <li><a href="#iam-user">Tạo IAM User & Access Keys</a></li>
                    <li><a href="#s3-setup">Cấu hình S3 Bucket</a></li>
                    <li><a href="#cloudfront-setup">Cấu hình CloudFront</a></li>
                    <li><a href="#route53-setup">Cấu hình Route 53</a></li>
                    <li><a href="#ssl-certificate">SSL Certificate (ACM)</a></li>
                    <li><a href="#troubleshooting">Xử lý sự cố</a></li>
                </ul>
            </div>

            {/* Overview */}
            <section id="overview" className="guide-section">
                <h2>Tổng quan</h2>
                <p>
                    AWS CloudFront + Route 53 là giải pháp CDN (Content Delivery Network) mạnh mẽ giúp:
                </p>
                <ul>
                    <li>Tăng tốc độ tải trang (latency thấp)</li>
                    <li>Phân phối toàn cầu với 450+ edge locations</li>
                    <li>SSL/TLS miễn phí</li>
                    <li>Custom domain dễ dàng</li>
                    <li>Tự động scale, không giới hạn traffic</li>
                    <li>Chi phí thấp (chỉ trả theo usage)</li>
                </ul>

                <div className="architecture-diagram">
                    <pre>{`
┌──────────────┐      ┌─────────────┐      ┌──────────────────┐
│   Landing    │──►   │ S3 Bucket   │──►   │   CloudFront     │
│   Page HTML  │      │  (Storage)  │      │   Distribution   │
└──────────────┘      └─────────────┘      └──────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │    Route 53      │
                                            │  (DNS Service)   │
                                            └──────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │   Your Domain    │
                                            │  landing.com     │
                                            └──────────────────┘
                    `}</pre>
                </div>
            </section>

            {/* Prerequisites */}
            <section id="prerequisites" className="guide-section">
                <h2>Yêu cầu</h2>
                <div className="checklist">
                    <div className="checklist-item">
                        <CheckCircle size={20} />
                        <span>Tài khoản AWS (miễn phí 12 tháng cho user mới)</span>
                    </div>
                    <div className="checklist-item">
                        <CheckCircle size={20} />
                        <span>Thẻ tín dụng/ghi nợ (để verify tài khoản)</span>
                    </div>
                    <div className="checklist-item">
                        <CheckCircle size={20} />
                        <span>Domain name (nếu muốn dùng custom domain)</span>
                    </div>
                </div>
            </section>

            {/* Create AWS Account */}
            <section id="create-aws-account" className="guide-section">
                <h2>1️⃣ Tạo AWS Account</h2>

                <div className="step">
                    <h3>Bước 1: Truy cập AWS</h3>
                    <p>Vào trang <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer">https://aws.amazon.com <ExternalLink size={14} /></a></p>
                    <p>Nhấn <strong>"Create an AWS Account"</strong></p>
                </div>

                <div className="step">
                    <h3>Bước 2: Điền thông tin</h3>
                    <ul>
                        <li>Email address</li>
                        <li>Account name (ví dụ: "My Landing Pages")</li>
                        <li>Password</li>
                    </ul>
                </div>

                <div className="step">
                    <h3>Bước 3: Chọn loại tài khoản</h3>
                    <p>Chọn <strong>"Personal"</strong> (sử dụng cá nhân)</p>
                </div>

                <div className="step">
                    <h3>Bước 4: Nhập thông tin thanh toán</h3>
                    <div className="warning-box">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Lưu ý:</strong>
                            <p>AWS yêu cầu thẻ để verify nhưng sẽ KHÔNG tự động charge nếu bạn ở trong Free Tier. Hầu hết landing pages nhỏ đều nằm trong Free Tier (50GB transfer/tháng miễn phí).</p>
                        </div>
                    </div>
                </div>

                <div className="step">
                    <h3>Bước 5: Verify số điện thoại</h3>
                    <p>AWS sẽ gọi điện hoặc gửi SMS code để verify</p>
                </div>

                <div className="step">
                    <h3>Bước 6: Chọn Support Plan</h3>
                    <p>Chọn <strong>"Basic Support - Free"</strong></p>
                </div>
            </section>

            {/* IAM User Setup */}
            <section id="iam-user" className="guide-section">
                <h2>2️⃣ Tạo IAM User & Lấy Access Keys</h2>

                <div className="info-box">
                    <p><strong>IAM (Identity and Access Management)</strong> cho phép bạn tạo user riêng với quyền hạn cụ thể, thay vì dùng root account (không an toàn).</p>
                </div>

                <div className="step">
                    <h3>Bước 1: Vào IAM Console</h3>
                    <ol>
                        <li>Login vào <a href="https://console.aws.amazon.com" target="_blank" rel="noopener noreferrer">AWS Console <ExternalLink size={14} /></a></li>
                        <li>Tìm kiếm "IAM" trong search bar</li>
                        <li>Click vào "IAM" service</li>
                    </ol>
                </div>

                <div className="step">
                    <h3>Bước 2: Tạo User mới</h3>
                    <ol>
                        <li>Sidebar trái → Click <strong>"Users"</strong></li>
                        <li>Click <strong>"Create user"</strong></li>
                        <li>Nhập User name: <code>landing-page-deployer</code></li>
                        <li>Click <strong>"Next"</strong></li>
                    </ol>
                </div>

                <div className="step">
                    <h3>Bước 3: Gán quyền (Permissions)</h3>
                    <p>Chọn <strong>"Attach policies directly"</strong></p>
                    <p>Tìm và check các policies sau:</p>

                    <div className="code-block">
                        <ul>
                            <li><strong>AmazonS3FullAccess</strong> - Quản lý S3 buckets</li>
                            <li><strong>CloudFrontFullAccess</strong> - Quản lý CloudFront distributions</li>
                            <li><strong>AmazonRoute53FullAccess</strong> - Quản lý DNS records</li>
                            <li><strong>AWSCertificateManagerFullAccess</strong> - Quản lý SSL certificates</li>
                        </ul>
                    </div>

                    <div className="warning-box">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Production tip:</strong>
                            <p>Trong môi trường production, nên tạo custom policy với least-privilege principle thay vì dùng FullAccess.</p>
                        </div>
                    </div>

                    <button className="btn-copy" onClick={() => copyCode(`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "acm:*"
      ],
      "Resource": "*"
    }
  ]
}`)}>
                        <Copy size={14} /> Copy Custom Policy JSON
                    </button>
                </div>

                <div className="step">
                    <h3>Bước 4: Review và Create</h3>
                    <p>Review lại thông tin và click <strong>"Create user"</strong></p>
                </div>

                <div className="step">
                    <h3>Bước 5: Tạo Access Keys</h3>
                    <ol>
                        <li>Click vào user vừa tạo</li>
                        <li>Chọn tab <strong>"Security credentials"</strong></li>
                        <li>Scroll xuống phần <strong>"Access keys"</strong></li>
                        <li>Click <strong>"Create access key"</strong></li>
                        <li>Chọn use case: <strong>"Application running outside AWS"</strong></li>
                        <li>Click <strong>"Next"</strong> → <strong>"Create access key"</strong></li>
                    </ol>

                    <div className="important-box">
                        <h4>CỰC KỲ QUAN TRỌNG:</h4>
                        <ul>
                            <li><strong>Access Key ID</strong>: Bắt đầu bằng "AKIA..." (có thể xem lại)</li>
                            <li><strong>Secret Access Key</strong>: CHỈ HIỂN THỊ 1 LẦN DUY NHẤT</li>
                            <li>Click <strong>"Download .csv file"</strong> để lưu lại</li>
                            <li>KHÔNG BAO GIỜ share keys này công khai (GitHub, Slack, etc.)</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* S3 Setup */}
            <section id="s3-setup" className="guide-section">
                <h2>3️⃣ Cấu hình S3 Bucket</h2>

                <div className="info-box">
                    <p><strong>S3 (Simple Storage Service)</strong> là nơi lưu trữ file HTML, CSS, JS của landing page.</p>
                </div>

                <div className="step">
                    <h3>Option 1: Tự động tạo (Khuyến nghị)</h3>
                    <p>Hệ thống sẽ tự động tạo S3 bucket khi bạn deploy lần đầu. Bỏ trống trường "S3 Bucket Name" trong form deployment.</p>
                </div>

                <div className="step">
                    <h3>Option 2: Tạo manual</h3>
                    <ol>
                        <li>Vào AWS Console → Tìm "S3"</li>
                        <li>Click <strong>"Create bucket"</strong></li>
                        <li>Bucket name: <code>my-landing-pages-123456</code> (phải unique toàn cầu)</li>
                        <li>Region: Chọn Singapore (ap-southeast-1) hoặc gần user nhất</li>
                        <li>Block Public Access: <strong>TẮT "Block all public access"</strong></li>
                        <li>Bucket Versioning: Enable (tùy chọn)</li>
                        <li>Click <strong>"Create bucket"</strong></li>
                    </ol>
                </div>
            </section>

            {/* CloudFront Setup */}
            <section id="cloudfront-setup" className="guide-section">
                <h2>4️⃣ CloudFront Distribution</h2>

                <div className="info-box">
                    <p><strong>CloudFront</strong> là CDN của AWS, giúp phân phối content nhanh hơn qua 450+ edge locations toàn cầu.</p>
                </div>

                <div className="step">
                    <h3>Hệ thống tự động tạo</h3>
                    <p>Khi bạn click "Deploy Now", hệ thống sẽ tự động:</p>
                    <ul>
                        <li>Tạo CloudFront distribution</li>
                        <li>Point origin tới S3 bucket</li>
                        <li>Enable HTTPS</li>
                        <li>Set caching policies</li>
                        <li>Configure error pages</li>
                    </ul>
                    <p>Bạn sẽ nhận được URL dạng: <code>d12345abcdef.cloudfront.net</code></p>
                </div>
            </section>

            {/* Route 53 Setup */}
            <section id="route53-setup" className="guide-section">
                <h2>5️⃣ Cấu hình Route 53 (Custom Domain)</h2>

                <div className="info-box">
                    <p><strong>Route 53</strong> là DNS service của AWS. Dùng để point custom domain (landing.yourdomain.com) tới CloudFront.</p>
                </div>

                <div className="step">
                    <h3>Bước 1: Mua domain (nếu chưa có)</h3>
                    <p>Có thể mua domain tại:</p>
                    <ul>
                        <li>Route 53 (AWS) - <a href="https://console.aws.amazon.com/route53" target="_blank" rel="noopener noreferrer">console.aws.amazon.com/route53 <ExternalLink size={14} /></a></li>
                        <li>GoDaddy</li>
                        <li>Namecheap</li>
                        <li>Cloudflare</li>
                    </ul>
                </div>

                <div className="step">
                    <h3>Bước 2: Tạo Hosted Zone</h3>
                    <ol>
                        <li>Vào Route 53 Console</li>
                        <li>Click <strong>"Create hosted zone"</strong></li>
                        <li>Domain name: <code>yourdomain.com</code></li>
                        <li>Type: <strong>Public hosted zone</strong></li>
                        <li>Click <strong>"Create hosted zone"</strong></li>
                    </ol>
                </div>

                <div className="step">
                    <h3>Bước 3: Update Nameservers</h3>
                    <p>Route 53 sẽ cung cấp 4 nameservers, ví dụ:</p>
                    <div className="code-block">
                        <pre>{`ns-123.awsdns-45.com
ns-678.awsdns-90.net
ns-1234.awsdns-56.org
ns-5678.awsdns-12.co.uk`}</pre>
                    </div>
                    <p>Vào domain registrar của bạn (GoDaddy, Namecheap, etc.) và update nameservers thành 4 giá trị trên.</p>
                    <p><strong>⏰ Thời gian propagate:</strong> 24-48 giờ</p>
                </div>

                <div className="step">
                    <h3>Bước 4: Hệ thống tự động tạo DNS records</h3>
                    <p>Khi deploy, hệ thống tự động tạo:</p>
                    <ul>
                        <li>A record hoặc CNAME record point tới CloudFront</li>
                        <li>AAAA record cho IPv6 (nếu cần)</li>
                    </ul>
                </div>
            </section>

            {/* SSL Certificate */}
            <section id="ssl-certificate" className="guide-section">
                <h2>6️⃣ SSL Certificate (HTTPS)</h2>

                <div className="info-box">
                    <p><strong>AWS Certificate Manager (ACM)</strong> cung cấp SSL certificate MIỄN PHÍ cho CloudFront.</p>
                </div>

                <div className="step">
                    <h3>Option 1: Tự động (Khuyến nghị)</h3>
                    <p>Bỏ trống trường "ACM Certificate ARN". Hệ thống sẽ tự động:</p>
                    <ol>
                        <li>Request certificate cho domain của bạn</li>
                        <li>Validate qua DNS (tự động add records vào Route 53)</li>
                        <li>Attach certificate vào CloudFront</li>
                    </ol>
                    <p><strong>⏰ Thời gian:</strong> 5-30 phút</p>
                </div>

                <div className="step">
                    <h3>Option 2: Tạo manual</h3>
                    <ol>
                        <li>Vào AWS Certificate Manager Console</li>
                        <li><strong>QUAN TRỌNG:</strong> Chọn region <strong>us-east-1</strong> (N. Virginia) - CloudFront chỉ dùng cert từ region này!</li>
                        <li>Click <strong>"Request certificate"</strong></li>
                        <li>Certificate type: <strong>Public certificate</strong></li>
                        <li>Domain names:
                            <ul>
                                <li><code>landing.yourdomain.com</code></li>
                                <li><code>*.yourdomain.com</code> (wildcard, tùy chọn)</li>
                            </ul>
                        </li>
                        <li>Validation method: <strong>DNS validation</strong></li>
                        <li>Click <strong>"Request"</strong></li>
                        <li>Add CNAME records vào Route 53 (có button tự động)</li>
                        <li>Đợi status = "Issued" (5-30 phút)</li>
                        <li>Copy Certificate ARN (dạng: <code>arn:aws:acm:us-east-1:123:certificate/...</code>)</li>
                    </ol>
                </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="guide-section">
                <h2>Xử lý sự cố thường gặp</h2>

                <div className="faq">
                    <div className="faq-item">
                        <h4>"Access Denied" khi upload S3</h4>
                        <p><strong>Nguyên nhân:</strong> IAM user không có quyền S3</p>
                        <p><strong>Giải pháp:</strong> Thêm policy <code>AmazonS3FullAccess</code> cho IAM user</p>
                    </div>

                    <div className="faq-item">
                        <h4>"InvalidClientTokenId" error</h4>
                        <p><strong>Nguyên nhân:</strong> Access Key ID sai hoặc đã bị xóa</p>
                        <p><strong>Giải pháp:</strong> Tạo lại Access Keys và update trong form</p>
                    </div>

                    <div className="faq-item">
                        <h4>CloudFront 403 Forbidden</h4>
                        <p><strong>Nguyên nhân:</strong> S3 bucket chưa public hoặc CloudFront chưa có quyền</p>
                        <p><strong>Giải pháp:</strong> Enable "Block Public Access" = OFF trong S3 bucket settings</p>
                    </div>

                    <div className="faq-item">
                        <h4>Custom domain không hoạt động</h4>
                        <p><strong>Nguyên nhân:</strong> DNS chưa propagate hoặc certificate chưa issued</p>
                        <p><strong>Giải pháp:</strong></p>
                        <ul>
                            <li>Check nameservers đã đúng chưa: <code>nslookup -type=NS yourdomain.com</code></li>
                            <li>Đợi 24-48h để DNS propagate</li>
                            <li>Check certificate status trong ACM console</li>
                        </ul>
                    </div>

                    <div className="faq-item">
                        <h4>Changes không hiển thị sau deploy</h4>
                        <p><strong>Nguyên nhân:</strong> CloudFront đang cache version cũ</p>
                        <p><strong>Giải pháp:</strong> Hệ thống tự động invalidate cache. Nếu vẫn không được, clear browser cache (Ctrl + Shift + R)</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="guide-section">
                <h2>Chi phí ước tính</h2>

                <div className="pricing-table">
                    <h3>AWS Free Tier (12 tháng đầu):</h3>
                    <ul>
                        <li>S3: 5GB storage, 20,000 GET requests, 2,000 PUT requests/tháng</li>
                        <li>CloudFront: 1TB data transfer out, 10,000,000 HTTP requests/tháng</li>
                        <li>Route 53: 1 hosted zone, 1 triệu queries/tháng</li>
                        <li>ACM: SSL certificates hoàn toàn miễn phí</li>
                    </ul>

                    <h3>Sau Free Tier:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Chi phí</th>
                                <th>Ví dụ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>S3 Storage</td>
                                <td>$0.023/GB/tháng</td>
                                <td>100MB = $0.002</td>
                            </tr>
                            <tr>
                                <td>CloudFront Transfer</td>
                                <td>$0.085/GB (10TB đầu)</td>
                                <td>10GB = $0.85</td>
                            </tr>
                            <tr>
                                <td>Route 53 Hosted Zone</td>
                                <td>$0.50/tháng</td>
                                <td>1 domain = $0.50</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="estimate-box">
                        <h4>Ước tính cho 10,000 visitors/tháng:</h4>
                        <p>Giả sử mỗi landing page ~2MB:</p>
                        <ul>
                            <li>S3 Storage: $0.005</li>
                            <li>CloudFront: 20GB × $0.085 = $1.70</li>
                            <li>Route 53: $0.50</li>
                            <li><strong>Tổng: ~$2.20/tháng</strong></li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <section className="guide-section next-steps">
                <h2>Bước tiếp theo</h2>
                <div className="next-steps-grid">
                    <div className="next-step-card">
                        <h3>1. Tạo AWS Account</h3>
                        <p>Đăng ký tại aws.amazon.com</p>
                        <a href="https://aws.amazon.com" target="_blank" rel="noopener noreferrer">
                            Đăng ký ngay <ExternalLink size={14} />
                        </a>
                    </div>
                    <div className="next-step-card">
                        <h3>2. Lấy Access Keys</h3>
                        <p>Tạo IAM user và lấy credentials</p>
                        <a href="https://console.aws.amazon.com/iam" target="_blank" rel="noopener noreferrer">
                            Vào IAM Console <ExternalLink size={14} />
                        </a>
                    </div>
                    <div className="next-step-card">
                        <h3>3. Deploy Landing Page</h3>
                        <p>Quay lại trang deployment và nhập keys</p>
                        <a href="/deployment">
                            Bắt đầu deploy <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Support */}
            <div className="support-box">
                <h3>Cần trợ giúp?</h3>
                <p>Nếu gặp vấn đề, liên hệ:</p>
                <ul>
                    <li>Email: support@landinghub.com</li>
                    <li>Live chat trong app</li>
                    <li><a href="/docs">Documentation</a></li>
                </ul>
            </div>
        </div>
    );
};

export default AWSSetupGuide;
