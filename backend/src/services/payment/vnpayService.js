const crypto = require('crypto');
const qs = require('qs');
require('dotenv').config();

const fetch = async (...args) => {
    const module = await import('node-fetch');
    return module.default(...args);
};

class VNPayService {
    constructor() {
        this.tmnCode = process.env.VNPAY_TMN_CODE?.trim() || 'FO2WBXVD';
        this.secretKey = process.env.VNPAY_SECRET_KEY?.trim() || 'PX3R4CM08SNDDIR423S6Y95XIO0USIMB';
        this.url = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        this.returnUrl = process.env.VNPAY_RETURN_URL || 'https://presophomore-adjunctly-margery.ngrok-free.dev/api/payment/vnpay/callback';
        this.ipnUrl = process.env.VNPAY_IPN_URL || 'https://presophomore-adjunctly-margery.ngrok-free.dev/api/payment/vnpay/ipn';
        this.apiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    }

    sortObject(obj) {
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            if (obj[key] !== undefined && obj[key] !== null) {
                sorted[key] = obj[key];
            }
        });
        return sorted;
    }

    normalizeIpAddress(ipAddr) {
        if (!ipAddr || ipAddr.includes('127.0.0.1') || ipAddr === '::1') {
            console.warn('⚠️ VNPay: Localhost IP detected, using public IP');
            return '213.20.212.43';
        }
        if (ipAddr.includes('::ffff:')) {
            return ipAddr.replace('::ffff:', '');
        }
        return ipAddr;
    }

    createSignature(data) {
        const hmac = crypto.createHmac('sha512', this.secretKey);
        const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
        console.log('🔐 VNPay Signature Debug:', {
            data: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
            signature: signed.substring(0, 30) + '...'
        });
        return signed;
    }

    createPaymentUrl({ orderId, amount, orderInfo, orderType = 'other', ipAddr, bankCode = '', locale = 'vn' }) {
        try {
            if (!orderId || !amount || !orderInfo) {
                console.error('❌ VNPay: Missing required fields', { orderId, amount, orderInfo });
                return { success: false, error: 'Missing orderId, amount, or orderInfo' };
            }
            if (isNaN(amount) || amount <= 0) {
                console.error('❌ VNPay: Invalid amount', { amount });
                return { success: false, error: 'Invalid amount' };
            }

            const normalizedIp = this.normalizeIpAddress(ipAddr);
            const date = new Date();
            const createDate = this.formatDate(date);
            const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000));

            // Rút ngắn orderInfo để giảm độ dài URL
            const cleanOrderInfo = orderInfo
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\x00-\x7F]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 50); // Giới hạn 50 ký tự

            let vnpParams = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: this.tmnCode,
                vnp_Amount: Math.round(Number(amount) * 100),
                vnp_CurrCode: 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: cleanOrderInfo,
                vnp_OrderType: orderType,
                vnp_Locale: locale,
                vnp_ReturnUrl: this.returnUrl,
                vnp_IpAddr: normalizedIp,
                vnp_CreateDate: createDate,
                vnp_ExpireDate: expireDate
            };

            if (bankCode) vnpParams.vnp_BankCode = bankCode;

            vnpParams = this.sortObject(vnpParams);
            const signData = qs.stringify(vnpParams, { encode: false });
            const secureHash = this.createSignature(signData);

            vnpParams.vnp_SecureHash = secureHash;
            const paymentUrl = `${this.url}?${qs.stringify(vnpParams, { encode: true })}`;
            console.log('✅ VNPay Payment URL:', { orderId, paymentUrl: paymentUrl.substring(0, 100) + '...', cleanOrderInfo });

            return { success: true, paymentUrl, orderId, cleanOrderInfo };
        } catch (error) {
            console.error('❌ VNPay Create Payment URL Error:', error);
            return { success: false, error: error.message };
        }
    }

    verifyCallback(vnpParams) {
        try {
            if (!vnpParams.vnp_SecureHash || !vnpParams.vnp_TxnRef) {
                console.error('❌ VNPay: Missing secureHash or TxnRef', vnpParams);
                return { valid: false, error: 'Missing secureHash or TxnRef' };
            }

            const secureHash = vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHash;
            delete vnpParams.vnp_SecureHashType;

            // Chỉ lấy các params hợp lệ
            const validParams = [
                'vnp_Amount', 'vnp_BankCode', 'vnp_BankTranNo', 'vnp_CardType',
                'vnp_Command', 'vnp_CreateDate', 'vnp_CurrCode', 'vnp_ExpireDate',
                'vnp_IpAddr', 'vnp_Locale', 'vnp_OrderInfo', 'vnp_OrderType',
                'vnp_PayDate', 'vnp_ResponseCode', 'vnp_ReturnUrl', 'vnp_TmnCode',
                'vnp_TransactionNo', 'vnp_TransactionStatus', 'vnp_TxnRef', 'vnp_Version'
            ];
            const filteredParams = {};
            validParams.forEach(key => {
                if (vnpParams[key] !== undefined && vnpParams[key] !== null) {
                    filteredParams[key] = vnpParams[key];
                }
            });

            // Log orderInfo gốc
            console.log('🔍 VNPay: Raw vnp_OrderInfo:', filteredParams.vnp_OrderInfo);

            // Chuẩn hóa orderInfo
            if (filteredParams.vnp_OrderInfo) {
                filteredParams.vnp_OrderInfo = decodeURIComponent(filteredParams.vnp_OrderInfo.replace(/\+/g, ' '))
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\x00-\x7F]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 50); // Giới hạn 50 ký tự
                console.log('🔍 VNPay: Normalized vnp_OrderInfo:', filteredParams.vnp_OrderInfo);
            }

            const sortedParams = this.sortObject(filteredParams);
            const signData = qs.stringify(sortedParams, { encode: false });
            const expectedHash = this.createSignature(signData);

            console.log('🔍 VNPay Verify Callback/IPN:', {
                receivedHash: secureHash?.substring(0, 30) + '...',
                expectedHash: expectedHash.substring(0, 30) + '...',
                signData: signData.substring(0, 100) + (signData.length > 100 ? '...' : ''),
                params: JSON.stringify(sortedParams, null, 2)
            });

            if (secureHash !== expectedHash) {
                console.error('❌ VNPay Signature Mismatch:', { signData, secureHash });
                return { valid: false, error: 'Invalid signature' };
            }

            return {
                valid: true,
                success: vnpParams.vnp_ResponseCode === '00',
                data: {
                    orderId: vnpParams.vnp_TxnRef,
                    amount: parseInt(vnpParams.vnp_Amount) / 100,
                    transactionNo: vnpParams.vnp_TransactionNo,
                    responseCode: vnpParams.vnp_ResponseCode,
                    bankCode: vnpParams.vnp_BankCode,
                    payDate: vnpParams.vnp_PayDate,
                    orderInfo: vnpParams.vnp_OrderInfo
                }
            };
        } catch (error) {
            console.error('❌ VNPay Verify Callback Error:', error);
            return { valid: false, error: error.message };
        }
    }

    formatDate(date) {
        const pad = num => num.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    }
}

module.exports = new VNPayService();