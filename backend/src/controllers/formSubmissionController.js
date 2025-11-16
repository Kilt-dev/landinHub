const FormSubmission = require('../models/FormSubmission');
const Page = require('../models/Page');
const { Parser } = require('json2csv');

/**
 * FormSubmission Controller
 * Handles all form submission operations similar to LadiPage
 */

/**
 * Helper function to build published URL from page data
 * @param {Object} page - Page object
 * @returns {string|null} - Published URL
 */
const buildPublishedUrl = (page) => {
    // Priority: cloudfrontDomain > url.landinghub.shop
    if (page.cloudfrontDomain) {
        return `https://${page.cloudfrontDomain}`;
    }
    if (page.url) {
        return `https://${page.url}.landinghub.shop`;
    }
    return null;
};

/**
 * Submit a form (called by end users from landing pages)
 * POST /api/forms/submit
 */
exports.submitForm = async (req, res) => {
    try {
        const { page_id, form_id, form_data, metadata: clientMetadata } = req.body;

        if (!page_id || !form_id || !form_data) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: page_id, form_id, form_data'
            });
        }

        // Try to get page info to find owner (but don't fail if page not found)
        let user_id = null;
        try {
            const page = await Page.findById(page_id).select('user_id').lean();
            if (page) {
                user_id = page.user_id;
            }
        } catch (pageError) {
            console.warn('Could not fetch page info:', pageError.message);
            // Continue anyway - we'll store the submission without user_id for now
        }

        // Merge metadata from request body and headers
        const metadata = {
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent'),
            referrer: req.get('referer'),
            language: req.get('accept-language')?.split(',')[0],
            // Metadata from client (includes UTM params, device type, screen resolution)
            ...(clientMetadata || {}),
            // Backward compatibility - check root level too
            utm_source: clientMetadata?.utm_source || req.body.utm_source,
            utm_medium: clientMetadata?.utm_medium || req.body.utm_medium,
            utm_campaign: clientMetadata?.utm_campaign || req.body.utm_campaign,
            utm_term: clientMetadata?.utm_term || req.body.utm_term,
            utm_content: clientMetadata?.utm_content || req.body.utm_content,
            device_type: clientMetadata?.device_type || req.body.device_type || 'unknown',
            screen_resolution: clientMetadata?.screen_resolution || req.body.screen_resolution
        };

        // Create submission (user_id might be null if page fetch failed)
        const submission = new FormSubmission({
            page_id,
            form_id,
            user_id: user_id || null, // null if page not found (public submission)
            form_data,
            metadata
        });

        await submission.save();

        // TODO: Trigger integrations (email, webhook, Google Sheets, etc.)
        // This will be implemented in the integration service

        res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            submission_id: submission._id
        });

    } catch (error) {
        console.error('Form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting form',
            error: error.message
        });
    }
};

/**
 * Get all submissions for a page
 * GET /api/forms/submissions/:pageId
 */
exports.getPageSubmissions = async (req, res) => {
    try {
        const { pageId } = req.params;
        const { status, limit = 50, offset = 0, sort = '-submitted_at' } = req.query;

        // Verify page ownership
        const page = await Page.findById(pageId);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (page.user_id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Build filter
        const filter = { page_id: pageId };
        if (status) {
            filter.status = status;
        }

        // Get submissions with page info
        const submissions = await FormSubmission.find(filter)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .lean(); // Use lean for better performance

        // Attach page info to each submission
        const submissionsWithPageInfo = submissions.map(sub => ({
            ...sub,
            page_name: page.name || 'Untitled Page',
            page_url: page.url || null,
            page_published_url: buildPublishedUrl(page)
        }));

        const total = await FormSubmission.countDocuments(filter);

        // Get stats
        const stats = await FormSubmission.getPageStats(pageId);

        res.json({
            success: true,
            submissions: submissionsWithPageInfo,
            page: {
                id: page._id,
                name: page.name || 'Untitled Page',
                url: page.url,
                published_url: buildPublishedUrl(page)
            },
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + parseInt(limit)
            },
            stats
        });

    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

/**
 * Get all submissions for current user (across all pages)
 * GET /api/forms/submissions
 */
exports.getUserSubmissions = async (req, res) => {
    try {
        const { status, limit = 50, offset = 0, sort = '-submitted_at' } = req.query;

        const filter = { user_id: req.userId };
        if (status) {
            filter.status = status;
        }

        const submissions = await FormSubmission.find(filter)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .lean();

        // Get unique page IDs
        const pageIds = [...new Set(submissions.map(s => s.page_id).filter(Boolean))];

        // Fetch page info for all pages
        const pages = await Page.find({ _id: { $in: pageIds } })
            .select('_id name url cloudfrontDomain')
            .lean();

        // Create page lookup map
        const pageMap = {};
        pages.forEach(page => {
            pageMap[page._id.toString()] = {
                name: page.name || 'Untitled Page',
                url: page.url,
                published_url: buildPublishedUrl(page)
            };
        });

        // Attach page info to submissions
        const submissionsWithPageInfo = submissions.map(sub => {
            const pageId = sub.page_id ? sub.page_id.toString() : null;
            const pageInfo = pageId ? pageMap[pageId] : null;

            return {
                ...sub,
                page_name: pageInfo?.name || 'Unknown Page',
                page_url: pageInfo?.url || null,
                page_published_url: pageInfo?.published_url || null
            };
        });

        const total = await FormSubmission.countDocuments(filter);

        res.json({
            success: true,
            submissions: submissionsWithPageInfo,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get user submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

/**
 * Get a single submission
 * GET /api/forms/submission/:id
 */
exports.getSubmission = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await FormSubmission.findById(id)
            .populate('page_id', 'name url');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Verify ownership
        if (submission.user_id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Auto-mark as read if it was new
        if (submission.status === 'new') {
            submission.status = 'read';
            await submission.save();
        }

        res.json({
            success: true,
            submission
        });

    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

/**
 * Update submission status
 * PATCH /api/forms/submission/:id
 */
exports.updateSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tags, notes } = req.body;

        const submission = await FormSubmission.findById(id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Verify ownership
        if (submission.user_id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Update fields
        if (status) submission.status = status;
        if (tags) submission.tags = tags;
        if (notes !== undefined) submission.notes = notes;

        await submission.save();

        res.json({
            success: true,
            message: 'Submission updated successfully',
            submission
        });

    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating submission',
            error: error.message
        });
    }
};

/**
 * Delete submission(s)
 * DELETE /api/forms/submission/:id
 * DELETE /api/forms/submissions (bulk delete with body.ids array)
 */
exports.deleteSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { ids } = req.body;

        if (id) {
            // Single delete
            const submission = await FormSubmission.findById(id);

            if (!submission) {
                return res.status(404).json({
                    success: false,
                    message: 'Submission not found'
                });
            }

            if (submission.user_id.toString() !== req.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            await FormSubmission.deleteOne({ _id: id });

            res.json({
                success: true,
                message: 'Submission deleted successfully'
            });

        } else if (ids && Array.isArray(ids)) {
            // Bulk delete
            const result = await FormSubmission.deleteMany({
                _id: { $in: ids },
                user_id: req.userId
            });

            res.json({
                success: true,
                message: `${result.deletedCount} submissions deleted successfully`,
                deleted_count: result.deletedCount
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'Missing id or ids parameter'
            });
        }

    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting submission',
            error: error.message
        });
    }
};

/**
 * Export submissions to CSV
 * GET /api/forms/export/:pageId
 */
exports.exportSubmissions = async (req, res) => {
    try {
        const { pageId } = req.params;
        const { status, format = 'csv' } = req.query;

        // Verify page ownership
        const page = await Page.findById(pageId);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (page.user_id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Build filter
        const filter = { page_id: pageId };
        if (status) {
            filter.status = status;
        }

        // Export to array
        const data = await FormSubmission.exportToArray(filter);

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No submissions found'
            });
        }

        if (format === 'csv') {
            // Convert to CSV
            const parser = new Parser({ fields: data[0] });
            const csv = parser.parse(data.slice(1).map(row => {
                const obj = {};
                data[0].forEach((header, i) => {
                    obj[header] = row[i];
                });
                return obj;
            }));

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="submissions-${pageId}-${Date.now()}.csv"`);
            res.send(csv);

        } else if (format === 'json') {
            res.json({
                success: true,
                data
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Use csv or json'
            });
        }

    } catch (error) {
        console.error('Export submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting submissions',
            error: error.message
        });
    }
};

/**
 * Get submission statistics
 * GET /api/forms/stats/:pageId
 */
exports.getSubmissionStats = async (req, res) => {
    try {
        const { pageId } = req.params;

        // Verify page ownership
        const page = await Page.findById(pageId);
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (page.user_id.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const stats = await FormSubmission.getPageStats(pageId);

        // Get submissions over time (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const timeline = await FormSubmission.aggregate([
            {
                $match: {
                    page_id: pageId,
                    submitted_at: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$submitted_at' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            stats,
            timeline
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
