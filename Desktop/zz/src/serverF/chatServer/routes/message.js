// routes/message.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// ✅ 파일 업로드 미들웨어 포함
router.post('/', messageController.uploadMiddleware, messageController.saveMessage);

// ✅ 메시지 조회는 그대로 사용
router.get('/', messageController.getMessages);

module.exports = router;