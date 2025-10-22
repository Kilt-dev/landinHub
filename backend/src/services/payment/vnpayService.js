const crypto = require('crypto');
const qs = require('qs');
require('dotenv').config();
class VNPayService {
    constructor() {
        this.tmnCode = process.env.VNPAY_TMN_CODE || 'VNPAY_TMN_CODE';
        this.secretKey = process.env.VNPAY_SECRET_KEY || 'VNPAY_SECRET_KEY';
        this.url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/callback';
        this.apiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    }

    /**
     * Sắp xếp object theo key (alphabetically)
     */
    sortObject(obj) {
        const sorted = {};
        const keys = Object.keys(obj).sort();
        keys.forEach(key => {
            sorted[key] = obj[key];
        });
        return sorted;
    }

    /**
     * Tạo chữ ký SHA256
     */
    createSignature(data) {
        const hmac = crypto.createHmac('sha512', this.secretKey);
        return hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
    }

    /**
     * Tạo payment URL
     */
    createPaymentUrl({
                         orderId,
                         amount,
                         orderInfo,
                         orderType = 'other',
                         ipAddr,
                         bankCode = '',
                         locale = 'vn'
                     }) {
        try {
            // Kiểm tra credentials
            if (!this.tmnCode || !this.secretKey || this.tmnCode === 'VNPAY_TMN_CODE' || this.secretKey === 'VNPAY_SECRET_KEY') {
                console.warn('⚠️ VNPay credentials not configured. Please set VNPAY_TMN_CODE and VNPAY_SECRET_KEY in .env');
                return {
                    success: false,
                    error: 'VNPay chưa được cấu hình. Vui lòng liên hệ admin để thiết lập.'
                };
            }

            const date = new Date();
            const createDate = this.formatDate(date);
            const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // 15 minutes

            let vnpParams = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: this.tmnCode,
                vnp_Locale: locale,
                vnp_CurrCode: 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: orderType,
                vnp_Amount: amount * 100, // VNPay requires amount * 100
                vnp_ReturnUrl: this.returnUrl,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate,
                vnp_ExpireDate: expireDate
            };

            if (bankCode) {
                vnpParams.vnp_BankCode = bankCode;
            }

            // Sắp xếp params
            vnpParams = this.sortObject(vnpParams);

            // Tạo query string
            const signData = qs.stringify(vnpParams, { encode: false });
            const secureHash = this.createSignature(signData);

            vnpParams.vnp_SecureHash = secureHash;

            const paymentUrl = `${this.url}?${qs.stringify(vnpParams, { encode: false })}`;

            console.log('VNPay Payment URL created:', {
                orderId,
                amount,
                paymentUrl: paymentUrl.substring(0, 100) + '...'
            });

            return {
                success: true,
                paymentUrl: paymentUrl,
                orderId: orderId
            };
        } catch (error) {
            console.error('VNPay Create Payment URL Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify IPN/Return callback từ VNPay
     */
    verifyCallback(vnpParams) {
        try {
            const secureHash = vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHashType;

            // Sắp xếp params
            const sortedParams = this.sortObject(vnpParams);
            const signData = qs.stringify(sortedParams, { encode: false });
            const expectedHash = this.createSignature(signData);

            if (secureHash !== expectedHash) {
                return {
                    valid: false,
                    error: 'Invalid signature'
                };
            }

            // vnp_ResponseCode: 00 = success
            const isSuccess = vnpParams.vnp_ResponseCode === '00';

            return {
                valid: true,
                success: isSuccess,
                data: {
                    orderId: vnpParams.vnp_TxnRef,
                    amount: parseInt(vnpParams.vnp_Amount) / 100,
                    transactionNo: vnpParams.vnp_TransactionNo,
                    responseCode: vnpParams.vnp_ResponseCode,
                    bankCode: vnpParams.vnp_BankCode,
                    cardType: vnpParams.vnp_CardType,
                    payDate: vnpParams.vnp_PayDate,
                    orderInfo: vnpParams.vnp_OrderInfo
                }
            };
        } catch (error) {
            console.error('VNPay Verify Callback Error:', error.message);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Truy vấn giao dịch
     */
    async queryTransaction({
                               orderId,
                               transactionDate,
                               ipAddr
                           }) {
        try {
            const date = new Date();
            const requestId = `${orderId}_query_${date.getTime()}`;
            const createDate = this.formatDate(date);

            let vnpParams = {
                vnp_RequestId: requestId,
                vnp_Version: '2.1.0',
                vnp_Command: 'querydr',
                vnp_TmnCode: this.tmnCode,
                vnp_TxnRef: orderId,
                vnp_OrderInfo: `Query for order ${orderId}`,
                vnp_TransactionDate: transactionDate,
                vnp_CreateDate: createDate,
                vnp_IpAddr: ipAddr
            };

            // Sắp xếp params
            vnpParams = this.sortObject(vnpParams);

            const signData = qs.stringify(vnpParams, { encode: false });
            const secureHash = this.createSignature(signData);

            vnpParams.vnp_SecureHash = secureHash;

            // VNPay API yêu cầu gửi request qua HTTPS với body JSON
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vnpParams)
            });

            const data = await response.json();

            return {
                success: data.vnp_ResponseCode === '00',
                data: data
            };
        } catch (error) {
            console.error('VNPay Query Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Hoàn tiền
     */
    async refund({
                     orderId,
                     amount,
                     transactionNo,
                     transactionDate,
                     refundAmount,
                     ipAddr,
                     user = 'admin'
                 }) {
        try {
            const date = new Date();
            const requestId = `${orderId}_refund_${date.getTime()}`;
            const createDate = this.formatDate(date);
            const transactionType = refundAmount === amount ? '02' : '03'; // 02: full refund, 03: partial refund

            let vnpParams = {
                vnp_RequestId: requestId,
                vnp_Version: '2.1.0',
                vnp_Command: 'refund',
                vnp_TmnCode: this.tmnCode,
                vnp_TransactionType: transactionType,
                vnp_TxnRef: orderId,
                vnp_Amount: refundAmount * 100,
                vnp_OrderInfo: `Refund for order ${orderId}`,
                vnp_TransactionNo: transactionNo,
                vnp_TransactionDate: transactionDate,
                vnp_CreateDate: createDate,
                vnp_CreateBy: user,
                vnp_IpAddr: ipAddr
            };

            // Sắp xếp params
            vnpParams = this.sortObject(vnpParams);

            const signData = qs.stringify(vnpParams, { encode: false });
            const secureHash = this.createSignature(signData);

            vnpParams.vnp_SecureHash = secureHash;

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vnpParams)
            });

            const data = await response.json();

            return {
                success: data.vnp_ResponseCode === '00',
                data: data,
                requestId: requestId
            };
        } catch (error) {
            console.error('VNPay Refund Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Format date to VNPay format: yyyyMMddHHmmss
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
}

module.exports = new VNPayService();