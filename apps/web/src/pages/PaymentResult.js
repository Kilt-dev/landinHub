import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/PaymentResult.css';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);
    const [pollCount, setPollCount] = useState(0);
    const pollIntervalRef = useRef(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const transaction_id = searchParams.get('transaction_id');
    const status = searchParams.get('status');

    const MAX_POLL_COUNT = 30; // Poll for max 1 minute (30 * 2 seconds)
    const POLL_INTERVAL = 2000; // Poll every 2 seconds

    useEffect(() => {
        if (transaction_id) {
            loadTransaction();
            // Start polling if status is pending or processing
            startPolling();
        } else {
            setLoading(false);
        }

        // Cleanup on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [transaction_id]);

    const startPolling = () => {
        // Clear existing interval if any
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        // Set up polling interval
        pollIntervalRef.current = setInterval(async () => {
            setPollCount(prev => {
                const newCount = prev + 1;

                // Stop polling after MAX_POLL_COUNT
                if (newCount >= MAX_POLL_COUNT) {
                    stopPolling();
                    return prev;
                }

                return newCount;
            });

            await loadTransaction();
        }, POLL_INTERVAL);
    };

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setPolling(false);
    };

    const loadTransaction = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/payment/transaction/${transaction_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const txn = response.data.data;
            setTransaction(txn);

            // Stop polling if transaction reached final state
            if (txn && (txn.status === 'COMPLETED' || txn.status === 'FAILED' || txn.status === 'CANCELLED')) {
                stopPolling();
            }

            setLoading(false);
        } catch (err) {
            console.error('Lỗi tải transaction:', err);
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading && !transaction) {
        return (
            <div className="result-container">
                <div className="result-loading">
                    <div className="spinner"></div>
                    <p>Đang tải thông tin giao dịch...</p>
                </div>
            </div>
        );
    }

    // Show polling status if transaction is still processing
    const isProcessing = transaction && (transaction.status === 'PENDING' || transaction.status === 'PROCESSING');
    const isSuccess = transaction?.status === 'COMPLETED';
    const isFailed = transaction && (transaction.status === 'FAILED' || transaction.status === 'CANCELLED');

    return (
        <div className="result-container">
            {isProcessing && polling ? (
                <div className="result-card processing">
                    <div className="result-icon processing-icon">
                        <div className="spinner"></div>
                    </div>
                    <h1>Đang xử lý thanh toán...</h1>
                    <p className="result-message">
                        Vui lòng hoàn tất thanh toán trên ứng dụng MOMO/VNPay.
                        <br />
                        Hệ thống sẽ tự động cập nhật kết quả.
                    </p>

                    {transaction && (
                        <div className="result-details">
                            <div className="detail-row">
                                <span>Mã giao dịch:</span>
                                <span className="detail-value">{transaction._id}</span>
                            </div>
                            <div className="detail-row">
                                <span>Số tiền:</span>
                                <span className="detail-value">{formatPrice(transaction.amount)}</span>
                            </div>
                            <div className="detail-row">
                                <span>Phương thức:</span>
                                <span className="detail-value">{transaction.payment_method}</span>
                            </div>
                            <div className="detail-row">
                                <span>Trạng thái:</span>
                                <span className="detail-value processing-text">
                                    ⏳ {transaction.status}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="polling-info" style={{ marginTop: '20px', fontSize: '0.875rem', color: '#6b7280' }}>
                        <p>Đang kiểm tra kết quả thanh toán... ({pollCount}/{MAX_POLL_COUNT})</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                            💡 Tip: Sau khi thanh toán xong, trang sẽ tự động cập nhật trong vài giây
                        </p>
                    </div>
                </div>
            ) : (
                <div className={`result-card ${isSuccess ? 'success' : 'failed'}`}>
                    {isSuccess ? (
                        <>
                            <div className="result-icon success-icon">✅</div>
                            <h1>Thanh toán thành công!</h1>
                            <p className="result-message">
                                Cảm ơn bạn đã mua landing page. Giao dịch đã được xử lý thành công.
                            </p>

                            {transaction && (
                                <div className="result-details">
                                    <h3>Chi tiết giao dịch</h3>
                                    <div className="detail-row">
                                        <span>Mã giao dịch:</span>
                                        <span className="detail-value">{transaction._id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Landing Page:</span>
                                        <span className="detail-value">{transaction.marketplace_page_id?.title}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Số tiền:</span>
                                        <span className="detail-value">{formatPrice(transaction.amount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Phương thức:</span>
                                        <span className="detail-value">{transaction.payment_method}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Trạng thái:</span>
                                        <span className="detail-value success-text">Hoàn thành</span>
                                    </div>
                                </div>
                            )}

                            <div className="result-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/pages')}
                                >
                                    📄 Xem landing page của tôi
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/marketplace')}
                                >
                                    🏪 Tiếp tục mua sắm
                                </button>
                            </div>
                        </>
                    ) : isProcessing && !polling ? (
                        <>
                            <div className="result-icon processing-icon">⏰</div>
                            <h1>Chờ xác nhận thanh toán</h1>
                            <p className="result-message">
                                Giao dịch đang chờ xác nhận từ cổng thanh toán.
                                <br />
                                Nếu bạn đã thanh toán xong, vui lòng đợi hoặc làm mới trang.
                            </p>

                            {transaction && (
                                <div className="result-details">
                                    <h3>Thông tin giao dịch</h3>
                                    <div className="detail-row">
                                        <span>Mã giao dịch:</span>
                                        <span className="detail-value">{transaction._id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Trạng thái:</span>
                                        <span className="detail-value processing-text">
                                        ⏳ {transaction.status}
                                    </span>
                                    </div>
                                </div>
                            )}

                            <div className="result-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        setLoading(true);
                                        setPollCount(0);
                                        setPolling(true);
                                        startPolling();
                                        loadTransaction();
                                    }}
                                >
                                    🔄 Kiểm tra lại
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/payments')}
                                >
                                    📄 Xem lịch sử giao dịch
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="result-icon failed-icon">❌</div>
                            <h1>Thanh toán thất bại</h1>
                            <p className="result-message">
                                Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại.
                            </p>

                            {transaction && (
                                <div className="result-details">
                                    <h3>Thông tin giao dịch</h3>
                                    <div className="detail-row">
                                        <span>Mã giao dịch:</span>
                                        <span className="detail-value">{transaction._id}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Trạng thái:</span>
                                        <span className="detail-value failed-text">{transaction.status}</span>
                                    </div>
                                </div>
                            )}

                            <div className="result-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => transaction && navigate(`/marketplace/${transaction.marketplace_page_id._id}`)}
                                >
                                    🔄 Thử lại
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/marketplace')}
                                >
                                    🏪 Quay lại Marketplace
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaymentResult;