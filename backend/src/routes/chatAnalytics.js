/**
 * Chat Analytics API Routes
 * Provides data for admin dashboard charts and trend analysis
 */

const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const Page = require('../models/Page');
const MarketplacePage = require('../models/MarketplacePage');
const Transaction = require('../models/Transaction');

/**
 * GET /api/chat-analytics/trends
 * Chat volume and response time trends over the last 30 days
 */
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Chat volume by day
    const chatVolume = await ChatRoom.aggregate([
      {
        $match: {
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          totalChats: { $sum: 1 },
          openChats: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          resolvedChats: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: chatVolume
    });
  } catch (error) {
    console.error('Error fetching chat trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat-analytics/marketplace-trends
 * Marketplace sales and category trends
 */
router.get('/marketplace-trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Sales by category
    const categoryStats = await MarketplacePage.aggregate([
      {
        $match: { status: 'ACTIVE' }
      },
      {
        $group: {
          _id: '$category',
          totalSales: { $sum: '$sold_count' },
          totalViews: { $sum: '$views' },
          pageCount: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);

    // Top templates
    const topTemplates = await MarketplacePage.find({ status: 'ACTIVE' })
      .sort({ sold_count: -1 })
      .limit(10)
      .select('title category price sold_count views rating')
      .lean();

    res.json({
      success: true,
      data: {
        categoryStats,
        topTemplates
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/chat-analytics/summary
 * Overview stats for admin dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayChats, openChats, todayMessages, totalUsers] = await Promise.all([
      ChatRoom.countDocuments({ created_at: { $gte: today } }),
      ChatRoom.countDocuments({ status: { $in: ['open', 'assigned'] } }),
      ChatMessage.countDocuments({ created_at: { $gte: today } }),
      ChatRoom.distinct('user_id').then(users => users.length)
    ]);

    res.json({
      success: true,
      data: {
        todayChats,
        openChats,
        todayMessages,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
