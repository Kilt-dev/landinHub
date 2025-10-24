const mongoose = require('mongoose');
const Payout = require('../models/Payout');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * SELLER: Tạo yêu cầu rút tiền
 */
exports.requestPayout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bank_name, account_number, account_name, notes } = req.body;

        // Kiểm tra thông tin ngân hàng
        if (!bank_name || !account_number || !account_name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin ngân hàng'
            });
        }

        // Tính số tiền chờ rút
        const pendingTransactions = await Transaction.find({
            seller_id: userId,
            status: 'COMPLETED',
            payout_status: { $ne: 'COMPLETED' }
        });

        if (pendingTransactions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa có giao dịch nào để rút tiền'
            });
        }

        const totalAmount = pendingTransactions.reduce((sum, txn) => sum + txn.seller_amount, 0);

        // Tạo payout request
        const payout = new Payout({
            seller_id: userId,
            amount: totalAmount,
            transaction_ids: pendingTransactions.map(txn => txn._id),
            bank_info: {
                bank_name,
                account_number,
                account_name
            },
            notes: notes || '',
            status: 'PENDING'
        });

        await payout.save();

        // Cập nhật transaction status
        await Transaction.updateMany(
            { _id: { $in: pendingTransactions.map(txn => txn._id) } },
            { $set: { payout_status: 'PROCESSING', payout_id: payout._id } }
        );

        res.json({
            success: true,
            message: 'Yêu cầu rút tiền đã được gửi. Admin sẽ xử lý trong thời gian sớm nhất.',
            data: payout
        });
    } catch (error) {
        console.error('Request Payout Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * SELLER: Lấy lịch sử rút tiền của mình
 */
exports.getMyPayouts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        let query = { seller_id: userId };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const payouts = await Payout.find(query)
            .populate('processed_by', 'name email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(query);

        res.json({
            success: true,
            data: payouts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get My Payouts Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ADMIN: Lấy tất cả yêu cầu rút tiền
 */
exports.getAllPayouts = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const payouts = await Payout.find(query)
            .populate('seller_id', 'name email')
            .populate('processed_by', 'name email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payout.countDocuments(query);

        // Thống kê
        const stats = {
            pending: await Payout.countDocuments({ status: 'PENDING' }),
            processing: await Payout.countDocuments({ status: 'PROCESSING' }),
            completed: await Payout.countDocuments({ status: 'COMPLETED' }),
            failed: await Payout.countDocuments({ status: 'FAILED' })
        };

        res.json({
            success: true,
            data: payouts,
            stats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Payouts Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ADMIN: Duyệt yêu cầu rút tiền
 */
exports.approvePayout = async (req, res) => {
    try {
        const { id } = req.params;
        const { proof_url, notes } = req.body;
        const adminId = req.user.id;

        const payout = await Payout.findById(id);

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này không thể duyệt'
            });
        }

        await payout.markAsCompleted(adminId, proof_url, notes);

        res.json({
            success: true,
            message: 'Đã duyệt yêu cầu rút tiền',
            data: payout
        });
    } catch (error) {
        console.error('Approve Payout Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ADMIN: Từ chối yêu cầu rút tiền
 */
exports.rejectPayout = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const payout = await Payout.findById(id);

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu rút tiền'
            });
        }

        if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu này không thể từ chối'
            });
        }

        await payout.markAsFailed(reason);

        // Reset payout status của các transactions
        await Transaction.updateMany(
            { _id: { $in: payout.transaction_ids } },
            { $set: { payout_status: 'PENDING', payout_id: null } }
        );

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu rút tiền',
            data: payout
        });
    } catch (error) {
        console.error('Reject Payout Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ADMIN: Lấy thống kê payout
 */
exports.getPayoutStats = async (req, res) => {
    try {
        const totalPending = await Payout.aggregate([
            { $match: { status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalProcessing = await Payout.aggregate([
            { $match: { status: 'PROCESSING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalCompleted = await Payout.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            data: {
                pending: {
                    count: await Payout.countDocuments({ status: 'PENDING' }),
                    amount: totalPending[0]?.total || 0
                },
                processing: {
                    count: await Payout.countDocuments({ status: 'PROCESSING' }),
                    amount: totalProcessing[0]?.total || 0
                },
                completed: {
                    count: await Payout.countDocuments({ status: 'COMPLETED' }),
                    amount: totalCompleted[0]?.total || 0
                },
                failed: {
                    count: await Payout.countDocuments({ status: 'FAILED' }),
                    amount: 0
                }
            }
        });
    } catch (error) {
        console.error('Get Payout Stats Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;