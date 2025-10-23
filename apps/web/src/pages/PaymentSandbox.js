import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/PaymentSandbox.css';

const PaymentSandbox = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const transaction_id = searchParams.get('transaction_id');

    useEffect(() => {
        if (transaction_id) {
            loadTransaction();
        }
    }, [transaction_id]);

    const loadTransaction = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/payment/transaction/${transaction_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setTransaction(response.data.data);
        } catch (err) {
            console.error('Lỗi tải transaction:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (success) => {
        try {
            setLoading(true);

            const response = await axios.post(
                `${API_BASE_URL}/api/payment/sandbox/confirm`,
                {
                    transaction_id: transaction_id,
                    success: success
                }
            );

            if (response.data.success) {
                navigate(`/payment/result?transaction_id=${transaction_id}&status=${success ? 'success' : 'failed'}`);
            }
        } catch (err) {
            console.error('Lỗi xác nhận thanh toán:', err);
            alert('Có lỗi xảy ra khi xác nhận thanh toán');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !transaction) {
        return (
            <div className="sandbox-container">
                <div className="sandbox-loading">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin giao dịch...</p>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="sandbox-container">
            <div className="sandbox-card">
                <div className="sandbox-header">
                    <h1>💳 Sandbox Payment Gateway</h1>
                    <p>Môi trường test thanh toán - Không thực hiện giao dịch thật</p>
                </div>

                <div className="sandbox-body">
                    <div className="transaction-info">
                        <h2>Thông tin giao dịch</h2>
                        <div className="info-row">
                            <span className="label">Mã giao dịch:</span>
                            <span className="value">{transaction._id}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Landing Page:</span>
                            <span className="value">{transaction.marketplace_page_id?.title}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Người bán:</span>
                            <span className="value">{transaction.seller_id?.name}</span>
                        </div>
                        <div className="info-row highlight">
                            <span className="label">Số tiền:</span>
                            <span className="value">{formatPrice(transaction.amount)}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Phí platform (10%):</span>
                            <span className="value">{formatPrice(transaction.platform_fee)}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Người bán nhận:</span>
                            <span className="value">{formatPrice(transaction.seller_amount)}</span>
                        </div>
                    </div>

                    <div className="payment-actions">
                        <h3>Xác nhận thanh toán</h3>
                        <p>Chọn kết quả để test payment flow:</p>

                        <div className="action-buttons">
                            <button
                                className="btn-success"
                                onClick={() => handleConfirmPayment(true)}
                                disabled={loading}
                            >
                                ✅ Thanh toán thành công
                            </button>
                            <button
                                className="btn-fail"
                                onClick={() => handleConfirmPayment(false)}
                                disabled={loading}
                            >
                                ❌ Thanh toán thất bại
                            </button>
                        </div>
                    </div>

                    <div className="sandbox-notice">
                        <h4>⚠️ Lưu ý</h4>
                        <ul>
                            <li>Đây là môi trường test, không có giao dịch thật diễn ra</li>
                            <li>Bạn có thể test cả trường hợp thành công và thất bại</li>
                            <li>Dữ liệu sẽ được lưu vào database giống như giao dịch thật</li>
                            <li>Để test MOMO/VNPay thật, cần cấu hình merchant account</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSandbox;