const Transaction = require('../models/Transaction');

module.exports = async function cleanupPendingTx() {
    const deleted = await Transaction.cleanupPending();
    console.log(`[CRON] Deleted ${deleted} expired PENDING transactions`);
};