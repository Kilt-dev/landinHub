/**
 * Sandbox Payment Service
 * Dùng để test payment flow mà không cần tích hợp thật với gateway
 */

class SandboxService {
    constructor() {
        this.pendingPayments = new Map();
    }

    /**
     * Tạo payment request (giả lập)
     */
    async createPayment({
                            orderId,
                            amount,
                            orderInfo,
                            extraData = {}
                        }) {
        try {
            // Lưu payment vào memory
            this.pendingPayments.set(orderId, {
                orderId,
                amount,
                orderInfo,
                extraData,
                status: 'PENDING',
                createdAt: new Date()
            });

            // Giả lập payment URL với sandbox endpoint
            const paymentUrl = `http://localhost:3000/sandbox/payment?orderId=${orderId}&amount=${amount}`;

            console.log('Sandbox Payment Created:', {
                orderId,
                amount,
                orderInfo,
                paymentUrl
            });

            return {
                success: true,
                paymentUrl: paymentUrl,
                orderId: orderId,
                qrCodeUrl: `http://localhost:3000/sandbox/qr?orderId=${orderId}`,
                message: 'Sandbox payment created successfully'
            };
        } catch (error) {
            console.error('Sandbox Payment Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Xác nhận thanh toán (giả lập)
     */
    async confirmPayment(orderId, success = true) {
        try {
            const payment = this.pendingPayments.get(orderId);

            if (!payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            if (success) {
                payment.status = 'COMPLETED';
                payment.transactionId = `SANDBOX_${orderId}_${Date.now()}`;
                payment.completedAt = new Date();
            } else {
                payment.status = 'FAILED';
                payment.failedAt = new Date();
            }

            this.pendingPayments.set(orderId, payment);

            console.log('Sandbox Payment Confirmed:', {
                orderId,
                status: payment.status,
                transactionId: payment.transactionId
            });

            return {
                success: true,
                data: {
                    orderId: payment.orderId,
                    transactionId: payment.transactionId,
                    amount: payment.amount,
                    status: payment.status,
                    resultCode: success ? 0 : 1,
                    message: success ? 'Payment successful' : 'Payment failed'
                }
            };
        } catch (error) {
            console.error('Sandbox Confirm Payment Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify IPN callback (giả lập)
     */
    verifyIPN(data) {
        try {
            const {
                orderId,
                transactionId,
                amount,
                resultCode
            } = data;

            const payment = this.pendingPayments.get(orderId);

            if (!payment) {
                return {
                    valid: false,
                    error: 'Payment not found'
                };
            }

            // Sandbox luôn valid
            return {
                valid: true,
                data: {
                    orderId,
                    transactionId,
                    amount,
                    resultCode,
                    message: resultCode === 0 ? 'Success' : 'Failed'
                }
            };
        } catch (error) {
            console.error('Sandbox IPN Verification Error:', error.message);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Kiểm tra trạng thái giao dịch
     */
    async queryTransaction(orderId) {
        try {
            const payment = this.pendingPayments.get(orderId);

            if (!payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            return {
                success: true,
                data: {
                    orderId: payment.orderId,
                    amount: payment.amount,
                    status: payment.status,
                    transactionId: payment.transactionId,
                    createdAt: payment.createdAt,
                    completedAt: payment.completedAt
                }
            };
        } catch (error) {
            console.error('Sandbox Query Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Hoàn tiền (giả lập)
     */
    async refund({
                     orderId,
                     amount,
                     description = 'Refund'
                 }) {
        try {
            const payment = this.pendingPayments.get(orderId);

            if (!payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            if (payment.status !== 'COMPLETED') {
                return {
                    success: false,
                    error: 'Can only refund completed payments'
                };
            }

            payment.status = 'REFUNDED';
            payment.refundedAt = new Date();
            payment.refundAmount = amount;
            payment.refundDescription = description;

            this.pendingPayments.set(orderId, payment);

            const refundTransactionId = `SANDBOX_REFUND_${orderId}_${Date.now()}`;

            console.log('Sandbox Refund Processed:', {
                orderId,
                refundAmount: amount,
                refundTransactionId
            });

            return {
                success: true,
                data: {
                    orderId,
                    refundAmount: amount,
                    refundTransactionId,
                    message: 'Refund successful'
                },
                refundRequestId: refundTransactionId
            };
        } catch (error) {
            console.error('Sandbox Refund Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all pending payments (for debugging)
     */
    getPendingPayments() {
        return Array.from(this.pendingPayments.values());
    }

    /**
     * Clear payment from memory
     */
    clearPayment(orderId) {
        this.pendingPayments.delete(orderId);
    }

    /**
     * Clear all payments
     */
    clearAllPayments() {
        this.pendingPayments.clear();
    }
}

module.exports = new SandboxService();