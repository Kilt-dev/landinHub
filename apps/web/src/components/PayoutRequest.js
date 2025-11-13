import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, DollarSign, Building2, CreditCard, User } from 'lucide-react';
import '../styles/PayoutRequest.css';

const PayoutRequest = ({ isOpen, onClose, pendingAmount, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        account_name: '',
        notes: ''
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const banks = [
        'Vietcombank', 'VietinBank', 'BIDV', 'Agribank', 'ACB', 'Techcombank',
        'MBBank', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'VIB',
        'SHB', 'OCB', 'MSB', 'Eximbank', 'SeABank', 'LienVietPostBank'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.bank_name || !formData.account_number || !formData.account_name) {
            toast.error('Vui lòng điền đầy đủ thông tin ngân hàng');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_BASE_URL}/api/payout/request`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Yêu cầu rút tiền đã được gửi thành công!');
                setFormData({
                    bank_name: '',
                    account_number: '',
                    account_name: '',
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

    if (!isOpen) return null;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="payout-modal-overlay" onClick={onClose}>
            <div className="payout-modal" onClick={(e) => e.stopPropagation()}>
                <div className="payout-modal-header">
                    <h2>Yêu cầu rút tiền</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="payout-amount-display">
                    <div className="amount-label">Số tiền có thể rút:</div>
                    <div className="amount-value">{formatPrice(pendingAmount)}</div>
                    <div className="amount-note">Sau khi trừ phí platform 10%</div>
                </div>

                <form onSubmit={handleSubmit} className="payout-form">
                    <div className="form-group">
                        <label>
                            <Building2 size={18} />
                            Ngân hàng
                        </label>
                        <select
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            required
                        >
                            <option value="">Chọn ngân hàng</option>
                            {banks.map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            <CreditCard size={18} />
                            Số tài khoản
                        </label>
                        <input
                            type="text"
                            value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            placeholder="0123456789"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <User size={18} />
                            Tên chủ tài khoản
                        </label>
                        <input
                            type="text"
                            value={formData.account_name}
                            onChange={(e) => setFormData({ ...formData, account_name: e.target.value.toUpperCase() })}
                            placeholder="NGUYEN VAN A"
                            required
                        />
                        <small>Nhập chính xác theo CMND/CCCD (viết hoa, không dấu)</small>
                    </div>

                    <div className="form-group">
                        <label>
                            <DollarSign size={18} />
                            Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Rút tiền tháng 10/2025..."
                            rows="3"
                        />
                    </div>

                    <div className="payout-info-box">
                        <h4>Lưu ý:</h4>
                        <ul>
                            <li>Kiểm tra kỹ thông tin tài khoản trước khi gửi</li>
                            <li>Admin sẽ xử lý trong vòng 1-3 ngày làm việc</li>
                            <li>Bạn sẽ nhận được thông báo khi yêu cầu được duyệt</li>
                            <li>Phí chuyển khoản (nếu có) sẽ do bạn chịu</li>
                        </ul>
                    </div>

                    <div className="payout-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayoutRequest;