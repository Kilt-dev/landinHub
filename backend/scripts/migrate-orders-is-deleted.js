/**
 * Migration script to add is_deleted field to existing orders
 * Run this script once to update all existing orders in the database
 *
 * Usage: node scripts/migrate-orders-is-deleted.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/landing-hub';

async function migrateOrders() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const ordersCollection = db.collection('orders');

        // Count total orders
        const totalOrders = await ordersCollection.countDocuments({});
        console.log(`📊 Total orders in database: ${totalOrders}`);

        // Count orders without is_deleted field
        const ordersWithoutField = await ordersCollection.countDocuments({
            is_deleted: { $exists: false }
        });
        console.log(`📝 Orders without is_deleted field: ${ordersWithoutField}`);

        if (ordersWithoutField === 0) {
            console.log('✅ All orders already have is_deleted field. No migration needed.');
            await mongoose.connection.close();
            return;
        }

        // Update all orders without is_deleted field
        console.log('🔄 Updating orders...');
        const result = await ordersCollection.updateMany(
            { is_deleted: { $exists: false } },
            { $set: { is_deleted: false } }
        );

        console.log(`✅ Migration completed!`);
        console.log(`   - Matched: ${result.matchedCount} orders`);
        console.log(`   - Modified: ${result.modifiedCount} orders`);

        // Verify the migration
        const remainingWithoutField = await ordersCollection.countDocuments({
            is_deleted: { $exists: false }
        });
        console.log(`📊 Orders still without is_deleted field: ${remainingWithoutField}`);

        const ordersWithFieldTrue = await ordersCollection.countDocuments({
            is_deleted: true
        });
        const ordersWithFieldFalse = await ordersCollection.countDocuments({
            is_deleted: false
        });
        console.log(`📊 Orders with is_deleted=false: ${ordersWithFieldFalse}`);
        console.log(`📊 Orders with is_deleted=true: ${ordersWithFieldTrue}`);

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        console.log('✅ Migration successful!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateOrders();
