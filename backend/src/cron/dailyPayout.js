const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const BankAccount = require('../models/BankAccount');
const { sendPayoutCreated } = require('../services/email');
const { v4: uuidv4 } = require('uuid');

module.exports = async function dailyPayout() {
    const agg = await Transaction.aggregate([
        { $match: { status: 'COMPLETED', payout_status: 'PENDING' } },
        {
            $group: {
                _id: '$seller_id',
                amount: { $sum: '$seller_amount' },
                txIds: { $push: '$_id' }
            }
        }
    ]);

    for (const row of agg) {
        const bank = await BankAccount.getDefault(row._id);
        if (!bank) continue;

        const payout = await Payout.create({
            _id: uuidv4(),
            seller_id: row._id,
            amount: row.amount,
            transaction_ids: row.txIds,
            bank_account_id: bank._id,
            bank_info: {
                bank_name: bank.bankName,
                account_number: bank.accountNumber,
                account_name: bank.accountName,
                bank_code: bank.bankCode
            }
        });

        await Transaction.updateMany(
            { _id: { $in: row.txIds } },
            { payout_status: 'PROCESSING', payout_id: payout._id }
        );

        sendPayoutCreated(payout);
        global._io?.to(`user_${row._id}`).emit('new_notification', {
            title: 'Khoản thu nhập mới',
            message: `Bạn có khoản rút ${row.amount.toLocaleString('vi-VN')}đ đang chờ xử lý.`,
            createdAt: new Date()
        });
    }
};