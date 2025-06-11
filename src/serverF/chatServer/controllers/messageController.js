// controllers/messageController.js
const db = require("../db");
const multer = require("multer");
const path = require("path");

// ✅ 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const cleaned = file.originalname.trim().replace(/\s+/g, "_");
    const uniqueName = Date.now() + "-" + cleaned;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
exports.uploadMiddleware = upload.single("file");

// ✅ 메시지 저장
exports.saveMessage = async (req, res) => {

  console.log("📦 req.body:", req.body);
  console.log("📁 req.file:", req.file);

  const file = req.file;

  // 🔐 content 기본값 처리
  const rawContent = req.body.content;
  const content = typeof rawContent === "string" && rawContent.trim() !== "" ? rawContent.trim() : "[파일]";

  const sender_username = req.body.sender_username;
  const receiver_username = req.body.receiver_username;
  const receiver_name = req.body.receiver_name;

  // ✅ 필수 필드 검사
  if (!sender_username || !receiver_username || !receiver_name) {
    return res.status(400).json({ message: "필수 정보 누락" });
  }

  try {
    const fileUrl = file ? `/uploads/${file.filename}` : null;
    const fileName = file?.originalname?.trim().replace(/\s+/g, "_") || null;

    await db.query(
      `INSERT INTO messages (sender_username, receiver_username, receiver_name, content, file_url, file_name) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sender_username,
        receiver_username,
        receiver_name,
        content,
        fileUrl,
        fileName,
      ]
    );

    const message = {
      sender_username,
      receiver_username,
      receiver_name,
      content,
      file: file?.filename || null,
      file_name: fileName,
      fileUrl: file ? `${req.protocol}://${req.get("host")}/uploads/${file.filename}` : null,
      time: new Date().toISOString(),
      read: false,
    };

    res.status(200).json(message);
  } catch (err) {
    console.error("❌ 메시지 저장 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
};

// ✅ 메시지 조회
exports.getMessages = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM messages ORDER BY time");
    res.status(200).json(rows);
  } catch (err) {
    console.error("❌ 메시지 조회 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
};
