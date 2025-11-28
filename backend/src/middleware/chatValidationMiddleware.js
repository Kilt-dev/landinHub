/**
 * Input validation middleware for chat endpoints
 */

/**
 * Validate message sending
 */
exports.validateSendMessage = (req, res, next) => {
    const { message, message_type, attachments } = req.body;

    // Validate message content
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Nội dung tin nhắn không được để trống'
        });
    }

    if (message.length > 10000) {
        return res.status(400).json({
            success: false,
            message: 'Tin nhắn không được vượt quá 10,000 ký tự'
        });
    }

    // Validate message type
    const validTypes = ['text', 'image', 'file', 'system'];
    if (message_type && !validTypes.includes(message_type)) {
        return res.status(400).json({
            success: false,
            message: 'Loại tin nhắn không hợp lệ',
            validTypes
        });
    }

    // Validate attachments
    if (attachments) {
        if (!Array.isArray(attachments)) {
            return res.status(400).json({
                success: false,
                message: 'Attachments phải là một mảng'
            });
        }

        if (attachments.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Không thể gửi quá 10 file đính kèm'
            });
        }

        for (const attachment of attachments) {
            if (!attachment.url || typeof attachment.url !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Mỗi attachment phải có URL hợp lệ'
                });
            }
        }
    }

    next();
};

/**
 * Validate room creation
 */
exports.validateCreateRoom = (req, res, next) => {
    const { context } = req.body;

    if (context && typeof context !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Context phải là một object'
        });
    }

    // Validate context size (prevent abuse)
    if (context && JSON.stringify(context).length > 50000) {
        return res.status(400).json({
            success: false,
            message: 'Context quá lớn'
        });
    }

    next();
};

/**
 * Validate room rating
 */
exports.validateRating = (req, res, next) => {
    const { score, feedback } = req.body;

    // Validate score
    if (!score || typeof score !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Điểm đánh giá là bắt buộc và phải là số'
        });
    }

    if (score < 1 || score > 5) {
        return res.status(400).json({
            success: false,
            message: 'Điểm đánh giá phải từ 1 đến 5'
        });
    }

    // Validate feedback (optional)
    if (feedback && typeof feedback !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Phản hồi phải là chuỗi ký tự'
        });
    }

    if (feedback && feedback.length > 5000) {
        return res.status(400).json({
            success: false,
            message: 'Phản hồi không được vượt quá 5,000 ký tự'
        });
    }

    next();
};

/**
 * Validate room status update
 */
exports.validateStatusUpdate = (req, res, next) => {
    const { status, priority, tags } = req.body;

    // Validate status
    const validStatuses = ['open', 'assigned', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Trạng thái không hợp lệ',
            validStatuses
        });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
            success: false,
            message: 'Độ ưu tiên không hợp lệ',
            validPriorities
        });
    }

    // Validate tags
    if (tags) {
        if (!Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'Tags phải là một mảng'
            });
        }

        if (tags.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Không được vượt quá 20 tags'
            });
        }

        for (const tag of tags) {
            if (typeof tag !== 'string' || tag.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Mỗi tag phải là chuỗi và không quá 50 ký tự'
                });
            }
        }
    }

    next();
};

/**
 * Validate pagination parameters
 */
exports.validatePagination = (req, res, next) => {
    const { limit, skip } = req.query;

    if (limit) {
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
            return res.status(400).json({
                success: false,
                message: 'Limit phải là số từ 1 đến 200'
            });
        }
        req.query.limit = limitNum;
    }

    if (skip) {
        const skipNum = parseInt(skip);
        if (isNaN(skipNum) || skipNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'Skip phải là số không âm'
            });
        }
        req.query.skip = skipNum;
    }

    next();
};