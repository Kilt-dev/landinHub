import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, DollarSign, Building2, CreditCard, User, Smartphone, QrCode, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import '../styles/ModernPayoutRequest.css';

const ModernPayoutRequest = ({ isOpen, onClose, pendingAmount, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER'); // 'BANK_TRANSFER' or 'MOMO'
    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        account_name: '',
        phone_number: '', // For Momo
        notes: ''
    });
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const banks = [
        { code: 'VCB', name: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam' },
        { code: 'BIDV', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
        { code: 'VTB', name: 'VietinBank - Ngân hàng TMCP Công thương Việt Nam' },
        { code: 'AGRB', name: 'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
        { code: 'TCB', name: 'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam' },
        { code: 'ACB', name: 'ACB - Ngân hàng TMCP Á Châu' },
        { code: 'MBB', name: 'MBBank - Ngân hàng TMCP Quân đội' },
        { code: 'VPB', name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
        { code: 'TPB', name: 'TPBank - Ngân hàng TMCP Tiên Phong' },
        { code: 'STB', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
        { code: 'HDB', name: 'HDBank - Ngân hàng TMCP Phát triển TP.HCM' },
        { code: 'VIB', name: 'VIB - Ngân hàng TMCP Quốc tế' },
        { code: 'SHB', name: 'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội' },
        { code: 'OCB', name: 'OCB - Ngân hàng TMCP Phương Đông' },
        { code: 'MSB', name: 'MSB - Ngân hàng TMCP Hàng Hải' },
        { code: 'EIB', name: 'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu' },
        { code: 'SSB', name: 'SeABank - Ngân hàng TMCP Đông Nam Á' },
        { code: 'LPB', name: 'LienVietPostBank - Ngân hàng TMCP Bưu điện Liên Việt' }
    ];

    // Calculate platform fee and net amount
    const platformFee = pendingAmount * 0.10;
    const netAmount = pendingAmount - platformFee;

    const validateBankAccount = () => {
        if (paymentMethod === 'BANK_TRANSFER') {
            if (!formData.bank_name) {
                toast.error('Vui lòng chọn ngân hàng');
                return false;
            }
            if (!formData.account_number) {
                toast.error('Vui lòng nhập số tài khoản');
                return false;
            }
            if (formData.account_number.length < 6 || formData.account_number.length > 20) {
                toast.error('Số tài khoản không hợp lệ (6-20 ký tự)');
                return false;
            }
            if (!formData.account_name) {
                toast.error('Vui lòng nhập tên chủ tài khoản');
                return false;
            }
            if (formData.account_name.length < 3) {
                toast.error('Tên chủ tài khoản phải có ít nhất 3 ký tự');
                return false;
            }
        } else if (paymentMethod === 'MOMO') {
            if (!formData.phone_number) {
                toast.error('Vui lòng nhập số điện thoại Momo');
                return false;
            }
            const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
            if (!phoneRegex.test(formData.phone_number.replace(/\s/g, ''))) {
                toast.error('Số điện thoại không hợp lệ');
                return false;
            }
            if (!formData.account_name) {
                toast.error('Vui lòng nhập tên chủ tài khoản Momo');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateBankAccount()) {
            return;
        }

        if (netAmount < 50000) {
            toast.error('Số tiền rút tối thiểu là 50,000đ (sau khi trừ phí)');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const requestData = {
                payment_method: paymentMethod,
                notes: formData.notes
            };

            if (paymentMethod === 'BANK_TRANSFER') {
                requestData.bank_info = {
                    bank_name: formData.bank_name,
                    account_number: formData.account_number.trim(),
                    account_name: formData.account_name.trim().toUpperCase()
                };
            } else if (paymentMethod === 'MOMO') {
                requestData.momo_info = {
                    phone_number: formData.phone_number.replace(/\s/g, ''),
                    account_name: formData.account_name.trim()
                };
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/payout/request`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('✅ Yêu cầu rút tiền đã được gửi thành công!');
                setFormData({
                    bank_name: '',
                    account_number: '',
                    account_name: '',
                    phone_number: '',
                    notes: ''
                });
                onSuccess && onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Payout request error:', error);
            toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu rút tiền');
        } finally {
            setLoading(false);
        }
    };

    const generateMomoQR = () => {
        if (!formData.phone_number || !formData.account_name) {
            toast.error('Vui lòng nhập đầy đủ số điện thoại và tên');
            return;
        }

        // Generate QR code for Momo (using a QR code generation service or library)
        // For now, using a simple placeholder
        const qrData = encodeURIComponent(`Momo:${formData.phone_number}:${formData.account_name}:${netAmount}`);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
        setQrCodeUrl(qrUrl);
        setShowQRCode(true);
    };

    if (!isOpen) return null;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="modern-payout-modal-overlay" onClick={onClose}>
            <div className="modern-payout-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modern-payout-header">
                    <div>
                        <h2>💰 Yêu cầu rút tiền</h2>
                        <p>Chọn phương thức và điền thông tin để nhận tiền</p>
                    </div>
                    <button className="modern-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Amount Summary */}
                <div className="modern-amount-summary">
                    <div className="amount-breakdown">
                        <div className="breakdown-item">
                            <span className="breakdown-label">Số dư hiện tại:</span>
                            <span className="breakdown-value primary">{formatPrice(pendingAmount)}</span>
                        </div>
                        <div className="breakdown-item">
                            <span className="breakdown-label">
                                <Info size={14} /> Phí nền tảng (10%):
                            </span>
                            <span className="breakdown-value fee">-{formatPrice(platformFee)}</span>
                        </div>
                        <div className="breakdown-divider"></div>
                        <div className="breakdown-item total">
                            <span className="breakdown-label">Số tiền nhận được:</span>
                            <span className="breakdown-value success">{formatPrice(netAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="payment-method-selector">
                    <label className="section-label">Chọn phương thức nhận tiền</label>
                    <div className="payment-methods">
                        <button
                            type="button"
                            className={`payment-method-btn ${paymentMethod === 'BANK_TRANSFER' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('BANK_TRANSFER')}
                        >
                            <Building2 size={24} />
                            <div>
                                <div className="method-name">Chuyển khoản ngân hàng</div>
                                <div className="method-desc">Nhận qua tài khoản ngân hàng</div>
                            </div>
                            {paymentMethod === 'BANK_TRANSFER' && <CheckCircle2 size={20} className="check-icon" />}
                        </button>
                        <button
                            type="button"
                            className={`payment-method-btn ${paymentMethod === 'MOMO' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('MOMO')}
                        >
                            <Smartphone size={24} />
                            <div>
                                <div className="method-name">Ví Momo</div>
                                <div className="method-desc">Nhận qua số điện thoại Momo</div>
                            </div>
                            {paymentMethod === 'MOMO' && <CheckCircle2 size={20} className="check-icon" />}
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="modern-payout-form">
                    {paymentMethod === 'BANK_TRANSFER' ? (
                        <>
                            <div className="form-group-modern">
                                <label>
                                    <Building2 size={18} />
                                    Ngân hàng <span className="required">*</span>
                                </label>
                                <select
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    required
                                    className="modern-select"
                                >
                                    <option value="">🏦 Chọn ngân hàng của bạn</option>
                                    {banks.map(bank => (
                                        <option key={bank.code} value={bank.name}>{bank.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group-modern">
                                <label>
                                    <CreditCard size={18} />
                                    Số tài khoản <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/[^0-9]/g, '') })}
                                    placeholder="Nhập số tài khoản ngân hàng"
                                    required
                                    className="modern-input"
                                    maxLength="20"
                                />
                                <small className="input-hint">Vd: 0123456789 (6-20 chữ số)</small>
                            </div>

                            <div className="form-group-modern">
                                <label>
                                    <User size={18} />
                                    Tên chủ tài khoản <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value.toUpperCase() })}
                                    placeholder="NGUYEN VAN A"
                                    required
                                    className="modern-input"
                                />
                                <small className="input-hint">
                                    ⚠️ Viết hoa, KHÔNG DẤU, đúng như trên CMND/CCCD
                                </small>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group-modern">
                                <label>
                                    <Smartphone size={18} />
                                    Số điện thoại Momo <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/[^0-9+]/g, '') })}
                                    placeholder="0912345678"
                                    required
                                    className="modern-input"
                                    maxLength="15"
                                />
                                <small className="input-hint">Số điện thoại liên kết với ví Momo</small>
                            </div>

                            <div className="form-group-modern">
                                <label>
                                    <User size={18} />
                                    Tên chủ ví Momo <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                    required
                                    className="modern-input"
                                />
                                <small className="input-hint">Tên đăng ký trên ví Momo</small>
                            </div>

                            <button
                                type="button"
                                className="btn-generate-qr"
                                onClick={generateMomoQR}
                            >
                                <QrCode size={18} />
                                Tạo mã QR
                            </button>

                            {showQRCode && qrCodeUrl && (
                                <div className="qr-code-display">
                                    <p>Quét mã QR để xác nhận thông tin:</p>
                                    <img src={qrCodeUrl} alt="Momo QR Code" />
                                </div>
                            )}
                        </>
                    )}

                    <div className="form-group-modern">
                        <label>
                            <DollarSign size={18} />
                            Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Nhập ghi chú cho yêu cầu rút tiền..."
                            rows="3"
                            className="modern-textarea"
                            maxLength="500"
                        />
                        <small className="input-hint">{formData.notes.length}/500 ký tự</small>
                    </div>

                    {/* Important Notes */}
                    <div className="payout-alert-box">
                        <div className="alert-header">
                            <AlertTriangle size={20} />
                            <h4>Lưu ý quan trọng</h4>
                        </div>
                        <ul className="alert-list">
                            <li>✓ Kiểm tra kỹ thông tin tài khoản trước khi gửi yêu cầu</li>
                            <li>✓ Admin sẽ xử lý trong vòng 1-3 ngày làm việc</li>
                            <li>✓ Bạn sẽ nhận thông báo qua email khi yêu cầu được duyệt</li>
                            <li>✓ Số tiền tối thiểu: 50,000đ (sau khi trừ phí)</li>
                            <li>✓ Phí chuyển khoản (nếu có) sẽ được trừ vào số tiền nhận</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="modern-payout-actions">
                        <button type="button" className="btn-modern-cancel" onClick={onClose}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className="btn-modern-submit" disabled={loading || netAmount < 50000}>
                            {loading ? (
                                <>
                                    <div className="spinner-small"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Gửi yêu cầu rút {formatPrice(netAmount)}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModernPayoutRequest;
