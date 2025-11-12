// landinghub-backend/src/routes/coze.js  <-- SỬA FILE NÀY

const express = require('express');
const router = express.Router();

// Định nghĩa route: GET /api/coze/auth
// Route này sẽ đọc token từ biến môi trường và trả về cho client
router.get('/auth', (req, res) => {
    try {
        const cozePatToken = process.env.COZE_PAT;

        if (!cozePatToken) {
            console.error('COZE_PAT is not defined in .env file');
            return res.status(500).json({ error: 'Chat configuration error on server.' });
        }

        // Chỉ trả về token
        res.status(200).json({ token: cozePatToken });

    } catch (error) {
        console.error('Error in /api/coze/auth:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;