// routes/message.js
const express = require("express");
const router = express.Router();
const messageController = require("../chatServer/controllers/messageController.js");

// ⚠️ 순서 중요: multer 미들웨어 먼저!
router.post("/", messageController.uploadMiddleware, messageController.saveMessage);
router.get("/", messageController.getMessages);

module.exports = router;