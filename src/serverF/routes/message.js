// routes/message.js
const express = require("express");
const pool = require("../DB.js");

const router = express.Router();

// ✅ 모든 메시지 가져오기
router.get("/", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const messages = await conn.query("SELECT * FROM messages ORDER BY time ASC");
    res.json(messages);
  } catch (err) {
    console.error("❌ 메시지 불러오기 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 메시지 저장
router.post("/", async (req, res) => {
  const { sender_username, receiver_username, sender_name, content } = req.body;
  if (!sender_username || !receiver_username || !sender_name || !content) {
    return res.status(400).json({ message: "필수 정보 누락" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const time = new Date().toISOString();
    await conn.query(
      "INSERT INTO messages (sender_username, receiver_username, sender_name, content, time) VALUES (?, ?, ?, ?, ?)",
      [sender_username, receiver_username, sender_name, content, time]
    );
    res.status(201).json({ message: "메시지 저장 완료" });
  } catch (err) {
    console.error("❌ 메시지 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
